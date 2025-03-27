const { auth } = require("../config/firebase");
const db = require("../config/db"); // koneksi MySQL

exports.registerUser = async (req, res) => {
  const { fullName, email, password } = req.body; // Tambahkan password

  try {
    // Buat user di Firebase dengan password
    const userRecord = await auth.createUser({
      email,
      password, // Simpan password di Firebase
      displayName: fullName,
    });

    // Simpan user ke MySQL tanpa menyimpan password
    const userId = userRecord.uid; // Gunakan UID dari Firebase sebagai user_id
    const roleId = "role1"; // Default role: user
    const query = `INSERT INTO users (user_id, fullname, email, role_id, created_at)
       VALUES (?, ?, ?, ?, NOW())`;

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
      `SELECT users.user_id, users.fullname, users.email, roles.role_desc 
       FROM users 
       JOIN roles ON users.role_id = roles.role_id 
       WHERE users.email = ?`,
      [email]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "User data not found" });
    }

    const user = rows[0];

    res.json({
      user: {
        user_id: user.user_id,
        email: user.email,
        role: user.role_desc,
        fullname: user.fullname,
      },
    });
  } catch (error) {
    res.status(400).json({ error: "Invalid token" });
  }
};
