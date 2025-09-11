import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import Toast from "react-native-toast-message";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { useNavigation } from "@react-navigation/native";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const handleSubmit = async () => {
    if (!email || !password) {
      Toast.show({
        type: "error",
        text1: "Validation Error",
        text2: "Please enter both email and password",
      });
      return;
    }

    setLoading(true);

    try {
      console.log("Sending login request:", { email, password });

      // Login request
      const response = await axios.post(
        "http://103.118.158.127/api/auth/login",
        { email, password },
        { headers: { "Content-Type": "application/json" } }
      );

      console.log("Login response:", response.data);

      const { token, encodedUserId } = response.data;

      // Save token + encodedUserId
      await SecureStore.setItemAsync("token", token);
      await SecureStore.setItemAsync("encodedUserId", encodedUserId);
      await SecureStore.setItemAsync("loginTime", Date.now().toString());

      //  Verify token to fetch user profile
      const verifyRes = await axios.post(
        "http://103.118.158.127/api/auth/verify-token",
        { token }
      );

      const userProfile = verifyRes.data;
      console.log("Verified user profile:", userProfile);

      // Save profile details
      await SecureStore.setItemAsync("userName", userProfile.user_name);
      await SecureStore.setItemAsync("userEmail", userProfile.user_email);
      await SecureStore.setItemAsync("userRole", userProfile.role);
      await SecureStore.setItemAsync("userId", String(userProfile.user_id));

      Toast.show({
        type: "success",
        text1: "Login successful!",
      });

      navigation.replace("MainTabs"); // move to main app
    } catch (error) {
      console.error("Login error:", error?.response?.data || error.message);

      Toast.show({
        type: "error",
        text1: "Login Failed",
        text2:
          error.response?.data?.error ||
          error.response?.statusText ||
          "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="items-center justify-center flex-1 px-5 bg-gray-50">
      {/* Logo */}
      <View className="mb-5">
        <Image
          source={require("../../assets/logo.png")}
          className="w-28 h-28"
          resizeMode="contain"
        />
      </View>

      {/* Title */}
      <Text className="mb-6 text-2xl font-semibold text-center text-gray-900">
        Welcome to Sathya Coatings
      </Text>

      {/* Email Input */}
      <TextInput
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        className="w-full px-4 py-3 mb-4 bg-white border border-gray-300 rounded-lg"
      />

      {/* Password Input */}
      <TextInput
        placeholder="Enter your password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        className="w-full px-4 py-3 mb-4 bg-white border border-gray-300 rounded-lg"
      />

      {/* Button */}
      <TouchableOpacity
        onPress={handleSubmit}
        disabled={loading}
        className={`w-full py-3 rounded-lg ${
          loading ? "bg-gray-400" : "bg-[#1e7a6f]"
        }`}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-lg font-semibold text-center text-white">
            Log In
          </Text>
        )}
      </TouchableOpacity>

      <Toast />
    </View>
  );
}

export default LoginPage;
