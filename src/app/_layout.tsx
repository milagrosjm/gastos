import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { migrateDb } from "../db/schema";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SQLiteProvider databaseName="gastos.db" onInit={migrateDb}>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="cuenta/[id]" />
          <Stack.Screen name="categorias" />
          <Stack.Screen
            name="nuevo-gasto"
            options={{ presentation: "modal" }}
          />
          <Stack.Screen
            name="nueva-cuenta"
            options={{ presentation: "modal" }}
          />
          <Stack.Screen
            name="nueva-categoria"
            options={{ presentation: "modal" }}
          />
        </Stack>
      </SQLiteProvider>
    </GestureHandlerRootView>
  );
}
