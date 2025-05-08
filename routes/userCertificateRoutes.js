const express = require("express");
const router = express.Router();
const {
  createUserCertificate,
  createUserCertificateByAdmin,
} = require("../controllers/userCertificateController");
const uploadFile = require("../middlewares/fileUpload");
const {
  sendSuccessResponse,
  sendErrorResponse,
} = require("../utils/responseUtils");

// POST /api/ucertificate - Create a new user certificate
router.post("/", createUserCertificate);

// POST /api/ucertificate - Create a new user certificate (by admin)
router.post("/uploaded-by-admin", createUserCertificateByAdmin);

// Upload certificate file
router.post("/upload-ucertificate", uploadFile, (req, res) => {
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
