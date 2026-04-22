const express = require("express");
const router = express.Router();
const { getMovies } = require("../services/scanner");

router.get("/", (req, res) => {
  const movies = getMovies();
  const enriched = movies.filter((m) => m.enriched);
  const totalRuntime = enriched.reduce((sum, m) => sum + (m.runtime || 0), 0);

  const genreCount = {};
  for (const m of enriched) {
    for (const g of m.genres || []) genreCount[g] = (genreCount[g] || 0) + 1;
  }
  const topGenres = Object.entries(genreCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }));

  const decades = {};
  for (const m of enriched) {
    if (m.year) {
      const d = Math.floor(m.year / 10) * 10;
      decades[d] = (decades[d] || 0) + 1;
    }
  }

  const ratedMovies = enriched.filter((m) => m.rating);
  const avgRating = ratedMovies.length
    ? (ratedMovies.reduce((s, m) => s + m.rating, 0) / ratedMovies.length).toFixed(1)
    : null;

  const totalSizeBytes = movies.reduce((s, m) => s + (m.size || 0), 0);

  res.json({
    total: movies.length,
    enriched: enriched.length,
    unenriched: movies.length - enriched.length,
    totalRuntime,
    totalRuntimeFormatted:
      totalRuntime >= 60
        ? `${Math.floor(totalRuntime / 60)}h ${totalRuntime % 60}m`
        : `${totalRuntime}m`,
    totalSizeGB: (totalSizeBytes / 1e9).toFixed(1),
    topGenres,
    decades: Object.entries(decades)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([decade, count]) => ({ decade: `${decade}s`, count })),
    averageRating: avgRating,
  });
});

module.exports = router;
