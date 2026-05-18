import { Hono } from "hono";
import { db } from "../database";
import * as schema from "../database/schema";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

export const documents = new Hono()
  .get("/", async (c) => {
    const docs = await db
      .select()
      .from(schema.documents)
      .orderBy(desc(schema.documents.updatedAt));
    return c.json({ documents: docs }, 200);
  })
  .post("/", async (c) => {
    const body = await c.req.json();
    const id = randomUUID();
    const now = new Date();
    const [doc] = await db
      .insert(schema.documents)
      .values({
        id,
        title: body.title ?? "Untitled Document",
        category: body.category ?? "Notes",
        rawText: body.rawText ?? "",
        cleanText: body.cleanText ?? "",
        summary: body.summary ?? "",
        tags: body.tags ?? "[]",
        imageUris: body.imageUris ?? "[]",
        pageCount: body.pageCount ?? 1,
        isPinned: body.isPinned ?? false,
        scanMode: body.scanMode ?? "Notes",
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return c.json({ document: doc }, 201);
  })
  .get("/:id", async (c) => {
    const id = c.req.param("id");
    const [doc] = await db
      .select()
      .from(schema.documents)
      .where(eq(schema.documents.id, id));
    if (!doc) return c.json({ error: "Not found" }, 404);
    return c.json({ document: doc }, 200);
  })
  .patch("/:id", async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json();
    const [doc] = await db
      .update(schema.documents)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(schema.documents.id, id))
      .returning();
    if (!doc) return c.json({ error: "Not found" }, 404);
    return c.json({ document: doc }, 200);
  })
  .delete("/:id", async (c) => {
    const id = c.req.param("id");
    await db.delete(schema.flashcards).where(eq(schema.flashcards.documentId, id));
    await db.delete(schema.documents).where(eq(schema.documents.id, id));
    return c.json({ success: true }, 200);
  })
  .get("/:id/flashcards", async (c) => {
    const id = c.req.param("id");
    const cards = await db
      .select()
      .from(schema.flashcards)
      .where(eq(schema.flashcards.documentId, id));
    return c.json({ flashcards: cards }, 200);
  });
