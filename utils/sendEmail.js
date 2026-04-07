// =====================================
// EMAIL SERVICE (RESEND)
// =====================================

const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

// =====================================
// SEND EMAIL FUNCTION
// =====================================
const sendEmail = async (to, subject, text) => {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.log("Email skipped: RESEND_API_KEY not configured");
      return;
    }

    await resend.emails.send({
      from: "DriveEase <onboarding@resend.dev>", // default sender (works instantly)
      to,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>${subject}</h2>
          <p>${text}</p>
          <hr/>
          <small>DriveEase - Smart Car Rental Platform</small>
        </div>
      `,
    });

    console.log("✅ Email sent successfully via Resend");
  } catch (error) {
    console.error("❌ Email error:", error.message);
  }
};

module.exports = sendEmail;
