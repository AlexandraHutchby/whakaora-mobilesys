/* eslint-disable no-unused-vars */
/* eslint-disable react-native/no-color-literals */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-restricted-imports */

import React from "react"
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native"
import { router } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"

import { useMedicationList } from "../hooks/useMedicationList"

const MyMedsScreen = () => {
  const { medications, deleteMedication } = useMedicationList()

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
      <Text style={styles.title}>My Meds</Text>

      {/** Meds List */}
      <View style={styles.medsContainer}>
        {medications.map((med) => (
          <View key={med.id} style={styles.row}>
            <TouchableOpacity style={styles.deleteButton} onPress={() => deleteMedication(med.id)}>
              <Image
                source={require("../../../assets/icons/x.png")}
                style={styles.deleteIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>

            <View style={styles.medInfo}>
              <Text style={styles.medName}>{med.medicationName}</Text>
              <Text style={styles.medDosage}>{med.dosage ?? "No dosage set"}</Text>
            </View>
            <TouchableOpacity style={styles.editutton} onPress={() => router.push(`/med`)}>
              <Text style={styles.editIcon}>✎</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/** Add a new medication */}
        <TouchableOpacity
          style={styles.addRow}
          onPress={() =>
            router.push({
              pathname: "/screen",
              params: { destination: "manualSearch" },
            })
          }
        >
          <Text style={styles.addIcon}>+</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  addIcon: {
    color: "#000000",
    fontSize: 22,
    fontWeight: "300",
  },
  addRow: {
    alignItems: "center",
    borderColor: "#000000",
    borderRadius: 4,
    borderWidth: 1,
    justifyContent: "center",
    paddingVertical: 16,
  },
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
  deleteButton: {
    paddingHorizontal: 6,
  },
  deleteIcon: {
    height: 30,
    width: 30,
  },
  editIcon: {
    color: "#000000",
    fontSize: 30,
  },
  medDosage: {
    color: "#333333",
    fontSize: 14,
    marginTop: 2,
  },
  medInfo: {
    flex: 1,
    paddingHorizontal: 10,
  },
  medName: {
    color: "#000000",
    fontSize: 24,
    fontWeight: "500",
  },
  medsContainer: {
    gap: 20,
    paddingLeft: "5%",
    paddingRight: "5%",
  },
  row: {
    alignItems: "center",
    borderColor: "#000000",
    borderRadius: 4,
    borderWidth: 1,
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 10,
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

export default MyMedsScreen
