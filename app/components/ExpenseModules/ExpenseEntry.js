import React, { useState, useEffect, useCallback } from "react";
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
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";

// API Configuration (same as LabourAssign)
const API_CONFIG = {
  BASE_URL: "http://103.118.158.127/api",
  TIMEOUT: 15000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

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
    console.error(`[${timestamp}] ❌ API Error:`, error);
    return Promise.reject(error);
  }
);

// Error handler utility
const handleApiError = (error, context = '') => {
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

// Dropdown Button Component (same as LabourAssign)
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
          {value ? value.company_name || value.project_name || value.site_name || value.desc_name || value : `Select ${label}`}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#888" />
      </View>
    </TouchableOpacity>
  </View>
);

// Dropdown Modal Component (same as LabourAssign)
const DropdownModal = ({ visible, onClose, data, onSelect, title, keyProp, labelProp = "name" }) => (
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
                  {item[labelProp] || item.company_name || item.project_name || item.site_name || item.desc_name}
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

// Budget Card Component - UPDATED with web version logic and new design
const BudgetCard = ({ budget, expenseInputs, handleInputChange, handleSave, selectedDate }) => {
  // Filter out material and labour overheads like web version
  if (budget.overhead_id === 1 || budget.overhead_id === 2) {
    return null;
  }

  const splittedBudget = parseFloat(budget.splitted_budget) || 0;
  const actualValue = parseFloat(budget.actual_value) || 0;

  const getStatus = () => {
    if (actualValue > splittedBudget) {
      return { text: 'Exceeded', color: '#dc2626' };
    } else if (Math.abs(actualValue - splittedBudget) < 0.01) {
      return { text: 'Completed', color: '#16a34a' };
    } else {
      return { text: 'In Progress', color: '#2563eb' };
    }
  };

  const status = getStatus();

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{budget.expense_name}</Text>
      </View>
      
      <View style={styles.cardContent}>
        <View style={styles.budgetRow}>
          <Text style={styles.budgetLabel}>Splitted Budget:</Text>
          <Text style={styles.budgetValue}>₹{splittedBudget.toFixed(2)}</Text>
        </View>
        
        <View style={styles.budgetRow}>
          <Text style={styles.budgetLabel}>Actual:</Text>
          <Text style={styles.budgetValue}>₹{actualValue.toFixed(2)}</Text>
        </View>

        <View style={styles.budgetRow}>
          <Text style={styles.budgetLabel}>Status:</Text>
          <Text style={[styles.statusText, { color: status.color }]}>
            {status.text}
          </Text>
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Actual Value</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter amount"
            keyboardType="numeric"
            value={expenseInputs[budget.id]?.actual_value || ""}
            onChangeText={(val) => handleInputChange(budget.id, "actual_value", val)}
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Remarks</Text>
          <TextInput
            style={[styles.input, styles.remarksInput]}
            placeholder="Add remarks"
            multiline
            value={expenseInputs[budget.id]?.remarks || ""}
            onChangeText={(val) => handleInputChange(budget.id, "remarks", val)}
          />
        </View>
        
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={() => handleSave(budget.id)}
          disabled={!expenseInputs[budget.id]?.actual_value}
        >
          <Ionicons name="save-outline" size={18} color="white" />
          <Text style={styles.saveButtonText}>Save Expense</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function BudgetExpenseEntry() {
  // State management - FIXED: Separated expenseInputs from main state
  const [state, setState] = useState({
    companies: [],
    projects: [],
    sites: [],
    workDescs: [],
    budgetData: [],
    filteredBudget: [],
    selectedCompany: null,
    selectedProject: null,
    selectedSite: null,
    selectedWorkDesc: null,
    loading: false,
    refreshing: false,
    submitting: false,
    // Modal visibility states
    companyModalVisible: false,
    projectModalVisible: false,
    siteModalVisible: false,
    workDescModalVisible: false,
    // Dropdown collapse state
    dropdownsCollapsed: false,
    selectedDate: new Date().toISOString().split('T')[0], // ADDED from web version
  });

  // FIXED: Separate state for expense inputs to prevent disappearing
  const [expenseInputs, setExpenseInputs] = useState({});

  // State update helper
  const updateState = useCallback((updates) => {
    setState(prevState => ({ ...prevState, ...updates }));
  }, []);

  // API service functions - UPDATED with web version endpoints
  const apiService = {
    async fetchCompanies() {
      const response = await apiClient.get('/project/companies');
      return response.data || [];
    },

    async fetchProjects(companyId) {
      const response = await apiClient.get(`/project/projects-with-sites/${companyId}`);
      return response.data || [];
    },

    async fetchWorkDescriptions(siteId) {
      const response = await apiClient.get(`/site-incharge/budget-work-descriptions/${siteId}`);
      return response.data?.data || [];
    },

    // UPDATED: Changed to match web version endpoint
    async fetchBudgetDetails(siteId) {
      const response = await apiClient.get(`/site-incharge/budget-details?site_id=${siteId}`);
      return response.data?.data || [];
    },

    async saveBudgetExpense(payload) {
      const response = await apiClient.post('/site-incharge/save-budget-expense', payload);
      return response.data;
    },
  };

  // Call calculate-labour-budget API on mount like web version
  useEffect(() => {
    const callCalculateLabourBudget = async () => {
      try {
        await apiClient.get("/site-incharge/calculate-labour-budget");
        console.log("Labour budget calculation triggered");
      } catch (error) {
        console.error("Error calling calculate-labour-budget API:", error.message);
      }
    };

    callCalculateLabourBudget();
  }, []);

  // Fetch companies on component mount
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        updateState({ loading: true });
        const companies = await apiService.fetchCompanies();
        updateState({ companies });
      } catch (error) {
        const message = handleApiError(error, 'fetch companies');
        Toast.show({ type: 'error', text1: message });
      } finally {
        updateState({ loading: false });
      }
    };

    fetchCompanies();
  }, []);

  // Fetch projects when company changes
  useEffect(() => {
    if (state.selectedCompany) {
      const fetchProjects = async () => {
        try {
          updateState({ loading: true });
          const projects = await apiService.fetchProjects(state.selectedCompany.company_id);
          updateState({ 
            projects,
            selectedProject: null,
            sites: [],
            selectedSite: null,
            selectedWorkDesc: null,
            budgetData: [],
            filteredBudget: [],
          });
          // FIXED: Clear expense inputs when company changes
          setExpenseInputs({});
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
        budgetData: [],
        filteredBudget: [],
      });
      // FIXED: Clear expense inputs when no company selected
      setExpenseInputs({});
    }
  }, [state.selectedCompany]);

  // Update sites when project changes
  useEffect(() => {
    if (state.selectedProject) {
      const selectedProjectData = state.projects.find(
        project => project.project_id === state.selectedProject.project_id
      );
      
      const siteOptions = selectedProjectData
        ? selectedProjectData.sites.map((site) => ({
            site_id: site.site_id,
            site_name: `${site.site_name} (PO: ${site.po_number})`,
          }))
        : [];
      
      updateState({
        sites: siteOptions,
        selectedSite: null,
        selectedWorkDesc: null,
        budgetData: [],
        filteredBudget: [],
      });
      // FIXED: Clear expense inputs when project changes
      setExpenseInputs({});
    }
  }, [state.selectedProject, state.projects]);

  // Fetch site-related data when site is selected
  useEffect(() => {
    if (state.selectedSite) {
      const fetchSiteData = async () => {
        try {
          updateState({ loading: true });
          
          const [workDescs, budgetData] = await Promise.all([
            apiService.fetchWorkDescriptions(state.selectedSite.site_id),
            apiService.fetchBudgetDetails(state.selectedSite.site_id),
          ]);
          
          updateState({ 
            workDescs,
            budgetData,
            filteredBudget: budgetData,
          });
        } catch (error) {
          const message = handleApiError(error, 'fetch site data');
          Toast.show({ type: 'error', text1: message });
        } finally {
          updateState({ loading: false });
        }
      };

      fetchSiteData();
    }
  }, [state.selectedSite]);

  // Filter budget data when work description is selected
  useEffect(() => {
    if (state.selectedWorkDesc) {
      const filtered = state.budgetData.filter(
        item => item.work_desc_id === state.selectedWorkDesc.work_desc_id
      );
      updateState({ filteredBudget: filtered });
    } else {
      updateState({ filteredBudget: state.budgetData });
    }
  }, [state.selectedWorkDesc, state.budgetData]);

  // Refresh function
  const handleRefresh = useCallback(async () => {
    updateState({ refreshing: true });
    
    try {
      if (state.selectedSite) {
        const [workDescs, budgetData] = await Promise.all([
          apiService.fetchWorkDescriptions(state.selectedSite.site_id),
          apiService.fetchBudgetDetails(state.selectedSite.site_id),
        ]);
        
        updateState({ 
          workDescs,
          budgetData,
          filteredBudget: state.selectedWorkDesc 
            ? budgetData.filter(item => item.work_desc_id === state.selectedWorkDesc.work_desc_id)
            : budgetData,
        });
      }
    } catch (error) {
      const message = handleApiError(error, 'refresh data');
      Toast.show({ type: 'error', text1: message });
    } finally {
      updateState({ refreshing: false });
    }
  }, [state.selectedSite, state.selectedWorkDesc]);

  // FIXED: Input change handler - now uses separate state
  const handleInputChange = useCallback((budgetId, field, value) => {
    setExpenseInputs(prevInputs => ({
      ...prevInputs,
      [budgetId]: { 
        ...prevInputs[budgetId], 
        [field]: value 
      },
    }));
  }, []);

  // FIXED: Save expense handler - uses separate state
  const handleSave = useCallback(async (budgetId) => {
    const inputData = expenseInputs[budgetId];
    if (!inputData?.actual_value) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter an actual value',
      });
      return;
    }

    try {
      updateState({ submitting: true });
      
      const payload = {
        budget_id: budgetId,
        actual_value: parseFloat(inputData.actual_value),
        remarks: inputData.remarks || '',
        date: state.selectedDate,
      };

      await apiService.saveBudgetExpense(payload);
      
      // Update local state
      const updatedBudgetData = state.budgetData.map(item => {
        if (item.id === budgetId) {
          return {
            ...item,
            actual_value: inputData.actual_value,
          };
        }
        return item;
      });
      
      updateState({ 
        budgetData: updatedBudgetData,
        filteredBudget: state.selectedWorkDesc 
          ? updatedBudgetData.filter(item => item.work_desc_id === state.selectedWorkDesc.work_desc_id)
          : updatedBudgetData,
      });
      
      // FIXED: Clear the input for this budget item correctly
      setExpenseInputs(prevInputs => {
        const newInputs = { ...prevInputs };
        delete newInputs[budgetId];
        return newInputs;
      });
      
      Toast.show({ 
        type: 'success', 
        text1: 'Expense saved successfully!',
        text2: 'Budget has been updated'
      });
    } catch (error) {
      const message = handleApiError(error, 'save expense');
      Toast.show({
        type: 'error',
        text1: 'Save Failed',
        text2: message,
      });
    } finally {
      updateState({ submitting: false });
    }
  }, [expenseInputs, state.selectedWorkDesc, state.budgetData, state.selectedDate]);

  // Toggle dropdowns collapse
  const toggleDropdownsCollapse = () => {
    updateState({ dropdownsCollapsed: !state.dropdownsCollapsed });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl 
            refreshing={state.refreshing} 
            onRefresh={handleRefresh}
            enabled={!!state.selectedSite}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Budget Expense Entry</Text>
          <Text style={styles.subtitle}>Track and manage project expenses</Text>
        </View>

        {/* DROPDOWN SECTION */}
        {!state.dropdownsCollapsed && (
          <View style={styles.dropdownSection}>
            <DropdownButton
              label="Company"
              value={state.selectedCompany}
              onPress={() => updateState({ companyModalVisible: true })}
              disabled={state.loading}
            />
            
            <DropdownButton
              label="Project"
              value={state.selectedProject}
              onPress={() => updateState({ projectModalVisible: true })}
              disabled={!state.selectedCompany || state.loading}
            />
            
            <DropdownButton
              label="Site"
              value={state.selectedSite}
              onPress={() => updateState({ siteModalVisible: true })}
              disabled={!state.selectedProject || state.loading}
            />
            
            <DropdownButton
              label="Work Description"
              value={state.selectedWorkDesc}
              onPress={() => updateState({ workDescModalVisible: true })}
              disabled={!state.selectedSite || state.loading}
            />
          </View>
        )}

        {/* BUDGET CARDS */}
        <View style={styles.budgetContainer}>
          {state.loading && !state.refreshing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#0f766e" />
              <Text style={styles.loadingText}>Loading budget data...</Text>
            </View>
          ) : state.filteredBudget.length > 0 ? (
            state.filteredBudget.map((budget) => (
              <BudgetCard
                key={budget.id}
                budget={budget}
                expenseInputs={expenseInputs}
                handleInputChange={handleInputChange}
                handleSave={handleSave}
                selectedDate={state.selectedDate}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyStateText}>
                {state.selectedSite 
                  ? "No budget data available for the selected filters" 
                  : "Please select a site to view budget details"}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* POPUP DROPDOWN MODALS */}
      <DropdownModal
        visible={state.companyModalVisible}
        onClose={() => updateState({ companyModalVisible: false })}
        data={state.companies}
        title="Select Company"
        keyProp="company_id"
        labelProp="company_name"
        onSelect={(item) => updateState({ selectedCompany: item })}
      />

      <DropdownModal
        visible={state.projectModalVisible}
        onClose={() => updateState({ projectModalVisible: false })}
        data={state.projects}
        title="Select Project"
        keyProp="project_id"
        labelProp="project_name"
        onSelect={(item) => updateState({ selectedProject: item })}
      />

      <DropdownModal
        visible={state.siteModalVisible}
        onClose={() => updateState({ siteModalVisible: false })}
        data={state.sites}
        title="Select Site"
        keyProp="site_id"
        labelProp="site_name"
        onSelect={(item) => updateState({ selectedSite: item })}
      />

      <DropdownModal
        visible={state.workDescModalVisible}
        onClose={() => updateState({ workDescModalVisible: false })}
        data={state.workDescs}
        title="Select Work Description"
        keyProp="work_desc_id"
        labelProp="desc_name"
        onSelect={(item) => updateState({ selectedWorkDesc: item })}
      />

      <Toast />

      {/* FLOATING BUTTON */}
      {state.dropdownsCollapsed && (
        <TouchableOpacity
          onPress={toggleDropdownsCollapse}
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
    backgroundColor: '#f3f4f6',
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
  dropdownSection: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 16,
    borderRadius: 12,
  },
  budgetContainer: {
    marginBottom: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 12,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  cardContent: {
    paddingTop: 4,
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  budgetLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  budgetValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '600',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'white',
    fontSize: 16,
  },
  remarksInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#0f766e',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 16,
    fontWeight: '500',
  },
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
  // Dropdown styles (same as LabourAssign)
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
  // Modal styles (same as LabourAssign)
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
    backgroundColor: '#14b8a6',
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
});