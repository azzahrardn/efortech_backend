const express = require("express");
const router = express.Router();
const {
  createUserCertificate,
} = require("../controllers/userCertificateController");

// POST /api/ucertificate - Create a new user certificate
router.post("/", createUserCertificate);

module.exports = router;
