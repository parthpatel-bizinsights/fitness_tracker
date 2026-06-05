const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const generateEmailTemplate = (
  title,
  preheader,
  bodyText,
  buttonText,
  buttonUrl,
) => {
  return `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 24px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); overflow: hidden; border: 1px solid #e2e8f0; }
  .header { background: linear-gradient(135deg, #8b5cf6, #d946ef); padding: 40px 20px; text-align: center; }
  .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
  .content { padding: 40px 30px; text-align: center; color: #334155; }
  .content p { font-size: 16px; line-height: 1.6; margin-bottom: 30px; }
  .button { display: inline-block; background-color: #8b5cf6; color: #ffffff !important; font-weight: 600; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-size: 16px; transition: background-color 0.2s; box-shadow: 0 4px 6px -1px rgba(139, 92, 246, 0.3); }
  .footer { padding: 20px; text-align: center; font-size: 13px; color: #94a3b8; background-color: #f8fafc; border-top: 1px solid #f1f5f9; }
</style>
</head>
<body>
  <div style="display: none; max-height: 0px; overflow: hidden;">${preheader}</div>
  <div class="container">
    <div class="header">
      <h1>Aura Fitness</h1>
    </div>
    <div class="content">
      <h2 style="color: #0f172a; margin-top: 0; font-size: 22px;">${title}</h2>
      <p>${bodyText}</p>
        ${buttonText && buttonUrl ? `<a href="${buttonUrl}" class="button">${buttonText}</a>` : ""}
    </div>
    <div class="footer">
      If you didn't request this email, you can safely ignore it.<br>
      &copy; ${new Date().getFullYear()} Aura Fitness. All rights reserved.
    </div>
  </div>
</body>
</html>
  `;
};

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
    console.log(
      `📧 [FALLBACK MOCK EMAIL] To: ${to}\nSubject: ${subject}\nContent:\n${html}`,
    );
    return false;
  }
};

module.exports = {
  sendEmail,
  generateEmailTemplate,
};
