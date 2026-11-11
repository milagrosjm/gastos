import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Screen } from "../../components/Screen";
import { AccountWithBalance, getAccountsWithBalance } from "../../db/queries";
import { radius, useTheme } from "../../theme/colors";
import { formatMoney } from "../../utils/format";

export default function Cuentas() {
  const db = useSQLiteContext();
  const { colors } = useTheme();
  const [accounts, setAccounts] = useState<AccountWithBalance[]>([]);

  useFocusEffect(
    useCallback(() => {
      getAccountsWithBalance(db).then(setAccounts);
    }, [db]),
  );

  const total = accounts.reduce((sum, a) => sum + a.balance, 0);

  return (
    <Screen title="Cuentas">
      <Text style={{ color: colors.textMuted }}>
        Saldo total{"  "}
        <Text style={{ color: colors.text, fontWeight: "700", fontSize: 18 }}>
          {formatMoney(total)}
        </Text>
      </Text>

      {accounts.map((a) => (
        <View
          key={a.id}
          style={{
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          {/* Tocar la tarjeta: ver los movimientos de la cuenta */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${a.name}, saldo ${formatMoney(a.balance)}. Ver movimientos`}
            onPress={() =>
              router.push({
                pathname: "/cuenta/[id]",
                params: { id: String(a.id) },
              })
            }
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              padding: 16,
            }}
          >
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: a.color,
              }}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={{ color: colors.text, fontWeight: "600", fontSize: 16 }}
              >
                {a.name}
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 13 }}>
                {a.type === "bank"
                  ? "Banco"
                  : a.type === "cash"
                    ? "Efectivo"
                    : "Billetera"}
              </Text>
            </View>
            <Text
              style={{ color: colors.text, fontWeight: "700", fontSize: 18 }}
            >
              {formatMoney(a.balance)}
            </Text>
          </Pressable>

          {/* Tocar el lápiz: editar la cuenta */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Editar cuenta ${a.name}`}
            onPress={() =>
              router.push({
                pathname: "/nueva-cuenta",
                params: { id: String(a.id) },
              })
            }
            style={{
              width: 48,
              height: 48,
              marginRight: 8,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons
              name="create-outline"
              size={22}
              color={colors.textMuted}
            />
          </Pressable>
        </View>
      ))}

      <Pressable
        onPress={() => router.push("/nueva-cuenta")}
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
          + Nueva cuenta
        </Text>
      </Pressable>
    </Screen>
  );
}
