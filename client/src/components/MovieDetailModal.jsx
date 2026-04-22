import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import CastCard from "./CastCard";
import styles from "./MovieDetailModal.module.css";

function formatRuntime(min) {
  if (!min) return null;
  const h = Math.floor(min / 60), m = min % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatMoney(n) {
  if (!n || n === 0) return null;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toLocaleString()}`;
}

function SimilarCard({ movie, onSelect }) {
  return (
    <button className={styles.simCard} onClick={() => onSelect(movie)}>
      {movie.poster ? (
        <img src={movie.poster} alt={movie.title} className={styles.simPoster} loading="lazy" />
      ) : (
        <div className={styles.simFallback}>{movie.title?.[0]}</div>
      )}
      <div className={styles.simInfo}>
        <span className={styles.simTitle}>{movie.title || movie.filename}</span>
        <div className={styles.simMeta}>
          {movie.rating && (
            <span className={styles.simRating}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="gold" stroke="gold" strokeWidth="1">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              {movie.rating}
            </span>
          )}
          {movie.year && <span>{movie.year}</span>}
          {movie.runtime && <span>{formatRuntime(movie.runtime)}</span>}
        </div>
        {movie.overview && (
          <p className={styles.simOverview}>{movie.overview.slice(0, 120)}{movie.overview.length > 120 ? "…" : ""}</p>
        )}
      </div>
    </button>
  );
}

export default function MovieDetailModal({
  movie,
  allMovies,
  onClose,
  onPersonSelect,
  onMovieSelect,
  inWatchlist,
  onWatchlistToggle,
  watchProgress,
}) {
  const navigate = useNavigate();
  const overlayRef = useRef(null);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") { if (trailerOpen) setTrailerOpen(false); else onClose(); } };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose, trailerOpen]);

  const similar = allMovies
    .filter((m) => m.id !== movie.id && m.genres?.some((g) => movie.genres?.includes(g)))
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 12);

  const director = movie.crew?.find((c) => c.job === "Director");
  const writers = movie.crew?.filter((c) => ["Writer", "Screenplay", "Story"].includes(c.job)) || [];
  const uniqueWriters = writers.filter((w, i, a) => a.findIndex((x) => x.id === w.id) === i);
  const dp = movie.crew?.find((c) => c.job === "Director of Photography");
  const composer = movie.crew?.find((c) => c.job === "Original Music Composer");
  const budget = formatMoney(movie.budget);
  const revenue = formatMoney(movie.revenue);
  const progress = watchProgress?.[movie.id];
  const resumeTime = progress ? Math.floor(progress.time) : null;
  const resumeLabel = progress ? `${Math.round(progress.percentage * 100)}% watched` : null;

  function handlePlay() {
    navigate(`/watch/${movie.id}${resumeTime ? `?t=${resumeTime}` : ""}`);
  }

  return (
    <div
      className={styles.overlay}
      ref={overlayRef}
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div className={styles.modal}>
        {/* Hero backdrop */}
        <div className={styles.hero}>
          {movie.backdrop ? (
            <img src={movie.backdrop} alt={movie.title} className={styles.heroImg} />
          ) : movie.poster ? (
            <img src={movie.poster} alt={movie.title} className={styles.heroImg} style={{ objectPosition: "center top" }} />
          ) : (
            <div className={styles.heroFallback} />
          )}
          <div className={styles.heroGradient} />
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>

          {/* Trailer overlay */}
          {trailerOpen && movie.trailers?.[0] && (
            <div className={styles.trailerWrap}>
              <iframe
                src={`https://www.youtube.com/embed/${movie.trailers[0].key}?autoplay=1&rel=0`}
                title="Trailer"
                frameBorder="0"
                allow="autoplay; fullscreen"
                allowFullScreen
                className={styles.trailerFrame}
              />
              <button className={styles.closeTrailer} onClick={() => setTrailerOpen(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
                Close Trailer
              </button>
            </div>
          )}

          <div className={styles.heroContent}>
            {movie.contentRating && (
              <span className={styles.contentRating}>{movie.contentRating}</span>
            )}
            <h1 className={styles.title}>{movie.title || movie.filename}</h1>
            {movie.tagline && <p className={styles.tagline}>"{movie.tagline}"</p>}
            <div className={styles.heroBtns}>
              <button className={styles.playBtn} onClick={handlePlay}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                {resumeTime ? "Resume" : "Play"}
              </button>
              {movie.trailers?.length > 0 && (
                <button className={styles.trailerBtn} onClick={() => setTrailerOpen(true)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                    <rect x="2" y="2" width="20" height="20" rx="2" ry="2" fill="none"/>
                  </svg>
                  Trailer
                </button>
              )}
              <button
                className={`${styles.watchlistBtn} ${inWatchlist ? styles.inList : ""}`}
                onClick={() => onWatchlistToggle(movie.id)}
                title={inWatchlist ? "Remove from My List" : "Add to My List"}
              >
                {inWatchlist ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                )}
              </button>
            </div>
            {resumeLabel && (
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${Math.round((progress?.percentage || 0) * 100)}%` }} />
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {/* Left main column */}
          <div className={styles.main}>
            {/* Meta row */}
            <div className={styles.metaRow}>
              {movie.rating && (
                <span className={styles.ratingBadge}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="gold" stroke="gold" strokeWidth="1">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                  {movie.rating}
                  {movie.voteCount > 0 && <span className={styles.voteCount}>({movie.voteCount.toLocaleString()} votes)</span>}
                </span>
              )}
              {movie.year && <span className={styles.metaChip}>{movie.year}</span>}
              {movie.runtime && <span className={styles.metaChip}>{formatRuntime(movie.runtime)}</span>}
              {movie.contentRating && <span className={styles.metaChip}>{movie.contentRating}</span>}
            </div>

            {/* Genre pills */}
            {movie.genres?.length > 0 && (
              <div className={styles.genreRow}>
                {movie.genres.map((g) => (
                  <span key={g} className={styles.genrePill}>{g}</span>
                ))}
              </div>
            )}

            {/* Tabs */}
            <div className={styles.tabs}>
              {["overview", "cast", "details", ...(similar.length > 0 ? ["more"] : [])].map((t) => (
                <button
                  key={t}
                  className={`${styles.tab} ${activeTab === t ? styles.activeTab : ""}`}
                  onClick={() => setActiveTab(t)}
                >
                  {t === "more" ? "More Like This" : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            {/* Tab: Overview */}
            {activeTab === "overview" && (
              <div className={styles.tabContent}>
                {movie.overview && <p className={styles.overview}>{movie.overview}</p>}
                {movie.keywords?.length > 0 && (
                  <div className={styles.keywords}>
                    {movie.keywords.map((k) => (
                      <span key={k} className={styles.keyword}>{k}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Cast */}
            {activeTab === "cast" && (
              <div className={styles.tabContent}>
                {movie.cast?.length > 0 ? (
                  <>
                    <h4 className={styles.subheading}>Cast</h4>
                    <div className={styles.castGrid}>
                      {movie.cast.map((person) => (
                        <CastCard
                          key={person.id}
                          person={person}
                          onClick={() => onPersonSelect(person.id)}
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <p className={styles.noData}>No cast information available.</p>
                )}

                {movie.crew?.length > 0 && (
                  <>
                    <h4 className={styles.subheading} style={{ marginTop: 28 }}>Crew</h4>
                    <div className={styles.crewGrid}>
                      {movie.crew.map((person, i) => (
                        <button
                          key={`${person.id}-${person.job}-${i}`}
                          className={styles.crewItem}
                          onClick={() => onPersonSelect(person.id)}
                        >
                          {person.profile ? (
                            <img src={person.profile} alt={person.name} className={styles.crewPhoto} />
                          ) : (
                            <div className={styles.crewPhotoFallback}>{person.name?.[0]}</div>
                          )}
                          <div className={styles.crewInfo}>
                            <span className={styles.crewName}>{person.name}</span>
                            <span className={styles.crewJob}>{person.job}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Tab: Details */}
            {activeTab === "details" && (
              <div className={styles.tabContent}>
                <div className={styles.detailsList}>
                  {director && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Director</span>
                      <button className={styles.detailLink} onClick={() => onPersonSelect(director.id)}>
                        {director.name}
                      </button>
                    </div>
                  )}
                  {uniqueWriters.length > 0 && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Writers</span>
                      <span className={styles.detailValue}>
                        {uniqueWriters.map((w, i) => (
                          <React.Fragment key={w.id}>
                            <button className={styles.detailLink} onClick={() => onPersonSelect(w.id)}>
                              {w.name}
                            </button>
                            {i < uniqueWriters.length - 1 && ", "}
                          </React.Fragment>
                        ))}
                      </span>
                    </div>
                  )}
                  {dp && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Cinematography</span>
                      <button className={styles.detailLink} onClick={() => onPersonSelect(dp.id)}>
                        {dp.name}
                      </button>
                    </div>
                  )}
                  {composer && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Music</span>
                      <button className={styles.detailLink} onClick={() => onPersonSelect(composer.id)}>
                        {composer.name}
                      </button>
                    </div>
                  )}
                  {movie.releaseDate && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Release Date</span>
                      <span className={styles.detailValue}>{new Date(movie.releaseDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
                    </div>
                  )}
                  {movie.productionCountries?.length > 0 && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Country</span>
                      <span className={styles.detailValue}>{movie.productionCountries.join(", ")}</span>
                    </div>
                  )}
                  {movie.originalLanguage && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Language</span>
                      <span className={styles.detailValue}>{movie.originalLanguage.toUpperCase()}</span>
                    </div>
                  )}
                  {movie.spokenLanguages?.length > 0 && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Spoken Languages</span>
                      <span className={styles.detailValue}>{movie.spokenLanguages.join(", ")}</span>
                    </div>
                  )}
                  {budget && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Budget</span>
                      <span className={styles.detailValue}>{budget}</span>
                    </div>
                  )}
                  {revenue && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Box Office</span>
                      <span className={styles.detailValue}>{revenue}</span>
                    </div>
                  )}
                  {movie.status && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Status</span>
                      <span className={styles.detailValue}>{movie.status}</span>
                    </div>
                  )}
                  {movie.collection && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Collection</span>
                      <span className={styles.detailValue}>{movie.collection.name}</span>
                    </div>
                  )}
                  {movie.tmdbId && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>TMDB</span>
                      <a
                        href={`https://www.themoviedb.org/movie/${movie.tmdbId}`}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.detailLink}
                      >
                        View on TMDB ↗
                      </a>
                    </div>
                  )}
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>File</span>
                    <span className={styles.detailValueMono}>{movie.filename}</span>
                  </div>
                  {movie.size && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>File Size</span>
                      <span className={styles.detailValue}>{(movie.size / 1e9).toFixed(2)} GB</span>
                    </div>
                  )}
                </div>

                {/* Trailers list */}
                {movie.trailers?.length > 0 && (
                  <div className={styles.trailerList}>
                    <h4 className={styles.subheading}>Videos</h4>
                    {movie.trailers.map((t) => (
                      <a
                        key={t.key}
                        href={`https://www.youtube.com/watch?v=${t.key}`}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.trailerLink}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/>
                        </svg>
                        <span>{t.name}</span>
                        <span className={styles.trailerType}>{t.type}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab: More Like This */}
            {activeTab === "more" && (
              <div className={styles.tabContent}>
                {similar.length === 0 ? (
                  <p className={styles.noData}>No similar movies found in your library.</p>
                ) : (
                  <div className={styles.simGrid}>
                    {similar.map((m) => (
                      <SimilarCard key={m.id} movie={m} onSelect={onMovieSelect} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className={styles.sidebar}>
            {movie.poster && (
              <img src={movie.poster} alt={movie.title} className={styles.sidebarPoster} />
            )}
            <div className={styles.sidebarInfo}>
              {director && (
                <div className={styles.sideRow}>
                  <span className={styles.sideLabel}>Director</span>
                  <button className={styles.sideLink} onClick={() => onPersonSelect(director.id)}>
                    {director.name}
                  </button>
                </div>
              )}
              {movie.cast?.slice(0, 5).length > 0 && (
                <div className={styles.sideRow}>
                  <span className={styles.sideLabel}>Starring</span>
                  <span className={styles.sideValue}>
                    {movie.cast.slice(0, 5).map((c) => c.name).join(", ")}
                  </span>
                </div>
              )}
              {movie.genres?.length > 0 && (
                <div className={styles.sideRow}>
                  <span className={styles.sideLabel}>Genres</span>
                  <span className={styles.sideValue}>{movie.genres.join(", ")}</span>
                </div>
              )}
              {movie.originalTitle && movie.originalTitle !== movie.title && (
                <div className={styles.sideRow}>
                  <span className={styles.sideLabel}>Original Title</span>
                  <span className={styles.sideValue}>{movie.originalTitle}</span>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
