import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import styles from "./PersonModal.module.css";

function age(birthday, deathday) {
  if (!birthday) return null;
  const end = deathday ? new Date(deathday) : new Date();
  const born = new Date(birthday);
  let a = end.getFullYear() - born.getFullYear();
  const m = end.getMonth() - born.getMonth();
  if (m < 0 || (m === 0 && end.getDate() < born.getDate())) a--;
  return a;
}

function formatDate(str) {
  if (!str) return null;
  return new Date(str).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export default function PersonModal({ personId, allMovies, onClose }) {
  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bioExpanded, setBioExpanded] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!personId) return;
    setLoading(true);
    setBioExpanded(false);
    axios.get(`/api/person/${personId}`)
      .then((r) => setPerson(r.data))
      .catch(() => setPerson(null))
      .finally(() => setLoading(false));
  }, [personId]);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Movies from local library that this person appeared in
  const libraryMovies = allMovies.filter((m) =>
    m.cast?.some((c) => c.id === personId) ||
    m.crew?.some((c) => c.id === personId)
  );

  const BIO_LIMIT = 400;

  return (
    <div
      className={styles.overlay}
      ref={overlayRef}
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        {loading ? (
          <div className={styles.loading}><div className={styles.spinner} /></div>
        ) : !person ? (
          <div className={styles.loading}><p>Could not load person details.</p></div>
        ) : (
          <div className={styles.content}>
            {/* Header */}
            <div className={styles.header}>
              <div className={styles.profileWrap}>
                {person.profile ? (
                  <img src={person.profile} alt={person.name} className={styles.profileImg} />
                ) : (
                  <div className={styles.profileFallback}>{person.name?.[0]}</div>
                )}
              </div>
              <div className={styles.headerInfo}>
                <h2 className={styles.name}>{person.name}</h2>
                {person.alsoKnownAs?.length > 0 && (
                  <p className={styles.akas}>Also known as: {person.alsoKnownAs.slice(0, 2).join(", ")}</p>
                )}
                <div className={styles.tags}>
                  <span className={styles.tag}>{person.knownFor}</span>
                  {person.gender && <span className={styles.tag}>{person.gender}</span>}
                </div>
                <div className={styles.vitals}>
                  {person.birthday && (
                    <div className={styles.vitalItem}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      <span>
                        {formatDate(person.birthday)}
                        {!person.deathday && age(person.birthday) && ` (age ${age(person.birthday)})`}
                      </span>
                    </div>
                  )}
                  {person.deathday && (
                    <div className={styles.vitalItem}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 22V12M12 12C12 8 8 6 8 2M12 12C12 8 16 6 16 2"/>
                      </svg>
                      <span>
                        {formatDate(person.deathday)}
                        {age(person.birthday, person.deathday) && ` (age ${age(person.birthday, person.deathday)})`}
                      </span>
                    </div>
                  )}
                  {person.placeOfBirth && (
                    <div className={styles.vitalItem}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                      <span>{person.placeOfBirth}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Photo gallery */}
            {person.profiles?.length > 1 && (
              <div className={styles.photos}>
                {person.profiles.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`${person.name} photo ${i + 1}`}
                    className={`${styles.thumbPhoto} ${selectedPhoto === url ? styles.selected : ""}`}
                    onClick={() => setSelectedPhoto(selectedPhoto === url ? null : url)}
                    loading="lazy"
                  />
                ))}
              </div>
            )}

            {/* Selected photo enlarged */}
            {selectedPhoto && (
              <div className={styles.enlargedPhoto}>
                <img src={selectedPhoto} alt={person.name} />
                <button className={styles.closePhoto} onClick={() => setSelectedPhoto(null)}>✕</button>
              </div>
            )}

            {/* Biography */}
            {person.biography && (
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Biography</h3>
                <p className={styles.bio}>
                  {bioExpanded || person.biography.length <= BIO_LIMIT
                    ? person.biography
                    : person.biography.slice(0, BIO_LIMIT) + "…"}
                </p>
                {person.biography.length > BIO_LIMIT && (
                  <button className={styles.expandBtn} onClick={() => setBioExpanded(!bioExpanded)}>
                    {bioExpanded ? "Show less" : "Read more"}
                  </button>
                )}
              </section>
            )}

            {/* In your library */}
            {libraryMovies.length > 0 && (
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>In Your Library</h3>
                <div className={styles.movieGrid}>
                  {libraryMovies.map((m) => (
                    <div key={m.id} className={styles.movieThumb}>
                      {m.poster ? (
                        <img src={m.poster} alt={m.title} loading="lazy" />
                      ) : (
                        <div className={styles.movieThumbFallback}>{m.title?.[0]}</div>
                      )}
                      <span>{m.title}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Known for (TMDB filmography) */}
            {person.knownMovies?.length > 0 && (
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  {person.knownFor === "Directing" ? "Directed" : "Known For"}
                </h3>
                <div className={styles.filmScroll}>
                  {(person.knownFor === "Directing" ? person.directedMovies : person.knownMovies).map((m) => (
                    <div key={`${m.tmdbId}-${m.title}`} className={styles.filmCard}>
                      {m.poster ? (
                        <img src={m.poster} alt={m.title} loading="lazy" />
                      ) : (
                        <div className={styles.filmFallback}>{m.title?.[0]}</div>
                      )}
                      <div className={styles.filmInfo}>
                        <span className={styles.filmTitle}>{m.title}</span>
                        {m.character && <span className={styles.filmCharacter}>{m.character}</span>}
                        {m.year && <span className={styles.filmYear}>{m.year}</span>}
                        {m.rating && (
                          <span className={styles.filmRating}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="gold" stroke="gold" strokeWidth="1">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                            </svg>
                            {m.rating}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
