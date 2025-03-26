const { auth } = require("../config/firebase");
const db = require("../config/db"); // koneksi MySQL
const { v4: uuidv4 } = require("uuid");

exports.registerUser = async (req, res) => {
  const { fullName, email } = req.body;

  try {
    // Buat user di Firebase
    const userRecord = await auth.createUser({
      email,
      displayName: fullName,
    });

    // Simpan user ke MySQL tanpa password
    const userId = uuidv4();
    const roleId = "role1"; // Default role: user
    const query = `
      INSERT INTO users (user_id, fullname, email, role_id)
      VALUES (?, ?, ?, ?)
    `;

    await db.execute(query, [userId, fullName, email, roleId]);

    res.status(201).json({ message: "User registered successfully!" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.loginUser = async (req, res) => {
  const { idToken } = req.body;

  try {
    // Verifikasi token Firebase
    const decodedToken = await auth.verifyIdToken(idToken);
    const email = decodedToken.email;

    // Ambil data user dari MySQL
    const [rows] = await db.execute(
      "SELECT user_id, fullname, email, role_id FROM users WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "User data not found" });
    }

    const user = rows[0];

    res.json({
      user: {
        uid: user.user_id,
        email: user.email,
        role: user.role_id,
        fullName: user.fullname,
      },
    });
  } catch (error) {
    res.status(400).json({ error: "Invalid token" });
  }
};
