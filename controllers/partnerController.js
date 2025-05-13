const db = require("../config/db");
const uploadFile = require("../middlewares/imageUpload");
const { v4: uuidv4 } = require("uuid");
const {
  sendSuccessResponse,
  sendErrorResponse,
  sendBadRequestResponse,
} = require("../utils/responseUtils");

// Get all partners
exports.getAllPartners = async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM partners ORDER BY partner_name ASC");
    return sendSuccessResponse(res, "Partner list fetched successfully", result.rows);
  } catch (error) {
    console.error("Error fetching partners:", error);
    return sendErrorResponse(res, "Failed to fetch partners");
  }
};

// Get partner by ID
exports.getPartnerById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query("SELECT * FROM partners WHERE partner_id = $1", [id]);

    if (result.rowCount === 0) {
      return sendSuccessResponse(res, "Partner not found");
    }

    return sendSuccessResponse(res, "Partner fetched successfully", result.rows[0]);
  } catch (error) {
    console.error("Error fetching partner by ID:", error);
    return sendErrorResponse(res, "Failed to fetch partner");
  }
};

// Get partners visible to user (only active)
exports.getActivePartners = async (req, res) => {
    try {
      const result = await db.query(
        "SELECT * FROM partners WHERE status = 1 ORDER BY partner_name ASC"
      );
      return sendSuccessResponse(res, "Active partners fetched", result.rows);
    } catch (error) {
      console.error("Error fetching active partners:", error);
      return sendErrorResponse(res, "Failed to fetch active partners");
    }
};

// Logo partner
exports.uploadPartnerLogo = (req, res) => {
  if (!req.file) {
    return sendBadRequestResponse(res, "No file uploaded");
  }

  // Validasi tipe dan ukuran file
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (!allowedTypes.includes(req.file.mimetype)) {
    return sendBadRequestResponse(res, "Invalid file type. Only JPG, PNG, and GIF are allowed.");
  }

  const imageUrl = req.file.firebaseUrl || req.file.path || req.file.location;
  return sendSuccessResponse(res, "Logo uploaded successfully", { imageUrl });
};

// Add new partner
exports.addPartner = async (req, res) => {
    const { partner_name, category, status } = req.body;
    const partner_logo = req.body.partner_logo || null;
    const partner_id = uuidv4();
  
    if (!partner_name) {
      return sendBadRequestResponse(res, "Partner name is required");
    }
  
    if (status !== undefined && ![0, 1].includes(Number(status))) {
      return sendBadRequestResponse(res, "Invalid status value. Must be 0 or 1.");
    }
  
    try {
      const result = await db.query(
        "INSERT INTO partners (partner_id, partner_name, partner_logo, category, status) VALUES ($1, $2, $3, $4, $5) RETURNING *",
        [partner_id, partner_name, partner_logo, category || null, status ?? 1]
      );
  
      return sendSuccessResponse(res, "Partner added successfully", result.rows[0]);
    } catch (error) {
      console.error("Error adding partner:", error);
      return sendErrorResponse(res, "Failed to add partner");
    }
  };  

// Update partner
exports.updatePartner = async (req, res) => {
    const { id } = req.params;
    const { partner_name, partner_logo, category, status } = req.body;
  
    if (!partner_name) {
      return sendBadRequestResponse(res, "Partner name is required");
    }

    if (status !== undefined && ![0, 1].includes(Number(status))) {
        return sendBadRequestResponse(res, "Invalid status value. Must be 0 or 1.");
      }      
  
    try {
      const result = await db.query(
        "UPDATE partners SET partner_name = $1, partner_logo = $2, category = $3, status = $4 WHERE partner_id = $5 RETURNING *",
        [partner_name, partner_logo || null, category || null, status ?? 1, id]
      );
  
      if (result.rowCount === 0) {
        return sendSuccessResponse(res, "Partner not found");
      }  
  
      return sendSuccessResponse(res, "Partner updated successfully", result.rows[0]);
    } catch (error) {
      console.error("Error updating partner:", error);
      return sendErrorResponse(res, "Failed to update partner");
    }
  };  

// Delete partner
exports.deletePartner = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query("DELETE FROM partners WHERE partner_id = $1 RETURNING *", [id]);

    if (result.rowCount === 0) {
      return sendSuccessResponse(res, "Partner not found");
    }

    return sendSuccessResponse(res, "Partner deleted successfully", result.rows[0]);
  } catch (error) {
    console.error("Error deleting partner:", error);
    return sendErrorResponse(res, "Failed to delete partner");
  }
};