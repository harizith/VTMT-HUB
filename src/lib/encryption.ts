import crypto from "crypto";
import bcrypt from "bcryptjs";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "default_secret_key_32_bytes_long";
const IV_LENGTH = 16;

/**
 * Hashes a plaintext password securely using salted bcrypt.
 * Passwords should never be stored reversibly in production.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Securely verifies a password against stored credentials.
 * Supports standard bcrypt hashes, with fallback support for legacy encrypted records during migration.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (!password || !storedHash) return false;

  // 1. Primary check: standard bcrypt hash
  try {
    const isBcryptMatch = await bcrypt.compare(password, storedHash);
    if (isBcryptMatch) return true;
  } catch {
    // Not a bcrypt hash, continue to legacy fallback
  }

  // 2. Legacy check: encrypted AES string from older versions
  if (storedHash.includes(":")) {
    const decrypted = decrypt(storedHash);
    if (decrypted === password) return true;
  }

  // 3. Fallback: direct match (if previously stored in plaintext)
  if (storedHash === password) {
    return true;
  }

  return false;
}

/**
 * @deprecated Legacy reversible encryption helper. Use hashPassword for user credentials.
 */
export function encrypt(text: string) {
  if (!text) return text;
  if (text.startsWith("$2a$") || text.startsWith("$2b$") || text.includes(":")) return text;

  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString("hex") + ":" + encrypted.toString("hex");
  } catch (e) {
    console.error("Encryption error", e);
    return text;
  }
}

/**
 * @deprecated Legacy decryption helper for backwards compatibility.
 */
export function decrypt(text: string) {
  if (!text) return text;
  if (text.startsWith("$2a$") || text.startsWith("$2b$")) {
    return "[Cannot decrypt - bcrypt hash]";
  }
  if (!text.includes(":")) {
    return text;
  }

  try {
    const textParts = text.split(":");
    const iv = Buffer.from(textParts.shift()!, "hex");
    const encryptedText = Buffer.from(textParts.join(":"), "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (e) {
    console.error("Decryption error", e);
    return text;
  }
}
