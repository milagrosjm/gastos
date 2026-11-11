import { router, useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { Alert, Platform, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ACCOUNT_COLORS,
  ColorPicker,
  Field,
  Label,
  ModalHeader,
  PrimaryButton,
  Segmented,
} from "../components/ui";
import {
  AccountType,
  createAccount,
  getAccount,
  updateAccount,
} from "../db/queries";
import { useTheme } from "../theme/colors";
import { centsToRaw, parseAmount } from "../utils/format";

export default function NuevaCuenta() {
  const db = useSQLiteContext();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const { id } = useLocalSearchParams<{ id?: string }>();
  const editId = id ? Number(id) : null;
  const isEdit = editId !== null;

  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("bank");
  const [balance, setBalance] = useState("");
  const [color, setColor] = useState(ACCOUNT_COLORS[0]);
  const [saving, setSaving] = useState(false);

  // Si es edición, precarga la cuenta
  useEffect(() => {
    if (editId === null) return;
    let active = true;
    getAccount(db, editId).then((a) => {
      if (!active) return;
      if (!a) {
        router.back();
        return;
      }
      setName(a.name);
      setType(a.type);
      setColor(a.color);
      setBalance(a.opening_balance === 0 ? "" : centsToRaw(a.opening_balance));
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
      const data = { name, type, color, openingBalance: parseAmount(balance) };
      if (editId !== null) await updateAccount(db, editId, data);
      else await createAccount(db, data);
      router.back();
    } catch {
      setSaving(false);
      Alert.alert(
        isEdit ? "No se pudo guardar la cuenta" : "No se pudo crear la cuenta",
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
      <ModalHeader title={isEdit ? "Editar cuenta" : "Nueva cuenta"} />
      <Field
        label="Nombre"
        value={name}
        onChangeText={setName}
        placeholder="Ej: Bru"
        autoFocus={!isEdit}
        maxLength={30}
      />
      <View>
        <Label>Tipo</Label>
        <Segmented
          value={type}
          onChange={setType}
          options={[
            { value: "bank", label: "Banco" },
            { value: "cash", label: "Efectivo" },
            { value: "wallet", label: "Billetera" },
          ]}
        />
      </View>
      <View>
        <Field
          label="Saldo inicial"
          value={balance}
          onChangeText={setBalance}
          placeholder="0,00"
          keyboardType="decimal-pad"
        />
        <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 6 }}>
          Lo que tenés hoy en esta cuenta, antes de cargar movimientos. Se carga
          una sola vez.
        </Text>
      </View>
      <View>
        <Label>Color</Label>
        <ColorPicker
          options={ACCOUNT_COLORS}
          value={color}
          onChange={setColor}
        />
      </View>
      <PrimaryButton
        title={isEdit ? "Guardar cambios" : "Crear cuenta"}
        onPress={save}
        disabled={!valid || saving}
      />
    </ScrollView>
  );
}
