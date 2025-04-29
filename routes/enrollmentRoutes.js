const express = require("express");
const router = express.Router();
const {
  updateAttendanceStatus,
  updateMultipleAttendanceStatus,
  getCompletedParticipants,
  getUserTrainingHistory,
} = require("../controllers/enrollmentController");

// GET /api/registration/participants - Get completed registration participants
router.get("/participants", getCompletedParticipants);

// GET /api/registration/history/:user_id - Get training history for a specific user
router.get("/history/:user_id", getUserTrainingHistory);

// PUT /api/registration/attendance/:registration_participant_id - Update attendance status
router.put("/attendance/:registration_participant_id", updateAttendanceStatus);

// PUT /api/registration/attendances - Update multiple attendance status
router.put("/attendances", updateMultipleAttendanceStatus);

module.exports = router;
