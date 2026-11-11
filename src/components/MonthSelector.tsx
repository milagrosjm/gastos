import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { radius, useTheme } from "../theme/colors";

const SHORT = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];
const FULL = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

type Props = {
  value: Date; // siempre el día 1 del mes
  onChange: (d: Date) => void;
};

export function MonthSelector({ value, onChange }: Props) {
  const { colors, isDark } = useTheme();
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(value.getFullYear());

  const now = new Date();
  const label = `${FULL[value.getMonth()]} (${value.getFullYear()})`;

  const openPicker = () => {
    setYear(value.getFullYear());
    setOpen(true);
  };
  const pick = (month: number) => {
    onChange(new Date(year, month, 1));
    setOpen(false);
  };
  const goToday = () => {
    onChange(new Date(now.getFullYear(), now.getMonth(), 1));
    setOpen(false);
  };

  const onSelected = isDark ? "#0F1115" : "#FFFFFF";
  const yearArrow = {
    width: 44,
    height: 44,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  };

  return (
    <View style={{ alignItems: "center" }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}. Elegir otro mes o año`}
        onPress={openPicker}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          minHeight: 44,
          paddingHorizontal: 12,
        }}
      >
        <Text style={{ color: colors.text, fontSize: 21, fontWeight: "700" }}>
          {label}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          accessibilityLabel="Cerrar selector"
          onPress={() => setOpen(false)}
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.45)",
            justifyContent: "center",
            padding: 24,
          }}
        >
          {/* Este Pressable interno evita que tocar el panel lo cierre */}
          <Pressable
            onPress={() => {}}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 24,
              padding: 20,
              gap: 16,
            }}
          >
            {/* Año */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Pressable
                accessibilityLabel="Año anterior"
                onPress={() => setYear((y) => y - 1)}
                style={yearArrow}
              >
                <Ionicons name="chevron-back" size={24} color={colors.text} />
              </Pressable>
              <Text
                accessibilityRole="header"
                style={{ color: colors.text, fontSize: 22, fontWeight: "800" }}
              >
                {year}
              </Text>
              <Pressable
                accessibilityLabel="Año siguiente"
                onPress={() => setYear((y) => y + 1)}
                style={yearArrow}
              >
                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color={colors.text}
                />
              </Pressable>
            </View>

            {/* Meses */}
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {SHORT.map((m, i) => {
                const selected =
                  year === value.getFullYear() && i === value.getMonth();
                const isNow =
                  year === now.getFullYear() && i === now.getMonth();
                return (
                  <Pressable
                    key={m}
                    accessibilityRole="button"
                    accessibilityLabel={`${FULL[i]} ${year}`}
                    accessibilityState={{ selected }}
                    onPress={() => pick(i)}
                    style={{
                      flexBasis: "31%",
                      flexGrow: 1,
                      height: 48,
                      borderRadius: radius.md,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: selected
                        ? colors.primaryStrong
                        : colors.background,
                      borderWidth: isNow && !selected ? 1.5 : 0,
                      borderColor: colors.primaryStrong,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: selected || isNow ? "700" : "400",
                        color: selected ? onSelected : colors.text,
                      }}
                    >
                      {m}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={goToday}
              style={{
                height: 44,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  color: colors.primaryStrong,
                  fontSize: 15,
                  fontWeight: "600",
                }}
              >
                Ir al mes actual
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
