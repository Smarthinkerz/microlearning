import { Request, Response } from "express";
import * as db from "./db";

/**
 * Webhook handler for external workforce management system integration.
 * Supports shift sync, roster updates, and assignment triggers.
 * 
 * POST /api/webhooks/:orgSlug/:type
 * Headers: x-webhook-secret: <secret>
 */
export async function handleWebhook(req: Request, res: Response) {
  try {
    const { orgSlug, type } = req.params;
    const payload = req.body;

    // Validate org
    const org = await db.getOrganizationBySlug(orgSlug);
    if (!org) {
      return res.status(404).json({ error: "Organization not found" });
    }

    // Validate webhook secret
    const configs = await db.getWebhookConfigsByOrg(org.id);
    const config = configs.find((c: any) => c.provider === type && c.isActive);
    if (!config) {
      return res.status(404).json({ error: "No active webhook config for this event type" });
    }

    const secret = req.headers["x-webhook-secret"];
    if (config.secretKey && secret !== config.secretKey) {
      return res.status(401).json({ error: "Invalid webhook secret" });
    }

    // Log the webhook
    await db.createAuditLog({
      orgId: org.id,
      action: `webhook_${type}`,
      resourceType: "webhook",
      details: { payload: JSON.stringify(payload).substring(0, 500) },
    });

    // Process based on type
    switch (type) {
      case "shift_sync":
        await handleShiftSync(org.id, payload);
        break;
      case "roster_update":
        await handleRosterUpdate(org.id, payload);
        break;
      case "assignment_trigger":
        await handleAssignmentTrigger(org.id, payload);
        break;
      default:
        return res.status(400).json({ error: `Unknown webhook type: ${type}` });
    }

    // Webhook processed successfully

    return res.json({ success: true, type, orgSlug });
  } catch (error: any) {
    console.error("[Webhook] Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function handleShiftSync(orgId: number, payload: any) {
  const shifts = payload.shifts || [];
  for (const shift of shifts) {
    if (!shift.userId || !shift.startTime || !shift.endTime) continue;
    await db.createShift({
      userId: shift.userId,
      orgId,
      title: shift.title || undefined,
      startTime: new Date(shift.startTime).getTime(),
      endTime: new Date(shift.endTime).getTime(),
      shiftType: shift.shiftType || "custom",
      location: shift.location || undefined,
      source: "webhook",
      externalId: shift.externalId || undefined,
    });
  }
}

async function handleRosterUpdate(orgId: number, payload: any) {
  // Roster updates can add/remove users from org
  const actions = payload.actions || [];
  for (const action of actions) {
    if (action.type === "add" && action.userId) {
      await db.updateUser(action.userId, { orgId });
    }
  }
}

async function handleAssignmentTrigger(orgId: number, payload: any) {
  const { lessonId, userIds, priority, dueDate } = payload;
  if (!lessonId || !userIds?.length) return;
  for (const userId of userIds) {
    await db.createAssignment({
      lessonId,
      userId,
      orgId,
      priority: priority || "normal",
      dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
      isScheduleAware: true,
    });
  }
}
