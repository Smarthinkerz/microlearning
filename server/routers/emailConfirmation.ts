import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { sendEmail } from "../_core/email";
import * as db from "../db";

export const emailConfirmationRouter = router({
  // Send payment confirmation email
  sendPaymentConfirmation: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
        planName: z.string(),
        amount: z.number(),
        cycle: z.enum(["monthly", "yearly"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user;

      if (!user.email) {
        throw new Error("User email not found");
      }

      const planDetails = {
        monthly: "Monthly subscription",
        yearly: "Annual subscription",
      };

      const cycleText = input.cycle ? planDetails[input.cycle] : "One-time purchase";
      const nextBillingDate = input.cycle
        ? new Date(Date.now() + (input.cycle === "yearly" ? 365 : 30) * 24 * 60 * 60 * 1000)
            .toLocaleDateString()
        : "N/A";

      const emailContent = `
        <h2>Payment Confirmation</h2>
        <p>Thank you for your purchase! Your payment has been successfully processed.</p>
        
        <h3>Order Details</h3>
        <ul>
          <li><strong>Order ID:</strong> ${input.orderId}</li>
          <li><strong>Plan:</strong> ${input.planName}</li>
          <li><strong>Type:</strong> ${cycleText}</li>
          <li><strong>Amount:</strong> $${(input.amount / 100).toFixed(2)}</li>
          <li><strong>Next Billing Date:</strong> ${nextBillingDate}</li>
        </ul>
        
        <h3>What's Next?</h3>
        <p>Your subscription is now active. You can:</p>
        <ul>
          <li>Access all features included in your plan</li>
          <li>Manage your subscription in your account settings</li>
          <li>Contact support if you have any questions</li>
        </ul>
        
        <p>If you have any issues, please reply to this email or contact our support team.</p>
      `;

      try {
        await sendEmail({
          to: user.email,
          subject: `Payment Confirmation - Order ${input.orderId}`,
          html: emailContent,
        });

        return { success: true, message: "Confirmation email sent" };
      } catch (error) {
        console.error("Failed to send payment confirmation email:", error);
        throw new Error("Failed to send confirmation email");
      }
    }),

  // Send subscription activated email
  sendSubscriptionActivated: protectedProcedure
    .input(
      z.object({
        planName: z.string(),
        features: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user;

      if (!user.email) {
        throw new Error("User email not found");
      }

      const featuresList = input.features ? input.features.map((f) => `<li>${f}</li>`).join("") : "";

      const emailContent = `
        <h2>Welcome to ${input.planName}!</h2>
        <p>Your subscription is now active and you have access to all premium features.</p>
        
        <h3>Your Plan Includes:</h3>
        <ul>
          ${featuresList}
        </ul>
        
        <h3>Getting Started</h3>
        <p>Visit your dashboard to:</p>
        <ul>
          <li>View your subscription details</li>
          <li>Manage team members</li>
          <li>Access advanced analytics</li>
          <li>Configure your settings</li>
        </ul>
        
        <p>Thank you for choosing us!</p>
      `;

      try {
        await sendEmail({
          to: user.email,
          subject: `Welcome to ${input.planName}!`,
          html: emailContent,
        });

        return { success: true, message: "Subscription activated email sent" };
      } catch (error) {
        console.error("Failed to send subscription activated email:", error);
        throw new Error("Failed to send subscription email");
      }
    }),

  // Send payment failed email
  sendPaymentFailed: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user;

      if (!user.email) {
        throw new Error("User email not found");
      }

      const emailContent = `
        <h2>Payment Failed</h2>
        <p>Unfortunately, your payment could not be processed.</p>
        
        <h3>What Happened?</h3>
        <p>${input.reason || "Your payment was declined. This could be due to insufficient funds, incorrect card details, or other payment issues."}</p>
        
        <h3>What You Can Do</h3>
        <ul>
          <li>Try again with a different payment method</li>
          <li>Contact your bank to verify the transaction</li>
          <li>Reach out to our support team for assistance</li>
        </ul>
        
        <p><strong>Order ID:</strong> ${input.orderId}</p>
        
        <p>If you continue to experience issues, please contact our support team.</p>
      `;

      try {
        await sendEmail({
          to: user.email,
          subject: `Payment Failed - Order ${input.orderId}`,
          html: emailContent,
        });

        return { success: true, message: "Payment failed email sent" };
      } catch (error) {
        console.error("Failed to send payment failed email:", error);
        throw new Error("Failed to send payment failed email");
      }
    }),
});
