const express = require("express");
const router = express.Router();
const {
  createReview,
  getAllReviews,
  getReviewByParticipantId,
} = require("../controllers/reviewController");

// POST /api/review - Create a new review
router.post("/", createReview);

// GET /api/review - Get all reviews
router.get("/", getAllReviews);

// GET /api/review/:participant_id - Get review by participant ID
router.get("/:registration_participant_id", getReviewByParticipantId);

module.exports = router;
