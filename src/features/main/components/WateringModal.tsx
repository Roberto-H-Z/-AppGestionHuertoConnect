/**
 * WateringModal - Modal to view and edit the watering schedule for a crop.
 * Shows: next watering date/time, frequency, quantity, and last watering info.
 * Matches the app's existing design patterns (chips, date adjuster, green palette).
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
    Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
// NOTE: This modal is currently unused — the API does not support watering schedules yet.
// Types defined locally to avoid breaking the build.
interface WateringSchedule {
    nextDate: string;
    frequency: number;
    quantity: number;
    lastWatering: string;
}
interface Crop {
    id: string;
    name: string;
    watering: WateringSchedule;
}

const wateringFrequencyOptions = [
    { label: 'Diario', days: 1 },
    { label: 'Cada 2 días', days: 2 },
    { label: 'Cada 3 días', days: 3 },
    { label: 'Semanal', days: 7 },
    { label: 'Quincenal', days: 15 },
];

interface WateringModalProps {
    visible: boolean;
    crop: Crop | null;
    onClose: () => void;
    onSave: (cropId: string, watering: WateringSchedule) => void;
}

// ---- Helpers ----

const formatDateDisplay = (isoDate: string): string => {
    if (!isoDate) return 'Sin fecha';
    const date = new Date(isoDate + 'T12:00:00');
    if (isNaN(date.getTime())) return 'Fecha inválida';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);

    if (dateOnly.getTime() === today.getTime()) return 'Hoy';
    if (dateOnly.getTime() === tomorrow.getTime()) return 'Mañana';

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

const isoFromDate = (d: Date): string => {
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${day}`;
};

const getFreqLabel = (days: number): string => {
    const opt = wateringFrequencyOptions.find(o => o.days === days);
    return opt?.label || `Cada ${days} días`;
};

// ---- Component ----

export const WateringModal: React.FC<WateringModalProps> = ({
    visible,
    crop,
    onClose,
    onSave,
}) => {
    // Initialize from crop data
    const [nextDate, setNextDate] = useState(crop?.watering.nextDate || isoFromDate(new Date()));
    const [frequency, setFrequency] = useState(crop?.watering.frequency || 2);
    const [lastWatering, setLastWatering] = useState(crop?.watering.lastWatering || 'Sin registro');

    // Sync state when crop changes
    React.useEffect(() => {
        if (crop) {
            setNextDate(crop.watering.nextDate);
            setFrequency(crop.watering.frequency);
            setLastWatering(crop.watering.lastWatering);
        }
    }, [crop]);

    const adjustDate = (daysToAdd: number) => {
        const current = new Date(nextDate + 'T12:00:00');
        current.setDate(current.getDate() + daysToAdd);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (current >= today) {
            setNextDate(isoFromDate(current));
        }
    };

    const handleSave = () => {
        if (!crop) return;
        onSave(crop.id, {
            nextDate,
            frequency,
            quantity: crop?.watering.quantity || 2,
            lastWatering,
        });
        onClose();
    };

    if (!crop) return null;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Programación de Riego</Text>
                        <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                            <MaterialCommunityIcons name="close" size={24} color="#9E9E9E" />
                        </TouchableOpacity>
                    </View>

                    {/* Crop name badge */}
                    <View style={styles.cropBadge}>
                        <MaterialCommunityIcons name="sprout" size={16} color="#4CAF50" />
                        <Text style={styles.cropBadgeText}>{crop.name}</Text>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* Next Watering - prominent card */}
                        <View style={styles.nextWateringCard}>
                            <View style={styles.nextWateringHeader}>
                                <MaterialCommunityIcons name="calendar-clock" size={20} color="#4CAF50" />
                                <Text style={styles.nextWateringLabel}>Próximo Riego</Text>
                            </View>
                            <View style={styles.dateAdjuster}>
                                <TouchableOpacity
                                    onPress={() => adjustDate(-1)}
                                    style={styles.dateArrow}
                                >
                                    <MaterialCommunityIcons name="chevron-left" size={26} color="#4CAF50" />
                                </TouchableOpacity>
                                <View style={styles.dateDisplay}>
                                    <Text style={styles.dateMainText}>
                                        {formatDateDisplay(nextDate)}
                                    </Text>
                                    <Text style={styles.dateSubText}>7:00 AM</Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => adjustDate(1)}
                                    style={styles.dateArrow}
                                >
                                    <MaterialCommunityIcons name="chevron-right" size={26} color="#4CAF50" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Frequency card */}
                        <View style={styles.infoCard}>
                            <View style={styles.infoCardHeader}>
                                <MaterialCommunityIcons name="repeat" size={16} color="#4CAF50" />
                                <Text style={styles.infoCardLabel}>Frecuencia</Text>
                            </View>
                            <Text style={styles.infoCardValue}>{getFreqLabel(frequency)}</Text>
                        </View>

                        {/* Frequency chips */}
                        <Text style={styles.sectionLabel}>Cambiar frecuencia</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.chipsScroll}
                        >
                            {wateringFrequencyOptions.map((opt) => (
                                <TouchableOpacity
                                    key={opt.days}
                                    style={[
                                        styles.chip,
                                        frequency === opt.days && styles.chipSelected,
                                    ]}
                                    onPress={() => setFrequency(opt.days)}
                                    activeOpacity={0.7}
                                >
                                    <Text
                                        style={[
                                            styles.chipText,
                                            frequency === opt.days && styles.chipTextSelected,
                                        ]}
                                    >
                                        {opt.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* Last Watering */}
                        <View style={styles.lastWateringCard}>
                            <View style={styles.lastWateringRow}>
                                <MaterialCommunityIcons name="history" size={18} color="#66BB6A" />
                                <Text style={styles.lastWateringLabel}>Último Riego</Text>
                            </View>
                            <Text style={styles.lastWateringValue}>{lastWatering}</Text>
                        </View>
                    </ScrollView>

                    {/* Save button */}
                    <TouchableOpacity
                        style={styles.saveButton}
                        onPress={handleSave}
                        activeOpacity={0.8}
                    >
                        <MaterialCommunityIcons name="check" size={20} color="#fff" />
                        <Text style={styles.saveButtonText}>Guardar cambios</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: Platform.OS === 'ios' ? 36 : 24,
        maxHeight: '80%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1B5E20',
    },
    cropBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 20,
        gap: 6,
        marginBottom: 18,
    },
    cropBadgeText: {
        fontSize: 13,
        color: '#4CAF50',
        fontWeight: '600',
    },

    // Next watering card
    nextWateringCard: {
        backgroundColor: '#F1F8E9',
        borderRadius: 16,
        padding: 18,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#C8E6C9',
    },
    nextWateringHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 14,
    },
    nextWateringLabel: {
        fontSize: 14,
        color: '#616161',
        fontWeight: '600',
    },
    dateAdjuster: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    dateArrow: {
        padding: 8,
        backgroundColor: '#fff',
        borderRadius: 10,
    },
    dateDisplay: {
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    dateMainText: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1B5E20',
    },
    dateSubText: {
        fontSize: 13,
        color: '#66BB6A',
        fontWeight: '500',
        marginTop: 2,
    },

    // Info row (frequency + quantity)
    infoCard: {
        backgroundColor: '#FAFAFA',
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: '#EEEEEE',
        marginBottom: 18,
    },
    infoCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    infoCardLabel: {
        fontSize: 12,
        color: '#9E9E9E',
        fontWeight: '500',
    },
    infoCardValue: {
        fontSize: 16,
        color: '#1B5E20',
        fontWeight: '700',
    },
    // Frequency chips
    sectionLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#616161',
        marginBottom: 10,
    },
    chipsScroll: {
        flexGrow: 0,
        marginBottom: 18,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    chipSelected: {
        backgroundColor: '#E8F5E9',
        borderColor: '#4CAF50',
    },
    chipText: {
        fontSize: 13,
        color: '#757575',
        fontWeight: '500',
    },
    chipTextSelected: {
        color: '#4CAF50',
        fontWeight: '600',
    },

    // Last watering
    lastWateringCard: {
        backgroundColor: '#FAFAFA',
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: '#EEEEEE',
        marginBottom: 18,
    },
    lastWateringRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    lastWateringLabel: {
        fontSize: 12,
        color: '#9E9E9E',
        fontWeight: '500',
    },
    lastWateringValue: {
        fontSize: 15,
        color: '#1B5E20',
        fontWeight: '600',
    },

    // Save button
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4CAF50',
        paddingVertical: 14,
        borderRadius: 14,
        gap: 8,
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 6,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});

export default WateringModal;
