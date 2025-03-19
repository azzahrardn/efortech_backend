const express = require("express");
const { getUser } = require("../controllers/userController");
const { authenticateUser } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", authenticateUser, getUser);

module.exports = router;
