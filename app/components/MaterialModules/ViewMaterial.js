import React from 'react';
import { Modal, ScrollView, Image, TouchableOpacity, View, Text } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Card, Button, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
export default function ViewMaterial({ 
  visible, 
  onClose, 
  onUpdate,
  Material, 
  materialName, 
  item,
  quantityAndRemarks,
  selectedItemData, 
  allDispatchedMaterials 
}) {
  
  console.log('ViewMaterial Props:', {
    materialName,
    item,
    quantityAndRemarks,
    selectedItemData,
    allDispatchedMaterials
  });

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <TouchableOpacity
        className="items-center justify-center flex-1 bg-black/50"
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          className="bg-white w-[90%] rounded-2xl overflow-hidden"
          activeOpacity={1}
          onPress={e => e.stopPropagation()}
        >
          {/* Header */}
          <View className="flex-row items-center p-4 bg-[#1e7a6f]">
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            
            <View className="flex flex-row ml-8">
              <Feather name="package" size={24} color="white" />
              <Text className="ml-2 font-bold text-white text-md">
                
                {Material?.title || 'Material Acnowledgement'}
              </Text>
            </View>
          </View>

          <ScrollView
            contentContainerStyle={{ paddingBottom: 70 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Material Image */}
            {/* <Image
              source={{ uri:  'https://images.unsplash.com/photo-1541888946425-d81bb19240f5' }}
              className="w-full h-40"
              resizeMode="contain"
            /> */}

            
            <View className="items-center ">
              <Text className="mb-2 font-bold text-center text-gray-900 text-md "></Text>
              
              <View className="w-full max-w-xs">
                <View className="flex-row py-2 border-b border-gray-200">
                  <Text className="flex-1 text-sm font-bold text-gray-900">Material Name</Text>
                  <Text className="w-4 font-medium text-center text-gray-700">:</Text>
                  <Text className="flex-1 text-sm font-semibold text-gray-900">{materialName}</Text>
                </View>

                {/* <View className="flex-row py-2 border-b border-gray-200">
                  <Text className="flex-1 text-sm font-bold text-gray-900">Item ID</Text>
                  <Text className="w-4 font-medium text-center text-gray-700">:</Text>
                  <Text className="flex-1 text-sm font-semibold text-gray-900">{item}</Text>
                </View> */}

                <View className="flex-row py-2">
                  <Text className="flex-1 text-sm font-bold text-gray-900">Total Quantity</Text>
                  <Text className="w-4 font-medium text-center text-gray-700">:</Text>
                  <Text className="flex-1 text-sm font-semibold text-gray-900">
                    {selectedItemData?.assigned_quantity || 'N/A'} {selectedItemData?.uom_name || ''}
                  </Text>
                </View>
                
                {/* Dispatched Quantities & Remarks Table */}
                <View className="w-full max-w-md mx-auto mt-4 overflow-hidden bg-white border shadow-sm border-slate-200 rounded-xl">
                  {/* Table Header */}
                  <View className="flex-row bg-gray-100">
                    <View className="flex-1 px-4 py-3 border-r border-slate-200">
                      <Text className="text-sm font-semibold tracking-wide text-center text-slate-800">Dispatched Quantities</Text>
                    </View>
                    <View className="flex-1 px-4 py-3">
                      <Text className="text-sm font-semibold tracking-wide text-center text-slate-800">Remarks</Text>
                    </View>
                  </View>

                  {/* Row - Component A */}
                  <View className="flex-row bg-white border-t border-slate-100 hover:bg-slate-50">
                    <View className="flex-1 px-4 py-4 border-r border-slate-100">
                      <Text className="mb-1 text-xs font-bold tracking-wider text-center text-gray-900 uppercase">Comp A</Text>
                      <Text className="text-sm font-bold text-center ">
                        {selectedItemData?.comp_a_qty || 'N/A'}
                      </Text>
                    </View>
                    <View className="flex-1 px-4 py-4">
                      <Text className="text-sm font-medium leading-relaxed text-center text-slate-700">
                        {selectedItemData?.comp_a_remarks || 'No remarks'}
                      </Text>
                    </View>
                  </View>

                  {/* Row - Component B */}
                  <View className="flex-row bg-white border-t border-slate-100 hover:bg-slate-50">
                    <View className="flex-1 px-4 py-4 border-r border-slate-100">
                      <Text className="mb-1 text-xs font-bold tracking-wider text-center text-gray-900 uppercase">Comp B</Text>
                      <Text className="text-sm font-bold text-center text-slate-900">
                        {selectedItemData?.comp_b_qty || 'N/A'}
                      </Text>
                    </View>
                    <View className="flex-1 px-4 py-4">
                      <Text className="text-sm font-medium leading-relaxed text-center text-slate-700">
                        {selectedItemData?.comp_b_remarks || 'No remarks'}
                      </Text>
                    </View>
                  </View>

                  {/* Row - Component C */}
                  <View className="flex-row bg-white border-t border-slate-100 hover:bg-slate-50">
                    <View className="flex-1 px-4 py-4 border-r border-slate-100">
                      <Text className="mb-1 text-xs font-bold tracking-wider text-center text-gray-900 uppercase">Comp C</Text>
                      <Text className="text-sm font-bold text-center text-slate-900">
                        {selectedItemData?.comp_c_qty || 'N/A'}
                      </Text>
                    </View>
                    <View className="flex-1 px-4 py-4">
                      <Text className="text-sm font-medium leading-relaxed text-center text-slate-700">
                        {selectedItemData?.comp_c_remarks || 'No remarks'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            

            <Button
            mode="contained"
            buttonColor="#dc2626"   // background color
            textColor="#ffffff"     // text color
            style={{ borderRadius: 8, margin: 10 ,marginTop: 40}}
            onPress={onUpdate}
            >
              <Text className="font-bold">Update</Text>
            </Button>

            
            {/* <Button
            mode="contained-tonal"
            buttonColor="#ccc"   // background color
            textColor="#ffffff"     // text color
            style={{ borderRadius: 8, margin: 10 }}
            onPress={onClose}
            >
              <Text className="font-bold">Close</Text>
            </Button> */}

            <TouchableOpacity
                onPress={onClose}
                style={{
                  margin: 10,
                  padding: 10,
                  backgroundColor: "#1e7a6f",
                  borderRadius: 6,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#fff" }}>Close</Text>
            </TouchableOpacity>
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}