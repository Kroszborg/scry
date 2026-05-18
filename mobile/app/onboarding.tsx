import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { storageSet } from "../lib/storage";
import { colors, spacing, radius, typography } from "../lib/theme";
import {
  Scan,
  Brain,
  BookOpen,
  Sparkle,
  ArrowRight,
  Check,
} from "phosphor-react-native";

const { width: SW } = Dimensions.get("window");

const slides = [
  {
    icon: Scan,
    iconColor: "#7C5CFC",
    iconBg: "rgba(124,92,252,0.12)",
    tag: "CAPTURE",
    title: "Scan anything,\ninstantly.",
    body: "Point your camera at notes, books, receipts, or IDs. Scry captures and processes it in seconds.",
  },
  {
    icon: Brain,
    iconColor: "#22C55E",
    iconBg: "rgba(34,197,94,0.12)",
    tag: "UNDERSTAND",
    title: "AI reads it\nso you don't have to.",
    body: "Every scan gets a clean summary, key topics, and smart tags — automatically, no setup needed.",
  },
  {
    icon: BookOpen,
    iconColor: "#F59E0B",
    iconBg: "rgba(245,158,11,0.12)",
    tag: "ORGANIZE",
    title: "Your library,\nalways in order.",
    body: "Filter by Notes, Books, Receipts, IDs. Search across all your documents in one place.",
  },
  {
    icon: Sparkle,
    iconColor: "#7C5CFC",
    iconBg: "rgba(124,92,252,0.12)",
    tag: "ASK",
    title: "Ask questions.\nGet real answers.",
    body: "Chat with your documents. Generate flashcards, extract formulas, summarize chapters — all with AI.",
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const goTo = (index: number) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
    setCurrent(index);
    scrollRef.current?.scrollTo({ x: index * SW, animated: true });
  };

  const handleNext = () => {
    if (current < slides.length - 1) {
      goTo(current + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    await storageSet("onboarded", "1");
    router.replace("/(tabs)" as any);
  };

  const slide = slides[current];
  const SlideIcon = slide.icon;
  const isLast = current === slides.length - 1;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Skip */}
      {!isLast && (
        <TouchableOpacity style={styles.skip} onPress={handleFinish} activeOpacity={0.6}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Slide content */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        {slides.map((s, i) => {
          const Icon = s.icon;
          return (
            <View key={i} style={[styles.slide, { width: SW }]}>
              <Animated.View
                style={[
                  styles.slideInner,
                  i === current ? { opacity: fadeAnim } : { opacity: 1 },
                ]}
              >
                {/* Icon */}
                <View style={[styles.iconWrap, { backgroundColor: s.iconBg }]}>
                  <View style={styles.iconRing}>
                    <Icon size={48} color={s.iconColor} weight="duotone" />
                  </View>
                </View>

                {/* Tag */}
                <Text style={styles.tag}>{s.tag}</Text>

                {/* Title */}
                <Text style={styles.title}>{s.title}</Text>

                {/* Body */}
                <Text style={styles.body}>{s.body}</Text>
              </Animated.View>
            </View>
          );
        })}
      </ScrollView>

      {/* Bottom */}
      <View style={styles.bottom}>
        {/* Dots */}
        <View style={styles.dotsRow}>
          {slides.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => goTo(i)} activeOpacity={0.7} hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}>
              <View
                style={[
                  styles.dot,
                  i === current ? styles.dotActive : styles.dotInactive,
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={[styles.cta, isLast && styles.ctaLast]}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaText}>{isLast ? "Get started" : "Continue"}</Text>
          {isLast ? (
            <View style={styles.ctaIconWrap}>
              <Check size={18} color="#fff" weight="bold" />
            </View>
          ) : (
            <View style={styles.ctaIconWrap}>
              <ArrowRight size={18} color="#fff" weight="bold" />
            </View>
          )}
        </TouchableOpacity>

        {/* Already have data hint */}
        {isLast && (
          <Text style={styles.footNote}>No account needed. Your data stays on device.</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  skip: {
    position: "absolute",
    top: 56,
    right: spacing.xl,
    zIndex: 10,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  skipText: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    fontWeight: "500",
  },
  slide: {
    flex: 1,
    paddingHorizontal: spacing.xxxl,
    justifyContent: "center",
    paddingBottom: 60,
  },
  slideInner: {
    alignItems: "flex-start",
  },
  iconWrap: {
    width: 100,
    height: 100,
    borderRadius: radius.xxl,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xxl,
  },
  iconRing: {
    alignItems: "center",
    justifyContent: "center",
  },
  tag: {
    ...typography.label,
    color: colors.accent,
    marginBottom: spacing.md,
    letterSpacing: 1.4,
  },
  title: {
    fontSize: 36,
    fontWeight: "700",
    letterSpacing: -1.2,
    lineHeight: 42,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  body: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
    maxWidth: 300,
  },
  bottom: {
    paddingHorizontal: spacing.xxxl,
    paddingBottom: spacing.xxxl,
    gap: spacing.xl,
  },
  dotsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
  },
  dot: {
    height: 6,
    borderRadius: radius.full,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.accent,
  },
  dotInactive: {
    width: 6,
    backgroundColor: colors.surfaceBorder,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.accent,
    borderRadius: radius.xl,
    paddingVertical: spacing.lg + 2,
    paddingHorizontal: spacing.xl,
  },
  ctaLast: {
    backgroundColor: colors.accent,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    letterSpacing: -0.2,
  },
  ctaIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  footNote: {
    ...typography.caption,
    color: colors.textTertiary,
    textAlign: "center",
  },
});
