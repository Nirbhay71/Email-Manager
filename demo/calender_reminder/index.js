const authorize = require("./auth");
const test = require("./gmail");

async function main() {
  const auth = await authorize();
  await test(auth);
}

main();