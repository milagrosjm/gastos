import DateTimePicker from "@react-native-community/datetimepicker";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AmountKeypad } from "../components/AmountKeypad";
import {
  Chip,
  Label,
  ModalHeader,
  PrimaryButton,
  Segmented,
} from "../components/ui";
import {
  AccountWithBalance,
  addTransaction,
  Category,
  deleteTransaction,
  getAccountsWithBalance,
  getCategories,
  getTransaction,
  TxType,
  updateTransaction,
} from "../db/queries";
import { radius, useTheme } from "../theme/colors";
import {
  applyKey,
  centsToRaw,
  formatDateLabel,
  formatTyped,
  fromISODate,
  parseAmount,
  today,
  toISODate,
} from "../utils/format";

export default function NuevoGasto() {
  const db = useSQLiteContext();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const { id } = useLocalSearchParams<{ id?: string }>();
  const editId = id ? Number(id) : null;
  const isEdit = editId !== null;

  const [type, setType] = useState<TxType>("expense");
  const [raw, setRaw] = useState("");
  const [accounts, setAccounts] = useState<AccountWithBalance[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accountId, setAccountId] = useState<number | null>(null);
  const [toAccountId, setToAccountId] = useState<number | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [noteFocused, setNoteFocused] = useState(false);
  const [date, setDate] = useState(today());
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const known = useRef<{ acc: Set<number>; cat: Set<number> } | null>(null);
  const pending = useRef<"from" | "to" | null>(null);

  // Si es edición, precarga el movimiento
  useEffect(() => {
    if (editId === null) return;
    let active = true;
    getTransaction(db, editId).then((t) => {
      if (!active) return;
      if (!t) {
        router.back();
        return;
      }
      setType(t.type);
      setRaw(centsToRaw(t.amount));
      setAccountId(t.account_id);
      setToAccountId(t.to_account_id);
      setCategoryId(t.category_id);
      setNote(t.note ?? "");
      setDate(t.date);
    });
    return () => {
      active = false;
    };
  }, [db, editId]);

  // Carga cuentas y categorías cada vez que la pantalla vuelve a estar en foco.
  // Si aparece una nueva (recién creada), la deja seleccionada.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const [accs, cats] = await Promise.all([
          getAccountsWithBalance(db),
          getCategories(db),
        ]);
        if (!active) return;
        setAccounts(accs);
        setCategories(cats);
        const k = known.current;
        if (k) {
          const newAcc = accs.find((a) => !k.acc.has(a.id));
          if (newAcc) {
            if (pending.current === "to") setToAccountId(newAcc.id);
            else setAccountId(newAcc.id);
          }
          const newCat = cats.find((c) => !k.cat.has(c.id));
          if (newCat) setCategoryId(newCat.id);
        } else if (accs.length && editId === null) {
          setAccountId(accs[0].id);
        }
        known.current = {
          acc: new Set(accs.map((a) => a.id)),
          cat: new Set(cats.map((c) => c.id)),
        };
        pending.current = null;
      })();
      return () => {
        active = false;
      };
    }, [db, editId]),
  );

  const kind = type === "income" ? "income" : "expense";
  const visibleCats = categories.filter((c) => c.kind === kind);
  const effectiveCategoryId = visibleCats.some((c) => c.id === categoryId)
    ? categoryId
    : null;

  const cents = parseAmount(raw);
  const valid =
    cents > 0 &&
    accountId !== null &&
    (type !== "transfer" ||
      (toAccountId !== null && toAccountId !== accountId));

  const amountColor =
    type === "expense"
      ? colors.expense
      : type === "income"
        ? colors.income
        : colors.text;
  const title =
    type === "transfer"
      ? isEdit
        ? "Editar transferencia"
        : "Transferencia"
      : type === "income"
        ? isEdit
          ? "Editar ingreso"
          : "Nuevo ingreso"
        : isEdit
          ? "Editar gasto"
          : "Nuevo gasto";

  const pickFrom = (accId: number) => {
    setAccountId(accId);
    if (toAccountId === accId) setToAccountId(null);
  };
  const newAccount = (who: "from" | "to") => {
    pending.current = who;
    router.push("/nueva-cuenta");
  };
  const newCategory = () =>
    router.push({ pathname: "/nueva-categoria", params: { kind } });

  const save = async () => {
    if (!valid || saving || accountId === null) return;
    setSaving(true);
    try {
      const input = {
        type,
        amount: cents,
        accountId,
        toAccountId: type === "transfer" ? toAccountId : null,
        categoryId: type === "transfer" ? null : effectiveCategoryId,
        note: note.trim() || null,
        date,
      };
      if (editId !== null) await updateTransaction(db, editId, input);
      else await addTransaction(db, input);
      router.back();
    } catch {
      setSaving(false);
      Alert.alert("No se pudo guardar", "Intentá de nuevo.");
    }
  };

  const confirmDelete = () => {
    if (editId === null) return;
    Alert.alert(
      "Eliminar movimiento",
      "¿Eliminar este movimiento? Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            await deleteTransaction(db, editId);
            router.back();
          },
        },
      ],
    );
  };

  const chipsRow = {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 8,
  };
  const toList = accounts.filter((a) => a.id !== accountId);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: Platform.OS === "ios" ? 8 : insets.top + 8,
      }}
    >
      <ScrollView
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 12,
          gap: 16,
        }}
      >
        <ModalHeader title={title} />

        <Segmented
          value={type}
          onChange={(t) => {
            setType(t);
            setCategoryId(null);
          }}
          options={[
            { value: "expense", label: "Gasto" },
            { value: "income", label: "Ingreso" },
            { value: "transfer", label: "Transferencia" },
          ]}
        />

        <Text
          accessibilityLabel={`Monto ${formatTyped(raw)} pesos`}
          style={{
            textAlign: "center",
            fontSize: 44,
            fontWeight: "800",
            color: amountColor,
          }}
        >
          $ {formatTyped(raw)}
        </Text>

        {type === "transfer" ? (
          <>
            <View>
              <Label>Desde</Label>
              <View style={chipsRow}>
                {accounts.map((a) => (
                  <Chip
                    key={a.id}
                    label={a.name}
                    color={a.color}
                    selected={a.id === accountId}
                    onPress={() => pickFrom(a.id)}
                  />
                ))}
                <Chip
                  label="+ Nueva"
                  dashed
                  onPress={() => newAccount("from")}
                />
              </View>
            </View>
            <View>
              <Label>Hacia</Label>
              <View style={chipsRow}>
                {toList.map((a) => (
                  <Chip
                    key={a.id}
                    label={a.name}
                    color={a.color}
                    selected={a.id === toAccountId}
                    onPress={() => setToAccountId(a.id)}
                  />
                ))}
                <Chip label="+ Nueva" dashed onPress={() => newAccount("to")} />
              </View>
            </View>
          </>
        ) : (
          <>
            <View>
              <Label>Cuenta</Label>
              <View style={chipsRow}>
                {accounts.map((a) => (
                  <Chip
                    key={a.id}
                    label={a.name}
                    color={a.color}
                    selected={a.id === accountId}
                    onPress={() => setAccountId(a.id)}
                  />
                ))}
                <Chip
                  label="+ Nueva"
                  dashed
                  onPress={() => newAccount("from")}
                />
              </View>
            </View>
            <View>
              <Label>Categoría</Label>
              <View style={chipsRow}>
                {visibleCats.map((c) => (
                  <Chip
                    key={c.id}
                    label={c.name}
                    color={c.color}
                    selected={c.id === effectiveCategoryId}
                    onPress={() =>
                      setCategoryId(c.id === effectiveCategoryId ? null : c.id)
                    }
                  />
                ))}
                <Chip label="+ Nueva" dashed onPress={newCategory} />
              </View>
            </View>
          </>
        )}

        <View style={{ flexDirection: "row", gap: 10 }}>
          <Pressable
            onPress={() => setShowPicker((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={`Fecha: ${formatDateLabel(date)}`}
            style={{
              flex: 1,
              height: 48,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surface,
              justifyContent: "center",
              paddingHorizontal: 14,
            }}
          >
            <Text style={{ color: colors.text, fontSize: 14 }}>
              {formatDateLabel(date)}
            </Text>
          </Pressable>
          <TextInput
            accessibilityLabel="Nota"
            value={note}
            onChangeText={setNote}
            onFocus={() => setNoteFocused(true)}
            onBlur={() => setNoteFocused(false)}
            placeholder="Agregar nota"
            placeholderTextColor={colors.textMuted}
            style={{
              flex: 1,
              height: 48,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surface,
              paddingHorizontal: 14,
              fontSize: 14,
              color: colors.text,
            }}
          />
        </View>

        {showPicker && (
          <DateTimePicker
            value={fromISODate(date)}
            mode="date"
            onChange={(_, d) => {
              setShowPicker(Platform.OS === "ios");
              if (d) setDate(toISODate(d));
            }}
          />
        )}

        {isEdit && (
          <Pressable
            onPress={confirmDelete}
            accessibilityRole="button"
            style={{
              height: 48,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{ color: colors.expense, fontWeight: "600", fontSize: 15 }}
            >
              Eliminar movimiento
            </Text>
          </Pressable>
        )}
      </ScrollView>

      <View
        style={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 12,
          gap: 10,
        }}
      >
        <PrimaryButton
          title={isEdit ? "Guardar cambios" : "Guardar"}
          onPress={save}
          disabled={!valid || saving}
        />
        {!noteFocused && (
          <AmountKeypad onKey={(k) => setRaw((r) => applyKey(r, k))} />
        )}
      </View>
    </View>
  );
}
