/**
 * Breach Detection & Notification Pipeline
 * 
 * Monitors for security anomalies and triggers breach events:
 * - Failed login spikes (>100 in 15 min window)
 * - Bulk data access patterns (>50 records in 1 min)
 * - Unusual API patterns (>500 requests/min from single IP)
 * - Privilege escalation attempts
 * - Data export anomalies
 * 
 * SLA: Notify within 72 hours (GDPR Article 33 compliance)
 */

import * as db from "../db";
import { notifyOwner } from "../_core/notification";
import { sendBreachNotificationEmail, sendGDPRBreachAlert } from "./emailService";

// ─── Types ──────────────────────────────────────────────────────────
export interface AnomalyEvent {
  type: AnomalyType;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  metadata: Record<string, unknown>;
  affectedUserCount: number;
  sourceIp?: string;
  userId?: number;
}

export type AnomalyType =
  | "failed_login_spike"
  | "bulk_data_access"
  | "api_abuse"
  | "privilege_escalation"
  | "data_export_anomaly"
  | "suspicious_pattern"
  | "manual_report";

interface ThresholdConfig {
  failedLoginsPerWindow: number;
  windowMinutes: number;
  bulkAccessThreshold: number;
  bulkAccessWindowMinutes: number;
  apiAbuseThreshold: number;
  apiAbuseWindowMinutes: number;
}

// ─── Configuration ──────────────────────────────────────────────────
const THRESHOLDS: ThresholdConfig = {
  failedLoginsPerWindow: 100,
  windowMinutes: 15,
  bulkAccessThreshold: 50,
  bulkAccessWindowMinutes: 1,
  apiAbuseThreshold: 500,
  apiAbuseWindowMinutes: 1,
};

// In-memory sliding window counters
const failedLoginCounter = new Map<string, { count: number; firstSeen: number }>();
const bulkAccessCounter = new Map<string, { count: number; firstSeen: number }>();
const apiRequestCounter = new Map<string, { count: number; firstSeen: number }>();

// Track which anomalies have already been reported to avoid duplicates
const reportedAnomalies = new Set<string>();

// ─── Anomaly Detection Functions ────────────────────────────────────

/**
 * Record a failed login attempt and check for spike.
 */
export function recordFailedLogin(ip: string, userId?: number): AnomalyEvent | null {
  const now = Date.now();
  const windowMs = THRESHOLDS.windowMinutes * 60 * 1000;
  const key = `login:${ip}`;

  const entry = failedLoginCounter.get(key);
  if (!entry || now - entry.firstSeen > windowMs) {
    failedLoginCounter.set(key, { count: 1, firstSeen: now });
    return null;
  }

  entry.count++;
  if (entry.count >= THRESHOLDS.failedLoginsPerWindow) {
    const anomalyKey = `failed_login:${ip}:${Math.floor(now / windowMs)}`;
    if (reportedAnomalies.has(anomalyKey)) return null;
    reportedAnomalies.add(anomalyKey);

    // Reset counter
    failedLoginCounter.delete(key);

    return {
      type: "failed_login_spike",
      severity: "high",
      description: `${entry.count} failed login attempts from IP ${ip} in ${THRESHOLDS.windowMinutes} minutes`,
      metadata: { ip, count: entry.count, windowMinutes: THRESHOLDS.windowMinutes },
      affectedUserCount: userId ? 1 : 0,
      sourceIp: ip,
      userId,
    };
  }

  return null;
}

/**
 * Record a bulk data access event and check for anomaly.
 */
export function recordBulkAccess(userId: number, recordCount: number): AnomalyEvent | null {
  const now = Date.now();
  const windowMs = THRESHOLDS.bulkAccessWindowMinutes * 60 * 1000;
  const key = `bulk:${userId}`;

  const entry = bulkAccessCounter.get(key);
  if (!entry || now - entry.firstSeen > windowMs) {
    bulkAccessCounter.set(key, { count: recordCount, firstSeen: now });
  } else {
    entry.count += recordCount;
  }

  const current = bulkAccessCounter.get(key)!;
  if (current.count >= THRESHOLDS.bulkAccessThreshold) {
    const anomalyKey = `bulk:${userId}:${Math.floor(now / windowMs)}`;
    if (reportedAnomalies.has(anomalyKey)) return null;
    reportedAnomalies.add(anomalyKey);

    bulkAccessCounter.delete(key);

    return {
      type: "bulk_data_access",
      severity: "medium",
      description: `User ${userId} accessed ${current.count} records in ${THRESHOLDS.bulkAccessWindowMinutes} minute(s)`,
      metadata: { userId, recordCount: current.count },
      affectedUserCount: 1,
      userId,
    };
  }

  return null;
}

/**
 * Record API request and check for abuse pattern.
 */
export function recordApiRequest(ip: string): AnomalyEvent | null {
  const now = Date.now();
  const windowMs = THRESHOLDS.apiAbuseWindowMinutes * 60 * 1000;
  const key = `api:${ip}`;

  const entry = apiRequestCounter.get(key);
  if (!entry || now - entry.firstSeen > windowMs) {
    apiRequestCounter.set(key, { count: 1, firstSeen: now });
    return null;
  }

  entry.count++;
  if (entry.count >= THRESHOLDS.apiAbuseThreshold) {
    const anomalyKey = `api:${ip}:${Math.floor(now / windowMs)}`;
    if (reportedAnomalies.has(anomalyKey)) return null;
    reportedAnomalies.add(anomalyKey);

    apiRequestCounter.delete(key);

    return {
      type: "api_abuse",
      severity: "high",
      description: `${entry.count} API requests from IP ${ip} in ${THRESHOLDS.apiAbuseWindowMinutes} minute(s)`,
      metadata: { ip, count: entry.count },
      affectedUserCount: 0,
      sourceIp: ip,
    };
  }

  return null;
}

/**
 * Record a privilege escalation attempt.
 */
export function recordPrivilegeEscalation(userId: number, attemptedAction: string): AnomalyEvent {
  return {
    type: "privilege_escalation",
    severity: "critical",
    description: `User ${userId} attempted unauthorized action: ${attemptedAction}`,
    metadata: { userId, attemptedAction },
    affectedUserCount: 1,
    userId,
  };
}

// ─── Breach Event Processing ────────────────────────────────────────

/**
 * Process an anomaly event: create breach record, notify admin, log audit.
 */
export async function processAnomalyEvent(event: AnomalyEvent): Promise<number | null> {
  try {
    // Create breach event in database
    // Map our anomaly types to schema-compatible event types
    const eventTypeMap: Record<AnomalyType, string> = {
      failed_login_spike: "brute_force",
      bulk_data_access: "data_exfiltration",
      api_abuse: "anomalous_pattern",
      privilege_escalation: "unauthorized_admin_access",
      data_export_anomaly: "data_exfiltration",
      suspicious_pattern: "anomalous_pattern",
      manual_report: "manual_report",
    };

    const result = await db.createBreachEvent({
      eventType: eventTypeMap[event.type] as any,
      severity: event.severity,
      description: event.description,
      affectedUserCount: event.affectedUserCount,
      metadata: event.metadata as any,
      sourceIp: event.sourceIp ?? null,
      status: "detected",
    });

    // Get the breach event ID
    const breachId = (result as any).insertId ?? (result as any)[0]?.insertId ?? null;

    // Create audit log
    await db.createAuditLog({
      userId: event.userId ?? null,
      action: `breach.${event.type}`,
      resourceType: "breach_event",
      details: {
        severity: event.severity,
        description: event.description,
        breachId,
      } as any,
    });

    // For high/critical severity, immediately notify via email + owner notification
    if (event.severity === "high" || event.severity === "critical") {
      // Get admin emails for notification
      const adminEmails = await getAdminEmails();

      // Send breach email via Resend (falls back to notifyOwner internally)
      if (breachId) {
        await sendBreachNotificationEmail(adminEmails, {
          breachId,
          severity: event.severity,
          eventType: formatEventType(event.type),
          description: event.description,
          affectedUserCount: event.affectedUserCount,
          detectedAt: new Date(),
          recommendedActions: getRecommendedActions(event.type),
        });

        // For critical breaches, also send GDPR alert
        if (event.severity === "critical" && event.affectedUserCount > 0) {
          await sendGDPRBreachAlert(adminEmails, {
            breachId,
            description: event.description,
            affectedUserCount: event.affectedUserCount,
            detectedAt: new Date(),
            dataTypesAffected: inferAffectedDataTypes(event.type),
            slaDeadline: new Date(Date.now() + 72 * 60 * 60 * 1000),
          });
        }

        // Also send via notifyOwner as a backup channel
        await notifyOwner({
          title: `🚨 Security Alert: ${formatEventType(event.type)}`,
          content: buildNotificationContent(event),
        });

        await db.markBreachNotified(breachId);
      }
    }

    return breachId;
  } catch (error) {
    console.error("[BreachDetection] Failed to process anomaly:", error);
    return null;
  }
}

/**
 * Check for unnotified breach events and send notifications.
 * Should be called periodically (e.g., every hour) to ensure 72-hour SLA.
 */
export async function processUnnotifiedBreaches(): Promise<number> {
  try {
    const unnotified = await db.getUnnotifiedBreachEvents();
    let notifiedCount = 0;

    for (const breach of unnotified) {
      const ageHours = (Date.now() - Number(breach.createdAt ?? 0)) / (1000 * 60 * 60);

      // Notify if approaching 72-hour SLA or if severity is high/critical
      if (ageHours >= 24 || breach.severity === "high" || breach.severity === "critical") {
        const adminEmails = await getAdminEmails();

        // Send email notification for overdue breaches
        await sendBreachNotificationEmail(adminEmails, {
          breachId: breach.id,
          severity: breach.severity as any,
          eventType: breach.eventType ?? "unknown",
          description: breach.description ?? "No description",
          affectedUserCount: breach.affectedUserCount ?? 0,
          detectedAt: new Date(breach.createdAt ?? 0),
          recommendedActions: ["Review breach details in the Security Dashboard", "Assess impact and determine if GDPR notification is required"],
        });

        // GDPR SLA alert for breaches approaching 72h deadline
        if (ageHours >= 48) {
          await sendGDPRBreachAlert(adminEmails, {
            breachId: breach.id,
            description: breach.description ?? "No description",
            affectedUserCount: breach.affectedUserCount ?? 0,
            detectedAt: new Date(breach.createdAt ?? 0),
            dataTypesAffected: ["user_data"],
            slaDeadline: new Date(Number(breach.createdAt ?? 0) + 72 * 60 * 60 * 1000),
          });
        }

        // Also notify via owner channel
        await notifyOwner({
          title: `🔔 Breach Event Requires Attention (ID: ${breach.id})`,
          content: `Severity: ${breach.severity}\nType: ${breach.eventType}\nDescription: ${breach.description}\nDetected: ${new Date(breach.createdAt ?? 0).toISOString()}\nAge: ${Math.round(ageHours)}h (72h SLA)\n\nPlease review and take action in the admin dashboard.`,
        });

        await db.markBreachNotified(breach.id);
        notifiedCount++;
      }
    }

    return notifiedCount;
  } catch (error) {
    console.error("[BreachDetection] Failed to process unnotified breaches:", error);
    return 0;
  }
}

/**
 * Manually report a breach event (for admin use).
 */
export async function reportManualBreach(
  description: string,
  affectedUserCount: number,
  severity: "low" | "medium" | "high" | "critical",
  reportedBy: number
): Promise<number | null> {
  return processAnomalyEvent({
    type: "manual_report",
    severity,
    description,
    metadata: { reportedBy, manual: true },
    affectedUserCount,
    userId: reportedBy,
  });
}

// ─── Cleanup ────────────────────────────────────────────────────────

/**
 * Clean up stale counter entries to prevent memory leaks.
 * Should be called periodically (e.g., every 30 minutes).
 */
export function cleanupCounters(): void {
  const now = Date.now();
  const maxAge = 30 * 60 * 1000; // 30 minutes

  Array.from(failedLoginCounter.entries()).forEach(([key, entry]) => {
    if (now - entry.firstSeen > maxAge) failedLoginCounter.delete(key);
  });
  Array.from(bulkAccessCounter.entries()).forEach(([key, entry]) => {
    if (now - entry.firstSeen > maxAge) bulkAccessCounter.delete(key);
  });
  Array.from(apiRequestCounter.entries()).forEach(([key, entry]) => {
    if (now - entry.firstSeen > maxAge) apiRequestCounter.delete(key);
  });

  // Clean up old reported anomalies (keep last 24 hours)
  if (reportedAnomalies.size > 10000) {
    reportedAnomalies.clear();
  }
}

// ─── Helpers ────────────────────────────────────────────────────────

function formatEventType(type: AnomalyType): string {
  const labels: Record<AnomalyType, string> = {
    failed_login_spike: "Failed Login Spike",
    bulk_data_access: "Bulk Data Access",
    api_abuse: "API Abuse Detected",
    privilege_escalation: "Privilege Escalation Attempt",
    data_export_anomaly: "Data Export Anomaly",
    suspicious_pattern: "Suspicious Activity Pattern",
    manual_report: "Manual Breach Report",
  };
  return labels[type] ?? type;
}

function buildNotificationContent(event: AnomalyEvent): string {
  const lines = [
    `**Severity:** ${event.severity.toUpperCase()}`,
    `**Type:** ${formatEventType(event.type)}`,
    `**Description:** ${event.description}`,
    `**Affected Users:** ${event.affectedUserCount}`,
  ];

  if (event.sourceIp) {
    lines.push(`**Source IP:** ${event.sourceIp}`);
  }
  if (event.userId) {
    lines.push(`**User ID:** ${event.userId}`);
  }

  lines.push("", "Please review this event in the admin security dashboard immediately.");

  return lines.join("\n");
}

// ─── Admin Email Helper ─────────────────────────────────────────────

async function getAdminEmails(): Promise<string[]> {
  try {
    const db_ = (await import("../db"));
    const allUsers = await db_.getAllUsers();
    return allUsers
      .filter((u: any) => u.role === "admin" && u.email)
      .map((u: any) => u.email as string);
  } catch {
    return [];
  }
}

function getRecommendedActions(type: AnomalyType): string[] {
  const actions: Record<AnomalyType, string[]> = {
    failed_login_spike: [
      "Review failed login attempts and identify targeted accounts",
      "Consider temporarily blocking the source IP addresses",
      "Enable MFA for affected accounts if not already active",
    ],
    bulk_data_access: [
      "Audit the data access logs for the affected user",
      "Verify the access was authorized and within normal scope",
      "Consider revoking access tokens if unauthorized",
    ],
    api_abuse: [
      "Review API access logs for the source IP",
      "Apply rate limiting or block the abusive IP",
      "Check for compromised API keys",
    ],
    privilege_escalation: [
      "Immediately review the user's permissions and recent activity",
      "Revoke elevated access if unauthorized",
      "Conduct a full access audit for the affected account",
    ],
    data_export_anomaly: [
      "Review the exported data scope and destination",
      "Verify the export was authorized by the data owner",
      "Assess GDPR implications if personal data was exported",
    ],
    suspicious_pattern: [
      "Investigate the flagged activity pattern",
      "Cross-reference with known threat indicators",
      "Escalate to security team if pattern persists",
    ],
    manual_report: [
      "Follow the incident response plan",
      "Document all findings and actions taken",
      "Notify affected parties as required by policy",
    ],
  };
  return actions[type] ?? ["Review the event in the Security Dashboard"];
}

function inferAffectedDataTypes(type: AnomalyType): string[] {
  const dataTypes: Record<AnomalyType, string[]> = {
    failed_login_spike: ["authentication_credentials", "user_accounts"],
    bulk_data_access: ["personal_data", "employee_records"],
    api_abuse: ["api_data", "system_access"],
    privilege_escalation: ["access_controls", "admin_data"],
    data_export_anomaly: ["personal_data", "training_records", "assessment_data"],
    suspicious_pattern: ["user_data"],
    manual_report: ["user_data"],
  };
  return dataTypes[type] ?? ["user_data"];
}

// Start periodic cleanup
setInterval(cleanupCounters, 30 * 60 * 1000);

// Start periodic unnotified breach check (every hour)
setInterval(processUnnotifiedBreaches, 60 * 60 * 1000);
