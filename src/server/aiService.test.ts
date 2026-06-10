import { AIService } from "./aiService";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the Gemini SDK
vi.mock("@google/genai", () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(() => ({
      models: { generateContent: vi.fn() },
      chats: { create: vi.fn() }
    })),
    Type: { OBJECT: "OBJECT", STRING: "STRING", NUMBER: "NUMBER", ARRAY: "ARRAY" }
  };
});

describe("AIService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateInsights", () => {
    it("should throw INVALID_INPUT if totalFootprint is not a number", async () => {
      await expect(AIService.generateInsights("invalid" as any, []))
        .rejects.toThrow("INVALID_INPUT");
    });

    it("should throw INVALID_INPUT if activities is not an array", async () => {
      await expect(AIService.generateInsights(100, "invalid" as any))
        .rejects.toThrow("INVALID_INPUT");
    });
  });

  describe("generateChatResponse", () => {
    it("should throw INVALID_INPUT if messages is empty", async () => {
      await expect(AIService.generateChatResponse([]))
        .rejects.toThrow("INVALID_INPUT");
    });

    it("should throw INVALID_INPUT if messages is not an array", async () => {
      await expect(AIService.generateChatResponse("not an array" as any))
        .rejects.toThrow("INVALID_INPUT");
    });
  });
});
