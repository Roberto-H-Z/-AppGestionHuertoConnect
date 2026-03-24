/**
 * AddCropModal - Form modal to add a new crop.
 * Features:
 * - Image picker for crop photo
 * - Garden area selector with "add new area" option
 * - Harvest status chip selector
 * - Calendar date picker + frequency for watering schedule
 * - Default task checklist + custom task addition
 * - Description field
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Animated,
    Easing,
    View,
    Text,
    TextInput,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Image,
    Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { apiClient } from '../../../infrastructure/api/apiClient';
import { Crop, GardenArea, HarvestStatus } from '../types/cropTypes';
import {
    harvestStatusOptions,
    harvestDaysMap,
    defaultCropTasks,
    wateringFrequencyOptions,
    generateId,
} from '../data/cropData';

interface AddCropModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (cropData: any, gardenArea?: GardenArea) => Promise<void>;
    gardenAreas: GardenArea[];
}

// ---- Reusable Sub-Components ----

const FieldLabel: React.FC<{ text: string }> = ({ text }) => (
    <Text style={styles.fieldLabel}>{text}</Text>
);

const SelectableChip: React.FC<{
    label: string;
    selected: boolean;
    recommended?: boolean;
    onPress: () => void;
}> = ({ label, selected, recommended = false, onPress }) => (
    <TouchableOpacity
        style={[
            styles.chip,
            recommended && styles.chipRecommended,
            selected && styles.chipSelected,
            selected && recommended && styles.chipRecommendedSelected,
        ]}
        onPress={onPress}
        activeOpacity={0.7}
    >
        <Text
            style={[
                styles.chipText,
                recommended && styles.chipTextRecommended,
                selected && styles.chipTextSelected,
            ]}
        >
            {label}
        </Text>
        {recommended && (
            <MaterialCommunityIcons
                name="leaf"
                size={14}
                color={selected ? '#1B5E20' : '#2E7D32'}
                style={styles.chipIcon}
            />
        )}
    </TouchableOpacity>
);

/** Task checkbox item */
const TaskCheckItem: React.FC<{
    label: string;
    checked: boolean;
    onToggle: () => void;
    onRemove?: () => void;
    isCustom?: boolean;
}> = ({ label, checked, onToggle, onRemove, isCustom }) => (
    <TouchableOpacity
        style={styles.taskItem}
        onPress={onToggle}
        activeOpacity={0.7}
    >
        <MaterialCommunityIcons
            name={checked ? 'checkbox-marked' : 'checkbox-blank-outline'}
            size={22}
            color={checked ? '#4CAF50' : '#BDBDBD'}
        />
        <Text style={[styles.taskItemText, checked && styles.taskItemTextChecked]}>
            {label}
        </Text>
        {isCustom && onRemove && (
            <TouchableOpacity onPress={onRemove} style={styles.taskRemoveBtn}>
                <MaterialCommunityIcons name="close-circle" size={18} color="#EF5350" />
            </TouchableOpacity>
        )}
    </TouchableOpacity>
);

const GrowingCropLoader: React.FC = () => {
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(0.92)).current;
    const swayAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const rotation = Animated.loop(
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 2600,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        );

        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.04,
                    duration: 850,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 0.92,
                    duration: 850,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        );

        const sway = Animated.loop(
            Animated.sequence([
                Animated.timing(swayAnim, {
                    toValue: 1,
                    duration: 700,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(swayAnim, {
                    toValue: 0,
                    duration: 700,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        );

        rotation.start();
        pulse.start();
        sway.start();

        return () => {
            rotation.stop();
            pulse.stop();
            sway.stop();
        };
    }, [pulseAnim, rotateAnim, swayAnim]);

    const spin = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const leftLeafRotate = swayAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['-6deg', '5deg'],
    });

    const rightLeafRotate = swayAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['6deg', '-5deg'],
    });

    return (
        <View style={styles.loaderCard}>
            <Animated.View style={[styles.loaderOrbit, { transform: [{ rotate: spin }] }]} />
            <Animated.View style={[styles.loaderCore, { transform: [{ scale: pulseAnim }] }]}>
                <View style={styles.loaderSoil} />
                <View style={styles.loaderStem} />
                <Animated.View style={[styles.loaderLeafLeft, { transform: [{ rotate: leftLeafRotate }] }]} />
                <Animated.View style={[styles.loaderLeafRight, { transform: [{ rotate: rightLeafRotate }] }]} />
                <View style={styles.loaderCenter}>
                    <MaterialCommunityIcons name="sprout" size={34} color="#2E7D32" />
                </View>
            </Animated.View>
            <Text style={styles.loaderTitle}>Sembrando tu cultivo</Text>
            <Text style={styles.loaderSubtitle}>
                Estamos preparando tu huerto, espera un momento.
            </Text>
        </View>
    );
};

// ---- Main Component ----

export const AddCropModal: React.FC<AddCropModalProps> = ({
    visible,
    onClose,
    onSave,
    gardenAreas,
}) => {
    // Form state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [selectedAreaId, setSelectedAreaId] = useState<string>(
        gardenAreas[0]?.id || ''
    );
    const [harvestStatus, setHarvestStatus] = useState<HarvestStatus>('Germinación');
    const [currentDay, setCurrentDay] = useState('1');
    const [totalDays, setTotalDays] = useState(
        harvestDaysMap['Germinación'].toString()
    );
    // ── Database combos ──
    const [regiones, setRegiones] = useState<any[]>([]);
    const [cultivos, setCultivos] = useState<any[]>([]);
    const [selectedRegion, setSelectedRegion] = useState<any>(null);
    const [selectedCultivo, setSelectedCultivo] = useState<any>(null);

    useEffect(() => {
        if (visible) {
            apiClient.get('/regiones')
                .then((res: any) => setRegiones(res.data || []))
                .catch((e: any) => console.log('Error regiones:', e));
        }
    }, [visible]);

    useEffect(() => {
        if (!visible) return;

        const endpoint = selectedRegion?.id
            ? `/cultivos?region_id=${selectedRegion.id}`
            : '/cultivos';

        apiClient.get(endpoint)
            .then((res: any) => setCultivos(res.data || []))
            .catch((e: any) => console.log('Error cultivos:', e));
    }, [visible, selectedRegion?.id]);

    useEffect(() => {
        if (!selectedCultivo) return;

        const cultivoActualizado = cultivos.find((cultivo: any) => cultivo.id === selectedCultivo.id);
        if (cultivoActualizado) {
            setSelectedCultivo(cultivoActualizado);
        }
    }, [cultivos, selectedCultivo]);

    const [description, setDescription] = useState('');

    // Watering schedule state
    const [wateringDate, setWateringDate] = useState(new Date());
    const [wateringFrequency, setWateringFrequency] = useState(2); // every 2 days default
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Tasks state
    const [selectedTasks, setSelectedTasks] = useState<Set<string>>(
        new Set(['Riego', 'Fertilizar'])
    );
    const [customTasks, setCustomTasks] = useState<string[]>([]);
    const [newTaskText, setNewTaskText] = useState('');

    // New garden area state
    const [showNewArea, setShowNewArea] = useState(false);
    const [newAreaName, setNewAreaName] = useState('');
    const [newAreaLength, setNewAreaLength] = useState('');
    const [newAreaWidth, setNewAreaWidth] = useState('');

    const resetForm = () => {
        setImageUri(null);
        setName('');
        setSelectedAreaId(gardenAreas[0]?.id || '');
        setHarvestStatus('Germinación');
        setCurrentDay('1');
        setTotalDays(harvestDaysMap['Germinación'].toString());
        setDescription('');
        setSelectedRegion(null);
        setSelectedCultivo(null);
        setWateringDate(new Date());
        setWateringFrequency(2);
        setShowDatePicker(false);
        setSelectedTasks(new Set(['Riego', 'Fertilizar']));
        setCustomTasks([]);
        setNewTaskText('');
        setShowNewArea(false);
        setNewAreaName('');
        setNewAreaLength('');
        setNewAreaWidth('');
    };

    // ---- Image Picker ----
    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para seleccionar una imagen.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
        });
        if (!result.canceled && result.assets[0]) {
            setImageUri(result.assets[0].uri);
        }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permiso requerido', 'Necesitamos acceso a tu cámara para tomar una foto.');
            return;
        }
        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
        });
        if (!result.canceled && result.assets[0]) {
            setImageUri(result.assets[0].uri);
        }
    };

    // ---- Tasks ----
    const toggleDefaultTask = (task: string) => {
        setSelectedTasks((prev) => {
            const next = new Set(prev);
            if (next.has(task)) next.delete(task);
            else next.add(task);
            return next;
        });
    };

    const addCustomTask = () => {
        const trimmed = newTaskText.trim();
        if (trimmed && !customTasks.includes(trimmed)) {
            setCustomTasks((prev) => [...prev, trimmed]);
            setSelectedTasks((prev) => new Set(prev).add(trimmed));
            setNewTaskText('');
        }
    };

    const removeCustomTask = (task: string) => {
        setCustomTasks((prev) => prev.filter((t) => t !== task));
        setSelectedTasks((prev) => {
            const next = new Set(prev);
            next.delete(task);
            return next;
        });
    };

    // ---- Date helpers ----
    const formatDate = (date: Date) => {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const getFrequencyLabel = () => {
        const opt = wateringFrequencyOptions.find(o => o.days === wateringFrequency);
        return opt?.label || `Cada ${wateringFrequency} días`;
    };

    // ---- Date picker (simple day selector for web compatibility) ----
    const adjustDate = (daysToAdd: number) => {
        const newDate = new Date(wateringDate);
        newDate.setDate(newDate.getDate() + daysToAdd);
        // Don't go before today
        if (newDate >= new Date(new Date().setHours(0, 0, 0, 0))) {
            setWateringDate(newDate);
        }
    };

    // ---- Handlers ----
    const handleHarvestStatusChange = (status: HarvestStatus) => {
        setHarvestStatus(status);
        setTotalDays(harvestDaysMap[status].toString());
    };

    const handleSave = async () => {
        if (!selectedCultivo) return;

        let areaId = selectedRegion?.id || 'sin-region';
        let newArea: GardenArea | undefined;

        if (showNewArea && newAreaName.trim()) {
            newArea = {
                id: generateId(),
                name: newAreaName.trim(),
                length: parseFloat(newAreaLength) || 5,
                width: parseFloat(newAreaWidth) || 5,
            };
            areaId = newArea.id;
        }

        // Build task list from selected defaults + customs
        const allTasks = [...selectedTasks].map((title) => ({
            id: generateId(),
            title,
            completed: false,
        }));

        const isoDate = (d: Date) => {
            const y = d.getFullYear();
            const m = (d.getMonth() + 1).toString().padStart(2, '0');
            const day = d.getDate().toString().padStart(2, '0');
            return `${y}-${m}-${day}`;
        };

        const cropData = {
            regionId: selectedRegion?.id,
            cultivoId: selectedCultivo?.id,
            name: selectedCultivo?.nombre || 'Cultivo Nuevo',
            imageUri,
            currentDay: parseInt(currentDay) || 1,
            totalDays: parseInt(totalDays) || 90,
            harvestStatus,
            nextWatering: `${formatDate(wateringDate)} (${getFrequencyLabel()})`,
            nextWateringISO: isoDate(wateringDate),
            wateringFrequency,
            tasks: allTasks,
            description: description.trim(),
        };

        try {
            setIsSubmitting(true);
            await onSave(cropData, newArea);
            resetForm();
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    const isValid = selectedCultivo !== null && selectedRegion !== null && !isSubmitting;
    const recommendedCount = useMemo(
        () => cultivos.filter((cultivo: any) => cultivo.es_recomendado).length,
        [cultivos]
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => {
                if (!isSubmitting) onClose();
            }}
        >
            <KeyboardAvoidingView
                style={styles.modalContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {/* Header */}
                <View style={styles.modalHeader}>
                    <TouchableOpacity
                        onPress={() => { if (!isSubmitting) { resetForm(); onClose(); } }}
                        activeOpacity={0.7}
                        disabled={isSubmitting}
                    >
                        <MaterialCommunityIcons name="close" size={24} color="#9E9E9E" />
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>Nuevo Cultivo</Text>
                    <TouchableOpacity
                        onPress={handleSave}
                        disabled={!isValid}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.saveButton, !isValid && styles.saveButtonDisabled]}>
                            {isSubmitting ? 'Guardando...' : 'Guardar'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <ScrollView
                    style={styles.formScroll}
                    contentContainerStyle={styles.formContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* ---- Image Picker ---- */}
                    <FieldLabel text="Imagen del cultivo" />
                    <TouchableOpacity
                        style={styles.imagePickerContainer}
                        onPress={pickImage}
                        activeOpacity={0.8}
                    >
                        {imageUri ? (
                            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                        ) : (
                            <View style={styles.imagePlaceholder}>
                                <MaterialCommunityIcons name="image-plus" size={40} color="#A5D6A7" />
                                <Text style={styles.imagePlaceholderText}>Toca para agregar imagen</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                    <View style={styles.imageButtonsRow}>
                        <TouchableOpacity style={styles.imageOptionBtn} onPress={pickImage} activeOpacity={0.7}>
                            <MaterialCommunityIcons name="image-outline" size={18} color="#4CAF50" />
                            <Text style={styles.imageOptionText}>Galería</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.imageOptionBtn} onPress={takePhoto} activeOpacity={0.7}>
                            <MaterialCommunityIcons name="camera-outline" size={18} color="#4CAF50" />
                            <Text style={styles.imageOptionText}>Cámara</Text>
                        </TouchableOpacity>
                        {imageUri && (
                            <TouchableOpacity
                                style={[styles.imageOptionBtn, { borderColor: '#EF5350' }]}
                                onPress={() => setImageUri(null)}
                                activeOpacity={0.7}
                            >
                                <MaterialCommunityIcons name="delete-outline" size={18} color="#EF5350" />
                                <Text style={[styles.imageOptionText, { color: '#EF5350' }]}>Quitar</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* ---- Región Selector ---- */}
                    <FieldLabel text="Región" />
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.chipsScroll}
                    >
                        {regiones.map((reg) => (
                            <SelectableChip
                                key={reg.id}
                                label={reg.nombre}
                                selected={selectedRegion?.id === reg.id}
                                onPress={() => { setSelectedRegion(reg); }}
                            />
                        ))}
                    </ScrollView>

                    {/* ---- Cultivo Name (from API) ---- */}
                    <FieldLabel text="Cultivo *" />
                    {selectedRegion && recommendedCount > 0 && (
                        <View style={styles.recommendationLegend}>
                            <MaterialCommunityIcons name="leaf" size={16} color="#2E7D32" />
                            <Text style={styles.recommendationLegendText}>
                                Los cultivos en verde están recomendados para {selectedRegion.nombre}
                            </Text>
                        </View>
                    )}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.chipsScroll}
                    >
                        {cultivos.map((cul) => (
                            <SelectableChip
                                key={cul.id}
                                label={cul.nombre}
                                selected={selectedCultivo?.id === cul.id}
                                recommended={Boolean(cul.es_recomendado)}
                                onPress={() => { setSelectedCultivo(cul); }}
                            />
                        ))}
                    </ScrollView>

                    {/* ---- Harvest Status ---- */}
                    <FieldLabel text="Estado de cosecha" />
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.chipsScroll}
                    >
                        {harvestStatusOptions.map((status) => (
                            <SelectableChip
                                key={status}
                                label={status}
                                selected={harvestStatus === status}
                                onPress={() => handleHarvestStatusChange(status)}
                            />
                        ))}
                    </ScrollView>

                    {/* ---- Days ---- */}
                    <View style={styles.dimensionRow}>
                        <View style={styles.dimensionField}>
                            <FieldLabel text="Día actual" />
                            <TextInput
                                style={styles.inputSmall}
                                placeholder="1"
                                placeholderTextColor="#BDBDBD"
                                keyboardType="numeric"
                                value={currentDay}
                                onChangeText={setCurrentDay}
                            />
                        </View>
                        <View style={styles.dimensionField}>
                            <FieldLabel text="Total de días" />
                            <TextInput
                                style={styles.inputSmall}
                                placeholder="90"
                                placeholderTextColor="#BDBDBD"
                                keyboardType="numeric"
                                value={totalDays}
                                onChangeText={setTotalDays}
                            />
                        </View>
                    </View>

                    {/* ---- Watering Schedule ---- */}
                    <FieldLabel text="Programar riego" />
                    <View style={styles.wateringContainer}>
                        {/* Date selector */}
                        <View style={styles.wateringDateRow}>
                            <MaterialCommunityIcons name="calendar" size={20} color="#4CAF50" />
                            <Text style={styles.wateringDateLabel}>Próximo riego:</Text>
                            <View style={styles.dateAdjuster}>
                                <TouchableOpacity onPress={() => adjustDate(-1)} style={styles.dateArrow}>
                                    <MaterialCommunityIcons name="chevron-left" size={22} color="#4CAF50" />
                                </TouchableOpacity>
                                <Text style={styles.dateText}>{formatDate(wateringDate)}</Text>
                                <TouchableOpacity onPress={() => adjustDate(1)} style={styles.dateArrow}>
                                    <MaterialCommunityIcons name="chevron-right" size={22} color="#4CAF50" />
                                </TouchableOpacity>
                            </View>
                        </View>

                    </View>

                    {/* ---- Tasks ---- */}
                    <FieldLabel text="Tareas del cultivo" />
                    <View style={styles.tasksContainer}>
                        {/* Default tasks */}
                        {defaultCropTasks.map((task) => (
                            <TaskCheckItem
                                key={task}
                                label={task}
                                checked={selectedTasks.has(task)}
                                onToggle={() => toggleDefaultTask(task)}
                            />
                        ))}

                        {/* Custom tasks */}
                        {customTasks.map((task) => (
                            <TaskCheckItem
                                key={task}
                                label={task}
                                checked={selectedTasks.has(task)}
                                onToggle={() => toggleDefaultTask(task)}
                                onRemove={() => removeCustomTask(task)}
                                isCustom
                            />
                        ))}

                        {/* Add custom task input */}
                        <View style={styles.addTaskRow}>
                            <TextInput
                                style={styles.addTaskInput}
                                placeholder="Agregar tarea personalizada..."
                                placeholderTextColor="#BDBDBD"
                                value={newTaskText}
                                onChangeText={setNewTaskText}
                                onSubmitEditing={addCustomTask}
                                returnKeyType="done"
                            />
                            <TouchableOpacity
                                onPress={addCustomTask}
                                style={[
                                    styles.addTaskBtn,
                                    !newTaskText.trim() && styles.addTaskBtnDisabled,
                                ]}
                                disabled={!newTaskText.trim()}
                                activeOpacity={0.7}
                            >
                                <MaterialCommunityIcons
                                    name="plus"
                                    size={20}
                                    color={newTaskText.trim() ? '#fff' : '#C8E6C9'}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* ---- Description ---- */}
                    <FieldLabel text="Descripción (opcional)" />
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Notas o especificaciones del cultivo..."
                        placeholderTextColor="#BDBDBD"
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                    />

                    <View style={{ height: 50 }} />
                </ScrollView>

                {isSubmitting && (
                    <View style={styles.loaderOverlay}>
                        <GrowingCropLoader />
                    </View>
                )}
            </KeyboardAvoidingView>
        </Modal>
    );
};

// ---- Styles ----

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    loaderOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(241, 248, 233, 0.94)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1B5E20',
    },
    saveButton: {
        fontSize: 16,
        fontWeight: '700',
        color: '#4CAF50',
    },
    saveButtonDisabled: {
        color: '#C8E6C9',
    },
    formScroll: {
        flex: 1,
    },
    formContent: {
        padding: 20,
    },
    fieldLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#616161',
        marginBottom: 8,
        marginTop: 18,
    },
    input: {
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        color: '#212121',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    inputSmall: {
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: '#212121',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    textArea: {
        minHeight: 80,
        paddingTop: 14,
    },

    // Image picker
    imagePickerContainer: {
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#E0E0E0',
        borderStyle: 'dashed',
    },
    imagePreview: {
        width: '100%',
        height: 180,
        resizeMode: 'cover',
    },
    imagePlaceholder: {
        width: '100%',
        height: 140,
        backgroundColor: '#FAFAFA',
        alignItems: 'center',
        justifyContent: 'center',
    },
    imagePlaceholderText: {
        fontSize: 13,
        color: '#BDBDBD',
        marginTop: 8,
    },
    imageButtonsRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 10,
    },
    imageOptionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#C8E6C9',
        backgroundColor: '#F1F8E9',
    },
    imageOptionText: {
        fontSize: 13,
        color: '#4CAF50',
        fontWeight: '600',
    },

    // Loader
    loaderCard: {
        width: '100%',
        maxWidth: 320,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        paddingVertical: 28,
        paddingHorizontal: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#DCECCF',
        shadowColor: '#1B5E20',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 18,
        elevation: 8,
    },
    loaderOrbit: {
        position: 'absolute',
        width: 118,
        height: 118,
        borderRadius: 59,
        borderWidth: 3,
        borderColor: '#C8E6C9',
        borderTopColor: '#4CAF50',
        opacity: 0.9,
    },
    loaderCore: {
        width: 118,
        height: 118,
        borderRadius: 59,
        backgroundColor: '#F1F8E9',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 22,
        overflow: 'hidden',
    },
    loaderCenter: {
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 3,
    },
    loaderSoil: {
        position: 'absolute',
        bottom: 24,
        width: 58,
        height: 12,
        borderRadius: 8,
        backgroundColor: '#8D6E63',
    },
    loaderStem: {
        position: 'absolute',
        bottom: 41,
        width: 6,
        height: 20,
        borderRadius: 999,
        backgroundColor: '#43A047',
        zIndex: 1,
    },
    loaderLeafLeft: {
        position: 'absolute',
        bottom: 53,
        left: 39,
        width: 16,
        height: 11,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 3,
        borderBottomLeftRadius: 3,
        borderBottomRightRadius: 16,
        backgroundColor: '#66BB6A',
        zIndex: 2,
    },
    loaderLeafRight: {
        position: 'absolute',
        bottom: 53,
        right: 39,
        width: 16,
        height: 11,
        borderTopLeftRadius: 3,
        borderTopRightRadius: 16,
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 3,
        backgroundColor: '#81C784',
        zIndex: 2,
    },
    loaderTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1B5E20',
        textAlign: 'center',
    },
    loaderSubtitle: {
        marginTop: 8,
        fontSize: 14,
        lineHeight: 20,
        color: '#4E5D52',
        textAlign: 'center',
    },

    // Chips
    chipsScroll: {
        flexGrow: 0,
        marginBottom: 4,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    chipRecommended: {
        backgroundColor: '#F1F8E9',
        borderColor: '#A5D6A7',
    },
    chipSelected: {
        backgroundColor: '#E8F5E9',
        borderColor: '#4CAF50',
    },
    chipRecommendedSelected: {
        backgroundColor: '#DCEDC8',
        borderColor: '#2E7D32',
    },
    chipText: {
        fontSize: 13,
        color: '#757575',
        fontWeight: '500',
    },
    chipTextRecommended: {
        color: '#2E7D32',
        fontWeight: '600',
    },
    chipTextSelected: {
        color: '#4CAF50',
        fontWeight: '600',
    },
    chipIcon: {
        marginLeft: 6,
    },
    recommendationLegend: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#F1F8E9',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#C8E6C9',
    },
    recommendationLegendText: {
        flex: 1,
        fontSize: 12,
        color: '#2E7D32',
        fontWeight: '600',
    },

    // New area
    newAreaContainer: {
        backgroundColor: '#FAFAFA',
        borderRadius: 12,
        padding: 14,
        marginTop: 8,
    },
    dimensionRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    dimensionField: {
        flex: 1,
    },
    dimensionLabel: {
        fontSize: 12,
        color: '#9E9E9E',
        marginBottom: 6,
        fontWeight: '500',
    },

    // Watering schedule
    wateringContainer: {
        backgroundColor: '#F1F8E9',
        borderRadius: 14,
        padding: 16,
        borderWidth: 1,
        borderColor: '#C8E6C9',
    },
    wateringDateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 14,
    },
    wateringDateLabel: {
        fontSize: 14,
        color: '#424242',
        fontWeight: '600',
    },
    dateAdjuster: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 'auto',
        backgroundColor: '#fff',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#C8E6C9',
    },
    dateArrow: {
        paddingHorizontal: 6,
        paddingVertical: 6,
    },
    dateText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1B5E20',
        paddingHorizontal: 6,
    },
    frequencySection: {
        borderTopWidth: 1,
        borderTopColor: '#C8E6C9',
        paddingTop: 12,
    },
    frequencyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 10,
    },
    frequencyLabel: {
        fontSize: 13,
        color: '#424242',
        fontWeight: '600',
    },

    // Tasks
    tasksContainer: {
        backgroundColor: '#FAFAFA',
        borderRadius: 14,
        padding: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    taskItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 4,
        gap: 10,
    },
    taskItemText: {
        fontSize: 14,
        color: '#424242',
        flex: 1,
    },
    taskItemTextChecked: {
        color: '#4CAF50',
        fontWeight: '500',
    },
    taskRemoveBtn: {
        padding: 2,
    },
    addTaskRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#EEEEEE',
        paddingTop: 10,
        gap: 8,
    },
    addTaskInput: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: '#212121',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    addTaskBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#4CAF50',
        alignItems: 'center',
        justifyContent: 'center',
    },
    addTaskBtnDisabled: {
        backgroundColor: '#E8F5E9',
    },
});

export default AddCropModal;
