const { auth } = require("../config/firebase");
const db = require("../config/db"); // connect to PostgreSQL database

// Register user with Firebase Authentication and save user data in PostgreSQL database
exports.registerUser = async (req, res) => {
  const { fullName, email, password } = req.body;

  try {
    // create user in Firebase Authentication
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: fullName,
    });

    // Save user data in PostgreSQL database
    const userId = userRecord.uid;
    const roleId = "role1";
    const query = `
      INSERT INTO users (user_id, fullname, email, role_id, created_at)
      VALUES ($1, $2, $3, $4, NOW())
    `;

    // Check if the user already exists in the database
    await db.query(query, [userId, fullName, email, roleId]);

    res.status(201).json({ message: "User registered successfully!" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Login user with Firebase Authentication
exports.loginUser = async (req, res) => {
  const { idToken } = req.body;

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    const email = decodedToken.email;

    const query = `
      SELECT users.user_id, users.fullname, users.email, roles.role_desc 
      FROM users 
      JOIN roles ON users.role_id = roles.role_id 
      WHERE users.email = $1
    `;
    const result = await db.query(query, [email]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User data not found" });
    }

    const user = result.rows[0];

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
