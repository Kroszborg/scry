import { Tabs } from "expo-router";
import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius } from "../../lib/theme";
import { House, Scan, FolderOpen, Sparkle } from "phosphor-react-native";

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 52 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 10,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <House size={22} color={color} weight={focused ? "fill" : "regular"} />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: "Scan",
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.scanActive : styles.scanDefault}>
              <Scan size={20} color={focused ? "#fff" : color} weight="regular" />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: "Library",
          tabBarIcon: ({ color, focused }) => (
            <FolderOpen size={22} color={color} weight={focused ? "fill" : "regular"} />
          ),
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: "AI",
          tabBarIcon: ({ color, focused }) => (
            <Sparkle size={22} color={color} weight={focused ? "fill" : "regular"} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabLabel: {
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.1,
    marginTop: 2,
  },
  tabItem: {
    gap: 2,
  },
  scanDefault: {
    width: 42,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  scanActive: {
    width: 42,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
});
