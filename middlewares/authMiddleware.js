const admin = require("firebase-admin");
const { getAuth } = require("firebase-admin/auth");
const {
  sendBadRequestResponse,
  sendUnauthorizedResponse,
} = require("../utils/responseUtils");

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return sendUnauthorizedResponse(res, "Unauthorized: No token provided");
  }

  const token = authHeader.split(" ")[1];

  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("Token verification error:", error);
    return sendUnauthorizedResponse(res, "Unauthorized: No token provided");
  }
};

module.exports = verifyToken;
