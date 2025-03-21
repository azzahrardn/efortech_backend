const express = require("express");
const router = express.Router();
const { authenticateUser } = require("../middlewares/authMiddleware");

router.get("/", (req, res) => {
  res.status(200).json({ message: "Welcome to Admin Account" });
});

router.get("/dashboard", (req, res) => {
  res.status(200).json({ message: "Welcome to Admin Dashboard" });
});

router.get("/training-admin", (req, res) => {
  res.status(200).json({ message: "Training Management" });
});

router.get("/validation-admin", (req, res) => {
  res.status(200).json({ message: "Validation Page" });
});

router.get("/certificate-admin", (req, res) => {
  res.status(200).json({ message: "Certificate Management" });
});

router.get("/article-admin", (req, res) => {
  res.status(200).json({ message: "Article Management" });
});

router.get("/manage-admin", (req, res) => {
  res.status(200).json({ message: "Admin Management" });
});

module.exports = router;
