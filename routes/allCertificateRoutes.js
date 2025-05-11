const express = require("express");
const router = express.Router();
const {
  getAllCertificates,
  searchCertificates,
} = require("../controllers/allCertificateController");

// GET /api/certificates - get all certificates
router.get("/", getAllCertificates);

// GET /api/certificates/search - get certificates based on query
router.get("/search", searchCertificates);

module.exports = router;
