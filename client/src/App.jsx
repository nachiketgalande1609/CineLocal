import React, { useState, useEffect, useRef } from "react";
import { Routes, Route } from "react-router-dom";
import axios from "axios";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import PlayerPage from "./pages/PlayerPage";
import SettingsPage from "./pages/SettingsPage";
import WatchlistPage from "./pages/WatchlistPage";
import MovieDetailModal from "./components/MovieDetailModal";
import PersonModal from "./components/PersonModal";
import { ToastProvider, useToast } from "./components/Toast";
import { useWatchlist } from "./hooks/useWatchlist";
import { getAllProgress } from "./hooks/useWatchProgress";

function AppContent() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncQueued, setSyncQueued] = useState(0);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [selectedPersonId, setSelectedPersonId] = useState(null);
  const syncPollRef = useRef(null);
  const { list: watchlist, toggle: toggleWatchlist, has: inWatchlist } = useWatchlist();
  const toast = useToast();

  const fetchMovies = async (silent = false) => {
    try {
      const res = await axios.get("/api/movies");
      setMovies(res.data);
    } catch (err) {
      console.error("Failed to fetch movies:", err);
      if (!silent) toast("Failed to load movies", "error");
    } finally {
      setLoading(false);
    }
  };

  const startSyncPolling = () => {
    if (syncPollRef.current) clearInterval(syncPollRef.current);
    setSyncing(true);

    const doPoll = async () => {
      try {
        const [statusRes, moviesRes] = await Promise.all([
          axios.get("/api/status"),
          axios.get("/api/movies"),
        ]);
        setMovies(moviesRes.data);
        setSyncQueued(statusRes.data.queued || 0);
        if (!statusRes.data.scanning) {
          clearInterval(syncPollRef.current);
          syncPollRef.current = null;
          setSyncing(false);
        }
      } catch {
        clearInterval(syncPollRef.current);
        syncPollRef.current = null;
        setSyncing(false);
      }
    };

    doPoll();
    syncPollRef.current = setInterval(doPoll, 2000);
  };

  useEffect(() => {
    fetchMovies();
    const interval = setInterval(() => fetchMovies(true), 30000);
    return () => {
      clearInterval(interval);
      if (syncPollRef.current) clearInterval(syncPollRef.current);
    };
  }, []);

  const watchProgress = getAllProgress(movies.map((m) => m.id));

  function handleMovieSelect(movie) {
    setSelectedMovie(movie);
    setSelectedPersonId(null);
  }

  function handlePersonSelect(personId) {
    setSelectedPersonId(personId);
  }

  function handleWatchlistToggle(id) {
    const wasIn = inWatchlist(id);
    toggleWatchlist(id);
    const movie = movies.find((m) => m.id === id);
    const title = movie?.title || "Movie";
    toast(wasIn ? `Removed "${title}" from My List` : `Added "${title}" to My List`, "success", 2500);
  }

  return (
    <>
      <Navbar movies={movies} onMovieSelect={handleMovieSelect} watchlistCount={watchlist.length} />

      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              movies={movies}
              loading={loading}
              syncing={syncing}
              syncQueued={syncQueued}
              onMovieSelect={handleMovieSelect}
              watchlist={watchlist}
              inWatchlist={inWatchlist}
              onWatchlistToggle={handleWatchlistToggle}
              watchProgress={watchProgress}
            />
          }
        />
        <Route path="/watch/:id" element={<PlayerPage />} />
        <Route
          path="/watchlist"
          element={
            <WatchlistPage
              movies={movies}
              watchlist={watchlist}
              inWatchlist={inWatchlist}
              onWatchlistToggle={handleWatchlistToggle}
              onMovieSelect={handleMovieSelect}
              watchProgress={watchProgress}
            />
          }
        />
        <Route
          path="/settings"
          element={<SettingsPage onFoldersChange={() => fetchMovies(true)} onFolderAdded={startSyncPolling} />}
        />
      </Routes>

      {selectedMovie && (
        <MovieDetailModal
          movie={selectedMovie}
          allMovies={movies}
          onClose={() => setSelectedMovie(null)}
          onPersonSelect={(id) => setSelectedPersonId(id)}
          onMovieSelect={handleMovieSelect}
          inWatchlist={inWatchlist(selectedMovie.id)}
          onWatchlistToggle={handleWatchlistToggle}
          watchProgress={watchProgress}
        />
      )}

      {selectedPersonId && (
        <PersonModal
          personId={selectedPersonId}
          allMovies={movies}
          onClose={() => setSelectedPersonId(null)}
          onMovieSelect={handleMovieSelect}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
