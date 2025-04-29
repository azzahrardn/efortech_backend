const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");
const {
  sendSuccessResponse,
  sendErrorResponse,
  sendBadRequestResponse,
} = require("../utils/responseUtils");

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

// Controller function to create a new certificate
exports.createCertificate = async (req, res) => {
  // Extract input data from request body
  const {
    training_id,
    issued_date,
    expired_date,
    certificate_number,
    cert_file,
    user_id,
    registration_participant_id,
  } = req.body;

  // Basic validation for required fields
  if (
    !training_id ||
    !issued_date ||
    !expired_date ||
    !certificate_number ||
    !cert_file ||
    !user_id ||
    !registration_participant_id
  ) {
    return sendBadRequestResponse(res, "Incomplete certificate data");
  }

  const client = await db.connect();
  try {
    await client.query("BEGIN"); // Start DB transaction

    const certificate_id = generateCustomId("CERT");

    // Insert the registration data into `registration` table
    await client.query(
      `INSERT INTO certificate
            (certificate_id, training_id, issued_date, expired_date, certificate_number, cert_file, user_id, registration_participant_id) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        certificate_id,
        training_id,
        issued_date,
        expired_date,
        certificate_number,
        cert_file,
        user_id,
        registration_participant_id,
      ]
    );

    await client.query(
      "UPDATE registration_participant SET has_certificate= true WHERE registration_participant_id = $1",
      [registration_participant_id]
    );

    await client.query("COMMIT"); // Commit transaction if all queries succeed

    // Send back success response with the certificate ID
    return sendSuccessResponse(res, "Certificate created successfully", {
      certificate_id,
    });
  } catch (err) {
    await client.query("ROLLBACK"); // Rollback on any error
    console.error("Create certificate error:", err);
    return sendErrorResponse(res, "Failed to create certificate", err.message);
  } finally {
    client.release(); // Release DB connection back to pool
  }
};
