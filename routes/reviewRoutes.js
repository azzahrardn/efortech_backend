const express = require("express");
const router = express.Router();
const { createReview } = require("../controllers/reviewController");

// POST /api/review - Create a new review
router.post("/", createReview);

module.exports = router;
