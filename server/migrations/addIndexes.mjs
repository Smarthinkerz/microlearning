/**
 * Database Index Migration
 * Adds performance-critical indexes to frequently queried columns.
 * Run with: node server/migrations/addIndexes.mjs
 */
import "dotenv/config";
import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const indexes = [
  // Users
  "CREATE INDEX IF NOT EXISTS idx_users_orgId ON users(orgId)",
  "CREATE INDEX IF NOT EXISTS idx_users_appRole ON users(appRole)",
  "CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)",
  "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)",
  
  // Shifts
  "CREATE INDEX IF NOT EXISTS idx_shifts_userId ON shifts(userId)",
  "CREATE INDEX IF NOT EXISTS idx_shifts_orgId ON shifts(orgId)",
  "CREATE INDEX IF NOT EXISTS idx_shifts_startTime ON shifts(startTime)",
  "CREATE INDEX IF NOT EXISTS idx_shifts_userId_startTime ON shifts(userId, startTime)",
  
  // Lessons
  "CREATE INDEX IF NOT EXISTS idx_lessons_orgId ON lessons(orgId)",
  "CREATE INDEX IF NOT EXISTS idx_lessons_authorId ON lessons(authorId)",
  "CREATE INDEX IF NOT EXISTS idx_lessons_status ON lessons(status)",
  "CREATE INDEX IF NOT EXISTS idx_lessons_category ON lessons(category)",
  
  // Lesson Assignments
  "CREATE INDEX IF NOT EXISTS idx_lesson_assignments_userId ON lesson_assignments(userId)",
  "CREATE INDEX IF NOT EXISTS idx_lesson_assignments_lessonId ON lesson_assignments(lessonId)",
  "CREATE INDEX IF NOT EXISTS idx_lesson_assignments_orgId ON lesson_assignments(orgId)",
  "CREATE INDEX IF NOT EXISTS idx_lesson_assignments_status ON lesson_assignments(status)",
  "CREATE INDEX IF NOT EXISTS idx_lesson_assignments_userId_status ON lesson_assignments(userId, status)",
  
  // Lesson Attempts
  "CREATE INDEX IF NOT EXISTS idx_lesson_attempts_userId ON lesson_attempts(userId)",
  "CREATE INDEX IF NOT EXISTS idx_lesson_attempts_lessonId ON lesson_attempts(lessonId)",
  "CREATE INDEX IF NOT EXISTS idx_lesson_attempts_orgId ON lesson_attempts(orgId)",
  "CREATE INDEX IF NOT EXISTS idx_lesson_attempts_assignmentId ON lesson_attempts(assignmentId)",
  "CREATE INDEX IF NOT EXISTS idx_lesson_attempts_status ON lesson_attempts(status)",
  "CREATE INDEX IF NOT EXISTS idx_lesson_attempts_userId_status ON lesson_attempts(userId, status)",
  
  // Certificates
  "CREATE INDEX IF NOT EXISTS idx_certificates_userId ON certificates(userId)",
  "CREATE INDEX IF NOT EXISTS idx_certificates_lessonId ON certificates(lessonId)",
  "CREATE INDEX IF NOT EXISTS idx_certificates_orgId ON certificates(orgId)",
  
  // Audit Logs
  "CREATE INDEX IF NOT EXISTS idx_audit_logs_userId ON audit_logs(userId)",
  "CREATE INDEX IF NOT EXISTS idx_audit_logs_orgId ON audit_logs(orgId)",
  "CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action)",
  "CREATE INDEX IF NOT EXISTS idx_audit_logs_createdAt ON audit_logs(createdAt)",
  
  // Notifications
  "CREATE INDEX IF NOT EXISTS idx_notifications_userId ON notifications(userId)",
  "CREATE INDEX IF NOT EXISTS idx_notifications_userId_isRead ON notifications(userId, isRead)",
  
  // Subscriptions
  "CREATE INDEX IF NOT EXISTS idx_subscriptions_orgId ON subscriptions(orgId)",
  "CREATE INDEX IF NOT EXISTS idx_subscriptions_planId ON subscriptions(planId)",
  "CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status)",
  
  // Payments
  "CREATE INDEX IF NOT EXISTS idx_payments_orgId ON payments(orgId)",
  "CREATE INDEX IF NOT EXISTS idx_payments_subscriptionId ON payments(subscriptionId)",
  "CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status)",
  
  // Voice Audio Cache
  "CREATE INDEX IF NOT EXISTS idx_voice_audio_cache_textHash ON voice_audio_cache(textHash)",
  "CREATE INDEX IF NOT EXISTS idx_voice_audio_cache_lessonId ON voice_audio_cache(lessonId)",
  "CREATE INDEX IF NOT EXISTS idx_voice_audio_cache_textHash_voiceId ON voice_audio_cache(textHash, voiceId)",
  
  // User Pack Purchases
  "CREATE INDEX IF NOT EXISTS idx_user_pack_purchases_userId ON user_pack_purchases(userId)",
  "CREATE INDEX IF NOT EXISTS idx_user_pack_purchases_packId ON user_pack_purchases(packId)",
  
  // Webhook Configs
  "CREATE INDEX IF NOT EXISTS idx_webhook_configs_orgId ON webhook_configs(orgId)",
];

async function run() {
  const conn = await mysql.createConnection(DATABASE_URL);
  console.log("Connected to database. Applying indexes...\n");
  
  let success = 0;
  let skipped = 0;
  let failed = 0;
  
  for (const sql of indexes) {
    try {
      await conn.execute(sql);
      const match = sql.match(/idx_\w+/);
      console.log(`  ✓ ${match ? match[0] : sql.substring(0, 60)}`);
      success++;
    } catch (err) {
      if (err.code === "ER_DUP_KEYNAME") {
        skipped++;
      } else {
        console.error(`  ✗ Failed: ${sql.substring(0, 60)}... - ${err.message}`);
        failed++;
      }
    }
  }
  
  console.log(`\nDone: ${success} created, ${skipped} already exist, ${failed} failed`);
  await conn.end();
}

run().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
