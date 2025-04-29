const express = require("express");
const router = express.Router();
const {
  createCertificate,
  getCertificates,
  getCertificateById,
} = require("../controllers/certificateController");
const uploadFile = require("../middlewares/fileUpload");
const {
  sendSuccessResponse,
  sendErrorResponse,
} = require("../utils/responseUtils");

// POST /api/certificate - Create a new training certificate
router.post("/", createCertificate);

// GET /api/certificate - Get all certificates
router.get("/", getCertificates);

// GET /api/certificate/:certificate_id - Get a certificate by ID
router.get("/:certificate_id", getCertificateById);

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
