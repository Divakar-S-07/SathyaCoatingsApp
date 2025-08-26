import React, { useState } from "react";
import { View, Text, TouchableOpacity, TextInput, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const WorkItemCard = ({ item, newWorkData, onChange, onSubmit, submitting }) => {
  const [showSubcategories, setShowSubcategories] = useState(false);
  const [expandedSubIndex, setExpandedSubIndex] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [areaInput, setAreaInput] = useState("");

  const alreadyCompleted = parseFloat(item.area_completed) || 0;
  const addition = parseFloat(newWorkData[item.rec_id]) || 0;
  const totalCompleted = alreadyCompleted + addition;
  const isCompleted =
    parseFloat(item.area_completed || 0) >= parseFloat(item.po_quantity || 0);

  const subcategories = [
    { name: "Primer Application", icon: "brush-outline", status: "Completed" },
    { name: "Wall Pasting", icon: "hammer-outline", status: "In Progress" },
    { name: "Paint Application", icon: "color-palette-outline", status: "Not Started" },
    { name: "Final Finishing", icon: "checkmark-circle-outline", status: "Not Started" },
  ];

  // Only one dropdown open at a time
  const toggleExpandSubcategory = (idx) => {
    setExpandedSubIndex(prev => (prev === idx ? null : idx));
  };

  const handleUpdatePress = () => setShowUpdateModal(true);
  const handleModalClose = () => setShowUpdateModal(false);

  const handleQuantityUpdate = () => {
    if (onChange) {
      onChange(item.rec_id, areaInput);
    }
    if (onSubmit) {
      onSubmit();
    }
    setShowUpdateModal(false);
  };

  return (
    <View className="p-4 mb-3 bg-white border border-gray-800 shadow-sm rounded-xl">
      <Text className="text-xl font-bold text-gray-800">
        Item: {item.item_id}
      </Text>
      <Text className="mt-1 text-sm text-gray-600">
        {item.work_descriptions}
      </Text>
      <Text className="mt-2 text-xs font-bold text-gray-700">
        PO Qty: {item.po_quantity} {item.uom}
      </Text>
      <View className="flex flex-row justify-between ">
        <Text className="mt-2 text-xs font-bold text-gray-700">
          Open Quantity: {item.po_quantity}
        </Text>
        <Text className="mt-2 text-xs font-bold text-gray-700">
          Area Completed: {item.area_completed || 0}
        </Text>
      </View>

      {/* Accordion Header */}
      <TouchableOpacity
        onPress={() => setShowSubcategories(!showSubcategories)}
        className="flex-row items-center justify-between px-2 py-3 mt-4 rounded-lg bg-slate-100"
      >
        <View className="flex-row items-center">
          <Ionicons name="layers-outline" size={18} color="#374151" />
          <Text className="ml-2 text-base font-semibold text-gray-700">
            Work Subcategories
          </Text>
        </View>

        {/* category icon */}
        <Ionicons
          name={showSubcategories ? "chevron-up" : "chevron-down"}
          size={18}
          color="#374151"
        />
      </TouchableOpacity>

      {/* Accordion Content: Only one dropdown open */}
      {showSubcategories && (
        <View className="mt-2 space-y-2">
          {subcategories.map((subcat, index) => (
            <View key={index} className="mb-4 bg-white border border-gray-200 rounded-lg">
              <TouchableOpacity
                onPress={() => toggleExpandSubcategory(index)}
                className="flex-row items-center justify-between p-3"
              >
                <View className="flex-row items-center flex-1">
                  <View className="items-center justify-center w-8 h-8 mr-3 bg-[#1e7a6f] rounded-full">
                    <Ionicons name={subcat.icon} size={16} color="#fff" />

                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-gray-800">{subcat.name}</Text>
                  </View>
                </View>
                
                <Ionicons
                  name={expandedSubIndex === index ? "chevron-up" : "chevron-down"}
                  size={16}
                  color="#374151"
                />
              </TouchableOpacity>



              
              {expandedSubIndex === index && (
                <View style={{ padding: 12, backgroundColor: "#f4f4f5", borderTopWidth: 1, borderColor: "#ececec" }}>
                  <Text className="ml-1 text-sm font-bold">Area Completed: 0</Text>
                  {/* Add more fields here if needed */}
                    <TouchableOpacity
                      className={`mt-4 py-3 rounded-lg flex-row justify-center items-center ${
                        submitting ? 'bg-gray-400' : 'bg-[#1e7a6f]'
                      }`}
                      disabled={submitting}
                      onPress={handleUpdatePress}
                    >
                      <Ionicons name="refresh-outline" size={16} color="white" />
                      <Text className="ml-2 font-semibold text-white">
                        Update
                      </Text>
                    </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Update Button */}
      <TouchableOpacity
        className={`mt-4 py-3 rounded-lg flex-row justify-center items-center ${
          submitting ? 'bg-gray-400' : 'bg-[#1e7a6f]'
        }`}
        disabled={submitting}
        onPress={handleUpdatePress}
      >
        <Ionicons name="refresh-outline" size={16} color="white" />
        <Text className="ml-2 font-semibold text-white">
          {submitting ? 'Updating...' : 'Update Progress'}
        </Text>
      </TouchableOpacity>

      {/* Modal for Quantity Update */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showUpdateModal}
        onRequestClose={handleModalClose}
      >
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#00000055" }}>
          <View style={{ padding: 20, backgroundColor: "white", borderRadius: 15, width: "80%" }}>
            <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 12 }}>Update Area Quantity</Text>
            <TextInput
              value={areaInput}
              onChangeText={setAreaInput}
              keyboardType="numeric"
              placeholder="Enter new area"
              style={{
                borderWidth: 1,
                borderColor: "#ccc",
                padding: 10,
                marginBottom: 16,
                borderRadius: 6,
              }}
            />
            <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
              <TouchableOpacity
                style={{ backgroundColor: "#1e7a6f", padding: 10, borderRadius: 6, marginRight: 8 }}
                onPress={handleQuantityUpdate}
              >
                <Text style={{ color: "white" }}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ backgroundColor: "#ccc", padding: 10, borderRadius: 6 }}
                onPress={handleModalClose}
              >
                <Text>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default WorkItemCard;
