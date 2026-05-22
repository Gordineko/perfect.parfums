// index.js
import express from "express";
import { reviewController } from "./Controllers/Review.controller.js";

export function registerReviews(api, _container) {
  const router = express.Router();
  reviewController(router);
  api.use("/reviews", router);
}
