import { router, useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CategoryDonut, DonutItem } from "../../components/CategoryDonut";
import { MonthSelector } from "../../components/MonthSelector";
import { SwipeableTransaction } from "../../components/SwipeableTransaction";
import { IconName } from "../../components/ui";
import {
  AccountWithBalance,
  CategoryTotal,
  deleteTransaction,
  getAccountsWithBalance,
  getExpensesByCategory,
  getTransactions,
  TransactionRow,
} from "../../db/queries";
import { useTheme } from "../../theme/colors";
import { formatMoney, formatNumber } from "../../utils/format";

const MAX_SLICES = 6;

function buildDonut(rows: CategoryTotal[]): DonutItem[] {
  const total = rows.reduce((s, r) => s + r.total, 0);
  if (total <= 0) return [];

  let list = rows.map((r) => ({
    name: r.name,
    color: r.color,
    icon: r.icon as IconName,
    amount: r.total,
  }));

  if (list.length > MAX_SLICES) {
    const rest = list.slice(MAX_SLICES - 1);
    list = list.slice(0, MAX_SLICES - 1);
    list.push({
      name: "Otras categorías",
      color: "#9CA3AF",
      icon: "ellipsis-horizontal",
      amount: rest.reduce((s, r) => s + r.amount, 0),
    });
  }

  return list.map((i) => ({
    ...i,
    percentage: Math.max(1, Math.round((i.amount / total) * 100)),
  }));
}

export default function Inicio() {
  const db = useSQLiteContext();
  const { colors } = useTheme();

  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [accounts, setAccounts] = useState<AccountWithBalance[]>([]);
  const [catTotals, setCatTotals] = useState<CategoryTotal[]>([]);
  const [recent, setRecent] = useState<TransactionRow[]>([]);
  const [version, setVersion] = useState(0);

  const ym = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}`;

  // Se recarga al volver a la pantalla (por ejemplo, después de guardar un gasto)
  // y cada vez que cambia el mes.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.all([
        getAccountsWithBalance(db),
        getExpensesByCategory(db, ym),
        getTransactions(db, { limit: 5 }),
      ]).then(([a, c, r]) => {
        if (!active) return;
        setAccounts(a);
        setCatTotals(c);
        setRecent(r);
      });
      return () => {
        active = false;
      };
    }, [db, ym, version]),
  );

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const monthlyExpenses = catTotals.reduce((sum, c) => sum + c.total, 0);
  const donutData = useMemo(() => buildDonut(catTotals), [catTotals]);
  const handleDelete = async (tx: TransactionRow) => {
    try {
      await deleteTransaction(db, tx.id);
      setRecent((prev) => prev.filter((t) => t.id !== tx.id));
      setVersion((v) => v + 1);
    } catch {
      Alert.alert("No se pudo eliminar", "Intentá de nuevo.");
    }
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 30 },
        summaryCard: {
          backgroundColor: colors.surface,
          borderRadius: 24,
          padding: 22,
          marginBottom: 32,
        },
        muted: { color: colors.textMuted, fontSize: 16 },
        balance: {
          color: colors.text,
          fontSize: 37,
          fontWeight: "800",
          marginTop: 10,
          marginBottom: 20,
        },
        expenseRow: {
          flexDirection: "row",
          alignItems: "center",
          flexWrap: "wrap",
        },
        expenseAmount: {
          color: colors.expense,
          fontSize: 18,
          fontWeight: "700",
          marginLeft: 5,
        },
        section: { marginBottom: 28 },
        sectionHeader: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 18,
        },
        sectionTitle: { color: colors.text, fontSize: 22, fontWeight: "800" },
        seeAll: {
          color: colors.primaryStrong,
          fontSize: 15,
          fontWeight: "600",
          textDecorationLine: "underline",
        },
        accountsList: { gap: 14, paddingRight: 20 },
        accountCard: {
          width: 235,
          backgroundColor: colors.surface,
          borderRadius: 22,
          padding: 18,
        },
        accountHeader: {
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 12,
        },
        accountDot: { width: 12, height: 12, borderRadius: 6, marginRight: 10 },
        accountName: { color: colors.textMuted, fontSize: 16 },
        accountBalance: { color: colors.text, fontSize: 23, fontWeight: "800" },
        empty: { color: colors.textMuted, fontSize: 15, paddingVertical: 8 },
      }),
    [colors],
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Selector de mes */}
        <View style={{ marginBottom: 22 }}>
          <MonthSelector value={selectedDate} onChange={setSelectedDate} />
        </View>

        {/* Resumen */}
        <View style={styles.summaryCard}>
          <Text style={styles.muted}>Saldo total</Text>
          <Text style={styles.balance}>{formatMoney(totalBalance)}</Text>
          <View style={styles.expenseRow}>
            <Text style={styles.muted}>Gastaste este mes</Text>
            <Text style={styles.expenseAmount}>
              {formatMoney(monthlyExpenses)}
            </Text>
          </View>
        </View>

        {/* Dona por categoría */}
        <View style={styles.section}>
          <CategoryDonut
            data={donutData}
            total={monthlyExpenses}
            formatAmount={formatNumber}
          />
        </View>

        {/* Mis cuentas */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mis cuentas</Text>
            <Pressable onPress={() => router.push("/cuentas")}>
              <Text style={styles.seeAll}>Ver todas</Text>
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.accountsList}
          >
            {accounts.map((account) => (
              <Pressable
                key={account.id}
                style={styles.accountCard}
                accessibilityLabel={`${account.name}, ${formatMoney(account.balance)}. Ver movimientos de la cuenta`}
                onPress={() =>
                  router.push({
                    pathname: "/cuenta/[id]",
                    params: { id: String(account.id) },
                  })
                }
              >
                <View style={styles.accountHeader}>
                  <View
                    style={[
                      styles.accountDot,
                      { backgroundColor: account.color },
                    ]}
                  />
                  <Text style={styles.accountName}>{account.name}</Text>
                </View>
                <Text style={styles.accountBalance}>
                  {formatMoney(account.balance)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Últimos movimientos */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Últimos movimientos</Text>
            <Pressable onPress={() => router.push("/historial")}>
              <Text style={styles.seeAll}>Ver todos</Text>
            </Pressable>
          </View>

          {recent.length === 0 ? (
            <Text style={styles.empty}>
              Todavía no cargaste movimientos. Tocá el + para empezar.
            </Text>
          ) : (
            recent.map((tx) => (
              <SwipeableTransaction
                key={tx.id}
                tx={tx}
                onPress={() =>
                  router.push({
                    pathname: "/nuevo-gasto",
                    params: { id: String(tx.id) },
                  })
                }
                onDelete={handleDelete}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
