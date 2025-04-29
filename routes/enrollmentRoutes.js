const express = require("express");
const router = express.Router();
const {
  updateAttendanceStatus,
  updateMultipleAttendanceStatus,
  getCompletedParticipants,
} = require("../controllers/enrollmentController");
const uploadFile = require("../middlewares/fileUpload");
const {
  sendSuccessResponse,
  sendErrorResponse,
} = require("../utils/responseUtils");

// GET /api/registration/participants - Get completed registration participants
router.get("/participants", getCompletedParticipants);

// PUT /api/registration/attendance/:registration_participant_id - Update attendance status
router.put("/attendance/:registration_participant_id", updateAttendanceStatus);

// PUT /api/registration/attendances - Update multiple attendance status
router.put("/attendances", updateMultipleAttendanceStatus);
