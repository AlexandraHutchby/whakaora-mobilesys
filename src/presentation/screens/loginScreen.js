import React from "react";
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, Image, } from "react-native";


const LoginScreen = () => {
    const loginOptions = [
        'Open with PIN',
        'Open with Biometrics',
    ];

    return (
        <SafeAreaView style={styles.container}>
            {/** Title */}
            <Text style={styles.title}>Whakaora</Text>
            <Text style={styles.miniTitle}>Medicine Tracker</Text>

            {/** Login buttons */}
            <View style={styles.loginContainer}>
                {loginOptions.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.button}
                        onPress={() => { }}
                    >
                        <Text style={styles.buttonText}>{item}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#DBF0FD',
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 50,
        fontWeight: '600',
        color: '#000000',
        textAlign: 'center',
        marginTop: 8,
    },
    miniTitle: {
        fontSize: 26,
        fontWeight: '400',
        color: '#000000',
        textAlign: 'center',
        marginBottom: 15,
    },
    loginContainer: {
        gap: 20,
    },
    button: {
        backgroundColor: '#63D2FF',
        borderRadius: 6,
        paddingVertical: 18,
        paddingHorizontal: 16,
        width: '50%',
        alignSelf: 'center',
        borderRadius: '50%',
    },
    buttonText: {
        fontSize: 24,
        fontWeight: '500',
        color: '#000000',
        textAlign: 'center',
    },
});

export default LoginScreen;