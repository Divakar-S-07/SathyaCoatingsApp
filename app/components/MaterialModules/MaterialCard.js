import React from 'react';
import { TouchableOpacity, View, Text, Image } from 'react-native';
import { Button } from 'react-native-paper'; // Better styled than RN Button
import Ionicons from '@expo/vector-icons/Ionicons';

const MaterialCard = ({ itemId, onView, onUpdate, image}) => {
  return (
    <TouchableOpacity
      onPress={onView}
      className="w-[30%] mb-4 mx-[1.5%] rounded-2xl bg-white shadow-md border border-gray-200"
    >
      {/* Card Header */}
      <View className="px-2 py-1">
        <Text className="font-medium text-center text-gray-600">
          Item {itemId}
        </Text>
      </View>

      {/* Card Image */}
      <View className="items-center justify-center px-2">
        <Image
          source={{
            uri: image
          }}
          className="w-full h-[60px] rounded-lg"
          resizeMode="contain"
        />
      </View>

      {/* Footer */}
      <View style={{ padding: 10 }}>
            <TouchableOpacity
              // onPress={() => setUpdateVisible(true)}
              style={{
                paddingVertical: 8,
                borderRadius: 8,
                backgroundColor: "#f5f5f5",
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "600", textAlign: "center", color: "#333" }}>
                Update
              </Text>
            </TouchableOpacity>
          </View>
    </TouchableOpacity>
  );
};

export default MaterialCard;
