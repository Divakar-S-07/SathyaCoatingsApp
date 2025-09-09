import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { TextInput } from "react-native-paper";
import axios from "axios";
import WorkItemCard from "./WorkItemCard";
import UpdateModal from "./popupModels/UpdateModel";
import ViewModel from "./popupModels/ViewModel";
import DateTimePicker from "@react-native-community/datetimepicker";

const API = "http://10.151.144.28:5000";

const formatDate = (d) =>
  d instanceof Date ? d.toISOString().split("T")[0] : d;

// Material Usage Calculator Function
const calculateMaterialUsage = (workItems, materials) => {
  const materialUsage = {};
  
  materials.forEach(material => {
    const poNumber = material.po_number || material.order_no;
    
    // Find matching work items for this PO
    const relatedWorkItems = workItems.filter(work => work.po_number === poNumber);
    
    relatedWorkItems.forEach(workItem => {
      const materialKey = `${material.id}_${workItem.rec_id}`;
      
      // Get work completion data
      const completedArea = parseFloat(workItem.area_completed) || 0;
      const totalArea = parseFloat(workItem.po_quantity) || 0;
      const completionPercentage = totalArea > 0 ? (completedArea / totalArea) * 100 : 0;
      
      // Get material quantities
      let totalMaterialQty = parseFloat(material.assigned_quantity) || 0;
      const compAQty = parseFloat(material.comp_a_qty) || 0;
      const compBQty = parseFloat(material.comp_b_qty) || 0;
      const compCQty = parseFloat(material.comp_c_qty) || 0;
      
      const hasComponents = compAQty > 0 || compBQty > 0 || compCQty > 0;
      if (hasComponents) {
        totalMaterialQty = compAQty + compBQty + compCQty;
      }
      
      // Calculate expected consumption based on work completion
      const expectedConsumption = (totalMaterialQty * completionPercentage) / 100;
      
      // Unit standardization
      let displayUnit = material.uom_name;
      let normalizedQty = totalMaterialQty;
      let normalizedExpected = expectedConsumption;
      
      if (material.uom_name === 'ML') {
        normalizedQty = totalMaterialQty / 1000;
        normalizedExpected = expectedConsumption / 1000;
        displayUnit = 'LIT';
      } else if (material.uom_name === 'GMS') {
        normalizedQty = totalMaterialQty / 1000;
        normalizedExpected = expectedConsumption / 1000;
        displayUnit = 'KG';
      }
      
      const remainingQty = normalizedQty - normalizedExpected;
      const usageRate = normalizedQty > 0 ? (normalizedExpected / normalizedQty) * 100 : 0;
      
      // Determine status
      let status = 'ADEQUATE';
      if (completionPercentage >= 95) {
        status = usageRate >= 80 ? 'COMPLETED_EFFICIENT' : 'UNDERUSED';
      } else if (remainingQty < 0) {
        status = 'SHORTAGE';
      } else if (usageRate > 80 && completionPercentage < 60) {
        status = 'HIGH_CONSUMPTION';
      } else if (normalizedQty > normalizedExpected * 3) {
        status = 'EXCESS_STOCK';
      }
      
      materialUsage[materialKey] = {
        materialId: material.id,
        materialName: material.item_name,
        dcNumber: material.dc_no,
        dispatchDate: new Date(material.dispatch_date).toLocaleDateString(),
        vendorCode: material.vendor_code,
        
        recId: workItem.rec_id,
        categoryName: workItem.category_name,
        subcategoryName: workItem.subcategory_name,
        workDescription: workItem.work_descriptions,
        
        dispatchedQuantity: parseFloat(normalizedQty.toFixed(3)),
        expectedConsumption: parseFloat(normalizedExpected.toFixed(3)),
        remainingQuantity: parseFloat(remainingQty.toFixed(3)),
        unit: displayUnit,
        
        completedArea: completedArea,
        totalArea: totalArea,
        completionPercentage: parseFloat(completionPercentage.toFixed(1)),
        completionValue: parseFloat(workItem.completion_value) || 0,
        
        workRate: parseFloat(workItem.rate) || 0,
        usageRate: parseFloat(usageRate.toFixed(1)),
        status: status,
        
        components: hasComponents ? {
          componentA: {
            quantity: compAQty,
            remarks: material.comp_a_remarks,
            ratio: parseFloat(material.comp_ratio_a) || null,
            expectedUsage: compAQty > 0 ? (compAQty * completionPercentage) / 100 : 0
          },
          componentB: {
            quantity: compBQty,
            remarks: material.comp_b_remarks,
            ratio: parseFloat(material.comp_ratio_b) || null,
            expectedUsage: compBQty > 0 ? (compBQty * completionPercentage) / 100 : 0
          },
          componentC: compCQty > 0 ? {
            quantity: compCQty,
            remarks: material.comp_c_remarks,
            ratio: parseFloat(material.comp_ratio_c) || null,
            expectedUsage: (compCQty * completionPercentage) / 100
          } : null
        } : null
      };
    });
  });
  
  return materialUsage;
};

// Material Usage Dashboard Component
const MaterialUsageDashboard = ({ materialUsage }) => {
  const usageEntries = Object.entries(materialUsage);
  
  if (usageEntries.length === 0) return null;

  const getStatusColor = (status) => {
    const colors = {
      'SHORTAGE': '#e74c3c',
      'HIGH_CONSUMPTION': '#f39c12', 
      'EXCESS_STOCK': '#3498db',
      'COMPLETED_EFFICIENT': '#27ae60',
      'UNDERUSED': '#9b59b6',
      'ADEQUATE': '#95a5a6'
    };
    return colors[status] || '#95a5a6';
  };

  return (
    <View style={{
      backgroundColor: '#fff',
      margin: 12,
      padding: 16,
      borderRadius: 10,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <Ionicons name="analytics" size={24} color="#1e7a6f" />
        <Text style={{ 
          fontSize: 18, 
          fontWeight: 'bold', 
          marginLeft: 8,
          color: '#1e7a6f'
        }}>
          Material Usage Analysis
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {usageEntries.map(([key, data]) => (
          <View key={key} style={{
            backgroundColor: '#f8f9fa',
            borderRadius: 8,
            padding: 12,
            marginRight: 12,
            width: 280,
            borderLeftWidth: 4,
            borderLeftColor: getStatusColor(data.status)
          }}>
            <View style={{ marginBottom: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#2c3e50' }}>
                {data.materialName}
              </Text>
              <Text style={{ fontSize: 12, color: '#7f8c8d' }}>
                {data.subcategoryName} • DC#{data.dcNumber}
              </Text>
              <Text style={{ fontSize: 11, color: '#95a5a6' }}>
                Dispatched: {data.dispatchDate}
              </Text>
            </View>

            <View style={{ marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: 12, color: '#34495e' }}>Work Progress:</Text>
                <Text style={{ fontSize: 12, fontWeight: '500', color: '#2c3e50' }}>
                  {data.completionPercentage}%
                </Text>
              </View>
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: 12, color: '#34495e' }}>Material Used:</Text>
                <Text style={{ fontSize: 12, fontWeight: '500', color: '#2c3e50' }}>
                  {data.expectedConsumption} {data.unit}
                </Text>
              </View>
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: 12, color: '#34495e' }}>Remaining:</Text>
                <Text style={{ 
                  fontSize: 12, 
                  fontWeight: '500', 
                  color: data.remainingQuantity < 0 ? '#e74c3c' : '#27ae60'
                }}>
                  {data.remainingQuantity} {data.unit}
                </Text>
              </View>
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 12, color: '#34495e' }}>Usage Rate:</Text>
                <Text style={{ fontSize: 12, fontWeight: '500', color: '#2c3e50' }}>
                  {data.usageRate}%
                </Text>
              </View>
            </View>

            <View style={{
              backgroundColor: getStatusColor(data.status),
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 12,
              alignSelf: 'flex-start',
              marginBottom: 8
            }}>
              <Text style={{ fontSize: 10, color: '#fff', fontWeight: 'bold' }}>
                {data.status.replace('_', ' ')}
              </Text>
            </View>

            {data.components && (
              <View style={{ paddingTop: 8, borderTopWidth: 1, borderTopColor: '#ecf0f1' }}>
                <Text style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 4, color: '#34495e' }}>
                  Components:
                </Text>
                {data.components.componentA.quantity > 0 && (
                  <Text style={{ fontSize: 10, color: '#7f8c8d', marginBottom: 2 }}>
                    A: {data.components.componentA.expectedUsage.toFixed(1)} / {data.components.componentA.quantity}
                  </Text>
                )}
                {data.components.componentB.quantity > 0 && (
                  <Text style={{ fontSize: 10, color: '#7f8c8d', marginBottom: 2 }}>
                    B: {data.components.componentB.expectedUsage.toFixed(1)} / {data.components.componentB.quantity}
                  </Text>
                )}
                {data.components.componentC && (
                  <Text style={{ fontSize: 10, color: '#7f8c8d' }}>
                    C: {data.components.componentC.expectedUsage.toFixed(1)} / {data.components.componentC.quantity}
                  </Text>
                )}
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

// Material Alert Component
const MaterialAlert = ({ materialUsage }) => {
  const criticalIssues = Object.entries(materialUsage).filter(([_, data]) => 
    data.status === 'SHORTAGE' || data.status === 'HIGH_CONSUMPTION'
  );

  if (criticalIssues.length === 0) return null;

  return (
    <View style={{
      backgroundColor: '#fff3cd',
      borderColor: '#ffeaa7',
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      margin: 12,
      marginBottom: 0
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Ionicons name="warning" size={20} color="#f39c12" />
        <Text style={{ 
          fontWeight: '600', 
          color: '#856404', 
          marginLeft: 8,
          fontSize: 16 
        }}>
          Material Issues Detected
        </Text>
      </View>
      
      {criticalIssues.map(([key, data]) => (
        <View key={key} style={{ 
          backgroundColor: 'rgba(243, 156, 18, 0.1)',
          padding: 8,
          borderRadius: 6,
          marginBottom: 6
        }}>
          <Text style={{ fontWeight: '500', color: '#856404' }}>
            {data.materialName} ({data.subcategoryName})
          </Text>
          <Text style={{ color: '#856404', fontSize: 12 }}>
            {data.status === 'SHORTAGE' 
              ? `Shortage: Need ${Math.abs(data.remainingQuantity)} ${data.unit} more`
              : `High consumption: ${data.usageRate}% used for ${data.completionPercentage}% work`
            }
          </Text>
        </View>
      ))}
    </View>
  );
};

export default function Work() {
  const today = formatDate(new Date());

  const [selectedWork, setSelectedWork] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [siteSearch, setSiteSearch] = useState("");
  const [siteModalVisible, setSiteModalVisible] = useState(false);
  const [workModalVisible, setWorkModalVisible] = useState(false);

  const [viewVisible, setViewVisible] = useState(false);
  const [updateVisible, setUpdateVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [works, setWorks] = useState([]);
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);

  const [newWorkData, setNewWorkData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loadingSites, setLoadingSites] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [workDescLoading, setWorkDescLoading] = useState(false);

  const [selectedDate, setSelectedDate] = useState(today);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [historyData, setHistoryData] = useState({});
  const [selectedWorkDesc, setSelectedWorkDesc] = useState(null);
  const [materials, setMaterials] = useState([]);
  
  // Material Usage State
  const [materialUsage, setMaterialUsage] = useState({});

  const userId = 1;

  // Sites
  const fetchSites = async () => {
    try {
      setLoadingSites(true);
      const res = await axios.get(`${API}/reckoner/sites`);
      if (res.data.success && Array.isArray(res.data.data)) {
        const options = res.data.data.map((site) => ({
          id: site.site_id,
          name: site.site_name,
          po_number: site.po_number,
        }));
        setWorks(options);
        if (options.length > 0 && !selectedWork) setSelectedWork(options[0]);
      } else {
        alert("Failed to load sites");
      }
    } catch (err) {
      console.log(err);
      alert("Failed to load sites");
    } finally {
      setLoadingSites(false);
    }
  };

  // Reckoner
  const fetchReckonerData = async (preserveSelections = false) => {
    if (!selectedWork) return;
    try {
      setLoadingItems(true);
      const res = await axios.get(`${API}/reckoner/reckoner/`);
      const data =
        res.data.success && Array.isArray(res.data.data) ? res.data.data : [];
      const siteFiltered = data.filter(
        (item) => item.site_id === selectedWork.id
      );
      setItems(siteFiltered);

      const uniqueCategories = [
        ...new Set(siteFiltered.map((i) => i.category_name)),
      ];
      setCategories(uniqueCategories);

      if (!preserveSelections) {
        if (uniqueCategories.length > 0) {
          setSelectedCategory(uniqueCategories[0]);

          const worksForFirstCat = siteFiltered.filter(
            (i) => i.category_name === uniqueCategories[0]
          );
          if (worksForFirstCat.length > 0) {
            setSelectedWorkDesc(worksForFirstCat[0].work_descriptions);
            setFilteredItems(worksForFirstCat);
          } else {
            setSelectedWorkDesc(null);
            setFilteredItems([]);
          }
        } else {
          setSelectedCategory(null);
          setSelectedWorkDesc(null);
          setFilteredItems([]);
        }
        setHistoryData({});
      }
    } catch (err) {
      console.log(err);
      alert("Failed to fetch reckoner data");
    } finally {
      setLoadingItems(false);
    }
  };

  const categoryFilteredItems = useMemo(() => {
    if (!selectedCategory) return [];
    return items.filter((item) => item.category_name === selectedCategory);
  }, [items, selectedCategory]);

  const workOptions = useMemo(() => {
    if (!categoryFilteredItems.length) return [];
    const uniqueWorks = [
      ...new Set(categoryFilteredItems.map((i) => i.work_descriptions)),
    ];
    return uniqueWorks;
  }, [categoryFilteredItems]);

  useEffect(() => {
    if (!selectedCategory || !selectedWorkDesc) {
      setFilteredItems([]);
    } else {
      const workFiltered = categoryFilteredItems.filter(
        (item) => item.work_descriptions === selectedWorkDesc
      );
      setFilteredItems(workFiltered);
    }
  }, [categoryFilteredItems, selectedWorkDesc, selectedCategory]);

  const fetchHistoryData = async (rec_id, dateStr) => {
    try {
      const res = await axios.get(
        `${API}/site-incharge/completion-entries`,
        {
          params: { rec_id, date: dateStr },
        }
      );
      if (res.data.status === "success") {
        setHistoryData((prev) => ({
          ...prev,
          [rec_id]: res.data.data,
        }));
      } else {
        console.log("History fetch failed for", rec_id, res.data);
      }
    } catch (err) {
      console.log(
        "Entries fetch error:",
        rec_id,
        err?.response?.data || err.message
      );
    }
  };

  // Fetch materials for selected site
  const fetchMaterials = async () => {
    if (!selectedWork) return;
    try {
      const res = await axios.get(`${API}/material/dispatch-details`, {
        params: {
          pd_id: selectedWork.po_number,
          site_id: selectedWork.id,
        },
      });
      if (res.data.success && Array.isArray(res.data.data)) {
        setMaterials(res.data.data);
      } else {
        setMaterials([]);
      }
    } catch (err) {
      console.log("Material fetch error:", err.response?.data || err.message);
      setMaterials([]);
    }
  };

  // Calculate Material Usage when items and materials change
  useEffect(() => {
    if (filteredItems.length && materials.length) {
      const usage = calculateMaterialUsage(filteredItems, materials);
      setMaterialUsage(usage);
    } else {
      setMaterialUsage({});
    }
  }, [filteredItems, materials]);

  useEffect(() => {
    if (selectedWork) {
      fetchReckonerData();
      fetchMaterials();
      setSelectedDate(today);
    }
  }, [selectedWork]);

  useEffect(() => {
    fetchSites();
  }, []);

  useEffect(() => {
    if (selectedWork) {
      setSelectedDate(today);
      fetchReckonerData();
    }
  }, [selectedWork]);

  useEffect(() => {
    if (!filteredItems.length || !selectedDate) return;
    filteredItems.forEach((r) => fetchHistoryData(r.rec_id, selectedDate));
    setNewWorkData({});
  }, [selectedDate, filteredItems]);

  const handleNewWorkChange = (rec_id, value) => {
    setNewWorkData((prev) => ({ ...prev, [rec_id]: value }));
  };

  const handleSubmit = async (item) => {
    try {
      setSubmitting(true);
      const addition = parseFloat(newWorkData[item.rec_id]) || 0;
      const alreadyCompleted = parseFloat(item.area_completed) || 0;
      const total = alreadyCompleted + addition;

      if (addition < 0) {
        alert("Area cannot be negative");
        return;
      }

      const rate = parseFloat(item.rate) || 0;
      const value = parseFloat((addition * rate).toFixed(2));

      const payload = {
        rec_id: item.rec_id,
        area_added: addition,
        rate,
        value,
        created_by: parseInt(userId, 10),
        entry_date: selectedDate,
      };

      await axios.post(`${API}/site-incharge/completion-status`, payload);

      alert("Entry added successfully");

      setNewWorkData((prev) => ({ ...prev, [item.rec_id]: "" }));

      await fetchReckonerData(true);
      await fetchHistoryData(item.rec_id, selectedDate);
    } catch (err) {
      console.log("Update error:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Failed to add entry");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredSites = works.filter((site) =>
    site.name.toLowerCase().includes(siteSearch.toLowerCase())
  );

  const displayedItems = filteredItems.filter((item) =>
    (item.work_descriptions || "")
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const groupedItems = displayedItems.reduce((acc, item) => {
    if (!acc[item.category_name]) acc[item.category_name] = [];
    acc[item.category_name].push(item);
    return acc;
  }, {});

  const handleCategorySelect = (category) => {
    setCategoryLoading(true);
    setSelectedCategory(category);
    setSelectedWorkDesc(null);
    setTimeout(() => setCategoryLoading(false), 300);
  };

  const handleWorkDescSelect = (workDesc) => {
    setWorkDescLoading(true);
    setSelectedWorkDesc(workDesc);
    setWorkModalVisible(false);
    setTimeout(() => setWorkDescLoading(false), 300);
  };

  return (
    <>
      <View style={{ margin: 12, padding: 8, backgroundColor: "#fff", paddingTop: 0 }}>
        <View style={{ marginVertical: 10, flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={{
              borderWidth: 1,
              borderColor: "#ccc",
              borderRadius: 6,
              padding: 10,
              backgroundColor: "#fff",
              flex: 1,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text>
              {selectedDate
                ? new Date(selectedDate).toLocaleDateString()
                : "Select Date"}
            </Text>
            <Ionicons name="calendar" size={20} color="#888" />
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={selectedDate ? new Date(selectedDate) : new Date()}
              mode="date"
              display="default"
              minimumDate={new Date()}
              maximumDate={new Date()}
              onChange={(event, date) => {
                setShowDatePicker(false);
                if (date) setSelectedDate(formatDate(date));
              }}
            />
          )}
        </View>

        <View>
          <View>
            <Text style={{ fontWeight: "600", marginBottom: 5, fontSize: 12, color: "#000" }}>
              Select Site
            </Text>
            <TouchableOpacity
              onPress={() => setSiteModalVisible(true)}
              style={{
                height: 35,
                borderWidth: 1,
                borderColor: "#ccc",
                borderRadius: 6,
                backgroundColor: "#fff",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 10,
                marginBottom: 5,
              }}
            >
              <Text style={{ color: selectedWork ? "#000" : "#888", fontSize: 14 }}>
                {selectedWork?.name || "Select Site"}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#888" />
            </TouchableOpacity>
          </View>
        </View>

        <TextInput
          mode="outlined"
          label="Search"
          placeholder="e.g., Item"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={{ backgroundColor: "#fff", height: 36, borderRadius: 6 }}
          theme={{ colors: { primary: "#333" } }}
          left={<TextInput.Icon icon={() => <Ionicons name="search" size={18} />} />}
          right={
            searchQuery ? (
              <TextInput.Icon
                icon={() => <Ionicons name="close-circle" size={18} />}
                onPress={() => setSearchQuery("")}
              />
            ) : null
          }
        />

        <View style={{ marginTop: 10 }}>
          {categories.length > 0 && (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 4, marginBottom: 10 }}>
                {categories.map((category, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => handleCategorySelect(category)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      backgroundColor: selectedCategory === category ? "#1e7a6f" : "#f0f0f0",
                      borderRadius: 20,
                      marginRight: 10,
                    }}
                  >
                    <Text style={{ color: selectedCategory === category ? "#fff" : "#000" }} className="text-sm">
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}
        </View>

        {selectedCategory && (
          <View style={{}}>
            <TouchableOpacity
              onPress={() => setWorkModalVisible(true)}
              style={{
                height: 40,
                borderWidth: 1,
                borderColor: "#ccc",
                borderRadius: 6,
                backgroundColor: "#fff",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 10,
                marginBottom: 10,
              }}
            >
              <Text style={{ color: selectedWorkDesc ? "#000" : "#888", fontSize: 12 }}>
                {workDescLoading ? "Loading..." : (selectedWorkDesc || "Select Work Description")}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#888" />
            </TouchableOpacity>

            {selectedWorkDesc && (
              <TouchableOpacity
                onPress={() => setSelectedWorkDesc(null)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <Ionicons name="close-circle" size={16} color="#888" />
                <Text style={{ marginLeft: 5, fontSize: 12, color: "#888" }}>
                  Clear Selection
                </Text>
              </TouchableOpacity>
            )}

            <Modal visible={workModalVisible} transparent animationType="fade">
              <TouchableOpacity
                style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", padding: 20 }}
                activeOpacity={1}
                onPressOut={() => setWorkModalVisible(false)}
              >
                <View style={{ backgroundColor: "#fff", borderRadius: 10, padding: 15, maxHeight: "70%" }}>
                  <Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 10 }}>
                    Select Work Description
                  </Text>
                  {workOptions.length > 0 ? (
                    <FlatList
                      data={workOptions}
                      keyExtractor={(item, idx) => idx.toString()}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          onPress={() => handleWorkDescSelect(item)}
                          style={{
                            paddingVertical: 12,
                            borderBottomWidth: 1,
                            borderBottomColor: "#eee",
                          }}
                        >
                          <Text>{item}</Text>
                        </TouchableOpacity>
                      )}
                    />
                  ) : (
                    <Text style={{ textAlign: "center", marginTop: 20, color: "#888" }}>
                      No work descriptions found for this category
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            </Modal>
          </View>
        )}
      </View>

      {/* Material Usage Components */}
      {selectedWork && Object.keys(materialUsage).length > 0 && (
        <>
          <MaterialAlert materialUsage={materialUsage} />
          <MaterialUsageDashboard materialUsage={materialUsage} />
        </>
      )}

      {/* Site Modal */}
      <Modal visible={siteModalVisible} transparent animationType="fade">
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", padding: 20 }}
          activeOpacity={1}
          onPressOut={() => setSiteModalVisible(false)}
        >
          <View style={{ backgroundColor: "#fff", borderRadius: 10, padding: 15, maxHeight: "70%" }}>
            <Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 10 }}>
              Select Site
            </Text>
            <TextInput
              mode="outlined"
              placeholder="Search Site"
              value={siteSearch}
              onChangeText={setSiteSearch}
              style={{ marginBottom: 10, backgroundColor: "#fff" }}
              theme={{ colors: { primary: "#333" } }}
              left={<TextInput.Icon icon={() => <Ionicons name="search" size={20} />} />}
            />
            {loadingSites ? (
              <View style={{ alignItems: "center", padding: 20 }}>
                <ActivityIndicator size="small" />
              </View>
            ) : filteredSites.length ? (
              <FlatList
                data={filteredSites}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedWork(item);
                      setSiteModalVisible(false);
                      setHistoryData({});
                    }}
                    style={{
                      paddingVertical: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: "#eee",
                    }}
                  >
                    <Text>{item.name}</Text>
                  </TouchableOpacity>
                )}
              />
            ) : (
              <Text style={{ textAlign: "center", marginTop: 20, color: "#888" }}>
                No sites found
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Items List */}
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 20, paddingBottom: 10 }}>
        {selectedWork ? (
          !selectedCategory ? (
            <View style={{ marginTop: 50, alignItems: "center" }}>
              <Ionicons name="list-outline" size={48} color="#ccc" />
              <Text style={{ color: "#888", fontSize: 16, marginTop: 10 }}>
                Please select a category to continue
              </Text>
            </View>
          ) : !selectedWorkDesc ? (
            <View style={{ marginTop: 50, alignItems: "center" }}>
              <Ionicons name="document-text-outline" size={48} color="#ccc" />
              <Text style={{ color: "#888", fontSize: 16, marginTop: 10 }}>
                Please select work description to view items
              </Text>
            </View>
          ) : loadingItems || categoryLoading || workDescLoading ? (
            <View style={{ marginTop: 50, alignItems: "center" }}>
              <ActivityIndicator size="large" color="#1e7a6f" />
              <Text style={{ marginTop: 10, color: "#1e7a6f" }}>
                {loadingItems ? "Loading items..." : 
                 categoryLoading ? "Loading category..." : 
                 "Loading work descriptions..."}
              </Text>
            </View>
          ) : Object.keys(groupedItems).length ? (
            <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
              {Object.keys(groupedItems).map((category, idx) => (
                <View key={idx} style={{ marginBottom: 20 }}>
                  {groupedItems[category]?.map((item) => {
                    const displayData =
                      historyData[item.rec_id] && typeof historyData[item.rec_id] === "object"
                        ? {
                            cumulative_area: parseFloat(historyData[item.rec_id]?.cumulative_area) || 0,
                            entries: Array.isArray(historyData[item.rec_id]?.entries)
                              ? historyData[item.rec_id].entries
                              : [],
                          }
                        : {
                            cumulative_area: parseFloat(item.area_completed) || 0,
                            entries: [],
                          };

                    return (
                      <WorkItemCard
                        key={item.rec_id}
                        item={item}
                        selectedDate={selectedDate}
                        displayData={displayData}
                        newWorkData={newWorkData}
                        onChange={handleNewWorkChange}
                        onSubmit={handleSubmit}
                        submitting={submitting}
                        materials={materials}
                        site={selectedWork}
                      />
                    );
                  })}
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={{ marginTop: 50, alignItems: "center" }}>
              <Ionicons name="document-outline" size={48} color="#ccc" />
              <Text style={{ color: "#888", fontSize: 16, marginTop: 10 }}>
                No items found for selected work description
              </Text>
              <TouchableOpacity
                onPress={() => setSelectedWorkDesc(null)}
                style={{ 
                  marginTop: 15, 
                  paddingHorizontal: 16, 
                  paddingVertical: 8, 
                  backgroundColor: "#1e7a6f", 
                  borderRadius: 6 
                }}
              >
                <Text style={{ color: "#fff", fontSize: 14 }}>Choose different work description</Text>
              </TouchableOpacity>
            </View>
          )
        ) : (
          <View style={{ marginTop: 50, alignItems: "center" }}>
            <Ionicons name="business-outline" size={48} color="#ccc" />
            <Text style={{ color: "#888", fontSize: 16, marginTop: 10 }}>
              Please select a site to get started
            </Text>
          </View>
        )}
      </SafeAreaView>

      {/* Modals */}
      <ViewModel
        visible={viewVisible}
        onClose={() => setViewVisible(false)}
        workItem={selectedItem}
      />
      <UpdateModal
        visible={updateVisible}
        onClose={() => setUpdateVisible(false)}
        item={selectedItem}
      />
    </>
  );
}