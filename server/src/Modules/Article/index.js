import express from "express";
import { articlesController } from "./Controllers/articles.controller.js";
// import { articlesUploadController } from "./Controllers/articles.upload.controller.js";

export default function ArticlesModule(api, _container) {
  const router = express.Router();
  articlesController(router);
  // articlesUploadController(router);
  api.use("/articles", router); // => /articles/...
}
