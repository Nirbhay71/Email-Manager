const authorize = require("./auth");

async function main() {
  const auth = await authorize();

  const info = await auth.getTokenInfo(auth.credentials.access_token);

  console.log(info);
}

main().catch(console.error);