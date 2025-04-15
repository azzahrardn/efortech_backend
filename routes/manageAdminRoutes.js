const express = require("express");
const router = express.Router();
const {
  getAdmins,
  getAdminById,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  deleteMultipleAdmins,
  searchUserByEmail,
} = require("../controllers/manageAdminController");

// POST - Create Admin
router.post("/create", createAdmin);

// GET - All Admins (with optional filters)
router.get("/list", getAdmins);

// GET - Search User by Email
router.get("/search", searchUserByEmail);

// GET - Admin by ID
router.get("/:admin_id", getAdminById);

// PUT - Update Admin Role
router.put("/update/:admin_id", updateAdmin);

// DELETE - Soft Delete Admin
router.delete("/delete/:admin_id", deleteAdmin);

// DELETE - Soft Delete Multiple Admins
router.delete("/delete-multiple", deleteMultipleAdmins);

module.exports = router;
