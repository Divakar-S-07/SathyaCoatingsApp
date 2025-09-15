import React, { useState, useEffect } from "react";
import {
  FlatList,
  View,
  Modal,
  TouchableOpacity,
  Text,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import MaterialCard from "./MaterialCard";
import ViewMaterial from "./ViewMaterial";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";

const Material = () => {
  const [companies, setCompanies] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [projects, setProjects] = useState([]);
  const [sites, setSites] = useState([]);
  const [workDescriptions, setWorkDescriptions] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedSite, setSelectedSite] = useState(null);
  const [selectedWorkDescription, setSelectedWorkDescription] = useState(null);
  const [dispatchData, setDispatchData] = useState([]);
  const [acknowledgements, setAcknowledgements] = useState({});
  const [ackDetails, setAckDetails] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modal states
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [acknowledgementModal, setAcknowledgementModal] = useState(false);
  const [companyModalVisible, setCompanyModalVisible] = useState(false);
  const [projectModalVisible, setProjectModalVisible] = useState(false);
  const [siteModalVisible, setSiteModalVisible] = useState(false);
  const [workDescModalVisible, setWorkDescModalVisible] = useState(false);

  const [showAllSummary, setShowAllSummary] = useState(false);
  const [summaryModalVisible, setSummaryModalVisible] = useState(false);

  // material usage
  const [usageModalVisible, setUsageModalVisible] = useState(false);
  const [usages, setUsages] = useState({});




  // Fetch companies
  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://103.118.158.127/api/project/companies");
      setCompanies(response.data || []);
    } catch (err) {
      setError("Failed to fetch companies");
      Alert.alert("Error", "Failed to fetch companies");
    } finally {
      setLoading(false);
    }
  };

  // Fetch projects
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://103.118.158.127/api/project/projects-with-sites");
      setAllProjects(response.data || []);
    } catch (err) {
      setError("Failed to fetch projects");
      Alert.alert("Error", "Failed to fetch projects");
    } finally {
      setLoading(false);
    }
  };

  // Fetch work descriptions
  const fetchWorkDescriptions = async (site_id) => {
    try {
      setLoading(true);
      const response = await axios.get("http://103.118.158.127/api/material/work-descriptions", {
        params: { site_id },
      });
      setWorkDescriptions(response.data.data || []);
    } catch (err) {
      setError("Failed to fetch work descriptions");
      Alert.alert("Error", "Failed to fetch work descriptions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      const filteredProjects = allProjects.filter((project) => project.company_id === selectedCompany.company_id);
      setProjects(filteredProjects);
      if (!filteredProjects.some((project) => project.project_id === (selectedProject?.project_id || ""))) {
        setSelectedProject(null);
        setSites([]);
        setSelectedSite(null);
        setWorkDescriptions([]);
        setSelectedWorkDescription(null);
        setDispatchData([]);
        setAckDetails({});
      }
    } else {
      setProjects([]);
      setSelectedProject(null);
      setSites([]);
      setSelectedSite(null);
      setWorkDescriptions([]);
      setSelectedWorkDescription(null);
      setDispatchData([]);
      setAckDetails({});
    }
  }, [selectedCompany, allProjects]);

  useEffect(() => {
    if (selectedProject) {
      const selectedProjectData = allProjects.find(project => project.project_id === selectedProject.project_id);
      setSites(selectedProjectData ? selectedProjectData.sites : []);
      setSelectedSite(null);
      setWorkDescriptions([]);
      setSelectedWorkDescription(null);
      setDispatchData([]);
      setAckDetails({});
    }
  }, [selectedProject, allProjects]);

  useEffect(() => {
    if (selectedSite) {
      fetchWorkDescriptions(selectedSite.site_id);
      setSelectedWorkDescription(null);
      setDispatchData([]);
      setAckDetails({});
    }
  }, [selectedSite]);

  useEffect(() => {
    if (selectedProject && selectedSite && selectedWorkDescription) {
      const fetchDispatchDetails = async () => {
        setLoading(true);
        try {
          const response = await axios.get(
            `http://103.118.158.127/api/material/dispatch-details/?pd_id=${selectedProject.project_id}&site_id=${selectedSite.site_id}&desc_id=${selectedWorkDescription.desc_id}`
          );

          const dispatchMap = new Map();
          (response.data.data || []).forEach(dispatch => {
            if (!dispatchMap.has(dispatch.id)) {
              dispatchMap.set(dispatch.id, dispatch);
            }
          });

          const uniqueDispatches = Array.from(dispatchMap.values());
          setDispatchData(uniqueDispatches);

          const ackPromises = uniqueDispatches.map(dispatch =>
            axios.get(
              `http://103.118.158.127/api/site-incharge/acknowledgement-details?material_dispatch_id=${dispatch.id}`
            ).catch(err => ({ data: { data: [] } }))
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
        } catch (err) {
          setError("Failed to fetch dispatch or acknowledgement details");
          Alert.alert("Error", "Failed to fetch dispatch or acknowledgement details");
        } finally {
          setLoading(false);
        }
      };
      fetchDispatchDetails();
    }
  }, [selectedProject, selectedSite, selectedWorkDescription]);

  const handleAcknowledge = async (dispatchId) => {
    const ackData = acknowledgements[dispatchId];
    if (!ackData) return;

    try {
      const response = await axios.post("http://103.118.158.127/api/site-incharge/acknowledge-material", {
        material_dispatch_id: parseInt(dispatchId),
        overall_quantity: ackData.overall_quantity !== "" ? parseInt(ackData.overall_quantity) : null,
        remarks: ackData.remarks || null,
      });
      Alert.alert("Success", response.data.message);
      
      // Clear the acknowledgement input for this item
      setAcknowledgements(prev => {
        const newAck = { ...prev };
        delete newAck[dispatchId];
        return newAck;
      });
      
      // Refresh acknowledgement data for the specific dispatch
      const responseRefresh = await axios.get(
        `http://103.118.158.127/api/site-incharge/acknowledgement-details?material_dispatch_id=${dispatchId}`
      );
      setAckDetails(prev => ({
        ...prev,
        [dispatchId]: responseRefresh.data.data[0] || null
      }));
      
      setAcknowledgementModal(false);
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "Failed to save acknowledgement");
    }
  };

  const handleAckInputChange = (dispatchId, field, value) => {
    setAcknowledgements(prev => ({
      ...prev,
      [dispatchId]: {
        ...prev[dispatchId],
        [field]: value
      }
    }));
  };

  const openAcknowledgementModal = (item) => {
    setSelectedItem(item);
    // Initialize with existing acknowledgement data or empty strings
    const existingAck = ackDetails[item.id] && ackDetails[item.id].acknowledgement;
    setAcknowledgements(prev => ({
      ...prev,
      [item.id]: {
        overall_quantity: existingAck ? existingAck.overall_quantity?.toString() || "" : "",
        remarks: existingAck ? existingAck.remarks || "" : ""
      }
    }));
    setAcknowledgementModal(true);
  };

  const openUsageModal = (item) => {
  setSelectedItem(item);
  setUsageModalVisible(true);
};


  const formatItemAndRatios = (dispatch) => {
    const ratios = [dispatch.comp_ratio_a, dispatch.comp_ratio_b];
    if (dispatch.comp_ratio_c !== null) {
      ratios.push(dispatch.comp_ratio_c);
    }
    return `${dispatch.item_name} (${ratios.join(':')})`;
  };

  // Reusable dropdown components
  const DropdownButton = ({ label, value, onPress, disabled }) => (
    <View className="mb-2">
      <Text 
      // className="mb-2 text-xs font-extrabold text-[#000] "
      style={{ fontWeight: "600", marginBottom: 5, fontSize: 12, color: "#000" }}
      >{label}</Text>
      <TouchableOpacity
        disabled={disabled}
        onPress={onPress}
        className={`h-12 border rounded-lg justify-center  w-full border-[#ccc] ${
          disabled
            ? "bg-gray-100 border-gray-300"
            : "bg-white border-gray-400 shadow-md"
        }`}
        style={{
                height: 35,
                borderWidth: 1,
                borderColor: "#ccc",
                borderRadius: 6,
                backgroundColor: "#fff",
                paddingHorizontal: 10,
                marginBottom: 5,
                // width: "100%"
              }}
      >
        <View className="flex-row items-center justify-between ">
          <Text
            className={`text-base text-md ${
              !value ? "text-gray-400" : disabled ? "text-gray-500" : "text-black"
            }`}
          >
            {value ? value.company_name || value.project_name || value.site_name || value.desc_name : `Select ${label}`}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#888" />
        </View>
      </TouchableOpacity>
    </View>
  );


//   const DropdownButton = ({ label, value, onPress, disabled }) => (
//   <View className="flex-row items-center mb-4">
//     {/* Fixed label width */}
//     <Text className="text-sm font-semibold text-gray-700 w-28">{label}</Text>

//     {/* Dropdown with equal width */}
//     <TouchableOpacity
//       disabled={disabled}
//       onPress={onPress}
//       className={`h-12 flex-1 rounded-xl px-4 flex-row items-center justify-between 
//         ${disabled ? "bg-gray-200 border border-gray-300" : "bg-[#f9f9f9] border border-gray-400 shadow-sm"}
//       `}
//       style={{
//         shadowColor: "#000",
//         shadowOpacity: 0.1,
//         shadowRadius: 4,
//         shadowOffset: { width: 0, height: 2 },
//         elevation: 3,
//       }}
//     >
//       <Text
//         className={`text-base ${
//           !value
//             ? "text-gray-400"
//             : disabled
//             ? "text-gray-500"
//             : "text-gray-900 font-medium"
//         }`}
//         numberOfLines={1} // prevents text overflow
//         ellipsizeMode="tail"
//       >
//         {value
//           ? value.company_name ||
//             value.project_name ||
//             value.site_name ||
//             value.desc_name
//           : `Select ${label}`}
//       </Text>
//     </TouchableOpacity>
//   </View>
// );



  




  const DropdownModal = ({ visible, onClose, data, onSelect, title, keyProp }) => (
    <Modal visible={visible} transparent animationType="slide">
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
              keyExtractor={(item) => String(item[keyProp])}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    onSelect(item);
                    onClose();
                  }}
                  className="px-6 py-4 border-b border-gray-100 active:bg-gray-50"
                >
                  <Text className="text-base text-gray-800">
                    {item.company_name || item.project_name || item.site_name || item.desc_name}
                  </Text>
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
      {/* Header with Company, Project, Site, Work Description Selection */}
      <View className="bg-[#fff] px-4 py-2 rounded-xl mb-4">
        <View className="">

          {/* {dispatchData.length > 0 && (
          <TouchableOpacity
            onPress={() => setSummaryModalVisible(true)}
            className="px-4 py-3 mb-3 bg-[#1e7a6f] rounded-lg"
          >
            <Text className="text-base font-semibold text-center text-white">
               Acknowledgement status
            </Text>
          </TouchableOpacity>
        )} */}
          
          <DropdownButton
            label="Company"
            value={selectedCompany}
            onPress={() => setCompanyModalVisible(true)}
            disabled={false}
          />

          <DropdownButton
            label="Project"
            value={selectedProject}
            onPress={() => setProjectModalVisible(true)}
            disabled={!selectedCompany}
          />

          <DropdownButton
            label="Site"
            value={selectedSite}
            onPress={() => setSiteModalVisible(true)}
            disabled={!selectedProject}
          />

          <DropdownButton
            label="Work Description"
            value={selectedWorkDescription}
            onPress={() => setWorkDescModalVisible(true)}
            disabled={!selectedSite}
          />

          

        </View>
      </View>

      {/* Dropdown Modals */}
      <DropdownModal
        visible={companyModalVisible}
        onClose={() => setCompanyModalVisible(false)}
        data={companies}
        title="Select Company"
        keyProp="company_id"
        onSelect={(item) => {
        setSelectedCompany(item);
        setCompanyModalVisible(false);
        setProjectModalVisible(true); // 👈 Auto open Project modal
      }}
      />

      <DropdownModal
        visible={projectModalVisible}
        onClose={() => setProjectModalVisible(false)}
        data={projects}
        title="Select Project"
        keyProp="project_id"
        onSelect={(item) => {
        setSelectedProject(item);
        setProjectModalVisible(false);
        setSiteModalVisible(true); // 👈 Auto open Site modal
      }}
      />

      <DropdownModal
        visible={siteModalVisible}
        onClose={() => setSiteModalVisible(false)}
        data={sites}
        title="Select Site"
        keyProp="site_id"
        onSelect={(item) => {
        setSelectedSite(item);
        setSiteModalVisible(false);
        setWorkDescModalVisible(true); // 👈 Auto open Work Description modal
      }}
      />

      <DropdownModal
        visible={workDescModalVisible}
        onClose={() => setWorkDescModalVisible(false)}
        data={workDescriptions}
        title="Select Work Description"
        keyProp="desc_id"
        onSelect={(item) => {
        setSelectedWorkDescription(item);
        setWorkDescModalVisible(false);
        // 👈 Here you can trigger fetch or just close
      }}
      />

      {/* Acknowledgement Modal */}
<Modal visible={acknowledgementModal} transparent animationType="fade">
  <View className="items-center justify-center flex-1 p-5 bg-black/50">
    <View className="w-full max-h-[80%] p-5 bg-white rounded-2xl">
      {selectedItem && (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="p-3 mb-4 rounded-lg bg-gray-50">
            <Text className="mb-2 text-base font-semibold text-gray-800">
              {formatItemAndRatios(selectedItem)}
            </Text>

            {/* Dispatched Quantities */}
            <Text className="mb-2 text-sm font-medium text-gray-700">
              Dispatched Quantities:
            </Text>
            <View className="space-y-1">
              {selectedItem.comp_a_qty !== null && (
                <Text className="text-sm text-gray-600">
                  <Text className="font-medium">Comp A:</Text> {selectedItem.comp_a_qty}
                </Text>
              )}
              {selectedItem.comp_b_qty !== null && (
                <Text className="text-sm text-gray-600">
                  <Text className="font-medium">Comp B:</Text> {selectedItem.comp_b_qty}
                </Text>
              )}
              {selectedItem.comp_c_qty !== null && (
                <Text className="text-sm text-gray-600">
                  <Text className="font-medium">Comp C:</Text> {selectedItem.comp_c_qty}
                </Text>
              )}
            </View>
          </View>

          <Modal visible={usageModalVisible} transparent animationType="fade">
  <View className="items-center justify-center flex-1 p-5 bg-black/50">
    <View className="w-full max-h-[80%] p-5 bg-white rounded-2xl">
      {selectedItem && (
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text className="mb-3 text-lg font-bold text-gray-800">
            Usage for {selectedItem.item_name}
          </Text>

          <Text className="mb-1 text-sm font-medium text-gray-600">
            Used Quantity
          </Text>
          <TextInput
            keyboardType="numeric"
            placeholder="Enter used quantity"
            value={usages[selectedItem.id]?.used_quantity || ""}
            onChangeText={(value) =>
              setUsages((prev) => ({
                ...prev,
                [selectedItem.id]: {
                  ...prev[selectedItem.id],
                  used_quantity: value,
                },
              }))
            }
            className="p-3 mb-3 bg-white border border-gray-400 rounded-lg"
          />

          <Text className="mb-1 text-sm font-medium text-gray-600">
            Remarks
          </Text>
          <TextInput
            placeholder="Enter remarks"
            value={usages[selectedItem.id]?.remarks || ""}
            onChangeText={(value) =>
              setUsages((prev) => ({
                ...prev,
                [selectedItem.id]: {
                  ...prev[selectedItem.id],
                  remarks: value,
                },
              }))
            }
            className="p-3 mb-3 bg-white border border-gray-400 rounded-lg"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <TouchableOpacity
            onPress={async () => {
              try {
                await axios.post(
                  "http://103.118.158.127/api/site-incharge/usage-material",
                  {
                    material_dispatch_id: selectedItem.id,
                    used_quantity: parseInt(
                      usages[selectedItem.id]?.used_quantity || "0"
                    ),
                    remarks: usages[selectedItem.id]?.remarks || null,
                  }
                );
                Alert.alert("Success", "Usage saved successfully");
                setUsageModalVisible(false);
              } catch (err) {
                Alert.alert("Error", "Failed to save usage");
              }
            }}
            className="px-4 py-3 mt-2 bg-indigo-600 rounded-lg"
          >
            <Text className="font-semibold text-center text-white">
              Save Usage
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      <TouchableOpacity
        onPress={() => setUsageModalVisible(false)}
        className="py-3 mt-4 bg-gray-400 rounded-lg"
      >
        <Text className="font-semibold text-center text-white">Close</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>


          {/* Show existing acknowledgement OR input form */}
          {ackDetails[selectedItem.id] && ackDetails[selectedItem.id].acknowledgement ? (
            <View className="p-3 rounded-lg bg-green-50">
              <Text className="mb-1 text-base font-semibold text-green-800">
                Acknowledgement Details
              </Text>
              <Text className="text-sm text-gray-700">
                Overall Quantity: {ackDetails[selectedItem.id].acknowledgement.overall_quantity} (
                {ackDetails[selectedItem.id].acknowledgement.overall_quantity} litre received)
              </Text>
              <Text className="mt-1 text-sm text-gray-700">
                Remarks: {ackDetails[selectedItem.id].acknowledgement.remarks || "None"}
              </Text>
            </View>
          ) : (
            <View className="space-y-3">
              <View>
                <Text className="mb-1 text-sm font-medium text-gray-600">
                  Overall Quantity Received
                </Text>
                <TextInput
                  keyboardType="numeric"
                  placeholder="Enter overall quantity received"
                  value={acknowledgements[selectedItem.id]?.overall_quantity || ""}
                  onChangeText={(value) =>
                    handleAckInputChange(selectedItem.id, "overall_quantity", value)
                  }
                  className="p-3 bg-white border border-gray-400 rounded-lg"
                  maxLength={10}
                />
              </View>

              <View>
                <Text className="mb-1 text-sm font-medium text-gray-600">
                  Remarks 
                </Text>
                <TextInput
                  placeholder="Add any remarks about the received material"
                  value={acknowledgements[selectedItem.id]?.remarks || ""}
                  onChangeText={(value) =>
                    handleAckInputChange(selectedItem.id, "remarks", value)
                  }
                  className="p-3 bg-white border border-gray-400 rounded-lg"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <TouchableOpacity
                onPress={() => handleAcknowledge(selectedItem.id)}
                disabled={
                  !acknowledgements[selectedItem.id] ||
                  (!acknowledgements[selectedItem.id].overall_quantity &&
                    !acknowledgements[selectedItem.id].remarks)
                }
                className={`px-4 py-3 rounded-lg mt-2 ${
                  !acknowledgements[selectedItem.id] ||
                  (!acknowledgements[selectedItem.id].overall_quantity &&
                    !acknowledgements[selectedItem.id].remarks)
                    ? "bg-gray-300"
                    : "bg-indigo-600"
                }`}
              >
                <Text className="font-semibold text-center text-white">
                  Save Acknowledgement
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}

      <TouchableOpacity
        onPress={() => setAcknowledgementModal(false)}
        className="py-3 mt-4 bg-gray-400 rounded-lg"
      >
        <Text className="font-semibold text-center text-white">Close</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>


      {loading && (
        <View className="items-center justify-center flex-1">
          <Text className="text-base text-gray-600">Loading...</Text>
        </View>
      )}
      
      {error && (
        <View className="items-center justify-center flex-1">
          <Text className="text-base text-red-600">{error}</Text>
        </View>
      )}

      {/* Toggle button for all summary */}
      {/* {dispatchData.length > 0 && (
        <TouchableOpacity
          onPress={() => setShowAllSummary((prev) => !prev)}
          className="px-4 py-3 mb-3 bg-indigo-600 rounded-lg"
        >
          <Text className="text-base font-semibold text-center text-white">
            {showAllSummary ? "Hide Acknowledgement Summary" : "Show Acknowledgement Summary"}
          </Text>
        </TouchableOpacity>
      )} */}

    {/* All Acknowledgements Summary */}
    {showAllSummary && (
      <View className="p-4 mb-4 bg-gray-100 rounded-lg">
        <Text className="mb-2 text-base font-bold text-gray-800">
          Acknowledgement Summary
        </Text>
        {dispatchData.map((item) => {
          const ack = ackDetails[item.id]?.acknowledgement;
          if (!ack) return null;
          return (
            <View
              key={item.id}
              className="p-3 mb-2 bg-white border border-gray-200 rounded-lg"
            >
              <Text className="text-sm font-medium text-gray-700">
                {item.item_name}
              </Text>
              <Text className="text-sm text-gray-600">
                Overall Quantity: {ack.overall_quantity}
              </Text>
              {ack.remarks ? (
                <Text className="mt-1 text-xs text-gray-500">
                  Remarks: {ack.remarks}
                </Text>
              ) : null}
            </View>
          );
        })}
      </View>
    )}

    <Modal visible={summaryModalVisible} transparent animationType="fade">
  <View className="items-center justify-center flex-1 p-5 bg-black/50">
    <View className="w-full max-h-[80%] bg-white rounded-2xl p-5">
      <Text className="mb-4 text-lg font-bold text-center text-gray-800">
        Acknowledgement Summary
      </Text>

      <ScrollView showsVerticalScrollIndicator={true}>
        {dispatchData.map((item) => {
          const ack = ackDetails[item.id]?.acknowledgement;
          if (!ack) return null;
          return (
            <View
              key={item.id}
              className="p-3 mb-3 bg-gray-100 border border-gray-200 rounded-lg"
            >
              <Text className="text-sm font-semibold text-gray-700">
                {item.item_name}
              </Text>
              <Text className="text-sm text-gray-600">
                Overall Quantity: {ack.overall_quantity}
              </Text>
              {ack.remarks ? (
                <Text className="mt-1 text-xs text-gray-500">
                  Remarks: {ack.remarks}
                </Text>
              ) : null}
            </View>
          );
        })}
      </ScrollView>

      <TouchableOpacity
        onPress={() => setSummaryModalVisible(false)}
        className="py-3 mt-4 bg-gray-400 rounded-lg"
      >
        <Text className="font-semibold text-center text-white">Close</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>



      {/* Materials List */}
      {dispatchData.length === 0 && !loading ? (
        <View className="items-center justify-center flex-1">
          <Text className="text-base text-center text-gray-500">
            No materials found. Select Company, Project, Site & Work Description.
          </Text>
        </View>
      ) : (
        <FlatList
          data={dispatchData}
          keyExtractor={(item) => item.id?.toString()}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: "space-between" }}
          renderItem={({ item }) => (
            <MaterialCard
              itemId={item.id}
              itemName={item.item_name}
              isAcknowledged={ackDetails[item.id] && ackDetails[item.id].acknowledgement ? true : false}
              onView={() => {
                setSelectedItem(item);
                setModalVisible(true);
              }}
              onUpdate={() => {
                openAcknowledgementModal(item);
              }}
              onUsage={() => {
                openUsageModal(item); 
              }}
            />
          )}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* View Material Modal */}
      <ViewMaterial
        visible={modalVisible}
        materialName={selectedItem?.item_name}
        item={selectedItem?.id}
        selectedItemData={selectedItem}
        allDispatchedMaterials={dispatchData}
        ackDetails={ackDetails}
        onClose={() => setModalVisible(false)}
        onUpdate={() => {
          setModalVisible(false);
          openAcknowledgementModal(selectedItem);
        }}
        onAcknowledge={() => {
          setModalVisible(false);
          openAcknowledgementModal(selectedItem);
        }}
        isAcknowledged={selectedItem && ackDetails[selectedItem.id] && ackDetails[selectedItem.id].acknowledgement ? true : false}
      />
    </View>
  );
};

export default Material;