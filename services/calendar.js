const { google } =
require("googleapis");
const path = require("path");
const fs = require("fs");

const tokenPath =
path.join(__dirname, "..", "token.json");
let auth;

// PRIORITY 1: OAuth2 from env vars (supports Meet links)
if (
process.env.GOOGLE_CLIENT_ID &&
process.env.GOOGLE_CLIENT_SECRET
) {
const oauth2 =
 new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
 );
// Use refresh token from env or token.json
let refreshToken =
 process.env.GOOGLE_REFRESH_TOKEN;

if (!refreshToken && fs.existsSync(tokenPath)) {
 const tokens =
  JSON.parse(
   fs.readFileSync(tokenPath, "utf-8")
  );
 refreshToken = tokens.refresh_token;
}
oauth2.setCredentials({
 refresh_token: refreshToken
});

console.log("Calendar auth: OAuth2 (supports Meet links)");

}
  
// PRIORITY 2: Service account from credentials.json (no Meet links)
if (!auth) {
const credPath =
 path.join(__dirname, "..", "credentials.json");

if (fs.existsSync(credPath)) {

 const creds =
  JSON.parse(
   fs.readFileSync(credPath, "utf-8")
  );
// Fallback to env vars

 if (creds.type === "service_account") {

  auth = new google.auth.GoogleAuth({
   keyFile: credPath,
   scopes: [
    "https://www.googleapis.com/auth/calendar"
   ]
  });

  console.log("Calendar auth: Service Account (no Meet links - add GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET to .env for Meet support)");
 }
}
}
if (!auth) {
throw new Error(
 "No Google credentials found. Set GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET in .env or provide credentials.json"
);
}
const calendar =
google.calendar({
  version: "v3",
  auth,
});
module.exports =
calendar;
