const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");
const {
  sendSuccessResponse,
  sendErrorResponse,
  sendBadRequestResponse,
} = require("../utils/responseUtils");

// Function to update attendance status for a participant
exports.updateAttendanceStatus = async (req, res) => {
  const { registration_participant_id } = req.params; // registration_participant_id as parameter
  const { attendance_status } = req.body; // attendance_status (true/false)

  // Basic validation
  if (attendance_status === undefined) {
    return sendBadRequestResponse(res, "Attendance status is required");
  }

  const client = await db.connect();

  try {
    // Check if the participant exists in the registration_participant table
    const participantCheck = await client.query(
      `SELECT rp.registration_id, r.status 
         FROM registration_participant rp
         JOIN registration r ON rp.registration_id = r.registration_id
         WHERE rp.registration_participant_id = $1`,
      [registration_participant_id]
    );

    if (participantCheck.rows.length === 0) {
      return sendErrorResponse(res, "Participant not found", 404);
    }

    const { registration_id, status } = participantCheck.rows[0];

    // Ensure registration status is 4 (completed) before allowing attendance status update
    if (status !== 4) {
      return sendBadRequestResponse(
        res,
        "Attendance status can only be updated for completed registrations (status 4)."
      );
    }

    // Update the attendance status for the participant
    const attendanceStatusValue = attendance_status ? true : false;
    await client.query(
      `UPDATE registration_participant 
     SET attendance_status = $1 
     WHERE registration_participant_id = $2`,
      [attendanceStatusValue, registration_participant_id]
    );

    return sendSuccessResponse(res, "Attendance status updated successfully");
  } catch (err) {
    console.error("Update attendance status error:", err);
    return sendErrorResponse(res, "Failed to update attendance status");
  } finally {
    client.release();
  }
};

// Function to update attendance status for multiple participants
exports.updateMultipleAttendanceStatus = async (req, res) => {
  const { registration_participant_ids } = req.body; // List of registration_participant_ids
  const { attendance_status } = req.body; // attendance_status (true/false)

  // Basic validation
  if (
    !Array.isArray(registration_participant_ids) ||
    registration_participant_ids.length === 0
  ) {
    return sendBadRequestResponse(
      res,
      "List of registration_participant_ids is required"
    );
  }

  if (attendance_status === undefined) {
    return sendBadRequestResponse(res, "Attendance status is required");
  }

  const client = await db.connect();

  try {
    // Check if all participants exist in the registration_participant table
    const participantsCheck = await client.query(
      `SELECT rp.registration_participant_id, rp.registration_id, r.status
       FROM registration_participant rp
       JOIN registration r ON rp.registration_id = r.registration_id
       WHERE rp.registration_participant_id = ANY($1)`, // Using ANY to check for multiple IDs
      [registration_participant_ids]
    );

    if (participantsCheck.rows.length !== registration_participant_ids.length) {
      return sendErrorResponse(res, "Some participants not found", 404);
    }

    // Ensure all the selected registrations have status 4 (completed) before updating attendance status
    const incompleteRegistrations = participantsCheck.rows.filter(
      (row) => row.status !== 4
    );
    if (incompleteRegistrations.length > 0) {
      return sendBadRequestResponse(
        res,
        "Attendance status can only be updated for completed registrations (status 4)."
      );
    }

    // Update the attendance status for all selected participants
    const attendanceStatusValue = attendance_status ? true : false;
    await client.query(
      `UPDATE registration_participant
       SET attendance_status = $1
       WHERE registration_participant_id = ANY($2)`,
      [attendanceStatusValue, registration_participant_ids]
    );

    return sendSuccessResponse(
      res,
      "Attendance status updated successfully for multiple participants"
    );
  } catch (err) {
    console.error("Update multiple attendance status error:", err);
    return sendErrorResponse(res, "Failed to update attendance status");
  } finally {
    client.release();
  }
};

// Function to fetch all registration_participant with registration.status = 4
exports.getCompletedParticipants = async (req, res) => {
  const client = await db.connect();

  try {
    const query = `
      SELECT 
        rp.*,
        u.*,
        r.*,
        t.training_id, 
        t.training_name
      FROM registration_participant rp
      JOIN registration r ON rp.registration_id = r.registration_id
      JOIN users u ON rp.user_id = u.user_id
      JOIN training t ON r.training_id = t.training_id
      WHERE r.status = 4
      ORDER BY r.training_date DESC, u.fullname ASC
    `;

    const result = await client.query(query);
    return sendSuccessResponse(
      res,
      "Completed participant registrations fetched successfully",
      result.rows
    );
  } catch (err) {
    console.error("Get completed participants error:", err);
    return sendErrorResponse(res, "Failed to fetch completed participants");
  } finally {
    client.release();
  }
};

// Function to fetch training history for a specific user
exports.getUserTrainingHistory = async (req, res) => {
  const client = await db.connect();

  try {
    const { user_id } = req.params; // Get user_id from URL params or query
    const { status } = req.query; // Get status from query parameters (optional)

    // Base query
    let query = `
        SELECT 
          r.registration_id,
          r.status,
          r.training_date,
          t.training_name,
          c.certificate_id,
          c.issued_date,
          c.expired_date,
          u.fullname,
          u.email,
          u.user_photo
        FROM registration r
        JOIN registration_participant rp ON r.registration_id = rp.registration_id
        JOIN training t ON r.training_id = t.training_id
        LEFT JOIN certificate c ON rp.registration_participant_id = c.registration_participant_id
        JOIN users u ON rp.user_id = u.user_id
        WHERE u.user_id = $1
      `;

    // Add filter if status is provided
    if (status) {
      query += ` AND r.status = $2`;
    }

    query += ` ORDER BY r.training_date DESC`;

    // Run query
    const result = await client.query(
      query,
      status ? [user_id, status] : [user_id]
    );

    if (result.rows.length === 0) {
      return sendSuccessResponse(
        res,
        "No training history found for this user"
      );
    }

    return sendSuccessResponse(
      res,
      "Training history fetched successfully",
      result.rows
    );
  } catch (err) {
    console.error("Error fetching user training history:", err);
    return sendErrorResponse(res, "Failed to fetch user training history");
  } finally {
    client.release();
  }
};
