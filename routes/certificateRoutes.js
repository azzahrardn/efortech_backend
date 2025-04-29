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

module.exports = router;
