import { describe, it, expect } from "vitest";

describe("ElevenLabs Integration", () => {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  it("should have ELEVENLABS_API_KEY set", () => {
    expect(apiKey).toBeTruthy();
    expect(apiKey!.length).toBeGreaterThan(10);
  });

  it("should validate API key by generating a short TTS sample", async () => {
    if (!apiKey) {
      console.log("Skipping: no API key");
      return;
    }

    // Use the Sarah voice (EXAVITQu4vr4xnSDxMaL) with a short text
    const res = await fetch("https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL", {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
      },
      body: JSON.stringify({
        text: "Test",
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    expect(res.ok).toBe(true);
    expect(res.headers.get("content-type")).toContain("audio");
    const buffer = await res.arrayBuffer();
    expect(buffer.byteLength).toBeGreaterThan(1000); // Should be a valid audio file
  }, 30000);

  it("should have voice service module with correct exports", async () => {
    const mod = await import("./elevenLabs");
    expect(mod.isElevenLabsConfigured).toBeDefined();
    expect(mod.textToSpeech).toBeDefined();
    expect(mod.getVoices).toBeDefined();
    expect(mod.VOICES).toBeDefined();
    expect(typeof mod.isElevenLabsConfigured).toBe("function");
  });

  it("should report configured status correctly", async () => {
    const mod = await import("./elevenLabs");
    if (apiKey) {
      expect(mod.isElevenLabsConfigured()).toBe(true);
    }
  });
});
