const express = require("express");
const router = express.Router();
const {
  getAllCertificates,
} = require("../controllers/allCertificateController");

// GET /api/certificates - get all certificates
router.get("/", getAllCertificates);

module.exports = router;
