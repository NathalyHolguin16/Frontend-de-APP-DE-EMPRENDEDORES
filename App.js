import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Text } from "react-native";

import { AuthProvider, useAuth } from "./contexts/AuthContext";
import AccountScreen from "./screens/AccountScreen";
import ConfirmacionScreen from "./screens/ConfirmacionScreen";
import LoginScreen from "./screens/LoginScreen";
import ProductoScreen from "./screens/ProductoScreen";
import RegisterScreen from "./screens/RegisterScreen";
import ResumenScreen from "./screens/ResumenScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#08111d",
    card: "#0f1b2d",
    text: "#f8fbff",
    border: "#1f334b",
    primary: "#f4b942",
  },
};

function AppTabs() {
  const { profile } = useAuth();

  return (
    <Tab.Navigator
      initialRouteName="Producto"
      screenOptions={{
        headerTitleAlign: "center",
        headerStyle: {
          backgroundColor: "#0f1b2d",
        },
        headerTintColor: "#f8fbff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
        tabBarActiveTintColor: "#f4b942",
        tabBarInactiveTintColor: "#93a4ba",
        tabBarStyle: {
          height: 65,
          paddingBottom: 8,
          paddingTop: 8,
          backgroundColor: "#0f1b2d",
          borderTopColor: "#1f334b",
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "bold",
        },
      }}
    >
      <Tab.Screen
        name="Producto"
        component={ProductoScreen}
        options={{
          title: "Producto",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 22, color }}>🛒</Text>
          ),
        }}
      />

      <Tab.Screen
        name="Resumen"
        component={ResumenScreen}
        options={{
          title: "Resumen",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 22, color }}>🧾</Text>
          ),
        }}
      />

      <Tab.Screen
        name="Confirmacion"
        component={ConfirmacionScreen}
        options={{
          title: "Confirmación",
          tabBarLabel: "Confirmar",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 22, color }}>🎉</Text>
          ),
        }}
      />

      <Tab.Screen
        name="Cuenta"
        component={AccountScreen}
        options={{
          title: profile?.name ? profile.name : "Cuenta",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 22, color }}>👤</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { isBooting, token } = useAuth();

  if (isBooting) {
    return null;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {token ? (
        <Stack.Screen name="AppTabs" component={AppTabs} />
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer theme={theme}>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
