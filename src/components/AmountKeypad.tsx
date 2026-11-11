import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { radius, useTheme } from "../theme/colors";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ",", "0", "back"];

export function AmountKeypad({ onKey }: { onKey: (k: string) => void }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {KEYS.map((k) => (
        <Pressable
          key={k}
          accessibilityLabel={k === "back" ? "Borrar" : k === "," ? "Coma" : k}
          onPress={() => onKey(k)}
          style={({ pressed }) => ({
            flexBasis: "30%",
            flexGrow: 1,
            height: 48,
            borderRadius: radius.md,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: pressed ? colors.border : colors.surface,
          })}
        >
          {k === "back" ? (
            <Ionicons name="backspace-outline" size={24} color={colors.text} />
          ) : (
            <Text style={{ fontSize: 22, color: colors.text }}>{k}</Text>
          )}
        </Pressable>
      ))}
    </View>
  );
}
