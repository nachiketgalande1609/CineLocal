import React, { useRef, useState } from "react";
import MovieCard from "./MovieCard";
import styles from "./MovieRow.module.css";

export default function MovieRow({ title, movies, onSelect, inWatchlist, onWatchlistToggle, progress }) {
  const rowRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  function scroll(dir) {
    const row = rowRef.current;
    if (!row) return;
    row.scrollBy({ left: dir === "left" ? -row.clientWidth * 0.75 : row.clientWidth * 0.75, behavior: "smooth" });
  }

  function onScroll() {
    const row = rowRef.current;
    if (!row) return;
    setCanScrollLeft(row.scrollLeft > 10);
    setCanScrollRight(row.scrollLeft + row.clientWidth < row.scrollWidth - 10);
  }

  if (!movies || movies.length === 0) return null;

  return (
    <div className={styles.row}>
      <h2 className={styles.title}>{title}</h2>
      <div className={styles.sliderWrapper}>
        {canScrollLeft && (
          <button className={`${styles.arrow} ${styles.arrowLeft}`} onClick={() => scroll("left")} aria-label="Scroll left">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
        )}
        <div className={styles.slider} ref={rowRef} onScroll={onScroll}>
          {movies.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              onSelect={onSelect}
              inWatchlist={inWatchlist?.(movie.id)}
              onWatchlistToggle={onWatchlistToggle}
              progress={progress?.[movie.id]}
            />
          ))}
        </div>
        {canScrollRight && (
          <button className={`${styles.arrow} ${styles.arrowRight}`} onClick={() => scroll("right")} aria-label="Scroll right">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
