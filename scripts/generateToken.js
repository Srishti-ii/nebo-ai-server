console.log("Script started");
console.log("1");

const fs = require("fs");
console.log("2");

const readline = require("readline");
console.log("3");

const { google } = require("googleapis");
console.log("4");

const credentials = require("../config/oauth.json");
console.log("5");


const {
  client_secret,
  client_id,
  redirect_uris,
} =
credentials.installed;
console.log("6");
const oauth2Client =
new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uris[0]
);
console.log("7");
const SCOPES = [
  "https://www.googleapis.com/auth/calendar"
];

const authUrl =
oauth2Client.generateAuthUrl({
  access_type: "offline",
  scope: SCOPES,
});
console.log("8");
console.log(authUrl);
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