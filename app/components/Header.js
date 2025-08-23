import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Text, TouchableOpacity, View } from "react-native";

const Header = ({ headerName, activeTab, onMenuPress }) => {
  return (
    <View className="flex-row items-center justify-between px-5 py-4 shadow-md bg-slate-800">
      {/* Menu Button */}
      {/* <TouchableOpacity onPress={onMenuPress}>
        <MaterialIcons name="menu" size={28} color="#f8fafc" />
      </TouchableOpacity> */}

      {/* Title */}
      <Text className="text-lg font-bold text-slate-50">{headerName}</Text>

      {/* Right Icon */}
      {activeTab === "Material" ? (
        <MaterialIcons name="inventory" size={24} color="#f8fafc" />
      ) : (
        <MaterialIcons name="task-alt" size={24} color="#f8fafc" />
      )}
    </View>
  );
};

export default Header;