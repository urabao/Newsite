import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

// 4.3 Health Check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });
});

import opinionsHandler from "./api/opinions.js";
app.get("/api/opinions", async (req, res) => {
  await opinionsHandler(req, res);
});

import articleHandler from "./api/article.js";
app.get("/api/article", async (req, res) => {
  await articleHandler(req, res);
});

import newsHandler from "./api/news.js";
app.get("/api/news", async (req, res) => {
  await newsHandler(req, res);
});

import localHandler from "./api/local.js";
app.get("/api/local", async (req, res) => {
  await localHandler(req, res);
});

async function bootstrap() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server running on http://localhost:${PORT}`);
  });
}

bootstrap();
