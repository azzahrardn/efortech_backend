const express = require("express");
const router = express.Router();
const {
  addPartner,
  updatePartner,
  deletePartner,
  softDeletePartner,
  getPartners,
  getPartnerById,
} = require("../controllers/partnerController");
const uploadFile = require("../middlewares/imageUpload");
const {
  sendSuccessResponse,
  sendErrorResponse,
} = require("../utils/responseUtils");

// Get all partners (optional filters via query: category, status)
router.get("/", getPartners);

// Get partner details by ID
router.get("/id/:partner_id", getPartnerById);

// Add a new partner
router.post("/", addPartner);

// Update partner
router.put("/update/:partner_id", updatePartner);

// Delete partner
router.delete("/delete/:partner_id", deletePartner);

// Soft delete (archive)
router.put("/archive/:partner_id", softDeletePartner);

// Upload partner logo (use multer middleware for file upload)
router.post("/partner_logo", uploadFile.single('file'), (req, res) => {
  // Check if the file was uploaded successfully
  if (!req.file) {
    return sendErrorResponse(res, "Failed to upload partner logo");
  }

  // Respond with the file URL or some other relevant information
  return sendSuccessResponse(res, "Upload successful", {
    imageUrl: req.file.path, // Or use URL logic based on your storage
  });
});

module.exports = router;
