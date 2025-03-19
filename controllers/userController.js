const { db } = require("../config/firebase");

exports.getUser = async (req, res) => {
  try {
    const userRef = db.collection("users").doc(req.user.uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(userSnap.data());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
