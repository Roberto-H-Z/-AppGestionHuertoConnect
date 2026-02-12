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

import React, { useState } from 'react';
import {
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
    onSave: (crop: Crop, gardenArea?: GardenArea) => void;
    gardenAreas: GardenArea[];
}

// ---- Reusable Sub-Components ----

const FieldLabel: React.FC<{ text: string }> = ({ text }) => (
    <Text style={styles.fieldLabel}>{text}</Text>
);

const SelectableChip: React.FC<{
    label: string;
    selected: boolean;
    onPress: () => void;
}> = ({ label, selected, onPress }) => (
    <TouchableOpacity
        style={[styles.chip, selected && styles.chipSelected]}
        onPress={onPress}
        activeOpacity={0.7}
    >
        <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
            {label}
        </Text>
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

// ---- Main Component ----

export const AddCropModal: React.FC<AddCropModalProps> = ({
    visible,
    onClose,
    onSave,
    gardenAreas,
}) => {
    // Form state
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

    const handleSave = () => {
        if (!name.trim()) return;

        let areaId = selectedAreaId;
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

        const crop: Crop = {
            id: generateId(),
            gardenAreaId: areaId,
            name: name.trim(),
            imageUri,
            currentDay: parseInt(currentDay) || 1,
            totalDays: parseInt(totalDays) || 90,
            harvestStatus,
            nextWatering: `${formatDate(wateringDate)} (${getFrequencyLabel()})`,
            watering: {
                nextDate: isoDate(wateringDate),
                frequency: wateringFrequency,
                quantity: 2,
                lastWatering: 'Sin registro',
            },
            tasks: allTasks,
            description: description.trim(),
        };

        onSave(crop, newArea);
        resetForm();
    };

    const isValid = name.trim().length > 0;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                style={styles.modalContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {/* Header */}
                <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={() => { resetForm(); onClose(); }} activeOpacity={0.7}>
                        <MaterialCommunityIcons name="close" size={24} color="#9E9E9E" />
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>Nuevo Cultivo</Text>
                    <TouchableOpacity
                        onPress={handleSave}
                        disabled={!isValid}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.saveButton, !isValid && styles.saveButtonDisabled]}>
                            Guardar
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

                    {/* ---- Name ---- */}
                    <FieldLabel text="Nombre del cultivo *" />
                    <TextInput
                        style={styles.input}
                        placeholder="Ej: Mis Tomates"
                        placeholderTextColor="#BDBDBD"
                        value={name}
                        onChangeText={setName}
                    />

                    {/* ---- Garden Area Selector ---- */}
                    <FieldLabel text="Área de cultivo" />
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.chipsScroll}
                    >
                        {gardenAreas.map((area) => (
                            <SelectableChip
                                key={area.id}
                                label={area.name}
                                selected={selectedAreaId === area.id && !showNewArea}
                                onPress={() => { setSelectedAreaId(area.id); setShowNewArea(false); }}
                            />
                        ))}
                        <SelectableChip
                            label="+ Nueva área"
                            selected={showNewArea}
                            onPress={() => setShowNewArea(true)}
                        />
                    </ScrollView>

                    {showNewArea && (
                        <View style={styles.newAreaContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Nombre del área"
                                placeholderTextColor="#BDBDBD"
                                value={newAreaName}
                                onChangeText={setNewAreaName}
                            />
                            <View style={styles.dimensionRow}>
                                <View style={styles.dimensionField}>
                                    <Text style={styles.dimensionLabel}>Largo (m)</Text>
                                    <TextInput
                                        style={styles.inputSmall}
                                        placeholder="10"
                                        placeholderTextColor="#BDBDBD"
                                        keyboardType="numeric"
                                        value={newAreaLength}
                                        onChangeText={setNewAreaLength}
                                    />
                                </View>
                                <View style={styles.dimensionField}>
                                    <Text style={styles.dimensionLabel}>Ancho (m)</Text>
                                    <TextInput
                                        style={styles.inputSmall}
                                        placeholder="5"
                                        placeholderTextColor="#BDBDBD"
                                        keyboardType="numeric"
                                        value={newAreaWidth}
                                        onChangeText={setNewAreaWidth}
                                    />
                                </View>
                            </View>
                        </View>
                    )}

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

                        {/* Frequency selector */}
                        <View style={styles.frequencySection}>
                            <View style={styles.frequencyHeader}>
                                <MaterialCommunityIcons name="repeat" size={18} color="#4CAF50" />
                                <Text style={styles.frequencyLabel}>Repetir cada:</Text>
                            </View>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                {wateringFrequencyOptions.map((opt) => (
                                    <SelectableChip
                                        key={opt.days}
                                        label={opt.label}
                                        selected={wateringFrequency === opt.days}
                                        onPress={() => setWateringFrequency(opt.days)}
                                    />
                                ))}
                            </ScrollView>
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

    // Chips
    chipsScroll: {
        flexGrow: 0,
        marginBottom: 4,
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
