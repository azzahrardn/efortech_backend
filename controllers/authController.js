const { db, auth } = require("../config/firebase");
const { FieldValue } = require("firebase-admin/firestore");

exports.registerUser = async (req, res) => {
  const { fullName, email, password } = req.body;

  try {
    // Create User - Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: fullName,
    });

    // Simpan data tambahan di Firestore
    await db.collection("users").doc(userRecord.uid).set({
      fullName,
      email,
      role: "user",
      createdAt: FieldValue.serverTimestamp(),
    });

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

    // Ambil data user dari Firestore
    const userSnap = await db.collection("users").doc(decodedToken.uid).get();

    if (!userSnap.exists) {
      return res.status(404).json({ error: "User data not found" });
    }

    const userData = userSnap.data();

    res.json({
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        role: userData.role,
        fullName: userData.fullName,
      },
    });
  } catch (error) {
    res.status(400).json({ error: "Invalid token" });
  }
};
