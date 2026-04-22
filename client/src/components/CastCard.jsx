import React from "react";
import styles from "./CastCard.module.css";

export default function CastCard({ person, onClick }) {
  return (
    <button className={styles.card} onClick={onClick} title={`View ${person.name}`}>
      <div className={styles.photoWrap}>
        {person.profile ? (
          <img src={person.profile} alt={person.name} className={styles.photo} loading="lazy" />
        ) : (
          <div className={styles.photoFallback}>
            <span>{person.name?.[0]?.toUpperCase()}</span>
          </div>
        )}
        <div className={styles.hoverOverlay}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
        </div>
      </div>
      <div className={styles.info}>
        <span className={styles.name}>{person.name}</span>
        {person.character && (
          <span className={styles.character}>{person.character}</span>
        )}
      </div>
    </button>
  );
}
