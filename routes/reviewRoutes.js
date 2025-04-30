const express = require("express");
const router = express.Router();
const {
  createReview,
  getAllReviews,
} = require("../controllers/reviewController");

// POST /api/review - Create a new review
router.post("/", createReview);

// GET /api/review - Get all reviews
router.get("/", getAllReviews);

module.exports = router;
