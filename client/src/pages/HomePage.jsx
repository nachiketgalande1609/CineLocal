import React, { useMemo, useState, useCallback } from "react";
import HeroBanner from "../components/HeroBanner";
import MovieRow from "../components/MovieRow";
import MovieCard from "../components/MovieCard";
import { SkeletonRow } from "../components/SkeletonCard";
import styles from "./HomePage.module.css";

const GENRE_ORDER = [
  "Action", "Adventure", "Animation", "Comedy", "Crime",
  "Documentary", "Drama", "Fantasy", "History", "Horror",
  "Music", "Mystery", "Romance", "Science Fiction", "Thriller", "Western",
];

const SORT_OPTIONS = [
  { value: "default", label: "Default" },
  { value: "rating",  label: "Rating" },
  { value: "year",    label: "Year" },
  { value: "title",   label: "Title A–Z" },
  { value: "runtime", label: "Runtime" },
];

export default function HomePage({
  movies, loading, syncing, syncQueued, onMovieSelect,
  watchlist, inWatchlist, onWatchlistToggle, watchProgress,
}) {
  const [activeGenre, setActiveGenre] = useState("All");
  const [sortBy, setSortBy] = useState("default");
  const progress = watchProgress || {};

  const genres = useMemo(() => {
    const set = new Set();
    for (const m of movies) for (const g of m.genres || []) set.add(g);
    return [...set].sort((a, b) => {
      const ai = GENRE_ORDER.indexOf(a), bi = GENRE_ORDER.indexOf(b);
      if (ai >= 0 && bi >= 0) return ai - bi;
      if (ai >= 0) return -1;
      if (bi >= 0) return 1;
      return a.localeCompare(b);
    });
  }, [movies]);

  const isFiltered = activeGenre !== "All" || sortBy !== "default";

  const filteredMovies = useMemo(() => {
    let list = activeGenre === "All"
      ? [...movies]
      : movies.filter((m) => m.genres?.includes(activeGenre));
    if (sortBy === "rating")  list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    else if (sortBy === "year")    list.sort((a, b) => (b.year || 0) - (a.year || 0));
    else if (sortBy === "title")   list.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    else if (sortBy === "runtime") list.sort((a, b) => (b.runtime || 0) - (a.runtime || 0));
    return list;
  }, [movies, activeGenre, sortBy]);

  const rows = useMemo(() => {
    if (!movies.length) return [];
    const result = [];

    const continueWatching = movies
      .filter((m) => progress[m.id])
      .sort((a, b) => new Date(progress[b.id]?.savedAt) - new Date(progress[a.id]?.savedAt))
      .slice(0, 20);
    if (continueWatching.length > 0) result.push({ label: "Continue Watching", movies: continueWatching });

    if (watchlist?.length > 0) {
      const myList = movies.filter((m) => watchlist.includes(m.id));
      if (myList.length > 0) result.push({ label: "My List", movies: myList });
    }

    result.push({ label: "All Movies", movies: [...movies] });

    const recent = [...movies].sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt)).slice(0, 20);
    if (recent.length > 1) result.push({ label: "Recently Added", movies: recent });

    const topRated = [...movies].filter((m) => m.rating).sort((a, b) => b.rating - a.rating).slice(0, 20);
    if (topRated.length > 3) result.push({ label: "Top Rated", movies: topRated });

    const byGenre = {};
    for (const movie of movies) for (const genre of movie.genres || []) {
      if (!byGenre[genre]) byGenre[genre] = [];
      byGenre[genre].push(movie);
    }
    const done = new Set();
    for (const genre of GENRE_ORDER) {
      if (byGenre[genre]?.length > 0) { result.push({ label: genre, movies: byGenre[genre] }); done.add(genre); }
    }
    for (const [genre, list] of Object.entries(byGenre)) {
      if (!done.has(genre) && list.length > 0) result.push({ label: genre, movies: list });
    }
    return result;
  }, [movies, progress, watchlist]);

  const surpriseMe = useCallback(() => {
    const pool = movies.filter((m) => m.enriched);
    const src = pool.length > 0 ? pool : movies;
    if (!src.length) return;
    onMovieSelect(src[Math.floor(Math.random() * src.length)]);
  }, [movies, onMovieSelect]);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.heroSkeleton} />
        <div className={styles.rows} style={{ marginTop: 0, paddingTop: 32 }}>
          <SkeletonRow count={7} />
          <SkeletonRow count={7} />
          <SkeletonRow count={7} />
        </div>
      </div>
    );
  }

  if (!movies.length) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <rect x="2" y="7" width="20" height="15" rx="2" ry="2"/>
            <polyline points="17 2 12 7 7 2"/>
          </svg>
        </div>
        <h2>No movies found</h2>
        <p>Add a folder with your video files in <a href="/settings">Settings</a> to get started.</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {syncing && (
        <div className={styles.syncBanner}>
          <span className={styles.syncSpinner} />
          <span>
            {syncQueued > 0
              ? `Fetching metadata… ${syncQueued} movie${syncQueued !== 1 ? "s" : ""} remaining`
              : "Scanning library…"}
          </span>
        </div>
      )}
      {!isFiltered && <HeroBanner movies={movies} onMovieSelect={onMovieSelect} />}

      <div  style={{marginBottom  : 20}} className={`${styles.filterBar} ${isFiltered ? styles.filterBarTop : ""}`}>
        <div className={styles.genreScroll}>
          <button
            className={`${styles.genreChip} ${activeGenre === "All" ? styles.genreActive : ""}`}
            onClick={() => setActiveGenre("All")}
          >
            All
          </button>
          {genres.map((g) => (
            <button
              key={g}
              className={`${styles.genreChip} ${activeGenre === g ? styles.genreActive : ""}`}
              onClick={() => setActiveGenre(g)}
            >
              {g}
            </button>
          ))}
        </div>
        <div className={styles.filterRight}>
          <select
            className={styles.sortSelect}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button className={styles.surpriseBtn} onClick={surpriseMe} title="Random movie">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="2" width="20" height="20" rx="4"/>
              <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" stroke="none"/>
              <circle cx="15.5" cy="8.5" r="1.5" fill="currentColor" stroke="none"/>
              <circle cx="8.5" cy="15.5" r="1.5" fill="currentColor" stroke="none"/>
              <circle cx="15.5" cy="15.5" r="1.5" fill="currentColor" stroke="none"/>
              <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/>
            </svg>
            Surprise Me
          </button>
        </div>
      </div>

      {isFiltered ? (
        <div className={styles.gridView}>
          <div className={styles.gridHeader}>
            <h2 className={styles.gridTitle}>
              {activeGenre === "All" ? "All Movies" : activeGenre}
            </h2>
            <span className={styles.gridCount}>{filteredMovies.length} titles</span>
          </div>
          <div className={styles.grid}>
            {filteredMovies.map((m) => (
              <MovieCard
                key={m.id}
                movie={m}
                onSelect={onMovieSelect}
                inWatchlist={inWatchlist?.(m.id)}
                onWatchlistToggle={onWatchlistToggle}
                progress={progress[m.id]}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className={styles.rows}>
          {rows.map((row) => (
            <MovieRow
              key={row.label}
              title={row.label}
              movies={row.movies}
              onSelect={onMovieSelect}
              inWatchlist={inWatchlist}
              onWatchlistToggle={onWatchlistToggle}
              progress={progress}
            />
          ))}
        </div>
      )}
    </div>
  );
}
