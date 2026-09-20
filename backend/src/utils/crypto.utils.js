import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

function getKey() {
    const keyHex = process.env.TOKEN_ENCRYPTION_KEY;
    if (!keyHex) {
        throw new Error("TOKEN_ENCRYPTION_KEY is not set — cannot encrypt/decrypt stored OAuth tokens");
    }
    const key = Buffer.from(keyHex, "hex");
    if (key.length !== 32) {
        throw new Error("TOKEN_ENCRYPTION_KEY must be a 32-byte value hex-encoded (64 hex characters)");
    }
    return key;
}

/**
 * Encrypts a plaintext string with AES-256-GCM.
 * Returns "iv:authTag:ciphertext" (all hex) so it can be stored as a single string field.
 */
export function encrypt(plaintext) {
    const key = getKey();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * Decrypts a string produced by encrypt(). Returns null if given a falsy input.
 */
export function decrypt(payload) {
    if (!payload) return null;
    const [ivHex, authTagHex, dataHex] = payload.split(":");
    if (!ivHex || !authTagHex || !dataHex) {
        throw new Error("Malformed encrypted payload");
    }
    const key = getKey();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, "hex"));
    decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
    const decrypted = Buffer.concat([
        decipher.update(Buffer.from(dataHex, "hex")),
        decipher.final()
    ]);
    return decrypted.toString("utf8");
}

/**
 * SHA-256 hash used for storing/looking up opaque refresh tokens.
 * We only ever need equality checks, never the original value back,
 * so a one-way hash (not encryption) is correct here.
 */
export function sha256(value) {
    return crypto.createHash("sha256").update(value).digest("hex");
}
