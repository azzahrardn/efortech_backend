const express = require("express");
const router = express.Router();
const {
  getDashboardTodo,
  getDashboardSummary,
  getRegistrationStats,
  getCertificateSummary,
  getTrainingOverview,
  getTopTrainingsByRating,
  getMonthlyRegistrations,
} = require("../controllers/dashboardController");

// Dashboard Todo
router.get("/todo", getDashboardTodo);

// Dashboard Summary
router.get("/summary", getDashboardSummary);

// Graduate Stats
router.get("/regis-stats", getRegistrationStats);

// Certificate Issued Monthly
router.get("/cert-stats", getCertificateSummary);

// Training Overview
router.get("/training-overview", getTrainingOverview);

// Top Trainings by Rating
router.get("/top-trainings", getTopTrainingsByRating);

// Monthly Registrations
router.get("/monthly-registrations", getMonthlyRegistrations);

module.exports = router;
