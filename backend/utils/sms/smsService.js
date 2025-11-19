const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;   // from Twilio Console
const authToken  = process.env.TWILIO_AUTH_TOKEN;    // from Twilio Console
const fromNumber = process.env.TWILIO_PHONE_NUMBER;          // e.g. +1XXXXXXXXXX (trial number) or Messaging Service SID (MGxxx)

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

// Sends a plain ASCII SMS. to must be E.164, e.g. +9198XXXXXXXX
async function sendSMS(to, body) {
  if (!client) return;
  if (!to || !body) return;
  // Trim to stay within a single 160-char GSM segment where possible
  const msg = String(body).replace(/[^\x00-\x7F]/g, '').slice(0, 140);
  await client.messages.create({
    body: msg,
    to,
    ...(fromNumber?.startsWith('MG') ? { messagingServiceSid: fromNumber } : { from: fromNumber })
  });
}

module.exports = { sendSMS };
