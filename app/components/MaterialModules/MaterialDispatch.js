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

const API_BASE = "http://10.151.144.28:5000";

const Material = () => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
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
  const [ackDetails, setAckDetails] = useState({});
  const [loading, setLoading] = useState({
    projects: false,
    materials: false,
    sites: false,
  });

  const [updateQuantityModal, setUpdateQuantityModal] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // simple modal inputs
  const [quantityValue, setQuantityValue] = useState("");
  const [remarksValue, setRemarksValue] = useState("");

  // --- Search filter ---
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredMaterials(materials);
    } else {
      const filtered = materials.filter((item) =>
        (item.item_name || "").toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredMaterials(filtered);
    }
  }, [searchQuery, materials]);

  // --- Fetch Projects (with their sites) ---
  const fetchProjects = async () => {
    try {
      setLoading((prev) => ({ ...prev, projects: true }));
      const response = await axios.get(`${API_BASE}/project/projects-with-sites`);
      // server returned array of projects (each with .sites)
      setProjects(response.data || []); // keep original structure
    } catch (err) {
      console.error("Failed to load projects", err);
      setError("Failed to load projects");
    } finally {
      setLoading((prev) => ({ ...prev, projects: false }));
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // --- When project changes: populate sites, reset selections, auto-open site modal if sites exist ---
  useEffect(() => {
    if (selectedProject) {
      const selectedProjectData = projects.find(
        (project) => project.project_id === selectedProject
      );
      setSites(selectedProjectData ? selectedProjectData.sites || [] : []);
      setSelectedSite(null);
      setMaterials([]);
      setDispatchedMaterials([]);
      setAckDetails({});
      // Auto-open site modal (same UX as Work.js)
      if (selectedProjectData && Array.isArray(selectedProjectData.sites) && selectedProjectData.sites.length > 0) {
        setSiteModalVisible(true);
      }
    }
  }, [selectedProject, projects]);

  // --- Fetch Materials and ACK details for selected project & site ---
  const fetchDispatchDetails = async () => {
    if (!selectedProject || !selectedSite) return;

    setLoading((prev) => ({ ...prev, materials: true }));
    try {
      const response = await axios.get(
        `${API_BASE}/material/dispatch-details/?pd_id=${selectedProject}&site_id=${selectedSite}`
      );

      // Deduplicate dispatches by id (Map) — keep your existing approach
      const dispatchMap = new Map();
      (response.data.data || []).forEach((dispatch) => {
        if (!dispatchMap.has(dispatch.id)) {
          dispatchMap.set(dispatch.id, dispatch);
        }
      });
      const uniqueDispatches = Array.from(dispatchMap.values());

      setMaterials(uniqueDispatches);
      setDispatchedMaterials(uniqueDispatches);

      // Fetch acknowledgement details for each dispatch (parallel)
      const ackPromises = uniqueDispatches.map((dispatch) =>
        axios
          .get(
            `${API_BASE}/site-incharge/acknowledgement-details?material_dispatch_id=${dispatch.id}`
          )
          .catch((err) => {
            // treat as empty ack if any error for a particular dispatch
            return { data: { data: [] } };
          })
      );

      const ackResponses = await Promise.all(ackPromises);
      const ackMap = {};
      ackResponses.forEach((ackResponse, index) => {
        const dispatchId = uniqueDispatches[index].id;
        const ackData = (ackResponse.data && ackResponse.data.data && ackResponse.data.data[0]) || null;
        ackMap[dispatchId] = ackData;
      });
      setAckDetails(ackMap);
      setError(null);
    } catch (err) {
      console.error("Error fetching dispatch details:", err);
      setError("Failed to fetch dispatch or acknowledgement details");
      setMaterials([]);
      setDispatchedMaterials([]);
    } finally {
      setLoading((prev) => ({ ...prev, materials: false }));
    }
  };

  useEffect(() => {
    if (selectedProject && selectedSite) {
      fetchDispatchDetails();
    } else {
      setMaterials([]);
      setDispatchedMaterials([]);
    }
  }, [selectedProject, selectedSite]);

  // Format project/site for dropdown usage
  const projectData = projects.map((p) => ({
    label: p?.project_name,
    value: p?.project_id,
  }));

  const siteData = sites.map((s) => ({
    label: s?.site_name,
    value: s?.site_id,
  }));

  // --- Open update modal and prefill if existing ack present ---
  const openUpdateQuantityModal = (item) => {
    setSelectedItem(item);

    // clear previous values
    setQuantityValue("");
    setRemarksValue("");

    // If there's existing acknowledgment, prefill using existing structure
    const existingAckRecord = ackDetails[item.id] || null;
    const ackObj = existingAckRecord
      ? existingAckRecord.acknowledgement
        ? existingAckRecord.acknowledgement
        : existingAckRecord
      : null;

    if (ackObj) {
      // Prefer comp_a, fallback to comp_b, comp_c
      setQuantityValue(
        ackObj.comp_a_qty != null
          ? String(ackObj.comp_a_qty)
          : ackObj.comp_b_qty != null
          ? String(ackObj.comp_b_qty)
          : ackObj.comp_c_qty != null
          ? String(ackObj.comp_c_qty)
          : ""
      );
      setRemarksValue(
        ackObj.comp_a_remarks || ackObj.comp_b_remarks || ackObj.comp_c_remarks || ""
      );
    }

    setUpdateQuantityModal(true);
  };

  // helper to get dispatched material object for selected item (used by ViewMaterial)
  const getQuantityAndRemarksForItem = (itemId) => {
    return dispatchedMaterials.find((material) => material.id === itemId) || null;
  };

  // --- Submit ack (simple single-component flow keeps your original payload) ---
  const handleUpdateQuantity = async () => {
  if (!selectedItem) return;

  if (!quantityValue.trim()) {
    Alert.alert("Validation", "Please enter a quantity value.");
    return;
  }

  setSubmitting(true);
  try {
    const payload = {
      material_dispatch_id: parseInt(selectedItem.id),
      comp_a_qty: parseInt(quantityValue) || null,
      comp_b_qty: null,
      comp_c_qty: null,
      comp_a_remarks: remarksValue || null,
      comp_b_remarks: null,
      comp_c_remarks: null,
    };

    // check if acknowledgement already exists
    const existingAck = ackDetails[selectedItem.id];

    let response;
    if (existingAck) {
  await axios.put(`${API_BASE}/site-incharge/acknowledge-material/${selectedItem.id}`, payload);
} else {
  await axios.post(`${API_BASE}/site-incharge/acknowledge-material`, payload);
}


    Alert.alert("Success", response.data.message || "Acknowledgement saved");

    // refresh ack details
    const responseRefresh = await axios.get(
      `${API_BASE}/site-incharge/acknowledgement-details?material_dispatch_id=${selectedItem.id}`
    );
    setAckDetails((prev) => ({
      ...prev,
      [selectedItem.id]: responseRefresh.data.data[0] || null,
    }));

    setUpdateQuantityModal(false);
    setQuantityValue("");
    setRemarksValue("");
    setSelectedItem(null);
  } catch (err) {
    console.error("Error saving acknowledgement:", err.response?.data || err.message);
    Alert.alert(
      "Error",
      err.response?.data?.message || "Failed to save acknowledgement"
    );
  } finally {
    setSubmitting(false);
  }
};


  // --- Is item acknowledged? (checks any comp qty present) ---
  const isItemAcknowledged = (itemId) => {
    const ack = ackDetails[itemId];
    const maybe = ack && (ack.acknowledgement ? ack.acknowledgement : ack);
    return !!maybe && (maybe.comp_a_qty != null || maybe.comp_b_qty != null || maybe.comp_c_qty != null);
  };

  // Close update modal
  const closeUpdateModal = () => {
    setUpdateQuantityModal(false);
    setQuantityValue("");
    setRemarksValue("");
    setSelectedItem(null);
  };

  // --- Reusable dropdown-button & modal UI (kept inside this file as requested) ---
  const DropdownButton = ({ label, value, onPress, disabled }) => (
  <View className="mb-2">
    <Text className="mb-2 text-sm font-medium text-[#000]">{label}</Text>
    <TouchableOpacity
      disabled={disabled}
      onPress={onPress}
      className={`h-12 border rounded-lg justify-center px-4 w-full ${
        disabled
          ? "bg-gray-100 border-gray-300"
          : "bg-white border-gray-400 shadow-md"
      }`}
    >
      <View className="flex-row items-center justify-between">
        <Text
          className={`text-base ${
            !value ? "text-gray-400" : disabled ? "text-gray-500" : "text-black"
          }`}
        >
          {value ? value.label : `Select ${label}`}
        </Text>
        
      </View>
    </TouchableOpacity>
  </View>
);


  const DropdownModal = ({ visible, onClose, data, onSelect, title }) => (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/60">
        <TouchableOpacity
          className="items-center justify-center flex-1 p-4"
          activeOpacity={1}
          onPress={onClose}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {}}
            className="bg-white rounded-xl w-full max-w-md max-h-[80%] overflow-hidden"
          >
            <View className="p-4 bg-teal-600">
              <Text className="text-lg font-bold text-center text-white">{title}</Text>
            </View>

            <FlatList
              data={data}
              keyExtractor={(item) => String(item.value)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    onSelect(item);
                    onClose();
                  }}
                  className="px-6 py-4 border-b border-gray-100 active:bg-gray-50"
                >
                  <Text className="text-base text-gray-800">{item.label}</Text>
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={true}
              style={{ maxHeight: 400 }}
            />

            <TouchableOpacity
              onPress={onClose}
              className="items-center py-3 bg-gray-100"
            >
              <Text className="text-base font-medium text-gray-600">Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </View>
    </Modal>
  );

  return (
    <View className="flex-1 p-3 bg-gray-100">
      {/* Header with Project + Site Selection */}
      <View className="bg-[#fff] px-2 py-4 rounded-xl mb-2">
      <View className="">
        {/* Project Dropdown */}
        <DropdownButton
          label="Project"
          value={projectData.find((p) => p.value === selectedProject)}
          onPress={() => setProjectModalVisible(true)}
        />

        

        {/* Site Dropdown */}
        <DropdownButton
          label="Select site"
          value={siteData.find((s) => s.value === selectedSite)}
          onPress={() => setSiteModalVisible(true)}
          disabled={!selectedProject}
        />
      </View>


      {/* Search Bar */}
      <View className="flex-row items-center h-12 px-4 mb-6 bg-white border border-gray-200 shadow-sm rounded-xl">
        <Text className="mr-3 text-lg text-gray-400">🔍</Text>
        <TextInput
          className="flex-1 text-base text-gray-800"
          placeholder="Search materials..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery("")}
            className="p-1 ml-2"
          >
            <Text className="text-lg text-gray-400">✕</Text>
          </TouchableOpacity>
        )}
      </View>
      </View>

      {/* Project Modal */}
      <DropdownModal
        visible={projectModalVisible}
        onClose={() => setProjectModalVisible(false)}
        data={projectData}
        title="Select Project"
        onSelect={(item) => {
          setSelectedProject(item.value);
          setSelectedSite(null);
          setTimeout(() => {
          setSiteModalVisible(true);
        }, 300);
        }}

        
      />

      {/* Site Modal */}
      <DropdownModal
        visible={siteModalVisible}
        onClose={() => setSiteModalVisible(false)}
        data={siteData}
        title="Select Site"
        onSelect={(item) => setSelectedSite(item.value)}
      />

      {/* Update Quantity Modal */}
      <Modal visible={updateQuantityModal} transparent animationType="fade">
        <View className="items-center justify-center flex-1 p-5 bg-black/50">
          <View className="w-full p-5 bg-white rounded-2xl">
            <Text className="mb-3 text-base font-bold text-gray-800">
              Update Quantity
            </Text>

            <TextInput
              keyboardType="numeric"
              placeholder="Quantity val"
              value={quantityValue}
              onChangeText={setQuantityValue}
              className="border border-gray-300 rounded-lg px-2.5 py-2 mb-4"
            />

            <TextInput
              placeholder="Add Remarks"
              value={remarksValue}
              onChangeText={setRemarksValue}
              className="border border-gray-300 rounded-lg px-2.5 py-2 mb-4"
            />

            <View className="flex-row justify-end">
              <TouchableOpacity
                onPress={closeUpdateModal}
                disabled={submitting}
                className="py-2 px-3 mr-2.5 rounded-lg bg-gray-400"
              >
                <Text className="text-white">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleUpdateQuantity}
                disabled={submitting}
                className="px-3 py-2 bg-teal-600 rounded-lg"
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-white">Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Materials List */}
      {loading.materials ? (
        <View className="items-center justify-center flex-1">
          <ActivityIndicator size="large" color="#0D9488" />
          <Text className="mt-3 text-gray-500">Loading materials...</Text>
        </View>
      ) : filteredMaterials.length === 0 ? (
        <View className="items-center justify-center flex-1">
          {materials.length === 0 ? (
            <Text className="text-base text-center text-gray-500">
              No materials found. Select Project & Site.
            </Text>
          ) : (
            <View className="items-center">
              <Text className="mb-3 text-base text-center text-gray-500">
                No materials match "{searchQuery}"
              </Text>
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                className="px-4 py-2 bg-blue-500 rounded-lg"
              >
                <Text className="font-semibold text-white">Clear Search</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredMaterials}
          keyExtractor={(item) => item.id?.toString()}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: "space-between" }}
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
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* View Material Modal (keeps your props) */}
      <ViewMaterial
        visible={modalVisible}
        materialName={selectedItem?.item_name}
        item={selectedItem?.id}
        selectedItemData={getQuantityAndRemarksForItem(selectedItem?.id)}
        allDispatchedMaterials={dispatchedMaterials}
        ackDetails={ackDetails[selectedItem?.id]}
        onClose={() => setModalVisible(false)}
        onUpdate={() => {
          setModalVisible(false);
          openUpdateQuantityModal(selectedItem);
        }}
      />
    </View>
  );
};

export default Material;
