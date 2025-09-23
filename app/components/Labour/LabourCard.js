import React, { useState } from 'react';
import { TouchableOpacity, View, Text, Modal, Platform, TextInput, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

const LabourCard = ({ itemId, onView, itemName, phone, status, onUsage, totalShifts = 0 }) => {
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedShift, setSelectedShift] = useState('');
  const [attendanceStatus, setAttendanceStatus] = useState('');
  const [remarks, setRemarks] = useState('');
  
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

  const attendanceStatusOptions = [
    { key: 'present', label: 'Present', icon: 'checkmark-circle', color: '#059669' },
    { key: 'absent', label: 'Absent', icon: 'close-circle', color: '#dc2626' },
    { key: 'late', label: 'Late', icon: 'time-outline', color: '#f59e0b' },
    { key: 'on_leave', label: 'On Leave', icon: 'calendar-outline', color: '#d97706' },
    { key: 'half_day', label: 'Half Day', icon: 'pause-circle', color: '#6366f1' },
  ];

  const handleDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleAttendanceSubmit = () => {
    // Validation
    if (!selectedShift.trim()) {
      Alert.alert('Validation Error', 'Please enter shift hours');
      return;
    }

    // Validate numeric input
    const shiftValue = parseFloat(selectedShift.trim());
    if (isNaN(shiftValue) || shiftValue <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid positive number for shift hours');
      return;
    }

    if (!attendanceStatus) {
      Alert.alert('Validation Error', 'Please select attendance status');
      return;
    }

    if (!remarks.trim()) {
      Alert.alert('Validation Error', 'Please enter remarks');
      return;
    }

    const attendanceData = {
      labourId: itemId,
      labourName: itemName,
      date: selectedDate.toISOString().split('T')[0],
      shift: shiftValue, // Store as number
      status: attendanceStatus,
      remarks: remarks.trim(),
      timestamp: new Date().toISOString()
    };
    
    console.log(`Marking attendance for ${itemName} (ID: ${itemId}):`, attendanceData);
    
    // Call the parent component's usage handler
    if (onUsage) {
      onUsage(attendanceData);
    }

    // Reset form
    setSelectedShift('');
    setAttendanceStatus('');
    setRemarks('');
    setShowAttendanceModal(false);
    
    Alert.alert('Success', `Attendance marked for ${itemName}!\nCurrent shift: ${shiftValue} hours\nNew total: ${(totalShifts + shiftValue).toFixed(1)} hours`);
  };

  const clearForm = () => {
    setSelectedShift('');
    setAttendanceStatus('');
    setRemarks('');
    setSelectedDate(new Date());
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

      {/* Attendance Modal */}
      <Modal
        visible={showAttendanceModal}
        transparent={true}
        animationType="slide"
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
            maxWidth: 400,
            maxHeight: '90%',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.25,
            shadowRadius: 20,
            elevation: 10,
          }}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Modal Header */}
              <View style={{
                alignItems: 'center',
                marginBottom: 20,
                paddingBottom: 15,
                borderBottomWidth: 1,
                borderBottomColor: '#e5e7eb',
              }}>
                <Ionicons name="clipboard-outline" size={32} color="#1e7a6f" />
                <Text style={{
                  fontSize: 18,
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

              {/* Date Selection */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: 8,
                }}>
                  Attendance Date
                </Text>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    borderRadius: 8,
                    backgroundColor: '#f9fafb',
                    borderWidth: 1,
                    borderColor: '#d1d5db',
                  }}
                >
                  <Ionicons name="calendar-outline" size={20} color="#6b7280" style={{ marginRight: 12 }} />
                  <Text style={{
                    fontSize: 16,
                    color: '#1f2937',
                    flex: 1,
                  }}>
                    {selectedDate.toLocaleDateString()}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>

              {/* Date Picker */}
              {showDatePicker && (
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                />
              )}

              {/* Previous Total Shifts (Read-only) */}
              {/* <View style={{ marginBottom: 20 }}>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: 8,
                }}>
                  Previous Total Shift Hours
                </Text>
                <View style={{
                  borderWidth: 1,
                  borderColor: '#e5e7eb',
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  backgroundColor: '#f9fafb',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="time-outline" size={20} color="#6b7280" style={{ marginRight: 8 }} />
                    <Text style={{
                      fontSize: 16,
                      fontWeight: '600',
                      color: '#1f2937',
                    }}>
                      Total: {totalShifts} hours
                    </Text>
                  </View>
                  <View style={{
                    backgroundColor: '#e5e7eb',
                    borderRadius: 12,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                  }}>
                    <Text style={{
                      fontSize: 10,
                      color: '#6b7280',
                      fontWeight: '500',
                      textTransform: 'uppercase',
                    }}>
                      Read Only
                    </Text>
                  </View>
                </View>
                <Text style={{
                  fontSize: 12,
                  color: '#6b7280',
                  marginTop: 4,
                  fontStyle: 'italic',
                }}>
                  Cumulative hours worked from all previous attendance records
                </Text>
              </View> */}

              {/* Numeric Shift Input */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: 8,
                }}>
                  Shift Hours <Text style={{ color: '#dc2626' }}>*</Text>
                </Text>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: '#d1d5db',
                    borderRadius: 8,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    fontSize: 16,
                    backgroundColor: '#f9fafb',
                    color: '#1f2937',
                    textAlign: 'center',
                  }}
                  placeholder="Enter shift hours (e.g., 1, 2, 1.5)"
                  placeholderTextColor="#9ca3af"
                  value={selectedShift}
                  onChangeText={setSelectedShift}
                  keyboardType="numeric"
                />
                <Text style={{
                  fontSize: 12,
                  color: '#6b7280',
                  marginTop: 4,
                  textAlign: 'center',
                  fontStyle: 'italic',
                }}>
                  Examples: 1, 2, 1.5, 0.5 (hours worked)
                </Text>
              </View>

              {/* Attendance Status Selection */}
              {/* <View style={{ marginBottom: 20 }}>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: 12,
                }}>
                  Attendance Status <Text style={{ color: '#dc2626' }}>*</Text>
                </Text>
                <View style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: 8,
                }}>
                  {attendanceStatusOptions.map((option) => (
                    <TouchableOpacity
                      key={option.key}
                      onPress={() => setAttendanceStatus(option.key)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        borderRadius: 20,
                        backgroundColor: attendanceStatus === option.key ? option.color + '20' : '#f9fafb',
                        borderWidth: attendanceStatus === option.key ? 2 : 1,
                        borderColor: attendanceStatus === option.key ? option.color : '#e5e7eb',
                        minWidth: '45%',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons 
                        name={option.icon} 
                        size={14} 
                        color={option.color}
                        style={{ marginRight: 6 }}
                      />
                      <Text style={{
                        fontSize: 12,
                        fontWeight: attendanceStatus === option.key ? '600' : '400',
                        color: attendanceStatus === option.key ? option.color : '#374151',
                      }}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View> */}

              {/* Remarks Input */}
              <View style={{ marginBottom: 30 }}>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: 8,
                }}>
                  Remarks <Text style={{ color: '#dc2626' }}>*</Text>
                </Text>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: '#d1d5db',
                    borderRadius: 8,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    fontSize: 14,
                    backgroundColor: '#f9fafb',
                    color: '#1f2937',
                    height: 80,
                    textAlignVertical: 'top',
                    marginBottom: 10,
                  }}
                  placeholder="Enter attendance remarks, notes, or any special observations..."
                  placeholderTextColor="#9ca3af"
                  value={remarks}
                  onChangeText={setRemarks}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Action Buttons - Professional Layout */}
              <View style={{ marginTop: 20 }}>
                {/* Secondary Actions Row */}
                <View style={{
                  flexDirection: 'row',
                  marginBottom: 15,
                  gap: 15,
                }}>
                  <TouchableOpacity
                    onPress={clearForm}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      paddingHorizontal: 20,
                      borderRadius: 12,
                      backgroundColor: 'transparent',
                      borderWidth: 1.5,
                      borderColor: '#e2e8f0',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}>
                      <Ionicons 
                        name="refresh-outline" 
                        size={16} 
                        color="#64748b" 
                        style={{ marginRight: 6 }}
                      />
                      <Text style={{
                        fontSize: 14,
                        fontWeight: '500',
                        color: '#64748b',
                      }}>
                        Clear
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setShowAttendanceModal(false)}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      paddingHorizontal: 20,
                      borderRadius: 12,
                      backgroundColor: 'transparent',
                      borderWidth: 1.5,
                      borderColor: '#e2e8f0',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}>
                      <Ionicons 
                        name="close-outline" 
                        size={16} 
                        color="#64748b" 
                        style={{ marginRight: 6 }}
                      />
                      <Text style={{
                        fontSize: 14,
                        fontWeight: '500',
                        color: '#64748b',
                      }}>
                        Cancel
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Primary Action */}
                <TouchableOpacity
                  onPress={handleAttendanceSubmit}
                  style={{
                    width: '100%',
                    paddingVertical: 16,
                    paddingHorizontal: 24,
                    borderRadius: 12,
                    backgroundColor: '#1e7a6f',
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: '#1e7a6f',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.15,
                    shadowRadius: 12,
                    elevation: 4,
                  }}
                >
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}>
                    <Ionicons 
                      name="checkmark-circle" 
                      size={18} 
                      color="white" 
                      style={{ marginRight: 8 }}
                    />
                    <Text style={{
                      fontSize: 16,
                      fontWeight: '600',
                      color: 'white',
                      letterSpacing: 0.5,
                    }}>
                      Mark Attendance
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default LabourCard;