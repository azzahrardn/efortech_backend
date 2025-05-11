const db = require("../config/db");
const {
  sendSuccessResponse,
  sendErrorResponse,
} = require("../utils/responseUtils");

function getValidityStatus(expiredDate) {
  return new Date(expiredDate) < new Date() ? "Expired" : "Valid";
}

// Endpoint for get all certificates (certificate & user_certificates)
exports.getAllCertificates = async (req, res) => {
  const client = await db.connect();
  try {
    // 1. Get from certificate table (relation to user and training)
    const query1 = `
        SELECT 
            c.certificate_id,
            c.certificate_number,
            u.fullname,
            t.training_name AS certificate_title,
            c.issued_date,
            c.expired_date,
            c.cert_file,
            1 AS type
        FROM certificate c
        JOIN registration_participant rp ON c.registration_participant_id = rp.registration_participant_id
        JOIN users u ON rp.user_id = u.user_id
        JOIN registration r ON rp.registration_id = r.registration_id
        JOIN training t ON r.training_id = t.training_id
    `;

    const { rows: cert1 } = await client.query(query1);

    // Inject validity_status ke cert1
    const cert1WithStatus = cert1.map((cert) => ({
      ...cert,
      validity_status: getValidityStatus(cert.expired_date),
    }));

    // 2. Get from user_certificates
    const query2 = `
      SELECT 
        user_certificate_id AS certificate_id,
        certificate_number,
        fullname,
        cert_type AS certificate_title,
        issued_date,
        expired_date,
        cert_file,
        2 AS type
      FROM user_certificates
      WHERE status = 2
    `;
    const { rows: cert2 } = await client.query(query2);

    // Inject validity_status ke cert2
    const cert2WithStatus = cert2.map((cert) => ({
      ...cert,
      validity_status: getValidityStatus(cert.expired_date),
    }));

    // 3. Combine the result
    const combined = [...cert1WithStatus, ...cert2WithStatus];

    return sendSuccessResponse(res, "Success get all certificates", combined);
  } catch (error) {
    console.error("Error getting certificates:", error);
    return sendErrorResponse(res, 500, "Failed to get certificates");
  } finally {
    client.release();
  }
};

// Endpoint for search certificates based on query param
exports.searchCertificates = async (req, res) => {
  const client = await db.connect();
  try {
    const {
      certificate_number,
      fullname,
      certificate_title,
      issued_date,
      expired_date,
      q,
    } = req.query;

    const cert1Conditions = [];
    const cert1Values = [];

    // Helper to add condition for query 1
    const addCert1Condition = (field, value, tableAlias = "") => {
      const placeholder = `$${cert1Values.length + 1}`;
      const qualifiedField = tableAlias ? `${tableAlias}.${field}` : field;
      cert1Conditions.push(`${qualifiedField}::text ILIKE ${placeholder}`);
      cert1Values.push(`%${value}%`);
    };

    if (certificate_number)
      addCert1Condition("certificate_number", certificate_number, "c");
    if (fullname) addCert1Condition("fullname", fullname, "u");
    if (certificate_title)
      addCert1Condition("training_name", certificate_title, "t");
    if (issued_date) addCert1Condition("issued_date", issued_date, "c");
    if (expired_date) addCert1Condition("expired_date", expired_date, "c");

    if (q) {
      const searchValue = `%${q}%`;
      cert1Conditions.push(`(
          c.certificate_number ILIKE $${cert1Values.length + 1} OR
          u.fullname ILIKE $${cert1Values.length + 2} OR
          t.training_name ILIKE $${cert1Values.length + 3} OR
          CAST(c.issued_date AS TEXT) ILIKE $${cert1Values.length + 4} OR
          CAST(c.expired_date AS TEXT) ILIKE $${cert1Values.length + 5}
        )`);
      cert1Values.push(
        searchValue,
        searchValue,
        searchValue,
        searchValue,
        searchValue
      );
    }

    // Query for certificate type 1
    let query1 = `
        SELECT 
          c.certificate_id,
          c.certificate_number,
          u.fullname,
          t.training_name AS certificate_title,
          c.issued_date,
          c.expired_date,
          c.cert_file,
          1 AS type
        FROM certificate c
        JOIN registration_participant rp ON c.registration_participant_id = rp.registration_participant_id
        JOIN users u ON rp.user_id = u.user_id
        JOIN registration r ON rp.registration_id = r.registration_id
        JOIN training t ON r.training_id = t.training_id
      `;

    if (cert1Conditions.length > 0) {
      query1 += ` WHERE ` + cert1Conditions.join(" AND ");
    }

    const cert1 = await client.query(query1, cert1Values);
    const cert1WithStatus = cert1.rows.map((cert) => ({
      ...cert,
      validity_status: getValidityStatus(cert.expired_date),
    }));

    // ==== Certificate Type 2 ====
    const cert2Conditions = [`status = 2`];
    const cert2Values = [];

    // Helper to add condition for query 2
    const addCert2Condition = (field, value) => {
      const placeholder = `$${cert2Values.length + 1}`;
      cert2Conditions.push(`${field}::text ILIKE ${placeholder}`);
      cert2Values.push(`%${value}%`);
    };

    if (certificate_number)
      addCert2Condition("certificate_number", certificate_number);
    if (fullname) addCert2Condition("fullname", fullname);
    if (certificate_title) addCert2Condition("cert_type", certificate_title);
    if (issued_date) addCert2Condition("issued_date", issued_date);
    if (expired_date) addCert2Condition("expired_date", expired_date);

    if (q) {
      const searchValue = `%${q}%`;
      cert2Conditions.push(`(
          certificate_number ILIKE $${cert2Values.length + 1} OR
          fullname ILIKE $${cert2Values.length + 2} OR
          cert_type ILIKE $${cert2Values.length + 3} OR
          CAST(issued_date AS TEXT) ILIKE $${cert2Values.length + 4} OR
          CAST(expired_date AS TEXT) ILIKE $${cert2Values.length + 5}
        )`);
      cert2Values.push(
        searchValue,
        searchValue,
        searchValue,
        searchValue,
        searchValue
      );
    }

    let query2 = `
        SELECT 
          user_certificate_id AS certificate_id,
          certificate_number,
          fullname,
          cert_type AS certificate_title,
          issued_date,
          expired_date,
          cert_file,
          2 AS type
        FROM user_certificates
      `;

    if (cert2Conditions.length > 0) {
      query2 += ` WHERE ` + cert2Conditions.join(" AND ");
    }

    const cert2 = await client.query(query2, cert2Values);
    const cert2WithStatus = cert2.rows.map((cert) => ({
      ...cert,
      validity_status: getValidityStatus(cert.expired_date),
    }));

    const combined = [...cert1WithStatus, ...cert2WithStatus];

    return sendSuccessResponse(res, "Success search certificates", combined);
  } catch (error) {
    console.error("Error searching certificates:", error);
    return sendErrorResponse(res, 500, "Failed to search certificates");
  } finally {
    client.release();
  }
};
