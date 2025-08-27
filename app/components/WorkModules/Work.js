import React, { useState, useEffect } from "react";
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

const API = "http://103.118.158.33";

const formatDate = (d) =>
  d instanceof Date ? d.toISOString().split("T")[0] : d;

export default function Work() {
  const today = formatDate(new Date());

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

  const [categories, setCategories] = useState(["All"]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [categoryLoading, setCategoryLoading] = useState(false);

  // DATE: keep as YYYY-MM-DD (same as website)
  const [selectedDate, setSelectedDate] = useState(today);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Per-date history for each rec_id: { [rec_id]: { cumulative_area, entries[] } }
  const [historyData, setHistoryData] = useState({});

  // TODO: replace with your actual logged-in userId from auth
  const userId = 1;

  // Sites
  const fetchSites = async () => {
    try {
      setLoadingSites(true);
      const res = await axios.get(`${API}/api/reckoner/sites`);
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
  const fetchReckonerData = async () => {
    if (!selectedWork) return;
    try {
      setLoadingItems(true);
      const res = await axios.get(`${API}/api/reckoner/reckoner/`);
      const data =
        res.data.success && Array.isArray(res.data.data) ? res.data.data : [];
      const siteFiltered = data.filter((item) => item.site_id === selectedWork.id);
      setItems(siteFiltered);
      setFilteredItems(siteFiltered);
      const uniqueCategories = ["All", ...new Set(siteFiltered.map((i) => i.category_name))];
      setCategories(uniqueCategories);
      setSelectedCategory("All");
      setHistoryData({}); // reset history when site/records change
    } catch (err) {
      console.log(err);
      alert("Failed to fetch reckoner data");
    } finally {
      setLoadingItems(false);
    }
  };

  // History per rec_id for selectedDate
  const fetchHistoryData = async (rec_id, dateStr) => {
    try {
      const res = await axios.get(`${API}/api/site-incharge/completion-entries`, {
        params: { rec_id, date: dateStr },
      });
      if (res.data.status === "success") {
        setHistoryData((prev) => ({
          ...prev,
          [rec_id]: res.data.data, // { cumulative_area, entries }
        }));
      } else {
        // keep quiet but log for debugging
        console.log("History fetch failed for", rec_id, res.data);
      }
    } catch (err) {
      console.log("Entries fetch error:", rec_id, err?.response?.data || err.message);
    }
  };

  // INIT
  useEffect(() => {
    fetchSites();
  }, []);

  useEffect(() => {
    if (selectedWork) {
      // When site changes, also reset date to today to mirror website behavior
      setSelectedDate(today);
      fetchReckonerData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWork]);

  // Re-fetch history when date or filtered items change
  useEffect(() => {
    if (!filteredItems.length || !selectedDate) return;
    filteredItems.forEach((r) => fetchHistoryData(r.rec_id, selectedDate));
    setNewWorkData({});
  }, [selectedDate, filteredItems]);

  const handleNewWorkChange = (rec_id, value) => {
    setNewWorkData((prev) => ({ ...prev, [rec_id]: value }));
  };

  // Submit (date-aware)
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
      // if (total > parseFloat(item.po_quantity)) {
      //   alert(`Completed area cannot exceed PO qty (${item.po_quantity})`);
      //   return;
      // }

      const rate = parseFloat(item.rate) || 0;
      const value = parseFloat((addition * rate).toFixed(2));

      const payload = {
        rec_id: item.rec_id,
        area_added: addition,
        rate,
        value,
        created_by: parseInt(userId, 10),
        entry_date: selectedDate, // <-- YYYY-MM-DD
      };

      await axios.post(`${API}/api/site-incharge/completion-status`, payload);

      alert("Entry added successfully");

      // Reset input
      setNewWorkData((prev) => ({ ...prev, [item.rec_id]: "" }));

      // Refresh reckoner + history (mirror website)
      await fetchReckonerData();
      await fetchHistoryData(item.rec_id, selectedDate);
    } catch (err) {
      console.log("Update error:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Failed to add entry");
    } finally {
      setSubmitting(false);
    }
  };

  // Filter sites and items
  const filteredSites = works.filter((site) =>
    site.name.toLowerCase().includes(siteSearch.toLowerCase())
  );
  const displayedItems = filteredItems.filter((item) =>
    (item.work_descriptions || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedItems = displayedItems.reduce((acc, item) => {
    if (!acc[item.category_name]) acc[item.category_name] = [];
    acc[item.category_name].push(item);
    return acc;
  }, {});

  const handleCategorySelect = (category) => {
    setCategoryLoading(true);
    setSelectedCategory(category);
    setTimeout(() => setCategoryLoading(false), 300);
  };

  return (
    <>
      {/* Site + Date */}
      <View style={{ margin: 12, padding: 8, backgroundColor: "#fff", paddingTop: 0 }}>
        {/* Date Picker */}
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

          {selectedDate && (
            <Ionicons
              name="close-circle"
              size={18}
              color="#888"
              onPress={() => setSelectedDate(today)}
              style={{ marginLeft: 10 }}
            />
          )}

          {showDatePicker && (
            <DateTimePicker
              value={selectedDate ? new Date(selectedDate) : new Date()}
              mode="date"
              display="default"
              onChange={(event, date) => {
                setShowDatePicker(false);
                if (date) setSelectedDate(formatDate(date));
              }}
            />
          )}
        </View>

        <Text style={{ fontWeight: "600", marginBottom: 5, fontSize: 14, color: "#000" }}>
          Select Site
        </Text>
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
            marginBottom: 10,
          }}
        >
          <Text style={{ color: selectedWork ? "#000" : "#888", fontSize: 14 }}>
            {selectedWork?.name || "Select Site"}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#888" />
        </TouchableOpacity>

        {/* Search */}
        <TextInput
          mode="outlined"
          label="Search"
          placeholder="e.g., Item"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={{ backgroundColor: "#fff", height: 42, borderRadius: 6 }}
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

        {/* Category Chips */}
        <View style={{ marginTop: 20 }}>
          {categories.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 10, marginBottom: 10 }}>
              {categories.map((category, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => handleCategorySelect(category)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    backgroundColor: selectedCategory === category ? "#1e7a6f" : "#f0f0f0",
                    borderRadius: 20,
                    marginRight: 10,
                  }}
                >
                  <Text style={{ color: selectedCategory === category ? "#fff" : "#000" }}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </View>

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
          loadingItems || categoryLoading ? (
            <View style={{ marginTop: 50, alignItems: "center" }}>
              <ActivityIndicator size="large" color="#1e7a6f" />
              <Text style={{ marginTop: 10, color: "#1e7a6f" }}>Loading items...</Text>
            </View>
          ) : Object.keys(groupedItems).length ? (
            <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
              {(selectedCategory === "All" ? Object.keys(groupedItems) : [selectedCategory]).map(
                (category, idx) => (
                  <View key={idx} style={{ marginBottom: 20 }}>
                    <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 10, color: "#1e7a6f" }}>
                      {category}
                    </Text>
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
                              // fallback to current if history not loaded
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
                        />
                      );
                    })}
                  </View>
                )
              )}
            </ScrollView>
          ) : (
            <Text style={{ textAlign: "center", marginTop: 20, color: "#888" }}>
              No items found
            </Text>
          )
        ) : (
          <Text style={{ textAlign: "center", marginTop: 20, color: "#888" }}>
            Please select a Site
          </Text>
        )}
      </SafeAreaView>

      {/* Modals (unchanged) */}
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
