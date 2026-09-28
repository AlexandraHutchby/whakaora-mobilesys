/* eslint-disable no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable react-native/no-color-literals */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-restricted-imports */

import React, { useEffect, useState } from "react"
import { View, Text, TouchableOpacity, StyleSheet, Image, FlatList } from "react-native"
import { router, useLocalSearchParams } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"

import { getMedicationReferenceByType } from "@/application/services/medicationReferenceService"

const CommonUseSearchScreen = () => {
  const params = useLocalSearchParams()
  const commonUse = typeof params.commonUse === "string" ? params.commonUse : ""

  const [items, setItems] = useState([])

  useEffect(() => {
    if (!commonUse) {
      setItems([])
      return
    }
    setItems(getMedicationReferenceByType(commonUse))
  }, [commonUse])

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
      <Text style={styles.title}>Common Use Search</Text>

      <Text style={styles.filterText}>Showing results for: {commonUse || "No use selected"}</Text>

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.medName}>{item.medicationName}</Text>
            <Text style={styles.medSub}>{item.commonName || "No common name"}</Text>
          </View>
        )}
        contentContainerStyle={styles.listContent}
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
  container: {
    backgroundColor: "#FFFFFF",
    flex: 1,
    paddingHorizontal: 20,
  },
  filterText: {
    color: "#374151",
    fontSize: 14,
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 30,
  },
  medName: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "600",
  },
  medSub: {
    color: "#4B5563",
    fontSize: 13,
    marginTop: 4,
  },
  row: {
    borderBottomColor: "#E5E7EB",
    borderBottomWidth: 1,
    paddingVertical: 12,
  },
  title: {
    color: "#135348",
    fontSize: 50,
    fontWeight: "600",
    marginBottom: 32,
    marginTop: 8,
    textAlign: "center",
  },
})

export default CommonUseSearchScreen
