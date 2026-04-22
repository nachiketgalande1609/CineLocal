const fs = require("fs");
const path = require("path");

const CACHE_DIR = path.join(process.cwd(), ".cinelocal");
const CACHE_FILE = path.join(CACHE_DIR, "metadata.json");
const CONFIG_FILE = path.join(CACHE_DIR, "config.json");

function ensureDir() {
  if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
}

function readJSON(file, fallback) {
  try {
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {}
  return fallback;
}

function writeJSON(file, data) {
  ensureDir();
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

const metadataCache = {
  get: () => readJSON(CACHE_FILE, {}),
  set: (data) => writeJSON(CACHE_FILE, data),
  update: (id, metadata) => {
    const cache = metadataCache.get();
    cache[id] = metadata;
    metadataCache.set(cache);
  },
  getOne: (id) => metadataCache.get()[id] || null,
};

const configCache = {
  get: () => readJSON(CONFIG_FILE, { folders: [] }),
  set: (data) => writeJSON(CONFIG_FILE, data),
  getFolders: () => configCache.get().folders || [],
  addFolder: (folder) => {
    const config = configCache.get();
    if (!config.folders.find((f) => f.path === folder.path)) {
      config.folders.push(folder);
      configCache.set(config);
    }
  },
  removeFolder: (id) => {
    const config = configCache.get();
    config.folders = config.folders.filter((f) => f.id !== id);
    configCache.set(config);
  },
};

module.exports = { metadataCache, configCache };
