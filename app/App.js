import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import "./global.css";
import { PaperProvider } from "react-native-paper";
import { useState } from "react";

import Work from "./components/WorkModules/Work";
import Material from "./components/MaterialModules/MaterialDispatch";

import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Image, View, Text, TouchableOpacity } from "react-native";  
import { Ionicons } from "@expo/vector-icons"; 
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AntDesign from '@expo/vector-icons/AntDesign';
import FontAwesome from '@expo/vector-icons/FontAwesome';

// for when open app first page
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginPage from "./components/Profile/LoginPage";
import ExpenseEntry from "./components/ExpenseModules/ExpenseEntry";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator(); // for switching tabs like react routing 

function MainTabs(){
  return (
    <Tab.Navigator
          screenOptions={{
            
            headerStyle: {
              backgroundColor: "#1e7a6f", // header bg
            },
            headerTintColor: "#fff",
            tabBarStyle: {
              backgroundColor: "#fff",
              height: 60,
              paddingBottom: 5,
            },
            tabBarActiveTintColor: "#1e7a6f",
            tabBarInactiveTintColor: "#aaa",
            swipeEnabled: true,


            headerTitle: ({children}) => (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Image
                  source={require("./assets/logo.png")} // header 
                  style={{ width: 35, height: 35, marginRight: 8 }}
                  resizeMode="contain"
                />

                <Text className="font-extrabold text-white">
                  {children}
                </Text>
                
              </View>
            ),

            // header right side icon
            headerRight: () => (
              <TouchableOpacity className="items-center justify-center w-12 h-12 p-2 mr-4 border border-white rounded-full">
                  <FontAwesome name="user" size={24} color="white" 
                />
              </TouchableOpacity>
            )
          }}
        >

          {/* Expense Entry */}
          <Tab.Screen name="Expense" component={ExpenseEntry} 
          options={{
            tabBarIcon: ({ size, color }) => (
              <MaterialCommunityIcons name="cash-multiple" size={size} color={color} />
            ),
          }}/>


          {/* work page */}
          <Tab.Screen name="Work" component={Work} 
          options={{
            tabBarIcon: ({size, color}) => (
               <Ionicons name="hammer" size={size} color={color} />
            )
          }}/>


          {/* material page */}
          <Tab.Screen name="Materials" component={Material} 
          options={{
            tabBarIcon: ({size, color}) => (
               <MaterialCommunityIcons name="truck-delivery" size={size} color={color} />
            )
          }}
          />
      



    </Tab.Navigator>
  )
}

export default function App() {
  return (
    <PaperProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {/* Root page First screen when app*/}
          <Stack.Screen name="Login" component={LoginPage}/>


          {/* After Login Successful navigate to mainTabs */}
          <Stack.Screen name="MainTabs" component={MainTabs}/>



        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}
