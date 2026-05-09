import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  console.warn("RESEND_API_KEY not configured - email sending will fail");
}

const resend = resendApiKey ? new Resend(resendApiKey) : null;

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

/**
 * Send email via Resend
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string }> {
  if (!resend) {
    throw new Error("Resend API key not configured");
  }

  try {
    const response = await resend.emails.send({
      from: options.from || "onboarding@resend.dev",
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    if (response.error) {
      throw new Error(`Resend error: ${response.error.message}`);
    }

    return {
      success: true,
      messageId: response.data?.id,
    };
  } catch (error) {
    console.error("Email sending failed:", error);
    throw error;
  }
}

/**
 * Send batch emails
 */
export async function sendEmailBatch(
  emails: EmailOptions[]
): Promise<{ success: boolean; results: Array<{ to: string; success: boolean; messageId?: string }> }> {
  if (!resend) {
    throw new Error("Resend API key not configured");
  }

  const results = await Promise.all(
    emails.map(async (email) => {
      try {
        const response = await resend.emails.send({
          from: email.from || "onboarding@resend.dev",
          to: email.to,
          subject: email.subject,
          html: email.html,
        });

        return {
          to: email.to,
          success: !response.error,
          messageId: response.data?.id,
        };
      } catch (error) {
        console.error(`Failed to send email to ${email.to}:`, error);
        return {
          to: email.to,
          success: false,
        };
      }
    })
  );

  const allSuccess = results.every((r) => r.success);
  return { success: allSuccess, results };
}
