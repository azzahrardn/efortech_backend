const { getAuth } = require("firebase-admin/auth");
const db = require("../config/db");
const admin = require("firebase-admin");
const uploadFile = require("../middlewares/imageUpload");
const { v4: uuidv4 } = require("uuid");
const {
  sendSuccessResponse,
  sendErrorResponse,
  sendBadRequestResponse,
} = require("../utils/responseUtils");

// Utility function to get user by email from Firebase
const getFirebaseUserByEmail = async (email) => {
  try {
    const userRecord = await getAuth().getUserByEmail(email);
    return userRecord;
  } catch (error) {
    return null;
  }
};

// Get user profile from PostgreSQL database
exports.getUserProfile = async (req, res) => {
  const userId = req.user.uid;

  try {
    const result = await db.query(
      `SELECT users.user_id, users.fullname, users.email, users.phone_number, users.institution, users.gender, users.birthdate, users.user_photo, users.created_at, roles.role_desc 
       FROM users 
       JOIN roles ON users.role_id = roles.role_id 
       WHERE users.user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return sendSuccessResponse(res, "User not found");
    }

    const user = result.rows[0];

    return sendSuccessResponse(res, "User profile fetched successfully", {
      user_id: user.user_id,
      email: user.email,
      role: user.role_desc,
      fullname: user.fullname,
      phone_number: user.phone_number,
      institution: user.institution,
      gender: user.gender,
      birthdate: user.birthdate,
      user_photo: user.user_photo,
      created_at: user.created_at,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return sendErrorResponse(res, "Failed to fetch user data");
  }
};

// Change user password using Firebase Authentication
exports.changePassword = async (req, res) => {
  const userId = req.user.uid;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return sendBadRequestResponse(res, "Current and new password are required");
  }

  if (newPassword.length < 8) {
    return sendBadRequestResponse(
      res,
      "New password must be at least 8 characters"
    );
  }

  try {
    const user = await getAuth().getUser(userId);

    if (!user) {
      return sendSuccessResponse(res, "User not found");
    }

    await getAuth().updateUser(userId, { password: newPassword });

    return sendSuccessResponse(res, "Password updated successfully");
  } catch (error) {
    console.error("Change password error:", error);
    return sendErrorResponse(res, "Failed to change password");
  }
};

// Edit user profile
exports.updateUserProfile = async (req, res) => {
  const user_id = req.user.uid;
  const { fullname, institution, phone_number, gender, birthdate, user_photo } =
    req.body;

  if (!fullname) {
    return sendBadRequestResponse(res, "Full name is required");
  }

  let genderValue;
  if (gender === "Male") genderValue = 1;
  else if (gender === "Female") genderValue = 2;
  else genderValue = null;

  const queryParams = [
    fullname,
    institution || null,
    phone_number || null,
    genderValue,
    birthdate || null,
    user_photo || null,
    user_id,
  ];

  const updateQuery = `
  UPDATE users 
  SET fullname = $1, institution = $2, phone_number = $3, gender = $4, birthdate = $5, user_photo = $6
  WHERE user_id = $7
  RETURNING *;
  `;

  try {
    const result = await db.query(updateQuery, queryParams);

    if (result.rowCount === 0) {
      return sendSuccessResponse(res, "User not found");
    }

    return sendSuccessResponse(
      res,
      "Profile updated successfully",
      result.rows[0]
    );
  } catch (error) {
    console.error("Error updating user profile:", error);
    return sendErrorResponse(res, "Failed to update profile");
  }
};

// Search User by Email
exports.searchUserByEmail = async (req, res) => {
  const { email } = req.query;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return sendBadRequestResponse(res, "Invalid email format.");
  }

  try {
    const user = await getFirebaseUserByEmail(email);

    if (!user) {
      return sendSuccessResponse(res, "User not found in Firebase.", null);
    }

    const dbResult = await db.query("SELECT * FROM users WHERE user_id = $1", [
      user.uid,
    ]);

    if (dbResult.rows.length === 0) {
      return sendSuccessResponse(res, "User not found in database.", null);
    }

    const dbUser = dbResult.rows[0];

    const result = {
      user_id: user.uid,
      email: user.email,
      fullname: dbUser.fullname,
      user_photo: dbUser.user_photo,
      institution: dbUser.institution,
    };

    return sendSuccessResponse(res, "User found.", result);
  } catch (error) {
    return sendErrorResponse(res, "Unexpected server error");
  }
};
