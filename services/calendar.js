const { google } =
require("googleapis");

const { google } =
require("googleapis");

const auth =
new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

auth.setCredentials({
  refresh_token:
    process.env.GOOGLE_REFRESH_TOKEN,
});

const calendar =
google.calendar({
  version: "v3",
  auth,
});

module.exports =
calendar;

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