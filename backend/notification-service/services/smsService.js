const twilio = require("twilio")

// Only initialize Twilio if credentials are properly configured
let client = null
if (
  process.env.TWILIO_ACCOUNT_SID &&
  process.env.TWILIO_ACCOUNT_SID.startsWith("AC") &&
  process.env.TWILIO_AUTH_TOKEN &&
  process.env.TWILIO_PHONE_NUMBER
) {
  try {
    client = new twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    )
    console.log("✅ Twilio SMS service initialized")
  } catch (err) {
    console.warn("⚠️ Failed to initialize Twilio:", err.message)
    client = null
  }
} else {
  console.warn("⚠️ Twilio SMS service not configured (missing credentials)")
}

const sendSMS = async (to, message) => {
  if (!client) {
    console.warn(`ℹ️ SMS to ${to} skipped - Twilio not configured`)
    return { status: "skipped", reason: "SMS service not configured" }
  }

  try {
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
    })
    console.log("✅ SMS sent successfully:", result.sid)
    return { status: "sent", sid: result.sid }
  } catch (err) {
    console.error("❌ Error sending SMS:", err.message)
    throw err
  }
}

module.exports = sendSMS
