import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import Constants from "expo-constants";
import { useLocalSearchParams } from "expo-router";
import { colors, spacing, radius, typography } from "../../lib/theme";
import { Sparkle, ArrowUp } from "phosphor-react-native";

const baseUrl =
  Constants.expoConfig?.extra?.apiUrl ??
  process.env.EXPO_PUBLIC_API_URL ??
  "http://localhost:4200";

const suggestions = [
  "Summarize all my biology notes",
  "Create exam revision plan",
  "Find all formulas",
  "Extract key dates",
  "Compare my notes",
  "Explain in simpler terms",
];

export default function AIScreen() {
  const params = useLocalSearchParams<{ prompt?: string }>();
  const [input, setInput] = useState("");
  const scrollRef = useRef<ScrollView>(null);
  const didAutoSend = useRef(false);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: `${baseUrl}/api/agent/messages` }),
  });

  const isLoading = status === "streaming" || status === "submitted";

  useEffect(() => {
    if (params.prompt && !didAutoSend.current) {
      didAutoSend.current = true;
      sendMessage({ text: params.prompt });
    }
  }, [params.prompt]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input.trim() });
    setInput("");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.aiIcon}>
            <Sparkle size={22} color={colors.accent} weight="fill" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Scry AI</Text>
            <Text style={styles.headerSub}>Ask about your documents</Text>
          </View>
          {messages.length > 0 && (
            <View style={[styles.statusDot, isLoading && styles.statusDotActive]} />
          )}
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={styles.messages}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {messages.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Sparkle size={38} color={colors.accent} weight="duotone" />
              </View>
              <Text style={styles.emptyTitle}>Ask anything</Text>
              <Text style={styles.emptySub}>
                Summarize, explain, or find key info from your scanned documents.
              </Text>
              <View style={styles.suggestionsGrid}>
                {suggestions.map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={styles.suggestionChip}
                    onPress={() => sendMessage({ text: s })}
                    activeOpacity={0.75}
                  >
                    <Sparkle size={12} color={colors.accent} weight="fill" />
                    <Text style={styles.suggestionText}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            messages.map((msg) => {
              const isUser = msg.role === "user";
              const textContent =
                msg.parts
                  ?.filter((p) => p.type === "text")
                  .map((p: any) => p.text)
                  .join("") ?? "";
              return (
                <View
                  key={msg.id}
                  style={[
                    styles.msgRow,
                    isUser ? styles.msgRowUser : styles.msgRowAI,
                  ]}
                >
                  {!isUser && (
                    <View style={styles.aiAvatar}>
                      <Sparkle size={13} color={colors.accent} weight="fill" />
                    </View>
                  )}
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
                      {textContent}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
          {isLoading && (
            <View style={[styles.msgRow, styles.msgRowAI]}>
              <View style={styles.aiAvatar}>
                <Sparkle size={13} color={colors.accent} weight="fill" />
              </View>
              <View style={[styles.bubble, styles.bubbleAI, styles.typingBubble]}>
                <View style={styles.typingDots}>
                  <View style={[styles.typingDot, styles.typingDot1]} />
                  <View style={[styles.typingDot, styles.typingDot2]} />
                  <View style={[styles.typingDot, styles.typingDot3]} />
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputArea}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Ask about your documents..."
              placeholderTextColor={colors.textTertiary}
              multiline
              maxLength={500}
              returnKeyType="default"
            />
            <TouchableOpacity
              style={[
                styles.sendBtn,
                (!input.trim() || isLoading) && styles.sendBtnDisabled,
              ]}
              onPress={handleSend}
              disabled={!input.trim() || isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.textTertiary} />
              ) : (
                <ArrowUp
                  size={18}
                  color={input.trim() ? "#fff" : colors.textTertiary}
                  weight="bold"
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  aiIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.full,
    backgroundColor: colors.accentDim,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.accentDimBorder,
  },
  headerTitle: { ...typography.h3 },
  headerSub: { ...typography.caption, marginTop: 2 },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textTertiary,
  },
  statusDotActive: { backgroundColor: colors.success },

  messages: { flex: 1 },
  messagesContent: {
    padding: spacing.xl,
    gap: spacing.lg,
    paddingBottom: spacing.xxxl,
  },

  emptyState: {
    alignItems: "center",
    paddingTop: 40,
    gap: spacing.lg,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    backgroundColor: colors.accentDim,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.accentDimBorder,
  },
  emptyTitle: { ...typography.h2 },
  emptySub: {
    ...typography.bodySmall,
    textAlign: "center",
    maxWidth: 260,
    lineHeight: 20,
  },
  suggestionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "center",
    marginTop: spacing.sm,
    maxWidth: 340,
  },
  suggestionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.full,
  },
  suggestionText: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontWeight: "500",
  },

  msgRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
  },
  msgRowUser: { justifyContent: "flex-end" },
  msgRowAI: { justifyContent: "flex-start" },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.accentDim,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  bubble: {
    maxWidth: "78%",
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
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: -0.1,
  },
  bubbleTextUser: { color: "#fff" },
  bubbleTextAI: { color: colors.textPrimary },

  typingBubble: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minWidth: 60,
  },
  typingDots: {
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
    height: 18,
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.textTertiary,
  },
  typingDot1: {},
  typingDot2: { opacity: 0.7 },
  typingDot3: { opacity: 0.4 },

  inputArea: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    maxHeight: 100,
    paddingVertical: spacing.sm,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: { backgroundColor: colors.surfaceElevated },
});
