import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { TextInput } from "react-native-paper";
import Ionicons from '@expo/vector-icons/Ionicons';



function SearchMaterial() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <View style={styles.container}>
      
      <View style={styles.searchRow}>
         
        <TextInput
          mode="outlined"
          label="Search Material"
          placeholder="Type something"
          value={searchQuery}
          onChangeText={setSearchQuery}
          theme={{
            colors: { primary: "#333" },
          }}
          style={styles.input}
          right={
            searchQuery ? (
              <TextInput.Icon icon="close" onPress={() => setSearchQuery("")} />
            ) : null
          }
        />

        <Ionicons name="filter-circle" size={32} color="black" style={styles.filterIcon}/>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#f5f5f5",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    backgroundColor: "#fff",
  },
  filterIcon: {
    marginLeft: 12,
  },
});

export default SearchMaterial;
