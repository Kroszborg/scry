import { Hono } from "hono";
import { generateText } from "ai";
import { gateway } from "../agent/gateway";
import { db } from "../database";
import * as schema from "../database/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export const ai = new Hono()
  .post("/process", async (c) => {
    const { documentId, rawText, imageBase64, scanMode } = await c.req.json();

    let textToProcess = rawText as string | undefined;

    // If image provided, use Gemini Vision to extract text first
    if (imageBase64 && (!textToProcess || textToProcess.trim().length === 0)) {
      try {
        const { text: extracted } = await generateText({
          model: gateway("google/gemini-3-flash"),
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image",
                  image: new URL(`data:image/jpeg;base64,${imageBase64}`),
                },
                {
                  type: "text",
                  text: `Extract all visible text from this scanned document image. Preserve the structure and formatting as much as possible. Return only the extracted text, nothing else.`,
                },
              ],
            },
          ],
        });
        textToProcess = extracted;
      } catch {
        textToProcess = "Document scanned. Text extraction failed.";
      }
    }

    if (!textToProcess || textToProcess.trim().length === 0) {
      return c.json({ error: "No text to process" }, 400);
    }

    const { text } = await generateText({
      model: gateway("google/gemini-3-flash"),
      prompt: `You are analyzing a scanned document. The scan mode was: ${scanMode ?? "Notes"}.

Raw OCR text:
"""
${textToProcess.slice(0, 4000)}
"""

Return a JSON object with these exact keys:
- title: string (short, descriptive, max 6 words)
- category: string (one of: "Notes", "Book", "Receipt", "ID", "Assignment", "Whiteboard")
- tags: array of strings (3-5 relevant tags, lowercase)
- summary: string (2-3 sentences max, plain language)
- cleanText: string (cleaned up version of the raw OCR text, fix obvious OCR errors, preserve structure)

Respond ONLY with valid JSON, no markdown fences.`,
    });

    let parsed: {
      title?: string;
      category?: string;
      tags?: string[];
      summary?: string;
      cleanText?: string;
    } = {};
    try {
      const cleaned = text.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {
        title: "Scanned Document",
        category: scanMode ?? "Notes",
        tags: [],
        summary: "Document scanned successfully.",
        cleanText: textToProcess,
      };
    }

    if (documentId) {
      await db
        .update(schema.documents)
        .set({
          title: parsed.title ?? "Scanned Document",
          category: parsed.category ?? "Notes",
          tags: JSON.stringify(parsed.tags ?? []),
          summary: parsed.summary ?? "",
          cleanText: parsed.cleanText ?? textToProcess,
          rawText: textToProcess,
          updatedAt: new Date(),
        })
        .where(eq(schema.documents.id, documentId));
    }

    return c.json(
      {
        title: parsed.title,
        category: parsed.category,
        tags: parsed.tags ?? [],
        summary: parsed.summary,
        cleanText: parsed.cleanText,
      },
      200
    );
  })

  .post("/flashcards", async (c) => {
    const { documentId, text: docText } = await c.req.json();
    if (!docText) return c.json({ error: "No text provided" }, 400);

    const { text } = await generateText({
      model: gateway("google/gemini-3-flash"),
      prompt: `Create study flashcards from this document content:

"""
${docText.slice(0, 4000)}
"""

Return a JSON array of objects with "question" and "answer" keys.
Create 5-10 high-quality flashcards covering the key concepts.
Keep answers concise (1-2 sentences).
Respond ONLY with a valid JSON array, no markdown fences.`,
    });

    let cards: { question: string; answer: string }[] = [];
    try {
      const cleaned = text.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
      cards = JSON.parse(cleaned);
    } catch {
      cards = [];
    }

    if (documentId && cards.length > 0) {
      await db.delete(schema.flashcards).where(eq(schema.flashcards.documentId, documentId));
      const now = new Date();
      await db.insert(schema.flashcards).values(
        cards.map((card) => ({
          id: randomUUID(),
          documentId,
          question: card.question,
          answer: card.answer,
          createdAt: now,
        }))
      );
    }

    return c.json({ flashcards: cards }, 200);
  })

  .post("/ask", async (c) => {
    const { question, documentText, documentTitle } = await c.req.json();
    if (!question) return c.json({ error: "No question provided" }, 400);

    const { text } = await generateText({
      model: gateway("google/gemini-3-flash"),
      prompt: `You are helping a student study. They are asking about: "${documentTitle ?? "a document"}".

Document content:
"""
${(documentText ?? "").slice(0, 4000)}
"""

Student's question: ${question}

Answer concisely and clearly. Max 3 sentences. Use plain language.`,
    });

    return c.json({ answer: text }, 200);
  })

  .post("/explain", async (c) => {
    const { text: docText, documentTitle } = await c.req.json();

    const { text } = await generateText({
      model: gateway("google/gemini-3-flash"),
      prompt: `Explain this content from "${documentTitle ?? "a document"}" in simple terms, as if explaining to a high school student:

"""
${(docText ?? "").slice(0, 3000)}
"""

Be clear and concise. Use bullet points where helpful. Max 150 words.`,
    });

    return c.json({ explanation: text }, 200);
  })

  .post("/extract", async (c) => {
    const { text: docText, type } = await c.req.json();

    const typePrompts: Record<string, string> = {
      tasks: "Extract all tasks, action items, to-dos, and deadlines.",
      formulas: "Extract all mathematical formulas, equations, and scientific notation.",
      dates: "Extract all dates, deadlines, events, and time references.",
    };

    const instruction = typePrompts[type] ?? typePrompts.tasks;

    const { text } = await generateText({
      model: gateway("google/gemini-3-flash"),
      prompt: `From the following document content, ${instruction}

"""
${(docText ?? "").slice(0, 3000)}
"""

Return a JSON array of strings (each item is one extracted element).
Respond ONLY with a valid JSON array, no markdown fences.`,
    });

    let items: string[] = [];
    try {
      const cleaned = text.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
      items = JSON.parse(cleaned);
    } catch {
      items = [];
    }

    return c.json({ items }, 200);
  });
