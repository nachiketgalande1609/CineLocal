const express = require("express");
const router = express.Router();
const axios = require("axios");

const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE = "https://image.tmdb.org/t/p";

router.get("/:id", async (req, res) => {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) return res.status(503).json({ error: "TMDB API key not configured" });

  const id = parseInt(req.params.id);
  if (!id || isNaN(id)) return res.status(400).json({ error: "Invalid person id" });

  try {
    const { data } = await axios.get(`${BASE_URL}/person/${id}`, {
      params: { api_key: apiKey, append_to_response: "movie_credits,images,tagged_images" },
    });

    const knownMovies = (data.movie_credits?.cast || [])
      .filter((m) => m.poster_path && m.vote_count > 10)
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 24)
      .map((m) => ({
        tmdbId: m.id,
        title: m.title,
        character: m.character || "",
        year: m.release_date ? parseInt(m.release_date.split("-")[0]) : null,
        poster: m.poster_path ? `${IMAGE_BASE}/w185${m.poster_path}` : null,
        rating: m.vote_average ? Math.round(m.vote_average * 10) / 10 : null,
      }));

    const directedMovies = (data.movie_credits?.crew || [])
      .filter((m) => m.job === "Director" && m.poster_path)
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 12)
      .map((m) => ({
        tmdbId: m.id,
        title: m.title,
        year: m.release_date ? parseInt(m.release_date.split("-")[0]) : null,
        poster: m.poster_path ? `${IMAGE_BASE}/w185${m.poster_path}` : null,
      }));

    const profiles = (data.images?.profiles || [])
      .slice(0, 8)
      .map((img) => `${IMAGE_BASE}/w342${img.file_path}`);

    res.json({
      id: data.id,
      name: data.name,
      biography: data.biography || "",
      birthday: data.birthday || null,
      deathday: data.deathday || null,
      placeOfBirth: data.place_of_birth || null,
      knownFor: data.known_for_department || "Acting",
      popularity: data.popularity,
      profile: data.profile_path ? `${IMAGE_BASE}/w342${data.profile_path}` : null,
      profileLarge: data.profile_path ? `${IMAGE_BASE}/h632${data.profile_path}` : null,
      gender: data.gender === 1 ? "Female" : data.gender === 2 ? "Male" : null,
      homepage: data.homepage || null,
      alsoKnownAs: data.also_known_as?.slice(0, 4) || [],
      knownMovies,
      directedMovies,
      profiles,
    });
  } catch (err) {
    console.error(`Person fetch failed for id ${req.params.id}:`, err.message);
    res.status(500).json({ error: "Failed to fetch person details" });
  }
});

module.exports = router;
