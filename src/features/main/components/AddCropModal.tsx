/**
 * AddHuertoModal — Form modal to create a new Huerto.
 * Features:
 * - Huerto name & municipio text inputs
 * - Region selector (chips from API) + inline "create new" option
 * - Estado selector (Optimo / Atencion / Critico)
 * - Salud slider (0–100)
 * - Optional: associate a Cultivo (siembra) with fecha_siembra
 * - Cultivo selector (chips from API) + inline "create new" option
 */

import React, { useEffect, useRef, useState } from 'react';
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
    Alert,
    ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import type {
    Region,
    Cultivo,
    HuertoCreate,
    RegionCreate,
    CultivoCreate,
    Huerto,
    RecomendacionCultivo,
    RecomendarCultivosResponse,
} from '../types/cropTypes';
import {
    ESTADO_HUERTO_OPTIONS,
    ESTADO_COLORS,
    ACTIVIDAD_REGION_OPTIONS,
    DIFICULTAD_CULTIVO_OPTIONS,
} from '../types/cropTypes';
import { huertoService } from '../services/huertoService';

// ── Props ──

interface AddHuertoModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (
        huertoData: HuertoCreate,
        siembraData?: { cultivoId: string; fechaSiembra?: string },
        newRegion?: RegionCreate,
        newCultivo?: CultivoCreate,
    ) => Promise<void>;
    regiones: Region[];
    cultivos: Cultivo[];
}

// ── Sub-components ──

const FieldLabel: React.FC<{ text: string }> = ({ text }) => (
    <Text style={styles.fieldLabel}>{text}</Text>
);

const SelectableChip: React.FC<{
    label: string;
    selected: boolean;
    color?: string;
    onPress: () => void;
}> = ({ label, selected, color, onPress }) => (
    <TouchableOpacity
        style={[
            styles.chip,
            selected && styles.chipSelected,
            selected && color ? { backgroundColor: color, borderColor: color } : undefined,
        ]}
        onPress={onPress}
        activeOpacity={0.7}
    >
        <Text
            style={[
                styles.chipText,
                selected && styles.chipTextSelected,
            ]}
        >
            {label}
        </Text>
    </TouchableOpacity>
);

// ── Saving Loader ──

const SavingLoader: React.FC = () => {
    const pulseAnim = useRef(new Animated.Value(0.92)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 0.92, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ])
        );
        const rotation = Animated.loop(
            Animated.timing(rotateAnim, { toValue: 1, duration: 2400, easing: Easing.linear, useNativeDriver: true })
        );
        pulse.start();
        rotation.start();
        return () => { pulse.stop(); rotation.stop(); };
    }, [pulseAnim, rotateAnim]);

    const spin = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

    return (
        <View style={styles.loaderOverlay}>
            <View style={styles.loaderCard}>
                <Animated.View style={[styles.loaderOrbit, { transform: [{ rotate: spin }] }]} />
                <Animated.View style={[styles.loaderCore, { transform: [{ scale: pulseAnim }] }]}>
                    <MaterialCommunityIcons name="sprout" size={38} color="#2E7D32" />
                </Animated.View>
                <Text style={styles.loaderTitle}>Creando tu huerto</Text>
                <Text style={styles.loaderSubtitle}>Preparando todo, espera un momento.</Text>
            </View>
        </View>
    );
};

// ── Main Component ──

export const AddHuertoModal: React.FC<AddHuertoModalProps> = ({
    visible,
    onClose,
    onSave,
    regiones,
    cultivos,
}) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Huerto fields
    const [nombre, setNombre] = useState('');
    const [municipio, setMunicipio] = useState('');
    const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
    const [estado, setEstado] = useState<Huerto['estado']>('Optimo');
    const [salud, setSalud] = useState('100');

    // New region inline form
    const [showNewRegion, setShowNewRegion] = useState(false);
    const [newRegionNombre, setNewRegionNombre] = useState('');
    const [newRegionActividad, setNewRegionActividad] = useState<Region['actividad']>('Media');

    // Siembra (optional cultivo association)
    const [addSiembra, setAddSiembra] = useState(false);
    const [selectedCultivoId, setSelectedCultivoId] = useState<string | null>(null);
    const [fechaSiembra, setFechaSiembra] = useState(
        new Date().toISOString().split('T')[0]
    );

    // New cultivo inline form
    const [showNewCultivo, setShowNewCultivo] = useState(false);
    const [newCultivoNombre, setNewCultivoNombre] = useState('');
    const [newCultivoDificultad, setNewCultivoDificultad] = useState<Cultivo['dificultad']>('Media');
    const [newCultivoTemporada, setNewCultivoTemporada] = useState('');
    const [newCultivoRiego, setNewCultivoRiego] = useState('');
    const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
    const [recommendationResult, setRecommendationResult] =
        useState<RecomendarCultivosResponse | null>(null);
    const [selectedRecommendation, setSelectedRecommendation] = useState<string | null>(null);

    const resetForm = () => {
        setNombre('');
        setMunicipio('');
        setSelectedRegionId(null);
        setEstado('Optimo');
        setSalud('100');
        setShowNewRegion(false);
        setNewRegionNombre('');
        setNewRegionActividad('Media');
        setAddSiembra(false);
        setSelectedCultivoId(null);
        setFechaSiembra(new Date().toISOString().split('T')[0]);
        setShowNewCultivo(false);
        setNewCultivoNombre('');
        setNewCultivoDificultad('Media');
        setNewCultivoTemporada('');
        setNewCultivoRiego('');
        setIsLoadingRecommendations(false);
        setRecommendationResult(null);
        setSelectedRecommendation(null);
    };

    const isValid = () => {
        if (!nombre.trim()) return false;
        if (showNewRegion && !newRegionNombre.trim()) return false;
        if (addSiembra && !selectedCultivoId && !showNewCultivo) return false;
        if (addSiembra && showNewCultivo && !newCultivoNombre.trim()) return false;
        return true;
    };

    const handleSave = async () => {
        if (!isValid() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const huertoData: HuertoCreate = {
                nombre: nombre.trim(),
                municipio: municipio.trim(),
                region_id: showNewRegion ? null : selectedRegionId,
                estado,
                salud: Math.min(100, Math.max(0, parseInt(salud) || 100)),
            };

            const newRegion: RegionCreate | undefined = showNewRegion
                ? { nombre: newRegionNombre.trim(), actividad: newRegionActividad }
                : undefined;

            let siembraPayload: { cultivoId: string; fechaSiembra?: string } | undefined;
            let newCultivo: CultivoCreate | undefined;

            if (addSiembra) {
                if (showNewCultivo) {
                    newCultivo = {
                        nombre: newCultivoNombre.trim(),
                        dificultad: newCultivoDificultad,
                        temporada: newCultivoTemporada.trim(),
                        riego: newCultivoRiego.trim(),
                    };
                    siembraPayload = { cultivoId: '__new__', fechaSiembra };
                } else if (selectedCultivoId) {
                    siembraPayload = { cultivoId: selectedCultivoId, fechaSiembra };
                }
            }

            await onSave(huertoData, siembraPayload, newRegion, newCultivo);
            resetForm();
            onClose();
        } catch {
            // Error handled by parent
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── Date adjustment ──
    const adjustDate = (days: number) => {
        const d = new Date(fechaSiembra + 'T12:00:00');
        d.setDate(d.getDate() + days);
        setFechaSiembra(d.toISOString().split('T')[0]);
    };

    const formatDisplayDate = (iso: string) => {
        const [y, m, d] = iso.split('-');
        return `${d}/${m}/${y}`;
    };

    const normalizeCultivoName = (value: string) =>
        value
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .toLowerCase();

    const handleSelectRecommendation = (recommendation: RecomendacionCultivo) => {
        const existingCultivo = cultivos.find(
            (cultivo) =>
                normalizeCultivoName(cultivo.nombre) ===
                normalizeCultivoName(recommendation.cultivo)
        );

        setSelectedRecommendation(recommendation.cultivo);

        if (existingCultivo) {
            setShowNewCultivo(false);
            setSelectedCultivoId(existingCultivo.id);
            return;
        }

        setSelectedCultivoId(null);
        setShowNewCultivo(true);
        setNewCultivoNombre(recommendation.cultivo);
        setNewCultivoDificultad('Media');
        setNewCultivoTemporada(recommendation.temporada_ideal);
        setNewCultivoRiego(recommendation.tecnica_riego);
    };

    const handleGetRecommendations = async () => {
        if (isLoadingRecommendations) return;

        setIsLoadingRecommendations(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    'Permiso de ubicación',
                    'Necesitamos tu ubicación para recomendar cultivos adecuados para el clima de tu zona.'
                );
                return;
            }

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });
            const { latitude, longitude } = location.coords;

            let detectedMunicipio = municipio.trim();
            try {
                const [address] = await Location.reverseGeocodeAsync({
                    latitude,
                    longitude,
                });
                detectedMunicipio =
                    address?.city ||
                    address?.district ||
                    address?.subregion ||
                    address?.region ||
                    detectedMunicipio;
            } catch {
                // Coordinates are enough for the recommendation endpoint.
            }

            if (detectedMunicipio && !municipio.trim()) {
                setMunicipio(detectedMunicipio);
            }

            const result = await huertoService.recomendarCultivos({
                lat: latitude,
                lon: longitude,
                municipio: detectedMunicipio || null,
                huerto_id: null,
            });

            setRecommendationResult(result);
            setSelectedRecommendation(null);

            if (!result.recomendaciones.length) {
                Alert.alert(
                    'Sin recomendaciones',
                    'No se encontraron cultivos recomendados para esta ubicación.'
                );
            }
        } catch (error: any) {
            console.error('[AddHuertoModal] Error recommending crops:', error);
            Alert.alert(
                'No se pudo recomendar',
                error?.message || 'No fue posible obtener recomendaciones para tu ubicación.'
            );
        } finally {
            setIsLoadingRecommendations(false);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => { if (!isSubmitting) onClose(); }}
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
                    <Text style={styles.modalTitle}>Nuevo Huerto</Text>
                    <TouchableOpacity
                        onPress={handleSave}
                        disabled={!isValid() || isSubmitting}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.saveButton, (!isValid() || isSubmitting) && styles.saveButtonDisabled]}>
                            {isSubmitting ? 'Guardando...' : 'Guardar'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <ScrollView
                    style={styles.formScroll}
                    contentContainerStyle={styles.formContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* ── Nombre del Huerto ── */}
                    <FieldLabel text="Nombre del huerto *" />
                    <TextInput
                        style={styles.input}
                        placeholder="Ej. Huerto La Esperanza"
                        placeholderTextColor="#BDBDBD"
                        value={nombre}
                        onChangeText={setNombre}
                    />

                    {/* ── Municipio ── */}
                    <FieldLabel text="Municipio" />
                    <TextInput
                        style={styles.input}
                        placeholder="Ej. Irapuato"
                        placeholderTextColor="#BDBDBD"
                        value={municipio}
                        onChangeText={setMunicipio}
                    />

                    {/* ── Región ── */}
                    <FieldLabel text="Región" />
                    {!showNewRegion ? (
                        <>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                                {regiones.map((r) => (
                                    <SelectableChip
                                        key={r.id}
                                        label={r.nombre}
                                        selected={selectedRegionId === r.id}
                                        onPress={() => setSelectedRegionId(r.id)}
                                    />
                                ))}
                                <TouchableOpacity
                                    style={styles.chipAdd}
                                    onPress={() => { setShowNewRegion(true); setSelectedRegionId(null); }}
                                    activeOpacity={0.7}
                                >
                                    <MaterialCommunityIcons name="plus" size={16} color="#4CAF50" />
                                    <Text style={styles.chipAddText}>Nueva</Text>
                                </TouchableOpacity>
                            </ScrollView>
                        </>
                    ) : (
                        <View style={styles.inlineForm}>
                            <View style={styles.inlineFormHeader}>
                                <Text style={styles.inlineFormTitle}>Crear nueva región</Text>
                                <TouchableOpacity onPress={() => setShowNewRegion(false)}>
                                    <MaterialCommunityIcons name="close-circle" size={20} color="#EF5350" />
                                </TouchableOpacity>
                            </View>
                            <TextInput
                                style={styles.input}
                                placeholder="Nombre de la región"
                                placeholderTextColor="#BDBDBD"
                                value={newRegionNombre}
                                onChangeText={setNewRegionNombre}
                            />
                            <Text style={styles.inlineLabel}>Actividad</Text>
                            <View style={styles.chipsRow}>
                                {ACTIVIDAD_REGION_OPTIONS.map((a) => (
                                    <SelectableChip
                                        key={a}
                                        label={a}
                                        selected={newRegionActividad === a}
                                        onPress={() => setNewRegionActividad(a)}
                                    />
                                ))}
                            </View>
                        </View>
                    )}

                    {/* ── Estado del Huerto ── */}
                    <FieldLabel text="Estado del huerto" />
                    <View style={styles.chipsRow}>
                        {ESTADO_HUERTO_OPTIONS.map((e) => (
                            <SelectableChip
                                key={e}
                                label={e}
                                selected={estado === e}
                                color={ESTADO_COLORS[e].bg}
                                onPress={() => setEstado(e)}
                            />
                        ))}
                    </View>

                    {/* ── Salud ── */}
                    <FieldLabel text={`Salud del huerto: ${salud}%`} />
                    <View style={styles.saludRow}>
                        <TouchableOpacity
                            style={styles.saludBtn}
                            onPress={() => setSalud(String(Math.max(0, (parseInt(salud) || 0) - 5)))}
                        >
                            <MaterialCommunityIcons name="minus" size={20} color="#4CAF50" />
                        </TouchableOpacity>
                        <View style={styles.saludBarBg}>
                            <View
                                style={[
                                    styles.saludBarFill,
                                    {
                                        width: `${Math.min(100, Math.max(0, parseInt(salud) || 0))}%`,
                                        backgroundColor: ESTADO_COLORS[estado].bar,
                                    },
                                ]}
                            />
                        </View>
                        <TouchableOpacity
                            style={styles.saludBtn}
                            onPress={() => setSalud(String(Math.min(100, (parseInt(salud) || 0) + 5)))}
                        >
                            <MaterialCommunityIcons name="plus" size={20} color="#4CAF50" />
                        </TouchableOpacity>
                    </View>

                    {/* ── Separator ── */}
                    <View style={styles.separator} />

                    {/* ── Toggle: Add Siembra ── */}
                    <TouchableOpacity
                        style={styles.toggleRow}
                        onPress={() => setAddSiembra(!addSiembra)}
                        activeOpacity={0.7}
                    >
                        <MaterialCommunityIcons
                            name={addSiembra ? 'checkbox-marked' : 'checkbox-blank-outline'}
                            size={24}
                            color={addSiembra ? '#4CAF50' : '#BDBDBD'}
                        />
                        <Text style={styles.toggleText}>Asociar un cultivo (siembra)</Text>
                    </TouchableOpacity>

                    {addSiembra && (
                        <View style={styles.siembraSection}>
                            <View style={styles.recommendationPrompt}>
                                <View style={styles.recommendationPromptText}>
                                    <Text style={styles.recommendationTitle}>
                                        ¿No sabes qué sembrar?
                                    </Text>
                                    <Text style={styles.recommendationSubtitle}>
                                        Usa tu ubicación y el clima actual para recibir recomendaciones.
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    style={[
                                        styles.recommendationButton,
                                        isLoadingRecommendations && styles.recommendationButtonDisabled,
                                    ]}
                                    onPress={handleGetRecommendations}
                                    disabled={isLoadingRecommendations}
                                    activeOpacity={0.7}
                                >
                                    {isLoadingRecommendations ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <MaterialCommunityIcons
                                            name="map-marker-radius"
                                            size={18}
                                            color="#fff"
                                        />
                                    )}
                                    <Text style={styles.recommendationButtonText}>
                                        {isLoadingRecommendations ? 'Analizando...' : 'Recomendar'}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {recommendationResult && (
                                <View style={styles.recommendationsContainer}>
                                    <View style={styles.climateSummary}>
                                        <MaterialCommunityIcons
                                            name="weather-partly-cloudy"
                                            size={20}
                                            color="#1976D2"
                                        />
                                        <View style={styles.climateSummaryText}>
                                            <Text style={styles.climateCity}>
                                                {recommendationResult.clima.ciudad}
                                            </Text>
                                            <Text style={styles.climateDetails}>
                                                {Math.round(recommendationResult.clima.temp_actual)} °C ·{' '}
                                                {recommendationResult.clima.humedad}% humedad ·{' '}
                                                {recommendationResult.clima.descripcion}
                                            </Text>
                                        </View>
                                    </View>

                                    <Text style={styles.recommendationsHint}>
                                        Selecciona una recomendación:
                                    </Text>

                                    {recommendationResult.recomendaciones.map((recommendation) => {
                                        const isSelected =
                                            selectedRecommendation === recommendation.cultivo;
                                        const confidence = Math.round(
                                            recommendation.confianza <= 1
                                                ? recommendation.confianza * 100
                                                : recommendation.confianza
                                        );

                                        return (
                                            <TouchableOpacity
                                                key={recommendation.cultivo}
                                                style={[
                                                    styles.recommendationCard,
                                                    isSelected && styles.recommendationCardSelected,
                                                ]}
                                                onPress={() =>
                                                    handleSelectRecommendation(recommendation)
                                                }
                                                activeOpacity={0.75}
                                            >
                                                <View style={styles.recommendationCardHeader}>
                                                    <View style={styles.recommendationNameRow}>
                                                        <MaterialCommunityIcons
                                                            name="sprout"
                                                            size={19}
                                                            color="#2E7D32"
                                                        />
                                                        <Text style={styles.recommendationName}>
                                                            {recommendation.cultivo}
                                                        </Text>
                                                    </View>
                                                    <Text style={styles.confidenceBadge}>
                                                        {confidence}%
                                                    </Text>
                                                </View>
                                                <Text style={styles.recommendationReason}>
                                                    {recommendation.justificacion}
                                                </Text>
                                                <Text style={styles.recommendationMeta}>
                                                    {recommendation.temporada_ideal} ·{' '}
                                                    {recommendation.rango_temperatura}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            )}

                            {/* Cultivo selector */}
                            <FieldLabel text="Seleccionar cultivo *" />
                            {!showNewCultivo ? (
                                <>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                                        {cultivos.map((c) => (
                                            <SelectableChip
                                                key={c.id}
                                                label={c.nombre}
                                                selected={selectedCultivoId === c.id}
                                                onPress={() => {
                                                    setSelectedCultivoId(c.id);
                                                    setSelectedRecommendation(null);
                                                }}
                                            />
                                        ))}
                                        <TouchableOpacity
                                            style={styles.chipAdd}
                                            onPress={() => {
                                                setShowNewCultivo(true);
                                                setSelectedCultivoId(null);
                                                setSelectedRecommendation(null);
                                            }}
                                            activeOpacity={0.7}
                                        >
                                            <MaterialCommunityIcons name="plus" size={16} color="#4CAF50" />
                                            <Text style={styles.chipAddText}>Nuevo</Text>
                                        </TouchableOpacity>
                                    </ScrollView>

                                    {/* Show selected cultivo details */}
                                    {selectedCultivoId && (() => {
                                        const c = cultivos.find(x => x.id === selectedCultivoId);
                                        if (!c) return null;
                                        return (
                                            <View style={styles.cultivoDetails}>
                                                <View style={styles.cultivoDetailRow}>
                                                    <MaterialCommunityIcons name="water-outline" size={16} color="#4CAF50" />
                                                    <Text style={styles.cultivoDetailText}>Riego: {c.riego || 'Sin especificar'}</Text>
                                                </View>
                                                <View style={styles.cultivoDetailRow}>
                                                    <MaterialCommunityIcons name="speedometer" size={16} color="#FF9800" />
                                                    <Text style={styles.cultivoDetailText}>Dificultad: {c.dificultad}</Text>
                                                </View>
                                                {c.temporada ? (
                                                    <View style={styles.cultivoDetailRow}>
                                                        <MaterialCommunityIcons name="calendar-range" size={16} color="#2196F3" />
                                                        <Text style={styles.cultivoDetailText}>Temporada: {c.temporada}</Text>
                                                    </View>
                                                ) : null}
                                            </View>
                                        );
                                    })()}
                                </>
                            ) : (
                                <View style={styles.inlineForm}>
                                    <View style={styles.inlineFormHeader}>
                                        <Text style={styles.inlineFormTitle}>Crear nuevo cultivo</Text>
                                        <TouchableOpacity
                                            onPress={() => {
                                                setShowNewCultivo(false);
                                                setSelectedRecommendation(null);
                                            }}
                                        >
                                            <MaterialCommunityIcons name="close-circle" size={20} color="#EF5350" />
                                        </TouchableOpacity>
                                    </View>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Nombre del cultivo"
                                        placeholderTextColor="#BDBDBD"
                                        value={newCultivoNombre}
                                        onChangeText={setNewCultivoNombre}
                                    />
                                    <Text style={styles.inlineLabel}>Dificultad</Text>
                                    <View style={styles.chipsRow}>
                                        {DIFICULTAD_CULTIVO_OPTIONS.map((d) => (
                                            <SelectableChip
                                                key={d}
                                                label={d}
                                                selected={newCultivoDificultad === d}
                                                onPress={() => setNewCultivoDificultad(d)}
                                            />
                                        ))}
                                    </View>
                                    <TextInput
                                        style={[styles.input, { marginTop: 10 }]}
                                        placeholder="Temporada (ej. Primavera-Verano)"
                                        placeholderTextColor="#BDBDBD"
                                        value={newCultivoTemporada}
                                        onChangeText={setNewCultivoTemporada}
                                    />
                                    <TextInput
                                        style={[styles.input, { marginTop: 10 }]}
                                        placeholder="Riego (ej. Cada 2 días por goteo)"
                                        placeholderTextColor="#BDBDBD"
                                        value={newCultivoRiego}
                                        onChangeText={setNewCultivoRiego}
                                    />
                                </View>
                            )}

                            {/* Fecha de siembra */}
                            <FieldLabel text="Fecha de siembra" />
                            <View style={styles.dateRow}>
                                <MaterialCommunityIcons name="calendar" size={20} color="#4CAF50" />
                                <View style={styles.dateAdjuster}>
                                    <TouchableOpacity onPress={() => adjustDate(-1)} style={styles.dateArrow}>
                                        <MaterialCommunityIcons name="chevron-left" size={22} color="#4CAF50" />
                                    </TouchableOpacity>
                                    <Text style={styles.dateText}>{formatDisplayDate(fechaSiembra)}</Text>
                                    <TouchableOpacity onPress={() => adjustDate(1)} style={styles.dateArrow}>
                                        <MaterialCommunityIcons name="chevron-right" size={22} color="#4CAF50" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    )}

                    <View style={{ height: 50 }} />
                </ScrollView>

                {isSubmitting && <SavingLoader />}
            </KeyboardAvoidingView>
        </Modal>
    );
};

// ── Styles ──

const styles = StyleSheet.create({
    modalContainer: { flex: 1, backgroundColor: '#fff' },
    loaderOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(241, 248, 233, 0.94)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    loaderCard: { alignItems: 'center', gap: 12 },
    loaderOrbit: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 3,
        borderColor: '#C8E6C9',
        borderTopColor: '#4CAF50',
    },
    loaderCore: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#E8F5E9',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    loaderTitle: { fontSize: 18, fontWeight: '700', color: '#1B5E20' },
    loaderSubtitle: { fontSize: 14, color: '#66BB6A', textAlign: 'center' },

    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    modalTitle: { fontSize: 18, fontWeight: '700', color: '#1B5E20' },
    saveButton: { fontSize: 16, fontWeight: '700', color: '#4CAF50' },
    saveButtonDisabled: { color: '#C8E6C9' },

    formScroll: { flex: 1 },
    formContent: { padding: 20 },

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
    chipsScroll: { marginBottom: 4 },
    chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
        borderWidth: 1.5,
        borderColor: '#E0E0E0',
        marginRight: 8,
        marginBottom: 6,
    },
    chipSelected: {
        backgroundColor: '#E8F5E9',
        borderColor: '#4CAF50',
    },
    chipText: { fontSize: 13, color: '#616161', fontWeight: '600' },
    chipTextSelected: { color: '#1B5E20' },
    chipAdd: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 9,
        borderRadius: 20,
        backgroundColor: '#F1F8E9',
        borderWidth: 1.5,
        borderColor: '#A5D6A7',
        borderStyle: 'dashed',
        gap: 4,
        marginBottom: 6,
    },
    chipAddText: { fontSize: 13, color: '#4CAF50', fontWeight: '600' },

    // Inline create forms
    inlineForm: {
        backgroundColor: '#F8FFF8',
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: '#C8E6C9',
    },
    inlineFormHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    inlineFormTitle: { fontSize: 14, fontWeight: '700', color: '#2E7D32' },
    inlineLabel: { fontSize: 12, fontWeight: '600', color: '#616161', marginTop: 10, marginBottom: 6 },

    // Estado / Salud
    saludRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    saludBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#E8F5E9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    saludBarBg: {
        flex: 1,
        height: 10,
        backgroundColor: '#E0E0E0',
        borderRadius: 5,
        overflow: 'hidden',
    },
    saludBarFill: {
        height: '100%',
        borderRadius: 5,
    },

    separator: {
        height: 1,
        backgroundColor: '#E0E0E0',
        marginVertical: 20,
    },

    // Toggle row
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 4,
    },
    toggleText: { fontSize: 15, fontWeight: '600', color: '#424242' },

    siembraSection: {
        marginTop: 8,
        paddingLeft: 4,
    },

    // Crop recommendations
    recommendationPrompt: {
        backgroundColor: '#F1F8E9',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#C8E6C9',
        padding: 14,
        marginTop: 8,
        marginBottom: 4,
        gap: 12,
    },
    recommendationPromptText: {
        gap: 3,
    },
    recommendationTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1B5E20',
    },
    recommendationSubtitle: {
        fontSize: 12,
        lineHeight: 17,
        color: '#558B2F',
    },
    recommendationButton: {
        minHeight: 42,
        borderRadius: 12,
        backgroundColor: '#4CAF50',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingHorizontal: 14,
    },
    recommendationButtonDisabled: {
        opacity: 0.7,
    },
    recommendationButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
    recommendationsContainer: {
        marginTop: 12,
        gap: 9,
    },
    climateSummary: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 12,
        borderRadius: 12,
        backgroundColor: '#E3F2FD',
        borderWidth: 1,
        borderColor: '#BBDEFB',
    },
    climateSummaryText: {
        flex: 1,
    },
    climateCity: {
        fontSize: 13,
        fontWeight: '700',
        color: '#0D47A1',
    },
    climateDetails: {
        marginTop: 2,
        fontSize: 12,
        color: '#1565C0',
    },
    recommendationsHint: {
        marginTop: 4,
        fontSize: 12,
        fontWeight: '600',
        color: '#616161',
    },
    recommendationCard: {
        padding: 12,
        borderRadius: 12,
        backgroundColor: '#FAFAFA',
        borderWidth: 1.5,
        borderColor: '#E0E0E0',
    },
    recommendationCardSelected: {
        backgroundColor: '#E8F5E9',
        borderColor: '#4CAF50',
    },
    recommendationCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    recommendationNameRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
    },
    recommendationName: {
        flex: 1,
        fontSize: 14,
        fontWeight: '700',
        color: '#1B5E20',
    },
    confidenceBadge: {
        fontSize: 12,
        fontWeight: '700',
        color: '#2E7D32',
        backgroundColor: '#DCEDC8',
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    recommendationReason: {
        marginTop: 7,
        fontSize: 12,
        lineHeight: 17,
        color: '#424242',
    },
    recommendationMeta: {
        marginTop: 6,
        fontSize: 11,
        fontWeight: '600',
        color: '#558B2F',
    },

    // Cultivo details card
    cultivoDetails: {
        backgroundColor: '#F1F8E9',
        borderRadius: 10,
        padding: 12,
        marginTop: 8,
        gap: 6,
    },
    cultivoDetailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    cultivoDetailText: { fontSize: 13, color: '#424242' },

    // Date selector
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    dateAdjuster: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        paddingVertical: 6,
    },
    dateArrow: { paddingHorizontal: 10, paddingVertical: 4 },
    dateText: {
        flex: 1,
        textAlign: 'center',
        fontSize: 15,
        fontWeight: '600',
        color: '#1B5E20',
    },
});

export default AddHuertoModal;
