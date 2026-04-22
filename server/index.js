require("dotenv").config();
const express = require("express");
const cors = require("cors");
const compression = require("compression");
const path = require("path");

const moviesRouter = require("./routes/movies");
const streamRouter = require("./routes/stream");
const foldersRouter = require("./routes/folders");
const personRouter = require("./routes/person");
const statsRouter = require("./routes/stats");
const { initScanner, getScanStatus } = require("./services/scanner");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(compression());
app.use(cors());
app.use(express.json());

// API routes
app.get("/api/status", (req, res) => {
  res.json({ tmdbConfigured: !!process.env.TMDB_API_KEY, ...getScanStatus() });
});
app.use("/api/movies", moviesRouter);
app.use("/api/stream", streamRouter);
app.use("/api/folders", foldersRouter);
app.use("/api/person", personRouter);
app.use("/api/stats", statsRouter);

// Serve React build in production
const clientBuild = path.join(__dirname, "../client/dist");
if (require("fs").existsSync(clientBuild)) {
  app.use(express.static(clientBuild, { maxAge: "1h", etag: true }));
  app.get("*", (req, res) => {
    res.sendFile(path.join(clientBuild, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`CinéLocal server running on http://localhost:${PORT}`);
  console.log(`TMDB API Key: ${process.env.TMDB_API_KEY ? "✓ Set" : "✗ Not set (metadata enrichment disabled)"}`);
  initScanner();
});
