/* eslint-disable no-unused-vars */
/* eslint-disable react-native/no-color-literals */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-restricted-imports */

import { React, useState, useMemo } from "react"
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  Switch,
} from "react-native"
import { router, useLocalSearchParams } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"

import { parseTime } from "@/application/domain/Scheduler"
import {
  listMedicationSchedules,
  saveMedicationSchedule,
} from "@/application/services/medicationScheduleService"
import { saveUserMedication } from "@/application/services/medicationService"

const frequencyTypes = ["Day", "Week", "Month"]
const doseUnits = ["mg", "ml", "tablet", "puff"]

const MedScreen = () => {
  const {
    medicationReferenceId,
    medicationName,
    userMedicationId: userMedicationIdParam,
    customName: existingCustomName,
  } = useLocalSearchParams()

  const userMedicationId = userMedicationIdParam ? Number(userMedicationIdParam) : undefined

  const existing = useMemo(
    () =>
      userMedicationId
        ? listMedicationSchedules().find((e) => e.userMedicationId === userMedicationId)
        : undefined,
    [userMedicationId],
  )

  const [dosage, setDosage] = useState(existing ? String(existing.doseAmount) : "")
  const [doseUnit, setDoseUnit] = useState(existing?.doseUnit ?? "mg")
  const [frequency, setFrequency] = useState(existing ? String(existing.frequency) : "1")
  const [frequencyType, setFrequencyType] = useState(existing?.frequencyType ?? "Day")
  const [foodRule, setFoodRule] = useState(existing?.instructions.foodRule ?? "none")
  const [preferredTime, setPreferredTime] = useState(existing?.instructions.preferredTime ?? "")
  const [error, setError] = useState(null)

  const originalName = String(medicationName || "")
  const [customName, setCustomName] = useState(String(existingCustomName || medicationName || ""))

  const completeMedication = () => {
    if (!medicationName && !userMedicationId) return
    const amount = Number(dosage)
    const freq = Number(frequency)
    if (!(amount > 0)) return setError("Enter a dosage amount greater than 0.")
    if (!Number.isInteger(freq) || freq < 1) return setError("Enter how many times (1 or more).")
    if (preferredTime.trim() && parseTime(preferredTime) === null) {
      return setError("Preferred time must look like 08:00.")
    }
    setError(null)
    const medId = saveUserMedication({
      id: userMedicationId,
      medicationReferenceId: medicationReferenceId ? Number(medicationReferenceId) : null,
      medicationName: String(medicationName || customName),
      customName: customName.trim() || null,
    })
    saveMedicationSchedule({
      userMedicationId: medId,
      frequency: freq,
      frequencyType,
      doseAmount: amount,
      doseUnit,
      foodRule,
      preferredTime: preferredTime.trim() || null,
    })

    router.replace({
      pathname: "/screen",
      params: { destination: "myMeds" },
    })
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/** Back Arrow */}
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Image
              source={require("../../../assets/icons/back.png")}
              style={styles.backIcon}
              resizeMode="contain"
            />

            <Text style={styles.title}>
              {userMedicationId ? "Edit medication" : "Add medication"}
            </Text>

            <View style={styles.card}>
              <Text style={styles.label}>Name shown in My Meds</Text>
              <TextInput
                value={customName}
                onChangeText={setCustomName}
                placeholder="Give this medication a name"
                style={styles.nicknameInput}
                autoCapitalize="sentences"
              />
              <Text style={styles.originalLabel}>Reference Medication</Text>
              <Text style={styles.originalName}>{originalName || "Not selected"}</Text>
            </View>

            <View style={styles.card}>
              {/** DOSAGE */}
              <Text style={styles.cardTitle}>Dosage</Text>
              <Text style={styles.label}>Amount</Text>
              <TextInput
                value={dosage}
                onChangeText={setDosage}
                style={styles.input}
                keyboardType="numeric"
                placeholder="e.g. 500"
              />

              <Text style={styles.label}>Unit</Text>
              <View style={styles.optionRow}>
                {doseUnits.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[styles.option, doseUnit === option && styles.optionSelected]}
                    onPress={() => setDoseUnit(option)}
                  >
                    <Text
                      style={[styles.optionText, doseUnit === option && styles.optionTextSelected]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/** FREQUENCY */}
              <Text style={styles.label}>How many times?</Text>
              <TextInput
                value={frequency}
                onChangeText={setFrequency}
                style={styles.input}
                keyboardType="number-pad"
                placeholder="1"
              />

              <Text style={styles.label}>Per</Text>
              <View style={styles.optionRow}>
                {frequencyTypes.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[styles.option, frequencyType === option && styles.optionSelected]}
                    onPress={() => setFrequencyType(option)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        frequencyType === option && styles.optionTextSelected,
                      ]}
                    >
                      Per {option.toLowerCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Instructions</Text>

              {/** WITH FOOD */}
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Take with food</Text>
                <Switch
                  value={foodRule === "with"}
                  onValueChange={(v) => setFoodRule(v ? "with" : "none")}
                />
              </View>

              {/** BEFORE FOOD */}
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Take before food</Text>
                <Switch
                  value={foodRule === "before"}
                  onValueChange={(v) => setFoodRule(v ? "before" : "none")}
                />
              </View>

              {/** PREFERRED TIME */}
              <Text style={styles.label}>Preferred Time</Text>
              <TextInput
                value={preferredTime}
                onChangeText={setPreferredTime}
                style={styles.input}
                placeholder="For example, 08:00"
                keyboardType="numbers-and-punctuation"
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity style={styles.completeButton} onPress={completeMedication}>
              <Text style={styles.completeText}>
                {userMedicationId ? "Save changes" : "Add to My Meds"}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
  card: {
    backgroundColor: "#F5FAF9",
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
  },
  cardTitle: {
    color: "#135348",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 14,
  },
  completeButton: {
    alignItems: "center",
    backgroundColor: "#4DB3D8",
    borderRadius: 8,
    marginTop: 4,
    paddingVertical: 16,
  },
  completeText: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "700",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  errorText: {
    color: "#B91C1C",
    fontSize: 14,
    marginBottom: 12,
  },
  flex: {
    flex: 1,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D1D5DB",
    borderRadius: 8,
    borderWidth: 1,
    color: "#111827",
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  label: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 7,
    marginTop: 12,
  },
  nicknameInput: {
    backgroundColor: "#FFFFFF",
    borderColor: "#4DB3D8",
    borderRadius: 8,
    borderWidth: 2,
    color: "#111827",
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  option: {
    borderColor: "#B8D8D4",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionSelected: {
    color: "#000000",
  },
  optionText: {
    color: "#135348",
    fontWeight: "600",
  },
  optionTextSelected: {
    color: "#000000",
  },
  originalLabel: {
    color: "#6B7280",
    fontSize: 12,
    marginTop: 16,
  },
  originalName: {
    color: "#374151",
    fontSize: 15,
    marginTop: 4,
  },
  safeArea: {
    backgroundColor: "#FFFFFF",
    flex: 1,
  },
  switchLabel: {
    color: "#374151",
    fontSize: 16,
  },
  switchRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
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

export default MedScreen
