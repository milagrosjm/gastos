import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { Alert, Platform, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  ColorPicker,
  Field,
  iconColorFor,
  IconName,
  IconPicker,
  Label,
  ModalHeader,
  PrimaryButton,
  Segmented,
} from "../components/ui";
import { createCategory, getCategory, updateCategory } from "../db/queries";
import { useTheme } from "../theme/colors";

export default function NuevaCategoria() {
  const db = useSQLiteContext();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ kind?: string; id?: string }>();

  const editId = params.id ? Number(params.id) : null;
  const isEdit = editId !== null;

  const [kind, setKind] = useState<"expense" | "income">(
    params.kind === "income" ? "income" : "expense",
  );
  const [name, setName] = useState("");
  const [color, setColor] = useState(CATEGORY_COLORS[0]);
  const [icon, setIcon] = useState<IconName>(CATEGORY_ICONS[0]);
  const [saving, setSaving] = useState(false);

  // Si es edición, precarga la categoría
  useEffect(() => {
    if (editId === null) return;
    let active = true;
    getCategory(db, editId).then((c) => {
      if (!active) return;
      if (!c) {
        router.back();
        return;
      }
      setName(c.name);
      setColor(c.color);
      setIcon(c.icon as IconName);
      setKind(c.kind);
    });
    return () => {
      active = false;
    };
  }, [db, editId]);

  const valid = name.trim().length > 0;

  const save = async () => {
    if (!valid || saving) return;
    setSaving(true);
    try {
      if (editId !== null)
        await updateCategory(db, editId, { name, color, icon });
      else await createCategory(db, { name, color, kind, icon });
      router.back();
    } catch {
      setSaving(false);
      Alert.alert(
        isEdit
          ? "No se pudo guardar la categoría"
          : "No se pudo crear la categoría",
        "Intentá de nuevo.",
      );
    }
  };

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        padding: 20,
        paddingTop: (Platform.OS === "ios" ? 8 : insets.top) + 8,
        paddingBottom: insets.bottom + 20,
        gap: 18,
      }}
    >
      <ModalHeader title={isEdit ? "Editar categoría" : "Nueva categoría"} />
      <Field
        label="Nombre"
        value={name}
        onChangeText={setName}
        placeholder="Ej: Salidas"
        autoFocus={!isEdit}
        maxLength={30}
      />
      {!isEdit && (
        <View>
          <Label>Tipo</Label>
          <Segmented
            value={kind}
            onChange={setKind}
            options={[
              { value: "expense", label: "Gasto" },
              { value: "income", label: "Ingreso" },
            ]}
          />
        </View>
      )}
      <View>
        <Label>Color</Label>
        <ColorPicker
          options={CATEGORY_COLORS}
          value={color}
          onChange={setColor}
        />
      </View>
      <View>
        <Label>Icono</Label>
        <IconPicker value={icon} color={color} onChange={setIcon} />
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: color,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name={icon} size={22} color={iconColorFor(color)} />
        </View>
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: "600" }}>
          {name.trim() || "Vista previa"}
        </Text>
      </View>
      <PrimaryButton
        title={isEdit ? "Guardar cambios" : "Crear categoría"}
        onPress={save}
        disabled={!valid || saving}
      />
    </ScrollView>
  );
}
