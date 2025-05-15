const express = require("express");
const router = express.Router();
const {
  previewTrainingCertificateEmail,
  sendTrainingCertificateEmail,
} = require("../controllers/emailController");

// POST /api/email/send-certificate - Send Registration Training Certificate
router.post("/send-training-certificate", sendTrainingCertificateEmail);

// POST /api/email/preview - Get email Preview for Registration Training Certificate
router.post("/preview-training-certificate", previewTrainingCertificateEmail);

module.exports = router;
