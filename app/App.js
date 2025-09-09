import { SafeAreaProvider } from "react-native-safe-area-context";
import "./global.css";
import { Button, PaperProvider } from "react-native-paper";
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

import Icon from 'react-native-vector-icons/MaterialIcons';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs({ navigation }) {
  const [leaderBoardVisible,setLeaderBoardVisible] = useState(false);
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
              <View className="flex flex-row items-center justify-between ">
                {/* LeaderBoard */}
                <TouchableOpacity className="mr-4" onPress={()=>setLeaderBoardVisible(true)}>
                  <Icon name="leaderboard" size={32} color="#fff" />

                </TouchableOpacity>
                



                {/* User Profile */}
                <TouchableOpacity
                onPress={() => setProfileVisible(true)}
                className="items-center justify-center w-12 h-12 mr-4 rounded-full"
              >
                <Ionicons name="person-circle-outline" size={32} color="white" />
              </TouchableOpacity>
            </View>
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

      {/* LeaderBoard Modal */}
      <Modal
      transparent
      visible={leaderBoardVisible}
      onRequestClose={() => setLeaderBoardVisible(false)}
    >
      <View className="items-center justify-center flex-1 p-4 bg-black/60">
        <View className="w-full max-w-md p-6 bg-white rounded-lg">
          <Text className="mb-4 text-xl font-bold text-center">🏆 Site Engineer Leaderboard</Text>
          
          {/* Sample leaderboard data */}
          <View className="mb-4">
          {/* Header */}
          <View className="flex-row py-3 bg-gray-200 border-b border-gray-300 rounded-t-md">
            <Text className="flex-1 font-bold text-center text-gray-800">Rank</Text>
            <Text className="flex-1 font-bold text-center text-gray-800">Name</Text>
            <Text className="flex-1 font-bold text-center text-gray-800">Score</Text>
          </View>

          {/* Row 1 */}
          <View className="flex-row py-2 border-b border-gray-100">
            <Text className="flex-1 text-center">1.</Text>
            <Text className="flex-1 text-center">Vimal</Text>
            <Text className="flex-1 text-center">100</Text>
          </View>

          {/* Row 2 */}
          <View className="flex-row py-2 border-b border-gray-100">
            <Text className="flex-1 text-center">2.</Text>
            <Text className="flex-1 text-center">Subash</Text>
            <Text className="flex-1 text-center">50</Text>
          </View>

          {/* Row 3 */}
          <View className="flex-row py-2">
            <Text className="flex-1 text-center">3.</Text>
            <Text className="flex-1 text-center">Bharath</Text>
            <Text className="flex-1 text-center">10</Text>
          </View>
        </View>

        <TouchableOpacity
               onPress={() => setLeaderBoardVisible(false)}
              className="py-3 bg-gray-100 rounded-xl active:bg-gray-200"
              activeOpacity={0.8}
            >
              <Text className="font-medium text-center text-gray-700">
                Close
              </Text>
            </TouchableOpacity>
          
          
        </View>
      </View>
    </Modal>

      {/* Profile Modal */}
      <Modal
      transparent
      visible={profileVisible}
      animationType="slide"
      onRequestClose={() => setProfileVisible(false)}
    >
      <View className="items-center justify-center flex-1 bg-black/60">
        <View className="mx-4 bg-white shadow-2xl w-96 rounded-3xl">
          {/* Header */}
          <View className="px-6 pt-6 pb-4 border-b border-gray-100">
            <Text className="text-xl font-semibold text-center text-gray-800">
              Profile Information
            </Text>
          </View>
          
          {/* Content */}
          <View className="px-6 py-6 space-y-4">
            {/* User Info Cards */}
            <View className="p-4 bg-gray-50 rounded-xl">
              <Text className="mb-1 text-sm font-medium text-gray-600">Name</Text>
              <Text className="text-base font-semibold text-gray-900">
                {userData.name || "Not provided"}
              </Text>
            </View>
            
            <View className="p-4 bg-gray-50 rounded-xl">
              <Text className="mb-1 text-sm font-medium text-gray-600">Email</Text>
              <Text className="text-base font-semibold text-gray-900">
                {userData.email || "Not provided"}
              </Text>
            </View>
          </View>
          
          {/* Actions */}
          <View className="px-6 pb-6 space-y-3">
            <TouchableOpacity
              onPress={handleLogout}
              className="py-4 bg-red-500 shadow-sm rounded-xl active:bg-red-600"
              activeOpacity={0.8}
            >
              <Text className="font-semibold text-center text-white">
                Sign Out
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => setProfileVisible(false)}
              className="py-3 bg-gray-100 rounded-xl active:bg-gray-200"
              activeOpacity={0.8}
            >
              <Text className="font-medium text-center text-gray-700">
                Close
              </Text>
            </TouchableOpacity>
          </View>
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
          {/* <Stack.Screen name="Login" component={LoginPage} /> */}
          <Stack.Screen name="MainTabs" component={MainTabs} />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}
