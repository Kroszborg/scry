import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Share,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";
import { api } from "../../lib/api";
import { colors, spacing, radius, typography } from "../../lib/theme";
import type { Document, Flashcard } from "../../lib/store";
import {
  ArrowLeft,
  Sparkle,
  Copy,
  FloppyDisk,
  FileText,
  ShareNetwork,
  Trash,
  ArrowUp,
  X,
  Cards,
  ListChecks,
  MathOperations,
  PencilSimple,
  FilePdf,
} from "phosphor-react-native";

type Tab = "Preview" | "Text" | "AI" | "Export";

export default function DocumentScreen() {
  const router = useRouter();
  const { id, autoProcess } = useLocalSearchParams<{
    id: string;
    autoProcess?: string;
  }>();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>("Preview");
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingText, setEditingText] = useState(false);
  const [editText, setEditText] = useState("");
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [extractedItems, setExtractedItems] = useState<string[]>([]);
  const [extractType, setExtractType] = useState<string | null>(null);
  const chatScrollRef = useRef<ScrollView>(null);

  const { data: docData, isLoading } = useQuery({
    queryKey: ["document", id],
    queryFn: async () => {
      return api.documents.get(id) as Promise<{ document: Document }>;
    },
    enabled: !!id,
  });

  const doc = (docData as any)?.document as Document | undefined;

  const updateDoc = useMutation({
    mutationFn: async (updates: Partial<Document>) => {
      return api.documents.update(id, updates as Record<string, unknown>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document", id] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });

  const deleteDoc = useMutation({
    mutationFn: async () => {
      await api.documents.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      router.back();
    },
  });

  const { messages, sendMessage, status: chatStatus } = useChat({
    transport: new DefaultChatTransport({ api: `${api.baseUrl}/api/agent/messages` }),
  });
  const [chatInput, setChatInput] = useState("");
  const isChatLoading = chatStatus === "streaming" || chatStatus === "submitted";

  useEffect(() => {
    if (autoProcess === "1" && doc && !doc.cleanText && !isProcessing) {
      runAIProcess();
    }
  }, [doc?.id]);

  useEffect(() => {
    if (doc?.cleanText) setEditText(doc.cleanText);
  }, [doc?.cleanText]);

  const runAIProcess = async () => {
    if (!doc) return;
    setIsProcessing(true);
    try {
      // Parse stored image URIs
      const uris: string[] =
        typeof doc.imageUris === "string"
          ? JSON.parse(doc.imageUris)
          : (doc.imageUris as string[]) ?? [];

      // Compress first image to keep payload manageable (~300-600KB base64)
      let imageBase64: string | undefined;
      if (uris.length > 0) {
        try {
          const compressed = await ImageManipulator.manipulateAsync(
            uris[0],
            [{ resize: { width: 1024 } }],
            { compress: 0.75, format: ImageManipulator.SaveFormat.JPEG }
          );
          imageBase64 = await FileSystem.readAsStringAsync(compressed.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
        } catch {
          // Continue without vision — AI will process rawText only
        }
      }

      await fetch(`${api.baseUrl}/api/ai/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: id,
          rawText: doc.rawText || "",
          scanMode: doc.scanMode,
          imageBase64,
        }),
      });
      queryClient.invalidateQueries({ queryKey: ["document", id] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    } catch {
      // silent
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateFlashcards = async () => {
    if (!doc) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`${api.baseUrl}/api/ai/flashcards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: id,
          text: doc.cleanText || doc.rawText,
        }),
      });
      const data = await res.json();
      setFlashcards(data.flashcards ?? []);
      setExtractedItems([]);
    } catch {
      Alert.alert("Error", "Could not generate flashcards.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExtract = async (type: string) => {
    if (!doc) return;
    setIsProcessing(true);
    setExtractType(type);
    try {
      const res = await fetch(`${api.baseUrl}/api/ai/extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: doc.cleanText || doc.rawText, type }),
      });
      const data = await res.json();
      setExtractedItems(data.items ?? []);
      setFlashcards([]);
    } catch {
      Alert.alert("Error", "Could not extract items.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendChat = () => {
    if (!chatInput.trim() || isChatLoading) return;
    const ctx = doc
      ? `\n\n[Document: "${doc.title}"]\n${(
          doc.cleanText ||
          doc.rawText ||
          ""
        ).slice(0, 2000)}`
      : "";
    sendMessage({ text: chatInput.trim() + ctx });
    setChatInput("");
    setTimeout(
      () => chatScrollRef.current?.scrollToEnd({ animated: true }),
      100
    );
  };

  const handleDelete = () => {
    Alert.alert("Delete document?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteDoc.mutate(),
      },
    ]);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${doc?.title ?? "Document"}\n\n${
          doc?.cleanText ?? doc?.rawText ?? ""
        }`,
        title: doc?.title,
      });
    } catch {}
  };

  const handlePdfExport = async () => {
    if (!doc) return;
    try {
      const dateStr = new Date(doc.createdAt).toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric",
      });
      const tagsStr = tags.length > 0 ? tags.join(", ") : "";
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
        <style>
          body{font-family:Georgia,serif;padding:32px 40px;color:#111;line-height:1.7;max-width:720px;margin:0 auto}
          h1{font-size:26px;margin-bottom:4px;color:#0a0a0a}
          .meta{font-size:13px;color:#666;margin-bottom:24px;font-family:sans-serif}
          .summary{background:#f5f5f5;border-left:3px solid #7c5cfc;padding:12px 16px;border-radius:4px;margin:20px 0;font-size:14px;font-style:italic;color:#333}
          .tags{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:20px}
          .tag{background:#ede9ff;color:#5a3fc0;padding:3px 10px;border-radius:99px;font-size:12px;font-family:sans-serif}
          pre{white-space:pre-wrap;font-family:Georgia,serif;font-size:15px;line-height:1.8;margin-top:16px}
          hr{border:none;border-top:1px solid #e0e0e0;margin:20px 0}
        </style></head><body>
        <h1>${doc.title}</h1>
        <div class="meta">${doc.category} &nbsp;·&nbsp; ${dateStr}${doc.pageCount > 1 ? ` &nbsp;·&nbsp; ${doc.pageCount} pages` : ""}</div>
        ${tagsStr ? `<div class="tags">${tags.map(t => `<span class="tag">${t}</span>`).join("")}</div>` : ""}
        ${doc.summary ? `<div class="summary">${doc.summary}</div><hr/>` : ""}
        <pre>${(doc.cleanText || doc.rawText || "No text available.").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
        </body></html>`;
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: `Export ${doc.title}`,
        UTI: "com.adobe.pdf",
      });
    } catch {
      Alert.alert("Export failed", "Could not generate PDF.");
    }
  };

  const handleMarkdownExport = async () => {
    if (!doc) return;
    try {
      const dateStr = new Date(doc.createdAt).toLocaleDateString("en-US", {
        year: "numeric", month: "short", day: "numeric",
      });
      const tagsLine = tags.length > 0 ? `**Tags:** ${tags.join(", ")}\n\n` : "";
      const summaryLine = doc.summary ? `> ${doc.summary}\n\n---\n\n` : "";
      const md = `# ${doc.title}\n\n_${doc.category} · ${dateStr}_\n\n${tagsLine}${summaryLine}${doc.cleanText || doc.rawText || ""}`;
      const fileName = `${doc.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.md`;
      const filePath = `${FileSystem.cacheDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(filePath, md, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      await Sharing.shareAsync(filePath, {
        mimeType: "text/markdown",
        dialogTitle: `Export ${doc.title}`,
        UTI: "net.daringfireball.markdown",
      });
    } catch {
      Alert.alert("Export failed", "Could not generate Markdown.");
    }
  };

  const handleSaveText = async () => {
    await updateDoc.mutateAsync({ cleanText: editText } as any);
    setEditingText(false);
  };

  if (isLoading || !doc) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  const tags: string[] =
    typeof doc.tags === "string" ? JSON.parse(doc.tags) : doc.tags ?? [];
  const imageUris: string[] =
    typeof doc.imageUris === "string"
      ? JSON.parse(doc.imageUris)
      : doc.imageUris ?? [];

  const promptChips = [
    {
      label: "Summarize",
      prompt: `Summarize this document: "${doc.title}"\n\n${(
        doc.cleanText ||
        doc.rawText ||
        ""
      ).slice(0, 2000)}`,
    },
    {
      label: "Explain simply",
      prompt: `Explain simply: "${doc.title}"\n\n${(
        doc.cleanText ||
        doc.rawText ||
        ""
      ).slice(0, 2000)}`,
    },
    {
      label: "Key questions",
      prompt: `Most important questions from: "${doc.title}"\n\n${(
        doc.cleanText ||
        doc.rawText ||
        ""
      ).slice(0, 2000)}`,
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerBtn}
          activeOpacity={0.75}
        >
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.docTitle} numberOfLines={1}>
            {doc.title}
          </Text>
          <Text style={styles.docMeta}>
            {doc.category} ·{" "}
            {new Date(doc.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleDelete}
          style={[styles.headerBtn, styles.dangerBtn]}
          activeOpacity={0.75}
        >
          <Trash size={18} color={colors.danger} />
        </TouchableOpacity>
      </View>

      {/* Tags */}
      {tags.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tagsRow}
        >
          {tags.map((t) => (
            <View key={t} style={styles.tag}>
              <Text style={styles.tagText}>{t}</Text>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Processing banner */}
      {isProcessing && (
        <View style={styles.processingBanner}>
          <ActivityIndicator size="small" color={colors.accent} />
          <Text style={styles.processingText}>AI is reading your document…</Text>
        </View>
      )}

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {(["Preview", "Text", "AI", "Export"] as Tab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.tabTextActive,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ─── PREVIEW TAB ─── */}
      {activeTab === "Preview" && (
        <ScrollView
          style={styles.tabContent}
          contentContainerStyle={{ paddingBottom: 48 }}
          showsVerticalScrollIndicator={false}
        >
          {imageUris.length > 0 ? (
            imageUris.map((uri, i) => (
              <Image
                key={i}
                source={{ uri }}
                style={styles.pageImage}
                resizeMode="contain"
              />
            ))
          ) : (
            <View style={styles.noImageBox}>
              <FileText size={44} color={colors.textTertiary} weight="duotone" />
              <Text style={styles.noImageText}>No preview available.</Text>
            </View>
          )}

          {doc.summary ? (
            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <Sparkle size={15} color={colors.accent} weight="fill" />
                <Text style={styles.summaryLabel}>AI SUMMARY</Text>
              </View>
              <Text style={styles.summaryText}>{doc.summary}</Text>
            </View>
          ) : !isProcessing ? (
            <TouchableOpacity
              style={styles.processBtn}
              onPress={runAIProcess}
              activeOpacity={0.85}
            >
              <Sparkle size={20} color="#fff" weight="fill" />
              <Text style={styles.processBtnText}>Run AI Processing</Text>
            </TouchableOpacity>
          ) : null}
        </ScrollView>
      )}

      {/* ─── TEXT TAB ─── */}
      {activeTab === "Text" && (
        <View style={{ flex: 1 }}>
          <View style={styles.textActions}>
            {editingText ? (
              <>
                <TouchableOpacity
                  style={styles.textActionBtn}
                  onPress={handleSaveText}
                  activeOpacity={0.75}
                >
                  <FloppyDisk size={16} color={colors.accent} />
                  <Text style={[styles.textActionText, { color: colors.accent }]}>
                    Save
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.textActionBtn}
                  onPress={() => setEditingText(false)}
                  activeOpacity={0.75}
                >
                  <X size={16} color={colors.textSecondary} />
                  <Text style={styles.textActionText}>Cancel</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.textActionBtn}
                  onPress={() => {
                    setEditText(doc.cleanText || doc.rawText || "");
                    setEditingText(true);
                  }}
                  activeOpacity={0.75}
                >
                  <PencilSimple size={16} color={colors.textSecondary} />
                  <Text style={styles.textActionText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.textActionBtn}
                  onPress={handleShare}
                  activeOpacity={0.75}
                >
                  <Copy size={16} color={colors.textSecondary} />
                  <Text style={styles.textActionText}>Copy all</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
          <ScrollView
            style={styles.tabContent}
            contentContainerStyle={{ padding: spacing.xl, paddingBottom: 48 }}
            showsVerticalScrollIndicator={false}
          >
            {editingText ? (
              <TextInput
                style={styles.editableText}
                value={editText}
                onChangeText={setEditText}
                multiline
                autoFocus
                textAlignVertical="top"
              />
            ) : (
              <Text style={styles.docText} selectable>
                {doc.cleanText ||
                  doc.rawText ||
                  "No text extracted. Run AI processing."}
              </Text>
            )}
          </ScrollView>
        </View>
      )}

      {/* ─── AI TAB ─── */}
      {activeTab === "AI" && (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          {/* Action chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.aiChipsRow}
            bounces={false}
          >
            <TouchableOpacity
              style={styles.aiChip}
              onPress={handleGenerateFlashcards}
              activeOpacity={0.75}
            >
              <Cards size={15} color={colors.accent} weight="duotone" />
              <Text style={styles.aiChipText}>Flashcards</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.aiChip}
              onPress={() => handleExtract("tasks")}
              activeOpacity={0.75}
            >
              <ListChecks size={15} color={colors.accent} weight="duotone" />
              <Text style={styles.aiChipText}>Tasks</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.aiChip}
              onPress={() => handleExtract("formulas")}
              activeOpacity={0.75}
            >
              <MathOperations size={15} color={colors.accent} weight="duotone" />
              <Text style={styles.aiChipText}>Formulas</Text>
            </TouchableOpacity>
            {promptChips.map((c) => (
              <TouchableOpacity
                key={c.label}
                style={styles.aiChip}
                onPress={() => sendMessage({ text: c.prompt })}
                activeOpacity={0.75}
              >
                <Sparkle size={15} color={colors.accent} weight="duotone" />
                <Text style={styles.aiChipText}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Results */}
          {flashcards.length > 0 && (
            <ScrollView
              style={styles.resultsScroll}
              contentContainerStyle={styles.resultsContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.sectionLabel}>
                FLASHCARDS ({flashcards.length})
              </Text>
              {flashcards.map((fc, i) => (
                <View key={i} style={styles.flashcard}>
                  <Text style={styles.flashcardQ}>{fc.question}</Text>
                  <View style={styles.flashcardDivider} />
                  <Text style={styles.flashcardA}>{fc.answer}</Text>
                </View>
              ))}
            </ScrollView>
          )}

          {extractedItems.length > 0 && flashcards.length === 0 && (
            <ScrollView
              style={styles.resultsScroll}
              contentContainerStyle={styles.resultsContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.sectionLabel}>
                {(extractType ?? "ITEMS").toUpperCase()} ({extractedItems.length})
              </Text>
              {extractedItems.map((item, i) => (
                <View key={i} style={styles.extractItem}>
                  <View style={styles.extractDot} />
                  <Text style={styles.extractText}>{item}</Text>
                </View>
              ))}
            </ScrollView>
          )}

          {/* Chat */}
          <ScrollView
            ref={chatScrollRef}
            style={styles.chatScroll}
            contentContainerStyle={styles.chatContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {messages.length === 0 &&
              flashcards.length === 0 &&
              extractedItems.length === 0 && (
                <View style={styles.aiEmpty}>
                  <Sparkle size={28} color={colors.textTertiary} weight="duotone" />
                  <Text style={styles.aiEmptyText}>
                    Use the chips above or ask a question below
                  </Text>
                </View>
              )}
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              const raw =
                msg.parts
                  ?.filter((p) => p.type === "text")
                  .map((p: any) => p.text)
                  .join("") ?? "";
              const displayText = isUser
                ? raw.split("\n\n[Document:")[0]
                : raw;
              return (
                <View
                  key={msg.id}
                  style={[
                    styles.msgRow,
                    isUser ? styles.msgRowUser : styles.msgRowAI,
                  ]}
                >
                  <View
                    style={[
                      styles.bubble,
                      isUser ? styles.bubbleUser : styles.bubbleAI,
                    ]}
                  >
                    <Text
                      style={[
                        styles.bubbleText,
                        isUser ? styles.bubbleTextUser : styles.bubbleTextAI,
                      ]}
                    >
                      {displayText}
                    </Text>
                  </View>
                </View>
              );
            })}
            {isChatLoading && (
              <View style={[styles.msgRow, styles.msgRowAI]}>
                <View style={[styles.bubble, styles.bubbleAI]}>
                  <ActivityIndicator size="small" color={colors.textSecondary} />
                </View>
              </View>
            )}
          </ScrollView>

          {/* Chat input */}
          <View style={[styles.chatInputArea, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
            <View style={styles.chatInputRow}>
              <TextInput
                style={styles.chatInput}
                value={chatInput}
                onChangeText={setChatInput}
                placeholder="Ask about this document..."
                placeholderTextColor={colors.textTertiary}
                returnKeyType="send"
                onSubmitEditing={handleSendChat}
              />
              <TouchableOpacity
                style={[
                  styles.chatSendBtn,
                  (!chatInput.trim() || isChatLoading) && styles.chatSendBtnOff,
                ]}
                onPress={handleSendChat}
                disabled={!chatInput.trim() || isChatLoading}
                activeOpacity={0.8}
              >
                <ArrowUp
                  size={17}
                  color={
                    !chatInput.trim() || isChatLoading
                      ? colors.textTertiary
                      : "#fff"
                  }
                  weight="bold"
                />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}

      {/* ─── EXPORT TAB ─── */}
      {activeTab === "Export" && (
        <ScrollView
          style={styles.tabContent}
          contentContainerStyle={styles.exportContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.exportTitle}>Export</Text>

          <TouchableOpacity
            style={styles.exportRow}
            onPress={handlePdfExport}
            activeOpacity={0.75}
          >
            <View style={[styles.exportIcon, styles.exportIconPdf]}>
              <FilePdf size={22} color="#E53E3E" weight="duotone" />
            </View>
            <View style={styles.exportInfo}>
              <Text style={styles.exportLabel}>PDF Document</Text>
              <Text style={styles.exportSub}>Formatted, shareable PDF file</Text>
            </View>
            <ShareNetwork size={18} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.exportRow}
            onPress={handleMarkdownExport}
            activeOpacity={0.75}
          >
            <View style={[styles.exportIcon, styles.exportIconMd]}>
              <PencilSimple size={22} color="#0D74CE" weight="duotone" />
            </View>
            <View style={styles.exportInfo}>
              <Text style={styles.exportLabel}>Markdown</Text>
              <Text style={styles.exportSub}>Structured text with formatting</Text>
            </View>
            <ShareNetwork size={18} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.exportRow}
            onPress={handleShare}
            activeOpacity={0.75}
          >
            <View style={styles.exportIcon}>
              <FileText size={22} color={colors.accent} weight="duotone" />
            </View>
            <View style={styles.exportInfo}>
              <Text style={styles.exportLabel}>Plain Text</Text>
              <Text style={styles.exportSub}>Share as raw text via any app</Text>
            </View>
            <ShareNetwork size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  headerBtn: {
    width: 42,
    height: 42,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  dangerBtn: { backgroundColor: colors.dangerDim },
  headerCenter: { flex: 1, paddingHorizontal: spacing.sm },
  docTitle: { ...typography.h3, lineHeight: 22 },
  docMeta: { ...typography.caption, marginTop: 2 },

  tagsRow: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    flexDirection: "row",
    gap: spacing.sm,
  },
  tag: {
    backgroundColor: colors.accentDim,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  tagText: { fontSize: 12, color: colors.accent, fontWeight: "500" },

  processingBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.accentDim,
    marginHorizontal: spacing.xl,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.accentDimBorder,
  },
  processingText: { ...typography.bodySmall, color: colors.accent },

  tabBar: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.accent,
  },
  tabText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  tabTextActive: { color: colors.accent, fontWeight: "600" },

  tabContent: { flex: 1 },

  // Preview
  pageImage: {
    width: "100%",
    height: 440,
    marginBottom: spacing.sm,
    backgroundColor: "#000",
  },
  noImageBox: {
    height: 200,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    margin: spacing.xl,
    borderRadius: radius.xl,
  },
  noImageText: { ...typography.bodySmall },
  summaryCard: {
    backgroundColor: colors.surface,
    margin: spacing.xl,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  summaryLabel: { ...typography.label, color: colors.accent, letterSpacing: 1 },
  summaryText: { ...typography.body, lineHeight: 24 },
  processBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.accent,
    margin: spacing.xl,
    borderRadius: radius.xl,
    paddingVertical: spacing.lg,
  },
  processBtnText: { fontSize: 16, fontWeight: "600", color: "#fff" },

  // Text tab
  textActions: {
    flexDirection: "row",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  textActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  textActionText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  docText: {
    ...typography.body,
    lineHeight: 26,
    color: colors.textPrimary,
  },
  editableText: {
    ...typography.body,
    lineHeight: 24,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radius.md,
    padding: spacing.lg,
    minHeight: 200,
    textAlignVertical: "top",
  },

  // AI tab
  aiChipsRow: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  aiChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.full,
    marginRight: spacing.xs,
  },
  aiChipText: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  resultsScroll: { maxHeight: 260 },
  resultsContent: { padding: spacing.xl, gap: spacing.md },
  sectionLabel: { ...typography.label, marginBottom: spacing.xs },
  flashcard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  flashcardQ: { ...typography.bodyMedium },
  flashcardDivider: { height: 1, backgroundColor: colors.border },
  flashcardA: { ...typography.body, color: colors.textSecondary, lineHeight: 22 },
  extractItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    paddingVertical: 3,
  },
  extractDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
    marginTop: 9,
  },
  extractText: { ...typography.body, flex: 1, lineHeight: 22 },
  aiEmpty: {
    alignItems: "center",
    paddingTop: 48,
    gap: spacing.md,
  },
  aiEmptyText: {
    ...typography.bodySmall,
    textAlign: "center",
    maxWidth: 240,
    lineHeight: 20,
  },
  chatScroll: { flex: 1 },
  chatContent: { padding: spacing.xl, gap: spacing.md },
  msgRow: {
    flexDirection: "row",
  },
  msgRowUser: { justifyContent: "flex-end" },
  msgRowAI: { justifyContent: "flex-start" },
  bubble: {
    maxWidth: "82%",
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  bubbleUser: {
    backgroundColor: colors.accent,
    borderBottomRightRadius: 4,
  },
  bubbleAI: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
    minWidth: 60,
    minHeight: 40,
    justifyContent: "center",
  },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  bubbleTextUser: { color: "#fff" },
  bubbleTextAI: { color: colors.textPrimary },
  chatInputArea: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  chatInputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chatInput: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
  },
  chatSendBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  chatSendBtnOff: { backgroundColor: colors.surfaceElevated },

  // Export
  exportContent: { padding: spacing.xl, gap: spacing.md },
  exportTitle: { ...typography.h2, marginBottom: spacing.sm },
  exportRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  exportIcon: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.accentDim,
    alignItems: "center",
    justifyContent: "center",
  },
  exportIconPdf: { backgroundColor: "rgba(229,62,62,0.1)" },
  exportIconMd: { backgroundColor: "rgba(13,116,206,0.1)" },
  exportInfo: { flex: 1 },
  exportLabel: { ...typography.bodyMedium },
  exportSub: { ...typography.caption, marginTop: 2 },
});
