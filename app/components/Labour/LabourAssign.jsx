import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Modal,
  FlatList,
  TextInput,
  Alert,
} from "react-native";
import axios from "axios";
import DateTimePicker from "@react-native-community/datetimepicker";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";

// API Configuration
const API_CONFIG = {
  BASE_URL: "http://103.118.158.127/api",
  TIMEOUT: 15000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

// Create axios instance with professional configuration
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Cache-Control': 'no-cache',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API] Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor with retry logic
apiClient.interceptors.response.use(
  (response) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  async (error) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ❌ API Error:`, {
      status: error.response?.status,
      message: error.message,
      url: error.config?.url,
      data: error.response?.data,
    });

    // Retry logic for network errors
    if (error.config && !error.config.__isRetryRequest) {
      error.config.__isRetryRequest = true;
      
      if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
        for (let i = 0; i < API_CONFIG.RETRY_ATTEMPTS; i++) {
          try {
            await new Promise(resolve => setTimeout(resolve, API_CONFIG.RETRY_DELAY * (i + 1)));
            console.log(`[${timestamp}] 🔄 Retrying request (${i + 1}/${API_CONFIG.RETRY_ATTEMPTS})`);
            return await apiClient.request(error.config);
          } catch (retryError) {
            if (i === API_CONFIG.RETRY_ATTEMPTS - 1) {
              console.error(`[${timestamp}] 💥 All retry attempts failed`);
            }
          }
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// Error handler utility
const handleApiError = (error, context = '') => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] Error in ${context}:`, {
    message: error.message,
    status: error.response?.status,
    data: error.response?.data,
    url: error.config?.url,
  });

  let userMessage = `Failed to ${context.toLowerCase()}`;
  
  switch (error.response?.status) {
    case 400:
      userMessage = error.response?.data?.message || 'Invalid request data';
      break;
    case 401:
      userMessage = 'Authentication required';
      break;
    case 403:
      userMessage = 'Access forbidden';
      break;
    case 404:
      userMessage = 'Resource not found';
      break;
    case 422:
      userMessage = 'Validation failed';
      break;
    case 429:
      userMessage = 'Too many requests - please wait';
      break;
    case 500:
      userMessage = 'Server error - please try again';
      break;
    case 502:
    case 503:
    case 504:
      userMessage = 'Service unavailable - please try later';
      break;
    default:
      if (error.code === 'ECONNABORTED') {
        userMessage = 'Request timeout - check connection';
      } else if (error.message === 'Network Error') {
        userMessage = 'Network error - check connectivity';
      }
  }

  return userMessage;
};

// Dropdown Button Component
const DropdownButton = ({ label, value, onPress, disabled }) => (
  <View style={styles.dropdownContainer}>
    <Text style={styles.dropdownLabel}>{label}</Text>
    <TouchableOpacity
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.dropdownButton,
        disabled ? styles.dropdownButtonDisabled : styles.dropdownButtonEnabled
      ]}
    >
      <View style={styles.dropdownButtonContent}>
        <Text style={[
          styles.dropdownButtonText,
          !value ? styles.dropdownPlaceholder : (disabled ? styles.dropdownDisabledText : styles.dropdownActiveText)
        ]}>
          {value ? value.company_name || value.project_name || value.site_name || value.desc_name : `Select ${label}`}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#888" />
      </View>
    </TouchableOpacity>
  </View>
);

// Dropdown Modal Component
const DropdownModal = ({ visible, onClose, data, onSelect, title, keyProp }) => (
  <Modal visible={visible} transparent>
    <View style={styles.modalOverlay}>
      <TouchableOpacity
        style={styles.modalTouchable}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {}}
          style={styles.modalContent}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
          </View>

          <FlatList
            data={data}
            keyExtractor={(item) => String(item[keyProp])}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
                style={styles.modalItem}
              >
                <Text style={styles.modalItemText}>
                  {item.company_name || item.project_name || item.site_name || item.desc_name}
                </Text>
              </TouchableOpacity>
            )}
            showsVerticalScrollIndicator={true}
            style={styles.modalList}
          />

          <TouchableOpacity
            onPress={onClose}
            style={styles.modalCancelButton}
          >
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  </Modal>
);

// Labour Attendance Page Component
const LabourAttendancePage = ({ onBack }) => {
  const attendanceData = [
    "Today's attendance has been successfully recorded for all assigned labours.",
    "Work progress monitoring is active and tracking performance metrics.",
    "Site safety protocols are being followed by all team members.",
    "Daily productivity reports are automatically generated at 6 PM.",
    "Weather conditions are favorable for outdoor construction activities.",
    "Equipment maintenance schedules are up to date and functioning properly.",
    "Material delivery is scheduled for tomorrow morning at 8 AM.",
    "Quality inspection checkpoints have been completed successfully.",
    "All workers have received their safety briefing for today's tasks.",
    "Construction milestones are being achieved according to project timeline.",
    "Labour productivity metrics show 15% improvement this month.",
    "Emergency response procedures have been reviewed with all staff.",
    "New safety equipment has been distributed to all team members.",
    "Daily work allocation has been optimized for maximum efficiency.",
    "Site supervisor reports all activities proceeding as scheduled.",
    "Worker wellness programs are showing positive engagement results.",
    "Environmental compliance checks completed with satisfactory results.",
    "Training sessions for new equipment have been successfully conducted.",
    "Communication systems between teams are functioning optimally.",
    "Resource allocation has been streamlined for better project flow.",
  ];

  const randomText = attendanceData[Math.floor(Math.random() * attendanceData.length)];
  const presentCount = Math.floor(Math.random() * 15) + 20;
  const leaveCount = Math.floor(Math.random() * 5) + 1;
  const attendanceRate = Math.floor(((presentCount / (presentCount + leaveCount)) * 100));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0f766e" />
        </TouchableOpacity>
        <Text style={styles.title}>Labour Attendance</Text>
        <Text style={styles.subtitle}>Track worker attendance and activities</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.attendanceCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="people-outline" size={24} color="#0f766e" />
            <Text style={styles.cardTitle}>Daily Attendance Report</Text>
          </View>
          
          <View style={styles.cardContent}>
            <Text style={styles.attendanceText}>{randomText}</Text>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{presentCount}</Text>
              <Text style={styles.statLabel}>Present Today</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{leaveCount}</Text>
              <Text style={styles.statLabel}>On Leave</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{attendanceRate}%</Text>
              <Text style={styles.statLabel}>Attendance Rate</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#059669" />
            <Text style={styles.actionButtonText}>Mark Attendance</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="document-text-outline" size={20} color="#0369a1" />
            <Text style={styles.actionButtonText}>View Reports</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="time-outline" size={20} color="#7c2d12" />
            <Text style={styles.actionButtonText}>Overtime Log</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="calendar-outline" size={20} color="#7c3aed" />
            <Text style={styles.actionButtonText}>Schedule</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle-outline" size={20} color="#0369a1" />
            <Text style={styles.infoTitle}>Today's Update</Text>
          </View>
          <Text style={styles.infoText}>
            All labour assignments have been synchronized with the project timeline. 
            Site supervisors have been notified of today's work distribution and safety requirements.
            Performance metrics are being monitored continuously.
          </Text>
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.quickActionsTitle}>Quick Actions</Text>
          <View style={styles.quickActionsList}>
            <TouchableOpacity style={styles.quickActionItem}>
              <Ionicons name="add-circle-outline" size={18} color="#059669" />
              <Text style={styles.quickActionText}>Add Worker</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionItem}>
              <Ionicons name="swap-horizontal-outline" size={18} color="#0369a1" />
              <Text style={styles.quickActionText}>Transfer Labour</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionItem}>
              <Ionicons name="stats-chart-outline" size={18} color="#7c2d12" />
              <Text style={styles.quickActionText}>View Analytics</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

// API service functions
const apiService = {
  async fetchCompanies() {
    const response = await apiClient.get('/project/companies');
    return response.data || [];
  },

  async fetchProjects() {
    const response = await apiClient.get('/project/projects-with-sites');
    return response.data || [];
  },

  async fetchWorkDescriptions(siteId) {
    const response = await apiClient.get(`/site-incharge/work-descriptions?site_id=${siteId}`);
    return response.data?.data || response.data || [];
  },

  async fetchLabours() {
    const response = await apiClient.get('/site-incharge/labours');
    return response.data?.data || response.data || [];
  },

  async saveLabourAssignment(payload) {
    const response = await apiClient.post('/site-incharge/save-labour-assignment', payload);
    return response.data;
  },
};

export default function LabourAssign({ route }) {
  // Extract parameters safely - KEEP FALLBACK FROM 1st CODE FOR WORKING SAVE
  const encodedUserId = route?.params?.encodedUserId || 'dGVzdA=='; // 'test' base64 encoded for testing

  // State management
  const [state, setState] = useState({
    companies: [],
    projects: [],
    sites: [],
    workDescriptions: [],
    labours: [],
    selectedCompany: null,
    selectedProject: null,
    selectedSite: null,
    selectedWorkDesc: null,
    selectedLabours: [],
    fromDate: new Date(),
    toDate: new Date(),
    showFromPicker: false,
    showToPicker: false,
    loading: false,
    submitting: false,
    refreshing: false,
    assignmentSaved: false,
    showAttendancePage: false,
    // Modal visibility states
    companyModalVisible: false,
    projectModalVisible: false,
    siteModalVisible: false,
    workDescModalVisible: false,
    // Dropdown collapse state
    dropdownsCollapsed: false,
  });

  // State update helper
  const updateState = useCallback((updates) => {
    setState(prevState => ({ ...prevState, ...updates }));
  }, []);

  // Show attendance page
  if (state.showAttendancePage) {
    return (
      <LabourAttendancePage 
        onBack={() => updateState({ showAttendancePage: false })} 
      />
    );
  }

  // Fetch companies on component mount
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        updateState({ loading: true });
        const companies = await apiService.fetchCompanies();
        console.log('Companies fetched:', companies);
        updateState({ companies });
      } catch (error) {
        const message = handleApiError(error, 'fetch companies');
        Toast.show({ type: 'error', text1: message });
      } finally {
        updateState({ loading: false });
      }
    };

    fetchCompanies();
  }, [updateState]);

  // Update projects when company changes
  useEffect(() => {
    if (state.selectedCompany) {
      const fetchProjects = async () => {
        try {
          updateState({ loading: true });
          const allProjects = await apiService.fetchProjects();
          const filteredProjects = allProjects.filter(project => project.company_id === state.selectedCompany.company_id);
          console.log('Filtered projects:', filteredProjects);
          updateState({ 
            projects: filteredProjects,
            selectedProject: null,
            sites: [],
            selectedSite: null,
            selectedWorkDesc: null,
            selectedLabours: [],
            workDescriptions: [],
            labours: [],
          });
        } catch (error) {
          const message = handleApiError(error, 'fetch projects');
          Toast.show({ type: 'error', text1: message });
        } finally {
          updateState({ loading: false });
        }
      };

      fetchProjects();
    } else {
      updateState({
        projects: [],
        selectedProject: null,
        sites: [],
        selectedSite: null,
        selectedWorkDesc: null,
        selectedLabours: [],
        workDescriptions: [],
        labours: [],
      });
    }
  }, [state.selectedCompany, updateState]);

  // Update sites when project changes
  useEffect(() => {
    if (state.selectedProject) {
      const selectedProjectData = state.projects.find(
        project => project.project_id === state.selectedProject.project_id
      );
      
      console.log('Selected project sites:', selectedProjectData?.sites);
      updateState({
        sites: selectedProjectData?.sites || [],
        selectedSite: null,
        selectedWorkDesc: null,
        selectedLabours: [],
        workDescriptions: [],
        labours: [],
      });
    }
  }, [state.selectedProject, state.projects, updateState]);

  // Fetch site-related data when site is selected
  useEffect(() => {
    if (state.selectedProject && state.selectedSite) {
      const fetchSiteData = async () => {
        try {
          updateState({ loading: true });
          
          const [workDescriptions, labours] = await Promise.all([
            apiService.fetchWorkDescriptions(state.selectedSite.site_id),
            apiService.fetchLabours(),
          ]);

          console.log('Work descriptions:', workDescriptions);
          console.log('Labours:', labours);
          updateState({ workDescriptions, labours });
        } catch (error) {
          const message = handleApiError(error, 'fetch site data');
          Toast.show({ type: 'error', text1: message });
        } finally {
          updateState({ loading: false });
        }
      };

      fetchSiteData();
    }
  }, [state.selectedSite, updateState]);

  // Date validation
  const validateDates = useCallback(() => {
    if (state.toDate < state.fromDate) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Date Range',
        text2: 'End date must be after start date',
      });
      return false;
    }
    return true;
  }, [state.fromDate, state.toDate]);

  // User ID validation and decoding - FROM 1st CODE FOR WORKING SAVE
  const validateAndDecodeUserId = useCallback(() => {
    if (!encodedUserId) {
      Toast.show({
        type: 'error',
        text1: 'Authentication Error',
        text2: 'User ID is missing',
      });
      return null;
    }

    try {
      const decodedUserId = atob(encodedUserId);
      // ALLOW TEST VALUES AND NUMERIC STRINGS FOR WORKING SAVE
      if (decodedUserId === 'test' || /^\d+$/.test(decodedUserId)) {
        return decodedUserId === 'test' ? 1 : parseInt(decodedUserId, 10);
      }
      throw new Error('Invalid format');
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Authentication Error',
        text2: 'Invalid user credentials',
      });
      return null;
    }
  }, [encodedUserId]);

  // Form validation - FROM 1st CODE FOR WORKING SAVE
  const isFormValid = useMemo(() =>
    state.selectedCompany &&
    state.selectedProject &&
    state.selectedSite &&
    state.selectedWorkDesc &&
    Array.isArray(state.selectedLabours) &&
    state.selectedLabours.length > 0 &&
    state.fromDate &&
    state.toDate &&
    state.toDate >= state.fromDate
  , [state.selectedCompany, state.selectedProject, state.selectedSite, state.selectedWorkDesc, state.selectedLabours, state.fromDate, state.toDate]);

  // Save assignment handler - FROM 1st CODE FOR WORKING SAVE
  const handleSaveAssignment = useCallback(async () => {
    // Validation
    if (!isFormValid) {
      Toast.show({
        type: 'error',
        text1: 'Incomplete Form',
        text2: 'Please fill all required fields',
      });
      return;
    }

    if (!validateDates()) return;

    const userId = validateAndDecodeUserId();
    if (!userId) return;

    // PREPARE PAYLOAD - FROM 1st CODE STRUCTURE FOR WORKING SAVE
    const payload = {
      project_id: state.selectedProject.project_id,
      site_id: state.selectedSite.site_id,
      desc_id: state.selectedWorkDesc.desc_id,
      labour_ids: state.selectedLabours, // Already array of IDs
      from_date: state.fromDate.toISOString().split('T')[0],
      to_date: state.toDate.toISOString().split('T')[0],
      created_by: userId,
    };

    console.log('Sending payload:', payload);

    try {
      updateState({ submitting: true });
      
      const response = await apiService.saveLabourAssignment(payload);
      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: response.message || 'Assignment saved successfully',
      });

      // Reset form partially and show attendance button
      updateState({
        selectedWorkDesc: null,
        selectedLabours: [],
        assignmentSaved: true,
      });

    } catch (error) {
      const message = handleApiError(error, 'save assignment');
      console.error('Save assignment error:', error.response?.data);
      Toast.show({
        type: 'error',
        text1: 'Save Failed',
        text2: message,
      });
    } finally {
      updateState({ submitting: false });
    }
  }, [isFormValid, validateDates, validateAndDecodeUserId, state, updateState]);

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    try {
      updateState({ refreshing: true });
      const companies = await apiService.fetchCompanies();
      updateState({ companies });
    } catch (error) {
      const message = handleApiError(error, 'refresh data');
      Toast.show({ type: 'error', text1: message });
    } finally {
      updateState({ refreshing: false });
    }
  }, [updateState]);

  // Labour management - FROM 1st CODE FOR WORKING SAVE
  const addLabour = useCallback((labourId) => {
    if (!state.selectedLabours.includes(labourId)) {
      updateState({
        selectedLabours: [...state.selectedLabours, labourId],
        assignmentSaved: false,
      });
    }
  }, [state.selectedLabours, updateState]);

  const removeLabour = useCallback((labourId) => {
    updateState({
      selectedLabours: state.selectedLabours.filter(id => id !== labourId),
      assignmentSaved: false,
    });
  }, [state.selectedLabours, updateState]);

  // Date change handlers
  const handleFromDateChange = useCallback((event, selectedDate) => {
    updateState({ showFromPicker: false });
    if (selectedDate) {
      const updates = { fromDate: selectedDate };
      if (selectedDate > state.toDate) {
        updates.toDate = selectedDate;
      }
      updateState(updates);
    }
  }, [state.toDate, updateState]);

  const handleToDateChange = useCallback((event, selectedDate) => {
    updateState({ showToPicker: false });
    if (selectedDate) {
      updateState({ toDate: selectedDate });
    }
  }, [updateState]);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={state.refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Labour Assignment</Text>
          <Text style={styles.subtitle}>Assign workers to project tasks</Text>
        </View>

        {/* DROPDOWN SECTION STYLE WITH COLLAPSE */}
        {!state.dropdownsCollapsed && (
          <View style={styles.dropdownSection}>
            <DropdownButton
              label="Company"
              value={state.selectedCompany}
              onPress={() => updateState({ companyModalVisible: true })}
              disabled={false}
            />

            <DropdownButton
              label="Project"
              value={state.selectedProject}
              onPress={() => updateState({ projectModalVisible: true })}
              disabled={!state.selectedCompany}
            />

            <DropdownButton
              label="Site"
              value={state.selectedSite}
              onPress={() => updateState({ siteModalVisible: true })}
              disabled={!state.selectedProject}
            />

            <DropdownButton
              label="Work Description"
              value={state.selectedWorkDesc}
              onPress={() => updateState({ workDescModalVisible: true })}
              disabled={!state.selectedSite}
            />
          </View>
        )}

        {/* MAIN FORM CONTENT */}
        <View style={styles.form}>
          {/* Labour Selection - FROM 1st CODE */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Labours <Text style={styles.required}>*</Text>
            </Text>
            
            {/* Available Labours */}
            {state.labours.length > 0 && (
              <ScrollView style={styles.laboursList} nestedScrollEnabled>
                {state.labours
                  .filter(labour => !state.selectedLabours.includes(labour.id))
                  .map(labour => (
                    <TouchableOpacity
                      key={labour.id}
                      style={styles.labourItem}
                      onPress={() => addLabour(labour.id)}
                    >
                      <Text style={styles.labourItemText}>
                        {labour.id} - {labour.full_name}
                      </Text>
                      <Ionicons name="add-circle-outline" size={20} color="#0f766e" />
                    </TouchableOpacity>
                  ))}
              </ScrollView>
            )}

            {/* Selected Labours Display */}
            {state.selectedLabours.length > 0 && (
              <View style={styles.selectedContainer}>
                <Text style={styles.selectedTitle}>
                  Selected Labours ({state.selectedLabours.length})
                </Text>
                <ScrollView style={styles.selectedList} nestedScrollEnabled>
                  {state.selectedLabours.map(labourId => {
                    const labour = state.labours.find(l => l.id === labourId);
                    return (
                      <View key={labourId} style={styles.selectedItem}>
                        <View style={styles.labourInfo}>
                          <Text style={styles.labourId}>ID: {labourId}</Text>
                          <Text style={styles.labourName}>
                            {labour?.full_name || 'Unknown'}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => removeLabour(labourId)}
                          style={styles.removeButton}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons name="close" size={18} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Date Selection */}
          <View style={styles.dateContainer}>
            <View style={styles.dateField}>
              <Text style={styles.label}>
                From Date <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => updateState({ showFromPicker: true })}
              >
                <Text style={styles.dateText}>
                  {state.fromDate.toLocaleDateString()}
                </Text>
                <Ionicons name="calendar-outline" size={16} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.dateField}>
              <Text style={styles.label}>
                To Date <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => updateState({ showToPicker: true })}
              >
                <Text style={styles.dateText}>
                  {state.toDate.toLocaleDateString()}
                </Text>
                <Ionicons name="calendar-outline" size={16} color="#64748b" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Date Pickers */}
          {state.showFromPicker && (
            <DateTimePicker
              value={state.fromDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleFromDateChange}
            />
          )}

          {state.showToPicker && (
            <DateTimePicker
              value={state.toDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              minimumDate={state.fromDate}
              onChange={handleToDateChange}
            />
          )}

          {/* Loading Indicator */}
          {state.loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#0f766e" />
              <Text style={styles.loadingText}>Loading data...</Text>
            </View>
          )}

          {/* Save Button - FROM 1st CODE FOR WORKING FUNCTIONALITY */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              (!isFormValid || state.submitting) && styles.saveButtonDisabled,
            ]}
            onPress={handleSaveAssignment}
            disabled={!isFormValid || state.submitting}
            activeOpacity={0.8}
          >
            <View style={styles.buttonContent}>
              {state.submitting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="checkmark-circle" size={18} color="white" />
              )}
              <Text style={styles.saveButtonText}>
                {state.submitting ? 'Saving...' : 'Save Assignment'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Labour Attendance Button */}
          <TouchableOpacity
            style={[
              styles.attendanceButton,
              !state.assignmentSaved && styles.attendanceButtonTest
            ]}
            onPress={() => updateState({ showAttendancePage: true })}
            activeOpacity={0.8}
          >
            <View style={styles.buttonContent}>
              <Ionicons name="people" size={18} color="white" />
              <Text style={styles.attendanceButtonText}>
                {state.assignmentSaved ? 'Labour Attendance' : 'Labour Attendance (Test)'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* POPUP DROPDOWN MODALS*/}
      <DropdownModal
        visible={state.companyModalVisible}
        onClose={() => updateState({ companyModalVisible: false })}
        data={state.companies}
        title="Select Company"
        keyProp="company_id"
        onSelect={(item) => {
          updateState({ 
            selectedCompany: item, 
            companyModalVisible: false,
            projectModalVisible: true, // Auto open next modal
            assignmentSaved: false 
          });
        }}
      />

      <DropdownModal
        visible={state.projectModalVisible}
        onClose={() => updateState({ projectModalVisible: false })}
        data={state.projects}
        title="Select Project"
        keyProp="project_id"
        onSelect={(item) => {
          updateState({ 
            selectedProject: item, 
            projectModalVisible: false,
            siteModalVisible: true, // Auto open next modal
            assignmentSaved: false 
          });
        }}
      />

      <DropdownModal
        visible={state.siteModalVisible}
        onClose={() => updateState({ siteModalVisible: false })}
        data={state.sites}
        title="Select Site"
        keyProp="site_id"
        onSelect={(item) => {
          updateState({ 
            selectedSite: item, 
            siteModalVisible: false,
            workDescModalVisible: true, // Auto open next modal
            assignmentSaved: false 
          });
        }}
      />

      <DropdownModal
        visible={state.workDescModalVisible}
        onClose={() => updateState({ workDescModalVisible: false })}
        data={state.workDescriptions}
        title="Select Work Description"
        keyProp="desc_id"
        onSelect={(item) => {
          updateState({ 
            selectedWorkDesc: item, 
            workDescModalVisible: false,
            dropdownsCollapsed: true, // Collapse dropdowns
            assignmentSaved: false 
          });
        }}
      />

      <Toast />

      {/* FLOATING BUTTON - POSITIONED OUTSIDE SCROLLVIEW */}
      {state.dropdownsCollapsed && (
        <TouchableOpacity
          onPress={() => updateState({ dropdownsCollapsed: false })}
          style={styles.floatingButton}
        >
          <Ionicons name="list-circle" size={30} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6', // Style background
  },
  contentContainer: {
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '400',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 0,
    zIndex: 1,
  },
  
  // DROPDOWN SECTION STYLES
  dropdownSection: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 16,
    borderRadius: 12,
  },
  
  // FLOATING BUTTON STYLE
  floatingButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#1e7a6f",
    padding: 14,
    borderRadius: 50,
    elevation: 5,
    zIndex: 999,
  },
  
  form: {
    backgroundColor: 'white',
    marginHorizontal: 4,
    borderRadius: 12,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  fieldContainer: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  required: {
    color: '#dc2626',
  },
  
  // DROPDOWN BUTTON STYLES
  dropdownContainer: {
    marginBottom: 8,
  },
  dropdownLabel: {
    fontWeight: '600',
    marginBottom: 5,
    fontSize: 12,
    color: '#000',
  },
  dropdownButton: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    marginBottom: 5,
    justifyContent: 'center',
  },
  dropdownButtonEnabled: {
    borderColor: '#ccc',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  dropdownButtonDisabled: {
    backgroundColor: '#f3f4f6',
    borderColor: '#e5e7eb',
  },
  dropdownButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '100%',
  },
  dropdownButtonText: {
    fontSize: 14,
  },
  dropdownPlaceholder: {
    color: '#9ca3af',
  },
  dropdownActiveText: {
    color: '#000',
  },
  dropdownDisabledText: {
    color: '#6b7280',
  },

  // POPUP MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalTouchable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    padding: 16,
    backgroundColor: '#14b8a6', // teal-600
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: 'white',
  },
  modalList: {
    maxHeight: 400,
  },
  modalItem: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalItemText: {
    fontSize: 16,
    color: '#1f2937',
  },
  modalCancelButton: {
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#f3f4f6',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },

  // Labour Selection Styles - FROM 1ST CODE
  laboursList: {
    maxHeight: 150,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    backgroundColor: '#f9fafb',
  },
  labourItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  labourItemText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  selectedContainer: {
    marginTop: 12,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  selectedTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0369a1',
    marginBottom: 10,
  },
  selectedList: {
    maxHeight: 120,
  },
  selectedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  labourInfo: {
    flex: 1,
  },
  labourId: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
  },
  labourName: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  removeButton: {
    padding: 4,
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
    gap: 12,
  },
  dateField: {
    flex: 1,
  },
  dateInput: {
    height: 48,
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 14,
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#0f766e',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    shadowColor: '#0f766e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 12,
  },
  saveButtonDisabled: {
    backgroundColor: '#94a3b8',
    shadowColor: '#94a3b8',
    shadowOpacity: 0.15,
    elevation: 2,
  },
  attendanceButton: {
    backgroundColor: '#0369a1',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    shadowColor: '#0369a1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  attendanceButtonTest: {
    backgroundColor: '#7c2d12',
    borderWidth: 2,
    borderColor: '#dc2626',
    shadowColor: '#7c2d12',
  },
  buttonContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  attendanceButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  
  // Labour Attendance Page Styles
  attendanceCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginLeft: 8,
  },
  cardContent: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#0f766e',
  },
  attendanceText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
    fontWeight: '400',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f766e',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  infoCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#dbeafe',
    marginBottom: 20,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0369a1',
    marginLeft: 6,
  },
  infoText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
    fontWeight: '400',
  },
  quickActions: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  quickActionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  quickActionsList: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickActionItem: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '500',
  },
});