const { db, auth } = require("../config/firebase");
const { getAuth } = require("firebase-admin/auth");
const pool = require("../config/db");

exports.getUserProfile = async (req, res) => {
  const userId = req.user.uid; // Ambil UID dari token

  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE user_id = ?", [
      userId,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(rows[0]); // Kirim data user
  } catch (error) {
    console.error("Error fetching user profile:", error);
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
