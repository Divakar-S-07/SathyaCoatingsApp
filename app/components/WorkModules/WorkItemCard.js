import React, { useMemo, useState } from "react";
import { View, Text, TouchableOpacity, TextInput, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const isCompleted = (r) =>
  parseFloat(r?.completion_value) > 0 &&
  parseFloat(r?.completion_value).toFixed(2) === parseFloat(r?.value).toFixed(2);

export default function WorkItemCard({
  item,
  selectedDate, // "YYYY-MM-DD"
  displayData, // { cumulative_area, entries: [] }
  newWorkData,
  onChange,
  onSubmit,
  submitting,
}) {
  const [showModal, setShowModal] = useState(false);

  const rate = parseFloat(item.rate) || 0;
  const cumulativeValue = useMemo(
    () => (displayData.cumulative_area * rate).toFixed(2),
    [displayData.cumulative_area, rate]
  );

  return (
    <View
      style={{
        backgroundColor: "#fff",
        borderWidth: 1,
        // borderColor: "#e5e7eb",
        borderRadius: 10,
        padding: 12,
        marginBottom: 12,
      }}
    >
      <Text
        style={{
          fontWeight: "700",
          fontSize: 16,
          color: "#111827",
          marginBottom: 4,
        }}
        className="p-2 text-center  border-b-[#aaa] border bg-gray-100"
      >
        {item.subcategory_name}
      </Text>


      <Text style={{ color: "#6b7280", fontSize: 12, marginBottom: 4 }}>
        Item: {item.item_id}
      </Text>
      <View
        style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}
      >
        <Ionicons name="document-text-outline" size={16} color="#4f46e5" />
        <Text style={{ marginLeft: 6, color: "#374151", fontSize: 13 }}>
          {item.work_descriptions}
        </Text>
      </View>

      {/* Progress as of selected date */}
      <View style={{ marginBottom: 8 }}>
        <Text style={{ fontSize: 13 }}>
          {/* <Text style={{ fontWeight: "600" }}>
            Progress as of {selectedDate}:
          </Text>{" "} */}
          Area{" "}
          <Text style={{ fontWeight: "700" }}>
            {displayData.cumulative_area.toFixed(2)}
          </Text>{" "}
          {/* | Value <Text style={{ fontWeight: "700" }}>{cumulativeValue}</Text> */}
        </Text>
      </View>

      {/* Entries on selected date */}
      {/* <View style={{ marginBottom: 10 }}>
        <Text style={{ fontSize: 13, fontWeight: "600" }}>
          Entries on {selectedDate}:
        </Text>
        {displayData.entries.length === 0 ? (
          <Text style={{ fontSize: 12, color: "#6b7280" }}>No entries</Text>
        ) : (
          displayData.entries.map((e) => (
            <Text key={e.entry_id} style={{ fontSize: 12, color: "#374151" }}>
              {parseFloat(e.area_added || 0).toFixed(2)} added at{" "}
              {new Date(e.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          ))
        )}
      </View> */}

      {/* Completed or Update */}
      {isCompleted(item) ? (
        <View
          style={{
            paddingVertical: 8,
            paddingHorizontal: 10,
            borderWidth: 1,
            borderColor: "#bbf7d0",
            backgroundColor: "#ecfccb",
            borderRadius: 8,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Text
            style={{ color: "#166534", fontWeight: "700", marginRight: 6 }}
          >
            Completed
          </Text>
          <Ionicons name="checkmark-done-circle" size={16} color="#16a34a" />
        </View>
      ) : (
        <TouchableOpacity
          onPress={() => setShowModal(true)}
          style={{
            paddingVertical: 8,
            paddingHorizontal: 12,
            backgroundColor: "#1e7a6f",
            borderRadius: 8,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
          }}
        >
          <Ionicons
            name="create-outline"
            size={16}
            color="#fff"
            style={{ marginRight: 6 }}
          />
          <Text style={{ color: "#fff", fontWeight: "600" }}>Update Area</Text>
        </TouchableOpacity>
      )}

      {/* Update Modal */}
      <Modal visible={showModal} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 10,
              padding: 20,
              width: "100%",
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                marginBottom: 12,
                color: "#111827",
              }}
            >
              Update Work Area
            </Text>
            <TextInput
              keyboardType="numeric"
              value={String(newWorkData[item.rec_id] ?? "")}
              onChangeText={(t) => onChange(item.rec_id, t)}
              placeholder="Enter new work area"
              style={{
                borderWidth: 1,
                borderColor: "#d1d5db",
                borderRadius: 8,
                paddingHorizontal: 10,
                paddingVertical: 8,
                marginBottom: 16,
              }}
            />
            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
              }}
            >
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  marginRight: 10,
                  borderRadius: 8,
                  backgroundColor: "#9ca3af",
                }}
              >
                <Text style={{ color: "#fff" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  onSubmit(item);
                  setShowModal(false);
                }}
                disabled={submitting}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  backgroundColor: submitting ? "#9ca3af" : "#10b981",
                }}
              >
                <Text style={{ color: "#fff" }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
