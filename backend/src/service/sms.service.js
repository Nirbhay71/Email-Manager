import twilio from "twilio";

export async function sendTestSms(body) {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
        console.log("[sms] Twilio not configured, skipping SMS");
        return "skipped";
    }

    const client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
    );

    const message = await client.messages.create({
        body,
        from: process.env.TWILIO_FROM_NUMBER,
        to: process.env.TWILIO_TEST_TO_NUMBER
    });

    return message.sid;
}