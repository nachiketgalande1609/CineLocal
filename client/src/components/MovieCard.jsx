import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./MovieCard.module.css";

export default function MovieCard({ movie, onSelect, inWatchlist, onWatchlistToggle, progress }) {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();

  function handleCardClick() {
    if (onSelect) onSelect(movie);
    else navigate(`/watch/${movie.id}`);
  }

  function handlePlay(e) {
    e.stopPropagation();
    navigate(`/watch/${movie.id}`);
  }

  function handleWatchlist(e) {
    e.stopPropagation();
    onWatchlistToggle?.(movie.id);
  }

  const progressPct  = progress?.percentage;
  const showProgress = progressPct > 2 && progressPct < 98;

  return (
    <div
      className={`${styles.card} ${hovered ? styles.hovered : ""}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && handleCardClick()}
    >
      <div className={styles.inner}>

        {/* ── Poster ── */}
        <div className={styles.posterWrap}>
          {movie.poster ? (
            <img src={movie.poster} alt={movie.title} className={styles.poster} loading="lazy" />
          ) : (
            <div className={styles.posterFallback}>
              <span className={styles.fallbackLetter}>
                {(movie.title || movie.filename)?.[0]?.toUpperCase()}
              </span>
            </div>
          )}

          <div className={`${styles.overlay} ${hovered ? styles.overlayVisible : ""}`}>
            <button className={styles.playBtn} onClick={handlePlay} title="Play">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
            </button>
          </div>

          {!movie.enriched && <div className={styles.noMetaBadge}>No metadata</div>}
          {showProgress && (
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${Math.min(100, progressPct)}%` }} />
            </div>
          )}
        </div>

        {/* ── Info panel — revealed as card widens ── */}
        <div className={`${styles.infoPanel} ${hovered ? styles.infoPanelVisible : ""} ${!movie.backdrop ? styles.infoPanelSolid : ""}`}>
          {movie.backdrop && (
            <img src={movie.backdrop} alt="" className={styles.infoBg} aria-hidden="true" />
          )}
          <div className={styles.infoBgGradient} />

          <div className={styles.infoContent}>
            <h3 className={styles.infoTitle}>{movie.title || movie.filename}</h3>

            <div className={styles.infoMeta}>
              {movie.rating && (
                <span className={styles.infoRating}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="gold" stroke="gold" strokeWidth="1">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                  {movie.rating}
                </span>
              )}
              {movie.year && <span>{movie.year}</span>}
              {movie.runtime && <span>{Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m</span>}
            </div>

            {movie.genres?.length > 0 && (
              <div className={styles.infoGenres}>
                {movie.genres.slice(0, 2).map((g) => (
                  <span key={g} className={styles.infoGenre}>{g}</span>
                ))}
              </div>
            )}

            <div className={styles.infoActions}>
              <button className={styles.infoPlayBtn} onClick={handlePlay} title="Play">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
              </button>
              {onWatchlistToggle && (
                <button
                  className={`${styles.infoListBtn} ${inWatchlist ? styles.infoListActive : ""}`}
                  onClick={handleWatchlist}
                  title={inWatchlist ? "Remove from My List" : "Add to My List"}
                >
                  {inWatchlist ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
