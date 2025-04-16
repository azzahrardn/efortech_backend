const express = require("express");
const {
  getUserProfile,
  changePassword,
  updateUserProfile,
} = require("../controllers/userController");
const verifyToken = require("../middlewares/authMiddleware");
const uploadFile = require("../middlewares/imageUpload");
const {
  sendSuccessResponse,
  sendErrorResponse,
} = require("../utils/responseUtils");

const router = express.Router();

// User profile route
router.get("/me", verifyToken, getUserProfile);

// Change password route
router.post("/change-password", verifyToken, changePassword);

// Update user profile route
router.put("/edit-profile", verifyToken, updateUserProfile);

// Endpoint for uploading user image
router.post("/upload-user-photo", uploadFile, (req, res) => {
  if (
    !req.files ||
    req.files.length === 0 ||
    !req.files[0].cloudStoragePublicUrl
  ) {
    return sendErrorResponse(res, "Failed Upload");
  }
  return sendSuccessResponse(res, "Upload successful", {
    imageUrl: req.files[0].cloudStoragePublicUrl,
  });
});

module.exports = router;
