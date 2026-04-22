import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./SearchBar.module.css";

export default function SearchBar({ movies, open: openProp, onOpenChange, onMovieSelect }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Sync with external open state (from "/" shortcut)
  useEffect(() => {
    if (openProp !== undefined && openProp !== open) {
      setOpen(openProp);
    }
  }, [openProp]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const q = query.toLowerCase();
    setResults(
      movies
        .filter((m) =>
          m.title?.toLowerCase().includes(q) ||
          m.overview?.toLowerCase().includes(q) ||
          m.filename?.toLowerCase().includes(q) ||
          m.genres?.some((g) => g.toLowerCase().includes(q)) ||
          m.cast?.some((c) => c.name?.toLowerCase().includes(q))
        )
        .slice(0, 8)
    );
  }, [query, movies]);

  function notifyOpen(val) {
    setOpen(val);
    onOpenChange?.(val);
  }

  function handleSelect(movie) {
    if (onMovieSelect) {
      onMovieSelect(movie);
    } else {
      navigate(`/watch/${movie.id}`);
    }
    notifyOpen(false);
    setQuery("");
  }

  function handleClose() {
    notifyOpen(false);
    setQuery("");
    setResults([]);
  }

  return (
    <div className={styles.wrapper}>
      {open ? (
        <div className={styles.searchBox}>
          <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            ref={inputRef}
            className={styles.input}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Titles, genres, cast..."
            onKeyDown={(e) => e.key === "Escape" && handleClose()}
          />
          {query && (
            <button className={styles.clearBtn} onClick={() => setQuery("")} title="Clear">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
          <button className={styles.closeBtn} onClick={handleClose}>✕</button>

          {results.length > 0 && (
            <div className={styles.results}>
              {results.map((m) => (
                <button key={m.id} className={styles.resultItem} onClick={() => handleSelect(m)}>
                  {m.poster ? (
                    <img src={m.poster} alt={m.title} className={styles.resultPoster} />
                  ) : (
                    <div className={styles.resultPosterFallback}>
                      <span>{m.title?.[0]}</span>
                    </div>
                  )}
                  <div className={styles.resultInfo}>
                    <span className={styles.resultTitle}>{m.title || m.filename}</span>
                    <span className={styles.resultMeta}>
                      {m.year && <span>{m.year}</span>}
                      {m.genres?.[0] && <span>{m.genres[0]}</span>}
                      {m.rating && <span className={styles.resultRating}>★ {m.rating}</span>}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
          {query.trim() && results.length === 0 && (
            <div className={styles.noResults}>No results for "{query}"</div>
          )}
        </div>
      ) : (
        <button className={styles.searchToggle} onClick={() => notifyOpen(true)} title="Search (/)">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
        </button>
      )}
    </div>
  );
}
