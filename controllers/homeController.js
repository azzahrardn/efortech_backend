const db = require("../config/db");
const {
  sendSuccessResponse,
  sendErrorResponse,
} = require("../utils/responseUtils");

// GET all home_content
exports.getAllHomeContent = async (req, res) => {
  const client = await db.connect();
  try {
    const query = `SELECT * FROM home_content ORDER BY content_id`;
    const result = await client.query(query);
    return sendSuccessResponse(res, "All home content fetched", result.rows);
  } catch (err) {
    console.error("Get all home content error:", err);
    return sendErrorResponse(res, "Failed to fetch home content");
  } finally {
    client.release();
  }
};

// GET home_content by content_id
exports.getHomeContentById = async (req, res) => {
  const client = await db.connect();
  const { content_id } = req.params;

  try {
    const query = `SELECT * FROM home_content WHERE content_id = $1`;
    const result = await client.query(query, [content_id]);

    if (result.rows.length === 0) {
      return sendErrorResponse(
        res,
        `Content with ID '${content_id}' not found`,
        404
      );
    }

    return sendSuccessResponse(res, "Home content fetched", result.rows[0]);
  } catch (err) {
    console.error("Get home content by ID error:", err);
    return sendErrorResponse(res, "Failed to fetch home content");
  } finally {
    client.release();
  }
};

// UPDATE content_link by content_id
exports.updateHomeContentById = async (req, res) => {
  const client = await db.connect();
  const { content_id } = req.params;
  const { content_link } = req.body;

  try {
    const query = `UPDATE home_content SET content_link = $1 WHERE content_id = $2 RETURNING *`;
    const result = await client.query(query, [content_link, content_id]);

    if (result.rows.length === 0) {
      return sendErrorResponse(
        res,
        `Content with ID '${content_id}' not found`,
        404
      );
    }

    return sendSuccessResponse(
      res,
      "Home content updated successfully",
      result.rows[0]
    );
  } catch (err) {
    console.error("Update home content error:", err);
    return sendErrorResponse(res, "Failed to update home content");
  } finally {
    client.release();
  }
};
