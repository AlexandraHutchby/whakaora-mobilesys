/* eslint-disable no-unused-vars */
/* eslint-disable react-native/no-color-literals */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-restricted-imports */

import React from "react"
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native"
import { router } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"

const HomeScreen = () => {
  const menuItems = [
    { label: "Edit Medications", screen: "myMeds" },
    { label: "Edit Schedule", screen: "schedule" },
    { label: "Update Tracker", screen: "tracker" },
    { label: "Edit Combinations", screen: "combination" },
    { label: "Edit Food Timings", screen: "foodTimings" },
  ]

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
      <Text style={styles.title}>Home</Text>

      {/** Menu buttons */}
      <View style={styles.menuContainer}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.screen}
            style={styles.button}
            onPress={() => {
              console.log("BUTTON PRESSED:", item.screen)
              router.push({ pathname: "/screen", params: { destination: item.screen } })
            }}
          >
            <Text style={styles.buttonText}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
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
  button: {
    alignSelf: "center",
    backgroundColor: "#4DB3D8",
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 18,
    width: "70%",
  },
  buttonText: {
    color: "#000000",
    fontSize: 24,
    fontWeight: "500",
    textAlign: "center",
  },
  container: {
    backgroundColor: "#FFFFFF",
    flex: 1,
    paddingHorizontal: 20,
  },
  menuContainer: {
    gap: 20,
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

export default HomeScreen
