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

const API = "http://103.118.158.33";

const formatDate = (d) =>
  d instanceof Date ? d.toISOString().split("T")[0] : d;

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

  // DATE: keep as YYYY-MM-DD (same as website)
  const [selectedDate, setSelectedDate] = useState(today);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Per-date history for each rec_id: { [rec_id]: { cumulative_area, entries[] } }
  const [historyData, setHistoryData] = useState({});

  const [selectedWorkDesc, setSelectedWorkDesc] = useState(null);

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
  const fetchReckonerData = async (preserveSelections = false) => {
    if (!selectedWork) return;
    try {
      setLoadingItems(true);
      const res = await axios.get(`${API}/api/reckoner/reckoner/`);
      const data =
        res.data.success && Array.isArray(res.data.data) ? res.data.data : [];
      const siteFiltered = data.filter(
        (item) => item.site_id === selectedWork.id
      );
      setItems(siteFiltered);

      // Get unique categories
      const uniqueCategories = [
        ...new Set(siteFiltered.map((i) => i.category_name)),
      ];
      setCategories(uniqueCategories);

      if (!preserveSelections) {
        // 👇 Auto select first category instead of resetting
        if (uniqueCategories.length > 0) {
          setSelectedCategory(uniqueCategories[0]);

          // Auto select first work description for that category
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

  // Filter items based on selected category
  const categoryFilteredItems = useMemo(() => {
    if (!selectedCategory) return [];
    return items.filter((item) => item.category_name === selectedCategory);
  }, [items, selectedCategory]);

  // Get work descriptions based on selected category
  const workOptions = useMemo(() => {
    if (!categoryFilteredItems.length) return [];
    const uniqueWorks = [
      ...new Set(categoryFilteredItems.map((i) => i.work_descriptions)),
    ];
    return uniqueWorks;
  }, [categoryFilteredItems]);

  // Filter items based on selected work description
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

  // History per rec_id for selectedDate
  const fetchHistoryData = async (rec_id, dateStr) => {
    try {
      const res = await axios.get(
        `${API}/api/site-incharge/completion-entries`,
        {
          params: { rec_id, date: dateStr },
        }
      );
      if (res.data.status === "success") {
        setHistoryData((prev) => ({
          ...prev,
          [rec_id]: res.data.data, // { cumulative_area, entries }
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

  // INIT
  useEffect(() => {
    fetchSites();
  }, []);

  useEffect(() => {
    if (selectedWork) {
      setSelectedDate(today);
      fetchReckonerData();
    }
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

      await axios.post(`${API}/api/site-incharge/completion-status`, payload);

      alert("Entry added successfully");

      setNewWorkData((prev) => ({ ...prev, [item.rec_id]: "" }));

      // 👇 Preserve selections after submit
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

          

          {showDatePicker && (
            <DateTimePicker
              value={selectedDate ? new Date(selectedDate) : new Date()}
              mode="date"
              display="default"
              minimumDate={new Date()}   // cannot pick before today
              maximumDate={new Date()}   // cannot pick after today
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

        {/* Search */}
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

        {/* Category Chips - Without "All" */}
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

        {/* Work Description Dropdown - Only show if category is selected */}
        {selectedCategory && (
          <View style={{  }}>
            
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

            {/* Clear Work Description Button */}
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

            {/* Work Modal */}
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