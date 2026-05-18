import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { api } from "../../lib/api";
import { colors, spacing, radius, typography } from "../../lib/theme";
import { useScryStore, type Document } from "../../lib/store";
import { DocCard } from "../../components/DocCard";
import { SkeletonCard } from "../../components/SkeletonCard";
import { Scan, BookOpen, Receipt, FilePdf, Sparkle, ArrowRight } from "phosphor-react-native";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const quickActions = [
  { label: "Notes", icon: Scan, mode: "Notes", color: colors.accent, bg: colors.accentDim },
  { label: "Book", icon: BookOpen, mode: "Book", color: "#22C55E", bg: "rgba(34,197,94,0.12)" },
  { label: "Receipt", icon: Receipt, mode: "Receipt", color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  { label: "Import PDF", icon: FilePdf, mode: "Import", color: "#F04545", bg: "rgba(240,69,69,0.1)" },
];

const aiSuggestions = [
  "Summarize my notes",
  "Make flashcards",
  "Extract formulas",
  "Create exam revision",
];

export default function HomeScreen() {
  const router = useRouter();
  const { setDocuments } = useScryStore();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const json = await api.documents.list();
      const docs = (json as any).documents as Document[];
      setDocuments(docs);
      return docs;
    },
  });

  const recent = data?.slice(0, 4) ?? [];

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.accent}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.headTitle}>Your Scry</Text>
          </View>
          <TouchableOpacity
            style={styles.aiHeaderBtn}
            onPress={() => router.push("/(tabs)/ai" as any)}
            activeOpacity={0.8}
          >
            <Sparkle size={20} color={colors.accent} weight="fill" />
          </TouchableOpacity>
        </View>

        {/* Stats row */}
        {data && data.length > 0 && (
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>{data.length}</Text>
              <Text style={styles.statLabel}>Documents</Text>
            </View>
            <View style={[styles.statCard, styles.statCardMid]}>
              <Text style={styles.statNum}>
                {data.filter((d) => d.summary).length}
              </Text>
              <Text style={styles.statLabel}>Processed</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>
                {[...new Set(data.flatMap((d) => {
                  const t = typeof d.tags === "string" ? JSON.parse(d.tags) : d.tags ?? [];
                  return t;
                }))].length}
              </Text>
              <Text style={styles.statLabel}>Tags</Text>
            </View>
          </View>
        )}

        {/* Quick scan actions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Scan</Text>
        </View>
        <View style={styles.quickGrid}>
          {quickActions.map((a) => {
            const Icon = a.icon;
            return (
              <TouchableOpacity
                key={a.label}
                style={styles.quickCard}
                onPress={() => router.push({ pathname: "/(tabs)/scan", params: { mode: a.mode } } as any)}
                activeOpacity={0.7}
              >
                <View style={[styles.quickIconWrap, { backgroundColor: a.bg }]}>
                  <Icon size={28} color={a.color} weight="duotone" />
                </View>
                <Text style={[styles.quickLabel, { color: a.color }]}>{a.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* AI suggestions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ask AI</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/ai" as any)} activeOpacity={0.7}>
            <Text style={styles.seeAll}>Open →</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.suggestionsRow}
        >
          {aiSuggestions.map((s) => (
            <TouchableOpacity
              key={s}
              style={styles.suggestionChip}
              onPress={() => router.push({ pathname: "/(tabs)/ai", params: { prompt: s } } as any)}
              activeOpacity={0.75}
            >
              <Sparkle size={13} color={colors.accent} weight="fill" />
              <Text style={styles.suggestionText}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Recent documents */}
        {(isLoading || recent.length > 0) && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/library" as any)} activeOpacity={0.7}>
                <Text style={styles.seeAll}>See all →</Text>
              </TouchableOpacity>
            </View>
            {isLoading ? (
              <View style={{ gap: spacing.sm, paddingHorizontal: spacing.xl }}>
                <SkeletonCard height={110} />
                <SkeletonCard height={110} />
              </View>
            ) : (
              <View style={styles.recentList}>
                {recent.map((doc) => (
                  <DocCard
                    key={doc.id}
                    doc={doc}
                    compact
                    onPress={() => router.push({ pathname: "/document/[id]", params: { id: doc.id } })}
                  />
                ))}
              </View>
            )}
          </>
        )}

        {/* Empty state */}
        {!isLoading && data?.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Scan size={36} color={colors.accent} weight="duotone" />
            </View>
            <Text style={styles.emptyTitle}>Nothing scanned yet.</Text>
            <Text style={styles.emptySub}>Tap Scan to add your first document.</Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => router.push("/(tabs)/scan" as any)}
              activeOpacity={0.85}
            >
              <Scan size={18} color="#fff" weight="bold" />
              <Text style={styles.emptyBtnText}>Scan now</Text>
              <ArrowRight size={16} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: 20 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  greeting: {
    ...typography.caption,
    color: colors.textTertiary,
    marginBottom: 3,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  headTitle: {
    ...typography.display,
  },
  aiHeaderBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.accentDim,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.accentDimBorder,
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  statCard: {
    flex: 1,
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  statCardMid: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.border,
  },
  statNum: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: -0.8,
    lineHeight: 30,
  },
  statLabel: {
    ...typography.micro,
    marginTop: 3,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  // Section headers
  sectionHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    letterSpacing: -0.4,
  },
  seeAll: {
    ...typography.bodySmall,
    color: colors.accent,
    fontWeight: "500",
  },

  // Quick actions
  quickGrid: {
    flexDirection: "row",
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  quickCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  quickIconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  quickLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.1,
    textAlign: "center",
  },

  // AI suggestions
  suggestionsRow: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  suggestionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    marginRight: spacing.xs,
  },
  suggestionText: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontWeight: "500",
  },

  // Recent
  recentList: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },

  // Empty
  emptyState: {
    alignItems: "center",
    paddingTop: spacing.xxxxl,
    paddingHorizontal: spacing.xxxl,
    gap: spacing.md,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    backgroundColor: colors.accentDim,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  emptyTitle: { ...typography.h3 },
  emptySub: { ...typography.bodySmall, textAlign: "center", lineHeight: 20 },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md + 2,
    borderRadius: radius.xl,
    marginTop: spacing.md,
  },
  emptyBtnText: { fontSize: 15, fontWeight: "600", color: "#fff" },
});
