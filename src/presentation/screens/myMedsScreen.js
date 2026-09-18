import React from "react";
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, Image, } from "react-native";
import { router } from "expo-router";
//import { useMedicationList } from "../hooks/useMedicationList";

const MyMedsScreen = () => {
    //const { medications, deleteMedication } = useMedicationList();

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
            <Text style={styles.title}>My Meds</Text>

            {/** Meds List */}
            <View style={styles.medsContainer}>
                {medications.map((med) => (
                    <View key={med.id} style={styles.row}>
                        <TouchableOpacity style={styles.deleteButton} onPress={() => deleteMedication(med.id)}>
                            <Image
                                source={require("../../../assets/icons/x.png")}
                                style={styles.deleteIcon}
                                resizeMode="contain"
                            />
                        </TouchableOpacity>

                        <View style={styles.medInfo}>
                            <Text style={styles.medName}>{med.medicationName}</Text>
                            <Text style={styles.medDosage}>{med.dosage ?? "No dosage set"}</Text>
                        </View>
                        <TouchableOpacity style={styles.editutton} onPress={() => router.push(`/med`)}>
                            <Text style={styles.editIcon}>✎</Text>
                        </TouchableOpacity>
                    </View>
                ))}

                {/** Add a new medication */}
                <TouchableOpacity style={styles.addRow} onPress={() => router.push("/finder")}>
                    <Text style={styles.addIcon}>+</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView >
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
    medsContainer: {
        gap: 20,
        paddingRight: '5%',
        paddingLeft: '5%',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#000000',
        borderRadius: 4,
        paddingVertical: 10,
        paddingHorizontal: 12,
    },
    deleteButton: {
        paddingHorizontal: 6,
    },
    deleteIcon: {
        width: 30,
        height: 30,
    },
    medInfo: {
        flex: 1,
        paddingHorizontal: 10,
    },
    medName: {
        fontSize: 24,
        fontWeight: '500',
        color: '#000000',
    },
    medDosage: {
        fontSize: 14,
        color: '#333333',
        marginTop: 2,
    },
    editButton: {
        paddingHorizontal: 6,
    },
    editIcon: {
        fontSize: 30,
        color: '#000000',
    },
    addRow: {
        borderWidth: 1,
        borderColor: "#000000",
        borderRadius: 4,
        paddingVertical: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addIcon: {
        fontSize: 22,
        fontWeight: '300',
        color: '#000000',
    },
});

export default MyMedsScreen;