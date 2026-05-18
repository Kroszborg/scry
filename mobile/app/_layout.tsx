import { Slot, useRouter, usePathname } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { View, StyleSheet } from "react-native";
import { colors } from "../lib/theme";
import { useEffect } from "react";
import { storageGet } from "../lib/storage";
import { ErrorBoundary } from "../components/ErrorBoundary";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60, retry: 1 },
  },
});

function OnboardingRedirect() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Don't check if already on onboarding (prevents infinite redirect loop)
    if (pathname === "/onboarding") return;

    storageGet("onboarded").then((val) => {
      if (!val) {
        router.replace("/onboarding" as any);
      }
    }).catch(() => {
      // storage error — skip onboarding
    });
  }, [pathname]);

  return null;
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <View style={styles.root}>
            <StatusBar style="light" backgroundColor={colors.background} />
            <Slot />
            <OnboardingRedirect />
          </View>
        </QueryClientProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
