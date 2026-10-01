/* eslint-disable no-unused-vars */
/* eslint-disable react-native/no-color-literals */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-restricted-imports */

import React, { useMemo } from "react"
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, FlatList } from "react-native"
import { router } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"

import { useMedicationReferenceList } from "../hooks/useMedicationReferenceList"

const ManualSearchScreen = () => {
  const { medications, query, setQuery, selected, select, clearSelection } =
    useMedicationReferenceList()

  const useBoxes = useMemo(() => {
    const values = new Set()
    for (const med of medications) {
      if (med.commonUse) values.add(med.commonUse)
    }
    return [...values].slice(0, 8)
  }, [medications])

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.row} onPress={() => select(item.id)} activeOpacity={0.7}>
      <Text style={styles.medName}>{item.medicationName}</Text>
      <Text style={styles.medSub}>{item.commonUse || "No use listed"}</Text>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container}>
      {/** Back Arrow */}
      <TouchableOpacity style={styles.backButton} activeOpacity={0.7} onPress={() => router.back()}>
        <Image
          source={require("../../../assets/icons/back.png")}
          style={styles.backIcon}
          resizeMode="contain"
        />
      </TouchableOpacity>

      {/** Title */}
      <Text style={styles.title}>Manual Search</Text>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search by medication name"
        style={styles.searchInput}
        placeholderTextColor="#6b7280"
      />

      <Text style={styles.sectionTitle}>Browse by use</Text>

      <View style={styles.useBoxGrid}>
        {useBoxes.map((useValue) => (
          <TouchableOpacity
            key={useValue}
            style={styles.useBox}
            onPress={() =>
              router.push({
                pathname: "/screen",
                params: { destination: "commonUseSearch", commonUse: useValue },
              })
            }
          >
            <Text style={styles.useBoxText}>{useValue}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {selected && (
        <View style={styles.detailCard}>
          <Text style={styles.detailTitle}>{selected.medicationName}</Text>
          <Text style={styles.detailText}>Common Name: {selected.commonName || "Not listed"}</Text>
          <Text style={styles.detailText}>Common Use: {selected.commonUse || "Not listed"}</Text>
          <TouchableOpacity onPress={clearSelection} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={medications}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  backButton: {
    alignSelf: "flex-end",
    marginRight: 8,
    marginTop: 16,
  },
  backIcon: {
    height: 30,
    width: 30,
  },
  clearButton: {
    alignSelf: "flex-start",
    marginTop: 8,
  },
  clearButtonText: {
    color: "#135348",
    fontWeight: "600",
  },
  container: {
    backgroundColor: "#FFFFFF",
    flex: 1,
    paddingHorizontal: 20,
  },
  detailCard: {
    backgroundColor: "#D5F9FA",
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
  },
  detailText: {
    color: "#135348",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  detailTitle: {
    color: "#135348",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  listContent: {
    paddingBottom: 40,
  },
  medName: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "600",
  },
  medSub: {
    color: "#4b5563",
    fontSize: 13,
    marginTop: 4,
  },
  row: {
    borderBottomColor: "#E5E7EB",
    borderBottomWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  searchInput: {
    borderColor: "#d1d5db",
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 16,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sectionTitle: {
    color: "#135348",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  title: {
    color: "#135348",
    fontSize: 50,
    fontWeight: "600",
    marginBottom: 32,
    marginTop: 8,
    textAlign: "center",
  },
  useBox: {
    backgroundColor: "#EAF7F5",
    borderRadius: 10,
    marginBottom: 8,
    marginRight: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  useBoxGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  useBoxText: {
    color: "#135348",
    fontSize: 12,
    fontWeight: "600",
  },
})

export default ManualSearchScreen
