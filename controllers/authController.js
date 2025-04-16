const { auth } = require("../config/firebase");
const db = require("../config/db");
const {
  sendSuccessResponse,
  sendCreatedResponse,
  sendBadRequestResponse,
  sendUnauthorizedResponse,
  sendForbiddenResponse,
  sendNotFoundResponse,
  sendErrorResponse,
} = require("../utils/responseUtils");

// Register user
exports.registerUser = async (req, res) => {
  const { fullName, email, password } = req.body;

  try {
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: fullName,
    });

    const userId = userRecord.uid;
    const roleId = "role1";
    const query = `
      INSERT INTO users (user_id, fullname, email, role_id, created_at)
      VALUES ($1, $2, $3, $4, NOW())
    `;

    await db.query(query, [userId, fullName, email, roleId]);

    return sendCreatedResponse(res, "User registered successfully");
  } catch (error) {
    console.error("Register user error:", error);
    return sendBadRequestResponse(res, error.message);
  }
};

// Login user
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
      return sendNotFoundResponse(res, "User data not found");
    }

    const user = result.rows[0];

    return sendSuccessResponse(res, "Login successful", {
      user_id: user.user_id,
      email: user.email,
      role: user.role_desc,
      fullname: user.fullname,
    });
  } catch (error) {
    console.error("Login user error:", error);
    return sendBadRequestResponse(res, "Invalid token");
  }
};
