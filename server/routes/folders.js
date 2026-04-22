const express = require("express");
const router = express.Router();
const fs = require("fs");
const crypto = require("crypto");
const { configCache } = require("../services/cache");
const { rescanFolder } = require("../services/scanner");

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

router.delete("/:id", (req, res) => {
  configCache.removeFolder(req.params.id);
  res.json({ success: true });
});

module.exports = router;
