const { google } =
require("googleapis");

const path = require("path");
const fs = require("fs");

// Load credentials from credentials.json (service account)
const credPath =
path.join(__dirname, "..", "credentials.json");

const tokenPath =
path.join(__dirname, "..", "token.json");


let auth;

if (fs.existsSync(credPath)) {

const creds =
JSON.parse(
 fs.readFileSync(credPath, "utf-8")
);


// Service account auth
if (creds.type === "service_account") {

 auth = new google.auth.GoogleAuth({
  keyFile: credPath,
  scopes: [
   "https://www.googleapis.com/auth/calendar"
  ]
 });

}

// OAuth2 client credentials
else if (creds.installed || creds.web) {

 const clientCreds =
  creds.installed || creds.web;

 const oauth2 =
  new google.auth.OAuth2(
   clientCreds.client_id,
   clientCreds.client_secret
  );

 // Load saved tokens
 if (fs.existsSync(tokenPath)) {

  const tokens =
   JSON.parse(
    fs.readFileSync(tokenPath, "utf-8")
   );

  oauth2.setCredentials(tokens);
 }

 auth = oauth2;

}

}

// Fallback to env vars
else if (
process.env.GOOGLE_CLIENT_ID &&
process.env.GOOGLE_CLIENT_SECRET
) {

const oauth2 =
 new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
 );

oauth2.setCredentials({
 refresh_token:
  process.env.GOOGLE_REFRESH_TOKEN
});

auth = oauth2;

}


if (!auth) {
throw new Error(
 "No Google credentials found. Provide credentials.json or set GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET in .env"
);
}


const calendar =
google.calendar({
  version: "v3",
  auth,
});

module.exports =
calendar;
