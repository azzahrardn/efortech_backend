const admin = require("firebase-admin");
const { getAuth } = require("firebase-admin/auth");

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    req.user = decodedToken; // Simpan informasi user di req
    next();
  } catch (error) {
    console.error("Token verification error:", error);
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};

module.exports = verifyToken;
