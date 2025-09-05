import express from "express";
import fs from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";
import youtubedl from "youtube-dl-exec";
import ffmpegPath from "ffmpeg-static";
import cors from "cors";

const app = express();

// Allow requests from anywhere (or restrict to your frontend URL)
app.use(cors()); 
const PORT = process.env.PORT || 3000;

// Helper: clean filenames
function sanitizeFilename(name) {
  return name
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]/g, "")
    .replace(/[/\\?%*:|"<>]/g, "-")
    .replace(/\s+/g, "_")
    .replace(/-+/g, "-")
    .trim();
}

// MP3 route
app.get("/ytmp3", async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: "Missing ?url parameter" });

    const tmpDir = path.join(os.tmpdir(), crypto.randomUUID());
    fs.mkdirSync(tmpDir, { recursive: true });

    const outputPath = path.join(tmpDir, "%(title)s.%(ext)s");

    await youtubedl(url, {
      extractAudio: true,
      audioFormat: "mp3",
      audioQuality: "0",
      output: outputPath,
      ffmpegLocation: ffmpegPath,
      addMetadata: true,
    });

    const files = fs.readdirSync(tmpDir);
    const mp3File = files.find((f) => f.endsWith(".mp3"));
    if (!mp3File) throw new Error("MP3 not generated");

    const filePath = path.join(tmpDir, mp3File);
    const fileBuffer = fs.readFileSync(filePath);
    fs.rmSync(tmpDir, { recursive: true, force: true });

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${sanitizeFilename(mp3File)}"`
    );
    res.send(fileBuffer);
  } catch (err) {
    console.error("ytmp3 error:", err);
    res.status(500).json({ error: err.message });
  }
});

// MP4 route
app.get("/ytmp4", async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: "Missing ?url parameter" });

    const tmpDir = path.join(os.tmpdir(), crypto.randomUUID());
    fs.mkdirSync(tmpDir, { recursive: true });

    const outputPath = path.join(tmpDir, "%(title)s.%(ext)s");

    await youtubedl(url, {
      format: "mp4",
      output: outputPath,
      ffmpegLocation: ffmpegPath,
    });

    const files = fs.readdirSync(tmpDir);
    const mp4File = files.find((f) => f.endsWith(".mp4"));
    if (!mp4File) throw new Error("MP4 not generated");

    const filePath = path.join(tmpDir, mp4File);
    const fileBuffer = fs.readFileSync(filePath);
    fs.rmSync(tmpDir, { recursive: true, force: true });

    res.setHeader("Content-Type", "video/mp4");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${sanitizeFilename(mp4File)}"`
    );
    res.send(fileBuffer);
  } catch (err) {
    console.error("ytmp4 error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
