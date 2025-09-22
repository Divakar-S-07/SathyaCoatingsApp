import { SafeAreaProvider } from "react-native-safe-area-context";
import "./global.css";
import { Button, PaperProvider } from "react-native-paper";
import Work from "./components/WorkModules/Work";
import Material from "./components/MaterialModules/MaterialDispatch";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Image, View, Text, TouchableOpacity, Modal, Dimensions } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Foundation from "@expo/vector-icons/Foundation";
import Entypo from "@expo/vector-icons/Entypo";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Feather from '@expo/vector-icons/Feather';
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginPage from "./components/Profile/LoginPage";
import ExpenseEntry from "./components/ExpenseModules/ExpenseEntry";
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import "./assets/logo.png"
import { useState, useEffect, useRef } from "react";
import * as SecureStore from "expo-secure-store";
import PagerView from 'react-native-pager-view';

import Icon from 'react-native-vector-icons/MaterialIcons';
import LabourAssign from "./components/Labour/LabourAssign";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Get screen width for pager
const { width: screenWidth } = Dimensions.get('window');

// Custom Tab Navigator with Swipe Support
function SwipeableTabNavigator({ navigation }) {
  const [leaderBoardVisible, setLeaderBoardVisible] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);
  const [userData, setUserData] = useState({ email: "", name: "" });
  const [currentPage, setCurrentPage] = useState(0);
  const pagerRef = useRef(null);

  // Tab configuration
  const tabs = [
    {
      name: "Expense",
      component: ExpenseEntry,
      icon: ({ size, color }) => <FontAwesome5 name="rupee-sign" size={size} color={color} />,
    },
    {
      name: "Material",
      component: Material,
      icon: ({ size, color }) => <Feather name="package" size={size} color={color} />,
    },
    {
      name: "Work",
      component: Work,
      icon: ({ size, color }) => <Foundation name="clipboard-notes" size={size} color={color} />,
    },
    {
      name: "Labour",
      component: LabourAssign,
      icon: ({ size, color }) => <Feather name="users" size={size} color={color} />,
    },
  ];

  // Load user info from SecureStore
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
    navigation.replace("Login");
  };

  // Handle page change from swipe
  const onPageSelected = (e) => {
    setCurrentPage(e.nativeEvent.position);
  };

  // Handle tab press
  const onTabPress = (index) => {
    setCurrentPage(index);
    pagerRef.current?.setPage(index);
  };

  // Render tab bar
  const renderTabBar = () => (
    <View style={{
      flexDirection: 'row',
      backgroundColor: '#fff',
      height: 60,
      paddingBottom: 5,
      borderTopWidth: 1,
      borderTopColor: '#e0e0e0',
    }}>
      {tabs.map((tab, index) => (
        <TouchableOpacity
          key={index}
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onPress={() => onTabPress(index)}
          activeOpacity={0.7}
        >
          {tab.icon({
            size: 24,
            color: currentPage === index ? '#1e7a6f' : '#aaa',
          })}
          <Text style={{
            fontSize: 12,
            marginTop: 2,
            color: currentPage === index ? '#1e7a6f' : '#aaa',
          }}>
            {tab.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Render header
  const renderHeader = () => (
    <View style={{
      backgroundColor: '#1e7a6f',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      paddingTop: 50, // Account for status bar
    }}>
      {/* Logo and Title */}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Image
          source={require("./assets/logo.png")}
          style={{ width: 35, height: 35, marginRight: 8 }}
          resizeMode="contain"
        />
        <Text className="font-extrabold text-white">
          {tabs[currentPage]?.name || 'App'}
        </Text>
      </View>

      {/* Header Actions */}
      <View className="flex flex-row items-center">
        {/* LeaderBoard */}
        <TouchableOpacity className="mr-4" onPress={() => setLeaderBoardVisible(true)}>
          <Icon name="leaderboard" size={32} color="#fff" />
        </TouchableOpacity>

        {/* User Profile */}
        <TouchableOpacity
          onPress={() => setProfileVisible(true)}
          className="items-center justify-center w-12 h-12 rounded-full"
        >
          <Ionicons name="person-circle-outline" size={32} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      {/* Custom Header */}
      {renderHeader()}

      {/* Swipeable Content */}
      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={0}
        onPageSelected={onPageSelected}
        scrollEnabled={true} // Enable swipe gestures
      >
        {tabs.map((tab, index) => (
          <View key={index} style={{ flex: 1 }}>
            <tab.component />
          </View>
        ))}
      </PagerView>

      {/* Custom Tab Bar */}
      {renderTabBar()}

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
    </View>
  );
}

function MainTabs({ navigation }) {
  return <SwipeableTabNavigator navigation={navigation} />;
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