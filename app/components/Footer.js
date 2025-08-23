import { Text, View, TouchableOpacity } from 'react-native';
import Foundation from '@expo/vector-icons/Foundation';
import { Ionicons } from "@expo/vector-icons";
import Entypo from '@expo/vector-icons/Entypo';

const Footer = ({activeTab,setActiveTab}) => {
  return (
    <View className="absolute bottom-0 left-0 right-0 flex-row items-center justify-around py-4 pb-5 bg-white border-t shadow-md">
      <TouchableOpacity className="items-center" onPress={() => setActiveTab("Material")}>
        <Entypo name="tools" size={activeTab === "Material" ? 28 : 24} color={activeTab === "Material" ? "#0a6d6a" : "#999"} />
        <Text className={`mt-1 text-xs ${activeTab === "Material" && "text-[#0a6d6a] font-bold"}`}>Materials</Text>
      </TouchableOpacity>
      <TouchableOpacity className="items-center" onPress={() => setActiveTab("Work")}>
        <Foundation name="clipboard-notes" size={activeTab === "Work" ? 28 : 24} color={activeTab === "Work" ? "#0a6d6a" : "#999"} />
        <Text className={`mt-1 text-xs ${activeTab === "Work" && "text-[#0a6d6a] font-bold"}`}>Work</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Footer;
