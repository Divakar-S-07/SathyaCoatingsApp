import React, { useState, useCallback } from 'react';
import {
  Modal,
  ScrollView,
  Image,
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

// Constants
const COLORS = {
  primary: '#0f766e',
  primaryDark: '#134e4a',
  secondary: '#64748b',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  text: '#1f2937',
  textSecondary: '#6b7280',
  textLight: '#9ca3af',
  background: '#ffffff',
  surface: '#f8fafc',
  border: '#e5e7eb',
  borderLight: '#f3f4f6',
  overlay: 'rgba(0, 0, 0, 0.6)',
  white: '#ffffff',
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

/**
 * Professional View Modal Component
 * Displays detailed work item information in a clean, organized layout
 */
export default function ViewModel({ visible, onClose, workItem, onEdit, onDelete }) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Handle image loading states
  const handleImageLoad = useCallback(() => {
    setImageLoading(false);
  }, []);

  const handleImageError = useCallback(() => {
    setImageLoading(false);
    setImageError(true);
  }, []);

  // Handle edit action
  const handleEdit = useCallback(() => {
    if (onEdit && workItem) {
      onEdit(workItem);
      onClose();
    }
  }, [onEdit, workItem, onClose]);

  // Handle delete action with confirmation
  const handleDelete = useCallback(() => {
    if (!onDelete || !workItem) return;

    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${workItem.name || 'this item'}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete(workItem);
            onClose();
          },
        },
      ]
    );
  }, [onDelete, workItem, onClose]);

  // Default image when no image is provided or error occurs
  const getImageSource = () => {
    if (imageError || !workItem?.image) {
      return { uri: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&q=80' };
    }
    return { uri: workItem.image };
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  // Render info row
  const renderInfoRow = (label, value, icon = null) => (
    <View style={styles.infoRow}>
      <View style={styles.infoLabel}>
        {icon && (
          <Ionicons 
            name={icon} 
            size={16} 
            color={COLORS.textSecondary} 
            style={styles.infoIcon} 
          />
        )}
        <Text style={styles.infoLabelText}>{label}</Text>
      </View>
      <Text style={styles.infoSeparator}>:</Text>
      <Text style={styles.infoValue}>{value || 'Not specified'}</Text>
    </View>
  );

  // Render action buttons
  const renderActionButtons = () => (
    <View style={styles.actionButtonsContainer}>
      {onEdit && (
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={handleEdit}
          activeOpacity={0.8}
        >
          <Feather name="edit-2" size={18} color={COLORS.white} />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
      )}
      
      {onDelete && (
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={handleDelete}
          activeOpacity={0.8}
        >
          <Feather name="trash-2" size={18} color={COLORS.white} />
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      )}
      
      <TouchableOpacity
        style={[styles.actionButton, styles.shareButton]}
        onPress={() => {
          // Implement share functionality
          Alert.alert('Share', 'Share functionality can be implemented here');
        }}
        activeOpacity={0.8}
      >
        <Feather name="share-2" size={18} color={COLORS.white} />
        <Text style={styles.actionButtonText}>Share</Text>
      </TouchableOpacity>
    </View>
  );

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={onClose}
        >
          <TouchableOpacity
            style={styles.modalContent}
            activeOpacity={1}
            onPress={e => e.stopPropagation()}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                onPress={onClose}
                style={styles.backButton}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={24} color={COLORS.white} />
              </TouchableOpacity>
              
              <View style={styles.headerTitleContainer}>
                <Text style={styles.headerTitle} numberOfLines={1}>
                  {workItem?.name || workItem?.title || 'Work Details'}
                </Text>
                {workItem?.id && (
                  <Text style={styles.headerSubtitle}>
                    ID: {workItem.id}
                  </Text>
                )}
              </View>

              <View style={styles.headerActions}>
                <TouchableOpacity
                  style={styles.headerActionButton}
                  activeOpacity={0.7}
                >
                  <Ionicons name="bookmark-outline" size={20} color={COLORS.white} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView
              style={styles.scrollContainer}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Image Section */}
              <View style={styles.imageContainer}>
                <Image
                  source={getImageSource()}
                  style={styles.workImage}
                  resizeMode="cover"
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                />
                {imageLoading && (
                  <View style={styles.imageLoadingOverlay}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                  </View>
                )}
                {imageError && (
                  <View style={styles.imageErrorOverlay}>
                    <Ionicons name="image-outline" size={48} color={COLORS.textLight} />
                    <Text style={styles.imageErrorText}>Image not available</Text>
                  </View>
                )}
              </View>

              {/* Work Information Section */}
              <View style={styles.infoSection}>
                <View style={styles.sectionHeader}>
                  <MaterialIcons name="info-outline" size={24} color={COLORS.primary} />
                  <Text style={styles.sectionTitle}>Work Information</Text>
                </View>

                <View style={styles.infoContainer}>
                  {renderInfoRow('Description', workItem?.description, 'document-text-outline')}
                  {renderInfoRow('Date Completed', formatDate(workItem?.dateCompleted), 'calendar-outline')}
                  {renderInfoRow('Quantity', workItem?.quantity, 'cube-outline')}
                  {renderInfoRow('Status', workItem?.status || 'Completed', 'checkmark-circle-outline')}
                  {renderInfoRow('Priority', workItem?.priority || 'Medium', 'flag-outline')}
                  {renderInfoRow('Category', workItem?.category || 'Construction', 'folder-outline')}
                </View>
              </View>

              {/* Additional Details Section */}
              {(workItem?.notes || workItem?.location || workItem?.assignedTo) && (
                <View style={styles.infoSection}>
                  <View style={styles.sectionHeader}>
                    <MaterialIcons name="more-horiz" size={24} color={COLORS.primary} />
                    <Text style={styles.sectionTitle}>Additional Details</Text>
                  </View>

                  <View style={styles.infoContainer}>
                    {workItem?.location && renderInfoRow('Location', workItem.location, 'location-outline')}
                    {workItem?.assignedTo && renderInfoRow('Assigned To', workItem.assignedTo, 'person-outline')}
                    {workItem?.notes && renderInfoRow('Notes', workItem.notes, 'chatbox-outline')}
                  </View>
                </View>
              )}

              {/* Action Buttons */}
              {(onEdit || onDelete) && renderActionButtons()}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
  },

  overlayTouchable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },

  modalContent: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    width: '100%',
    maxWidth: 420,
    maxHeight: screenHeight * 0.9,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.primary,
  },

  backButton: {
    padding: SPACING.sm,
    marginRight: SPACING.sm,
  },

  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
    textAlign: 'center',
  },

  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },

  headerActions: {
    flexDirection: 'row',
  },

  headerActionButton: {
    padding: SPACING.sm,
    marginLeft: SPACING.sm,
  },

  scrollContainer: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: SPACING.xl,
  },

  imageContainer: {
    position: 'relative',
    height: 240,
    backgroundColor: COLORS.surface,
  },

  workImage: {
    width: '100%',
    height: '100%',
  },

  imageLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },

  imageErrorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },

  imageErrorText: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: SPACING.sm,
  },

  infoSection: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: SPACING.sm,
  },

  infoContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },

  infoRow: {
    flexDirection: 'row',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    alignItems: 'flex-start',
  },

  infoLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 120,
    marginRight: SPACING.sm,
  },

  infoIcon: {
    marginRight: SPACING.xs,
  },

  infoLabelText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
    flex: 1,
  },

  infoSeparator: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginRight: SPACING.sm,
  },

  infoValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    lineHeight: 20,
  },

  actionButtonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    gap: SPACING.sm,
  },

  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  editButton: {
    backgroundColor: COLORS.primary,
  },

  deleteButton: {
    backgroundColor: COLORS.error,
  },

  shareButton: {
    backgroundColor: COLORS.secondary,
  },

  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
    marginLeft: SPACING.xs,
  },
});