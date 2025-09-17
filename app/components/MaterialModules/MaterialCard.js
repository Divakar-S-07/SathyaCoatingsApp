import React from 'react';
import { TouchableOpacity, View, Text, Image, TextInput } from 'react-native';
import { Button, Modal } from 'react-native-paper'; // Better styled than RN Button
import Ionicons from '@expo/vector-icons/Ionicons';


const MaterialCard = ({ itemId, onView, onUpdate, image, itemName, onUsage }) => {
  return (
    
    
    <TouchableOpacity
      onPress={onView}
      style={{
        width: '48%',
        marginBottom: 20,
        marginHorizontal: '1%',
        borderRadius: 10,
        backgroundColor: '#f8fafc',
        shadowColor: '#6366f1',
        shadowOffset: {
          width: 0,
          height: 8,
        },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
        borderWidth: 2,
        borderColor: '#e2e8f0',
        overflow: 'hidden'
      }}
    >
      {/* Gradient Header */}
      <View style={{
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: '#f8fafc',
      position: 'relative',
      height: 48,
      borderBottomWidth: 1,
      borderColor: "#ccc",
      // shadowColor: '#000',
      // shadowOffset: {
      //   width: 0,
      //   height: 2,
      // },
      // shadowOpacity: 0.1,
      // shadowRadius: 3,
      elevation: 1,
    }}>

      <Text style={{
        fontWeight: '600',
        textAlign: 'center',
        color: '#1f2937',
        fontSize: 10,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
      }}>
        {/* Item {itemId} */}
        {itemName}
      </Text>
    </View>

      {/* Card Image */}
      <View style={{
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
        paddingVertical: 16,
        backgroundColor: 'white',
        marginHorizontal: 8,
        marginTop: 8,
        borderRadius: 16
      }}>
        {/* <Image
          source={{
            uri: image
          }}
          style={{
            width: '100%',
            height: 60,
            borderRadius: 8
          }}
          resizeMode="contain"
        /> */}
        
        <Ionicons name="document-text-outline" size={18} color="#1e7a6f" />
      </View>

      {/* Footer */}
      <View style={{ padding: 10 }}>
        <TouchableOpacity
          // onPress={onUpdate}
          style={{
            paddingVertical: 8,
            borderRadius: 8,
            // backgroundColor: "#1e7a6f",
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
          }}
          className="border border-[#1e7a6f] "
          onPress={() => onUsage(itemId)}

        >
          <Ionicons
            name="create-outline"
            size={16}
            color="#1e7a6f"
            style={{ marginRight: 6 }}
          />
          <Text style={{
            fontSize: 12,
            fontWeight: "600",
            textAlign: "center",
            color: "#1e7a6f"
          }}>
            Usage
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export default MaterialCard;