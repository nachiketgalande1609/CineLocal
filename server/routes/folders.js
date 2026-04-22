const express = require("express");
const router = express.Router();
const fs = require("fs");
const crypto = require("crypto");
const { configCache } = require("../services/cache");
const { rescanFolder, syncAllFolders, removeFolderMovies } = require("../services/scanner");

router.get("/", (req, res) => {
  res.json(configCache.getFolders());
});

router.post("/", (req, res) => {
  const { path: folderPath } = req.body;
  if (!folderPath) return res.status(400).json({ error: "path is required" });

  if (!fs.existsSync(folderPath)) {
    return res.status(400).json({ error: "Folder does not exist" });
  }

  const folder = {
    id: crypto.createHash("md5").update(folderPath).digest("hex"),
    path: folderPath,
    addedAt: new Date().toISOString(),
  };

  configCache.addFolder(folder);
  rescanFolder(folderPath);
  res.status(201).json(folder);
});

router.post("/sync", (req, res) => {
  const count = syncAllFolders();
  if (count === 0) return res.json({ message: "No folders configured" });
  res.json({ message: `Scanning ${count} folder${count !== 1 ? "s" : ""} for new files…` });
});

router.delete("/:id", (req, res) => {
  const folder = configCache.getFolders().find((f) => f.id === req.params.id);
  if (!folder) return res.status(404).json({ error: "Folder not found" });

  removeFolderMovies(folder.path);
  configCache.removeFolder(req.params.id);
  res.json({ success: true });
});

module.exports = router;
