const db = require("../config/db");
const admin = require("firebase-admin");
const { getAuth } = require("firebase-admin/auth");

// Utility function to get user by email from Firebase
const getFirebaseUserByEmail = async (email) => {
  try {
    const userRecord = await getAuth().getUserByEmail(email);
    return userRecord;
  } catch (error) {
    throw new Error("User not found in Firebase");
  }
};

// Create Admin
exports.createAdmin = async (req, res) => {
  const { email, role_id } = req.body;

  if (!["role2", "role3"].includes(role_id)) {
    return res
      .status(400)
      .json({ error: "Invalid role_id. Use role2 or role3." });
  }

  try {
    // Check Firebase user
    const firebaseUser = await getFirebaseUserByEmail(email);
    const userId = firebaseUser.uid;

    // Check if user exists in local db and is currently just a user (role1)
    const userResult = await db.query(
      `SELECT * FROM users WHERE user_id = $1 AND role_id = 'role1'`,
      [userId]
    );

    if (userResult.rowCount === 0) {
      return res
        .status(404)
        .json({ error: "User not found or not eligible to become admin" });
    }

    // Check if admin record already exists
    const existingAdmin = await db.query(
      `SELECT status FROM admin WHERE admin_id = $1`,
      [userId]
    );

    if (
      existingAdmin.rowCount > 0 &&
      existingAdmin.rows[0].status === "active"
    ) {
      return res.status(400).json({ error: "User is already an active admin" });
    }

    // Update role_id in users table
    await db.query(`UPDATE users SET role_id = $1 WHERE user_id = $2`, [
      role_id,
      userId,
    ]);

    // Insert or update (reactivate) into admin table
    await db.query(
      `INSERT INTO admin (admin_id, created_date, last_updated, status)
       VALUES ($1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'active')
       ON CONFLICT (admin_id)
       DO UPDATE SET 
         status = 'active',
         last_updated = CURRENT_TIMESTAMP`,
      [userId]
    );

    res
      .status(201)
      .json({ message: "Admin created or reactivated successfully" });
  } catch (error) {
    console.error("Create admin error:", error);
    res.status(500).json({ error: "Failed to create admin" });
  }
};

// Update Admin Role
exports.updateAdmin = async (req, res) => {
  const { admin_id } = req.params;
  const { new_role_id } = req.body;

  if (!["role2", "role3"].includes(new_role_id)) {
    return res.status(400).json({ error: "Invalid role_id" });
  }

  try {
    // Check if admin_id is a valid admin
    const user = await db.query(
      `SELECT * FROM users WHERE user_id = $1 AND role_id IN ('role2', 'role3')`,
      [admin_id]
    );
    if (user.rowCount === 0) {
      return res.status(404).json({ error: "Admin not found or not valid" });
    }

    // Update role and admin table
    await db.query(`UPDATE users SET role_id = $1 WHERE user_id = $2`, [
      new_role_id,
      admin_id,
    ]);
    await db.query(
      `UPDATE admin SET last_updated = CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta' WHERE admin_id = $1`,
      [admin_id]
    );

    res.status(200).json({ message: "Admin role updated" });
  } catch (error) {
    console.error("Update admin error:", error);
    res.status(500).json({ error: "Failed to update admin" });
  }
};

// Soft Delete Admin
exports.deleteAdmin = async (req, res) => {
  const { admin_id } = req.params;

  try {
    const user = await db.query(
      `SELECT * FROM users WHERE user_id = $1 AND role_id IN ('role2', 'role3')`,
      [admin_id]
    );
    if (user.rowCount === 0) {
      return res
        .status(404)
        .json({ error: "Admin not found or already inactive" });
    }

    await db.query(`UPDATE users SET role_id = 'role1' WHERE user_id = $1`, [
      admin_id,
    ]);
    await db.query(
      `UPDATE admin SET status = 'inactive', last_updated = CURRENT_TIMESTAMP WHERE admin_id = $1`,
      [admin_id]
    );

    res.status(200).json({ message: "Admin removed (soft delete)" });
  } catch (error) {
    console.error("Delete admin error:", error);
    res.status(500).json({ error: "Failed to remove admin" });
  }
};

// Get All Admins with optional filters
exports.getAdmins = async (req, res) => {
  const { name, email, id, role, status } = req.query;
  const formatWIB = (dateStr) => {
    if (!dateStr) return null;
    return new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      dateStyle: "short",
      timeStyle: "medium",
      hour12: true,
    }).format(new Date(dateStr));
  };

  let query = `
    SELECT a.admin_id, u.fullname, u.email, u.role_id, a.created_date, a.last_updated, a.status
    FROM admin a
    JOIN users u ON a.admin_id = u.user_id
    WHERE 1=1
  `;
  const params = [];
  let i = 1;

  if (id) {
    query += ` AND u.user_id ILIKE $${i++}`;
    params.push(`%${id}%`);
  }
  if (name) {
    query += ` AND u.fullname ILIKE $${i++}`;
    params.push(`%${name}%`);
  }
  if (email) {
    query += ` AND u.email ILIKE $${i++}`;
    params.push(`%${email}%`);
  }
  if (role) {
    query += ` AND u.role_id = $${i++}`;
    params.push(role);
  }
  if (status) {
    query += ` AND a.status = $${i++}`;
    params.push(status);
  }

  query += ` ORDER BY a.created_date DESC`;

  try {
    const result = await db.query(query, params);

    // Mapping role_id → readable role name
    const roleMap = {
      role1: "User",
      role2: "Admin",
      role3: "Superadmin",
    };

    const enrichedAdmins = await Promise.all(
      result.rows.map(async (admin) => {
        let lastLogin = null;
        try {
          const fbUser = await getAuth().getUser(admin.admin_id);
          lastLogin = fbUser.metadata.lastSignInTime;
        } catch (err) {
          console.warn("Firebase error:", err.message);
        }

        return {
          ...admin,
          role_name: roleMap[admin.role_id] || "Unknown",
          status: admin.status || "Unknown",
          last_login: formatWIB(lastLogin),
          last_updated: formatWIB(admin.last_updated),
        };
      })
    );

    res.status(200).json(enrichedAdmins);
  } catch (error) {
    console.error("Fetch admins error:", error);
    res.status(500).json({ error: "Failed to fetch admins" });
  }
};

// Get Admin by ID
exports.getAdminById = async (req, res) => {
  const { admin_id } = req.params;

  try {
    const result = await db.query(
      `SELECT u.user_id, u.fullname, u.email, u.role_id, a.created_date, a.last_updated, a.status
       FROM admin a
       JOIN users u ON a.admin_id = u.user_id
       WHERE u.user_id = $1`,
      [admin_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Admin not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Get admin by ID error:", error);
    res.status(500).json({ error: "Failed to get admin" });
  }
};
