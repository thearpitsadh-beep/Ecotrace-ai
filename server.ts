import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import rateLimit from "express-rate-limit";
import { AIService } from "./src/server/aiService";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Rate Limiting Security
  app.set("trust proxy", 1); // Trust first proxy for express-rate-limit
  const aiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 20, // Limit each IP to 20 AI requests per min
    message: { error: "Too many AI requests from this IP, please try again after 60 seconds." },
    standardHeaders: true, 
    legacyHeaders: false, 
  });

  app.use(express.json({ limit: '10mb' })); // Lower limit to prevent abuse

  // AI endpoints
  app.post("/api/insights", aiLimiter, async (req, res) => {
    try {
      const { activities, totalFootprint } = req.body;
      
      const insights = await AIService.generateInsights(totalFootprint, activities);
      res.json({ insights });
    } catch (error: any) {
      console.error(JSON.stringify({ event: "AI_INSIGHTS_ERROR", message: error?.message || error, stack: error?.stack }));
      
      if (error?.message === "INVALID_INPUT") {
        res.status(400).json({ error: "Invalid payload provided." });
        return;
      }
      
      if (error?.status === "RESOURCE_EXHAUSTED" || error?.status === 429 || error?.message?.includes("429")) {
         res.status(429).json({ error: "API quota exceeded. Please wait a minute and try again." });
      } else if (error?.status === "UNAVAILABLE" || error?.status === 503 || error?.message === "AI_REQUEST_TIMEOUT" || error?.message?.includes("high demand")) {
         res.status(503).json({ error: "The AI model is currently busy. Please try again in a few moments." });
      } else {
         res.status(500).json({ error: "Failed to generate insights." });
      }
    }
  });

  app.post("/api/chat", aiLimiter, async (req, res) => {
    try {
      const { messages } = req.body;
      
      const { reply, autoLoggedActivity } = await AIService.generateChatResponse(messages);
      res.json({ reply, autoLoggedActivity });
    } catch (error: any) {
      console.error(JSON.stringify({ event: "AI_CHAT_ERROR", message: error?.message || error, stack: error?.stack }));
      
      if (error?.message === "INVALID_INPUT") {
        res.status(400).json({ error: "Invalid conversation provided." });
        return;
      }
      
      if (error?.status === "RESOURCE_EXHAUSTED" || error?.status === 429 || error?.message?.includes("429")) {
         res.status(429).json({ error: "API quota exceeded. Please wait a minute and try again.", reply: "I'm a bit overwhelmed right now! 😅 Could you ask me again in a minute?", autoLoggedActivity: null });
      } else if (error?.status === "UNAVAILABLE" || error?.status === 503 || error?.message === "AI_REQUEST_TIMEOUT" || error?.message?.includes("high demand")) {
         res.status(503).json({ error: "The AI model is currently experiencing high demand. Please try again in a few moments.", reply: "EcoBuddy is currently taking a little nap. 💤 Please try again in a few moments!", autoLoggedActivity: null });
      } else {
         // Graceful fallback for unknown errors
         res.status(500).json({ error: "Failed to generate chat response.", reply: "Oops! I hit a snag while thinking about that. 🌳 Try again?", autoLoggedActivity: null });
      }
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

