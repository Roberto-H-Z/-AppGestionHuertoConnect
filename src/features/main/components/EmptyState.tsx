/**
 * EmptyState - Shown on HomeScreen when user has no huertos yet.
 * Displays a friendly icon with a call-to-action to add the first huerto.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface EmptyStateProps {
    onAddHuerto: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onAddHuerto }) => {
    return (
        <View style={styles.container}>
            <View style={styles.iconCircle}>
                <MaterialCommunityIcons
                    name="sprout-outline"
                    size={60}
                    color="#66BB6A"
                />
            </View>
            <Text style={styles.title}>¡Bienvenido a tu huerto!</Text>
            <Text style={styles.subtitle}>
                Aún no tienes huertos registrados.{'\n'}
                Agrega tu primer huerto para comenzar.
            </Text>
            <TouchableOpacity
                style={styles.addButton}
                onPress={onAddHuerto}
                activeOpacity={0.8}
            >
                <MaterialCommunityIcons name="plus" size={22} color="#fff" />
                <Text style={styles.addButtonText}>Agregar mi primer huerto</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    iconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#E8F5E9',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        borderWidth: 2,
        borderColor: '#C8E6C9',
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1B5E20',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#66BB6A',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 32,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4CAF50',
        paddingVertical: 14,
        paddingHorizontal: 28,
        borderRadius: 14,
        gap: 8,
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});

export default EmptyState;
