import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const documents = sqliteTable("documents", {
  id: text("id").primaryKey(),
  title: text("title").notNull().default("Untitled Document"),
  category: text("category").notNull().default("Notes"),
  rawText: text("raw_text").notNull().default(""),
  cleanText: text("clean_text").notNull().default(""),
  summary: text("summary").notNull().default(""),
  tags: text("tags").notNull().default("[]"),
  imageUris: text("image_uris").notNull().default("[]"),
  pageCount: integer("page_count").notNull().default(1),
  isPinned: integer("is_pinned", { mode: "boolean" }).notNull().default(false),
  scanMode: text("scan_mode").notNull().default("Notes"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const flashcards = sqliteTable("flashcards", {
  id: text("id").primaryKey(),
  documentId: text("document_id").notNull(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});
