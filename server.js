require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { auth, db } = require("./config/firebase");

const app = express();

app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

// Import & gunakan routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);

// Test API
app.get("/api/message", (req, res) => {
  res.json({ message: "Welcome to Efortech Edu!" });
});

app.get("/", (req, res) => {
  res.send("Backend is running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
