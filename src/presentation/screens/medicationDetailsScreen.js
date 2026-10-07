/* eslint-disable no-unused-vars */
/* eslint-disable react-native/no-color-literals */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-restricted-imports */

import React, { useEffect, useState } from "react"
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import { router, useLocalSearchParams } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"

import { getMedicationReferenceRowsById } from "@/application/services/medicationReferenceService"

const MedicationDetailsScreen = () => {
  const { medicationId } = useLocalSearchParams()
  const [medication, setMedication] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const id = Number(medicationId)

    if (!id) {
      setLoading(false)
      return
    }

    try {
      setMedication(getMedicationReferenceRowsById(id))
    } finally {
      setLoading(false)
    }
  }, [medicationId])

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#135348" />
      </SafeAreaView>
    )
  }

  if (!medication) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.message}>Medication not found.</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Image
          source={require("../../../assets/icons/back.png")}
          style={styles.backIcon}
          resizeMode="contain"
        />
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{medication.medicationName}</Text>

        <InfoSection title="Common names" value={medication.commonName} />
        <InfoSection title="Common use" value={medication.commonUse} />
        <InfoSection title="Contra-indications" value={medication.contraIndication} />
        <InfoSection title="Cautions" value={medication.cautions} />
        <InfoSection title="Side effects" value={medication.sideEffects} />
        <InfoSection title="Patient advice" value={medication.patientAdvice} />

        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            router.push({
              pathname: "/screen",
              params: {
                destination: "med",
                medicationReferenceId: String(medication.id),
                medicationName: medication.medicationName,
              },
            })
          }
        >
          <Text style={styles.buttonText}>Add to My Meds</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const InfoSection = ({ title, value }) => {
  if (!value) return null

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionText}>{value}</Text>
    </View>
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
  button: {
    backgroundColor: "#4DB3D8",
    borderRadius: 6,
    marginVertical: 24,
    paddingVertical: 16,
  },
  buttonText: {
    color: "#000000",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  container: {
    backgroundColor: "#FFFFFF",
    flex: 1,
    paddingHorizontal: 20,
  },
  message: {
    color: "#374151",
    fontSize: 16,
    marginTop: 40,
    textAlign: "center",
  },
  section: {
    borderBottomColor: "#E5E7EB",
    borderBottomWidth: 1,
    paddingVertical: 14,
  },
  sectionText: {
    color: "#374151",
    fontSize: 15,
    lineHeight: 21,
  },
  sectionTitle: {
    color: "#135347",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 6,
  },
  title: {
    color: "#135348",
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 24,
    marginTop: 12,
  },
})

export default MedicationDetailsScreen
