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
import { OnboardingProgressBar } from '../components/OnboardingProgressBar';

const { width: screenWidth } = Dimensions.get('window');
const PREVIEW_MAX_SIZE = screenWidth - 96;
const MIN_DIMENSION = 1;
const MAX_DIMENSION = 100;

export const GardenAreaScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
    // Tipos de cultivo
    const [cultivationType, setCultivationType] = useState<'terreno' | 'macetas' | 'hidroponia'>('terreno');

    // Estado Terreno
    const [inputMode, setInputMode] = useState<'dimensions' | 'totalArea'>('dimensions');
    const [lengthValue, setLengthValue] = useState('');
    const [widthValue, setWidthValue] = useState('');
    const [totalAreaValue, setTotalAreaValue] = useState('');
    const [areaUnit, setAreaUnit] = useState<'m²' | 'Hectáreas' | 'Acres'>('m²');

    // Estado Macetas
    const [potCount, setPotCount] = useState('');
    const [potVolume, setPotVolume] = useState('');

    // Estado Hidroponía
    const [hydroSystem, setHydroSystem] = useState<'NFT' | 'DWC' | 'Raíz Flotante'>('NFT');
    const [hydroPlantsCount, setHydroPlantsCount] = useState('');

    const route = useRoute<any>();
    const { perfil } = route.params || {};

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const previewSlide = useRef(new Animated.Value(50)).current;

    useFocusEffect(
        useCallback(() => {
            fadeAnim.setValue(0);
            slideAnim.setValue(30);
            previewSlide.setValue(50);

            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: false }),
                Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: false }),
                Animated.timing(previewSlide, { toValue: 0, duration: 1000, delay: 200, useNativeDriver: false }),
            ]).start();
        }, [fadeAnim, slideAnim, previewSlide])
    );

    // Cálculos terreno
    const length = parseFloat(lengthValue) || 0;
    const widthNum = parseFloat(widthValue) || 0;
    const area = length * widthNum;
    const totalAreaNum = parseFloat(totalAreaValue) || 0;

    // Validación
    let isValid = false;
    if (cultivationType === 'terreno') {
        isValid = inputMode === 'dimensions' ? (length >= MIN_DIMENSION && widthNum >= MIN_DIMENSION) : (totalAreaNum > 0);
    } else if (cultivationType === 'macetas') {
        isValid = (parseInt(potCount) > 0) && (parseFloat(potVolume) > 0);
    } else if (cultivationType === 'hidroponia') {
        isValid = parseInt(hydroPlantsCount) > 0;
    }

    const { previewWidth, previewHeight } = (() => {
        if (length <= 0 || widthNum <= 0) return { previewWidth: PREVIEW_MAX_SIZE * 0.6, previewHeight: PREVIEW_MAX_SIZE * 0.6 };
        const maxDim = Math.max(length, widthNum);
        const scale = PREVIEW_MAX_SIZE / maxDim;
        return {
            previewWidth: Math.min(Math.max(widthNum * scale, 60), PREVIEW_MAX_SIZE),
            previewHeight: Math.min(Math.max(length * scale, 60), PREVIEW_MAX_SIZE),
        };
    })();

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderMove: (_, gestureState) => {
                if (cultivationType !== 'terreno' || inputMode !== 'dimensions') return;
                const newWidthPx = Math.max(60, Math.min(PREVIEW_MAX_SIZE, previewWidth + gestureState.dx));
                const newHeightPx = Math.max(60, Math.min(PREVIEW_MAX_SIZE, previewHeight + gestureState.dy));
                const maxDim = Math.max(length || 10, widthNum || 10);
                const scale = PREVIEW_MAX_SIZE / maxDim;
                setWidthValue(String(Math.round(Math.max(MIN_DIMENSION, Math.min(MAX_DIMENSION, newWidthPx / scale)))));
                setLengthValue(String(Math.round(Math.max(MIN_DIMENSION, Math.min(MAX_DIMENSION, newHeightPx / scale)))));
            },
        })
    ).current;

    const handleNext = () => {
        let finalArea = '';
        if (cultivationType === 'terreno') {
            finalArea = inputMode === 'dimensions' ? `${area} m² (Terreno)` : `${totalAreaValue} ${areaUnit} (Terreno)`;
        } else if (cultivationType === 'macetas') {
            finalArea = `${potCount} macetas de ${potVolume}L`;
        } else {
            finalArea = `Hidroponía ${hydroSystem} - ${hydroPlantsCount} plantas`;
        }

        navigation?.navigate('LocationWater', {
            perfil,
            area_cultivo: finalArea
        });
    };

    const cleanNumber = (text: string) => text.replace(/[^0-9.]/g, '');

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />
            <OnboardingProgressBar currentStep={2} totalSteps={3} />
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <Animated.View style={[styles.headerContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    <TouchableOpacity style={styles.backButtonInline} onPress={() => navigation?.goBack()} activeOpacity={0.7}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color="#111827" />
                    </TouchableOpacity>
                    <Text style={styles.title}>¿Cómo vas a cultivar?</Text>
                </Animated.View>

                {/* Tipo de Sistema */}
                <Animated.View style={[styles.typeContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    {(['terreno', 'macetas', 'hidroponia'] as const).map(type => (
                        <TouchableOpacity
                            key={type}
                            style={[styles.typeCard, cultivationType === type && styles.typeCardActive]}
                            onPress={() => setCultivationType(type)}
                            activeOpacity={0.8}
                        >
                            <MaterialCommunityIcons
                                name={type === 'terreno' ? 'sprout' : type === 'macetas' ? 'pot' : 'pipe'}
                                size={28}
                                color={cultivationType === type ? '#fff' : '#059669'}
                            />
                            <Text style={[styles.typeText, cultivationType === type && styles.typeTextActive]}>
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </Animated.View>

                <Animated.View style={[styles.mainCard, { opacity: fadeAnim, transform: [{ translateY: previewSlide }] }]}>
                    {cultivationType === 'terreno' && (
                        <>
                            <View style={[styles.toggleContainer]}>
                                <TouchableOpacity style={[styles.toggleButton, inputMode === 'dimensions' && styles.toggleButtonActive]} onPress={() => setInputMode('dimensions')}>
                                    <Text style={[styles.toggleText, inputMode === 'dimensions' && styles.toggleTextActive]}>Dimensiones</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.toggleButton, inputMode === 'totalArea' && styles.toggleButtonActive]} onPress={() => setInputMode('totalArea')}>
                                    <Text style={[styles.toggleText, inputMode === 'totalArea' && styles.toggleTextActive]}>Área Libre</Text>
                                </TouchableOpacity>
                            </View>

                            {inputMode === 'dimensions' ? (
                                <>
                                    <View style={styles.inputsRow}>
                                        <View style={styles.inputGroup}>
                                            <Text style={styles.inputLabel}>Largo (m)</Text>
                                            <View style={styles.inputWrapper}>
                                                <TextInput style={[styles.dimensionInput, { outlineStyle: 'none' } as any]} value={lengthValue} onChangeText={t => setLengthValue(cleanNumber(t))} keyboardType="numeric" placeholder="0" />
                                            </View>
                                        </View>
                                        <View style={styles.inputGroup}>
                                            <Text style={styles.inputLabel}>Ancho (m)</Text>
                                            <View style={styles.inputWrapper}>
                                                <TextInput style={[styles.dimensionInput, { outlineStyle: 'none' } as any]} value={widthValue} onChangeText={t => setWidthValue(cleanNumber(t))} keyboardType="numeric" placeholder="0" />
                                            </View>
                                        </View>
                                    </View>
                                    <Text style={styles.previewLabel}>Vista cenital de tu terreno:</Text>
                                    <View style={styles.previewContainer}>
                                        <View {...panResponder.panHandlers} style={[styles.gardenPreview, { width: previewWidth, height: previewHeight }]}>
                                            <Text style={styles.previewDimensions}>{length > 0 ? length : '0'}m × {widthNum > 0 ? widthNum : '0'}m</Text>
                                            <Text style={styles.previewArea}>{area > 0 ? area.toFixed(1) : '0'} m²</Text>
                                            <View style={styles.dragHandle}><View style={styles.dragDot} /><View style={styles.dragDot} /><View style={styles.dragDot} /></View>
                                        </View>
                                    </View>
                                </>
                            ) : (
                                <>
                                    <View style={styles.inputsRow}>
                                        <View style={[styles.inputGroup, { flex: 2 }]}>
                                            <Text style={styles.inputLabel}>Área Total</Text>
                                            <View style={styles.inputWrapper}>
                                                <TextInput style={[styles.dimensionInput, { outlineStyle: 'none' } as any]} value={totalAreaValue} onChangeText={t => setTotalAreaValue(cleanNumber(t))} keyboardType="numeric" placeholder="0" />
                                            </View>
                                        </View>
                                        <View style={[styles.inputGroup, { flex: 1.5 }]}>
                                            <Text style={styles.inputLabel}>Unidad</Text>
                                            <TouchableOpacity style={styles.unitSelector} onPress={() => setAreaUnit(p => p === 'm²' ? 'Hectáreas' : p === 'Hectáreas' ? 'Acres' : 'm²')}>
                                                <Text style={styles.unitText}>{areaUnit}</Text>
                                                <MaterialCommunityIcons name="swap-vertical" size={20} color="#059669" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </>
                            )}
                        </>
                    )}

                    {cultivationType === 'macetas' && (
                        <>
                            <Text style={styles.previewLabel}>Configura tu espacio de macetas:</Text>
                            <View style={styles.inputsRow}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Cant. de Macetas</Text>
                                    <View style={styles.inputWrapper}>
                                        <TextInput style={[styles.dimensionInput, { outlineStyle: 'none' } as any]} value={potCount} onChangeText={t => setPotCount(t.replace(/[^0-9]/g, ''))} keyboardType="numeric" placeholder="Ej: 10" />
                                    </View>
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Volumen prom. (L)</Text>
                                    <View style={styles.inputWrapper}>
                                        <TextInput style={[styles.dimensionInput, { outlineStyle: 'none' } as any]} value={potVolume} onChangeText={t => setPotVolume(cleanNumber(t))} keyboardType="numeric" placeholder="Ej: 20" />
                                    </View>
                                </View>
                            </View>
                            <View style={styles.irregularPreviewContainer}>
                                <View style={styles.iconCircle}><MaterialCommunityIcons name="flower-tulip" size={48} color="#059669" /></View>
                                <Text style={styles.helpText}>El volumen de tierra o sustrato es importante para el riego.</Text>
                            </View>
                        </>
                    )}

                    {cultivationType === 'hidroponia' && (
                        <>
                            <Text style={styles.previewLabel}>Configura tu sistema hidropónico:</Text>
                            <View style={styles.toggleContainer}>
                                {(['NFT', 'DWC', 'Raíz Flotante'] as const).map(sys => (
                                    <TouchableOpacity key={sys} style={[styles.toggleButton, hydroSystem === sys && styles.toggleButtonActive]} onPress={() => setHydroSystem(sys)}>
                                        <Text style={[styles.toggleText, hydroSystem === sys && styles.toggleTextActive]}>{sys}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Capacidad de plantas (Espacios)</Text>
                                <View style={styles.inputWrapper}>
                                    <TextInput style={[styles.dimensionInput, { outlineStyle: 'none' } as any]} value={hydroPlantsCount} onChangeText={t => setHydroPlantsCount(t.replace(/[^0-9]/g, ''))} keyboardType="numeric" placeholder="Ej: 50" />
                                </View>
                            </View>
                            <View style={[styles.irregularPreviewContainer, { marginTop: 20 }]}>
                                <View style={styles.iconCircle}><MaterialCommunityIcons name="pipe-leak" size={48} color="#059669" /></View>
                                <Text style={styles.helpText}>Mantén monitoreado el pH y la conductividad eléctrica.</Text>
                            </View>
                        </>
                    )}
                </Animated.View>

                <Animated.View style={[styles.buttonContainer, { opacity: fadeAnim }]}>
                    <Button title="Siguiente" onPress={handleNext} disabled={!isValid} style={styles.nextButton} />
                </Animated.View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FAFAFA' },
    scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 0, paddingBottom: 40 },
    backButtonContainer: { marginBottom: 16 }, // Kept for reference but unused
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
    backButtonInline: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, marginRight: 16 },
    headerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    title: { fontSize: 24, fontWeight: '800', color: '#111827', lineHeight: 32, flex: 1 },
    typeContainer: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    typeCard: { flex: 1, backgroundColor: '#fff', paddingVertical: 16, borderRadius: 16, alignItems: 'center', borderWidth: 2, borderColor: '#F3F4F6' },
    typeCardActive: { borderColor: '#059669', backgroundColor: '#059669' },
    typeText: { marginTop: 8, fontSize: 13, fontWeight: '700', color: '#6B7280' },
    typeTextActive: { color: '#fff' },
    mainCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5, marginBottom: 16 },
    inputsRow: { flexDirection: 'row', gap: 16, marginBottom: 12 },
    inputGroup: { flex: 1 },
    inputLabel: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 6 },
    inputWrapper: { borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, backgroundColor: '#FFFFFF' },
    dimensionInput: { paddingHorizontal: 16, paddingVertical: 10, fontSize: 18, fontWeight: '600', color: '#059669' },
    previewLabel: { fontSize: 14, color: '#6B7280', marginBottom: 8 },
    previewContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 10, marginBottom: 8 },
    gardenPreview: { backgroundColor: '#ECFDF5', borderRadius: 12, borderWidth: 2, borderColor: '#059669', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
    previewDimensions: { fontSize: 16, fontWeight: '700', color: '#059669', marginBottom: 4 },
    previewArea: { fontSize: 14, color: '#111827' },
    dragHandle: { position: 'absolute', bottom: 8, right: 8 },
    dragDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#059669', marginBottom: 3 },
    helpText: { fontSize: 12, color: '#6B7280', textAlign: 'center', marginTop: 8 },
    buttonContainer: { marginTop: 'auto' },
    nextButton: { width: '100%' },
    toggleContainer: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: 4, marginBottom: 20, borderWidth: 1, borderColor: '#E5E7EB' },
    toggleButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
    toggleButtonActive: { backgroundColor: '#059669' },
    toggleText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
    toggleTextActive: { color: '#fff' },
    unitSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, backgroundColor: '#FFFFFF', paddingHorizontal: 16, height: 52 },
    unitText: { fontSize: 15, fontWeight: '600', color: '#111827' },
    irregularPreviewContainer: { alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: '#ECFDF5', borderRadius: 20, borderWidth: 1, borderColor: '#D1FAE5', borderStyle: 'dashed' },
    iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 12, shadowColor: '#059669', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
});

export default GardenAreaScreen;
