import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { processSmarthinkerWebhook, isDuplicateWebhook } from "../smarthinkerz-webhook";

const SmarthinkerWebhookSchema = z.object({
  status: z.enum(["paid", "failed", "refunded", "pending"]),
  order_id: z.string(),
  tap_id: z.string(),
  external_ref: z.string().optional(),
  amount: z.number().optional(),
  currency: z.string().optional(),
  timestamp: z.string().optional(),
});

export const webhookRouter = router({
  /**
   * Smarthinkerz payment webhook endpoint
   * Called by Smarthinkerz when payment status changes
   */
  smarthinkerz: publicProcedure
    .input(SmarthinkerWebhookSchema)
    .mutation(async ({ input }) => {
      try {
        // Check for duplicate webhook (idempotency)
        const isDuplicate = await isDuplicateWebhook(input.order_id);
        if (isDuplicate) {
          console.log(`[Webhook] Duplicate webhook detected for order_id: ${input.order_id}`);
          return { success: true, message: "Webhook already processed" };
        }

        // Process the webhook
        const result = await processSmarthinkerWebhook(input);
        return result;
      } catch (error) {
        console.error("[Webhook] Error processing Smarthinkerz webhook:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),
});
