import { describe, it, expect } from "vitest";
import { validateResendConnection } from "./services/emailService";

describe("Resend API Key Validation", () => {
  it("should connect to Resend with the provided API key", async () => {
    const result = await validateResendConnection();
    expect(result.valid).toBe(true);
  }, 15000);
});
