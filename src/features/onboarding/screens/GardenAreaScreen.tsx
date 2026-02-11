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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import { Button } from '../../../shared/components/ui';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Tamaño máximo del preview en pantalla
const PREVIEW_MAX_SIZE = screenWidth - 96;
const MIN_DIMENSION = 1;
const MAX_DIMENSION = 100;

export const GardenAreaScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
    const [lengthValue, setLengthValue] = useState('');
    const [widthValue, setWidthValue] = useState('');

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
    const isValid = length >= MIN_DIMENSION && widthNum >= MIN_DIMENSION;

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
        navigation?.navigate('LocationWater');
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
                                    style={styles.dimensionInput}
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
});

export default GardenAreaScreen;
