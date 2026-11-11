import { ReactNode } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme/colors";

export function Screen({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Text
        style={{
          fontSize: 22,
          fontWeight: "600",
          color: colors.text,
          paddingTop: insets.top + 12,
          paddingHorizontal: 20,
          paddingBottom: 12,
        }}
      >
        {title}
      </Text>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingTop: 8, gap: 12 }}
      >
        {children}
      </ScrollView>
    </View>
  );
}
