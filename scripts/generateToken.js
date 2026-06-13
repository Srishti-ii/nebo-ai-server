const fs = require("fs");
const readline = require("readline");
const { google } = require("googleapis");

const credentials =
require("../config/oauth.json");

const {
  client_secret,
  client_id,
  redirect_uris,
} =
credentials.installed;

const oauth2Client =
new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uris[0]
);

const SCOPES = [
  "https://www.googleapis.com/auth/calendar"
];

const authUrl =
oauth2Client.generateAuthUrl({
  access_type: "offline",
  scope: SCOPES,
});

console.log(
  "Authorize here:",
  authUrl
);

const rl =
readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question(
  "Enter code: ",
  async (code) => {
    const { tokens } =
      await oauth2Client.getToken(
        code
      );

    fs.writeFileSync(
      "token.json",
      JSON.stringify(tokens)
    );

    console.log(
      "Token saved"
    );

    rl.close();
  }
);