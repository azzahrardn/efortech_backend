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
    const {
      attendance_status,
      has_certificate,
      keyword,
      sort_by = "r.training_date",
      sort_order = "DESC",
      reg_date_start,
      reg_date_end,
      training_date_start,
      training_date_end,
    } = req.query;

    const values = [];
    const filters = [];

    // Filter by registration.status = 4 (completed)
    filters.push(`r.status = 4`);

    // Optional filter by attendance_status
    if (attendance_status === "true" || attendance_status === "false") {
      values.push(attendance_status === "true");
      filters.push(`rp.attendance_status = $${values.length}`);
    } else if (attendance_status === "null") {
      filters.push(`rp.attendance_status IS NULL`);
    }

    // Optional filter by has_certificate
    if (has_certificate === "true" || has_certificate === "false") {
      values.push(has_certificate === "true");
      filters.push(`rp.has_certificate = $${values.length}`);
    }

    // Optional keyword on multiple fields
    if (keyword) {
      const ilikeKeyword = `%${keyword}%`;
      const keywordConditions = [
        `u.fullname ILIKE $${values.length + 1}`,
        `CAST(rp.registration_participant_id AS TEXT) ILIKE $${
          values.length + 1
        }`,
        `CAST(r.registration_date AS TEXT) ILIKE $${values.length + 1}`,
        `CAST(r.training_date AS TEXT) ILIKE $${values.length + 1}`,
        `t.training_name ILIKE $${values.length + 1}`,
      ];
      values.push(ilikeKeyword);
      filters.push(`(${keywordConditions.join(" OR ")})`);
    }

    // Filter by registration_date range
    if (reg_date_start) {
      values.push(reg_date_start);
      filters.push(`r.registration_date >= $${values.length}`);
    }
    if (reg_date_end) {
      values.push(reg_date_end);
      filters.push(`r.registration_date <= $${values.length}`);
    }

    // Filter by training_date range
    if (training_date_start) {
      values.push(training_date_start);
      filters.push(`r.training_date >= $${values.length}`);
    }
    if (training_date_end) {
      values.push(training_date_end);
      filters.push(`r.training_date <= $${values.length}`);
    }

    // Allowed sortable columns mapping
    const allowedSortFields = {
      fullname: "u.fullname",
      registration_participant_id: "rp.registration_participant_id",
      registration_date: "r.registration_date",
      training_date: "r.training_date",
      training_name: "t.training_name",
    };

    const orderByField = allowedSortFields[sort_by] || "r.training_date";
    const orderDirection = sort_order.toUpperCase() === "ASC" ? "ASC" : "DESC";

    // Special mode: onprogress or completed
    const { mode, ...restQuery } = req.query;

    if (mode === "onprogress") {
      filters.push(`(
        rp.attendance_status IS NULL OR
        (rp.attendance_status = true AND rp.has_certificate = false)
      )`);
    }

    if (mode === "completed") {
      filters.push(`(
        rp.attendance_status = false OR
        (rp.attendance_status = true AND rp.has_certificate = true)
      )`);
    }

    const query = `
      SELECT 
        rp.*,
        u.*,
        r.*,
        t.training_id, 
        t.training_name,
        EXISTS (
          SELECT 1 FROM review v 
          WHERE v.registration_participant_id = rp.registration_participant_id
        ) AS has_review
      FROM registration_participant rp
      JOIN registration r ON rp.registration_id = r.registration_id
      JOIN users u ON rp.user_id = u.user_id
      JOIN training t ON r.training_id = t.training_id
      ${filters.length ? `WHERE ${filters.join(" AND ")}` : ""}
      ORDER BY ${orderByField} ${orderDirection}
    `;

    const result = await client.query(query, values);

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
    const { user_id } = req.params; // Get user_id from URL parameters
    const { status } = req.query; // Optional status filter from query

    // Base query including registration_participant_id and review existence check (has_review)
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
          u.user_photo,
          rp.registration_participant_id,
          -- Use EXISTS to check if a review exists for the given registration_participant_id
          EXISTS (
            SELECT 1 FROM review v 
            WHERE v.registration_participant_id = rp.registration_participant_id
          ) AS has_review
        FROM registration r
        JOIN registration_participant rp ON r.registration_id = rp.registration_id
        JOIN training t ON r.training_id = t.training_id
        LEFT JOIN certificate c ON rp.registration_participant_id = c.registration_participant_id
        JOIN users u ON rp.user_id = u.user_id
        WHERE u.user_id = $1
      `;

    // Add optional filter for status if provided
    if (status) {
      query += ` AND r.status = $2`;
    }

    // Order by training date in descending order
    query += ` ORDER BY r.training_date DESC`;

    // Execute the query with appropriate parameters
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
