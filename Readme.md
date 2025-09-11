import React, { useEffect, useState } from "react";
import {
  FlatList,
  View,
  Modal,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import MaterialCard from "./MaterialCard";
import ViewMaterial from "./ViewMaterial";
import axios from "axios";
import { Picker } from "@react-native-picker/picker";

const Material = () => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalVisible, setModalVisible] = useState(false); // for ViewMaterial
  const [projectModalVisible, setProjectModalVisible] = useState(false);
  const [siteModalVisible, setSiteModalVisible] = useState(false);

  const [materials, setMaterials] = useState([]);
  const [filteredMaterials, setFilteredMaterials] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [projects, setProjects] = useState([]);
  const [sites, setSites] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedSite, setSelectedSite] = useState(null);
  const [dispatchedMaterials, setDispatchedMaterials] = useState([]);
  const [ackDetails, setAckDetails] = useState({}); // Store acknowledgement details by dispatch ID
  const [loading, setLoading] = useState({
    projects: false,
    materials: false,
    sites: false,
  });

  // Updated acknowledgement data structure to match web version
  const [acknowledgements, setAcknowledgements] = useState({});
  const [updateQuantityModal, setUpdateQuantityModal] = useState(false);
  const [error, setError] = useState(null);

  const [selectedComponent, setSelectedComponent] = useState(null);

  // Search functionality
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredMaterials(materials);
    } else {
      const filtered = materials.filter(item =>
        item.item_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredMaterials(filtered);
    }
  }, [searchQuery, materials]);

  // Fetch Projects and Sites (matching web version)
  const fetchProjects = async () => {
    try {
      setLoading((prev) => ({ ...prev, projects: true }));
      const response = await axios.get("http://103.118.158.127/api/project/projects-with-sites");
      setProjects(response.data || []);
    } catch (error) {
      setError("Failed to load projects");
    } finally {
      setLoading((prev) => ({ ...prev, projects: false }));
    }
  };

  // Update sites when project changes (matching web logic)
useEffect(() => {
  if (selectedProject) {
      const selectedProjectData = projects.find(
        (project) => project.project_id === selectedProject
      );
      setSites(selectedProjectData ? selectedProjectData.sites : []);
      setSelectedSite(null);
      setMaterials([]);
      setDispatchedMaterials([]);
      setAckDetails({});

      // 👇 Open Site modal automatically
      setSiteModalVisible(true);
    }
  }, [selectedProject, projects]);


  // Fetch Materials and Acknowledgements (matching web version exactly)
  const fetchDispatchDetails = async () => {
    if (!selectedProject || !selectedSite) return;
    
    setLoading((prev) => ({ ...prev, materials: true }));
    try {
      const response = await axios.get(
        `http://103.118.158.127/api/material/dispatch-details/?pd_id=${selectedProject}&site_id=${selectedSite}`
      );
      
      // Create a map to store unique dispatches by their ID (exactly like web)
      const dispatchMap = new Map();
      (response.data.data || []).forEach(dispatch => {
        if (!dispatchMap.has(dispatch.id)) {
          dispatchMap.set(dispatch.id, dispatch);
        }
      });
      
      // Convert map values back to array
      const uniqueDispatches = Array.from(dispatchMap.values());
      setMaterials(uniqueDispatches);
      setDispatchedMaterials(uniqueDispatches);

      // Fetch acknowledgement details for each dispatch (exactly like web)
      const ackPromises = uniqueDispatches.map(dispatch =>
        axios.get(
          `http://103.118.158.127/api/site-incharge/acknowledgement-details?material_dispatch_id=${dispatch.id}`
        ).catch(err => ({ data: { data: [] } })) // Handle cases where no acknowledgement exists
      );

      const ackResponses = await Promise.all(ackPromises);
      const ackMap = {};
      ackResponses.forEach((ackResponse, index) => {
        const dispatchId = uniqueDispatches[index].id;
        const ackData = ackResponse.data.data[0] || null;
        ackMap[dispatchId] = ackData;
      });
      setAckDetails(ackMap);
      setError(null);
    } catch (error) {
      console.error("Error fetching dispatch details:", error);
      setError("Failed to fetch dispatch or acknowledgement details");
      setMaterials([]);
      setDispatchedMaterials([]);
    } finally {
      setLoading((prev) => ({ ...prev, materials: false }));
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Fetch materials when both project and site are selected
  useEffect(() => {
    if (selectedProject && selectedSite) {
      fetchDispatchDetails();
    } else {
      setMaterials([]);
      setDispatchedMaterials([]);
    }
  }, [selectedProject, selectedSite]);

  // Format project data for dropdown
  const projectData = projects.map((p) => ({
    label: p?.project_name,
    value: p?.project_id,
  }));

  // Format site data for dropdown
  const siteData = sites.map((s) => ({
    label: s?.site_name,
    value: s?.site_id,
  }));

  // Handle input changes for acknowledgements
  const handleInputChange = (dispatchId, field, value) => {
    setAcknowledgements(prev => ({
      ...prev,
      [dispatchId]: {
        ...prev[dispatchId],
        [field]: value
      }
    }));
  };

  // When opening modal, initialize acknowledgement data for selected item
  const openUpdateQuantityModal = (item) => {
    setSelectedItem(item);
    // Initialize acknowledgement data if not exists
    if (!acknowledgements[item.id]) {
      setAcknowledgements(prev => ({
        ...prev,
        [item.id]: {
          comp_a_qty: "",
          comp_b_qty: "",
          comp_c_qty: "",
          comp_a_remarks: "",
          comp_b_remarks: "",
          comp_c_remarks: "",
        }
      }));
    }
    setUpdateQuantityModal(true);
  };

  // Function to get quantity and remarks for selected item
  const getQuantityAndRemarksForItem = (itemId) => {
    return dispatchedMaterials.find(material => material.id === itemId) || null;
  };

  // Handle acknowledgement submission (matching web version)
  const handleUpdateQuantity = async (dispatchId) => {
    const ackData = acknowledgements[dispatchId];
    if (!ackData) return;

    try {
      const response = await axios.post("http://103.118.158.127/api/site-incharge/acknowledge-material", {
        material_dispatch_id: parseInt(dispatchId),
        comp_a_qty: ackData.comp_a_qty !== "" ? parseInt(ackData.comp_a_qty) : null,
        comp_b_qty: ackData.comp_b_qty !== "" ? parseInt(ackData.comp_b_qty) : null,
        comp_c_qty: ackData.comp_c_qty !== "" ? parseInt(ackData.comp_c_qty) : null,
        comp_a_remarks: ackData.comp_a_remarks || null,
        comp_b_remarks: ackData.comp_b_remarks || null,
        comp_c_remarks: ackData.comp_c_remarks || null,
      });
      
      Alert.alert("Success", response.data.message);
      
      // Refresh acknowledgement data for the specific dispatch (exactly like web)
      const responseRefresh = await axios.get(
        `http://103.118.158.127/api/site-incharge/acknowledgement-details?material_dispatch_id=${dispatchId}`
      );
      setAckDetails(prev => ({
        ...prev,
        [dispatchId]: responseRefresh.data.data[0] || null
      }));

      // Close modal and reset form
      setUpdateQuantityModal(false);
      setAcknowledgements(prev => ({
        ...prev,
        [dispatchId]: {
          comp_a_qty: "",
          comp_b_qty: "",
          comp_c_qty: "",
          comp_a_remarks: "",
          comp_b_remarks: "",
          comp_c_remarks: "",
        }
      }));
    } catch (err) {
      console.error("Error saving acknowledgement:", err.response?.data || err.message);
      Alert.alert("Error", err.response?.data?.message || "Failed to save acknowledgement");
    }
  };

  // Check if item is already acknowledged
  const isItemAcknowledged = (itemId) => {
    const ack = ackDetails[itemId];
    return ack && ack.acknowledgement;
  };

  // reusable dropdown trigger
  const DropdownButton = ({ label, value, onPress, disabled }) => (
    <View style={{ flex: 1, marginHorizontal: 4 }}>
      <Text style={{ marginBottom: 5, fontWeight: "600" }}>{label}</Text>
      <TouchableOpacity
        disabled={disabled}
        onPress={onPress}
        style={{
          height: 45,
          borderWidth: 1,
          borderColor: "#ccc",
          borderRadius: 8,
          justifyContent: "center",
          paddingHorizontal: 10,
          backgroundColor: disabled ? "#f0f0f0" : "#fff",
        }}
      >
        <Text style={{ color: value ? "#000" : "#888", fontSize: 12 }}>
          {value ? value.label : `Select ${label}`}
        </Text>
      </TouchableOpacity>
    </View>
  );

  // reusable modal list
  const DropdownModal = ({ visible, onClose, data, onSelect, title }) => (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.4)",
          justifyContent: "center",
          padding: 20,
        }}
        activeOpacity={1}
        onPressOut={onClose}
      >
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 10,
            padding: 15,
            maxHeight: "60%",
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 10 }}>
            Select {title}
          </Text>
          <FlatList
            data={data}
            keyExtractor={(item) => item.value.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
                style={{
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: "#eee",
                }}
              >
                <Text>{item.label}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <View style={{ flex: 1, padding: 12, backgroundColor: "#f3f4f6" }}>
      {/* Row with Project + Site + Filter */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 }}>
        {/* Project */}
        <DropdownButton
          label="Project"
          value={projectData.find((p) => p.value === selectedProject)}
          onPress={() => setProjectModalVisible(true)}
        />
        {/* Site */}
        <DropdownButton
          label="Site"
          value={siteData.find((s) => s.value === selectedSite)}
          onPress={() => setSiteModalVisible(true)}
          disabled={!selectedProject}
        />
      </View>

      {/* Search Bar */}
      <View style={{ 
        flexDirection: "row", 
        alignItems: "center", 
        backgroundColor: "#fff", 
        borderRadius: 8, 
        borderWidth: 1, 
        borderColor: "#ccc", 
        paddingHorizontal: 12, 
        marginBottom: 16,
        height: 45
      }}>
        <Text style={{ fontSize: 16, color: "#666", marginRight: 8 }}>🔍</Text>
        <TextInput
          style={{ 
            flex: 1, 
            fontSize: 16, 
            color: "#333",
            height: "100%"
          }}
          placeholder="Search materials..."
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity 
            onPress={() => setSearchQuery("")}
            style={{ padding: 4 }}
          >
            <Text style={{ fontSize: 16, color: "#666" }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Project Modal */}
      <DropdownModal
        visible={projectModalVisible}
        onClose={() => setProjectModalVisible(false)}
        data={projectData}
        title="Project"
        onSelect={(item) => {
          setSelectedProject(item.value);
          setSelectedSite(null);
        }}
      />

      {/* Site Modal */}
      <DropdownModal
        visible={siteModalVisible}
        onClose={() => setSiteModalVisible(false)}
        data={siteData}
        title="Site"
        onSelect={(item) => setSelectedSite(item.value)}
      />

      {/* Update Quantity Modal - Original Style */}
      <Modal
        visible={updateQuantityModal}
        animationType="slide"
        transparent
      >
        <View style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
          backgroundColor: 'rgba(0,0,0,0.5)'
        }}>
          <View style={{
            width: '100%',
            overflow: 'hidden',
            backgroundColor: 'white',
            borderRadius: 16
          }}>

            {/* Header */}
            <View style={{ backgroundColor: '#167a6f' }}>
              <Text style={{
                padding: 16,
                fontWeight: 'bold',
                textAlign: 'center',
                color: 'white'
              }}>
                Update Quantity
              </Text>
            </View>

            {/* Body */}
            <View style={{ padding: 20 }}>
              {selectedItem && (
                <>
                  {/* Material Name */}
                  {/* <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 16 }}>
                    {selectedItem.item_name}
                  </Text> */}

                  {/* Component Dropdown */}
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ marginBottom: 8, fontWeight: '600' }}>Select Component</Text>
                    <View style={{
                      borderWidth: 1,
                      borderColor: '#ccc',
                      borderRadius: 8
                    }}>
                      <Picker
                        selectedValue={selectedComponent}
                        onValueChange={(value) => setSelectedComponent(value)}
                      >
                        <Picker.Item label="Choose Component" value={null} />
                        {selectedItem.comp_a_qty !== null && (
                          <Picker.Item 
                            label={`Component A (Dispatched: ${selectedItem.comp_a_qty})`} 
                            value="comp_a" 
                          />
                        )}
                        {selectedItem.comp_b_qty !== null && (
                          <Picker.Item 
                            label={`Component B (Dispatched: ${selectedItem.comp_b_qty})`} 
                            value="comp_b" 
                          />
                        )}
                        {selectedItem.comp_c_qty !== null && (
                          <Picker.Item 
                            label={`Component C (Dispatched: ${selectedItem.comp_c_qty})`} 
                            value="comp_c" 
                          />
                        )}
                      </Picker>
                    </View>
                  </View>

                  {/* Quantity and Remarks (only show when component is selected) */}
                  {selectedComponent && (
                    <>
                      <TextInput
                        keyboardType="numeric"
                        placeholder="Quantity"
                        value={acknowledgements[selectedItem.id]?.[`${selectedComponent}_qty`] || ""}
                        onChangeText={(text) => handleInputChange(selectedItem.id, `${selectedComponent}_qty`, text)}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          marginBottom: 16,
                          borderWidth: 1,
                          borderColor: '#ccc',
                          borderRadius: 8
                        }}
                      />

                      <TextInput
                        placeholder="Remarks"
                        value={acknowledgements[selectedItem.id]?.[`${selectedComponent}_remarks`] || ""}
                        onChangeText={(text) => handleInputChange(selectedItem.id, `${selectedComponent}_remarks`, text)}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          marginBottom: 16,
                          borderWidth: 1,
                          borderColor: '#ccc',
                          borderRadius: 8
                        }}
                        multiline
                      />
                    </>
                  )}
                </>
              )}

              {/* Footer Buttons */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                width: '100%',
                marginTop: 8
              }}>
                <TouchableOpacity
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    marginRight: 8,
                    backgroundColor: '#6b7280',
                    borderRadius: 8
                  }}
                  onPress={() => {
                    setUpdateQuantityModal(false);
                    setSelectedComponent(null);
                  }}
                >
                  <Text style={{ color: 'white' }}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    paddingHorizontal: 20,
                    paddingVertical: 8,
                    backgroundColor: '#167a6f',
                    borderRadius: 8,
                    opacity: !selectedComponent || !acknowledgements[selectedItem?.id]?.[`${selectedComponent}_qty`] ? 0.5 : 1
                  }}
                  onPress={() => handleUpdateQuantity(selectedItem?.id)}
                  disabled={!selectedComponent || !acknowledgements[selectedItem?.id]?.[`${selectedComponent}_qty`]}
                >
                  <Text style={{
                    fontWeight: 'bold',
                    color: 'white'
                  }}>
                    Save Acknowledgement
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Items List */}
      {loading.materials ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="teal" />
          <Text style={{ marginTop: 10 }}>Loading materials...</Text>
        </View>
      ) : filteredMaterials.length === 0 ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          {materials.length === 0 ? (
            <Text>No materials found. Select Project & Site.</Text>
          ) : (
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 16, color: "#666", marginBottom: 4 }}>
                No materials match "{searchQuery}"
              </Text>
              <TouchableOpacity 
                onPress={() => setSearchQuery("")}
                style={{ 
                  paddingHorizontal: 16, 
                  paddingVertical: 8, 
                  backgroundColor: "#007bff", 
                  borderRadius: 6 
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>Clear Search</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredMaterials}
          keyExtractor={(item) => item.id?.toString()}
          numColumns={2}
          renderItem={({ item }) => {
            const isAcknowledged = isItemAcknowledged(item.id);
            return (
              <MaterialCard
                itemId={item.id}
                itemName={item.item_name}
                isAcknowledged={isAcknowledged}
                onView={() => {
                  setSelectedItem(item);
                  setModalVisible(true);
                }}
                onUpdate={() => openUpdateQuantityModal(item)}
              />
            );
          }}
        />
      )}

      {/* View Material Modal */}
      
        <ViewMaterial
          visible={modalVisible}
          materialName={selectedItem?.item_name}
          item={selectedItem?.id}
          selectedItemData={getQuantityAndRemarksForItem(selectedItem?.id)}
          allDispatchedMaterials={dispatchedMaterials}
          ackDetails={ackDetails[selectedItem?.id]} // Pass acknowledgement details
          onClose={() => setModalVisible(false)}
          onUpdate={() => {
            setModalVisible(false);                // close detail modal
            openUpdateQuantityModal(selectedItem); // 👈 reuse same update modal
          }}
        />
    </View>
  );
};

export default Material;