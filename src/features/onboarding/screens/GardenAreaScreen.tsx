import React, { useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    ScrollView,
    Dimensions,
    Animated,
    SafeAreaView,
    PanResponder,
    TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '../../../shared/components/ui';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Tamaño máximo del preview en pantalla
const PREVIEW_MAX_SIZE = screenWidth - 96;
const MIN_DIMENSION = 1;
const MAX_DIMENSION = 100;

export const GardenAreaScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
    const [inputMode, setInputMode] = useState<'dimensions' | 'totalArea'>('dimensions');
    const [lengthValue, setLengthValue] = useState('');
    const [widthValue, setWidthValue] = useState('');
    const [totalAreaValue, setTotalAreaValue] = useState('');
    const [areaUnit, setAreaUnit] = useState<'m²' | 'Hectáreas' | 'Acres'>('m²');

    const route = useRoute<any>();
    const { perfil } = route.params || {};

    // Animaciones
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const previewSlide = useRef(new Animated.Value(50)).current;

    useFocusEffect(
        useCallback(() => {
            setLengthValue('');
            setWidthValue('');
            fadeAnim.setValue(0);
            slideAnim.setValue(30);
            previewSlide.setValue(50);

            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(previewSlide, {
                    toValue: 0,
                    duration: 1000,
                    delay: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }, [fadeAnim, slideAnim, previewSlide])
    );

    // Parsear dimensiones
    const length = parseFloat(lengthValue) || 0;
    const widthNum = parseFloat(widthValue) || 0;
    const area = length * widthNum;
    
    const totalAreaNum = parseFloat(totalAreaValue) || 0;

    const isValid = inputMode === 'dimensions' 
        ? (length >= MIN_DIMENSION && widthNum >= MIN_DIMENSION)
        : (totalAreaNum > 0);

    // Calcular tamaño del preview proporcional
    const getPreviewDimensions = () => {
        if (length <= 0 || widthNum <= 0) {
            return { previewWidth: PREVIEW_MAX_SIZE * 0.6, previewHeight: PREVIEW_MAX_SIZE * 0.6 };
        }
        const maxDim = Math.max(length, widthNum);
        const scale = PREVIEW_MAX_SIZE / maxDim;
        const previewWidth = Math.max(widthNum * scale, 60);
        const previewHeight = Math.max(length * scale, 60);
        return {
            previewWidth: Math.min(previewWidth, PREVIEW_MAX_SIZE),
            previewHeight: Math.min(previewHeight, PREVIEW_MAX_SIZE),
        };
    };

    const { previewWidth, previewHeight } = getPreviewDimensions();

    // PanResponder para redimensionar arrastrando
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderMove: (_, gestureState) => {
                const newWidthPx = Math.max(60, Math.min(PREVIEW_MAX_SIZE, previewWidth + gestureState.dx));
                const newHeightPx = Math.max(60, Math.min(PREVIEW_MAX_SIZE, previewHeight + gestureState.dy));

                const maxDim = Math.max(length || 10, widthNum || 10);
                const scale = PREVIEW_MAX_SIZE / maxDim;

                const newWidth = Math.round(Math.max(MIN_DIMENSION, Math.min(MAX_DIMENSION, newWidthPx / scale)));
                const newLength = Math.round(Math.max(MIN_DIMENSION, Math.min(MAX_DIMENSION, newHeightPx / scale)));

                setWidthValue(String(newWidth));
                setLengthValue(String(newLength));
            },
        })
    ).current;

    const handleNext = () => {
        const finalArea = inputMode === 'dimensions' 
            ? `${area} m²` 
            : `${totalAreaValue} ${areaUnit}`;
            
        navigation?.navigate('LocationWater', { 
            perfil, 
            area_cultivo: finalArea 
        });
    };

    const handleDimensionChange = (
        text: string,
        setter: React.Dispatch<React.SetStateAction<string>>
    ) => {
        // Solo permitir números y punto decimal
        const cleaned = text.replace(/[^0-9.]/g, '');
        const num = parseFloat(cleaned);
        if (cleaned === '' || (num >= 0 && num <= MAX_DIMENSION)) {
            setter(cleaned);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Botón de retroceso */}
                <Animated.View
                    style={[
                        styles.backButtonContainer,
                        {
                            opacity: fadeAnim,
                        },
                    ]}
                >
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation?.goBack()}
                        activeOpacity={0.7}
                    >
                        <MaterialCommunityIcons
                            name="arrow-left"
                            size={24}
                            color="#1B5E20"
                        />
                    </TouchableOpacity>
                </Animated.View>

                {/* Título */}
                <Animated.View
                    style={[
                        styles.headerContainer,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        },
                    ]}
                >
                    <Text style={styles.title}>Define tu área de cultivo</Text>
                </Animated.View>

                {/* Selector de Modo */}
                <Animated.View style={[styles.toggleContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    <TouchableOpacity 
                        style={[styles.toggleButton, inputMode === 'dimensions' && styles.toggleButtonActive]}
                        onPress={() => setInputMode('dimensions')}
                        activeOpacity={0.8}
                    >
                        <MaterialCommunityIcons 
                            name="vector-square" 
                            size={20} 
                            color={inputMode === 'dimensions' ? '#fff' : '#1B5E20'} 
                        />
                        <Text style={[styles.toggleText, inputMode === 'dimensions' && styles.toggleTextActive]}>
                            Dimensiones
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.toggleButton, inputMode === 'totalArea' && styles.toggleButtonActive]}
                        onPress={() => setInputMode('totalArea')}
                        activeOpacity={0.8}
                    >
                        <MaterialCommunityIcons 
                            name="shape-polygon-plus" 
                            size={20} 
                            color={inputMode === 'totalArea' ? '#fff' : '#1B5E20'} 
                        />
                        <Text style={[styles.toggleText, inputMode === 'totalArea' && styles.toggleTextActive]}>
                            Área Libre
                        </Text>
                    </TouchableOpacity>
                </Animated.View>

                {/* Contenedor principal con glassmorphism */}
                <Animated.View
                    style={[
                        styles.mainCard,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: previewSlide }],
                        },
                    ]}
                >
                    {inputMode === 'dimensions' ? (
                        <>
                            {/* Inputs de dimensiones */}
                            <View style={styles.inputsRow}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Largo (m)</Text>
                                    <View style={styles.inputWrapper}>
                                        <TextInput
                                            style={[styles.dimensionInput, { outlineStyle: 'none' } as any]}
                                            value={lengthValue}
                                            onChangeText={(text) => handleDimensionChange(text, setLengthValue)}
                                            keyboardType="numeric"
                                            placeholder="0"
                                            placeholderTextColor="#A5D6A7"
                                            maxLength={5}
                                        />
                                    </View>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Ancho (m)</Text>
                                    <View style={styles.inputWrapper}>
                                        <TextInput
                                            style={[styles.dimensionInput, { outlineStyle: 'none' } as any]}
                                            value={widthValue}
                                            onChangeText={(text) => handleDimensionChange(text, setWidthValue)}
                                            keyboardType="numeric"
                                            placeholder="0"
                                            placeholderTextColor="#A5D6A7"
                                            maxLength={5}
                                        />
                                    </View>
                                </View>
                            </View>

                            {/* Preview del terreno */}
                            <Text style={styles.previewLabel}>Vista cenital de tu terreno:</Text>

                            <View style={styles.previewContainer}>
                                <View
                                    {...panResponder.panHandlers}
                                    style={[
                                        styles.gardenPreview,
                                        {
                                            width: previewWidth,
                                            height: previewHeight,
                                        },
                                    ]}
                                >
                                    <Text style={styles.previewDimensions}>
                                        {length > 0 ? length : '0'}m × {widthNum > 0 ? widthNum : '0'}m
                                    </Text>
                                    <Text style={styles.previewArea}>
                                        {area > 0 ? area.toFixed(1) : '0'} m²
                                    </Text>

                                    {/* Indicador de arrastre */}
                                    <View style={styles.dragHandle}>
                                        <View style={styles.dragDot} />
                                        <View style={styles.dragDot} />
                                        <View style={[styles.dragDot, { marginBottom: 0 }]} />
                                    </View>
                                </View>
                            </View>

                            {isValid && (
                                <Text style={styles.helpText}>
                                    Arrastra la esquina para ajustar las dimensiones
                                </Text>
                            )}
                        </>
                    ) : (
                        <>
                            <Text style={styles.previewLabel}>Especifica tu área total y unidad:</Text>
                            
                            <View style={styles.inputsRow}>
                                <View style={[styles.inputGroup, { flex: 2 }]}>
                                    <Text style={styles.inputLabel}>Área Total</Text>
                                    <View style={styles.inputWrapper}>
                                        <TextInput
                                            style={[styles.dimensionInput, { outlineStyle: 'none' } as any]}
                                            value={totalAreaValue}
                                            onChangeText={(text) => handleDimensionChange(text, setTotalAreaValue)}
                                            keyboardType="numeric"
                                            placeholder="0"
                                            placeholderTextColor="#A5D6A7"
                                            maxLength={8}
                                        />
                                    </View>
                                </View>
                                
                                <View style={[styles.inputGroup, { flex: 1.5 }]}>
                                    <Text style={styles.inputLabel}>Unidad</Text>
                                    <TouchableOpacity 
                                        style={styles.unitSelector}
                                        onPress={() => setAreaUnit(prev => prev === 'm²' ? 'Hectáreas' : prev === 'Hectáreas' ? 'Acres' : 'm²')}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.unitText}>{areaUnit}</Text>
                                        <MaterialCommunityIcons name="swap-vertical" size={20} color="#2E7D32" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.irregularPreviewContainer}>
                                <View style={styles.iconCircle}>
                                    <MaterialCommunityIcons name="image-filter-hdr" size={54} color="#66BB6A" />
                                </View>
                                <Text style={styles.previewDimensions}>
                                    {totalAreaNum > 0 ? totalAreaValue : '0'} {areaUnit}
                                </Text>
                                <Text style={styles.helpText}>Terreno Irregular / Extenso</Text>
                            </View>
                        </>
                    )}
                </Animated.View>

                {/* Botón siguiente */}
                <Animated.View
                    style={[
                        styles.buttonContainer,
                        { opacity: fadeAnim },
                    ]}
                >
                    <Button
                        title="Siguiente"
                        onPress={handleNext}
                        disabled={!isValid}
                        style={styles.nextButton}
                    />
                </Animated.View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#E8F5E9',
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: screenHeight * 0.06,
        paddingBottom: 40,
    },
    backButtonContainer: {
        marginBottom: 16,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    headerContainer: {
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1B5E20',
        lineHeight: 32,
    },

    // Card principal
    mainCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
        marginBottom: 24,
    },

    // Inputs
    inputsRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 24,
    },
    inputGroup: {
        flex: 1,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1B5E20',
        marginBottom: 8,
    },
    inputWrapper: {
        borderWidth: 1.5,
        borderColor: '#4CAF50',
        borderRadius: 12,
        backgroundColor: '#FAFFF5',
    },
    dimensionInput: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 18,
        fontWeight: '600',
        color: '#2E7D32',
    },

    // Preview
    previewLabel: {
        fontSize: 14,
        color: '#66BB6A',
        marginBottom: 16,
    },
    previewContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: PREVIEW_MAX_SIZE + 20,
        marginBottom: 8,
    },
    gardenPreview: {
        backgroundColor: '#E8F5E9',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#A5D6A7',
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
    },
    previewDimensions: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2E7D32',
        marginBottom: 4,
    },
    previewArea: {
        fontSize: 14,
        color: '#66BB6A',
    },

    // Drag handle
    dragHandle: {
        position: 'absolute',
        bottom: 8,
        right: 8,
    },
    dragDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#A5D6A7',
        marginBottom: 3,
    },

    helpText: {
        fontSize: 12,
        color: '#A5D6A7',
        textAlign: 'center',
        marginTop: 8,
    },

    // Botón
    buttonContainer: {
        marginTop: 'auto',
    },
    nextButton: {
        width: '100%',
    },

    // Toggle
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 4,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    toggleButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    toggleButtonActive: {
        backgroundColor: '#4CAF50',
    },
    toggleText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1B5E20',
    },
    toggleTextActive: {
        color: '#fff',
    },

    // Total Area Mode Styles
    unitSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1.5,
        borderColor: '#4CAF50',
        borderRadius: 12,
        backgroundColor: '#FAFFF5',
        paddingHorizontal: 16,
        paddingVertical: 14,
        height: 52, // Match the height of the TextInput roughly
    },
    unitText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#2E7D32',
    },
    irregularPreviewContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: PREVIEW_MAX_SIZE * 0.7,
        backgroundColor: '#f1f8e9',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#C8E6C9',
        borderStyle: 'dashed',
        marginTop: 10,
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
});

export default GardenAreaScreen;
