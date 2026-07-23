import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { Text } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { MercattoProvider } from "./src/context/MercattoContext";
import { MercattoToast } from "./src/components/MercattoUI";
import {
  BuyerRegisterScreen,
  CitySelectScreen,
  EntrepreneurRegisterScreen,
  LoginScreen,
  ModeSelectScreen,
  RegisterRoleScreen,
  SplashScreen,
} from "./src/screens/auth/AuthScreens";
import {
  AddressScreen,
  BusinessDetailScreen,
  BuyerHomeScreen,
  BuyerOrdersScreen,
  BuyerProfileScreen,
  CartScreen,
  CheckoutScreen,
  EditProfileScreen,
  FavoritesScreen,
  OrderConfirmationScreen,
  ProductDetailScreen,
  PromosScreen,
} from "./src/screens/buyer/BuyerScreens";
import {
  EntrepreneurDashboardScreen,
  SellerBusinessScreen,
  SellerOrdersScreen,
  SellerProductsScreen,
  SellerPromosScreen,
} from "./src/screens/entrepreneur/EntrepreneurScreens";
import { colors } from "./src/theme/mercattoTheme";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.white,
    text: colors.ink,
    border: "#E8E2D8",
  },
};

const publicBaseUrl = process.env.EXPO_PUBLIC_MERCATTO_PUBLIC_URL?.replace(
  /\/$/,
  "",
);
const linking = publicBaseUrl
  ? {
      prefixes: [publicBaseUrl],
      config: {
        screens: {
          BusinessDetail: "tiendas/:businessId",
        },
      },
    }
  : undefined;

function TabIcon({ name, color, focused }) {
  return (
    <Text
      style={{
        width: 42,
        height: 34,
        borderRadius: 17,
        backgroundColor: focused ? colors.softOrange : "transparent",
        textAlign: "center",
        paddingTop: 5,
      }}
    >
      <Ionicons name={focused ? name.replace("-outline", "") : name} size={23} color={color} />
    </Text>
  );
}

function BuyerTabs() {
  return (
    <Tab.Navigator screenOptions={tabOptions}>
      <Tab.Screen
        name="Inicio"
        component={BuyerHomeScreen}
        options={{ tabBarIcon: (props) => <TabIcon name="home-outline" {...props} /> }}
      />
      <Tab.Screen
        name="Promos"
        component={PromosScreen}
        options={{ tabBarIcon: (props) => <TabIcon name="pricetag-outline" {...props} /> }}
      />
      <Tab.Screen
        name="Pedidos"
        component={BuyerOrdersScreen}
        options={{ tabBarIcon: (props) => <TabIcon name="receipt-outline" {...props} /> }}
      />
      <Tab.Screen
        name="Perfil"
        component={BuyerProfileScreen}
        options={{ tabBarIcon: (props) => <TabIcon name="person-outline" {...props} /> }}
      />
    </Tab.Navigator>
  );
}

function EntrepreneurTabs() {
  return (
    <Tab.Navigator screenOptions={tabOptions}>
      <Tab.Screen
        name="Resumen"
        component={EntrepreneurDashboardScreen}
        options={{ tabBarIcon: (props) => <TabIcon name="grid-outline" {...props} /> }}
      />
      <Tab.Screen
        name="SellerOrders"
        component={SellerOrdersScreen}
        options={{ title: "Pedidos", tabBarIcon: (props) => <TabIcon name="receipt-outline" {...props} /> }}
      />
      <Tab.Screen
        name="SellerProducts"
        component={SellerProductsScreen}
        options={{ title: "Productos", tabBarIcon: (props) => <TabIcon name="cube-outline" {...props} /> }}
      />
      <Tab.Screen
        name="SellerPromos"
        component={SellerPromosScreen}
        options={{ title: "Promociones", tabBarIcon: (props) => <TabIcon name="sparkles-outline" {...props} /> }}
      />
      <Tab.Screen
        name="SellerBusiness"
        component={SellerBusinessScreen}
        options={{ title: "Mi negocio", tabBarIcon: (props) => <TabIcon name="storefront-outline" {...props} /> }}
      />
    </Tab.Navigator>
  );
}

const tabOptions = {
  headerShown: false,
  tabBarActiveTintColor: colors.primaryDark,
  tabBarInactiveTintColor: "#6F6A75",
  tabBarStyle: {
    minHeight: 76,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: "#EFE9DF",
    boxShadow: "0 -10px 24px rgba(23, 25, 24, 0.08)",
  },
  tabBarLabelStyle: {
    fontSize: 12,
    fontWeight: "900",
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <MercattoProvider>
        <NavigationContainer theme={theme} linking={linking}>
          <StatusBar style="dark" />
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="ModeSelect" component={ModeSelectScreen} />
            <Stack.Screen name="RegisterRole" component={RegisterRoleScreen} />
            <Stack.Screen name="BuyerRegister" component={BuyerRegisterScreen} />
            <Stack.Screen name="EntrepreneurRegister" component={EntrepreneurRegisterScreen} />
            <Stack.Screen name="CitySelect" component={CitySelectScreen} />
            <Stack.Screen name="BuyerTabs" component={BuyerTabs} />
            <Stack.Screen name="EntrepreneurTabs" component={EntrepreneurTabs} />
            <Stack.Screen name="BusinessDetail" component={BusinessDetailScreen} />
            <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
            <Stack.Screen name="Cart" component={CartScreen} />
            <Stack.Screen name="Checkout" component={CheckoutScreen} />
            <Stack.Screen name="OrderConfirmation" component={OrderConfirmationScreen} />
            <Stack.Screen name="Favorites" component={FavoritesScreen} />
            <Stack.Screen name="Address" component={AddressScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          </Stack.Navigator>
        </NavigationContainer>
        <MercattoToast />
      </MercattoProvider>
    </SafeAreaProvider>
  );
}
