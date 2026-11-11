import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";

import { router, useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { Screen } from "../../components/Screen";
import { IconName } from "../../components/ui";
import {
  BackupError,
  exportBackup,
  parseBackup,
  restoreBackup,
} from "../../db/backup";
import { getSetting } from "../../db/queries";
import { radius, useTheme } from "../../theme/colors";

function Row({
  icon,
  label,
  subtitle,
  onPress,
  disabled,
  first,
}: {
  icon: IconName;
  label: string;
  subtitle?: string;
  onPress: () => void;
  disabled?: boolean;
  first?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      style={{
        minHeight: 60,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 10,
        borderTopWidth: first ? 0 : 1,
        borderTopColor: colors.border,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Ionicons name={icon} size={22} color={colors.text} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.text, fontSize: 16 }}>{label}</Text>
        {subtitle ? (
          <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 2 }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </Pressable>
  );
}

function daysSince(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

function lastBackupText(iso: string | null) {
  if (!iso) return "Todavía no hiciste ningún backup.";
  const d = daysSince(iso);
  const when = d <= 0 ? "hoy" : d === 1 ? "ayer" : `hace ${d} días`;
  return `Último backup: ${new Date(iso).toLocaleDateString("es-AR")} (${when})`;
}

export default function Ajustes() {
  const db = useSQLiteContext();
  const { colors } = useTheme();
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [busy, setBusy] = useState<"export" | "restore" | null>(null);

  const loadLast = useCallback(
    () => getSetting(db, "last_backup").then(setLastBackup),
    [db],
  );
  useFocusEffect(
    useCallback(() => {
      loadLast();
    }, [loadLast]),
  );

  const stale = !lastBackup || daysSince(lastBackup) >= 14;

  const doExport = async () => {
    setBusy("export");
    try {
      await exportBackup(db);
      await loadLast();
    } catch (e) {
      Alert.alert(
        "No se pudo crear el backup",
        e instanceof BackupError ? e.message : "Intentá de nuevo.",
      );
    } finally {
      setBusy(null);
    }
  };

  const doRestore = async () => {
    const res = await DocumentPicker.getDocumentAsync({
      type: "*/*",
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (res.canceled || !res.assets?.length) return;

    setBusy("restore");
    let data;
    try {
      const response = await fetch(res.assets[0].uri);
      if (!response.ok)
        throw new Error(`No se pudo abrir el archivo (${response.status})`);
      const text = (await response.text()).replace(/^\uFEFF/, "");
      data = parseBackup(text);
    } catch (e) {
      console.error("Error leyendo backup", e);
      setBusy(null);
      Alert.alert(
        "No se pudo leer el backup",
        e instanceof BackupError
          ? e.message
          : __DEV__
            ? `Detalle técnico: ${String(e)}`
            : "Elegí un archivo .json generado por la app.",
      );
      return;
    }
    setBusy(null);

    const date = data.exportedAt
      ? new Date(data.exportedAt).toLocaleDateString("es-AR")
      : "fecha desconocida";
    Alert.alert(
      "Restaurar backup",
      `Backup del ${date}: ${data.accounts.length} cuentas, ${data.transactions.length} movimientos y ${data.categories.length} categorías.\n\nSe van a reemplazar TODOS los datos que tenés ahora. Esta acción no se puede deshacer.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Restaurar",
          style: "destructive",
          onPress: async () => {
            setBusy("restore");
            try {
              await restoreBackup(db, data);
              Alert.alert(
                "Backup restaurado",
                "Tus datos se cargaron correctamente.",
              );
            } catch (e) {
              console.error("Error restaurando backup", e);
              Alert.alert(
                "No se pudo restaurar",
                __DEV__
                  ? `No se modificó ningún dato.\n\nDetalle técnico: ${String(e)}`
                  : "No se modificó ningún dato. Intentá de nuevo.",
              );
            } finally {
              setBusy(null);
            }
          },
        },
      ],
    );
  };

  const card = {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
  };
  const groupTitle = {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "600" as const,
    marginBottom: 8,
  };

  return (
    <Screen title="Ajustes">
      <View>
        <Text style={groupTitle}>Organización</Text>
        <View style={card}>
          <Row
            first
            icon="pricetags-outline"
            label="Categorías"
            onPress={() => router.push("/categorias")}
          />
        </View>
      </View>

      <View>
        <Text style={groupTitle}>Datos</Text>
        <View style={card}>
          <Row
            first
            icon="cloud-upload-outline"
            label="Hacer backup"
            subtitle={
              busy === "export"
                ? "Preparando…"
                : "Guarda todos tus datos en un archivo"
            }
            onPress={doExport}
            disabled={busy !== null}
          />
          <Row
            icon="cloud-download-outline"
            label="Restaurar backup"
            subtitle={
              busy === "restore"
                ? "Trabajando…"
                : "Reemplaza los datos actuales por los de un archivo"
            }
            onPress={doRestore}
            disabled={busy !== null}
          />
        </View>

        <View
          style={{
            flexDirection: "row",
            gap: 8,
            marginTop: 10,
            paddingHorizontal: 4,
          }}
        >
          {stale && (
            <Ionicons name="warning-outline" size={18} color={colors.warning} />
          )}
          <Text
            style={{
              flex: 1,
              color: stale ? colors.text : colors.textMuted,
              fontSize: 13,
            }}
          >
            {lastBackupText(lastBackup)}
          </Text>
        </View>
        <Text
          style={{
            color: colors.textMuted,
            fontSize: 12,
            marginTop: 6,
            paddingHorizontal: 4,
          }}
        >
          Guardá el archivo en Google Drive o enviátelo por mail. Si lo dejás
          solo en el celular, se pierde junto con él.
        </Text>
      </View>
    </Screen>
  );
}
