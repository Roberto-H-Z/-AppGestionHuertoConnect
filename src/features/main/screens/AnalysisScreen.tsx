import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export const AnalysisScreen: React.FC = () => {
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />
            <View style={styles.content}>
                <Text style={styles.title}>Análisis</Text>
                <Text style={styles.subtitle}>Analiza tu cultivo</Text>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#E8F5E9',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1B5E20',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#66BB6A',
    },
});

export default AnalysisScreen;
