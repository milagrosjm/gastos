import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useTheme } from "../theme/colors";

export type DonutItem = {
  name: string;
  percentage: number;
  amount: number;
  color: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
};

const SIZE = 240;
const C = SIZE / 2;
const R_OUT = 100;
const R_IN = 58;
const GAP = 2; // grados entre secciones
const BUBBLE_W = 150;
const BUBBLE_H = 48;

// 0° = arriba, sentido horario
const polar = (r: number, deg: number) => {
  const rad = (deg * Math.PI) / 180;
  return { x: C + r * Math.sin(rad), y: C - r * Math.cos(rad) };
};

const ringPath = (a0: number, a1: number, rOut: number, rIn: number) => {
  const sweep = Math.min(a1 - a0, 359.99);
  const end = a0 + sweep;
  const p1 = polar(rOut, a0);
  const p2 = polar(rOut, end);
  const p3 = polar(rIn, end);
  const p4 = polar(rIn, a0);
  const large = sweep > 180 ? 1 : 0;
  return `M ${p1.x} ${p1.y} A ${rOut} ${rOut} 0 ${large} 1 ${p2.x} ${p2.y} L ${p3.x} ${p3.y} A ${rIn} ${rIn} 0 ${large} 0 ${p4.x} ${p4.y} Z`;
};

// Icono oscuro sobre colores claros, blanco sobre colores oscuros
const iconColorFor = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b > 160 ? "#111827" : "#FFFFFF";
};

type Props = {
  data: DonutItem[];
  total: number;
  formatAmount: (n: number) => string;
};

export function CategoryDonut({ data, total, formatAmount }: Props) {
  const { colors } = useTheme();
  const [selected, setSelected] = useState<string | null>(null);

  if (data.length === 0 || total <= 0) {
    return (
      <Text
        style={{
          color: colors.textMuted,
          textAlign: "center",
          paddingVertical: 24,
        }}
      >
        Sin gastos este mes
      </Text>
    );
  }

  const toggle = (name: string) =>
    setSelected((current) => (current === name ? null : name));

  const sumPct = data.reduce((s, d) => s + d.percentage, 0) || 1;
  const gap = data.length > 1 ? GAP / 2 : 0;
  let start = 0;
  const slices = data.map((d) => {
    const span = (d.percentage / sumPct) * 360;
    const slice = {
      ...d,
      a0: start + gap,
      a1: start + span - gap,
      mid: start + span / 2,
    };
    start += span;
    return slice;
  });

  const active = slices.find((s) => s.name === selected);

  // Posición del globito: debajo del icono si está arriba, encima si está abajo
  let bubble: { left: number; top: number } | null = null;
  if (active) {
    const p = polar((R_OUT + R_IN) / 2 + 4, active.mid);
    bubble = {
      left: Math.min(Math.max(p.x - BUBBLE_W / 2, 0), SIZE - BUBBLE_W),
      top: p.y < C ? p.y + 22 : p.y - 22 - BUBBLE_H,
    };
  }

  return (
    <View style={styles.chart}>
      <Svg width={SIZE} height={SIZE}>
        {slices.map((s) => (
          <Path
            key={s.name}
            d={ringPath(
              s.a0,
              s.a1,
              s.name === selected ? R_OUT + 8 : R_OUT,
              R_IN,
            )}
            fill={s.color}
            onPress={() => toggle(s.name)}
          />
        ))}
      </Svg>

      {/* Texto del centro */}
      <View style={styles.center} pointerEvents="none">
        <Text style={{ color: colors.textMuted, fontSize: 12 }}>Gastos</Text>
        <Text style={{ color: colors.text, fontSize: 15, fontWeight: "800" }}>
          $ {formatAmount(total)}
        </Text>
      </View>

      {/* Iconos dentro de cada sección */}
      {slices.map((s) => {
        const p = polar(
          (R_OUT + R_IN) / 2 + (s.name === selected ? 4 : 0),
          s.mid,
        );
        return (
          <Pressable
            key={s.name}
            accessibilityRole="button"
            accessibilityLabel={`${s.name}, ${s.percentage}%`}
            onPress={() => toggle(s.name)}
            style={[styles.icon, { left: p.x - 18, top: p.y - 18 }]}
          >
            <Ionicons name={s.icon} size={20} color={iconColorFor(s.color)} />
          </Pressable>
        );
      })}

      {/* Tooltip */}
      {active && bubble && (
        <View
          pointerEvents="none"
          style={[
            styles.bubble,
            {
              left: bubble.left,
              top: bubble.top,
              backgroundColor: colors.text,
            },
          ]}
        >
          <Text
            style={{
              color: colors.background,
              fontWeight: "800",
              fontSize: 14,
            }}
          >
            {active.name}
          </Text>
          <Text style={{ color: colors.background, fontSize: 12 }}>
            {active.percentage}% · $ {formatAmount(active.amount)}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  chart: { width: SIZE, height: SIZE, alignSelf: "center" },
  center: {
    position: "absolute",
    left: C - R_IN,
    top: C - R_IN,
    width: R_IN * 2,
    height: R_IN * 2,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    position: "absolute",
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  bubble: {
    position: "absolute",
    width: BUBBLE_W,
    height: BUBBLE_H,
    borderRadius: 12,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
});
