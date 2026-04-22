const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const { getMovie } = require("../services/scanner");
const { configCache } = require("../services/cache");

function isPathSafe(filePath) {
  const resolvedPath = path.resolve(filePath);
  const folders = configCache.getFolders();

  // Allow if the file is within any configured folder
  return folders.some((folder) => {
    const resolvedFolder = path.resolve(folder.path);
    return resolvedPath.startsWith(resolvedFolder + path.sep) ||
           resolvedPath.startsWith(resolvedFolder);
  });
}

const MIME_TYPES = {
  ".mp4": "video/mp4",
  ".mkv": "video/x-matroska",
  ".avi": "video/x-msvideo",
  ".mov": "video/quicktime",
  ".wmv": "video/x-ms-wmv",
  ".m4v": "video/mp4",
  ".webm": "video/webm",
};

router.get("/:id", (req, res) => {
  const movie = getMovie(req.params.id);
  if (!movie) return res.status(404).json({ error: "Movie not found" });

  const filePath = movie.filePath;

  if (!isPathSafe(filePath)) {
    return res.status(403).json({ error: "Access denied" });
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found on disk" });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const ext = path.extname(filePath).toLowerCase();
  const mimeType = MIME_TYPES[ext] || "video/mp4";

  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (start >= fileSize || end >= fileSize) {
      return res.status(416).set("Content-Range", `bytes */${fileSize}`).end();
    }

    const chunkSize = end - start + 1;
    const stream = fs.createReadStream(filePath, { start, end });

    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunkSize,
      "Content-Type": mimeType,
    });

    stream.pipe(res);
  } else {
    res.writeHead(200, {
      "Content-Length": fileSize,
      "Content-Type": mimeType,
      "Accept-Ranges": "bytes",
    });
    fs.createReadStream(filePath).pipe(res);
  }
});

module.exports = router;
