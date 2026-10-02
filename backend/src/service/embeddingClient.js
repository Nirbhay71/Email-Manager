import { hybridSearchClient, buildServiceMetadata } from "../grpc/hybridSearchClient.js";

/**
 * Invokes EmbedAndStore gRPC call on the Python search service.
 */
export function embedAndStoreEmail({ messageId, userEmail, subject, body }) {
    return new Promise((resolve, reject) => {
        const payload = {
            message_id: messageId,
            user_email: userEmail,
            subject: subject || "",
            body: body || ""
        };

        hybridSearchClient.EmbedAndStore(payload, buildServiceMetadata(), (err, response) => {
            if (err) {
                console.error("[embeddingClient] gRPC call failed:", err);
                return reject(err);
            }
            if (!response.success) {
                console.error("[embeddingClient] Python service error:", response.error);
                return reject(new Error(response.error));
            }
            console.log(`[embeddingClient] Vector stored successfully for email ${messageId}`);
            resolve(response);
        });
    });
}

/**
 * Removes every search vector stored for this user (account deletion).
 */
export function deleteUserVectors(userEmail) {
    return new Promise((resolve, reject) => {
        hybridSearchClient.DeleteUserData({ user_email: userEmail }, buildServiceMetadata(), (err, response) => {
            if (err) return reject(err);
            if (!response.success) return reject(new Error(response.error || "delete failed"));
            resolve(response);
        });
    });
}
