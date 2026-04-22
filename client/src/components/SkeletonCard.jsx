import React from "react";
import styles from "./SkeletonCard.module.css";

export function SkeletonCard() {
  return (
    <div className={styles.card}>
      <div className={styles.poster} />
    </div>
  );
}

export function SkeletonRow({ count = 6 }) {
  return (
    <div className={styles.row}>
      <div className={styles.rowTitle} />
      <div className={styles.rowCards}>
        {Array.from({ length: count }, (_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
