import React, { useState, useEffect } from "react";
import { View, Text, Modal, TouchableOpacity, FlatList, SafeAreaView, TextInput as RNTextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { TextInput } from "react-native-paper";
import axios from "axios";
import WorkItemCard from "./WorkItemCard";
import UpdateModal from "./popupModels/UpdateModel";
import ViewModel from "./popupModels/ViewModel";

export default function Work() {
  const [selectedWork, setSelectedWork] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [siteSearch, setSiteSearch] = useState("");
  const [siteModalVisible, setSiteModalVisible] = useState(false);
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

  // Fetch sites from API
  const fetchSites = async () => {
    try {
      setLoadingSites(true);
      const res = await axios.get("http://103.118.158.33/api/reckoner/sites");
      if (res.data.success && Array.isArray(res.data.data)) {
        const options = res.data.data.map(site => ({
          id: site.site_id,
          name: site.site_name,
          po_number: site.po_number
        }));
        setWorks(options);
        if (options.length > 0 && !selectedWork) setSelectedWork(options[0]);
      } else {
        alert("Failed to load sites");
      }
    } catch (err) {
      console.log(err);
      alert("Site fetch error");
    } finally {
      setLoadingSites(false);
    }
  };

  // Fetch reckoner items from API
  const fetchReckonerData = async () => {
    if (!selectedWork) return;
    try {
      setLoadingItems(true);
      const res = await axios.get("http://103.118.158.33/api/reckoner/reckoner/");
      const data = res.data.success && Array.isArray(res.data.data) ? res.data.data : [];

      // Remove duplicates and filter by selected site
      const uniqueData = Array.from(new Map(data.map(item => [item.rec_id, item])).values())
        .filter(item => item.site_id === selectedWork.id); // string equality

      setItems(uniqueData);
      setFilteredItems(uniqueData);
    } catch (err) {
      console.log(err);
      alert("Failed to fetch reckoner data");
    } finally {
      setLoadingItems(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

  useEffect(() => {
    fetchReckonerData();
  }, [selectedWork]);

  // Handle new work input
  const handleNewWorkChange = (rec_id, value) => {
    setNewWorkData(prev => ({ ...prev, [rec_id]: value }));
  };

  // Submit new work entry
  const handleSubmit = async (item) => {
    try {
      setSubmitting(true);

      const alreadyCompleted = parseFloat(item.area_completed) || 0;
      const addition = parseFloat(newWorkData[item.rec_id]) || 0;
      const total = alreadyCompleted + addition;

      if (addition < 0) return alert("Area cannot be negative");
      if (total > parseFloat(item.po_quantity)) return alert(`Completed area cannot exceed PO qty (${item.po_quantity})`);

      const rate = parseFloat(item.rate) || 0;
      const value = parseFloat((total * rate).toFixed(2));

      const payload = {
        rec_id: item.rec_id,
        area_completed: total,
        rate,
        value,
        created_by: 1, // replace with actual user ID
      };

      await axios.post("http://103.118.158.33/api/site-incharge/completion-status", payload);
      alert("Updated successfully");

      setNewWorkData(prev => ({ ...prev, [item.rec_id]: "" }));

      // Update local state
      setItems(prev => prev.map(i => i.rec_id === item.rec_id ? { ...i, area_completed: total, value } : i));
      setFilteredItems(prev => prev.map(i => i.rec_id === item.rec_id ? { ...i, area_completed: total, value } : i));
    } catch (err) {
      console.log(err);
      alert("Failed to update");
    } finally {
      setSubmitting(false);
    }
  };

  // Filter sites and items based on search
  const filteredSites = works.filter(site => site.name.toLowerCase().includes(siteSearch.toLowerCase()));
  const displayedItems = filteredItems.filter(item => item.work_descriptions.toLowerCase().includes(searchQuery.toLowerCase()));

  const isCompleted = item => (parseFloat(item.area_completed || 0) >= parseFloat(item.po_quantity || 0));

  return (
    <>
      <View style={{ margin:12 , padding: 8, backgroundColor: "#fff", borderRadius: 10 }}>
      {/* Site Dropdown */}
      <Text style={{ fontWeight: "600", marginBottom: 5, fontSize: 14, color: '#fff' }}>Select Site</Text>
      <TouchableOpacity
        onPress={() => setSiteModalVisible(true)}
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
          marginBottom: 10
        }}
      >
        <Text style={{ color: selectedWork ? "#000" : "#888", fontSize: 14 }}>
          {selectedWork?.name || "Select Site"}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#888" />
      </TouchableOpacity>

      {/* Item Search */}
      <TextInput
        mode="outlined"
        label="Search"
        placeholder="e.g., Item"
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={{
          backgroundColor: "#fff",
          height: 42,
          borderRadius: 6,
        }}
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
      </View>


      {/* Site Modal */}
      <Modal visible={siteModalVisible} transparent animationType="fade">
        <TouchableOpacity style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", padding: 20 }} activeOpacity={1} onPressOut={() => setSiteModalVisible(false)}>
          <View style={{ backgroundColor: "#fff", borderRadius: 10, padding: 15, maxHeight: "70%" }}>
            <Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 10 }}>Select Site</Text>
            <TextInput
              mode="outlined"
              placeholder="Search Site"
              value={siteSearch}
              onChangeText={setSiteSearch}
              style={{ marginBottom: 10, backgroundColor: "#fff" }}
              theme={{ colors: { primary: "#333" } }}
              left={<TextInput.Icon icon={() => <Ionicons name="search" size={20} />} />}
            />
            {filteredSites.length ? (
              <FlatList
                data={filteredSites}
                keyExtractor={item => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity onPress={() => { setSelectedWork(item); setSiteModalVisible(false); }} style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#eee" }}>
                    <Text>{item.name}</Text>
                  </TouchableOpacity>
                )}
              />
            ) : <Text style={{ textAlign: "center", marginTop: 20, color: "#888" }}>No sites found</Text>}
          </View>
        </TouchableOpacity>
      </Modal>

      

      {/* Items List */}
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 20, paddingBottom: 10 }}>
        {selectedWork ? (
          loadingItems ? (
            <Text style={{ textAlign: "center", marginTop: 20 }}>Loading items...</Text>
          ) : displayedItems.length ? (
            <FlatList
              data={displayedItems}
              keyExtractor={item => item.rec_id.toString()}
              numColumns={1}
              contentContainerStyle={{ paddingBottom: 80 }}
              renderItem={({ item }) => (
            <WorkItemCard
              item={item}
              newWorkData={newWorkData}
              onChange={handleNewWorkChange}
              onSubmit={handleSubmit}
              submitting={submitting}
            />
          )}
            />
          ) : <Text style={{ textAlign: "center", marginTop: 20, color: "#888" }}>No items found</Text>
        ) : <Text style={{ textAlign: "center", marginTop: 20, color: "#888" }}>Please select a Site</Text>}
      </SafeAreaView>

      {/* Modals */}
      <ViewModel visible={viewVisible} onClose={() => setViewVisible(false)} workItem={selectedItem} />
      <UpdateModal visible={updateVisible} onClose={() => setUpdateVisible(false)} item={selectedItem} />
    </>
  );
}
