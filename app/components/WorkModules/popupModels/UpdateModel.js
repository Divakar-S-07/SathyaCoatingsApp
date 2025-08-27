// src/components/UpdateModal.js
import React, { useState, useEffect } from "react";
import { Modal, View, Text, TouchableOpacity, TextInput, StyleSheet, Alert } from "react-native";

/**
 * UpdateModal
 * Props:
 *  - visible (bool)
 *  - onClose () => void
 *  - item (object) item being updated
 *  - onSubmit (areaAdded:number) => void
 *  - submitting (bool)
 */
export default function UpdateModal({ visible, onClose, item, onSubmit, submitting = false }) {
  const [area, setArea] = useState("");

  useEffect(() => {
    if (!visible) setArea("");
  }, [visible]);

  const handleSave = () => {
    const n = parseFloat(area);
    if (!n || n <= 0) {
      Alert.alert("Validation", "Enter a number greater than 0");
      return;
    }
    if (onSubmit) onSubmit(n);
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.box}>
          <Text style={{ fontWeight: "700", fontSize: 16, marginBottom: 8 }}>Update Area</Text>
          <Text style={{ color: "#374151", marginBottom: 12 }}>{item?.work_descriptions}</Text>

          <Text style={{ fontSize: 12, color: "#6b7280" }}>Enter area to add</Text>
          <TextInput
            placeholder="e.g., 10"
            value={area}
            onChangeText={setArea}
            keyboardType="numeric"
            style={styles.input}
          />

          <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
            <TouchableOpacity style={[styles.btn, { backgroundColor: "#9ca3af" }]} onPress={onClose} disabled={submitting}>
              <Text style={{ color: "#fff", fontWeight: "700" }}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.btn, { backgroundColor: "#065f46", marginLeft: 8 }]} onPress={handleSave} disabled={submitting}>
              <Text style={{ color: "#fff", fontWeight: "700" }}>{submitting ? "Saving..." : "Save"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "center", alignItems: "center" },
  box: { width: "86%", backgroundColor: "#fff", borderRadius: 12, padding: 16 },
  input: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 10, marginTop: 8, marginBottom: 12 },
  btn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, alignItems: "center" },
});
