const { google } =
require("googleapis");

const credentials =
require("../config/oauth.json");

const token =
require("../token.json");

const {
  client_id,
  client_secret,
  redirect_uris,
} = credentials.installed;

const auth =
new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uris[0]
);

auth.setCredentials(token);

const calendar =
google.calendar({
  version: "v3",
  auth,
});

module.exports =
calendar;