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

// Controller function to create a new training registration
exports.createRegistration = async (req, res) => {
  // Extract input data from request body
  const {
    training_id,
    registrant_id,
    participant_count,
    final_price,
    training_fees,
    training_date,
    participants, // Expected to be an array of objects with user_id
    payment_proof,
  } = req.body;

  // Basic validation for required fields
  if (
    !training_id ||
    !registrant_id ||
    !training_date ||
    !participant_count ||
    !participants ||
    participants.length === 0
  ) {
    return sendBadRequestResponse(res, "Incomplete registration data");
  }

  const client = await db.connect();
  try {
    await client.query("BEGIN"); // Start DB transaction

    const registration_id = generateCustomId("REGT");

    // Calculate total payment: either use `final_price` or fallback to fees * count
    const total_payment = final_price
      ? Number(final_price)
      : Number(training_fees) * Number(participant_count);

    // Insert the registration data into `registration` table
    await client.query(
      `INSERT INTO registration 
          (registration_id, registrant_id, training_id, training_date, participant_count, total_payment, payment_proof) 
          VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        registration_id,
        registrant_id,
        training_id,
        training_date,
        participant_count,
        total_payment,
        payment_proof || null, // Store null if no proof uploaded
      ]
    );

    // Loop through the participants array to insert each into `registration_participant` table
    for (const participant of participants) {
      const reg_participant_id = generateCustomId("REGP"); // Generate unique ID for participant

      await client.query(
        `INSERT INTO registration_participant 
          (registration_participant_id, registration_id, user_id) 
          VALUES ($1, $2, $3)`,
        [reg_participant_id, registration_id, participant.user_id]
      );
    }

    await client.query("COMMIT"); // Commit transaction if all queries succeed

    // Send back success response with the registration ID
    return sendSuccessResponse(res, "Registration created successfully", {
      registration_id,
    });
  } catch (err) {
    await client.query("ROLLBACK"); // Rollback on any error
    console.error("Create registration error:", err);
    return sendErrorResponse(res, "Failed to create registration");
  } finally {
    client.release(); // Release DB connection back to pool
  }
};

// Function to fetch all registration data including participants
exports.getRegistrations = async (req, res) => {
  const client = await db.connect();
  try {
    // Get all registrations
    const registrationsResult = await client.query(
      `SELECT r.*, u.fullname AS registrant_name, t.training_name AS training_name
           FROM registration r
           JOIN users u ON r.registrant_id = u.user_id
           JOIN training t ON r.training_id = t.training_id
           ORDER BY r.registration_date DESC`
    );

    const registrations = registrationsResult.rows;

    // For each registration, fetch its participants
    for (const reg of registrations) {
      const participantsResult = await client.query(
        `SELECT rp.*, u.fullname AS participant_name, u.email
             FROM registration_participant rp
             JOIN users u ON rp.user_id = u.user_id
             WHERE rp.registration_id = $1`,
        [reg.registration_id]
      );

      // Add participants array into the registration object
      reg.participants = participantsResult.rows;
    }

    return sendSuccessResponse(
      res,
      "Registrations fetched successfully",
      registrations
    );
  } catch (err) {
    console.error("Get registration error:", err);
    return sendErrorResponse(res, "Failed to fetch registration data");
  } finally {
    client.release();
  }
};
