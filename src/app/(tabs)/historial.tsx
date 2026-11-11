import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  SectionList,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SwipeableTransaction } from "../../components/SwipeableTransaction";
import { Chip } from "../../components/ui";
import {
  AccountWithBalance,
  deleteTransaction,
  getAccountsWithBalance,
  getTransactions,
  TransactionRow,
} from "../../db/queries";
import { radius, useTheme } from "../../theme/colors";
import { groupByDay } from "../../utils/groupByDay";

export default function Historial() {
  const db = useSQLiteContext();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ account?: string; t?: string }>();

  const [accounts, setAccounts] = useState<AccountWithBalance[]>([]);
  const [accountId, setAccountId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [txs, setTxs] = useState<TransactionRow[]>([]);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (params.account) setAccountId(Number(params.account));
  }, [params.account, params.t]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.all([
        getAccountsWithBalance(db),
        getTransactions(db, {
          accountId: accountId ?? undefined,
          search: search.trim() || undefined,
        }),
      ]).then(([a, list]) => {
        if (!active) return;
        setAccounts(a);
        setTxs(list);
      });
      return () => {
        active = false;
      };
    }, [db, accountId, search, version]),
  );

  const sections = useMemo(() => groupByDay(txs), [txs]);

  const handleDelete = async (tx: TransactionRow) => {
    try {
      await deleteTransaction(db, tx.id);
      setTxs((prev) => prev.filter((t) => t.id !== tx.id));
      setVersion((v) => v + 1);
    } catch {
      Alert.alert("No se pudo eliminar", "Intentá de nuevo.");
    }
  };

  const filtering = accountId !== null || search.trim() !== "";

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top"]}
    >
      <Text
        style={{
          color: colors.text,
          fontSize: 22,
          fontWeight: "600",
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 12,
        }}
      >
        Historial
      </Text>

      <View style={{ paddingHorizontal: 20, gap: 10, paddingBottom: 8 }}>
        <TextInput
          accessibilityLabel="Buscar movimientos"
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar movimientos"
          placeholderTextColor={colors.textMuted}
          returnKeyType="search"
          style={{
            height: 44,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            paddingHorizontal: 14,
            fontSize: 15,
            color: colors.text,
          }}
        />
      </View>

      <View style={{ height: 48 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: 20,
            gap: 8,
            alignItems: "center",
          }}
        >
          <Chip
            label="Todas"
            selected={accountId === null}
            onPress={() => setAccountId(null)}
          />
          {accounts.map((a) => (
            <Chip
              key={a.id}
              label={a.name}
              color={a.color}
              selected={accountId === a.id}
              onPress={() => setAccountId(accountId === a.id ? null : a.id)}
            />
          ))}
        </ScrollView>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(tx) => String(tx.id)}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        ListHeaderComponent={
          txs.length > 0 ? (
            <Text
              style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}
            >
              Tocá un movimiento para editarlo. Deslizalo hacia la izquierda
              para eliminarlo.
            </Text>
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
          <Text
            style={{
              color: colors.textMuted,
              fontSize: 15,
              paddingVertical: 24,
              textAlign: "center",
            }}
          >
            {filtering
              ? "No hay movimientos con ese filtro."
              : "Todavía no cargaste movimientos. Tocá el + para empezar."}
          </Text>
        }
      />
    </SafeAreaView>
  );
}
