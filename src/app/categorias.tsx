import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { iconColorFor, IconName } from "../components/ui";
import { Category, getCategories } from "../db/queries";
import { radius, useTheme } from "../theme/colors";

export default function Categorias() {
  const db = useSQLiteContext();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [cats, setCats] = useState<Category[]>([]);

  useFocusEffect(
    useCallback(() => {
      getCategories(db).then(setCats);
    }, [db]),
  );

  const group = (title: string, list: Category[]) => (
    <View style={{ gap: 8 }}>
      <Text
        style={{ color: colors.textMuted, fontSize: 13, fontWeight: "600" }}
      >
        {title}
      </Text>
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          paddingHorizontal: 16,
        }}
      >
        {list.map((c, i) => (
          <Pressable
            key={c.id}
            accessibilityRole="button"
            accessibilityLabel={`Editar categoría ${c.name}`}
            onPress={() =>
              router.push({
                pathname: "/nueva-categoria",
                params: { id: String(c.id) },
              })
            }
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              height: 56,
              borderTopWidth: i ? 1 : 0,
              borderTopColor: colors.border,
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: c.color,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons
                name={c.icon as IconName}
                size={18}
                color={iconColorFor(c.color)}
              />
            </View>
            <Text style={{ flex: 1, color: colors.text, fontSize: 16 }}>
              {c.name}
            </Text>
            <Ionicons
              name="create-outline"
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: insets.top,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 8,
          paddingVertical: 8,
        }}
      >
        <Pressable
          accessibilityLabel="Volver"
          onPress={() => router.back()}
          style={{
            width: 44,
            height: 44,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
        <Text style={{ color: colors.text, fontSize: 22, fontWeight: "600" }}>
          Categorías
        </Text>
      </View>
      <ScrollView
        contentContainerStyle={{
          padding: 20,
          paddingTop: 8,
          paddingBottom: insets.bottom + 20,
          gap: 18,
        }}
      >
        {group(
          "Gastos",
          cats.filter((c) => c.kind === "expense"),
        )}
        {group(
          "Ingresos",
          cats.filter((c) => c.kind === "income"),
        )}
        <Pressable
          onPress={() => router.push("/nueva-categoria")}
          accessibilityRole="button"
          style={{
            height: 52,
            borderRadius: radius.md,
            borderWidth: 1,
            borderStyle: "dashed",
            borderColor: colors.textMuted,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: colors.primaryStrong, fontWeight: "600" }}>
            + Nueva categoría
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
