import { SafeAreaProvider } from "react-native-safe-area-context";
import "./global.css";
import { PaperProvider } from "react-native-paper";
import Work from "./components/WorkModules/Work";
import Material from "./components/MaterialModules/MaterialDispatch";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Image, View, Text, TouchableOpacity, Modal } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Foundation from "@expo/vector-icons/Foundation";
import Entypo from "@expo/vector-icons/Entypo";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginPage from "./components/Profile/LoginPage";
import ExpenseEntry from "./components/ExpenseModules/ExpenseEntry";

import { useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs({ navigation }) {
  const [profileVisible, setProfileVisible] = useState(false);
  const [userData, setUserData] = useState({ email: "", name: "" });

  // Load user info from SecureStore (you saved it in LoginPage)
  useEffect(() => {
    const fetchUser = async () => {
      const email = await SecureStore.getItemAsync("userEmail");
      const name = await SecureStore.getItemAsync("userName");
      setUserData({ email, name });
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync("token");
    await SecureStore.deleteItemAsync("encodedUserId");
    await SecureStore.deleteItemAsync("loginTime");
    navigation.replace("Login"); // go back to login screen
  };

  return (
    <>
      <Tab.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: "#1e7a6f" },
          headerTintColor: "#fff",
          tabBarStyle: {
            backgroundColor: "#fff",
            height: 60,
            paddingBottom: 5,
          },
          tabBarActiveTintColor: "#1e7a6f",
          tabBarInactiveTintColor: "#aaa",
          headerTitle: ({ children }) => (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Image
                source={require("./assets/logo.png")}
                style={{ width: 35, height: 35, marginRight: 8 }}
                resizeMode="contain"
              />
              <Text className="font-extrabold text-white">{children}</Text>
            </View>
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={() => setProfileVisible(true)}
              className="items-center justify-center w-12 h-12 p-2 mr-4 rounded-full"
            >
              <Ionicons name="person-circle-outline" size={28} color="white" />
            </TouchableOpacity>
          ),
        }}
      >
        <Tab.Screen
          name="Expense"
          component={ExpenseEntry}
          options={{
            tabBarIcon: ({ size, color }) => (
              <MaterialCommunityIcons
                name="cash-multiple"
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tab.Screen
          name="Work"
          component={Work}
          options={{
            tabBarIcon: ({ size, color }) => (
              <Foundation name="clipboard-notes" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Materials"
          component={Material}
          options={{
            tabBarIcon: ({ size, color }) => (
              <Entypo name="tools" size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>

      {/* Profile Modal */}
      <Modal
        transparent
        visible={profileVisible}
        animationType="fade"
        onRequestClose={() => setProfileVisible(false)}
      >
        <View className="items-center justify-center flex-1 bg-black/50">
          <View className="p-5 bg-white w-80 rounded-2xl">
            <Text className="mb-3 text-lg font-bold text-center">Profile</Text>
            <Text className="mb-1 text-base">Name: {userData.name || "N/A"}</Text>
            <Text className="mb-4 text-base">
              Email: {userData.email || "N/A"}
            </Text>

            <TouchableOpacity
              onPress={handleLogout}
              className="py-3 bg-red-500 rounded-lg"
            >
              <Text className="font-semibold text-center text-white">
                Logout
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setProfileVisible(false)}
              className="py-2 mt-3"
            >
              <Text className="text-center text-gray-600">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

export default function App() {
  return (
    <PaperProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {/* Login First */}
          <Stack.Screen name="Login" component={LoginPage} />
          <Stack.Screen name="MainTabs" component={MainTabs} />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}
