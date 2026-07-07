import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";
import { rateLimit } from "express-rate-limit";

dotenv.config();

// Resolve CodeQL alert: Implement rate limiting to protect file system access
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per 15 mins
  standardHeaders: true, 
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again after 15 minutes",
});

async function startServer() {
  const app = express();
  app.disable("x-powered-by"); // Security: Prevent broadcasting tech stack
  const PORT = 3000;

  // Apply rate limiter globally
  app.use(limiter);

  app.use(express.json({ limit: "50mb" }));

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.post("/api/generate-visit-prep", async (req, res) => {
    try {
       const prompt = req.body.prompt;
       if (!prompt) return res.status(400).json({ error: "No prompt provided" });
       
       const gApiKey = process.env.GEMINI_API_KEY;
       if (!gApiKey) return res.status(500).json({ error: "Gemini API key is not configured on server" });

       // Using the highly stable, reliable and supported gemini-3.5-flash model
       let targetModel = "gemini-3.5-flash";
       let response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${gApiKey}`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
             contents: [{ role: "user", parts: [{ text: prompt }]}]
         })
       });

       if (!response.ok) {
           const errBody = await response.text();
           console.error("[Server Gemini API Error]:", errBody);
           return res.status(response.status).json({ error: `Gemini generation failed: ${response.statusText}`, details: errBody });
       }
       
       const data = await response.json();
       const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
       res.json({ text });
    } catch (e: any) {
       console.error("[Server Internal Error]:", e);
       res.status(500).json({ error: e.message || "Failed to generate report" });
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
    app.use(express.static(distPath, { index: false }));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
