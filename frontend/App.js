import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";

import { BarangProvider } from "./src/context/BarangContext";
import HomeScreen from "./src/screens/HomeScreen";
import FormScreen from "./src/screens/FormScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <BarangProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <Stack.Navigator>
          <Stack.Screen name="Home" component={HomeScreen} options={{ title: "Inventaris Barang" }} />
          <Stack.Screen name="Form" component={FormScreen} options={{ title: "Form Barang" }} />
        </Stack.Navigator>
      </NavigationContainer>
    </BarangProvider>
  );
}