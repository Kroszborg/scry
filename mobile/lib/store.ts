import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ScanMode = "Notes" | "Book" | "Whiteboard" | "Receipt" | "ID Card";
export type DocCategory = "Notes" | "Book" | "Receipt" | "ID" | "Assignment" | "Whiteboard";

export interface Document {
  id: string;
  title: string;
  category: DocCategory;
  rawText: string;
  cleanText: string;
  summary: string;
  tags: string[];
  imageUris: string[];
  pageCount: number;
  isPinned: boolean;
  scanMode: ScanMode;
  createdAt: string;
  updatedAt: string;
}

export interface Flashcard {
  id: string;
  documentId: string;
  question: string;
  answer: string;
}

interface ScryStore {
  documents: Document[];
  setDocuments: (docs: Document[]) => void;
  addDocument: (doc: Document) => void;
  updateDocument: (id: string, updates: Partial<Document>) => void;
  removeDocument: (id: string) => void;
  pinnedIds: string[];
  togglePin: (id: string) => void;
}

export const useScryStore = create<ScryStore>((set, get) => ({
  documents: [],
  setDocuments: (docs) => set({ documents: docs }),
  addDocument: (doc) =>
    set((s) => ({ documents: [doc, ...s.documents] })),
  updateDocument: (id, updates) =>
    set((s) => ({
      documents: s.documents.map((d) => (d.id === id ? { ...d, ...updates } : d)),
    })),
  removeDocument: (id) =>
    set((s) => ({ documents: s.documents.filter((d) => d.id !== id) })),
  pinnedIds: [],
  togglePin: (id) =>
    set((s) => ({
      pinnedIds: s.pinnedIds.includes(id)
        ? s.pinnedIds.filter((x) => x !== id)
        : [...s.pinnedIds, id],
    })),
}));
