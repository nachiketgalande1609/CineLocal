import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import api from "../api";
import VideoPlayer from "../components/VideoPlayer";
import styles from "./PlayerPage.module.css";

export default function PlayerPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const startTime = parseInt(searchParams.get("t") || "0") || 0;

  useEffect(() => {
    api
      .get(`/api/movies/${id}`)
      .then((r) => setMovie(r.data))
      .catch(() => setError("Movie not found"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className={styles.center}>
        <div className={styles.spinner} />
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className={styles.center}>
        <p>{error || "Movie not found"}</p>
      </div>
    );
  }

  return <VideoPlayer movieId={id} movie={movie} startTime={startTime} />;
}
