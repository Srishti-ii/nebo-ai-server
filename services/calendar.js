const { google } = require("googleapis");

if (!process.env.GOOGLE_CREDENTIALS_BASE64) {
  throw new Error("GOOGLE_CREDENTIALS_BASE64 is missing");
}
let credentials;

try {
  const decoded = Buffer.from(
    process.env.GOOGLE_CREDENTIALS_BASE64,
    "base64"
  ).toString("utf-8");

  credentials = JSON.parse(decoded);
} catch (err) {
  throw new Error("Invalid GOOGLE_CREDENTIALS_BASE64 format");
}

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/calendar"],
});

const calendar = google.calendar({
  version: "v3",
  auth,
});

module.exports = calendar;