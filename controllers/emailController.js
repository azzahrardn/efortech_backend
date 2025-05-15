const nodemailer = require("nodemailer");
const db = require("../config/db");
const {
  sendSuccessResponse,
  sendErrorResponse,
  sendBadRequestResponse,
} = require("../utils/responseUtils");
const { sendEmail } = require("../utils/mailer");
const { certificateIssuedTemplate } = require("../utils/emailTemplates");

// Endpoint for get registration training certificate email preview
exports.previewTrainingCertificateEmail = async (req, res) => {
  const {
    registration_participant_id,
    certificate_number,
    issued_date,
    expired_date,
  } = req.body;

  try {
    const query = `
          SELECT 
            u.fullname AS participant_name,
            u.email,
            t.training_name
          FROM registration_participant rp
          JOIN users u ON rp.user_id = u.user_id
          JOIN registration r ON rp.registration_id = r.registration_id
          JOIN training t ON r.training_id = t.training_id
          WHERE rp.registration_participant_id = $1
        `;

    const { rows } = await db.query(query, [registration_participant_id]);

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Data not found" });
    }

    const { participant_name, email, training_name } = rows[0];

    const { subject, html } = certificateIssuedTemplate({
      userName: participant_name,
      certificateNumber: certificate_number,
      trainingName: training_name,
      issuedDate: issued_date,
      expiredDate: expired_date || "Tidak ada",
    });

    return res.status(200).json({
      status: "success",
      message: "Preview generated",
      data: {
        html,
        to: email,
        subject,
      },
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ status: "failed", message: "Internal server error" });
  }
};

// Endpoint for send registration training certificate email
exports.sendTrainingCertificateEmail = async (req, res) => {
  const { certificate_number } = req.body;

  if (!certificate_number) {
    return sendBadRequestResponse(res, "Missing certificate_number");
  }

  try {
    const query = `
        SELECT 
          c.certificate_number,
          c.issued_date,
          c.expired_date,
          u.fullname AS participant_name,
          u.email,
          t.training_name
        FROM certificate c
        JOIN registration_participant rp ON c.registration_participant_id = rp.registration_participant_id
        JOIN users u ON rp.user_id = u.user_id
        JOIN registration r ON rp.registration_id = r.registration_id
        JOIN training t ON r.training_id = t.training_id
        WHERE c.certificate_number = $1
      `;

    const { rows } = await db.query(query, [certificate_number]);

    if (rows.length === 0) {
      return sendErrorResponse(res, "Certificate not found");
    }

    const {
      participant_name,
      email,
      training_name,
      issued_date,
      expired_date,
    } = rows[0];

    const { subject, html } = certificateIssuedTemplate({
      userName: participant_name,
      certificateNumber: certificate_number,
      trainingName: training_name,
      issuedDate: issued_date.toISOString().split("T")[0],
      expiredDate: expired_date
        ? expired_date.toISOString().split("T")[0]
        : "Tidak ada",
    });

    const info = await sendEmail({ to: email, subject, html });

    return sendSuccessResponse(res, "Email sent successfully", {
      messageId: info.messageId,
      accepted: info.accepted,
      to: email,
    });
  } catch (err) {
    console.error("Send email error:", err);
    return sendErrorResponse(res, "Failed to send email", err.message);
  }
};
