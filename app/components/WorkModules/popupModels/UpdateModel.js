import React, { useState, useEffect, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { TextInput } from "react-native-paper";
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import Toast from "react-native-toast-message";

// Constants
const COLORS = {
  primary: '#2563eb',
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  text: '#1f2937',
  textSecondary: '#6b7280',
  background: '#ffffff',
  surface: '#f9fafb',
  border: '#e5e7eb',
  overlay: 'rgba(0, 0, 0, 0.5)',
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

/**
 * Professional Update Modal Component
 * Handles item updates with proper form validation and user feedback
 */
const UpdateModal = ({ 
  visible, 
  onClose, 
  item = null,
  onUpdate = null,
  isLoading = false 
}) => {
  // Form state
  const [formData, setFormData] = useState({
    stockId: '',
    movementType: '',
    quantity: '',
    date: '',
    reasonNote: '',
    updatedBy: '',
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Movement type options
  const movementTypes = [
    { value: 'IN', label: 'Stock In' },
    { value: 'OUT', label: 'Stock Out' },
    { value: 'TRANSFER', label: 'Transfer' },
    { value: 'ADJUSTMENT', label: 'Adjustment' },
  ];

  // Initialize form data when item changes
  useEffect(() => {
    if (item && visible) {
      setFormData({
        stockId: item.id?.toString() || '',
        movementType: item.movementType || '',
        quantity: item.quantity?.toString() || '',
        date: item.date || new Date().toISOString().split('T')[0],
        reasonNote: item.reasonNote || '',
        updatedBy: item.updatedBy || 'Current User',
      });
      setErrors({});
    }
  }, [item, visible]);

  // Form validation
  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.stockId.trim()) {
      newErrors.stockId = 'Stock ID is required';
    }

    if (!formData.movementType.trim()) {
      newErrors.movementType = 'Movement type is required';
    }

    if (!formData.quantity.trim()) {
      newErrors.quantity = 'Quantity is required';
    } else if (isNaN(Number(formData.quantity)) || Number(formData.quantity) <= 0) {
      newErrors.quantity = 'Quantity must be a positive number';
    }

    if (!formData.date.trim()) {
      newErrors.date = 'Date is required';
    }

    if (!formData.reasonNote.trim()) {
      newErrors.reasonNote = 'Reason note is required';
    }

    if (!formData.updatedBy.trim()) {
      newErrors.updatedBy = 'Updated by field is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Handle input changes
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please fix the errors before submitting',
        position: 'top',
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Simulate API call
      if (onUpdate) {
        await onUpdate({ ...item, ...formData });
      }

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Details updated successfully',
        position: 'top',
      });

      onClose();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: error.message || 'Something went wrong',
        position: 'top',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, onUpdate, item, onClose]);

  // Handle cancel with confirmation if form is dirty
  const handleCancel = useCallback(() => {
    const hasChanges = Object.keys(formData).some(key => 
      formData[key] !== (item?.[key]?.toString() || '')
    );

    if (hasChanges) {
      Alert.alert(
        'Discard Changes',
        'You have unsaved changes. Are you sure you want to close?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { 
            text: 'Discard', 
            style: 'destructive',
            onPress: onClose 
          },
        ]
      );
    } else {
      onClose();
    }
  }, [formData, item, onClose]);

  // Render input field with error handling
  const renderTextInput = ({
    field,
    label,
    placeholder,
    keyboardType = 'default',
    multiline = false,
    numberOfLines = 1,
    icon = null,
  }) => (
    <View style={styles.inputContainer}>
      <TextInput
        mode="outlined"
        label={label}
        placeholder={placeholder}
        value={formData[field]}
        onChangeText={(value) => handleInputChange(field, value)}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={numberOfLines}
        error={!!errors[field]}
        style={styles.textInput}
        theme={{
          colors: {
            primary: COLORS.primary,
            error: COLORS.error,
          },
        }}
        left={icon ? <TextInput.Icon icon={icon} /> : undefined}
        disabled={isSubmitting || isLoading}
      />
      {errors[field] && (
        <Text style={styles.errorText}>{errors[field]}</Text>
      )}
    </View>
  );

  if (!visible) return null;

  return (
    <>
      <Modal
        visible={visible}
        animationType="fade"
        transparent
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <MaterialIcons 
                    name="edit" 
                    size={24} 
                    color={COLORS.primary} 
                  />
                  <Text style={styles.title}>Update Item</Text>
                </View>
                <TouchableOpacity
                  onPress={handleCancel}
                  style={styles.closeButton}
                  disabled={isSubmitting || isLoading}
                >
                  <AntDesign name="close" size={24} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Form Content */}
              <ScrollView 
                style={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                {renderTextInput({
                  field: 'stockId',
                  label: 'Stock ID *',
                  placeholder: 'Enter stock identifier',
                  icon: 'barcode-scan',
                })}

                {renderTextInput({
                  field: 'movementType',
                  label: 'Movement Type *',
                  placeholder: 'Select movement type',
                  icon: 'swap-horizontal',
                })}

                {renderTextInput({
                  field: 'quantity',
                  label: 'Quantity *',
                  placeholder: 'Enter quantity',
                  keyboardType: 'numeric',
                  icon: 'counter',
                })}

                {renderTextInput({
                  field: 'date',
                  label: 'Date *',
                  placeholder: 'YYYY-MM-DD',
                  icon: 'calendar',
                })}

                {renderTextInput({
                  field: 'reasonNote',
                  label: 'Reason Note *',
                  placeholder: 'Enter reason for update',
                  multiline: true,
                  numberOfLines: 3,
                  icon: 'note-text',
                })}

                {renderTextInput({
                  field: 'updatedBy',
                  label: 'Updated By *',
                  placeholder: 'Enter your name',
                  icon: 'account',
                })}
              </ScrollView>

              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  onPress={handleCancel}
                  style={[styles.button, styles.cancelButton]}
                  disabled={isSubmitting || isLoading}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSubmit}
                  style={[
                    styles.button, 
                    styles.submitButton,
                    (isSubmitting || isLoading) && styles.buttonDisabled
                  ]}
                  disabled={isSubmitting || isLoading}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color={COLORS.background} />
                  ) : (
                    <>
                      <MaterialIcons 
                        name="check" 
                        size={20} 
                        color={COLORS.background} 
                      />
                      <Text style={styles.submitButtonText}>Update</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      
      {/* Toast positioned outside modal to ensure visibility */}
      <Toast />
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
  },

  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },

  modalContent: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    maxHeight: '90%',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: SPACING.sm,
  },

  closeButton: {
    padding: SPACING.sm,
    borderRadius: 8,
  },

  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
  },

  inputContainer: {
    marginBottom: SPACING.lg,
  },

  textInput: {
    backgroundColor: COLORS.background,
  },

  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: SPACING.xs,
    marginLeft: SPACING.sm,
  },

  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.md,
  },

  button: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 48,
  },

  cancelButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },

  submitButton: {
    backgroundColor: COLORS.primary,
    elevation: 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.background,
    marginLeft: SPACING.xs,
  },

  buttonDisabled: {
    opacity: 0.6,
  },
});

export default UpdateModal;