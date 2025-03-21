const { db, auth } = require("../config/firebase");

exports.getUserProfile = async (req, res) => {
  const userId = req.user.uid; // Pastikan middleware autentikasi mengambil UID dari token

  try {
    const userSnap = await db.collection("users").doc(userId).get();

    if (!userSnap.exists) {
      return res.status(404).json({ error: "User not found" });
    }
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    res.status(200).json(userSnap.data());
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user data" });
  }
};

exports.changePassword = async (req, res) => {
  const userId = req.user.uid; // UID dari token
  const { newPassword } = req.body;

  if (!newPassword) {
    return res.status(400).json({ error: "New password is required." });
  }

  try {
    // Update password di Firebase Authentication
    await auth.updateUser(userId, { password: newPassword });

    res.status(200).json({ message: "Password changed successfully!" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
