import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useMemo, useState } from "react";
import { Alert, Pressable, SectionList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MonthSelector } from "../../components/MonthSelector";
import { SwipeableTransaction } from "../../components/SwipeableTransaction";
import {
  AccountWithBalance,
  deleteTransaction,
  getAccountsWithBalance,
  getTransactions,
  TransactionRow,
} from "../../db/queries";
import { useTheme } from "../../theme/colors";
import { computeMonth } from "../../utils/accountMonth";
import { formatMoney } from "../../utils/format";
import { groupByDay } from "../../utils/groupByDay";

const TYPE_LABEL = {
  bank: "Banco",
  cash: "Efectivo",
  wallet: "Billetera",
} as const;

export default function CuentaDetalle() {
  const db = useSQLiteContext();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const accountId = Number(id);

  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [account, setAccount] = useState<AccountWithBalance | null>(null);
  const [allTxs, setAllTxs] = useState<TransactionRow[]>([]);
  const [version, setVersion] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.all([
        getAccountsWithBalance(db),
        getTransactions(db, { accountId }),
      ]).then(([accs, list]) => {
        if (!active) return;
        setAccount(accs.find((a) => a.id === accountId) ?? null);
        setAllTxs(list);
      });
      return () => {
        active = false;
      };
    }, [db, accountId, version]),
  );

  const ym = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}`;

  const month = useMemo(
    () =>
      account
        ? computeMonth(account.opening_balance, accountId, allTxs, ym)
        : null,
    [account, accountId, allTxs, ym],
  );
  const sections = useMemo(() => groupByDay(month?.list ?? []), [month]);

  const handleDelete = async (tx: TransactionRow) => {
    try {
      await deleteTransaction(db, tx.id);
      setAllTxs((prev) => prev.filter((t) => t.id !== tx.id));
      setVersion((v) => v + 1);
    } catch {
      Alert.alert("No se pudo eliminar", "Intentá de nuevo.");
    }
  };

  const line = (label: string, value: number, signed = false, bold = false) => (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 5,
      }}
    >
      <Text
        style={{
          color: bold ? colors.text : colors.textMuted,
          fontSize: 15,
          fontWeight: bold ? "700" : "400",
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          color: signed
            ? value < 0
              ? colors.expense
              : value > 0
                ? colors.income
                : colors.text
            : colors.text,
          fontSize: 15,
          fontWeight: bold ? "800" : "600",
        }}
      >
        {signed && value > 0 ? "+" : ""}
        {formatMoney(value)}
      </Text>
    </View>
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top"]}
    >
      {/* Encabezado */}
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
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          {account && (
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: account.color,
              }}
            />
          )}
          <Text
            numberOfLines={1}
            style={{
              flexShrink: 1,
              color: colors.text,
              fontSize: 22,
              fontWeight: "600",
            }}
          >
            {account?.name ?? ""}
          </Text>
          {account && (
            <Text style={{ color: colors.textMuted, fontSize: 13 }}></Text>
          )}
        </View>
        <Pressable
          accessibilityLabel="Editar cuenta"
          onPress={() =>
            router.push({
              pathname: "/nueva-cuenta",
              params: { id: String(accountId) },
            })
          }
          style={{
            width: 44,
            height: 44,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="create-outline" size={24} color={colors.text} />
        </Pressable>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(tx) => String(tx.id)}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        ListHeaderComponent={
          month ? (
            <View>
              <View style={{ marginBottom: 12 }}>
                <MonthSelector
                  value={selectedDate}
                  onChange={setSelectedDate}
                />
              </View>

              {/* Resumen del mes */}
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 24,
                  padding: 20,
                }}
              >
                {line("Saldo al inicio del mes", month.opening)}
                {line("Ingresos", month.income, true)}
                {line("Gastos", -month.expense, true)}
                {line("Transferencias", month.transfers, true)}
                <View
                  style={{
                    height: 1,
                    backgroundColor: colors.border,
                    marginVertical: 8,
                  }}
                />
                {line("Saldo al cierre", month.closing, false, true)}
              </View>

              {month.list.length > 0 && (
                <Text
                  style={{
                    color: colors.textMuted,
                    fontSize: 12,
                    marginTop: 12,
                  }}
                >
                  Tocá un movimiento para editarlo. Deslizalo hacia la izquierda
                  para eliminarlo.
                </Text>
              )}
            </View>
          ) : null
        }
        renderSectionHeader={({ section }) => (
          <Text
            style={{
              color: colors.textMuted,
              fontSize: 13,
              fontWeight: "600",
              marginTop: 14,
              marginBottom: 2,
            }}
          >
            {section.title}
          </Text>
        )}
        renderItem={({ item }) => (
          <SwipeableTransaction
            tx={item}
            viewAccountId={accountId}
            onPress={() =>
              router.push({
                pathname: "/nuevo-gasto",
                params: { id: String(item.id) },
              })
            }
            onDelete={handleDelete}
          />
        )}
        ListEmptyComponent={
          month ? (
            <Text
              style={{
                color: colors.textMuted,
                fontSize: 15,
                paddingVertical: 24,
                textAlign: "center",
              }}
            >
              Sin movimientos en este mes.
            </Text>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
