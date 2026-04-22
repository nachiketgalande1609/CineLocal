const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFile } = require("child_process");
const { promisify } = require("util");
const ffprobe = require("@ffprobe-installer/ffprobe");
const chokidar = require("chokidar");
const { metadataCache, configCache } = require("./cache");
const { enrichMovie } = require("./tmdb");

const VIDEO_EXTS = new Set([".mp4", ".mkv", ".avi", ".mov", ".wmv", ".m4v", ".webm"]);
const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", ".cache", "__pycache__"]);
const MIN_DURATION_SECONDS = 30 * 60; // 30 minutes

const execFileAsync = promisify(execFile);

// Bump this when the enriched data shape changes — forces a re-fetch for stale cache entries
const SCHEMA_VERSION = 2;

// In-memory movie list, populated from cache + scan
let movies = {};
let watchers = new Map(); // folderPath → chokidar watcher
let enrichQueue = [];
let isEnriching = false;

function isStale(cached) {
    if (!cached.enriched) return true;
    // Old format stored cast as plain strings; new format stores objects with id/profile/character
    if (cached.cast?.length > 0 && typeof cached.cast[0] === "string") return true;
    // Missing crew/trailers fields introduced in v2
    if (!cached.schemaVersion || cached.schemaVersion < SCHEMA_VERSION) return true;
    return false;
}

function generateId(filePath) {
    return crypto.createHash("md5").update(filePath).digest("hex");
}

function belongsToFolder(filePath, folderPath) {
    const f = path.resolve(filePath).toLowerCase();
    const d = path.resolve(folderPath).toLowerCase();
    return f.startsWith(d + path.sep) || f.startsWith(d + "/");
}

async function getVideoDuration(filePath) {
    try {
        const { stdout } = await execFileAsync(ffprobe.path, [
            "-v", "quiet",
            "-print_format", "json",
            "-show_format",
            filePath,
        ]);
        const duration = parseFloat(JSON.parse(stdout).format?.duration);
        return isNaN(duration) ? null : duration;
    } catch {
        return null;
    }
}

function buildMovie(filePath) {
    const id = generateId(filePath);
    const filename = path.basename(filePath);
    const stat = fs.statSync(filePath);
    return {
        id,
        filename,
        filePath,
        size: stat.size,
        addedAt: new Date().toISOString(),
    };
}

async function processEnrichQueue() {
    if (isEnriching || enrichQueue.length === 0) return;
    isEnriching = true;

    while (enrichQueue.length > 0) {
        const id = enrichQueue.shift();
        if (!movies[id]) continue;

        const movie = movies[id];
        // Skip if already enriched AND up-to-date schema
        if (movie.enriched && !isStale(movie)) continue;

        console.log(`[TMDB] Enriching: ${movie.filename}`);
        try {
            const metadata = await enrichMovie(movie.filename);
            movies[id] = { ...movie, ...metadata };
            metadataCache.update(id, movies[id]);
        } catch (err) {
            if (err.message.includes("TMDB_API_KEY")) {
                console.warn("[TMDB] API key missing — skipping enrichment.");
                enrichQueue = [];
                break;
            }
            console.error(`[TMDB] Failed for ${movie.filename}:`, err.message);
        }

        // Throttle to avoid hitting TMDB rate limits
        await new Promise((r) => setTimeout(r, 300));
    }

    isEnriching = false;
}

async function addFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (!VIDEO_EXTS.has(ext)) return;

    const duration = await getVideoDuration(filePath);
    if (duration !== null && duration < MIN_DURATION_SECONDS) {
        console.log(`[Scanner] Skipping short video (${Math.round(duration / 60)}m): ${path.basename(filePath)}`);
        return;
    }

    const id = generateId(filePath);

    // Check cache first
    const cached = metadataCache.getOne(id);
    if (cached) {
        movies[id] = cached;
        // Re-enrich if stale schema (e.g. cast format changed) or never enriched
        if (isStale(cached) && !enrichQueue.includes(id)) {
            console.log(`[Scanner] Stale cache for ${path.basename(filePath)}, re-enriching…`);
            movies[id] = { ...cached, enriched: false }; // clear flag so queue processes it
            enrichQueue.push(id);
            processEnrichQueue();
        }
        return;
    }

    // New file
    movies[id] = buildMovie(filePath);
    metadataCache.update(id, movies[id]);
    enrichQueue.push(id);
    processEnrichQueue();
}

function removeFile(filePath) {
    const id = generateId(filePath);
    delete movies[id];
    // Remove from cache too
    const cache = metadataCache.get();
    delete cache[id];
    metadataCache.set(cache);
}

function scanFolder(folderPath) {
    if (!fs.existsSync(folderPath)) {
        console.warn(`[Scanner] Folder not found: ${folderPath}`);
        return;
    }

    async function walk(dir) {
        try {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                if (SKIP_DIRS.has(entry.name)) continue;
                const full = path.join(dir, entry.name);
                if (entry.isDirectory() && !entry.isSymbolicLink()) {
                    await walk(full);
                } else if (entry.isFile()) {
                    await addFile(full);
                }
            }
        } catch (err) {
            console.error(`[Scanner] Error scanning ${dir}:`, err.message);
        }
    }

    walk(folderPath);
}

function watchFolder(folderPath) {
    const watcher = chokidar.watch(folderPath, {
        persistent: true,
        ignoreInitial: true,
        depth: 10,
        ignored: /(^|[/\\])(node_modules|\.git|dist|build|\.cache)[/\\]/,
        followSymlinks: false,
    });

    watcher.on("add", (filePath) => {
        console.log(`[Watcher] New file: ${filePath}`);
        addFile(filePath);
    });

    watcher.on("unlink", (filePath) => {
        console.log(`[Watcher] Removed: ${filePath}`);
        removeFile(filePath);
    });

    return watcher;
}

function stopWatchers() {
    for (const watcher of watchers.values()) watcher.close();
    watchers.clear();
}

function removeFolderMovies(folderPath) {
    // Stop the watcher for this specific folder
    const watcher = watchers.get(folderPath);
    if (watcher) {
        watcher.close();
        watchers.delete(folderPath);
    }

    // Remove all movies whose filePath lives inside this folder
    const resolvedFolder = path.resolve(folderPath);
    const cache = metadataCache.get();
    let removed = 0;

    for (const [id, movie] of Object.entries(movies)) {
        if (movie.filePath && belongsToFolder(movie.filePath, folderPath)) {
            delete movies[id];
            delete cache[id];
            removed++;
        }
    }

    metadataCache.set(cache);
    console.log(`[Scanner] Removed ${removed} movies for folder: ${folderPath}`);
    return removed;
}

function purgeDuplicateCacheEntries() {
    const cache = metadataCache.get();
    const before = Object.keys(cache).length;
    for (const [id, entry] of Object.entries(cache)) {
        if (entry.filePath && entry.filePath.includes("node_modules")) {
            delete cache[id];
        }
    }
    const removed = before - Object.keys(cache).length;
    if (removed > 0) {
        console.log(`[Scanner] Purged ${removed} stale duplicate cache entries from node_modules paths.`);
        metadataCache.set(cache);
    }
    return cache;
}

function initScanner() {
    const cache = purgeDuplicateCacheEntries();
    const folders = configCache.getFolders();

    // Only load cached movies that belong to a currently configured folder.
    // Anything else is from a folder the user already removed — drop it.
    let orphaned = 0;
    for (const [id, movie] of Object.entries(cache)) {
        const inConfigured = movie.filePath && folders.some(f => belongsToFolder(movie.filePath, f.path));
        if (inConfigured) {
            movies[id] = movie;
        } else {
            delete cache[id];
            orphaned++;
        }
    }
    if (orphaned > 0) {
        console.log(`[Scanner] Purged ${orphaned} movies from removed folders.`);
        metadataCache.set(cache);
    }

    stopWatchers();
    for (const folder of folders) {
        console.log(`[Scanner] Scanning: ${folder.path}`);
        scanFolder(folder.path);
        watchers.set(folder.path, watchFolder(folder.path));
    }
}

function rescanFolder(folderPath) {
    scanFolder(folderPath);
    if (!watchers.has(folderPath)) {
        watchers.set(folderPath, watchFolder(folderPath));
    }
}

function syncAllFolders() {
    const folders = configCache.getFolders();
    for (const folder of folders) rescanFolder(folder.path);
    return folders.length;
}

function getMovies() {
    return Object.values(movies);
}

function getMovie(id) {
    return movies[id] || null;
}

// Force-queue all movies for re-enrichment
function forceRefreshAll() {
    const cache = metadataCache.get();
    let count = 0;
    for (const [id, movie] of Object.entries(movies)) {
        movies[id] = { ...movie, enriched: false };
        if (cache[id]) cache[id] = { ...cache[id], enriched: false };
        if (!enrichQueue.includes(id)) {
            enrichQueue.push(id);
            count++;
        }
    }
    metadataCache.set(cache);
    processEnrichQueue();
    return count;
}

// Force re-enrich a single movie
function forceRefreshOne(id) {
    if (!movies[id]) return false;
    movies[id] = { ...movies[id], enriched: false };
    const cache = metadataCache.get();
    if (cache[id]) {
        cache[id] = { ...cache[id], enriched: false };
        metadataCache.set(cache);
    }
    if (!enrichQueue.includes(id)) enrichQueue.push(id);
    processEnrichQueue();
    return true;
}

function getScanStatus() {
    return {
        scanning: isEnriching || enrichQueue.length > 0,
        queued: enrichQueue.length,
    };
}

module.exports = { initScanner, rescanFolder, syncAllFolders, removeFolderMovies, getMovies, getMovie, getScanStatus, stopWatchers, forceRefreshAll, forceRefreshOne };
