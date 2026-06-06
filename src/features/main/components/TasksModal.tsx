/**
 * TasksModal - Bottom-sheet modal to view, edit, and add tasks for a crop.
 * Uses the same default task options from cropData.ts.
 * Allows toggling task completion, adding custom tasks, and removing custom tasks.
 */

import React, { useState, useEffect } from 'react';
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
// NOTE: This modal is currently unused — the API does not support task lists yet.
// Types defined locally to avoid breaking the build.
interface CropTask {
    id: string;
    title: string;
    completed: boolean;
}
interface Crop {
    id: string;
    name: string;
    tasks: CropTask[];
}

const defaultCropTasks: string[] = [
    'Riego', 'Fertilizar', 'Podar', 'Control de plagas',
    'Deshierbar', 'Abonar', 'Trasplantar', 'Cosechar',
];
const generateId = (): string => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

interface TasksModalProps {
    visible: boolean;
    crop: Crop | null;
    onClose: () => void;
    onSave: (cropId: string, tasks: CropTask[]) => void;
}

export const TasksModal: React.FC<TasksModalProps> = ({
    visible,
    crop,
    onClose,
    onSave,
}) => {
    const [tasks, setTasks] = useState<CropTask[]>([]);
    const [newTaskText, setNewTaskText] = useState('');

    // Sync tasks when crop changes
    useEffect(() => {
        if (crop) {
            setTasks([...crop.tasks]);
        }
    }, [crop]);

    const toggleTask = (taskId: string) => {
        setTasks((prev) =>
            prev.map((t) =>
                t.id === taskId ? { ...t, completed: !t.completed } : t
            )
        );
    };

    const removeTask = (taskId: string) => {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
    };

    const addCustomTask = () => {
        const trimmed = newTaskText.trim();
        if (!trimmed) return;
        // Avoid duplicates
        if (tasks.some((t) => t.title.toLowerCase() === trimmed.toLowerCase())) return;
        setTasks((prev) => [
            ...prev,
            { id: generateId(), title: trimmed, completed: false },
        ]);
        setNewTaskText('');
    };

    const addDefaultTask = (taskName: string) => {
        // Only add if not already present
        if (tasks.some((t) => t.title === taskName)) return;
        setTasks((prev) => [
            ...prev,
            { id: generateId(), title: taskName, completed: false },
        ]);
    };

    const handleSave = () => {
        if (!crop) return;
        onSave(crop.id, tasks);
        onClose();
    };

    // Determine which default tasks are NOT yet added
    const availableDefaults = defaultCropTasks.filter(
        (dt) => !tasks.some((t) => t.title === dt)
    );

    const completedCount = tasks.filter((t) => t.completed).length;

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
                        <Text style={styles.title}>Tareas del Cultivo</Text>
                        <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                            <MaterialCommunityIcons name="close" size={24} color="#9E9E9E" />
                        </TouchableOpacity>
                    </View>

                    {/* Crop name badge */}
                    <View style={styles.cropBadge}>
                        <MaterialCommunityIcons name="sprout" size={16} color="#4CAF50" />
                        <Text style={styles.cropBadgeText}>{crop.name}</Text>
                    </View>

                    {/* Progress summary */}
                    <View style={styles.progressRow}>
                        <View style={styles.progressBarBg}>
                            <View
                                style={[
                                    styles.progressBarFill,
                                    {
                                        width: tasks.length > 0
                                            ? `${(completedCount / tasks.length) * 100}%`
                                            : '0%',
                                    },
                                ]}
                            />
                        </View>
                        <Text style={styles.progressText}>
                            {completedCount}/{tasks.length}
                        </Text>
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        {/* Current tasks */}
                        <Text style={styles.sectionLabel}>Tareas activas</Text>
                        {tasks.length === 0 ? (
                            <View style={styles.emptyState}>
                                <MaterialCommunityIcons
                                    name="clipboard-text-outline"
                                    size={36}
                                    color="#C8E6C9"
                                />
                                <Text style={styles.emptyText}>
                                    No hay tareas. Agrega una abajo.
                                </Text>
                            </View>
                        ) : (
                            tasks.map((task) => (
                                <View key={task.id} style={styles.taskRow}>
                                    <TouchableOpacity
                                        style={styles.taskCheckArea}
                                        onPress={() => toggleTask(task.id)}
                                        activeOpacity={0.7}
                                    >
                                        <MaterialCommunityIcons
                                            name={
                                                task.completed
                                                    ? 'checkbox-marked'
                                                    : 'checkbox-blank-outline'
                                            }
                                            size={24}
                                            color={task.completed ? '#4CAF50' : '#BDBDBD'}
                                        />
                                        <Text
                                            style={[
                                                styles.taskTitle,
                                                task.completed && styles.taskTitleDone,
                                            ]}
                                        >
                                            {task.title}
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => removeTask(task.id)}
                                        style={styles.removeBtn}
                                        activeOpacity={0.7}
                                    >
                                        <MaterialCommunityIcons
                                            name="close-circle"
                                            size={20}
                                            color="#EF5350"
                                        />
                                    </TouchableOpacity>
                                </View>
                            ))
                        )}

                        {/* Add custom task */}
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

                        {/* Quick-add from default tasks */}
                        {availableDefaults.length > 0 && (
                            <>
                                <Text style={styles.sectionLabel}>Agregar tareas comunes</Text>
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    style={styles.chipsScroll}
                                >
                                    {availableDefaults.map((dt) => (
                                        <TouchableOpacity
                                            key={dt}
                                            style={styles.chip}
                                            onPress={() => addDefaultTask(dt)}
                                            activeOpacity={0.7}
                                        >
                                            <MaterialCommunityIcons
                                                name="plus"
                                                size={14}
                                                color="#4CAF50"
                                            />
                                            <Text style={styles.chipText}>{dt}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </>
                        )}
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
        maxHeight: '85%',
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
        marginBottom: 14,
    },
    cropBadgeText: {
        fontSize: 13,
        color: '#4CAF50',
        fontWeight: '600',
    },

    // Progress
    progressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 18,
    },
    progressBarBg: {
        flex: 1,
        height: 8,
        backgroundColor: '#E0E0E0',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#4CAF50',
        borderRadius: 4,
    },
    progressText: {
        fontSize: 13,
        color: '#9E9E9E',
        fontWeight: '600',
        minWidth: 30,
        textAlign: 'center',
    },

    scrollContent: {
        paddingBottom: 10,
    },

    // Section
    sectionLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#616161',
        marginBottom: 10,
        marginTop: 6,
    },

    // Empty
    emptyState: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    emptyText: {
        fontSize: 13,
        color: '#BDBDBD',
        marginTop: 8,
    },

    // Task rows
    taskRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FAFAFA',
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#EEEEEE',
    },
    taskCheckArea: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    taskTitle: {
        fontSize: 15,
        color: '#424242',
        fontWeight: '500',
        flex: 1,
    },
    taskTitleDone: {
        textDecorationLine: 'line-through',
        color: '#BDBDBD',
    },
    removeBtn: {
        padding: 4,
    },

    // Add task
    addTaskRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 14,
        marginTop: 4,
    },
    addTaskInput: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 14,
        color: '#212121',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    addTaskBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#4CAF50',
        alignItems: 'center',
        justifyContent: 'center',
    },
    addTaskBtnDisabled: {
        backgroundColor: '#E8F5E9',
    },

    // Chips
    chipsScroll: {
        flexGrow: 0,
        marginBottom: 14,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#F1F8E9',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#C8E6C9',
    },
    chipText: {
        fontSize: 13,
        color: '#4CAF50',
        fontWeight: '500',
    },

    // Save
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

export default TasksModal;
