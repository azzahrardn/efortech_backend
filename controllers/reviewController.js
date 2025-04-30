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

// Function to create a new review
exports.createReview = async (req, res) => {
  // Extract input data from request body
  const { registration_participant_id, score, review_description } = req.body;

  // Validate input data
  if (
    !registration_participant_id ||
    score === undefined ||
    !review_description
  ) {
    return sendBadRequestResponse(res, "Incomplete input data.");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Check if registration_participant_id exists and has a certificate
    const certificateCheck = await client.query(
      `SELECT rp.registration_id, rp.has_certificate
         FROM registration_participant rp
         WHERE rp.registration_participant_id = $1`,
      [registration_participant_id]
    );

    if (
      certificateCheck.rowCount === 0 ||
      !certificateCheck.rows[0].has_certificate
    ) {
      await client.query("ROLLBACK");
      return sendBadRequestResponse(
        res,
        "You must have a certificate to submit a review."
      );
    }

    const registration_id = certificateCheck.rows[0].registration_id;

    // 2. Get training_id from registration
    const trainingRes = await client.query(
      `SELECT training_id FROM registration WHERE registration_id = $1`,
      [registration_id]
    );
    const training_id = trainingRes.rows[0]?.training_id;

    if (!training_id) {
      await client.query("ROLLBACK");
      return sendBadRequestResponse(res, "Training not found.");
    }

    // 3. Save review to the database

    const review_id = generateCustomId("REVW"); // Generate a custom review ID

    await client.query(
      `INSERT INTO review (review_id, registration_participant_id, score, review_description) 
         VALUES ($1, $2, $3, $4)`,
      [review_id, registration_participant_id, score, review_description]
    );

    // 4. Update rating for the training
    await client.query(
      `UPDATE training SET rating = (
           SELECT ROUND(AVG(score)::numeric, 2)
           FROM review r
           JOIN registration_participant rp ON r.registration_participant_id = rp.registration_participant_id
           JOIN registration reg ON rp.registration_id = reg.registration_id
           WHERE reg.training_id = $1
         )
         WHERE training_id = $1`,
      [training_id]
    );

    await client.query("COMMIT");
    return sendSuccessResponse(res, "Review created successfully.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error creating review:", err);
    return sendErrorResponse(res, "Failed to create review", err.message);
  } finally {
    client.release();
  }
};
