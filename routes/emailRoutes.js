const express = require("express");
const router = express.Router();
const {
  previewTrainingCertificateEmail,
  sendTrainingCertificateEmail,
  previewUserUploadCertificateValidationEmail,
  sendUserUploadCertificateValidationEmail,
} = require("../controllers/emailController");

// POST /api/email/send-training-certificate- Send Registration Training Certificate Email
router.post("/send-training-certificate", sendTrainingCertificateEmail);

// POST /api/email/preview-training-certificate - Get email Preview for Registration Training Certificate
router.post("/preview-training-certificate", previewTrainingCertificateEmail);

// POST /api/email/send-upload-certificate - Send User Upload Certificate Validation Email
router.post(
  "/send-upload-certificate",
  sendUserUploadCertificateValidationEmail
);

// POST /api/email/preview-upload-certificate - Get email Preview for User Upload Certificate Validation
router.post(
  "/preview-upload-certificate",
  previewUserUploadCertificateValidationEmail
);

module.exports = router;
