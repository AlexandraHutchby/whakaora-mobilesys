/* eslint-disable prettier/prettier */
/* eslint-disable no-unused-vars */
/* eslint-disable react-native/no-color-literals */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-restricted-imports */

import React, { useCallback } from "react"
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView } from "react-native"
import { router, useFocusEffect } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"

import { useMedicationSchedule } from "../hooks/useMedicationSchedule"

function intervalLabel(days) {
  if (days <= 1) return null
  if (days === 7) return "Weekly"
  if (days === 30) return "Monthly"
  return `Every ${days} days`
}

const ScheduleScreen = () => {
  const { suggested, refresh } = useMedicationSchedule()

  useFocusEffect(
    useCallback(() => {
      refresh()
    }, [refresh]),
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
      <Text style={styles.title}>Schedule</Text>

      <ScrollView contentContainerStyle={styles.list}>
        {/** Warnings */}
        {suggested.warnings.map((w) => (
          <View key={w} style={styles.warning}>
            <Text style={styles.warningText}>{w}</Text>
          </View>
        ))}

        {/** Suggested doses */}
        {suggested.doses.length === 0 ? (
          <Text style={styles.empty}>
            No schedule yet. Add a medication in My Meds and it will appear here.
          </Text>
        ) : (
          suggested.doses.map((d, i) => {
            const interval = intervalLabel(d.intervalDays)
            return (
              <View key={`${d.userMedicationId}-${d.time}=${i}`} style={styles.row}>
                <Text style={styles.time}>{d.time}</Text>
                <View style={styles.info}>
                  <Text style={styles.name}>{d.name}</Text>
                  <Text style={styles.reason}>
                    {d.reason}
                    {interval ? ` . ${interval}` : ""}
                  </Text>
                </View>
              </View>
            )
          })
        )}

        {/** Shortcuts */}
        <TouchableOpacity
          style={styles.linkButton}
          onPress={() =>
            router.push({ pathname: "/screen", params: { destination: "foodTimings" } })
          }
        >
          <Text style={styles.linkText}>Edit meal times</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.linkButton}
          onPress={() =>
            router.push({ pathname: "/screen", params: { destination: "combinations" } })
          }
        >
          <Text style={styles.linkText}>Meds that do not work together</Text>
        </TouchableOpacity>

        <Text style={styles.disclamer}>
          This is a suggested schedule only. Check it based on medication label, recommendations from pharamacist and/or doctor.
        </Text>
      </ScrollView>
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
  disclamer: {
    color: "#6B7280",
    fontSize: 12,
    marginTop: 8,
    textAlign: "center",
  },
  empty: {
    color: "#374151",
    fontSize: 16,
    textAlign: "center",
  },
  info: {
    flex: 1,
    paddingLeft: 14,
  },
  linkButton: {
    alignItems: "center",
    borderColor: "#135348",
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 14,
  },
  linkText: {
    color: "#135348",
    fontSize: 16,
    fontWeight: "600",
  },
  list: {
    gap: 12,
    paddingBottom: 40,
  },
  name: {
    color: "#000000",
    fontSize: 20,
    fontWeight: "500",
  },
  reason: {
    color: "#333333",
    fontSize: 14,
    marginTop: 2,
  },
  row: {
    alignItems: "center",
    backgroundColor: "#F5FAF9",
    borderRadius: 12,
    flexDirection: "row",
    padding: 14,
  },
  time: {
    color: "#135348",
    fontSize: 26,
    fontWeight: "700",
  },
  title: {
    color: "#135348",
    fontSize: 50,
    fontWeight: "600",
    marginBottom: 32,
    marginTop: 8,
    textAlign: "center",
  },
  warning: {
    backgroundColor: "#FEF3C7",
    borderRadius: 8,
    padding: 12,
  },
  warningText: {
    color: "#92400E",
    fontSize: 14,
  },
})

export default ScheduleScreen
