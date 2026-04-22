import React, { useRef, useState, useEffect } from "react";
import MovieCard from "./MovieCard";
import styles from "./MovieRow.module.css";

export default function MovieRow({ title, movies, onSelect, inWatchlist, onWatchlistToggle, progress }) {
  const sliderRef = useRef(null);
  const clipRef   = useRef(null);
  const posRef    = useRef(0);          // current scroll offset (px)
  const [canScrollLeft,  setCanScrollLeft]  = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  function getMax() {
    if (!sliderRef.current || !clipRef.current) return 0;
    return Math.max(0, sliderRef.current.scrollWidth - clipRef.current.clientWidth);
  }

  function applyPos(next) {
    const max    = getMax();
    const clamped = Math.max(0, Math.min(max, next));
    posRef.current = clamped;
    if (sliderRef.current) {
      sliderRef.current.style.transform = `translateX(-${clamped}px)`;
    }
    setCanScrollLeft(clamped > 10);
    setCanScrollRight(clamped < max - 10);
  }

  function scroll(dir) {
    const amount = (clipRef.current?.clientWidth ?? 600) * 0.75;
    applyPos(posRef.current + (dir === "left" ? -amount : amount));
  }

  // Initialise right-arrow visibility after mount / when movies change
  useEffect(() => {
    const check = () => {
      setCanScrollRight(getMax() > 10);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [movies]); // eslint-disable-line react-hooks/exhaustive-deps

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

        <div className={styles.sliderClip} ref={clipRef}>
          <div className={styles.slider} ref={sliderRef}>
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
