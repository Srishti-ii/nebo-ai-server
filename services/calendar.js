const { google } = require("googleapis");

if (!process.env.GOOGLE_CREDENTIALS_BASE64) {
  throw new Error("GOOGLE_CREDENTIALS_BASE64 is missing");
}

const decoded = Buffer.from(
  process.env.GOOGLE_CREDENTIALS_BASE64,
  "base64"
).toString("utf-8");

const parsed = JSON.parse(decoded);
console.log("KEY CHECK START:", parsed.private_key.slice(0, 50));
console.log("KEY CHECK MIDDLE:", parsed.private_key.includes("BEGIN PRIVATE KEY"));
console.log("KEY CHECK END:", parsed.private_key.slice(-50));

const auth = new google.auth.GoogleAuth({
  credentials: parsed,
  scopes: ["https://www.googleapis.com/auth/calendar"],
});

const calendar = google.calendar({
  version: "v3",
  auth,
});

module.exports = calendar;