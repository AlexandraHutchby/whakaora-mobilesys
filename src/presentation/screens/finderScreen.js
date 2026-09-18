import { router } from "expo-router";
import React from "react";
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, Image, } from "react-native";


const FinderScreen = () => {
    const menuItems = [
        'Use Camera',
        'Search Manually',
    ];

    return (
        <SafeAreaView style={styles.container}>
            {/** Back Arrow */}
            <TouchableOpacity style={styles.backButton} activeOpacity={0.7} onPress={() => router.back}>
                <Image
                    source={require("../../../assets/icons/back.png")}
                    style={styles.backIcon}
                    resizeMode="contain"
                />
            </TouchableOpacity>

            {/** Title */}
            <Text style={styles.title}>Finder</Text>

            {/** Menu buttons */}
            <View style={styles.menuContainer}>
                {menuItems.map((item, index) => (
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

export default FinderScreen;