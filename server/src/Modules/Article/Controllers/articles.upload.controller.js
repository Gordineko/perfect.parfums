// import path from "path";
// import multer from "multer";
// import express from "express";
// import { ensureAuth, ensurePermission } from "../../../Common/Infrastructure/http/auth-mw.js";

// // локальная папка для аплоадов
// const UPLOAD_DIR = path.resolve("uploads");

// // конфигурация multer
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, UPLOAD_DIR),
//   filename: (req, file, cb) => {
//     const ext = path.extname(file.originalname || "").toLowerCase();
//     const base = path.basename(file.originalname || "", ext).replace(/[^\p{L}\p{N}]+/gu, "-");
//     cb(null, `${Date.now()}-${base}${ext}`);
//   },
// });
// const fileFilter = (_req, file, cb) => {
//   const ok = /^image\/(png|jpe?g|webp|gif)$/i.test(file.mimetype);
//   cb(null, ok);
// };
// const upload = multer({
//   storage,
//   fileFilter,
//   limits: { fileSize: 5 * 1024 * 1024 * 1024 },
// });

// export function articlesUploadController(router) {
//   // статичная раздача /uploads (на случай когда модуль подключают отдельно)
//   const staticMw = express.static(UPLOAD_DIR);
//   router.use("/uploads", staticMw);

//   router.post(
//     "/upload",
//     ensureAuth(),
//     ensurePermission({ anyRole: ["admin", "editor", "manager", "superadmin"] }),
//     upload.single("file"),
//     async (req, res) => {
//       if (!req.file) return res.status(400).json({ message: "Файл не загрузился" });
//       const url = `/uploads/${req.file.filename}`;
//       res.status(201).json({ url });
//     }
//   );
// }
