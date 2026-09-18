import { router } from "expo-router";
import React from "react";
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, Image, } from "react-native";


const HomeScreen = () => {
    const menuItems = [
        { label: 'Edit Medications', screen: 'myMeds' },
        { label: 'Edit Schedule', screen: 'schedule' },
        { label: 'Update Tracker', screen: 'tracker' },
        { label: 'Edit Combinations', screen: 'combination' },
        { label: 'Edit Food Timings', screen: 'foodTimings' },
    ];

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
                        onPress={() =>
                            router.push(`/screen?screen=${encodeURIComponent(item.screen)}`)
                        }
                    >
                        <Text style={styles.buttonText}>{item.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
    },
    backButton: {
        alignSelf: 'flex-end',
        marginTop: 16,
        marginRight: 8,
    },
    backIcon: {
        width: 30,
        height: 30,
    },
    title: {
        fontSize: 50,
        fontWeight: '600',
        color: '#0B5563',
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 32,
    },
    menuContainer: {
        gap: 20,
    },
    button: {
        backgroundColor: '#4DB3D8',
        borderRadius: 6,
        paddingVertical: 18,
        paddingHorizontal: 16,
        width: '70%',
        alignSelf: 'center',
    },
    buttonText: {
        fontSize: 24,
        fontWeight: '500',
        color: '#000000',
        textAlign: 'center',
    },
});

export default HomeScreen;