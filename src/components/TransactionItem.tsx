import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { TransactionRow } from "../db/queries";
import { useTheme } from "../theme/colors";
import { formatNumber } from "../utils/format";
import { iconColorFor, IconName } from "./ui";

type Props = {
  tx: TransactionRow;
  viewAccountId?: number | null; // si se está filtrando por una cuenta
  onPress?: () => void;
  onLongPress?: () => void;
};

export function TransactionItem({
  tx,
  viewAccountId,
  onPress,
  onLongPress,
}: Props) {
  const { colors } = useTheme();
  const isTransfer = tx.type === "transfer";

  const bg = isTransfer ? colors.border : (tx.category_color ?? "#9CA3AF");
  const icon = (
    isTransfer ? "swap-horizontal" : (tx.category_icon ?? "help-outline")
  ) as IconName;
  const iconColor = isTransfer ? colors.text : iconColorFor(bg);

  const categoryName = tx.category_name ?? "Sin categoría";
  const title = tx.note || (isTransfer ? "Transferencia" : categoryName);
  const subtitle = isTransfer
    ? `${tx.account_name} → ${tx.to_account_name}`
    : `${categoryName} · ${tx.account_name}`;

  let sign = "";
  let color = colors.text;
  if (tx.type === "expense") {
    sign = "-";
    color = colors.expense;
  } else if (tx.type === "income") {
    sign = "+";
    color = colors.income;
  } else if (viewAccountId) {
    if (tx.to_account_id === viewAccountId) {
      sign = "+";
      color = colors.income;
    } else if (tx.account_id === viewAccountId) {
      sign = "-";
      color = colors.expense;
    }
  }
  const amount = `${sign}$ ${formatNumber(tx.amount)}`;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${subtitle}, ${amount}`}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
      }}
    >
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: 26,
          backgroundColor: bg,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 14,
        }}
      >
        <Ionicons name={icon} size={24} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          numberOfLines={1}
          style={{
            color: colors.text,
            fontSize: 17,
            fontWeight: "700",
            marginBottom: 2,
          }}
        >
          {title}
        </Text>
        <Text
          numberOfLines={1}
          style={{ color: colors.textMuted, fontSize: 14 }}
        >
          {subtitle}
        </Text>
      </View>
      <Text style={{ color, fontSize: 17, fontWeight: "700", marginLeft: 8 }}>
        {amount}
      </Text>
    </Pressable>
  );
}
