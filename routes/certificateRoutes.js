const express = require("express");
const router = express.Router();
const { createCertificate } = require("../controllers/certificateController");
const uploadFile = require("../middlewares/fileUpload");
const {
  sendSuccessResponse,
  sendErrorResponse,
} = require("../utils/responseUtils");

// POST /api/certificate - Create a new training certificate
router.post("/", createCertificate);

// Upload certificate file
router.post("/upload-certificate", uploadFile, (req, res) => {
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
