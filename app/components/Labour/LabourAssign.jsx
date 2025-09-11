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

  async fetchEmployees() {
    const response = await apiClient.get('/site-incharge/employees');
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
    employees: [],
    selectedProject: null,
    selectedSite: null,
    selectedWorkDesc: null,
    selectedEmployees: [],
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

  const employeeOptions = useMemo(() =>
    state.employees
      .filter(emp => !state.selectedEmployees.includes(emp.emp_id))
      .map(emp => ({
        label: `${emp.emp_id} - ${emp.full_name}`,
        value: emp.emp_id,
      })), [state.employees, state.selectedEmployees]
  );

  const isFormValid = useMemo(() =>
    state.selectedProject &&
    state.selectedSite &&
    state.selectedWorkDesc &&
    state.selectedEmployees.length > 0 &&
    state.fromDate &&
    state.toDate &&
    state.toDate >= state.fromDate
  , [state.selectedProject, state.selectedSite, state.selectedWorkDesc, state.selectedEmployees, state.fromDate, state.toDate]);

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
        selectedEmployees: [],
        workDescriptions: [],
        employees: [],
      });
    }
  }, [state.selectedProject, state.projects, updateState]);

  // Fetch site-related data when site is selected
  useEffect(() => {
    if (state.selectedProject && state.selectedSite) {
      const fetchSiteData = async () => {
        try {
          updateState({ loading: true });
          
          const [workDescriptions, employees] = await Promise.all([
            apiService.fetchWorkDescriptions(state.selectedSite),
            apiService.fetchEmployees(),
          ]);

          updateState({ workDescriptions, employees });
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
      emp_ids: state.selectedEmployees,
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
        selectedEmployees: [],
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

  // Employee management
  const addEmployee = useCallback((empId) => {
    updateState({
      selectedEmployees: [...state.selectedEmployees, empId],
    });
  }, [state.selectedEmployees, updateState]);

  const removeEmployee = useCallback((empId) => {
    updateState({
      selectedEmployees: state.selectedEmployees.filter(id => id !== empId),
    });
  }, [state.selectedEmployees, updateState]);

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

  // Get selected employee display text
  const getSelectedEmployeesText = useCallback(() => {
    return state.selectedEmployees
      .map(id => {
        const emp = state.employees.find(e => e.emp_id === id);
        return emp ? `${emp.emp_id} - ${emp.full_name}` : String(id);
      })
      .join(', ');
  }, [state.selectedEmployees, state.employees]);

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
            maxHeight={300}
            labelField="label"
            valueField="value"
            placeholder="Select a project..."
            searchPlaceholder="Search projects..."
            value={state.selectedProject}
            onChange={(item) => updateState({ selectedProject: item.value })}
            disable={state.loading}
            renderRightIcon={() => (
              <Ionicons name="chevron-down" size={20} color="#6b7280" />
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
            maxHeight={300}
            labelField="label"
            valueField="value"
            placeholder="Select a site..."
            searchPlaceholder="Search sites..."
            value={state.selectedSite}
            onChange={(item) => updateState({ selectedSite: item.value })}
            disable={!state.selectedProject || state.loading}
            renderRightIcon={() => (
              <Ionicons name="chevron-down" size={20} color="#6b7280" />
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
            maxHeight={300}
            labelField="label"
            valueField="value"
            placeholder="Select work description..."
            searchPlaceholder="Search descriptions..."
            value={state.selectedWorkDesc}
            onChange={(item) => updateState({ selectedWorkDesc: item.value })}
            disable={!state.selectedProject || !state.selectedSite || state.loading}
            renderRightIcon={() => (
              <Ionicons name="chevron-down" size={20} color="#6b7280" />
            )}
          />
        </View>

        {/* Employee Selection */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>
            Employees <Text style={styles.required}>*</Text>
          </Text>
          <Dropdown
            style={[
              styles.dropdown,
              (!state.selectedProject || !state.selectedSite || !state.selectedWorkDesc) && styles.dropdownDisabled,
              state.selectedEmployees.length === 0 && state.selectedWorkDesc && styles.dropdownError,
            ]}
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            inputSearchStyle={styles.inputSearchStyle}
            iconStyle={styles.iconStyle}
            data={employeeOptions}
            search
            maxHeight={300}
            labelField="label"
            valueField="value"
            placeholder="Select employees..."
            searchPlaceholder="Search employees..."
            value={null}
            onChange={(item) => addEmployee(item.value)}
            disable={!state.selectedProject || !state.selectedSite || !state.selectedWorkDesc || state.loading}
            renderRightIcon={() => (
              <Ionicons name="people" size={20} color="#6b7280" />
            )}
          />

          {/* Selected Employees Display */}
          {state.selectedEmployees.length > 0 && (
            <View style={styles.selectedContainer}>
              <Text style={styles.selectedTitle}>
                Selected ({state.selectedEmployees.length})
              </Text>
              <ScrollView style={styles.selectedList} nestedScrollEnabled>
                {state.selectedEmployees.map(empId => {
                  const emp = state.employees.find(e => e.emp_id === empId);
                  return (
                    <View key={empId} style={styles.selectedItem}>
                      <View style={styles.employeeInfo}>
                        <Text style={styles.employeeId}>{empId}</Text>
                        <Text style={styles.employeeName}>
                          {emp?.full_name || 'Unknown'}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => removeEmployee(empId)}
                        style={styles.removeButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons name="close-circle" size={22} color="#ef4444" />
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
              <Ionicons name="calendar-outline" size={20} color="#6b7280" />
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
              <Ionicons name="calendar-outline" size={20} color="#6b7280" />
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
            <ActivityIndicator size="small" color="#059669" />
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
              <Ionicons name="save" size={20} color="white" />
            )}
            <Text style={styles.saveButtonText}>
              {state.submitting ? 'Saving Assignment...' : 'Save Assignment'}
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
    paddingVertical: 20,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '400',
  },
  form: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  fieldContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#dc2626',
  },
  dropdown: {
    height: 52,
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: 'white',
  },
  dropdownDisabled: {
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
  },
  dropdownError: {
    borderColor: '#dc2626',
  },
  placeholderStyle: {
    fontSize: 16,
    color: '#9ca3af',
  },
  selectedTextStyle: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  inputSearchStyle: {
    height: 44,
    fontSize: 16,
    borderRadius: 8,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  selectedContainer: {
    marginTop: 12,
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  selectedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0369a1',
    marginBottom: 12,
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
    borderRadius: 8,
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  employeeInfo: {
    flex: 1,
  },
  employeeId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  employeeName: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  removeButton: {
    padding: 4,
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  dateField: {
    flex: 1,
    marginHorizontal: 4,
  },
  dateInput: {
    height: 52,
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
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
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af',
    shadowColor: '#9ca3af',
    shadowOpacity: 0.2,
    elevation: 2,
  },
  buttonContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
  },
});