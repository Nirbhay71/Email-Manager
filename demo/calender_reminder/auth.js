const fs = require("fs");
const path = require("path");
const { authenticate } = require("@google-cloud/local-auth");

const TOKEN_PATH = path.join(__dirname, "token.json");
const CREDENTIALS_PATH = path.join(__dirname, "credentials.json");

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/calendar",
];

async function authorize() {
  const auth = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });

  fs.writeFileSync(TOKEN_PATH, JSON.stringify(auth.credentials));

  console.log("✅ Authentication Successful");

  return auth;
}

module.exports = authorize;