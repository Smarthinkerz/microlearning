/**
 * Security Hardening Service
 * 
 * Provides:
 * 1. TOTP-based MFA (Time-based One-Time Password)
 * 2. Field-level encryption for sensitive data (PII)
 * 3. GDPR data export and deletion workflows
 * 4. Expanded audit logging with structured events
 */
import crypto from "crypto";
import * as db from "../db";

// ─── Configuration ──────────────────────────────────────────────────

const ENCRYPTION_KEY = process.env.FIELD_ENCRYPTION_KEY || crypto.randomBytes(32).toString("hex");
const ENCRYPTION_ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

// TOTP settings
const TOTP_PERIOD = 30; // seconds
const TOTP_DIGITS = 6;
const TOTP_WINDOW = 1; // Allow 1 period before/after

// ─── Field-Level Encryption ─────────────────────────────────────────

/**
 * Encrypt a string value using AES-256-GCM.
 * Returns base64-encoded ciphertext with IV and auth tag prepended.
 */
export function encryptField(plaintext: string): string {
  const key = Buffer.from(ENCRYPTION_KEY, "hex");
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
  
  let encrypted = cipher.update(plaintext, "utf8");
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  const authTag = cipher.getAuthTag();
  
  // Format: iv + authTag + ciphertext (all base64)
  const combined = Buffer.concat([iv, authTag, encrypted]);
  return combined.toString("base64");
}

/**
 * Decrypt a field encrypted with encryptField.
 */
export function decryptField(ciphertext: string): string {
  const key = Buffer.from(ENCRYPTION_KEY, "hex");
  const combined = Buffer.from(ciphertext, "base64");
  
  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  
  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString("utf8");
}

/**
 * Hash a value for indexing (deterministic, not reversible).
 * Used for searching encrypted fields without decrypting.
 */
export function hashForIndex(value: string): string {
  return crypto.createHmac("sha256", ENCRYPTION_KEY).update(value.toLowerCase().trim()).digest("hex");
}

// ─── TOTP MFA ───────────────────────────────────────────────────────

/**
 * Generate a TOTP secret for a user.
 * Returns the secret and a provisioning URI for QR code generation.
 */
export function generateTOTPSecret(userEmail: string): {
  secret: string;
  uri: string;
  backupCodes: string[];
} {
  const secret = crypto.randomBytes(20).toString("hex");
  const issuer = "LearnShift";
  const uri = `otpauth://totp/${issuer}:${encodeURIComponent(userEmail)}?secret=${base32Encode(secret)}&issuer=${issuer}&algorithm=SHA1&digits=${TOTP_DIGITS}&period=${TOTP_PERIOD}`;
  
  // Generate 8 backup codes
  const backupCodes = Array.from({ length: 8 }, () =>
    crypto.randomBytes(4).toString("hex").toUpperCase()
  );

  return { secret, uri, backupCodes };
}

/**
 * Verify a TOTP code against a secret.
 */
export function verifyTOTP(secret: string, code: string): boolean {
  const now = Math.floor(Date.now() / 1000);
  
  // Check current period and adjacent periods (window)
  for (let i = -TOTP_WINDOW; i <= TOTP_WINDOW; i++) {
    const counter = Math.floor((now + i * TOTP_PERIOD) / TOTP_PERIOD);
    const expected = generateTOTPCode(secret, counter);
    if (timingSafeEqual(code, expected)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Generate a TOTP code for a given counter value.
 */
function generateTOTPCode(secret: string, counter: number): string {
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(counter));
  
  const hmac = crypto.createHmac("sha1", Buffer.from(secret, "hex"));
  hmac.update(buffer);
  const hash = hmac.digest();
  
  const offset = hash[hash.length - 1] & 0x0f;
  const binary =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);
  
  const otp = binary % Math.pow(10, TOTP_DIGITS);
  return otp.toString().padStart(TOTP_DIGITS, "0");
}

/**
 * Timing-safe string comparison.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Base32 encode for TOTP URI compatibility.
 */
function base32Encode(hex: string): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const bytes = Buffer.from(hex, "hex");
  let bits = "";
  for (let i = 0; i < bytes.length; i++) {
    bits += bytes[i].toString(2).padStart(8, "0");
  }
  let result = "";
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.substring(i, i + 5).padEnd(5, "0");
    result += alphabet[parseInt(chunk, 2)];
  }
  return result;
}

// ─── GDPR Compliance ────────────────────────────────────────────────

export type GDPRExportData = {
  profile: Record<string, unknown>;
  learningHistory: unknown[];
  certificates: unknown[];
  notifications: unknown[];
  auditLog: unknown[];
  exportedAt: string;
  format: "json";
};

/**
 * Export all user data for GDPR compliance (Right to Access).
 */
export async function exportUserData(userId: number): Promise<GDPRExportData> {
  const [user, attempts, certificates, notifications, auditLogs] = await Promise.all([
    db.getUserById(userId),
    db.getAttemptsByUser(userId),
    db.getCertificatesByUser(userId),
    db.getNotificationsByUser(userId),
    db.getAuditLogsByUser(userId),
  ]);

  // Sanitize sensitive fields
  const profile = user ? {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    appRole: user.appRole,
    timezone: user.timezone,
    createdAt: user.createdAt,
    lastActiveAt: user.lastActiveAt,
    notificationPreferences: user.notificationPreferences,
  } : {};

  return {
    profile,
    learningHistory: attempts.map((a: any) => ({
      lessonId: a.lessonId,
      startedAt: a.startedAt,
      completedAt: a.completedAt,
      score: a.score,
      maxScore: a.maxScore,
      passed: a.passed,
      timeSpentSeconds: a.timeSpentSeconds,
      status: a.status,
    })),
    certificates: certificates.map((c: any) => ({
      id: c.id,
      lessonTitle: c.lessonTitle,
      issuedAt: c.issuedAt,
      score: c.score,
    })),
    notifications: notifications.map((n: any) => ({
      title: n.title,
      message: n.message,
      type: n.type,
      createdAt: n.createdAt,
      read: n.read,
    })),
    auditLog: auditLogs.map((a: any) => ({
      action: a.action,
      details: a.details,
      createdAt: a.createdAt,
    })),
    exportedAt: new Date().toISOString(),
    format: "json",
  };
}

/**
 * Delete all user data for GDPR compliance (Right to Erasure).
 * Anonymizes the user record and removes personal data.
 */
export async function deleteUserData(userId: number): Promise<{
  success: boolean;
  deletedRecords: Record<string, number>;
}> {
  const deletedRecords: Record<string, number> = {};

  // Anonymize user profile (keep ID for referential integrity)
  await db.updateUser(userId, {
    name: "[Deleted User]",
    email: null,
    avatarUrl: null,
    notificationPreferences: null,
  });
  deletedRecords.profile = 1;

  // Delete push subscriptions
  const pushSubs = await db.getPushSubscriptions(userId);
  for (const sub of pushSubs) {
    await db.removePushSubscription(sub.endpoint);
  }
  deletedRecords.pushSubscriptions = pushSubs.length;

  // Delete notifications
  const notifications = await db.getNotificationsByUser(userId);
  for (const n of notifications) {
    await db.deleteNotification(n.id);
  }
  deletedRecords.notifications = notifications.length;

  // Log the deletion itself
  await db.createAuditLog({
    userId,
    action: "gdpr_data_deletion",
    resourceType: "user",
    resourceId: userId,
    details: { deletedRecords, timestamp: Date.now() },
  });

  return { success: true, deletedRecords };
}

// ─── Expanded Audit Logging ─────────────────────────────────────────

export type AuditEventType =
  | "auth.login"
  | "auth.logout"
  | "auth.mfa_enabled"
  | "auth.mfa_verified"
  | "auth.mfa_failed"
  | "user.profile_updated"
  | "user.role_changed"
  | "lesson.created"
  | "lesson.updated"
  | "lesson.deleted"
  | "lesson.completed"
  | "assignment.created"
  | "assignment.completed"
  | "gdpr.data_export"
  | "gdpr.data_deletion"
  | "admin.settings_changed"
  | "security.rate_limit_exceeded"
  | "security.suspicious_activity";

/**
 * Create a structured audit log entry.
 */
export async function logAuditEvent(
  userId: number,
  event: AuditEventType,
  details: Record<string, unknown>,
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    orgId?: number;
  }
): Promise<void> {
  await db.createAuditLog({
    userId,
    action: event,
    resourceType: event.split(".")[0],
    resourceId: metadata?.orgId || userId,
    details: {
      ...details,
      timestamp: Date.now(),
      ip: metadata?.ipAddress,
      ua: metadata?.userAgent,
    },
  });
}

// ─── Password/Token Utilities ───────────────────────────────────────

/**
 * Generate a secure random token.
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString("hex");
}

/**
 * Hash a password/token with salt using PBKDF2.
 */
export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const useSalt = salt || crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, useSalt, 100000, 64, "sha512").toString("hex");
  return { hash, salt: useSalt };
}

/**
 * Verify a password against a hash.
 */
export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const { hash: computed } = hashPassword(password, salt);
  return timingSafeEqual(computed, hash);
}
