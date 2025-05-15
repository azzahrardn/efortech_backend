const certificateIssuedTemplate = ({
  userName,
  certificateNumber,
  trainingName,
  issuedDate,
  expiredDate,
}) => {
  return {
    subject: `Your Certificate for ${trainingName} is Ready!`,
    html: `
          <p>Hello ${userName},</p>
          <p>Congratulations! You have successfully completed the <strong>${trainingName}</strong> training.</p>
          <p>Here are the details of your certificate:</p>
          <table cellpadding="4" cellspacing="0" style="font-family: Arial, sans-serif; font-size: 14px;">
            <tr><td><strong>Participant Name</strong></td><td>:</td><td>${userName}</td></tr>
            <tr><td><strong>Training</strong></td><td>:</td><td>${trainingName}</td></tr>
            <tr><td><strong>Certificate Number</strong></td><td>:</td><td>${certificateNumber}</td></tr>
            <tr><td><strong>Issued Date</strong></td><td>:</td><td>${issuedDate}</td></tr>
            <tr><td><strong>Expiration Date</strong></td><td>:</td><td>${expiredDate}</td></tr>
          </table>
          <p>You can download your certificate via the following link:<br/>
          <a href="https://efortechedu.com/certificates/${certificateNumber}">https://efortechedu.com/certificates/${certificateNumber}</a></p>
          <p>Thank you for your participation.</p>
          <p>Warm regards,<br/>Efortech Edu Team</p>
        `,
  };
};

module.exports = { certificateIssuedTemplate };
