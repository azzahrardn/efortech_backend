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

// Function to map training level to a readable format
const mapLevel = (level) => {
  switch (level.toString()) {
    case "1":
      return "Beginner";
    case "2":
      return "Intermediate";
    case "3":
      return "Advance";
    default:
      return level;
  }
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

  const client = await db.connect();
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

// Get all reviews with user info and training info
exports.getAllReviews = async (req, res) => {
  const client = await db.connect();
  try {
    const result = await client.query(
      `SELECT 
           r.review_id,
           r.review_description,
           r.score,
           r.review_date,
           u.fullname,
           u.user_photo,
           t.training_name,
           t.level
         FROM review r
         JOIN registration_participant rp ON r.registration_participant_id = rp.registration_participant_id
         JOIN users u ON rp.user_id = u.user_id
         JOIN registration reg ON rp.registration_id = reg.registration_id
         JOIN training t ON reg.training_id = t.training_id
         ORDER BY r.review_date DESC`
    );

    const mappedData = result.rows.map((row) => ({
      ...row,
      level: mapLevel(row.level),
    }));

    return sendSuccessResponse(
      res,
      "All reviews retrieved successfully",
      mappedData
    );
  } catch (err) {
    console.error("Error getting all reviews:", err);
    return sendErrorResponse(res, "Failed to retrieve reviews", err.message);
  } finally {
    client.release();
  }
};

// Get a single review by participant ID
exports.getReviewByParticipantId = async (req, res) => {
  const { registration_participant_id } = req.params;

  const client = await db.connect();
  try {
    const result = await client.query(
      `SELECT 
           r.review_id,
           r.review_description,
           r.score,
           r.review_date,
           u.fullname,
           u.user_photo,
           t.training_name,
           t.level
         FROM review r
         JOIN registration_participant rp ON r.registration_participant_id = rp.registration_participant_id
         JOIN users u ON rp.user_id = u.user_id
         JOIN registration reg ON rp.registration_id = reg.registration_id
         JOIN training t ON reg.training_id = t.training_id
         WHERE r.registration_participant_id = $1`,
      [registration_participant_id]
    );

    if (result.rowCount === 0) {
      return sendBadRequestResponse(res, "Review not found.");
    }

    const review = result.rows[0];
    review.level = mapLevel(review.level);

    return sendSuccessResponse(res, "Review retrieved successfully", review);
  } catch (err) {
    console.error("Error getting review:", err);
    return sendErrorResponse(res, "Failed to retrieve review", err.message);
  } finally {
    client.release();
  }
};
