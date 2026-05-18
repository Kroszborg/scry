import React from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { colors, spacing, typography } from "../lib/theme";

interface State { hasError: boolean; error: string; }

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false, error: "" };

  static getDerivedStateFromError(error: any): State {
    return { hasError: true, error: String(error?.stack || error?.message || error) };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>App crashed</Text>
          <ScrollView style={styles.scroll}>
            <Text style={styles.error}>{this.state.error}</Text>
          </ScrollView>
          <TouchableOpacity style={styles.btn} onPress={() => this.setState({ hasError: false, error: "" })}>
            <Text style={styles.btnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.xl, paddingTop: 60 },
  title: { ...typography.h2, color: "#F04545", marginBottom: spacing.lg },
  scroll: { flex: 1, backgroundColor: colors.surface, borderRadius: 8, padding: spacing.md, marginBottom: spacing.lg },
  error: { fontFamily: "monospace", fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
  btn: { backgroundColor: colors.accent, padding: spacing.lg, borderRadius: 10, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
});
