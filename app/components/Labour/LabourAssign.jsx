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
} from "react-native";
import axios from "axios";
import { Dropdown } from "react-native-element-dropdown";
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

// API service functions
const apiService = {
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
  // Extract parameters safely
  const encodedUserId = route?.params?.encodedUserId || null;

  // State management
  const [state, setState] = useState({
    projects: [],
    sites: [],
    workDescriptions: [],
    labours: [],
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
  });

  // Memoized computed values
  const projectOptions = useMemo(() =>
    state.projects.map(project => ({
      label: project.project_name,
      value: project.project_id,
    })), [state.projects]
  );

  const siteOptions = useMemo(() =>
    state.sites.map(site => ({
      label: site.site_name,
      value: site.site_id,
    })), [state.sites]
  );

  const workDescOptions = useMemo(() =>
    state.workDescriptions.map(desc => ({
      label: desc.desc_name,
      value: desc.desc_id,
    })), [state.workDescriptions]
  );

  const labourOptions = useMemo(() =>
    state.labours
      .filter(labour => !state.selectedLabours.includes(labour.id))
      .map(labour => ({
        label: `${labour.id} - ${labour.full_name}`,
        value: labour.id,
      })), [state.labours, state.selectedLabours]
  );

  const isFormValid = useMemo(() =>
    state.selectedProject &&
    state.selectedSite &&
    state.selectedWorkDesc &&
    state.selectedLabours.length > 0 &&
    state.fromDate &&
    state.toDate &&
    state.toDate >= state.fromDate
  , [state.selectedProject, state.selectedSite, state.selectedWorkDesc, state.selectedLabours, state.fromDate, state.toDate]);

  // State update helper
  const updateState = useCallback((updates) => {
    setState(prevState => ({ ...prevState, ...updates }));
  }, []);

  // Fetch projects on component mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        updateState({ loading: true });
        const projects = await apiService.fetchProjects();
        updateState({ projects });
      } catch (error) {
        const message = handleApiError(error, 'fetch projects');
        Toast.show({ type: 'error', text1: message });
      } finally {
        updateState({ loading: false });
      }
    };

    fetchProjects();
  }, [updateState]);

  // Update sites when project changes
  useEffect(() => {
    if (state.selectedProject) {
      const selectedProjectData = state.projects.find(
        project => project.project_id === state.selectedProject
      );
      
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
            apiService.fetchWorkDescriptions(state.selectedSite),
            apiService.fetchLabours(),
          ]);

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

  // User ID validation and decoding
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
      if (!/^\d+$/.test(decodedUserId)) {
        throw new Error('Invalid format');
      }
      return parseInt(decodedUserId, 10);
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Authentication Error',
        text2: 'Invalid user credentials',
      });
      return null;
    }
  }, [encodedUserId]);

  // Save assignment handler
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

    // Prepare payload
    const payload = {
      project_id: state.selectedProject,
      site_id: state.selectedSite,
      desc_id: state.selectedWorkDesc,
      labour_ids: state.selectedLabours,
      from_date: state.fromDate.toISOString().split('T')[0],
      to_date: state.toDate.toISOString().split('T')[0],
      created_by: userId,
    };

    try {
      updateState({ submitting: true });
      
      const response = await apiService.saveLabourAssignment(payload);
      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: response.message || 'Assignment saved successfully',
      });

      // Reset form partially
      updateState({
        selectedWorkDesc: null,
        selectedLabours: [],
      });

    } catch (error) {
      const message = handleApiError(error, 'save assignment');
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
      const projects = await apiService.fetchProjects();
      updateState({ projects });
    } catch (error) {
      const message = handleApiError(error, 'refresh data');
      Toast.show({ type: 'error', text1: message });
    } finally {
      updateState({ refreshing: false });
    }
  }, [updateState]);

  // Labour management
  const addLabour = useCallback((labourId) => {
    updateState({
      selectedLabours: [...state.selectedLabours, labourId],
    });
  }, [state.selectedLabours, updateState]);

  const removeLabour = useCallback((labourId) => {
    updateState({
      selectedLabours: state.selectedLabours.filter(id => id !== labourId),
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
    <ScrollView
      style={styles.container}
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

      <View style={styles.form}>
        {/* Project Selection */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>
            Project <Text style={styles.required}>*</Text>
          </Text>
          <Dropdown
            style={[
              styles.dropdown,
              !state.selectedProject && styles.dropdownError,
            ]}
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            inputSearchStyle={styles.inputSearchStyle}
            iconStyle={styles.iconStyle}
            data={projectOptions}
            search
            maxHeight={200}
            labelField="label"
            valueField="value"
            placeholder="Select project"
            searchPlaceholder="Search..."
            value={state.selectedProject}
            onChange={(item) => updateState({ selectedProject: item.value })}
            disable={state.loading}
            renderRightIcon={() => (
              <Ionicons name="chevron-down" size={16} color="#64748b" />
            )}
          />
        </View>

        {/* Site Selection */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>
            Site <Text style={styles.required}>*</Text>
          </Text>
          <Dropdown
            style={[
              styles.dropdown,
              !state.selectedProject && styles.dropdownDisabled,
              !state.selectedSite && state.selectedProject && styles.dropdownError,
            ]}
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            inputSearchStyle={styles.inputSearchStyle}
            iconStyle={styles.iconStyle}
            data={siteOptions}
            search
            maxHeight={200}
            labelField="label"
            valueField="value"
            placeholder="Select site"
            searchPlaceholder="Search..."
            value={state.selectedSite}
            onChange={(item) => updateState({ selectedSite: item.value })}
            disable={!state.selectedProject || state.loading}
            renderRightIcon={() => (
              <Ionicons name="chevron-down" size={16} color="#64748b" />
            )}
          />
        </View>

        {/* Work Description Selection */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>
            Work Description <Text style={styles.required}>*</Text>
          </Text>
          <Dropdown
            style={[
              styles.dropdown,
              (!state.selectedProject || !state.selectedSite) && styles.dropdownDisabled,
              !state.selectedWorkDesc && state.selectedSite && styles.dropdownError,
            ]}
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            inputSearchStyle={styles.inputSearchStyle}
            iconStyle={styles.iconStyle}
            data={workDescOptions}
            search
            maxHeight={200}
            labelField="label"
            valueField="value"
            placeholder="Select work description"
            searchPlaceholder="Search..."
            value={state.selectedWorkDesc}
            onChange={(item) => updateState({ selectedWorkDesc: item.value })}
            disable={!state.selectedProject || !state.selectedSite || state.loading}
            renderRightIcon={() => (
              <Ionicons name="chevron-down" size={16} color="#64748b" />
            )}
          />
        </View>

        {/* Labour Selection */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>
            Labours <Text style={styles.required}>*</Text>
          </Text>
          <Dropdown
            style={[
              styles.dropdown,
              (!state.selectedProject || !state.selectedSite || !state.selectedWorkDesc) && styles.dropdownDisabled,
              state.selectedLabours.length === 0 && state.selectedWorkDesc && styles.dropdownError,
            ]}
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            inputSearchStyle={styles.inputSearchStyle}
            iconStyle={styles.iconStyle}
            data={labourOptions}
            search
            maxHeight={200}
            labelField="label"
            valueField="value"
            placeholder="Add labours"
            searchPlaceholder="Search..."
            value={null}
            onChange={(item) => addLabour(item.value)}
            disable={!state.selectedProject || !state.selectedSite || !state.selectedWorkDesc || state.loading}
            renderRightIcon={() => (
              <Ionicons name="add-circle-outline" size={16} color="#64748b" />
            )}
          />

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

        {/* Save Button */}
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
      </View>

      <Toast />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    paddingVertical: 16,
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
  form: {
    backgroundColor: 'white',
    marginHorizontal: 16,
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
  dropdown: {
    height: 44,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 14,
    backgroundColor: 'white',
  },
  dropdownDisabled: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  dropdownError: {
    borderColor: '#dc2626',
  },
  placeholderStyle: {
    fontSize: 14,
    color: '#9ca3af',
  },
  selectedTextStyle: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 14,
    borderRadius: 6,
  },
  iconStyle: {
    width: 16,
    height: 16,
  },
  selectedContainer: {
    marginTop: 10,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
  selectedTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0369a1',
    marginBottom: 10,
  },
  selectedList: {
    maxHeight: 100,
  },
  selectedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 4,
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
    marginTop: 1,
  },
  removeButton: {
    padding: 2,
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  dateField: {
    flex: 1,
    marginHorizontal: 3,
  },
  dateInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 14,
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#0f766e',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    shadowColor: '#0f766e',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: '#94a3b8',
    shadowColor: '#94a3b8',
    shadowOpacity: 0.15,
    elevation: 2,
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
});