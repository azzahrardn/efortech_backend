const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");
const {
  sendSuccessResponse,
  sendErrorResponse,
  sendBadRequestResponse,
} = require("../utils/responseUtils");

const getCertificateStatus = (expiredDate) => {
  const today = new Date();
  const expiry = new Date(expiredDate);
  return today <= expiry ? "Valid" : "Expired";
};

// Function to generate a custom ID with prefix + timestamp + 6-char random string
const generateCustomId = (prefix) => {
  const now = new Date();
  now.setHours(now.getHours() + 7); // UTC+7 (WIB timezone)
  const timestamp = now
    .toISOString()
    .replace(/[-T:.Z]/g, "")
    .slice(0, 12);
  const randomStr = uuidv4().slice(0, 6).toUpperCase();
  return `${prefix}-${timestamp}-${randomStr}`; // Format: PREFIX-YYYYMMDDHHMM-RANDOM
};

// Controller function to create user-uploaded certificate
exports.createUserCertificate = async (req, res) => {
  const {
    user_id,
    fullname,
    cert_type,
    issuer,
    issued_date,
    expired_date,
    certificate_number,
    cert_file,
  } = req.body;

  // Required field validation
  if (
    !fullname ||
    !cert_type ||
    !issuer ||
    !issued_date ||
    !certificate_number ||
    !cert_file
  ) {
    return sendBadRequestResponse(res, "Incomplete certificate data");
  }

  const client = await db.connect();
  try {
    await client.query("BEGIN"); // Start transaction

    const user_certificate_id = generateCustomId("UCRT");

    // Insert certificate data into user_certificates table
    await client.query(
      `INSERT INTO user_certificates (
          user_certificate_id, user_id, fullname, cert_type, issuer, 
          issued_date, expired_date, certificate_number, cert_file, 
          status, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, 
          $6, $7, $8, $9, 
          1, NOW()
        )`,
      [
        user_certificate_id,
        user_id || null,
        fullname,
        cert_type,
        issuer,
        issued_date,
        expired_date || null,
        certificate_number,
        cert_file,
      ]
    );

    await client.query("COMMIT");

    return sendSuccessResponse(res, "User certificate created successfully", {
      user_certificate_id,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Create user certificate error:", err);
    return sendErrorResponse(
      res,
      "Failed to create user certificate",
      err.message
    );
  } finally {
    client.release();
  }
};
