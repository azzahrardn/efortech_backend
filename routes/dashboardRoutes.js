const express = require("express");
const router = express.Router();
const { getGraduateStats } = require("../controllers/dashboardController");

// GET /api/dashboard/graduate-stats - Get graduate statistics
router.get("/graduate-stats", getGraduateStats);

module.exports = router;
