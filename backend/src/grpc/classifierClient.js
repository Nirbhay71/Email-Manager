import path from "path";
import { fileURLToPath } from "url";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to classifier.proto in classifier-service/protos/classifier.proto
const PROTO_PATH = path.resolve(__dirname, "../../../classifier-service/protos/classifier.proto");

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
const emailClassifierProto = protoDescriptor.emailclassifier;

const CLASSIFIER_GRPC_HOST = process.env.CLASSIFIER_GRPC_HOST || "localhost:50052";

export const rawClient = new emailClassifierProto.EmailClassifier(
    CLASSIFIER_GRPC_HOST,
    grpc.credentials.createInsecure()
);

function promisify(method) {
    return (request) =>
        new Promise((resolve, reject) => {
            rawClient[method](request, (err, response) => {
                if (err) reject(err);
                else resolve(response);
            });
        });
}

const embedAndStore = promisify("EmbedAndStore");
const classify = promisify("Classify");
const addFeedback = promisify("AddFeedback");
const getCategoryStatus = promisify("GetCategoryStatus");

/**
 * Store one of the user's initial manually-labeled emails (onboarding),
 * or any manually-labeled email added later.
 * @param {string} userEmail
 * @param {object} email { email_id, subject, body_snippet, sender }
 * @param {string} category
 */
export async function storeManualLabel(userEmail, email, category) {
    return embedAndStore({
        user_id: userEmail,
        email: email,
        category,
        source: "MANUAL",
    });
}

/**
 * Classify a newly-arrived email using only this user's history.
 * @param {string} userEmail
 * @param {object} email { email_id, subject, body_snippet, sender }
 * @returns {Promise<object>} { predicted_category, confidence, needs_review, reasoning, candidate_categories, cold_start }
 */
export async function classifyEmail(userEmail, email) {
    return classify({ user_id: userEmail, email });
}

/**
 * Record user feedback on a prediction (accept or correct).
 * @param {string} userEmail
 * @param {object} email { email_id, subject, body_snippet, sender }
 * @param {string} predictedCategory
 * @param {string} correctCategory
 */
export async function recordFeedback(userEmail, email, predictedCategory, correctCategory) {
    return addFeedback({
        user_id: userEmail,
        email,
        predicted_category: predictedCategory,
        correct_category: correctCategory,
        was_correct: predictedCategory === correctCategory,
    });
}

/**
 * Get per-category counts + whether auto-classification is live yet.
 * @param {string} userEmail
 * @returns {Promise<object>} { categories: [{ category, count, auto_classify_enabled, examples_needed }] }
 */
export async function getStatus(userEmail) {
    return getCategoryStatus({ user_id: userEmail });
}
