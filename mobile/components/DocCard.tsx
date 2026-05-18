import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import { colors, spacing, radius, typography } from "../lib/theme";
import type { Document } from "../lib/store";
import {
  FileText,
  Receipt,
  BookOpen,
  IdentificationCard,
  Chalkboard,
  Sparkle,
} from "phosphor-react-native";

type IconProps = { size: number; color: string; weight: "duotone" };

function getCategoryIcon(category: string, size = 16) {
  const color = getCategoryColor(category);
  const props: IconProps = { size, color, weight: "duotone" };
  switch (category) {
    case "Notes":
      return <FileText {...props} />;
    case "Book":
      return <BookOpen {...props} />;
    case "Receipt":
      return <Receipt {...props} />;
    case "ID":
      return <IdentificationCard {...props} />;
    case "Whiteboard":
      return <Chalkboard {...props} />;
    default:
      return <FileText {...props} />;
  }
}

function getCategoryColor(category: string): string {
  switch (category) {
    case "Notes": return colors.accent;
    case "Book": return "#22C55E";
    case "Receipt": return "#F59E0B";
    case "ID": return "#3B82F6";
    case "Whiteboard": return "#EC4899";
    default: return colors.accent;
  }
}

function getCategoryBg(category: string): string {
  switch (category) {
    case "Notes": return colors.accentDim;
    case "Book": return "rgba(34,197,94,0.12)";
    case "Receipt": return "rgba(245,158,11,0.12)";
    case "ID": return "rgba(59,130,246,0.12)";
    case "Whiteboard": return "rgba(236,72,153,0.12)";
    default: return colors.accentDim;
  }
}

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface DocCardProps {
  doc: Document;
  onPress: () => void;
  compact?: boolean;
}

export function DocCard({ doc, onPress, compact }: DocCardProps) {
  const tags: string[] =
    typeof doc.tags === "string" ? JSON.parse(doc.tags) : doc.tags ?? [];
  const imageUris: string[] =
    typeof doc.imageUris === "string"
      ? JSON.parse(doc.imageUris)
      : doc.imageUris ?? [];

  const catColor = getCategoryColor(doc.category);
  const catBg = getCategoryBg(doc.category);

  if (compact) {
    return (
      <TouchableOpacity
        style={styles.compactCard}
        onPress={onPress}
        activeOpacity={0.72}
      >
        {/* Thumbnail */}
        <View style={styles.compactThumb}>
          {imageUris[0] ? (
            <Image
              source={{ uri: imageUris[0] }}
              style={styles.thumbImg}
            />
          ) : (
            <View style={[styles.thumbPlaceholder, { backgroundColor: catBg }]}>
              {getCategoryIcon(doc.category, 20)}
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.compactInfo}>
          <Text style={styles.compactTitle} numberOfLines={1}>
            {doc.title}
          </Text>
          <View style={styles.metaRow}>
            <View style={[styles.catDot, { backgroundColor: catColor }]} />
            <Text style={styles.metaText}>
              {doc.category} · {timeAgo(doc.updatedAt)}
            </Text>
          </View>
          {doc.summary ? (
            <Text style={styles.summaryPreview} numberOfLines={1}>
              {doc.summary}
            </Text>
          ) : null}
        </View>

        {/* Chevron */}
        <View style={styles.chevron} />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.72}
    >
      <View style={styles.cardRow}>
        {/* Thumbnail */}
        <View style={styles.thumb}>
          {imageUris[0] ? (
            <Image source={{ uri: imageUris[0] }} style={styles.thumbImgLarge} />
          ) : (
            <View style={[styles.thumbPlaceholderLarge, { backgroundColor: catBg }]}>
              {getCategoryIcon(doc.category, 26)}
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.cardContent}>
          {/* Category badge */}
          <View style={[styles.catBadge, { backgroundColor: catBg }]}>
            {getCategoryIcon(doc.category, 11)}
            <Text style={[styles.catBadgeText, { color: catColor }]}>
              {doc.category}
            </Text>
          </View>

          <Text style={styles.cardTitle} numberOfLines={2}>
            {doc.title}
          </Text>

          {doc.summary ? (
            <Text style={styles.cardSummary} numberOfLines={2}>
              {doc.summary}
            </Text>
          ) : null}

          <View style={styles.cardFooter}>
            {doc.summary && (
              <View style={styles.aiPill}>
                <Sparkle size={10} color={colors.accent} weight="fill" />
                <Text style={styles.aiPillText}>AI processed</Text>
              </View>
            )}
            <Text style={styles.dateText}>{timeAgo(doc.updatedAt)}</Text>
          </View>

          {tags.length > 0 && (
            <View style={styles.tagsRow}>
              {tags.slice(0, 3).map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Full card
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  cardRow: {
    flexDirection: "row",
    padding: spacing.lg,
    gap: spacing.md,
  },
  thumb: {
    width: 68,
    height: 84,
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  thumbImgLarge: { width: "100%", height: "100%", resizeMode: "cover" },
  thumbPlaceholderLarge: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: { flex: 1, gap: 5 },
  catBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    marginBottom: 2,
  },
  catBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  cardTitle: {
    ...typography.h4,
    lineHeight: 20,
  },
  cardSummary: {
    ...typography.bodySmall,
    lineHeight: 17,
    color: colors.textTertiary,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  aiPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  aiPillText: {
    fontSize: 10,
    color: colors.accent,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  dateText: { ...typography.caption, color: colors.textTertiary },
  tagsRow: {
    flexDirection: "row",
    gap: spacing.xs,
    flexWrap: "wrap",
    marginTop: 4,
  },
  tag: {
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  tagText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: "500",
  },

  // Compact card
  compactCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  compactThumb: {
    width: 48,
    height: 56,
    borderRadius: radius.sm,
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  thumbImg: { width: "100%", height: "100%", resizeMode: "cover" },
  thumbPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  compactInfo: { flex: 1, gap: 3 },
  compactTitle: {
    ...typography.h4,
    lineHeight: 19,
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  catDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  metaText: { ...typography.caption },
  summaryPreview: { ...typography.caption, color: colors.textTertiary, lineHeight: 15 },
  chevron: {
    width: 7,
    height: 7,
    borderTopWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: colors.textTertiary,
    transform: [{ rotate: "45deg" }],
  },
});
