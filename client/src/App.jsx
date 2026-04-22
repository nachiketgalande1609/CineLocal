import React, { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import axios from "axios";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import PlayerPage from "./pages/PlayerPage";
import SettingsPage from "./pages/SettingsPage";
import MovieDetailModal from "./components/MovieDetailModal";
import PersonModal from "./components/PersonModal";
import { ToastProvider, useToast } from "./components/Toast";
import { useWatchlist } from "./hooks/useWatchlist";
import { getAllProgress } from "./hooks/useWatchProgress";

function AppContent() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [selectedPersonId, setSelectedPersonId] = useState(null);
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

  useEffect(() => {
    fetchMovies();
    const interval = setInterval(() => fetchMovies(true), 30000);
    return () => clearInterval(interval);
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
      <Navbar movies={movies} onMovieSelect={handleMovieSelect} />

      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              movies={movies}
              loading={loading}
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
          path="/settings"
          element={<SettingsPage onFoldersChange={() => fetchMovies(true)} />}
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
