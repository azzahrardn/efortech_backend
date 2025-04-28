const express = require("express");
const router = express.Router();

const {
  createRegistration,
  getRegistrations,
  getRegistrationById,
  updateRegistrationStatus,
  updateAttendanceStatus,
} = require("../controllers/registrationController");

// POST /api/registration - Create a new training registration
router.post("/", createRegistration);

// GET /api/registration - Get all registrations with participant info
router.get("/", getRegistrations);

// GET /api/registration/:registration_id - Get registration by ID with participant info
router.get("/:registration_id", getRegistrationById);

// PUT /api/registration/:registration_id - Update registration status
router.put("/update/:registration_id", updateRegistrationStatus);

// PUT /api/registration/attendance/:registration_participant_id - Update attendance status
router.put("/attendance/:registration_participant_id", updateAttendanceStatus);

module.exports = router;
