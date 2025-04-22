const express = require("express");
const router = express.Router();

const {
  createRegistration,
  getRegistrations,
} = require("../controllers/registrationController");

// POST /api/registration - Create a new training registration
router.post("/", createRegistration);

// GET /api/registration - Get all registrations with participant info
router.get("/", getRegistrations);

module.exports = router;
