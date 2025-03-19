const { db } = require("../config/firebase");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.registerUser = async (req, res) => {
  const { fullName, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const userRef = db.collection("users").doc();
    await userRef.set({
      fullName,
      email,
      password: hashedPassword,
      role: "user",
      createdAt: new Date(),
    });

    res.status(201).json({ message: "User registered successfully!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.loginUser = async (req, res) => {
  const { email } = req.body;

  try {
    const userSnap = await db
      .collection("users")
      .where("email", "==", email)
      .get();

    if (userSnap.empty) {
      return res.status(400).json({ error: "User not found" });
    }

    const userData = userSnap.docs[0].data();

    const token = jwt.sign(
      { uid: userSnap.docs[0].id, role: userData.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      token,
      user: {
        uid: userSnap.docs[0].id,
        email,
        fullName: userData.fullName,
        role: userData.role,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
