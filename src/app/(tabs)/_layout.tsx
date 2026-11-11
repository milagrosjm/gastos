import { Ionicons } from "@expo/vector-icons";
import { router, Tabs } from "expo-router";
import { Pressable, View } from "react-native";
import { useTheme } from "../../theme/colors";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

function Fab() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Pressable
        accessibilityLabel="Nuevo movimiento"
        onPress={() => router.push("/nuevo-gasto")}
        style={{
          width: 52,
          height: 52,
          borderRadius: 26,
          backgroundColor: colors.primaryStrong,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </Pressable>
    </View>
  );
}

const tab = (title: string, icon: IconName) => ({
  title,
  tabBarIcon: ({ color, size }: { color: string; size: number }) => (
    <Ionicons name={icon} size={size} color={color} />
  ),
});

export default function TabsLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primaryStrong,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      <Tabs.Screen name="index" options={tab("Inicio", "home-outline")} />
      <Tabs.Screen name="cuentas" options={tab("Cuentas", "wallet-outline")} />
      <Tabs.Screen
        name="nuevo"
        options={{ title: "", tabBarButton: () => <Fab /> }}
        listeners={{ tabPress: (e) => e.preventDefault() }}
      />
      <Tabs.Screen
        name="historial"
        options={tab("Historial", "list-outline")}
      />
      <Tabs.Screen
        name="ajustes"
        options={tab("Ajustes", "settings-outline")}
      />
    </Tabs>
  );
}
