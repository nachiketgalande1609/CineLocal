const express = require("express");
const router = express.Router();
const { getMovies, getMovie, forceRefreshAll, forceRefreshOne } = require("../services/scanner");

router.get("/", (req, res) => {
  const movies = getMovies();
  const { q } = req.query;

  if (q) {
    const query = q.toLowerCase();
    const filtered = movies.filter(
      (m) =>
        m.title?.toLowerCase().includes(query) ||
        m.overview?.toLowerCase().includes(query) ||
        m.filename?.toLowerCase().includes(query)
    );
    return res.json(filtered);
  }

  res.json(movies);
});

// Force re-enrich all movies (clears enriched flag so next scan re-fetches from TMDB)
router.post("/refresh", (req, res) => {
  const count = forceRefreshAll();
  res.json({ queued: count, message: `Re-enriching ${count} movies in the background…` });
});

// Force re-enrich a single movie
router.post("/:id/refresh", (req, res) => {
  const ok = forceRefreshOne(req.params.id);
  if (!ok) return res.status(404).json({ error: "Movie not found" });
  res.json({ queued: true });
});

router.get("/:id", (req, res) => {
  const movie = getMovie(req.params.id);
  if (!movie) return res.status(404).json({ error: "Movie not found" });
  res.json(movie);
});

module.exports = router;
