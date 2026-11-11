import { Ionicons } from "@expo/vector-icons";
import { useRef } from "react";
import { View } from "react-native";
import { RectButton } from "react-native-gesture-handler";
import ReanimatedSwipeable, {
  SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";
import { TransactionRow } from "../db/queries";
import { useTheme } from "../theme/colors";
import { TransactionItem } from "./TransactionItem";

type Props = {
  tx: TransactionRow;
  viewAccountId?: number | null;
  onPress?: () => void;
  onDelete: (tx: TransactionRow) => void;
};

export function SwipeableTransaction({
  tx,
  viewAccountId,
  onPress,
  onDelete,
}: Props) {
  const { colors } = useTheme();
  const ref = useRef<SwipeableMethods>(null);

  return (
    <ReanimatedSwipeable
      ref={ref}
      friction={2}
      rightThreshold={40}
      overshootRight={false}
      renderRightActions={() => (
        <RectButton
          accessible
          accessibilityRole="button"
          accessibilityLabel="Eliminar movimiento"
          onPress={() => {
            ref.current?.close();
            onDelete(tx);
          }}
          style={{
            width: 60,
            marginLeft: 8,
            marginVertical: 6,
            borderRadius: 14,
            backgroundColor: "#B91C1C",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
        </RectButton>
      )}
    >
      <View style={{ backgroundColor: colors.background }}>
        <TransactionItem
          tx={tx}
          viewAccountId={viewAccountId}
          onPress={onPress}
        />
      </View>
    </ReanimatedSwipeable>
  );
}
