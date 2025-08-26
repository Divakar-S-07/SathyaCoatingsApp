import React from 'react';
import { Modal, ScrollView, Image, TouchableOpacity, View, Text } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Card, Button, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ViewMaterial({ 
  visible, 
  onClose, 
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
            
            <Text className="flex-1 ml-20 font-semibold text-white text-md">
              {Material?.title || 'Material Details'}
            </Text>
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
              <Text className="mb-2 font-bold text-center text-gray-900 text-md ">Material Information</Text>
              <View className="w-full h-px my-2 bg-gray-300" />
              
              <View className="w-full max-w-xs">
                <View className="flex-row py-2 border-b border-gray-200">
                  <Text className="text-sm font-bold text-gray-900 w-36">Material Name</Text>
                  
                  <Text className="w-4 font-medium text-gray-700">:</Text>
                  
                  <Text className="flex-1 text-sm font-semibold text-gray-900">{materialName}</Text>
                </View>

                <View className="flex-row py-2 border-b border-gray-200">
                  <Text className="text-sm font-bold text-gray-900 w-36">Item ID</Text>
                  <Text className="w-4 font-medium text-gray-700">:</Text>
                  <Text className="flex-1 text-sm font-semibold text-gray-900">{item}</Text>
                </View>

                <View className="flex-row py-2">
                  <Text className="text-sm font-bold text-gray-900 w-36">Quantity & UOM</Text>
                  <Text className="w-4 font-medium text-gray-700">:</Text>
                  <Text className="flex-1 text-sm font-semibold text-gray-900">
                    {selectedItemData?.assigned_quantity || 'N/A'} {selectedItemData?.uom_name || ''}
                  </Text>
                </View>
                
                {/* Dispatched Quantities & Remarks Table */}
                <View className="w-full max-w-md mx-auto mt-4 overflow-hidden border border-gray-300 rounded-lg">
                  {/* Table Header */}
                  <View className="flex-row bg-gray-100">
                    <View className="w-40 px-2 py-2 border-r border-gray-300">
                      <Text className="text-sm font-bold text-gray-900">Dispatched Quantities</Text>
                    </View>
                    <View className="flex-1 px-2 py-2">
                      <Text className="text-sm font-bold text-gray-900">Remarks</Text>
                    </View>
                  </View>

                  {/* Row - Component A */}
                  <View className="flex-row border-t border-gray-300">
                    <View className="w-40 px-2 py-2 border-r border-gray-300">
                      <Text className="text-sm font-medium text-gray-700">Component A</Text>
                      <Text className="text-sm font-semibold text-gray-900">
                        {selectedItemData?.comp_a_qty || 'N/A'}
                      </Text>
                    </View>
                    <View className="flex-1 px-2 py-2">
                      <Text className="text-sm font-semibold text-gray-900">
                        {selectedItemData?.comp_a_remarks || 'No remarks'}
                      </Text>
                    </View>
                  </View>

                  {/* Row - Component B */}
                  <View className="flex-row border-t border-gray-300">
                    <View className="w-40 px-2 py-2 border-r border-gray-300">
                      <Text className="text-sm font-medium text-gray-700">Component B</Text>
                      <Text className="text-sm font-semibold text-gray-900">
                        {selectedItemData?.comp_b_qty || 'N/A'}
                      </Text>
                    </View>
                    <View className="flex-1 px-2 py-2">
                      <Text className="text-sm font-semibold text-gray-900">
                        {selectedItemData?.comp_b_remarks || 'No remarks'}
                      </Text>
                    </View>
                  </View>

                  {/* Row - Component C */}
                  <View className="flex-row border-t border-gray-300">
                    <View className="w-40 px-2 py-2 border-r border-gray-300">
                      <Text className="text-sm font-medium text-gray-700">Component C</Text>
                      <Text className="text-sm font-semibold text-gray-900">
                        {selectedItemData?.comp_c_qty || 'N/A'}
                      </Text>
                    </View>
                    <View className="flex-1 px-2 py-2">
                      <Text className="text-sm font-semibold text-gray-900">
                        {selectedItemData?.comp_c_remarks || 'No remarks'}
                      </Text>
                    </View>
                  </View>
                </View>

                
                
              </View>
            </View>

            

            <Button
            mode="contained"
            onPress={() => console.log('Pressed')}
            buttonColor="#1e7a6f"   // background color
            textColor="#ffffff"     // text color
            style={{ borderRadius: 8, margin: 10 }} // optional style
            >
            Update
            </Button>
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}