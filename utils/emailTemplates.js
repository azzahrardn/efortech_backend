const certificateIssuedTemplate = ({
  userName,
  certificateNumber,
  trainingName,
  issuedDate,
  expiredDate,
}) => {
  return {
    subject: `🎓 Your Certificate for ${trainingName} is Now Available`,
    html: `
      <div style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
        <p>Dear ${userName},</p>

        <p>We are pleased to inform you that you have successfully completed the <strong>${trainingName}</strong> training.</p>

        <p>As a recognition of your achievement, your certificate has been officially issued. Please find the details below:</p>

        <table cellpadding="6" cellspacing="0" style="border-collapse: collapse;">
          <tr><td style="padding: 4px;"><strong>Participant Name</strong></td><td style="padding: 4px;">:</td><td style="padding: 4px;">${userName}</td></tr>
          <tr><td style="padding: 4px;"><strong>Training Program</strong></td><td style="padding: 4px;">:</td><td style="padding: 4px;">${trainingName}</td></tr>
          <tr><td style="padding: 4px;"><strong>Certificate Number</strong></td><td style="padding: 4px;">:</td><td style="padding: 4px;">${certificateNumber}</td></tr>
          <tr><td style="padding: 4px;"><strong>Issued Date</strong></td><td style="padding: 4px;">:</td><td style="padding: 4px;">${issuedDate}</td></tr>
          <tr><td style="padding: 4px;"><strong>Expiration Date</strong></td><td style="padding: 4px;">:</td><td style="padding: 4px;">${
            expiredDate || "No Expiry Date"
          }</td></tr>
        </table>

        <p>You can download your certificate using the following link:<br/>
        <a href="https://efortechedu.com/certificates/${certificateNumber}" target="_blank" style="color: #1a73e8;">
          https://efortechedu.com/certificates/${certificateNumber}
        </a></p>

        <p>We sincerely thank you for your active participation and commitment throughout the training.</p>

        <p>Best regards,<br/>
        <strong>Efortech Edu Team</strong></p>
      </div>
    `,
  };
};

const certificateValidationTemplate = ({
  userName,
  certificateNumber,
  certificateName,
  issuedDate,
  expiredDate,
  status,
  notes,
}) => {
  const isAccepted = status === "Accepted";
  const isRejected = status === "Rejected";

  return {
    subject: `Certificate Validation Status: ${status}`,
    html: `
      <div style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
        <p>Dear ${userName},</p>

        <p>We hope this message finds you well. We are writing to inform you that your certificate has been <strong>${status.toUpperCase()}</strong>.</p>

        <p><strong>Certificate Details:</strong></p>
        <table cellpadding="6" cellspacing="0" style="border-collapse: collapse;">
          <tr><td style="padding: 4px;"><strong>Certificate Name</strong></td><td style="padding: 4px;">:</td><td style="padding: 4px;">${certificateName}</td></tr>
          <tr><td style="padding: 4px;"><strong>Certificate Number</strong></td><td style="padding: 4px;">:</td><td style="padding: 4px;">${certificateNumber}</td></tr>
          <tr><td style="padding: 4px;"><strong>Issued Date</strong></td><td style="padding: 4px;">:</td><td style="padding: 4px;">${issuedDate}</td></tr>
          <tr><td style="padding: 4px;"><strong>Expiration Date</strong></td><td style="padding: 4px;">:</td><td style="padding: 4px;">${
            expiredDate || "No Expiry Date"
          }</td></tr>
          <tr><td style="padding: 4px;"><strong>Validation Status</strong></td><td style="padding: 4px;">:</td><td style="padding: 4px;"><strong>${status}</strong></td></tr>
        </table>

        ${
          isAccepted
            ? `<p>🎉 Congratulations! Your certificate has been successfully verified and accepted into our system.</p>`
            : `<p><strong>Notes:</strong><br/>${notes || "-"}<br/><br/>
               If you believe this decision was made in error, you are welcome to resubmit your certificate for further review.</p>`
        }

        ${
          !isRejected
            ? `<p>You can view your certificate details at:<br/>
               <a href="https://efortechedu.com/certificates/${certificateNumber}" target="_blank" style="color: #1a73e8;">
               https://efortechedu.com/certificates/${certificateNumber}</a></p>`
            : ""
        }

        <p>Thank you for your submission.<br/>
        Best regards,<br/>
        <strong>Efortech Edu Team</strong></p>
      </div>
    `,
  };
};

module.exports = { certificateIssuedTemplate, certificateValidationTemplate };
