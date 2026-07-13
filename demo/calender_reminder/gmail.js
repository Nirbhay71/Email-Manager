const { google } = require("googleapis");

async function test(auth) {
  const gmail = google.gmail({
    version: "v1",
    auth,
  });

  try {
    const profile = await gmail.users.getProfile({
      userId: "me",
    });

    console.log(profile.data);
  } catch (err) {
    console.error(err.response?.data || err);
  }
}

module.exports = test;