const authorize = require("./auth");

async function main() {
    const auth = await authorize();

    const token = auth.credentials.access_token;

    const response = await fetch(
        "https://gmail.googleapis.com/gmail/v1/users/me/profile",
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    console.log("Status:", response.status);

    console.log(await response.text());
}

main();