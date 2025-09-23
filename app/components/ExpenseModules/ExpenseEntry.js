import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Modal,
  FlatList,
  TextInput,
  Dimensions,
  SafeAreaView,
} from "react-native";
import axios from "axios";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";

// Get screen dimensions for responsive design
const { width } = Dimensions.get('window');

// API Configuration
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

// Response interceptor
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
        <Text 
          style={[
            styles.dropdownButtonText,
            !value ? styles.dropdownPlaceholder : (disabled ? styles.dropdownDisabledText : styles.dropdownActiveText)
          ]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {value ? 
            (label === 'Company' ? value.company_name :
             label === 'Project' ? value.project_name :
             label === 'Site' ? value.site_name :
             label === 'Work Description' ? value.desc_name : 
             value) 
            : `Select ${label}`}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#888" />
      </View>
    </TouchableOpacity>
  </View>
);

// Dropdown Modal Component
const DropdownModal = ({ visible, onClose, data, onSelect, title, keyProp, searchQuery, setSearchQuery }) => (
  <Modal visible={visible} transparent animationType="fade">
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
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
              <Text style={styles.modalItemText} numberOfLines={2}>
                {title === 'Select Company' ? item.company_name :
                 title === 'Select Project' ? item.project_name :
                 title === 'Select Site' ? item.site_name :
                 title === 'Select Work Description' ? item.desc_name :
                 item.name}
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
      </View>
    </View>
  </Modal>
);

// Product Card Component (shows product name with Usage button)
const ProductCard = ({ budget, onUsagePress }) => {
  if (budget.overhead_id === 1 || budget.overhead_id === 2) {
    return null;
  }

  return (
    <View style={styles.productCard}>
      <View style={styles.productCardHeader}>
        <Text style={styles.productCardTitle}>{budget.expense_name}</Text>
      </View>
      
      <View style={styles.productCardIcon}>
        <Ionicons name="document-text-outline" size={40} color="#0891b2" />
      </View>
      
      <TouchableOpacity
        onPress={() => onUsagePress(budget)}
        style={styles.usageButton}
      >
        <Ionicons name="create-outline" size={16} color="#0891b2" style={styles.usageIcon} />
        <Text style={styles.usageButtonText}>Usage</Text>
      </TouchableOpacity>
    </View>
  );
};

// Budget Detail Card Component (shows detailed budget info with inputs)
const BudgetDetailCard = ({ budget, expenseDetails, expenseInputs, handleInputChange, handleSave, selectedDate, submitting, onBack }) => {
  const displayData = expenseDetails[budget.id] || {
    cumulative: { actual_value: parseFloat(budget.actual_value) || 0 },
    entries: [
      {
        id: budget.id,
        actual_value: parseFloat(budget.actual_value) || 0,
        remarks: budget.remarks || "No remarks",
        created_at: `${selectedDate}T10:06:00`
      }
    ]
  };

  const splittedBudget = parseFloat(budget.splitted_budget) || 0;
  const cumulativeValue = parseFloat(displayData.cumulative.actual_value) || 0;

  const getStatus = () => {
    if (cumulativeValue > splittedBudget) {
      return { text: 'Exceeded', color: '#dc2626', bgColor: 'rgba(220, 38, 38, 0.1)' };
    } else if (Math.abs(cumulativeValue - splittedBudget) < 0.01) {
      return { text: 'Completed', color: '#16a34a', bgColor: 'rgba(22, 163, 74, 0.1)' };
    } else {
      return { text: 'In Progress', color: '#2563eb', bgColor: 'rgba(37, 99, 235, 0.1)' };
    }
  };

  const status = getStatus();

  return (
    <View style={styles.budgetDetailCard}>
      <View style={styles.budgetDetailHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0891b2" />
        </TouchableOpacity>
        <Text style={styles.budgetDetailTitle}>{budget.expense_name}</Text>
      </View>
      
      <View style={styles.budgetCardSection}>
        <Text style={styles.budgetCardLabel}>Splitted Budget</Text>
        <Text style={styles.budgetCardValue}>₹{splittedBudget.toFixed(2)}</Text>
      </View>

      <View style={styles.budgetCardSection}>
        <Text style={styles.budgetCardLabel}>Progress as of {selectedDate}</Text>
        <Text style={styles.budgetCardValue}>Actual: ₹{cumulativeValue.toFixed(2)} / ₹{splittedBudget.toFixed(2)}</Text>
      </View>

      <View style={styles.budgetCardSection}>
        <Text style={styles.budgetCardLabel}>Status</Text>
        <View style={[styles.statusBadge, { backgroundColor: status.bgColor }]}>
          <Text style={[styles.statusText, { color: status.color }]}>
            {status.text}
          </Text>
          {status.text === 'Completed' && (
            <Ionicons name="checkmark-circle" size={16} color={status.color} style={styles.statusIcon} />
          )}
        </View>
      </View>

      <View style={styles.budgetCardSection}>
        <Text style={styles.budgetCardLabel}>Entries on {selectedDate}</Text>
        {displayData.entries.length === 0 ? (
          <Text style={styles.noEntriesText}>No entries</Text>
        ) : (
          displayData.entries.map((entry) => (
            <View key={entry.id} style={styles.entryItem}>
              <Text style={styles.entryText}>
                At {new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}:
                {' '}Actual: ₹{(parseFloat(entry.actual_value) || 0).toFixed(2)} ({entry.remarks})
              </Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>Actual Value</Text>
        <TextInput
          style={styles.input}
          placeholder="Expense Value"
          value={expenseInputs[budget.id]?.actual_value || ""}
          onChangeText={(val) => handleInputChange(budget.id, 'actual_value', val)}
          keyboardType="numeric"
        />
        
        <Text style={styles.inputLabel}>Remarks</Text>
        <TextInput
          style={styles.input}
          placeholder="Remarks"
          value={expenseInputs[budget.id]?.remarks || ""}
          onChangeText={(val) => handleInputChange(budget.id, 'remarks', val)}
        />
        
        <TouchableOpacity
          onPress={() => handleSave(budget.id)}
          style={[
            styles.saveButton,
            (submitting || !expenseInputs[budget.id] || 
             Object.values(expenseInputs[budget.id] || {}).every(val => val === "" || val === null)) && 
            styles.saveButtonDisabled
          ]}
          disabled={
            submitting ||
            !expenseInputs[budget.id] ||
            Object.values(expenseInputs[budget.id] || {}).every(val => val === "" || val === null)
          }
        >
          <Ionicons name="save-outline" size={16} color="white" style={styles.saveIcon} />
          <Text style={styles.saveButtonText}>Save Expense</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function BudgetExpenseEntry() {
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
    companyModalVisible: false,
    projectModalVisible: false,
    siteModalVisible: false,
    workDescModalVisible: false,
    dropdownsCollapsed: false,
    selectedDate: new Date().toISOString().split('T')[0],
    expenseDetails: {},
    selectedProduct: null,
    showProductCards: true,
  });

  const [expenseInputs, setExpenseInputs] = useState({});
  const [searchQueryCompany, setSearchQueryCompany] = useState("");
  const [searchQueryProject, setSearchQueryProject] = useState("");
  const [searchQuerySite, setSearchQuerySite] = useState("");
  const [searchQueryWorkDesc, setSearchQueryWorkDesc] = useState("");

  const updateState = useCallback((updates) => {
    setState(prevState => ({ ...prevState, ...updates }));
  }, []);

  const apiService = useMemo(() => ({
    async fetchCompanies() {
      const response = await apiClient.get('/project/companies');
      console.log('Companies API Response:', response.data);
      return response.data || [];
    },

    async fetchProjects(companyId) {
      console.log('Fetching projects for company ID:', companyId);
      const response = await apiClient.get(`/project/projects-with-sites/${companyId}`);
      console.log('Projects API Response:', response.data);
      return response.data || [];
    },

    async fetchWorkDescriptions(siteId) {
      const response = await apiClient.get(`/site-incharge/budget-work-descriptions/${siteId}`);
      return response.data?.data || [];
    },

    async fetchBudgetDetails(siteId) {
      const response = await apiClient.get(`/site-incharge/budget-details?site_id=${siteId}`);
      return response.data?.data || [];
    },

    async fetchExpenseDetails(budgetId, date) {
      const response = await apiClient.get(
        `/site-incharge/budget-expense-details?actual_budget_id=${budgetId}&date=${date}`
      );
      return response.data?.data || {};
    },

    async saveBudgetExpense(payload) {
      const response = await apiClient.post('/site-incharge/save-budget-expense', payload);
      return response.data;
    },
  }), []);

  // Call calculate-labour-budget API on component mount
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

  useEffect(() => {
    let isMounted = true;
    
    const fetchCompanies = async () => {
      try {
        updateState({ loading: true });
        const companies = await apiService.fetchCompanies();
        if (isMounted) {
          updateState({ companies });
        }
      } catch (error) {
        if (isMounted) {
          const message = handleApiError(error, 'fetch companies');
          Toast.show({ type: 'error', text1: message });
        }
      } finally {
        if (isMounted) {
          updateState({ loading: false });
        }
      }
    };
    
    fetchCompanies();
    
    return () => {
      isMounted = false;
    };
  }, [apiService, updateState]);

  useEffect(() => {
    let isMounted = true;
    
    if (state.selectedCompany) {
      const fetchProjects = async () => {
        try {
          updateState({ loading: true });
          const projects = await apiService.fetchProjects(state.selectedCompany.company_id);
          if (isMounted) {
            updateState({ 
              projects,
              selectedProject: null,
              sites: [],
              selectedSite: null,
              selectedWorkDesc: null,
              budgetData: [],
              filteredBudget: [],
              expenseDetails: {},
            });
            setExpenseInputs({});
          }
        } catch (error) {
          if (isMounted) {
            const message = handleApiError(error, 'fetch projects');
            Toast.show({ type: 'error', text1: message });
          }
        } finally {
          if (isMounted) {
            updateState({ loading: false });
          }
        }
      };
      fetchProjects();
    } else {
      if (isMounted) {
        updateState({
          projects: [],
          selectedProject: null,
          sites: [],
          selectedSite: null,
          selectedWorkDesc: null,
          budgetData: [],
          filteredBudget: [],
          expenseDetails: {},
        });
        setExpenseInputs({});
      }
    }
    
    return () => {
      isMounted = false;
    };
  }, [state.selectedCompany, apiService, updateState]);

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
        expenseDetails: {},
      });
      setExpenseInputs({});
    }
  }, [state.selectedProject, state.projects, updateState]);

  useEffect(() => {
    let isMounted = true;
    
    if (state.selectedSite) {
      const fetchSiteData = async () => {
        try {
          updateState({ loading: true });
          
          const [workDescs, budgetData] = await Promise.all([
            apiService.fetchWorkDescriptions(state.selectedSite.site_id),
            apiService.fetchBudgetDetails(state.selectedSite.site_id),
          ]);
          
          if (isMounted) {
            updateState({ 
              workDescs,
              budgetData,
              filteredBudget: budgetData,
              expenseDetails: {},
            });
          }
        } catch (error) {
          if (isMounted) {
            const message = handleApiError(error, 'fetch site data');
            Toast.show({ type: 'error', text1: message });
          }
        } finally {
          if (isMounted) {
            updateState({ loading: false });
          }
        }
      };
      fetchSiteData();
    }
    
    return () => {
      isMounted = false;
    };
  }, [state.selectedSite, apiService, updateState]);

  useEffect(() => {
    if (state.selectedWorkDesc) {
      const filtered = state.budgetData.filter(
        item => item.work_desc_id === state.selectedWorkDesc.work_desc_id
      );
      updateState({ filteredBudget: filtered });
    } else {
      updateState({ filteredBudget: state.budgetData });
    }
  }, [state.selectedWorkDesc, state.budgetData, updateState]);

  useEffect(() => {
    if (state.selectedDate && state.filteredBudget.length > 0) {
      const fetchAllExpenseDetails = async () => {
        try {
          const expenseDetailsPromises = state.filteredBudget.map(budget => 
            apiService.fetchExpenseDetails(budget.id, state.selectedDate)
          );
          
          const expenseDetailsResults = await Promise.all(expenseDetailsPromises);
          const expenseDetailsMap = {};
          
          state.filteredBudget.forEach((budget, index) => {
            expenseDetailsMap[budget.id] = expenseDetailsResults[index];
          });
          
          updateState({ expenseDetails: expenseDetailsMap });
        } catch (error) {
          console.error("Error fetching expense details:", error);
        }
      };
      
      fetchAllExpenseDetails();
    }
  }, [state.selectedDate, state.filteredBudget, apiService, updateState]);

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
  }, [state.selectedSite, state.selectedWorkDesc, apiService, updateState]);

  const handleInputChange = useCallback((budgetId, field, value) => {
    if (field === 'actual_value') {
      // Allow only numbers and decimal point
      const numericValue = value.replace(/[^0-9.]/g, '');
      // Ensure only one decimal point
      const decimalCount = (numericValue.match(/\./g) || []).length;
      if (decimalCount > 1) return;
      
      setExpenseInputs(prevInputs => ({
        ...prevInputs,
        [budgetId]: { 
          ...prevInputs[budgetId], 
          [field]: numericValue 
        },
      }));
    } else {
      // Handle other fields normally
      setExpenseInputs(prevInputs => ({
        ...prevInputs,
        [budgetId]: { 
          ...prevInputs[budgetId], 
          [field]: value 
        },
      }));
    }
  }, []);

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
      
      // For demo purposes, we'll use a mock user ID
      const user_id = "1"; // In a real app, this would come from authentication

      const payload = {
        actual_budget_id: budgetId,
        entry_date: state.selectedDate,
        actual_value: parseFloat(inputData.actual_value),
        remarks: inputData.remarks || '',
        created_by: parseInt(user_id)
      };

      await apiService.saveBudgetExpense(payload);
      
      // Refresh expense details after saving
      const expenseDetail = await apiService.fetchExpenseDetails(budgetId, state.selectedDate);
      updateState(prevState => ({
        ...prevState,
        expenseDetails: {
          ...prevState.expenseDetails,
          [budgetId]: expenseDetail
        }
      }));
      
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
  }, [expenseInputs, state.selectedDate, apiService, updateState]);

  // Filter data based on search queries
  const filteredCompanies = useMemo(() => {
    return state.companies.filter(company => 
      company.company_name.toLowerCase().includes(searchQueryCompany.toLowerCase())
    );
  }, [state.companies, searchQueryCompany]);

  const filteredProjects = useMemo(() => {
    return state.projects.filter(project => 
      project.project_name.toLowerCase().includes(searchQueryProject.toLowerCase())
    );
  }, [state.projects, searchQueryProject]);

  const filteredSites = useMemo(() => {
    return state.sites.filter(site => 
      site.site_name.toLowerCase().includes(searchQuerySite.toLowerCase())
    );
  }, [state.sites, searchQuerySite]);

  const filteredWorkDescs = useMemo(() => {
    return state.workDescs.filter(workDesc => 
      workDesc.desc_name.toLowerCase().includes(searchQueryWorkDesc.toLowerCase())
    );
  }, [state.workDescs, searchQueryWorkDesc]);

  // Handle modal selections with proper closing
  const handleCompanySelect = useCallback((item) => {
    updateState({ 
      selectedCompany: item,
      selectedProject: null,
      selectedSite: null,
      selectedWorkDesc: null,
      budgetData: [],
      filteredBudget: [],
      expenseDetails: {},
    });
    setExpenseInputs({});
  }, [updateState]);

  const handleProjectSelect = useCallback((item) => {
    updateState({ 
      selectedProject: item,
      selectedSite: null,
      selectedWorkDesc: null,
      budgetData: [],
      filteredBudget: [],
      expenseDetails: {},
    });
    setExpenseInputs({});
  }, [updateState]);

  const handleSiteSelect = useCallback((item) => {
    updateState({ selectedSite: item });
  }, [updateState]);

  const handleWorkDescSelect = useCallback((item) => {
    updateState({ selectedWorkDesc: item, dropdownsCollapsed: true });
  }, [updateState]);

  // Handle product usage button press
  const handleUsagePress = useCallback((budget) => {
    updateState({ 
      selectedProduct: budget, 
      showProductCards: false 
    });
  }, [updateState]);

  // Handle back from detail view
  const handleBackToProducts = useCallback(() => {
    updateState({ 
      selectedProduct: null, 
      showProductCards: true 
    });
  }, [updateState]);

  const renderCards = () => {
    if (state.loading && !state.refreshing) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#0f766e" />
          <Text style={styles.loadingText}>Loading budget data...</Text>
        </View>
      );
    }

    // Show consumables data after all selections are made
    if (state.selectedCompany && state.selectedProject && state.selectedSite) {
      // Show detail view for selected product
      if (!state.showProductCards && state.selectedProduct) {
        return (
          <View style={styles.cardsContainer}>
            <BudgetDetailCard
              budget={state.selectedProduct}
              expenseDetails={state.expenseDetails}
              expenseInputs={expenseInputs}
              handleInputChange={handleInputChange}
              handleSave={handleSave}
              selectedDate={state.selectedDate}
              submitting={state.submitting}
              onBack={handleBackToProducts}
            />
          </View>
        );
      }

      // Show product cards grid
      const consumablesBudgets = state.filteredBudget.filter(budget => budget.overhead_id !== 1 && budget.overhead_id !== 2);
      
      return (
        <View style={styles.cardsContainer}>
          <View style={styles.productGrid}>
            {consumablesBudgets.map((budget) => (
              <ProductCard
                key={budget.id}
                budget={budget}
                onUsagePress={handleUsagePress}
              />
            ))}
          </View>
          
          {consumablesBudgets.length === 0 && (
            <View style={styles.emptyCategory}>
              <Text style={styles.emptyCategoryText}>No consumables data available</Text>
            </View>
          )}
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Ionicons name="document-text-outline" size={48} color="#cbd5e1" />
        <Text style={styles.emptyStateText}>
          Please complete all selections to view consumables data
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
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
        {/* Dropdown Section */}
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

        <View style={styles.budgetContainer}>
          {renderCards()}
        </View>
      </ScrollView>

      {/* Floating Button */}
      {state.dropdownsCollapsed && (
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => updateState({ dropdownsCollapsed: false })}
        >
          <Ionicons name="list" size={24} color="white" />
        </TouchableOpacity>
      )}

      {/* Dropdown Modals */}
      <DropdownModal
        visible={state.companyModalVisible}
        onClose={() => {
          updateState({ companyModalVisible: false });
          setSearchQueryCompany("");
        }}
        data={filteredCompanies}
        title="Select Company"
        keyProp="company_id"
        searchQuery={searchQueryCompany}
        setSearchQuery={setSearchQueryCompany}
        onSelect={handleCompanySelect}
      />

      <DropdownModal
        visible={state.projectModalVisible}
        onClose={() => {
          updateState({ projectModalVisible: false });
          setSearchQueryProject("");
        }}
        data={filteredProjects}
        title="Select Project"
        keyProp="project_id"
        searchQuery={searchQueryProject}
        setSearchQuery={setSearchQueryProject}
        onSelect={handleProjectSelect}
      />

      <DropdownModal
        visible={state.siteModalVisible}
        onClose={() => {
          updateState({ siteModalVisible: false });
          setSearchQuerySite("");
        }}
        data={filteredSites}
        title="Select Site"
        keyProp="site_id"
        searchQuery={searchQuerySite}
        setSearchQuery={setSearchQuerySite}
        onSelect={handleSiteSelect}
      />

      <DropdownModal
        visible={state.workDescModalVisible}
        onClose={() => {
          updateState({ workDescModalVisible: false });
          setSearchQueryWorkDesc("");
        }}
        data={filteredWorkDescs}
        title="Select Work Description"
        keyProp="work_desc_id"
        searchQuery={searchQueryWorkDesc}
        setSearchQuery={setSearchQueryWorkDesc}
        onSelect={handleWorkDescSelect}
      />

      <Toast />
    </SafeAreaView>
  );
}

// Styles (same as before)
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  dropdownSection: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  budgetContainer: {
    marginBottom: 20,
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
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 16,
    fontWeight: '400',
  },
  cardsContainer: {
    flexDirection: 'column',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  emptyCategory: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyCategoryText: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 8,
    width: (width / 2) - 50, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  productCardHeader: {
    width: '100%',
    marginBottom: 16,
  },
  productCardTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  productCardIcon: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f0f9ff',
    borderRadius: 50,
  },
  usageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#0891b2',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 24,
    width: '100%',
  },
  usageIcon: {
    marginRight: 6,
  },
  usageButtonText: {
    color: '#0891b2',
    fontSize: 14,
    fontWeight: '500',
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  budgetDetailCard: {
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
  budgetDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  budgetDetailTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  budgetCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  budgetCardSection: {
    marginBottom: 12,
  },
  budgetCardLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  budgetCardValue: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusIcon: {
    marginLeft: 4,
  },
  noEntriesText: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  entryItem: {
    marginBottom: 4,
  },
  entryText: {
    fontSize: 12,
    color: '#6b7280',
  },
  inputSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: 'white',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    padding: 12,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  saveIcon: {
    marginRight: 8,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  dropdownContainer: {
    marginBottom: 16,
  },
  dropdownLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  dropdownButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  dropdownButtonEnabled: {
    borderColor: '#d1d5db',
    backgroundColor: 'white',
  },
  dropdownButtonDisabled: {
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  dropdownButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownButtonText: {
    flex: 1,
    fontSize: 14,
    marginRight: 8,
  },
  dropdownPlaceholder: {
    color: '#9ca3af',
  },
  dropdownActiveText: {
    color: '#1f2937',
  },
  dropdownDisabledText: {
    color: '#9ca3af',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '100%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    backgroundColor:'#0f766e'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },
  modalList: {
    maxHeight: 300,
  },
  modalItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalItemText: {
    fontSize: 16,
    color: '#374151',
  },
  modalCancelButton: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
     backgroundColor:'#f3f4f6'
  },
  modalCancelText: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '600',
  },
  floatingButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0f766e',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});