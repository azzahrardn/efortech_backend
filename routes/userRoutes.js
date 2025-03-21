const express = require("express");
const {
  getUserProfile,
  changePassword,
} = require("../controllers/userController");
const verifyToken = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/me", verifyToken, getUserProfile);
router.post("/change-password", verifyToken, changePassword);

module.exports = router;
