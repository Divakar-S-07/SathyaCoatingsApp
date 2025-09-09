import React, { useEffect, useState } from "react";
import { Modal, View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import * as SecureStore from "expo-secure-store";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";

export default function ProfileModal({ visible, onClose }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!visible) return;
      setLoading(true);
      try {
        const token = await SecureStore.getItemAsync("token");
        if (!token) throw new Error("No token found");

        const response = await axios.get("http://103.118.158.33/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUser(response.data);
      } catch (error) {
        console.error("fetch profile error:", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [visible]);

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync("token");
    await SecureStore.deleteItemAsync("encodedUserId");
    navigation.replace("Login");
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="items-center justify-center flex-1 bg-black/50">
        <View className="p-6 bg-white shadow-lg w-80 rounded-2xl">
          {loading ? (
            <ActivityIndicator size="large" color="#1e7a6f" />
          ) : (
            <>
              <Text className="mb-2 text-xl font-bold text-gray-800">
                {user?.name || "User"}
              </Text>
              <Text className="mb-6 text-gray-600">{user?.email || "No email"}</Text>

              <TouchableOpacity
                onPress={handleLogout}
                className="w-full py-3 bg-red-600 rounded-lg"
              >
                <Text className="font-semibold text-center text-white">Logout</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onClose}
                className="w-full py-3 mt-3 bg-gray-300 rounded-lg"
              >
                <Text className="font-semibold text-center text-gray-800">Close</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
