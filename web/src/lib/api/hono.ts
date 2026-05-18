import { Hono } from "hono";
import { cors } from "hono/cors";
import { createAgentUIStreamResponse } from "ai";
import { agent } from "./agent";
import { documents } from "./routes/documents";
import { ai } from "./routes/ai";

const app = new Hono()
  .basePath("/api")
  .use(cors({ origin: (origin) => origin ?? "*", credentials: true }))
  .get("/health", (c) => c.json({ status: "ok" }, 200))
  .route("/documents", documents)
  .route("/ai", ai)
  .post("/agent/messages", async (c) => {
    const { messages } = await c.req.json();
    return createAgentUIStreamResponse({ agent, uiMessages: messages });
  });

export default app;
