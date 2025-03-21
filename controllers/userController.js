const { db, auth } = require("../config/firebase");
const { getAuth } = require("firebase-admin/auth");

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
  const userId = req.user.uid;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res
      .status(400)
      .json({ error: "Current and new password are required" });
  }

  if (newPassword.length < 8) {
    return res
      .status(400)
      .json({ error: "New password must be at least 8 characters" });
  }

  try {
    // Ambil user dari Firebase Auth
    const user = await getAuth().getUser(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update password langsung di Firebase Auth
    await getAuth().updateUser(userId, { password: newPassword });

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ error: "Failed to change password" });
  }
};
