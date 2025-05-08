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

// Admin-side function to upload a validated certificate for user
exports.createUserCertificateByAdmin = async (req, res) => {
  const {
    user_id,
    fullname,
    cert_type,
    issuer,
    issued_date,
    expired_date,
    certificate_number,
    cert_file,
    admin_id, // comes from frontend auth
    notes,
  } = req.body;

  if (
    !fullname ||
    !cert_type ||
    !issuer ||
    !issued_date ||
    !certificate_number ||
    !cert_file ||
    !admin_id
  ) {
    return sendBadRequestResponse(res, "Missing required certificate data");
  }

  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const user_certificate_id = generateCustomId("UCRT");

    await client.query(
      `INSERT INTO user_certificates (
          user_certificate_id, user_id, fullname, cert_type, issuer,
          issued_date, expired_date, certificate_number, cert_file,
          status, created_at, verified_by, verification_date, notes
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9,
          2, NOW(), $10, NOW(), $11
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
        admin_id,
        notes || null,
      ]
    );

    await client.query("COMMIT");

    return sendSuccessResponse(
      res,
      "User certificate (admin-verified) created successfully",
      { user_certificate_id }
    );
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Create admin-side certificate error:", err);
    return sendErrorResponse(
      res,
      "Failed to create validated certificate",
      err.message
    );
  } finally {
    client.release();
  }
};

// Get all user certificates
exports.getUserCertificates = async (req, res) => {
  const client = await db.connect();
  try {
    const result = await client.query(`
        SELECT 
          uc.user_certificate_id,
          uc.user_id,
          COALESCE(u.fullname, uc.fullname) AS fullname,
          uc.cert_type,
          uc.issuer,
          uc.issued_date,
          uc.expired_date,
          uc.certificate_number,
          uc.cert_file,
          uc.status,
          uc.created_at,
          uc.verified_by,
          uc.verification_date,
          uc.notes
        FROM user_certificates uc
        LEFT JOIN users u ON u.user_id = uc.user_id
        ORDER BY uc.created_at DESC
      `);

    return sendSuccessResponse(res, "Certificates retrieved", result.rows);
  } catch (err) {
    console.error("Get certificates error:", err);
    return sendErrorResponse(
      res,
      "Failed to retrieve certificates",
      err.message
    );
  } finally {
    client.release();
  }
};

// Get user certificate by ID
exports.getUserCertificateById = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return sendBadRequestResponse(res, "Missing certificate ID");
  }

  const client = await db.connect();
  try {
    const result = await client.query(
      `
        SELECT 
          uc.user_certificate_id,
          uc.user_id,
          COALESCE(u.fullname, uc.fullname) AS fullname,
          uc.cert_type,
          uc.issuer,
          uc.issued_date,
          uc.expired_date,
          uc.certificate_number,
          uc.cert_file,
          uc.status,
          uc.created_at,
          uc.verified_by,
          uc.verification_date,
          uc.notes
        FROM user_certificates uc
        LEFT JOIN users u ON u.user_id = uc.user_id
        WHERE uc.user_certificate_id = $1
        `,
      [id]
    );

    if (result.rowCount === 0) {
      return sendBadRequestResponse(res, "Certificate not found");
    }

    return sendSuccessResponse(res, "Certificate retrieved", result.rows[0]);
  } catch (err) {
    console.error("Get certificate by ID error:", err);
    return sendErrorResponse(
      res,
      "Failed to retrieve certificate",
      err.message
    );
  } finally {
    client.release();
  }
};
