import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ReactNode } from "react";
import { Pressable, Text, TextInput, TextInputProps, View } from "react-native";
import { radius, useTheme } from "../theme/colors";

export type IconName = React.ComponentProps<typeof Ionicons>["name"];

export const ACCOUNT_COLORS = [
  "#7C3AED",
  "#DC2626",
  "#0E9F6E",
  "#3B82F6",
  "#F59E0B",
  "#EC4899",
  "#14B8A6",
  "#6B7280",
];
export const CATEGORY_COLORS = [
  "#F97316",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
  "#EAB308",
  "#6366F1",
  "#9CA3AF",
  "#0E9F6E",
];

export const CATEGORY_ICONS: IconName[] = [
  "fast-food-outline",
  "bus-outline",
  "home-outline",
  "medkit-outline",
  "game-controller-outline",
  "bag-outline",
  "flash-outline",
  "school-outline",
  "paw-outline",
  "gift-outline",
  "airplane-outline",
  "car-outline",
  "cafe-outline",
  "fitness-outline",
  "wallet-outline",
  "pricetag-outline",
  "ellipsis-horizontal",
  "cash-outline",
];

// Icono oscuro sobre colores claros, blanco sobre colores oscuros
export function iconColorFor(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255,
    g = (n >> 8) & 255,
    b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b > 160 ? "#111827" : "#FFFFFF";
}

export function Label({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <Text style={{ color: colors.textMuted, fontSize: 13, marginBottom: 6 }}>
      {children}
    </Text>
  );
}

export function ModalHeader({ title }: { title: string }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Pressable
        accessibilityLabel="Cerrar"
        onPress={() => router.back()}
        style={{
          width: 44,
          height: 44,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="close" size={26} color={colors.text} />
      </Pressable>
      <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700" }}>
        {title}
      </Text>
      <View style={{ width: 44 }} />
    </View>
  );
}

export function Chip({
  label,
  color,
  selected,
  dashed,
  onPress,
}: {
  label: string;
  color?: string;
  selected?: boolean;
  dashed?: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      style={{
        height: 40,
        paddingHorizontal: 14,
        borderRadius: 20,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        borderWidth: selected ? 2 : 1,
        borderStyle: dashed ? "dashed" : "solid",
        borderColor: selected
          ? colors.primaryStrong
          : dashed
            ? colors.textMuted
            : colors.border,
        backgroundColor: selected
          ? colors.primaryStrong + "22"
          : dashed
            ? "transparent"
            : colors.surface,
      }}
    >
      {color ? (
        <View
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: color,
          }}
        />
      ) : null}
      <Text
        style={{
          fontSize: 14,
          color: dashed ? colors.primaryStrong : colors.text,
          fontWeight: selected || dashed ? "600" : "400",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: colors.border,
        borderRadius: radius.md,
        padding: 4,
      }}
    >
      {options.map((o) => {
        const sel = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: sel }}
            style={{
              flex: 1,
              height: 40,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 9,
              backgroundColor: sel ? colors.surface : "transparent",
            }}
          >
            <Text
              style={{ color: colors.text, fontWeight: sel ? "600" : "400" }}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function PrimaryButton({
  title,
  onPress,
  disabled,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const { colors, isDark } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      style={{
        height: 52,
        borderRadius: radius.md,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: disabled ? colors.border : colors.primaryStrong,
      }}
    >
      <Text
        style={{
          fontSize: 17,
          fontWeight: "600",
          color: disabled ? colors.textMuted : isDark ? "#0F1115" : "#FFFFFF",
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}

export function Field({
  label,
  style,
  ...props
}: { label: string } & TextInputProps) {
  const { colors } = useTheme();
  return (
    <View>
      <Label>{label}</Label>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.textMuted}
        style={[
          {
            height: 48,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            paddingHorizontal: 14,
            fontSize: 16,
            color: colors.text,
          },
          style,
        ]}
        {...props}
      />
    </View>
  );
}

export function ColorPicker({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (c: string) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
      {options.map((c, i) => (
        <Pressable
          key={c}
          accessibilityLabel={`Color ${i + 1}`}
          accessibilityState={{ selected: c === value }}
          onPress={() => onChange(c)}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: c,
            borderWidth: c === value ? 3 : 0,
            borderColor: colors.text,
          }}
        />
      ))}
    </View>
  );
}

export function IconPicker({
  value,
  color,
  onChange,
}: {
  value: string;
  color: string;
  onChange: (i: IconName) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
      {CATEGORY_ICONS.map((i) => {
        const sel = i === value;
        return (
          <Pressable
            key={i}
            accessibilityLabel={i.replace("-outline", "")}
            accessibilityState={{ selected: sel }}
            onPress={() => onChange(i)}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: sel ? color : colors.surface,
              borderWidth: 1,
              borderColor: sel ? color : colors.border,
            }}
          >
            <Ionicons
              name={i}
              size={22}
              color={sel ? iconColorFor(color) : colors.text}
            />
          </Pressable>
        );
      })}
    </View>
  );
}
