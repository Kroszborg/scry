import { stepCountIs, ToolLoopAgent } from "ai";
import dedent from "dedent";
import { gateway } from "./gateway";

export const agent = new ToolLoopAgent({
  model: gateway("google/gemini-3-flash"),
  instructions: [
    {
      role: "system",
      content: dedent`
        You are Scry's AI assistant. You help students understand, organize, and study their documents.
        You have access to the user's scanned documents. Be concise, helpful, and direct.
        Use plain language. Max 2 sentences per thought. No fluff.
        When answering about documents, reference specific content from them.
      `,
    },
  ],
  tools: {},
  stopWhen: [stepCountIs(10)],
});
