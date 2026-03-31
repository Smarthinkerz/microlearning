import { Resend } from "resend";
import { ENV } from "../_core/env";
import { notifyOwner } from "../_core/notification";

// ─── Resend Client ──────────────────────────────────────────────────

let resendClient: Resend | null = null;

function getResend(): Resend | null {
  if (!ENV.resendApiKey) return null;
  if (!resendClient) {
    resendClient = new Resend(ENV.resendApiKey);
  }
  return resendClient;
}

// ─── Types ──────────────────────────────────────────────────────────

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface BreachNotificationPayload {
  breachId: number;
  severity: "low" | "medium" | "high" | "critical";
  eventType: string;
  description: string;
  affectedUserCount: number;
  detectedAt: Date;
  recommendedActions: string[];
}

export interface GDPRBreachAlertPayload {
  breachId: number;
  description: string;
  affectedUserCount: number;
  detectedAt: Date;
  dataTypesAffected: string[];
  slaDeadline: Date;
}

export interface SystemAlertPayload {
  title: string;
  message: string;
  severity: "info" | "warning" | "error" | "critical";
  actionUrl?: string;
}

// ─── Email Templates ────────────────────────────────────────────────

function buildBreachNotificationHtml(payload: BreachNotificationPayload): string {
  const severityColors: Record<string, string> = {
    low: "#3b82f6",
    medium: "#f59e0b",
    high: "#ef4444",
    critical: "#dc2626",
  };
  const color = severityColors[payload.severity] || "#6b7280";

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#111827;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 24px;">
    <div style="background:#1f2937;border-radius:12px;overflow:hidden;border:1px solid #374151;">
      <!-- Header -->
      <div style="background:${color};padding:24px 32px;">
        <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">
          &#x1F6A8; Security Breach Detected
        </h1>
        <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">
          Severity: ${payload.severity.toUpperCase()} &bull; Breach #${payload.breachId}
        </p>
      </div>
      <!-- Body -->
      <div style="padding:32px;">
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          <tr>
            <td style="padding:8px 0;color:#9ca3af;font-size:13px;width:140px;">Event Type</td>
            <td style="padding:8px 0;color:#e5e7eb;font-size:14px;">${payload.eventType.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#9ca3af;font-size:13px;">Affected Users</td>
            <td style="padding:8px 0;color:#e5e7eb;font-size:14px;font-weight:600;">${payload.affectedUserCount}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#9ca3af;font-size:13px;">Detected At</td>
            <td style="padding:8px 0;color:#e5e7eb;font-size:14px;">${payload.detectedAt.toISOString()}</td>
          </tr>
        </table>
        <div style="background:#111827;border-radius:8px;padding:16px;margin-bottom:24px;">
          <p style="margin:0;color:#d1d5db;font-size:14px;line-height:1.6;">${payload.description}</p>
        </div>
        ${payload.recommendedActions.length > 0 ? `
        <div style="margin-bottom:24px;">
          <h3 style="margin:0 0 12px;color:#e5e7eb;font-size:15px;font-weight:600;">Recommended Actions</h3>
          ${payload.recommendedActions.map((action: string, i: number) => `
            <div style="display:flex;align-items:flex-start;margin-bottom:8px;">
              <span style="color:${color};font-weight:700;margin-right:8px;font-size:14px;">${i + 1}.</span>
              <span style="color:#d1d5db;font-size:14px;line-height:1.5;">${action}</span>
            </div>
          `).join("")}
        </div>
        ` : ""}
        <a href="#" style="display:inline-block;background:${color};color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">
          View in Security Dashboard
        </a>
      </div>
      <!-- Footer -->
      <div style="padding:16px 32px;background:#111827;border-top:1px solid #374151;">
        <p style="margin:0;color:#6b7280;font-size:12px;">
          This is an automated security alert from LearnShift. Do not reply to this email.
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function buildGDPRBreachAlertHtml(payload: GDPRBreachAlertPayload): string {
  const hoursRemaining = Math.max(0, Math.round((payload.slaDeadline.getTime() - Date.now()) / (1000 * 60 * 60)));

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#111827;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 24px;">
    <div style="background:#1f2937;border-radius:12px;overflow:hidden;border:1px solid #374151;">
      <div style="background:#7c3aed;padding:24px 32px;">
        <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">
          &#x1F4CB; GDPR Breach Notification Required
        </h1>
        <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">
          72-Hour SLA &bull; ${hoursRemaining}h remaining
        </p>
      </div>
      <div style="padding:32px;">
        <div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:16px;margin-bottom:24px;">
          <p style="margin:0;color:#92400e;font-size:14px;font-weight:600;">
            &#x26A0;&#xFE0F; Under GDPR Article 33, this breach must be reported to the supervisory authority within 72 hours of detection.
          </p>
        </div>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          <tr>
            <td style="padding:8px 0;color:#9ca3af;font-size:13px;width:160px;">Breach ID</td>
            <td style="padding:8px 0;color:#e5e7eb;font-size:14px;">#${payload.breachId}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#9ca3af;font-size:13px;">Affected Users</td>
            <td style="padding:8px 0;color:#e5e7eb;font-size:14px;font-weight:600;">${payload.affectedUserCount}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#9ca3af;font-size:13px;">Detected At</td>
            <td style="padding:8px 0;color:#e5e7eb;font-size:14px;">${payload.detectedAt.toISOString()}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#9ca3af;font-size:13px;">SLA Deadline</td>
            <td style="padding:8px 0;color:#ef4444;font-size:14px;font-weight:600;">${payload.slaDeadline.toISOString()}</td>
          </tr>
        </table>
        <div style="background:#111827;border-radius:8px;padding:16px;margin-bottom:24px;">
          <p style="margin:0 0 8px;color:#9ca3af;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Description</p>
          <p style="margin:0;color:#d1d5db;font-size:14px;line-height:1.6;">${payload.description}</p>
        </div>
        ${payload.dataTypesAffected.length > 0 ? `
        <div style="margin-bottom:24px;">
          <p style="margin:0 0 8px;color:#9ca3af;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Data Types Affected</p>
          <div style="display:flex;flex-wrap:wrap;gap:8px;">
            ${payload.dataTypesAffected.map((dt: string) => `
              <span style="background:#374151;color:#e5e7eb;padding:4px 12px;border-radius:16px;font-size:13px;">${dt}</span>
            `).join("")}
          </div>
        </div>
        ` : ""}
        <a href="#" style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">
          Open Breach Report
        </a>
      </div>
      <div style="padding:16px 32px;background:#111827;border-top:1px solid #374151;">
        <p style="margin:0;color:#6b7280;font-size:12px;">
          GDPR compliance alert from LearnShift. Retain this email for your records.
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function buildSystemAlertHtml(payload: SystemAlertPayload): string {
  const severityColors: Record<string, string> = {
    info: "#3b82f6",
    warning: "#f59e0b",
    error: "#ef4444",
    critical: "#dc2626",
  };
  const color = severityColors[payload.severity] || "#6b7280";

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#111827;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 24px;">
    <div style="background:#1f2937;border-radius:12px;overflow:hidden;border:1px solid #374151;">
      <div style="background:${color};padding:24px 32px;">
        <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">${payload.title}</h1>
      </div>
      <div style="padding:32px;">
        <p style="margin:0;color:#d1d5db;font-size:14px;line-height:1.6;">${payload.message}</p>
        ${payload.actionUrl ? `
        <div style="margin-top:24px;">
          <a href="${payload.actionUrl}" style="display:inline-block;background:${color};color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">
            Take Action
          </a>
        </div>
        ` : ""}
      </div>
      <div style="padding:16px 32px;background:#111827;border-top:1px solid #374151;">
        <p style="margin:0;color:#6b7280;font-size:12px;">System alert from LearnShift.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// ─── Email Sending Functions ────────────────────────────────────────

/**
 * Send a breach notification email to admin recipients.
 */
export async function sendBreachNotificationEmail(
  recipients: string[],
  payload: BreachNotificationPayload
): Promise<EmailResult> {
  const resend = getResend();
  if (!resend || recipients.length === 0) {
    // Fallback to notifyOwner
    await notifyOwner({
      title: `Security Breach: ${payload.eventType} (${payload.severity})`,
      content: payload.description,
    });
    return { success: true, error: "Resend unavailable, fell back to notifyOwner" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: ENV.resendFromEmail,
      to: recipients,
      subject: `[${payload.severity.toUpperCase()}] Security Breach Detected — Breach #${payload.breachId}`,
      html: buildBreachNotificationHtml(payload),
    });

    if (error) {
      console.error("[EmailService] Resend error:", error);
      // Fallback to notifyOwner
      await notifyOwner({
        title: `Security Breach: ${payload.eventType} (${payload.severity})`,
        content: payload.description,
      });
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (err: any) {
    console.error("[EmailService] Failed to send breach email:", err);
    await notifyOwner({
      title: `Security Breach: ${payload.eventType} (${payload.severity})`,
      content: payload.description,
    });
    return { success: false, error: err.message };
  }
}

/**
 * Send a GDPR breach alert email requiring regulatory action.
 */
export async function sendGDPRBreachAlert(
  recipients: string[],
  payload: GDPRBreachAlertPayload
): Promise<EmailResult> {
  const resend = getResend();
  if (!resend || recipients.length === 0) {
    await notifyOwner({
      title: `GDPR Breach Alert: Breach #${payload.breachId}`,
      content: `${payload.description}\nAffected: ${payload.affectedUserCount} users\nSLA Deadline: ${payload.slaDeadline.toISOString()}`,
    });
    return { success: true, error: "Resend unavailable, fell back to notifyOwner" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: ENV.resendFromEmail,
      to: recipients,
      subject: `[GDPR] Breach Notification Required — Breach #${payload.breachId}`,
      html: buildGDPRBreachAlertHtml(payload),
    });

    if (error) {
      console.error("[EmailService] Resend GDPR error:", error);
      await notifyOwner({
        title: `GDPR Breach Alert: Breach #${payload.breachId}`,
        content: payload.description,
      });
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (err: any) {
    console.error("[EmailService] Failed to send GDPR alert:", err);
    await notifyOwner({
      title: `GDPR Breach Alert: Breach #${payload.breachId}`,
      content: payload.description,
    });
    return { success: false, error: err.message };
  }
}

/**
 * Send a general system alert email.
 */
export async function sendSystemAlert(
  recipients: string[],
  payload: SystemAlertPayload
): Promise<EmailResult> {
  const resend = getResend();
  if (!resend || recipients.length === 0) {
    await notifyOwner({ title: payload.title, content: payload.message });
    return { success: true, error: "Resend unavailable, fell back to notifyOwner" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: ENV.resendFromEmail,
      to: recipients,
      subject: `[${payload.severity.toUpperCase()}] ${payload.title}`,
      html: buildSystemAlertHtml(payload),
    });

    if (error) {
      console.error("[EmailService] Resend system alert error:", error);
      await notifyOwner({ title: payload.title, content: payload.message });
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (err: any) {
    console.error("[EmailService] Failed to send system alert:", err);
    await notifyOwner({ title: payload.title, content: payload.message });
    return { success: false, error: err.message };
  }
}

/**
 * Validate that the Resend API key is configured and functional.
 */
export async function validateResendConnection(): Promise<{ valid: boolean; error?: string }> {
  const resend = getResend();
  if (!resend) {
    return { valid: false, error: "RESEND_API_KEY not configured" };
  }

  try {
    // Use the domains list endpoint as a lightweight health check
    const { error } = await resend.domains.list();
    if (error) {
      return { valid: false, error: error.message };
    }
    return { valid: true };
  } catch (err: any) {
    return { valid: false, error: err.message };
  }
}
