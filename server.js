require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { initializeFirebase, db } = require("./config/firebase");

// **Inisialisasi Firebase lebih awal**
initializeFirebase();

const app = express();

app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

// **Pastikan Firestore sudah terhubung**
/* if (!db) {
  console.error("Firestore database not initialized");
  process.exit(1);
}
*/

// Import & gunakan routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);

// Test API
app.get("/api/message", (req, res) => {
  res.json({ message: "Welcome to Efortech Edu!" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
