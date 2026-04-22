import React, { useState, useEffect } from "react";
import api, { getServerIp, setServerIp, getServerUrl } from "../api";
import { useToast } from "../components/Toast";
import styles from "./SettingsPage.module.css";

export default function SettingsPage({ onFoldersChange, onFolderAdded }) {
  const [folders, setFolders] = useState([]);
  const [newPath, setNewPath] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tmdbConfigured, setTmdbConfigured] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [stats, setStats] = useState(null);
  const [serverIpInput, setServerIpInput] = useState(getServerIp());
  const [serverSaved, setServerSaved] = useState(!!getServerIp());
  const toast = useToast();

  useEffect(() => {
    fetchFolders();
    api.get("/api/status").then((r) => setTmdbConfigured(r.data.tmdbConfigured)).catch(() => {});
    api.get("/api/stats").then((r) => setStats(r.data)).catch(() => {});
  }, []);

  async function fetchFolders() {
    try {
      const res = await api.get("/api/folders");
      setFolders(res.data);
    } catch (err) {
      console.error("Failed to fetch folders:", err);
    }
  }

  async function addFolder(e) {
    e.preventDefault();
    if (!newPath.trim()) return;
    setAdding(true);
    setError("");
    setSuccess("");
    try {
      await api.post("/api/folders", { path: newPath.trim() });
      setNewPath("");
      toast("Folder added — scan started!", "success");
      await fetchFolders();
      onFolderAdded?.();
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to add folder";
      setError(msg);
      toast(msg, "error");
    } finally {
      setAdding(false);
    }
  }

  async function removeFolder(id) {
    try {
      await api.delete(`/api/folders/${id}`);
      toast("Folder removed", "info", 2500);
      await fetchFolders();
      onFoldersChange?.();
    } catch {
      toast("Failed to remove folder", "error");
    }
  }

  async function syncLibrary() {
    setSyncing(true);
    try {
      const res = await api.post("/api/folders/sync");
      toast(res.data.message, "success");
      onFoldersChange?.();
    } catch {
      toast("Sync failed", "error");
    } finally {
      setSyncing(false);
    }
  }

  async function refreshAllMetadata() {
    setRefreshing(true);
    setRefreshMsg("");
    try {
      const res = await api.post("/api/movies/refresh");
      setRefreshMsg(res.data.message);
      toast(res.data.message, "info");
      setTimeout(() => setRefreshMsg(""), 6000);
    } catch {
      toast("Failed to start refresh", "error");
    } finally {
      setRefreshing(false);
    }
  }

  function saveServerUrlHandler(e) {
    e.preventDefault();
    setServerIp(serverIpInput);
    setServerSaved(!!serverIpInput.trim());
    toast(serverIpInput.trim() ? "Server IP saved" : "Server IP cleared", "success", 2500);
  }

  const maxGenreCount = stats?.topGenres?.[0]?.count || 1;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.heading}>Settings</h1>
          <p className={styles.subtitle}>Manage your local video folders</p>
        </div>

        {/* Server Connection */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Server Connection</h2>
          <p className={styles.sectionDesc}>
            Enter your laptop's IP address to connect from other devices on the same network.
            Leave blank when running locally.
          </p>
          <form onSubmit={saveServerUrlHandler} className={styles.addForm}>
            <input
              className={styles.input}
              type="text"
              value={serverIpInput}
              onChange={(e) => { setServerIpInput(e.target.value); setServerSaved(false); }}
              placeholder="192.168.1.50"
            />
            <button className={styles.addBtn} type="submit">
              Save
            </button>
          </form>
          <div className={styles.apiStatus} style={{ marginTop: 12 }}>
            <div className={`${styles.statusDot} ${serverSaved ? styles.active : styles.inactive}`} />
            <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
              {serverSaved
                ? `Connected to: ${getServerIp()}`
                : "Using local server (localhost)"}
            </span>
          </div>
        </section>

        {/* Library Stats */}
        {stats && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Library Statistics</h2>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{stats.total}</div>
                <div className={styles.statLabel}>Total Movies</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{stats.enriched}</div>
                <div className={styles.statLabel}>With Metadata</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{stats.totalRuntimeFormatted}</div>
                <div className={styles.statLabel}>Total Runtime</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{stats.averageRating ?? "—"}</div>
                <div className={styles.statLabel}>Avg Rating</div>
              </div>
              {stats.totalSizeGB > 0 && (
                <div className={styles.statCard}>
                  <div className={styles.statValue}>{stats.totalSizeGB} GB</div>
                  <div className={styles.statLabel}>Disk Usage</div>
                </div>
              )}
            </div>

            {stats.topGenres?.length > 0 && (
              <div className={styles.genreStats}>
                <p className={styles.genreStatsTitle}>Top Genres</p>
                {stats.topGenres.map((g) => (
                  <div key={g.name} className={styles.genreRow}>
                    <span className={styles.genreName}>{g.name}</span>
                    <div className={styles.genreBarWrap}>
                      <div
                        className={styles.genreBar}
                        style={{ width: `${(g.count / maxGenreCount) * 100}%` }}
                      />
                    </div>
                    <span className={styles.genreCount}>{g.count}</span>
                  </div>
                ))}
              </div>
            )}

            {stats.decades?.length > 0 && (
              <div className={styles.decadeStats}>
                <p className={styles.genreStatsTitle}>By Decade</p>
                <div className={styles.decadeRow}>
                  {stats.decades.map((d) => (
                    <div key={d.decade} className={styles.decadeItem}>
                      <div
                        className={styles.decadeBar}
                        style={{ height: `${(d.count / Math.max(...stats.decades.map((x) => x.count))) * 60}px` }}
                        title={`${d.count} movies`}
                      />
                      <span className={styles.decadeLabel}>{d.decade}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Media Folders */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Media Folders</h2>
          <p className={styles.sectionDesc}>
            Add folders containing your video files. CinéLocal will scan them automatically
            and fetch metadata from TMDB.
          </p>

          <form onSubmit={addFolder} className={styles.addForm}>
            <input
              className={styles.input}
              type="text"
              value={newPath}
              onChange={(e) => setNewPath(e.target.value)}
              placeholder="e.g. C:\Users\You\Movies or /home/you/movies"
              disabled={adding}
            />
            <button className={styles.addBtn} type="submit" disabled={adding || !newPath.trim()}>
              {adding ? "Adding…" : "Add Folder"}
            </button>
          </form>

          {error && <p className={styles.errorMsg}>{error}</p>}
          {success && <p className={styles.successMsg}>{success}</p>}

          <div className={styles.refreshSection} style={{ marginBottom: 0 }}>
            <div>
              <p className={styles.refreshDesc}>
                Scan all folders for newly added or removed video files without
                re-fetching metadata from TMDB.
              </p>
            </div>
            <button
              className={styles.refreshBtn}
              onClick={syncLibrary}
              disabled={syncing}
            >
              {syncing ? (
                <><span className={styles.refreshSpinner} />Syncing…</>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                  </svg>
                  Sync Library
                </>
              )}
            </button>
          </div>

          <div className={styles.folderList}>
            {folders.length === 0 ? (
              <div className={styles.emptyFolders}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
                <p>No folders added yet</p>
              </div>
            ) : (
              folders.map((folder) => (
                <div key={folder.id} className={styles.folderItem}>
                  <div className={styles.folderIcon}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                    </svg>
                  </div>
                  <div className={styles.folderInfo}>
                    <span className={styles.folderPath}>{folder.path}</span>
                    <span className={styles.folderDate}>Added {new Date(folder.addedAt).toLocaleDateString()}</span>
                  </div>
                  <button className={styles.removeBtn} onClick={() => removeFolder(folder.id)} title="Remove folder">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        {/* TMDB API */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>TMDB API</h2>
          <div className={styles.apiInfo}>
            <div className={styles.apiStatus}>
              <div className={`${styles.statusDot} ${tmdbConfigured ? styles.active : styles.inactive}`} />
              <span>
                {tmdbConfigured
                  ? "API key configured — metadata enrichment active"
                  : "Set TMDB_API_KEY env var to enable metadata enrichment"}
              </span>
            </div>
            <p className={styles.apiNote}>
              Get a free API key at{" "}
              <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noreferrer">
                themoviedb.org
              </a>
              . Then start the server with:{" "}
              <code>TMDB_API_KEY=your_key npm start</code>
            </p>

            <div className={styles.refreshSection}>
              <div>
                <p className={styles.refreshDesc}>
                  Re-fetch metadata for all movies from TMDB. Use this if posters, cast, or
                  other details look outdated or are missing.
                </p>
              </div>
              <button
                className={styles.refreshBtn}
                onClick={refreshAllMetadata}
                disabled={refreshing || !tmdbConfigured}
                title={!tmdbConfigured ? "TMDB API key required" : ""}
              >
                {refreshing ? (
                  <><span className={styles.refreshSpinner} />Refreshing…</>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="1 4 1 10 7 10"/>
                      <path d="M3.51 15a9 9 0 1 0 .49-4.95"/>
                    </svg>
                    Refresh All Metadata
                  </>
                )}
              </button>
            </div>
            {refreshMsg && <p className={styles.successMsg}>{refreshMsg}</p>}
          </div>
        </section>

        {/* Keyboard Shortcuts */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Keyboard Shortcuts</h2>
          <div className={styles.shortcuts}>
            {[
              ["/", "Open search"],
              ["Space / K", "Play / Pause"],
              ["→ / L", "Skip forward 10s"],
              ["← / J", "Skip back 10s"],
              ["↑ / ↓ Arrows", "Volume up / down"],
              ["M", "Toggle mute"],
              ["F", "Toggle fullscreen"],
              ["P", "Picture-in-Picture"],
              ["Esc", "Back / Close"],
            ].map(([key, desc]) => (
              <div key={key} className={styles.shortcut}>
                <kbd className={styles.kbd}>{key}</kbd>
                <span>{desc}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
