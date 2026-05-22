import express from "express";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import multer from "multer";
import sharp from "sharp";

const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024;
const WEBP_QUALITY = 82;
const WEBM_CRF = 34;
const WEBM_MAX_WIDTH = 1920;
const FFMPEG_BIN = process.env.FFMPEG_PATH || "ffmpeg";
const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

function buildFilename(originalName = "") {
  const ext = path.extname(String(originalName)).toLowerCase();
  const safeExt = ext || ".bin";
  return `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`;
}

function buildWebpFilename(filename = "") {
  const ext = path.extname(filename);
  const base = path.basename(filename, ext);
  return `${base}-compressed.webp`;
}

function buildWebmFilename(filename = "") {
  const ext = path.extname(filename);
  const base = path.basename(filename, ext);
  return `${base}-compressed.webm`;
}

async function safeUnlink(filePath) {
  try {
    await fs.promises.unlink(filePath);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

async function compressImageToWebp(file) {
  const webpFilename = buildWebpFilename(file.filename);
  const webpPath = path.join(file.destination, webpFilename);

  await sharp(file.path, { animated: true })
    .rotate()
    .webp({
      quality: WEBP_QUALITY,
      effort: 5,
    })
    .toFile(webpPath);

  const webpStats = await fs.promises.stat(webpPath);

  await safeUnlink(file.path);

  return {
    filename: webpFilename,
    mimetype: "image/webp",
    size: webpStats.size,
    destination: file.destination,
    path: webpPath,
  };
}

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(FFMPEG_BIN, args, {
      windowsHide: true,
    });

    let stderr = "";

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      if (error?.code === "ENOENT") {
        error.message = "ffmpeg is not installed or FFMPEG_PATH is invalid";
      }

      reject(error);
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      const error = new Error(stderr.trim() || "Failed to compress video to WebM");
      error.status = 400;
      reject(error);
    });
  });
}

async function compressVideoToWebm(file) {
  const webmFilename = buildWebmFilename(file.filename);
  const webmPath = path.join(file.destination, webmFilename);

  try {
    await runFfmpeg([
      "-y",
      "-i",
      file.path,
      "-vf",
      `scale='min(${WEBM_MAX_WIDTH},trunc(iw/2)*2)':-2`,
      "-c:v",
      "libvpx-vp9",
      "-crf",
      String(WEBM_CRF),
      "-b:v",
      "0",
      "-deadline",
      "good",
      "-cpu-used",
      "4",
      "-row-mt",
      "1",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "libopus",
      "-b:a",
      "96k",
      webmPath,
    ]);
  } catch (error) {
    await safeUnlink(webmPath);
    throw error;
  }

  const webmStats = await fs.promises.stat(webmPath);

  await safeUnlink(file.path);

  return {
    filename: webmFilename,
    mimetype: "video/webm",
    size: webmStats.size,
    destination: file.destination,
    path: webmPath,
  };
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => cb(null, buildFilename(file.originalname)),
});

const uploadImage = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
  },
  fileFilter: (_req, file, cb) => {
    if (String(file.mimetype || "").startsWith("image/")) {
      cb(null, true);
      return;
    }

    const error = new Error("Only image files are allowed");
    error.status = 400;
    cb(error);
  },
});

const uploadVideo = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
  },
  fileFilter: (_req, file, cb) => {
    if (String(file.mimetype || "").startsWith("video/")) {
      cb(null, true);
      return;
    }

    const error = new Error("Only video files are allowed");
    error.status = 400;
    cb(error);
  },
});

export function registerUploads(api) {
  const router = express.Router();

  router.post("/images", (req, res, next) => {
    uploadImage.single("file")(req, res, async (error) => {
      if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
        error.status = 413;
        error.message = "File size exceeds 500 MB limit";
        return next(error);
      }

      if (error) {
        return next(error);
      }

      if (!req.file) {
        return res.status(400).json({
          message: "file is required",
          code: "BAD_REQUEST",
        });
      }

      let compressedFile;

      try {
        compressedFile = await compressImageToWebp(req.file);
      } catch (compressionError) {
        await safeUnlink(req.file.path);
        compressionError.status = compressionError.status || 400;
        compressionError.message =
          compressionError.message || "Failed to compress image to WebP";
        return next(compressionError);
      }

      const fileUrl = `https://maloeatelier.com/uploads/${compressedFile.filename}`;

      res.status(201).json({
        ok: true,
        file: {
          filename: compressedFile.filename,
          originalname: req.file.originalname,
          originalMimetype: req.file.mimetype,
          mimetype: compressedFile.mimetype,
          size: compressedFile.size,
          originalSize: req.file.size,
          destination: compressedFile.destination,
          path: compressedFile.path,
          url: fileUrl,
        },
      });
    });
  });

  router.post("/videos", (req, res, next) => {
    uploadVideo.single("file")(req, res, async (error) => {
      if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
        error.status = 413;
        error.message = "File size exceeds 500 MB limit";
        return next(error);
      }

      if (error) {
        return next(error);
      }

      if (!req.file) {
        return res.status(400).json({
          message: "file is required",
          code: "BAD_REQUEST",
        });
      }

      let compressedFile;

      try {
        compressedFile = await compressVideoToWebm(req.file);
      } catch (compressionError) {
        await safeUnlink(req.file.path);
        compressionError.status = compressionError.status || 400;
        compressionError.message =
          compressionError.message || "Failed to compress video to WebM";
        return next(compressionError);
      }

      const fileUrl = `https://maloeatelier.com/uploads/${compressedFile.filename}`;

      res.status(201).json({
        ok: true,
        file: {
          filename: compressedFile.filename,
          originalname: req.file.originalname,
          originalMimetype: req.file.mimetype,
          mimetype: compressedFile.mimetype,
          size: compressedFile.size,
          originalSize: req.file.size,
          destination: compressedFile.destination,
          path: compressedFile.path,
          url: fileUrl,
        },
      });
    });
  });

  api.use("/admin/uploads", router);
}
