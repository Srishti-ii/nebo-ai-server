const { google } = require("googleapis");
if (!process.env.GOOGLE_CREDENTIALS_JSON) {
  throw new Error("GOOGLE_CREDENTIALS_JSON is missing");
}
const credentials = JSON.parse(
  process.env.GOOGLE_CREDENTIALS_JSON
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