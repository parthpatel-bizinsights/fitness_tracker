const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html,
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent to ${to} via Nodemailer (Gmail).`);
    return true;
  } catch (error) {
    console.error("❌ Failed to send email via Nodemailer:", error);
    // Mock fallback in case authentication fails during local development
    console.log(`📧 [FALLBACK MOCK EMAIL] To: ${to}\nSubject: ${subject}\nContent:\n${html}`);
    return false;
  }
};

module.exports = {
  sendEmail,
};
