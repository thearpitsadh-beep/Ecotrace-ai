import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI(apiKey ? { apiKey } : {});

export const logActivityTool: FunctionDeclaration = {
  name: "logActivity",
  description: "Logs a user's carbon-impacting activity to the dashboard when they explicitly mention doing it today or recently. Never ask for permission to log, just log it and confirm.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      type: { type: Type.STRING, description: "Strictly one of: 'transport', 'diet', 'energy', 'shopping', 'water'." },
      title: { type: Type.STRING, description: "Concise title of the activity" },
      co2ImpactKg: { type: Type.NUMBER, description: "Estimated CO2 footprint of this activity in kg." }
    },
    required: ["type", "title", "co2ImpactKg"]
  }
};

// Generic timeout wrapper
export const withTimeout = <T>(promise: Promise<T>, ms: number = 15000): Promise<T> => {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("AI_REQUEST_TIMEOUT")), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
};

export class AIService {
  static async generateInsights(totalFootprint: number, activities: any[]) {
    // Basic validation
    if (typeof totalFootprint !== 'number' || !Array.isArray(activities)) {
      throw new Error("INVALID_INPUT");
    }

    const prompt = `You are a carbon footprint reduction expert. The user has a total footprint of ${totalFootprint} kg CO2e.
    Here are their recent activities: ${JSON.stringify(activities.slice(0, 5))}.
    Provide 3 personalized insights or actionable tips to help them reduce their footprint.`;

    let maxRetries = 2;
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await withTimeout(ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING, description: "One of: 'transport', 'diet', 'energy', or 'shopping'" },
                  tip: { type: Type.STRING, description: "A concise, actionable instruction" },
                  potentialSavingsKg: { type: Type.NUMBER, description: "Estimated kg of CO2e saved per month if followed" }
                },
                required: ["category", "tip", "potentialSavingsKg"]
              }
            }
          }
        }), 15000);

        let rawText = "[]";
        if (response && response.candidates && response.candidates.length > 0) {
          const parts = response.candidates[0].content?.parts || [];
          const textParts = parts.filter((p: any) => p.text);
          if (textParts.length > 0) {
            rawText = textParts.map((p: any) => p.text).join("");
          }
        }
        return JSON.parse(rawText);
      } catch (e: any) {
        if (i === maxRetries - 1) throw e;
        if (e.message === "AI_REQUEST_TIMEOUT" || e.status === "UNAVAILABLE" || e.status === 503 || (e.message && e.message.includes("high demand"))) {
          await new Promise(res => setTimeout(res, 2000 * (i + 1))); // Backoff
        } else {
          throw e; // Unrecoverable
        }
      }
    }
  }

  static async generateChatResponse(messages: any[]) {
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error("INVALID_INPUT");
    }

    const history = messages.slice(0, -1).map((m: any) => {
      const parts: any[] = [];
      if (m.content) parts.push({ text: m.content });
      if (m.attachment) parts.push({ inlineData: { mimeType: m.attachment.mimeType, data: m.attachment.data } });
      return {
        role: m.role === 'user' ? 'user' : 'model',
        parts: parts.length > 0 ? parts : [{ text: '' }]
      };
    });
    
    const latestMessage = messages[messages.length - 1];
    const messageParts: any[] = [];
    if (latestMessage.content) messageParts.push({ text: latestMessage.content });
    if (latestMessage.attachment) messageParts.push({ inlineData: { mimeType: latestMessage.attachment.mimeType, data: latestMessage.attachment.data } });

    const chat = ai.chats.create({
      model: "gemini-3.5-flash",
      config: {
        systemInstruction: `You are EcoBuddy, an extremely cute, friendly, and enthusiastic AI character. You act like the user's best eco-friend! Greet them warmly with emojis.
        Ask them conversational questions about their day ("What did you eat today?", "Where did you go?").
        If they upload an image, analyze it to estimate the carbon footprint.
        When they tell you an activity, analyze its environmental impact gently and describe it simply to them. Keep responses concise and fast to improve responsiveness!
        Weave optimistic reduction suggestions naturally into the conversation without being too long.
        Never hallucinate carbon values without explaining they are estimates.
        
        CRITICAL: If the user describes a carbon-impacting activity (e.g., "I ate pizza", "I took a bus to work"), YOU MUST CALL the \`logActivity\` tool to automatically log it to their dashboard. ALWAYS run the tool call AND return a conversational text reply in the SAME response so the user gets immediate feedback.`,
        tools: [{ functionDeclarations: [logActivityTool] }],
        temperature: 0.7, // Add a bit of consistency
      },
      history: history,
    });

    let maxRetries = 2;
    let response;
    for (let i = 0; i < maxRetries; i++) {
      try {
        response = await withTimeout(chat.sendMessage({ message: messageParts }), 20000);
        break;
      } catch (e: any) {
        if (i === maxRetries - 1) throw e;
        if (e.message === "AI_REQUEST_TIMEOUT" || e.status === "UNAVAILABLE" || e.status === 503 || (e.message && e.message.includes("high demand"))) {
          await new Promise(res => setTimeout(res, 2000 * (i + 1))); // Backoff
        } else {
          throw e; // Non-retryable
        }
      }
    }
    
    let replyText = "";
    if (response && response.candidates && response.candidates.length > 0) {
      const parts = response.candidates[0].content?.parts || [];
      const textParts = parts.filter((p: any) => p.text);
      if (textParts.length > 0) {
        replyText = textParts.map((p: any) => p.text).join("");
      }
    }
    
    let autoLoggedActivity = null;

    if (response?.functionCalls && response.functionCalls.length > 0) {
      const call = response.functionCalls[0];
      if (call.name === "logActivity" && call.args) {
        autoLoggedActivity = call.args;
        
        if (!replyText) {
          let funcResponse;
          for (let i = 0; i < maxRetries; i++) {
            try {
              funcResponse = await withTimeout(chat.sendMessage({
                message: [{
                  functionResponse: {
                    name: call.name,
                    response: { status: "success", message: "Activity successfully logged to dashboard. You can now reply to the user." }
                  }
                }]
              }), 15000);
              break;
            } catch (e: any) {
              if (i === maxRetries - 1) throw e;
              if (e.message === "AI_REQUEST_TIMEOUT" || e.status === "UNAVAILABLE" || e.status === 503) {
                await new Promise(res => setTimeout(res, 2000 * (i + 1)));
              } else {
                throw e;
              }
            }
          }
          if (!replyText && funcResponse && funcResponse.candidates && funcResponse.candidates.length > 0) {
            const parts = funcResponse.candidates[0].content?.parts || [];
            const textParts = parts.filter((p: any) => p.text);
            if (textParts.length > 0) {
              replyText = textParts.map((p: any) => p.text).join("");
            }
          }
        }
      }
    }

    return { reply: replyText, autoLoggedActivity };
  }
}
