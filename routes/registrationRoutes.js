const express = require("express");
const router = express.Router();
const {
  createRegistration,
  getRegistrations,
  getRegistrationById,
  updateRegistrationStatus,
  updateAttendanceStatus,
  updateMultipleAttendanceStatus,
  getRegistrationsByStatus,
} = require("../controllers/registrationController");
const uploadFile = require("../middlewares/fileUpload");
const {
  sendSuccessResponse,
  sendErrorResponse,
} = require("../utils/responseUtils");

// POST /api/registration - Create a new training registration
router.post("/", createRegistration);

// GET /api/registration - Get all registrations with participant info
router.get("/", getRegistrations);

// GET /api/registration/status - Get registrations by status
router.get("/status", getRegistrationsByStatus);

// GET /api/registration/:registration_id - Get registration by ID with participant info
router.get("/:registration_id", getRegistrationById);

// PUT /api/registration/:registration_id - Update registration status
router.put("/update/:registration_id", updateRegistrationStatus);

// PUT /api/registration/attendance/:registration_participant_id - Update attendance status
router.put("/attendance/:registration_participant_id", updateAttendanceStatus);

// PUT /api/registration/attendances - Update multiple attendance status
router.put("/attendances", updateMultipleAttendanceStatus);

// Upload payment proof file
router.post("/upload-payment", uploadFile, (req, res) => {
  if (
    !req.files ||
    req.files.length === 0 ||
    !req.files[0].cloudStoragePublicUrl
  ) {
    return sendErrorResponse(res, "Failed Upload");
  }
  return sendSuccessResponse(res, "Upload successful", {
    fileUrl: req.files[0].cloudStoragePublicUrl,
  });
});

module.exports = router;
