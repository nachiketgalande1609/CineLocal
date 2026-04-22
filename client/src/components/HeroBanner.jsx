import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./HeroBanner.module.css";

export default function HeroBanner({ movies, onMovieSelect }) {
  const [featured, setFeatured] = useState(null);
  const [fading, setFading] = useState(false);
  const [dotIdx, setDotIdx] = useState(0);
  const poolRef = useRef([]);
  const idxRef = useRef(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!movies.length) return;
    const enriched = movies.filter((m) => m.backdrop && m.enriched);
    poolRef.current = enriched.length >= 2 ? enriched : (movies.length > 0 ? movies : enriched);
    const start = Math.floor(Math.random() * poolRef.current.length);
    idxRef.current = start;
    setDotIdx(start % Math.min(poolRef.current.length, 5));
    setFeatured(poolRef.current[start]);

    if (poolRef.current.length < 2) return;
    const interval = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        idxRef.current = (idxRef.current + 1) % poolRef.current.length;
        setFeatured(poolRef.current[idxRef.current]);
        setDotIdx(idxRef.current % Math.min(poolRef.current.length, 5));
        setFading(false);
      }, 450);
    }, 10000);
    return () => clearInterval(interval);
  }, [movies]);

  function jumpTo(i) {
    if (i === idxRef.current % Math.min(poolRef.current.length, 5)) return;
    setFading(true);
    setTimeout(() => {
      idxRef.current = i;
      setFeatured(poolRef.current[i]);
      setDotIdx(i);
      setFading(false);
    }, 350);
  }

  if (!featured) return <div className={styles.placeholder} />;

  const dotCount = Math.min(poolRef.current.length, 5);

  return (
    <div className={`${styles.hero} ${fading ? styles.fading : ""}`}>
      {featured.backdrop ? (
        <img src={featured.backdrop} alt={featured.title} className={styles.backdrop} />
      ) : (
        <div className={styles.backdropFallback} />
      )}
      <div className={styles.overlay} />
      <div className={styles.gradient} />

      <div className={styles.content}>
        <div className={styles.meta}>
          {featured.contentRating && (
            <span className={styles.contentRating}>{featured.contentRating}</span>
          )}
          {featured.genres?.slice(0, 2).map((g) => (
            <span key={g} className={styles.genre}>{g}</span>
          ))}
        </div>
        <h1 className={styles.title}>{featured.title || featured.filename}</h1>
        {featured.tagline && <p className={styles.tagline}>"{featured.tagline}"</p>}
        {featured.overview && (
          <p className={styles.overview}>
            {featured.overview.slice(0, 220)}{featured.overview.length > 220 ? "…" : ""}
          </p>
        )}
        <div className={styles.stats}>
          {featured.rating && (
            <span className={styles.rating}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="gold" stroke="gold" strokeWidth="1">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              {featured.rating}
              {featured.voteCount > 0 && <span className={styles.voteCount}>({featured.voteCount.toLocaleString()})</span>}
            </span>
          )}
          {featured.year && <span className={styles.statChip}>{featured.year}</span>}
          {featured.runtime && (
            <span className={styles.statChip}>
              {Math.floor(featured.runtime / 60)}h {featured.runtime % 60}m
            </span>
          )}
        </div>
        <div className={styles.actions}>
          <button className={styles.playBtn} onClick={() => navigate(`/watch/${featured.id}`)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            Play
          </button>
          <button className={styles.infoBtn} onClick={() => onMovieSelect?.(featured)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="3"/>
            </svg>
            More Info
          </button>
        </div>
        {featured.cast?.length > 0 && (
          <p className={styles.castPreview}>
            <span>Starring: </span>
            {featured.cast.slice(0, 4).map((c) => c.name).join(" · ")}
          </p>
        )}
      </div>

      {dotCount > 1 && (
        <div className={styles.dots}>
          {Array.from({ length: dotCount }, (_, i) => (
            <button
              key={i}
              className={`${styles.dot} ${i === dotIdx ? styles.dotActive : ""}`}
              onClick={() => jumpTo(i)}
              aria-label={`Featured movie ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
