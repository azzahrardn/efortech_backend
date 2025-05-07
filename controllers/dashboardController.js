const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");
const {
  sendSuccessResponse,
  sendErrorResponse,
  sendBadRequestResponse,
} = require("../utils/responseUtils");

// GET /api/dashboard/graduate-stats
exports.getGraduateStats = async (req, res) => {
  const client = await db.connect();
  try {
    const query = `
        SELECT 
          t.training_name,
          COUNT(*) FILTER (WHERE rp.has_certificate = true) AS total_graduates
        FROM registration_participant rp
        JOIN registration r ON rp.registration_id = r.registration_id
        JOIN training t ON r.training_id = t.training_id
        WHERE r.status = 4
        GROUP BY t.training_name
        ORDER BY total_graduates DESC
        LIMIT 10
      `;

    const result = await client.query(query);
    return sendSuccessResponse(res, "Graduate stats fetched", result.rows);
  } catch (err) {
    console.error("Graduate stats error:", err);
    return sendErrorResponse(res, "Failed to fetch graduate stats");
  } finally {
    client.release();
  }
};
