import React, { useState } from 'react';
import { TouchableOpacity, View, Text, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const LabourCard = ({ itemId, onView, itemName, phone, status, onUsage }) => {
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  
  // Get status color and icon based on attendance status
  const getStatusDisplay = (status) => {
    switch(status) {
      case 'present':
        return { color: '#059669', icon: 'checkmark-circle', text: 'Present' };
      case 'absent':
        return { color: '#dc2626', icon: 'close-circle', text: 'Absent' };
      case 'on_leave':
        return { color: '#d97706', icon: 'time', text: 'On Leave' };
      default:
        return { color: '#6b7280', icon: 'help-circle', text: 'Not Marked' };
    }
  };

  const statusDisplay = getStatusDisplay(status);

  const attendanceOptions = [
    { key: 'present', label: 'Present', icon: 'checkmark-circle', color: '#059669' },
    { key: 'absent', label: 'Absent', icon: 'close-circle', color: '#dc2626' },
    { key: 'on_leave', label: 'On Leave', icon: 'time', color: '#d97706' },
  ];

  const handleAttendanceSelect = (attendanceType) => {
    console.log(`Marking ${itemName} (ID: ${itemId}) as ${attendanceType}`);
    onUsage(itemId, attendanceType); // Pass both ID and attendance type
    setShowAttendanceModal(false);
  };

  return (
    <>
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
        {/* Header */}
        <View style={{
          paddingHorizontal: 16,
          paddingVertical: 8,
          backgroundColor: '#f8fafc',
          position: 'relative',
          height: 48,
          borderBottomWidth: 1,
          borderColor: "#ccc",
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
            ID: {itemId}
          </Text>
        </View>

        {/* Card Content */}
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
          {/* Labour Icon */}
          <Ionicons name="person-outline" size={24} color="#1e7a6f" />
          
          {/* Labour Name */}
          <Text style={{
            fontSize: 14,
            fontWeight: '600',
            color: '#1f2937',
            textAlign: 'center',
            marginTop: 8,
            marginBottom: 4,
          }}>
            {itemName || 'Unknown'}
          </Text>

          {/* Phone Number */}
          {phone && (
            <Text style={{
              fontSize: 12,
              color: '#6b7280',
              textAlign: 'center',
              marginBottom: 8,
            }}>
              {phone}
            </Text>
          )}

          {/* Status Badge */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: statusDisplay.color + '20',
            borderRadius: 12,
            paddingHorizontal: 8,
            paddingVertical: 4,
          }}>
            <Ionicons 
              name={statusDisplay.icon} 
              size={12} 
              color={statusDisplay.color} 
              style={{ marginRight: 4 }}
            />
            <Text style={{
              fontSize: 10,
              fontWeight: '600',
              color: statusDisplay.color,
              textTransform: 'uppercase',
            }}>
              {statusDisplay.text}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={{ padding: 10 }}>
          <TouchableOpacity
            style={{
              paddingVertical: 8,
              borderRadius: 8,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: "#1e7a6f",
            }}
            onPress={() => setShowAttendanceModal(true)}
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
              Mark Attendance
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* Attendance Selection Modal */}
      <Modal
        visible={showAttendanceModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAttendanceModal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 20,
        }}>
          <View style={{
            backgroundColor: 'white',
            borderRadius: 16,
            padding: 20,
            width: '100%',
            maxWidth: 300,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.25,
            shadowRadius: 20,
            elevation: 10,
          }}>
            {/* Modal Header */}
            <View style={{
              alignItems: 'center',
              marginBottom: 20,
              paddingBottom: 15,
              borderBottomWidth: 1,
              borderBottomColor: '#e5e7eb',
            }}>
              <Ionicons name="person-outline" size={32} color="#1e7a6f" />
              <Text style={{
                fontSize: 16,
                fontWeight: '700',
                color: '#1f2937',
                marginTop: 8,
                textAlign: 'center',
              }}>
                Mark Attendance
              </Text>
              <Text style={{
                fontSize: 14,
                color: '#6b7280',
                marginTop: 4,
                textAlign: 'center',
              }}>
                {itemName} (ID: {itemId})
              </Text>
            </View>

            {/* Attendance Options */}
            <View style={{ marginBottom: 20 }}>
              {attendanceOptions.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  onPress={() => handleAttendanceSelect(option.key)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    borderRadius: 8,
                    marginBottom: 8,
                    backgroundColor: option.color + '10',
                    borderWidth: 1,
                    borderColor: option.color + '30',
                  }}
                >
                  <Ionicons 
                    name={option.icon} 
                    size={20} 
                    color={option.color}
                    style={{ marginRight: 12 }}
                  />
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: option.color,
                    flex: 1,
                  }}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Cancel Button */}
            <TouchableOpacity
              onPress={() => setShowAttendanceModal(false)}
              style={{
                paddingVertical: 12,
                paddingHorizontal: 24,
                borderRadius: 8,
                backgroundColor: '#f3f4f6',
                alignItems: 'center',
              }}
            >
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: '#6b7280',
              }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default LabourCard;