import React from "react";
import { Link } from "react-router-dom";
import MovieCard from "../components/MovieCard";
import styles from "./WatchlistPage.module.css";

export default function WatchlistPage({
  movies, watchlist, inWatchlist, onWatchlistToggle, onMovieSelect, watchProgress,
}) {
  const progress = watchProgress || {};
  const listed   = movies.filter((m) => watchlist.includes(m.id));

  if (!listed.length) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>
          <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2.5"/>
          </svg>
        </div>
        <h2>Your list is empty</h2>
        <p>Browse movies and hit <strong>+</strong> to save them here.</p>
        <Link to="/" className={styles.browseLink}>Browse Movies</Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.heading}>My List</h1>
        <span className={styles.count}>{listed.length} {listed.length === 1 ? "title" : "titles"}</span>
      </div>

      <div className={styles.grid}>
        {listed.map((movie) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            onSelect={onMovieSelect}
            inWatchlist={inWatchlist?.(movie.id)}
            onWatchlistToggle={onWatchlistToggle}
            progress={progress[movie.id]}
          />
        ))}
      </div>
    </div>
  );
}
