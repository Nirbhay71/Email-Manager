import { getStatus, storeManualLabel, classifyEmail } from "./classifierClient.js";

async function main() {
    console.log("=== Testing gRPC Classifier Connection ===");
    const testEmail = "test_user@gmail.com";
    
    try {
        console.log("1. Requesting category status...");
        const status = await getStatus(testEmail);
        console.log("Status response:", JSON.stringify(status, null, 2));

        console.log("\n2. Storing manual label...");
        const emailContent = {
            email_id: "test_msg_123",
            subject: "Job Offer from Google",
            body_snippet: "Congratulations! You have received a job offer for the Software Engineer role.",
            sender: "recruiters@google.com"
        };
        const storeRes = await storeManualLabel(testEmail, emailContent, "Career");
        console.log("Store response:", JSON.stringify(storeRes, null, 2));

        console.log("\n3. Classifying a new email...");
        const incomingEmail = {
            email_id: "test_msg_456",
            subject: "Google interview updates",
            body_snippet: "Your interview is scheduled for next Monday. Here are the details.",
            sender: "recruiters@google.com"
        };
        const classifyRes = await classifyEmail(testEmail, incomingEmail);
        console.log("Classify response:", JSON.stringify(classifyRes, null, 2));

        console.log("\n4. Requesting category status again...");
        const status2 = await getStatus(testEmail);
        console.log("Updated status response:", JSON.stringify(status2, null, 2));

        console.log("\n=== Test completed successfully! ===");
    } catch (err) {
        console.error("Test failed with error:", err);
    }
}

main();
