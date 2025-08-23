import React, { useEffect, useState } from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import axios from "axios";

const ProjectSiteModal = ({ visible, onClose }) => {
  const [projects, setProjects] = useState([]);
  const [sites, setSites] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedSite, setSelectedSite] = useState(null);

  // Map for dropdowns
  const projectData = projects.map((p) => ({
    label: p?.project_name,
    value: p?.pd_id,
  }));

  const siteData = sites.map((s) => ({
    label: s?.site_name,
    value: s?.site_id,
  }));

  useEffect(() => {
    if (visible) {
      axios
        .get("http://10.28.147.28:5000/material/projects")
        .then((res) => setProjects(res.data.data || []))
        .catch((err) => console.log("Project fetch error:", err));
    }
  }, [visible]);

  const fetchSites = (pd_id) => {
    axios
      .get(`http://10.28.147.28:5000/material/sites/${pd_id}`)
      .then((res) => setSites(res.data.data || []))
      .catch((err) => console.log("Site fetch error:", err));
  };

  return (
    <Modal transparent visible={visible} animationType="fade">
      {/* Background overlay */}
      <View className="items-center justify-center flex-1 bg-black/40">
        {/* Modal box */}
        <View className="w-11/12 p-5 bg-white shadow-lg rounded-2xl">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold">Select Project & Site</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={26} color="black" />
            </TouchableOpacity>
          </View>

          {/* Project Dropdown */}
          <Text className="mb-1 text-sm font-medium text-gray-700">Project</Text>
          <Dropdown
            style={{
              height: 45,
              borderColor: "#ccc",
              borderWidth: 1,
              borderRadius: 8,
              paddingHorizontal: 8,
              marginBottom: 16,
            }}
            data={projectData}
            labelField="label"
            valueField="value"
            placeholder="Select Project"
            value={selectedProject}
            onChange={(item) => {
              setSelectedProject(item.value);
              fetchSites(item.value);
            }}
          />

          {/* Site Dropdown */}
          <Text className="mb-1 text-sm font-medium text-gray-700">Site</Text>
          <Dropdown
            style={{
              height: 45,
              borderColor: "#ccc",
              borderWidth: 1,
              borderRadius: 8,
              paddingHorizontal: 8,
              marginBottom: 10,
            }}
            data={siteData}
            labelField="label"
            valueField="value"
            placeholder="Select Site"
            value={selectedSite}
            onChange={(item) => setSelectedSite(item.value)}
          />
        </View>
      </View>
    </Modal>
  );
};

export default ProjectSiteModal;
