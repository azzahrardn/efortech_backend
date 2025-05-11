const db = require("../config/db");
const {
  sendSuccessResponse,
  sendErrorResponse,
} = require("../utils/responseUtils");

function getValidityStatus(expiredDate) {
  return new Date(expiredDate) < new Date() ? "Expired" : "Valid";
}

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
