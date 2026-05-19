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
import {
  Scan,
  BookOpen,
  Receipt,
  FilePdf,
  Sparkle,
  ArrowUpRight,
  IdentificationCard,
} from "phosphor-react-native";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const quickActions = [
  {
    label: "Notes",
    icon: Scan,
    mode: "Notes",
    color: colors.accent,
    bg: colors.accentDim,
    border: colors.accentDimBorder,
  },
  {
    label: "Book",
    icon: BookOpen,
    mode: "Book",
    color: "#22C55E",
    bg: "rgba(34,197,94,0.1)",
    border: "rgba(34,197,94,0.2)",
  },
  {
    label: "Receipt",
    icon: Receipt,
    mode: "Receipt",
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.1)",
    border: "rgba(245,158,11,0.2)",
  },
  {
    label: "ID Card",
    icon: IdentificationCard,
    mode: "ID Card",
    color: "#3B82F6",
    bg: "rgba(59,130,246,0.1)",
    border: "rgba(59,130,246,0.2)",
  },
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

  const recent = data?.slice(0, 5) ?? [];

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
            <Text style={styles.headTitle}>Scry</Text>
          </View>
          <TouchableOpacity
            style={styles.aiHeaderBtn}
            onPress={() => router.push("/(tabs)/ai" as any)}
            activeOpacity={0.8}
          >
            <Sparkle size={18} color={colors.accent} weight="fill" />
          </TouchableOpacity>
        </View>

        {/* Hero scan button */}
        <TouchableOpacity
          style={styles.heroScan}
          onPress={() => router.push("/(tabs)/scan" as any)}
          activeOpacity={0.88}
        >
          <View style={styles.heroScanIcon}>
            <Scan size={30} color="#fff" weight="regular" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroScanLabel}>Scan a document</Text>
            <Text style={styles.heroScanSub}>Notes, books, receipts, IDs</Text>
          </View>
          <ArrowUpRight size={18} color="rgba(255,255,255,0.55)" />
        </TouchableOpacity>

        {/* Stats row — only if docs exist */}
        {data && data.length > 0 && (
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>{data.length}</Text>
              <Text style={styles.statLabel}>Scanned</Text>
            </View>
            <View style={[styles.statCard, styles.statCardMid]}>
              <Text style={styles.statNum}>
                {data.filter((d) => d.summary).length}
              </Text>
              <Text style={styles.statLabel}>Processed</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>
                {
                  [
                    ...new Set(
                      data.flatMap((d) => {
                        const t =
                          typeof d.tags === "string"
                            ? JSON.parse(d.tags)
                            : d.tags ?? [];
                        return t;
                      })
                    ),
                  ].length
                }
              </Text>
              <Text style={styles.statLabel}>Tags</Text>
            </View>
          </View>
        )}

        {/* Quick type grid */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick scan</Text>
        </View>
        <View style={styles.quickGrid}>
          {quickActions.map((a) => {
            const Icon = a.icon;
            return (
              <TouchableOpacity
                key={a.label}
                style={[styles.quickCard, { borderColor: a.border }]}
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/scan",
                    params: { mode: a.mode },
                  } as any)
                }
                activeOpacity={0.72}
              >
                <View style={[styles.quickIconWrap, { backgroundColor: a.bg }]}>
                  <Icon size={22} color={a.color} weight="duotone" />
                </View>
                <Text style={[styles.quickLabel, { color: a.color }]}>
                  {a.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Recent documents */}
        {(isLoading || recent.length > 0) && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent</Text>
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/library" as any)}
                activeOpacity={0.7}
              >
                <Text style={styles.seeAll}>See all</Text>
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
                    onPress={() =>
                      router.push({
                        pathname: "/document/[id]",
                        params: { id: doc.id },
                      })
                    }
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
              <Scan size={32} color={colors.accent} weight="duotone" />
            </View>
            <Text style={styles.emptyTitle}>Nothing scanned yet</Text>
            <Text style={styles.emptySub}>
              Tap the Scan tab or the button above to add your first document.
            </Text>
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

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  greeting: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.textTertiary,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  headTitle: {
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -1.2,
    color: colors.textPrimary,
  },
  aiHeaderBtn: {
    width: 42,
    height: 42,
    borderRadius: radius.full,
    backgroundColor: colors.accentDim,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.accentDimBorder,
    marginTop: 4,
  },

  // Hero scan
  heroScan: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    backgroundColor: colors.accent,
    marginHorizontal: spacing.xl,
    borderRadius: radius.xl,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  heroScanIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroScanLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: -0.3,
  },
  heroScanSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.65)",
    marginTop: 2,
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  statCard: {
    flex: 1,
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  statCardMid: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  statNum: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: -0.8,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "500",
    color: colors.textTertiary,
    marginTop: 3,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  // Sections
  sectionHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  seeAll: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.accent,
  },

  // Quick grid
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
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  quickIconWrap: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  quickLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.1,
    textAlign: "center",
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
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: colors.accentDim,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.accentDimBorder,
  },
  emptyTitle: {
    ...typography.h3,
  },
  emptySub: {
    ...typography.bodySmall,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 260,
  },
});
