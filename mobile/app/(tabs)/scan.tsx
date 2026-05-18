import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import * as FileSystem from "expo-file-system";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { colors, spacing, radius, typography } from "../../lib/theme";
import type { ScanMode } from "../../lib/store";
import {
  X,
  Scan,
  Sparkle,
  FloppyDisk,
  ArrowCounterClockwise,
  FilePdf,
} from "phosphor-react-native";

const MODES: ScanMode[] = ["Notes", "Book", "Whiteboard", "Receipt", "ID Card"];

type ScanStep = "camera" | "preview";

async function persistImage(uri: string): Promise<string> {
  const fileName = `scry_${Date.now()}.jpg`;
  const dest = `${FileSystem.documentDirectory}${fileName}`;
  await FileSystem.copyAsync({ from: uri, to: dest });
  return dest;
}

export default function ScanScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const queryClient = useQueryClient();
  const cameraRef = useRef<CameraView>(null);
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  const [permission, requestPermission] = useCameraPermissions();
  const [step, setStep] = useState<ScanStep>("camera");
  const [activeMode, setActiveMode] = useState<ScanMode>(
    (params.mode as ScanMode) || "Notes"
  );
  const [aiEnabled, setAiEnabled] = useState(true);
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Animated scan line in camera view
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const createDoc = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      return api.documents.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        base64: false,
      });
      if (photo?.uri) {
        setCapturedUri(photo.uri);
        setStep("preview");
      }
    } catch {
      Alert.alert("Camera error", "Could not capture image.");
    }
  }, []);

  const handleImport = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]) {
      setCapturedUri(result.assets[0].uri);
      setStep("preview");
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!capturedUri) return;
    setIsProcessing(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      // Persist image to permanent storage
      const persistedUri = await persistImage(capturedUri);

      // Read as base64 for server-side Gemini Vision OCR
      let imageBase64: string | undefined;
      if (aiEnabled) {
        try {
          imageBase64 = await FileSystem.readAsStringAsync(persistedUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
        } catch {
          // non-fatal — AI will still process with empty rawText fallback
        }
      }

      const result = await createDoc.mutateAsync({
        title: "Scanned Document",
        category: activeMode === "ID Card" ? "ID" : activeMode,
        rawText: "",
        cleanText: "",
        summary: "",
        tags: "[]",
        imageUris: JSON.stringify([persistedUri]),
        imageBase64: imageBase64 ?? null,
        scanMode: activeMode,
      });
      const docId = (result as any).document?.id;
      if (docId) {
        router.push({
          pathname: "/document/[id]",
          params: { id: docId, autoProcess: aiEnabled ? "1" : "0" },
        });
      }
      setStep("camera");
      setCapturedUri(null);
    } catch {
      Alert.alert("Error", "Could not save document.");
    } finally {
      setIsProcessing(false);
    }
  }, [capturedUri, activeMode, aiEnabled, createDoc]);

  const handleRetake = useCallback(() => {
    setCapturedUri(null);
    setStep("camera");
  }, []);

  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <View style={styles.permView}>
          <View style={styles.permIcon}>
            <Scan size={48} color={colors.accent} weight="duotone" />
          </View>
          <Text style={styles.permTitle}>Camera access needed</Text>
          <Text style={styles.permSub}>
            Scry needs your camera to scan documents.
          </Text>
          <TouchableOpacity
            style={styles.permBtn}
            onPress={requestPermission}
            activeOpacity={0.85}
          >
            <Text style={styles.permBtnText}>Allow Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.importRow}
            onPress={handleImport}
            activeOpacity={0.75}
          >
            <FilePdf size={18} color={colors.textSecondary} weight="duotone" />
            <Text style={styles.importRowText}>Import from photos</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (step === "preview" && capturedUri) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <View style={styles.previewHeader}>
          <TouchableOpacity onPress={handleRetake} style={styles.iconBtn}>
            <ArrowCounterClockwise size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.previewTitle}>Preview</Text>
          <View style={{ width: 44 }} />
        </View>

        <Image
          source={{ uri: capturedUri }}
          style={styles.previewImage}
          resizeMode="contain"
        />

        <View style={styles.previewMeta}>
          <View style={styles.previewMetaPill}>
            <Text style={styles.previewMetaText}>{activeMode}</Text>
          </View>
          {aiEnabled && (
            <View style={[styles.previewMetaPill, styles.previewMetaAI]}>
              <Sparkle size={12} color={colors.accent} weight="fill" />
              <Text style={[styles.previewMetaText, { color: colors.accent }]}>
                AI enabled
              </Text>
            </View>
          )}
        </View>

        <View style={styles.previewActions}>
          <TouchableOpacity
            style={styles.retakeBtn}
            onPress={handleRetake}
            activeOpacity={0.75}
          >
            <ArrowCounterClockwise size={20} color={colors.textSecondary} />
            <Text style={styles.retakeBtnText}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSave}
            disabled={isProcessing}
            activeOpacity={0.85}
          >
            {isProcessing ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <FloppyDisk size={20} color="#fff" weight="fill" />
            )}
            <Text style={styles.saveBtnText}>
              {isProcessing ? "Saving..." : "Save & Process"}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const scanLineTranslateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 200],
  });

  return (
    <View style={styles.cameraOuter}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back">
        <SafeAreaView style={styles.cameraOverlay} edges={["top"]}>
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.iconBtnDark}
              onPress={() => router.push("/(tabs)/index" as any)}
            >
              <X size={22} color="#fff" />
            </TouchableOpacity>

            <Text style={styles.modeTitle}>{activeMode}</Text>

            <TouchableOpacity
              style={[styles.aiToggle, aiEnabled && styles.aiToggleOn]}
              onPress={() => setAiEnabled((v) => !v)}
              activeOpacity={0.8}
            >
              <Sparkle
                size={16}
                color={aiEnabled ? colors.accent : "rgba(255,255,255,0.55)"}
                weight={aiEnabled ? "fill" : "regular"}
              />
              <Text
                style={[styles.aiToggleText, aiEnabled && styles.aiToggleTextOn]}
              >
                AI
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.modesRow}
            bounces={false}
          >
            {MODES.map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[styles.modeChip, activeMode === mode && styles.modeChipOn]}
                onPress={() => setActiveMode(mode)}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.modeChipText,
                    activeMode === mode && styles.modeChipTextOn,
                  ]}
                >
                  {mode}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>

        {/* Scanner frame with animated scan line */}
        <View style={styles.frame} pointerEvents="none">
          <View style={[styles.corner, styles.tl]} />
          <View style={[styles.corner, styles.tr]} />
          <View style={[styles.corner, styles.bl]} />
          <View style={[styles.corner, styles.br]} />
          <Animated.View
            style={[
              styles.scanLine,
              { transform: [{ translateY: scanLineTranslateY }] },
            ]}
          />
        </View>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.importBtn}
            onPress={handleImport}
            activeOpacity={0.8}
          >
            <FilePdf size={22} color="#fff" weight="duotone" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.captureBtn}
            onPress={handleCapture}
            activeOpacity={0.85}
          >
            <View style={styles.captureBtnInner} />
          </TouchableOpacity>

          <View style={{ width: 52 }} />
        </View>
      </CameraView>
    </View>
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

  permView: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xxxl,
    gap: spacing.lg,
  },
  permIcon: {
    width: 96,
    height: 96,
    borderRadius: radius.full,
    backgroundColor: colors.accentDim,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  permTitle: { ...typography.h2, textAlign: "center" },
  permSub: { ...typography.bodySmall, textAlign: "center", lineHeight: 21 },
  permBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.xxxl,
    paddingVertical: spacing.lg,
    borderRadius: radius.xl,
    width: "100%",
    alignItems: "center",
    marginTop: spacing.md,
  },
  permBtnText: { fontSize: 16, fontWeight: "600", color: "#fff" },
  importRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  importRowText: { ...typography.bodySmall, color: colors.textSecondary },

  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  previewTitle: { ...typography.h3 },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  previewImage: {
    flex: 1,
    width: "100%",
    backgroundColor: "#000",
  },
  previewMeta: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  previewMetaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  previewMetaAI: { backgroundColor: colors.accentDim },
  previewMetaText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  previewActions: {
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
    paddingTop: spacing.sm,
  },
  retakeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    paddingVertical: spacing.lg,
    borderRadius: radius.xl,
  },
  retakeBtnText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  saveBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.accent,
    paddingVertical: spacing.lg,
    borderRadius: radius.xl,
  },
  saveBtnText: { fontSize: 16, fontWeight: "600", color: "#fff" },

  cameraOuter: { flex: 1, backgroundColor: "#000" },
  camera: { flex: 1 },
  cameraOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  iconBtnDark: {
    width: 42,
    height: 42,
    borderRadius: radius.full,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  modeTitle: { ...typography.h3, color: "#fff" },
  aiToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.full,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  aiToggleOn: {
    backgroundColor: colors.accentDim,
    borderWidth: 1,
    borderColor: colors.accentDimBorder,
  },
  aiToggleText: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.6)",
  },
  aiToggleTextOn: { color: colors.accent },
  modesRow: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    gap: spacing.sm,
    flexDirection: "row",
  },
  modeChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 9,
    borderRadius: radius.full,
    backgroundColor: "rgba(0,0,0,0.5)",
    marginRight: spacing.xs,
  },
  modeChipOn: { backgroundColor: colors.accent },
  modeChipText: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255,255,255,0.65)",
  },
  modeChipTextOn: { color: "#fff", fontWeight: "600" },

  frame: {
    position: "absolute",
    top: "22%",
    left: spacing.xxxl,
    right: spacing.xxxl,
    height: "52%",
    zIndex: 5,
    overflow: "hidden",
  },
  corner: {
    position: "absolute",
    width: 26,
    height: 26,
    borderColor: colors.accent,
    borderWidth: 2.5,
  },
  tl: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 6 },
  tr: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 6 },
  bl: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 6 },
  br: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 6 },
  scanLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.accent,
    opacity: 0.7,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },

  bottomBar: {
    position: "absolute",
    bottom: 52,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xxxl,
    zIndex: 10,
  },
  captureBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  captureBtnInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#fff",
  },
  importBtn: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
});
