import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { api } from "../../lib/api";
import { colors, spacing, radius, typography } from "../../lib/theme";
import { useScryStore, type Document, type DocCategory } from "../../lib/store";
import { DocCard } from "../../components/DocCard";
import { SkeletonCard } from "../../components/SkeletonCard";
import { MagnifyingGlass, FolderOpen, X } from "phosphor-react-native";

type FilterValue = DocCategory | "All";

const FILTERS: { label: string; value: FilterValue }[] = [
  { label: "All", value: "All" },
  { label: "Notes", value: "Notes" },
  { label: "Books", value: "Book" },
  { label: "Receipts", value: "Receipt" },
  { label: "IDs", value: "ID" },
  { label: "Assignments", value: "Assignment" },
];

export default function LibraryScreen() {
  const router = useRouter();
  const { setDocuments } = useScryStore();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterValue>("All");

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const json = await api.documents.list();
      const docs = (json as any).documents as Document[];
      setDocuments(docs);
      return docs;
    },
  });

  const filtered = useMemo(() => {
    let docs = data ?? [];
    if (activeFilter !== "All") {
      docs = docs.filter((d) => d.category === activeFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      docs = docs.filter((d) => {
        const tags =
          typeof d.tags === "string" ? d.tags : JSON.stringify(d.tags ?? []);
        return (
          d.title.toLowerCase().includes(q) ||
          (d.cleanText || "").toLowerCase().includes(q) ||
          (d.summary || "").toLowerCase().includes(q) ||
          tags.toLowerCase().includes(q)
        );
      });
    }
    return docs;
  }, [data, activeFilter, search]);

  const totalForFilter = useMemo(() => {
    if (!data) return 0;
    if (activeFilter === "All") return data.length;
    return data.filter((d) => d.category === activeFilter).length;
  }, [data, activeFilter]);

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Library</Text>
          {data && (
            <Text style={styles.subtitle}>
              {filtered.length === totalForFilter
                ? `${totalForFilter} document${totalForFilter !== 1 ? "s" : ""}`
                : `${filtered.length} of ${totalForFilter}`}
            </Text>
          )}
        </View>
      </View>

      {/* Search bar */}
      <View style={styles.searchWrap}>
        <MagnifyingGlass size={18} color={colors.textTertiary} weight="regular" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search documents..."
          placeholderTextColor={colors.textTertiary}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          clearButtonMode="never"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {search.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearch("")}
            hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
          >
            <View style={styles.clearBtn}>
              <X size={11} color={colors.textSecondary} weight="bold" />
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Category filter tabs — fixed row, no gap overflows */}
      <View style={styles.filterOuter}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
          bounces={false}
        >
          {FILTERS.map((f) => {
            const active = activeFilter === f.value;
            const count =
              f.value === "All"
                ? (data?.length ?? 0)
                : (data?.filter((d) => d.category === f.value).length ?? 0);
            return (
              <TouchableOpacity
                key={f.value}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setActiveFilter(f.value)}
                activeOpacity={0.7}
              >
                <Text
                  style={[styles.filterText, active && styles.filterTextActive]}
                >
                  {f.label}
                </Text>
                {count > 0 && (
                  <View
                    style={[
                      styles.filterCount,
                      active && styles.filterCountActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterCountText,
                        active && styles.filterCountTextActive,
                      ]}
                    >
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Document list */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.accent}
          />
        }
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {isLoading ? (
          <View style={{ gap: spacing.sm }}>
            <SkeletonCard height={120} />
            <SkeletonCard height={120} />
            <SkeletonCard height={120} />
            <SkeletonCard height={120} />
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <FolderOpen size={36} color={colors.accent} weight="duotone" />
            </View>
            <Text style={styles.emptyTitle}>
              {search ? "No results found." : "Nothing here yet."}
            </Text>
            <Text style={styles.emptySub}>
              {search
                ? "Try a different search term."
                : activeFilter !== "All"
                ? `No ${activeFilter.toLowerCase()} documents yet.`
                : "Scan your first document."}
            </Text>
            {!search && (
              <TouchableOpacity
                style={styles.emptyAction}
                onPress={() => {
                  if (activeFilter !== "All") setActiveFilter("All");
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.emptyActionText}>
                  {activeFilter !== "All" ? "Show all" : ""}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <>
            {filtered.map((doc) => (
              <DocCard
                key={doc.id}
                doc={doc}
                onPress={() =>
                  router.push({
                    pathname: "/document/[id]",
                    params: { id: doc.id },
                  })
                }
              />
            ))}
            <Text style={styles.endLabel}>
              {filtered.length} document{filtered.length !== 1 ? "s" : ""}
            </Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  title: { ...typography.display },
  subtitle: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: 3,
    letterSpacing: 0.3,
  },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginHorizontal: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    padding: 0,
  },
  clearBtn: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },

  filterOuter: {
    marginBottom: spacing.lg,
  },
  filterRow: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.lg,
    paddingVertical: 9,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
  },
  filterChipActive: {
    backgroundColor: colors.accent,
  },
  filterText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.textSecondary,
    letterSpacing: -0.1,
  },
  filterTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  filterCount: {
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.full,
    minWidth: 20,
    alignItems: "center",
  },
  filterCountActive: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  filterCountText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textTertiary,
  },
  filterCountTextActive: {
    color: "#fff",
  },

  list: { flex: 1 },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 48,
    gap: spacing.sm,
  },

  empty: {
    alignItems: "center",
    paddingTop: 72,
    gap: spacing.md,
  },
  emptyIconWrap: {
    width: 76,
    height: 76,
    borderRadius: radius.full,
    backgroundColor: colors.accentDim,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  emptyTitle: { ...typography.h3 },
  emptySub: {
    ...typography.bodySmall,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 220,
  },
  emptyAction: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg },
  emptyActionText: {
    ...typography.bodySmall,
    color: colors.accent,
    fontWeight: "500",
  },

  endLabel: {
    ...typography.caption,
    color: colors.textTertiary,
    textAlign: "center",
    paddingTop: spacing.xl,
    letterSpacing: 0.3,
  },
});
