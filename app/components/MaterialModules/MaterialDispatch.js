import React, { useEffect, useState } from "react";
import {
  FlatList,
  View,
  Modal,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  TextInput,
} from "react-native";
import MaterialCard from "./MaterialCard";
import ViewMaterial from "./ViewMaterial";
import axios from "axios";
import PackageIcon from "./PackageIcon/PackageIcon";
const itemImages = {
  Cement: "https://picsum.photos/200/200?random=1",
  Steel: "https://picsum.photos/200/200?random=2",
  Sand: "https://picsum.photos/200/200?random=3",
  Bricks: "https://picsum.photos/200/200?random=4",
  Gravel: "https://picsum.photos/200/200?random=5",
  Paint: "https://picsum.photos/200/200?random=6",
};

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
  const [loading, setLoading] = useState({
    projects: false,
    materials: false,
    sites: false,
  });

  const [error, setError] = useState(null);

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

  // Fetch Projects
  const fetchProjects = async () => {
    try {
      setLoading((prev) => ({ ...prev, projects: true }));
      const response = await axios.get("http://103.118.158.33/api/material/projects");
      setProjects(response.data.data || []);
    } catch (error) {
      setError("Failed to load projects");
    } finally {
      setLoading((prev) => ({ ...prev, projects: false }));
    }
  };

  // Fetch Sites by project
  const fetchSites = async (pd_id) => {
    try {
      setLoading((prev) => ({ ...prev, sites: true }));
      const response = await axios.get(`http://103.118.158.33/api/material/sites/${pd_id}`);
      setSites(response.data.data || []);
      setSiteModalVisible(true); // open popup
    } catch (error) {
      setError("Failed to load sites");
    } finally {
      setLoading((prev) => ({ ...prev, sites: false }));
    }
  };

  // Fetch Materials based on project + site
  const fetchMaterials = async (pd_id, site_id) => {
    if (!pd_id || !site_id) return;
    try {
      setLoading((prev) => ({ ...prev, materials: true }));
      const response = await axios.get("http://103.118.158.33/api/material/dispatch-details", {
        params: { pd_id, site_id },
      });
      setMaterials(response.data.data || []);
    } catch (error) {
      setError("Failed to load materials");
      setMaterials([]);
    } finally {
      setLoading((prev) => ({ ...prev, materials: false }));
    }
  };

  // Fetch dispatched materials for selected project and site
  const fetchDispatchedMaterials = async () => {
    if (!selectedProject || !selectedSite) return;
    try {
      setLoading((prev) => ({ ...prev, materials: true }));
      setError(null);
      const response = await axios.get("http://103.118.158.33/api/material/dispatch-details", {
        params: { pd_id: selectedProject, site_id: selectedSite },
      });
      const materials = response.data.data || [];
      setDispatchedMaterials(materials);


      
    } catch (error) {
      console.error("Error fetching dispatched materials:", error);
      setError(
        error.response?.data?.message ||
        error.response?.data?.sqlMessage ||
        "Failed to load dispatched materials. Please try again."
      );
    } finally {
      setLoading((prev) => ({ ...prev, materials: false }));
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // when both project + site are chosen → fetch materials
  useEffect(() => {
    if (selectedProject && selectedSite) {
      fetchMaterials(selectedProject, selectedSite);
    } else {
      setMaterials([]);
    }
  }, [selectedProject, selectedSite]);

  useEffect(() => {
    if (selectedProject && selectedSite) {
      fetchDispatchedMaterials();
    }
  }, [selectedProject, selectedSite]);

  //fetched project data
  const projectData = projects.map((p) => ({
    label: p?.project_name,
    value: p?.pd_id,
  }));

  //fetched site data
  const siteData = sites.map((s) => ({
    label: s?.site_name,
    value: s?.site_id,
  }));

  // quantity and uom datas are extracted
  const quantityAndRemarks = dispatchedMaterials.map((qr,_) => ({
    assigned_quantity: qr?.assigned_quantity,
    comp_a_qty: qr?.comp_a_qty,
    comp_b_qty: qr?.comp_b_qty,
    comp_c_qty: qr?.comp_c_qty,
    comp_a_remarks: qr?.comp_a_remarks,
    comp_b_remarks: qr?.comp_b_remarks,
    comp_c_remarks: qr?.comp_c_remarks,
    uom_name: qr?.uom_name,
    item_id: qr?.id // Add item_id to match with selected item
  }));

  // Function to get quantity and remarks for selected item
  const getQuantityAndRemarksForItem = (itemId) => {
    return dispatchedMaterials.find(material => material.id === itemId) || null;
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
        <Text style={{ color: value ? "#000" : "#888" }}>
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
        {/* Filter Button */}
        <View style={{ marginHorizontal: 4, marginTop: 20 }}>
          <TouchableOpacity
            onPress={() => console.log('Filter pressed')}
            style={{
              height: 45,
              width: 45,
              borderWidth: 1,
              borderColor: "#ccc",
              borderRadius: 8,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "#fff",
            }}
          >
            <Text style={{ fontSize: 18, color: "#333" }}>⚙️</Text>
          </TouchableOpacity>
        </View>
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
          fetchSites(item.value);
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
          numColumns={3}
          renderItem={({ item }) => {
            // pick image by item name OR random fallback
            const imageUrl =
              itemImages[item.item_name] ||
              `https://picsum.photos/200/200?random=${item.id}`;

            return (
              <MaterialCard
                itemId={item.id}
                itemName={item.item_name}
                image={imageUrl}   //  now passing fake image
                
                onView={() => {
                  setSelectedItem(item);
                  setModalVisible(true);
                }}
              />
            );
          }}
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      )}

      {/* View Material Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <ViewMaterial
          visible={modalVisible}
          materialName={selectedItem?.item_name}
          item={selectedItem?.id}
          quantityAndRemarks={quantityAndRemarks}
          selectedItemData={getQuantityAndRemarksForItem(selectedItem?.id)}
          allDispatchedMaterials={dispatchedMaterials}
          onClose={() => setModalVisible(false)}
        />
      </Modal>
    </View>
  );
};

export default Material;