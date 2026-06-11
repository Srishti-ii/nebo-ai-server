const { google } = require("googleapis");
if (!process.env.GOOGLE_CREDENTIALS_BASE64) {
  throw new Error("GOOGLE_CREDENTIALS_BASE64 is missing");
}

const credentials = JSON.parse(
  Buffer.from(process.env.GOOGLE_CREDENTIALS_BASE64, "base64").toString("utf-8")
);
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: [
    "https://www.googleapis.com/auth/calendar",
  ],
});

const calendar = google.calendar({
  version: "v3",
  auth,
});

module.exports = calendar;