import React from "react";
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, Image, } from "react-native";


const CommonUseSearchScreen = () => {

    return (
        <SafeAreaView style={styles.container}>
            {/** Back Arrow */}
            <TouchableOpacity style={styles.backButton} activeOpacity={0.7}>
                <Image
                    source={require("../../../assets/icons/back.png")}
                    style={styles.backIcon}
                    resizeMode="contain"
                />
            </TouchableOpacity>

            {/** Title */}
            <Text style={styles.title}>Common Use Search</Text>

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
});

export default CommonUseSearchScreen;