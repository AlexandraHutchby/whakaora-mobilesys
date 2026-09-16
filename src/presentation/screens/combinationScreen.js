import { Checkbox } from "@/components/Toggle/Checkbox";
import { React, useState } from "react";
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";


const CombinationScreen = () => {
    const [any, setAny] = useState(false);

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
            <Text style={styles.title}>Combinations</Text>

            {/** Combinations?? */}
            <Text style={styles.text}>Do you have any meds that don't work together?</Text>
            <Checkbox
                style={styles.checkbox}
                value={any}
                onChange={setAny}
            ></Checkbox>
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
        color: '#135348',
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

export default CombinationScreen;