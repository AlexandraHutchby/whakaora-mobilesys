/* eslint-disable no-unused-vars */
/* eslint-disable react-native/no-color-literals */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-restricted-imports */

import React from "react"
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

const LoginScreen = () => {
  const loginOptions = ["Open with PIN", "Open with Biometrics"]

  return (
    <SafeAreaView style={styles.container}>
      {/** Title */}
      <Text style={styles.title}>Whakaora</Text>
      <Text style={styles.miniTitle}>Medicine Tracker</Text>

      {/** Login buttons */}
      <View style={styles.loginContainer}>
        {loginOptions.map((item, index) => (
          <TouchableOpacity key={index} style={styles.button} onPress={() => {}}>
            <Text style={styles.buttonText}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  button: {
    alignSelf: "center",
    backgroundColor: "#63D2FF",
    borderRadius: "50%",
    paddingHorizontal: 16,
    paddingVertical: 18,
    width: "50%",
  },
  buttonText: {
    color: "#000000",
    fontSize: 24,
    fontWeight: "500",
    textAlign: "center",
  },
  container: {
    backgroundColor: "#DBF0FD",
    flex: 1,
    paddingHorizontal: 20,
  },
  loginContainer: {
    gap: 20,
  },
  miniTitle: {
    color: "#000000",
    fontSize: 26,
    fontWeight: "400",
    marginBottom: 15,
    textAlign: "center",
  },
  title: {
    color: "#000000",
    fontSize: 50,
    fontWeight: "600",
    marginTop: 8,
    textAlign: "center",
  },
})

export default LoginScreen
