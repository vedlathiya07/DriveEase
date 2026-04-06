// =====================================
// EMAIL SERVICE (NODEMAILER)
// =====================================

const nodemailer = require("nodemailer");

const isMailerConfigured =
  process.env.EMAIL_USER && process.env.EMAIL_PASS ? true : false;

const transporter = isMailerConfigured
  ? nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })
  : null;

// =====================================
// SEND EMAIL FUNCTION
// =====================================
const sendEmail = async (to, subject, text) => {
  try {
    if (!transporter) {
      console.log("Email skipped because mailer credentials are not configured");
      return;
    }

    const mailOptions = {
      from: `DriveEase <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    };

    await transporter.sendMail(mailOptions);

    console.log("✅ Email sent successfully");
  } catch (error) {
    console.error("❌ Email error:", error.message);
  }
};

module.exports = sendEmail;
