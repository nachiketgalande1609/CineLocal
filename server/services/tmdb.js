const axios = require("axios");

const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE = "https://image.tmdb.org/t/p";

function getApiKey() {
  const key = process.env.TMDB_API_KEY;
  if (!key) throw new Error("TMDB_API_KEY environment variable is not set");
  return key;
}

function cleanTitle(filename) {
  const noExt = filename.replace(/\.[^.]+$/, "");
  let name = noExt.replace(/[\._]/g, " ");

  // Truncate at the first technical marker so any file naming scheme works.
  // Years must be preceded by a space so titles like "1917" or "2001: A Space Odyssey" are preserved.
  const cutMatch = name.match(
    /\s[\[(]?(?:(?:19|20)\d{2}|1080p?|720p?|480p?|4k|2160p?|bluray|blu[- ]?ray|dvdrip|webrip|web[- ]?dl|hdtv|x264|x265|hevc|avc|xvid|divx|aac|ac3|dts|hdr|sdr|remux|extended|theatrical|remastered|proper|repack|yify|yts|rarbg|eztv)\b/i
  );
  if (cutMatch && cutMatch.index > 0) name = name.substring(0, cutMatch.index);

  return name.replace(/\s+/g, " ").trim();
}

function extractYear(filename) {
  const match = filename.match(/\b(19|20)\d{2}\b/);
  return match ? parseInt(match[0]) : null;
}

async function searchMovie(filename) {
  const apiKey = getApiKey();
  const title = cleanTitle(filename);
  const year = extractYear(filename);
  const params = { api_key: apiKey, query: title, language: "en-US" };
  if (year) params.year = year;

  try {
    const res = await axios.get(`${BASE_URL}/search/movie`, { params });
    if (res.data.results?.length > 0) return res.data.results[0];
    if (year) {
      delete params.year;
      const retry = await axios.get(`${BASE_URL}/search/movie`, { params });
      return retry.data.results?.[0] || null;
    }
    return null;
  } catch (err) {
    if (err.message.includes("TMDB_API_KEY")) throw err;
    console.error(`TMDB search failed for "${title}":`, err.message);
    return null;
  }
}

async function fetchMovieDetails(tmdbId) {
  const apiKey = getApiKey();
  try {
    const res = await axios.get(`${BASE_URL}/movie/${tmdbId}`, {
      params: {
        api_key: apiKey,
        append_to_response: "credits,videos,keywords,release_dates",
      },
    });
    return res.data;
  } catch (err) {
    console.error(`TMDB details failed for id ${tmdbId}:`, err.message);
    return null;
  }
}

function extractContentRating(data) {
  try {
    const us = data.release_dates?.results?.find((r) => r.iso_3166_1 === "US");
    if (us) {
      const rated = us.release_dates?.find((d) => d.certification)?.certification;
      if (rated) return rated;
    }
    // Fallback: first available rating
    for (const country of data.release_dates?.results || []) {
      const cert = country.release_dates?.find((d) => d.certification)?.certification;
      if (cert) return cert;
    }
  } catch {}
  return null;
}

async function enrichMovie(filename) {
  try {
    const searchResult = await searchMovie(filename);
    if (!searchResult) return buildFallback(filename);

    const data = await fetchMovieDetails(searchResult.id);
    const src = data || searchResult;

    // Full cast with profile photos (up to 20)
    const cast = (src.credits?.cast || []).slice(0, 20).map((c) => ({
      id: c.id,
      name: c.name,
      character: c.character || "",
      profile: c.profile_path ? `${IMAGE_BASE}/w185${c.profile_path}` : null,
      profileLarge: c.profile_path ? `${IMAGE_BASE}/h632${c.profile_path}` : null,
      order: c.order,
    }));

    // Key crew: director, writers, DP, composer
    const CREW_JOBS = ["Director", "Writer", "Screenplay", "Story", "Director of Photography", "Original Music Composer", "Producer", "Executive Producer"];
    const crew = (src.credits?.crew || [])
      .filter((c) => CREW_JOBS.includes(c.job))
      .reduce((acc, c) => {
        if (!acc.find((x) => x.id === c.id && x.job === c.job)) acc.push(c);
        return acc;
      }, [])
      .slice(0, 15)
      .map((c) => ({
        id: c.id,
        name: c.name,
        job: c.job,
        department: c.department,
        profile: c.profile_path ? `${IMAGE_BASE}/w185${c.profile_path}` : null,
      }));

    // YouTube trailers
    const trailers = (src.videos?.results || [])
      .filter((v) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser"))
      .sort((a, b) => (a.type === "Trailer" ? -1 : 1))
      .slice(0, 3)
      .map((v) => ({ key: v.key, name: v.name, type: v.type }));

    // Keywords
    const keywords = (src.keywords?.keywords || []).slice(0, 15).map((k) => k.name);

    return {
      tmdbId: src.id,
      title: src.title || cleanTitle(filename),
      originalTitle: src.original_title,
      overview: src.overview || "",
      releaseDate: src.release_date || "",
      year: src.release_date ? parseInt(src.release_date.split("-")[0]) : null,
      rating: src.vote_average ? Math.round(src.vote_average * 10) / 10 : null,
      voteCount: src.vote_count || 0,
      popularity: src.popularity || 0,
      genres: (src.genres || []).map((g) => g.name),
      poster: src.poster_path ? `${IMAGE_BASE}/w500${src.poster_path}` : null,
      posterOriginal: src.poster_path ? `${IMAGE_BASE}/original${src.poster_path}` : null,
      backdrop: src.backdrop_path ? `${IMAGE_BASE}/w1280${src.backdrop_path}` : null,
      backdropOriginal: src.backdrop_path ? `${IMAGE_BASE}/original${src.backdrop_path}` : null,
      cast,
      crew,
      trailers,
      keywords,
      runtime: src.runtime || null,
      tagline: src.tagline || "",
      budget: src.budget || 0,
      revenue: src.revenue || 0,
      originalLanguage: src.original_language || "",
      productionCountries: (src.production_countries || []).map((c) => c.name),
      spokenLanguages: (src.spoken_languages || []).map((l) => l.english_name),
      contentRating: extractContentRating(src),
      status: src.status || "",
      collection: src.belongs_to_collection
        ? { id: src.belongs_to_collection.id, name: src.belongs_to_collection.name }
        : null,
      enriched: true,
      enrichedAt: new Date().toISOString(),
      schemaVersion: 2,
    };
  } catch (err) {
    if (err.message.includes("TMDB_API_KEY")) throw err;
    console.error(`Enrichment failed for "${filename}":`, err.message);
    return buildFallback(filename);
  }
}

function buildFallback(filename) {
  return {
    tmdbId: null,
    title: cleanTitle(filename),
    overview: "",
    releaseDate: "",
    year: extractYear(filename),
    rating: null,
    voteCount: 0,
    genres: [],
    poster: null,
    backdrop: null,
    cast: [],
    crew: [],
    trailers: [],
    keywords: [],
    runtime: null,
    tagline: "",
    budget: 0,
    revenue: 0,
    enriched: false,
    enrichedAt: new Date().toISOString(),
  };
}

module.exports = { enrichMovie, cleanTitle };
