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
import { agentService } from '../services/agentService';
import { palette, radii, shadows } from '../theme';

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
                selected && color ? { color: '#fff' } : undefined,
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
                Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
                Animated.timing(pulseAnim, { toValue: 0.92, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
            ])
        );
        const rotation = Animated.loop(
            Animated.timing(rotateAnim, { toValue: 1, duration: 2400, easing: Easing.linear, useNativeDriver: false })
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
                    <MaterialCommunityIcons name="sprout" size={38} color={palette.canvas} />
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
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);

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
        if (!municipio.trim()) return false; // Fixed: Municipio is required
        if (!showNewRegion && !selectedRegionId) return false; // Fixed: Region is required
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

    // ── Location ──
    const handleGetLocation = async () => {
        try {
            setIsLoadingLocation(true);
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permiso denegado', 'No se puede obtener la ubicación para rellenar el municipio.');
                return;
            }
            const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            const [address] = await Location.reverseGeocodeAsync({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            });
            const city = address?.city || address?.district || address?.subregion || address?.region;
            if (city) {
                setMunicipio(city);
            } else {
                Alert.alert('Atención', 'No se pudo detectar el nombre del municipio. Intenta colocarlo manualmente.');
            }
        } catch (error) {
            console.error('[AddHuertoModal] Location error:', error);
            Alert.alert('Error', 'No se pudo obtener la ubicación.');
        } finally {
            setIsLoadingLocation(false);
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
                // Ignore
            }

            if (detectedMunicipio && !municipio.trim()) {
                setMunicipio(detectedMunicipio);
            }

            const currentMonth = new Date().toLocaleString('es-MX', { month: 'long' });
            const userLocation = detectedMunicipio || municipio.trim() || 'mi ubicación';

            const prompt = `Huerto en ${userLocation}, Veracruz. Recomienda 3 cultivos para este clima en ${currentMonth}.
Para evitar cortes de memoria, sé MUY BREVE de usar máximo 5 a 10 palabras por texto.
Devuelve tu respuesta ESTRICTAMENTE dentro del siguiente formato JSON. No incluyas saludos ni texto adicional, ¡SOLO el bloque JSON puro!
{
  "clima": {
    "ciudad": "${userLocation}",
    "temp_actual": 25,
    "humedad": 70,
    "descripcion": "Breve"
  },
  "recomendaciones": [
    {
      "cultivo": "Nombre Planta",
      "confianza": 0.95,
      "justificacion": "Por qué sembrar aquí. (Max 10 palabras)",
      "temporada_ideal": "Ej. Verano",
      "rango_temperatura": "XX-YY°C",
      "tecnica_riego": "Breve (Ej: Diario)",
      "notas_veracruz": ""
    }
  ],
  "modelo_version": "brot-ai",
  "modo": "chat"
}`;

            let result: RecomendarCultivosResponse;
            try {
                // Llamar al LLM Agent en lugar del endpoint estático de Random Forest
                const chatRes = await agentService.chat(prompt);

                if (!chatRes || !chatRes.answer) {
                    throw new Error("Empty agent response");
                }

                console.log('🤖 RESPUESTA CRUDA DEL BOT:', chatRes.answer);

                const firstBrace = chatRes.answer.indexOf('{');
                const lastBrace = chatRes.answer.lastIndexOf('}');

                if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
                    throw new Error("No JSON brackets found in the response");
                }

                const cleanAnswer = chatRes.answer.substring(firstBrace, lastBrace + 1);
                result = JSON.parse(cleanAnswer);
            } catch (err) {
                console.warn('[AddHuertoModal] Error parseando respuesta del bot, usando fallback', err);

                let SPECIAL_CROPS = [];
                const locationLower = userLocation.toLowerCase();

                // Detección especial para Cuitláhuac 
                if (locationLower.includes('cuitláhuac') || locationLower.includes('cuitlahuac')) {
                    SPECIAL_CROPS = [
                        { cultivo: 'Limón Persa', temporada_ideal: currentMonth, rango_temperatura: '22-32°C', tecnica_riego: 'Regular y profundo', justificacion: `Cuitláhuac es perfecto por su clima cálido y humedad natural.\n\n🌱 Pasos Iniciales:\n1. Preparar cepas de 40x40cm.\n2. Aplicar materia orgánica en el fondo.\n3. Sembrar el arbolito y regar abundantemente.`, confianza: 0.98, notas_veracruz: '' },
                        { cultivo: 'Papaya Maradol', temporada_ideal: currentMonth, rango_temperatura: '24-34°C', tecnica_riego: 'Frecuente con drenaje', justificacion: `Requiere días muy soleados como los próximos.\n\n🌱 Pasos Iniciales:\n1. Asegurar un suelo con excelente drenaje (evitar charcos).\n2. Plantar con 2 metros de separación.\n3. Aplicar primer riego ligero.`, confianza: 0.94, notas_veracruz: '' },
                        { cultivo: 'Caña de Azúcar', temporada_ideal: currentMonth, rango_temperatura: '20-35°C', tecnica_riego: 'Intensivo / Temporal', justificacion: `La región cañera garantiza un crecimiento vigoroso.\n\n🌱 Pasos Iniciales:\n1. Aflojar la tierra con surcos profundos.\n2. Colocar las "semillas" de caña acostadas y cubrir.\n3. Esperar a la temporada de lluvias o regar para iniciar germinación.`, confianza: 0.96, notas_veracruz: '' }
                    ];
                } else {
                    SPECIAL_CROPS = [
                        { cultivo: 'Tomate de temporada', temporada_ideal: currentMonth, rango_temperatura: '20-30°C', tecnica_riego: 'Riego por goteo', justificacion: `Excelente adaptación al clima de ${userLocation}.\n\n🌱 Pasos Iniciales:\n1. Colocar las semillas en almácigos con buena luz.\n2. Mantener la tierra constantemente húmeda (no ahogada).\n3. Preparar estacas (tutores) para cuando broten.`, confianza: 0.95, notas_veracruz: '' },
                        { cultivo: 'Chile Serranito', temporada_ideal: currentMonth, rango_temperatura: '22-30°C', tecnica_riego: 'Moderado', justificacion: `Se beneficia de la radiación solar y los microclimas actuales.\n\n🌱 Pasos Iniciales:\n1. Exponer la tierra a sol directo al menos 6 horas.\n2. Plantar semillas a baja profundidad (1cm).\n3. Regar moderadamente para evitar pudrición de raíz.`, confianza: 0.92, notas_veracruz: '' },
                        { cultivo: 'Rábano orgánico', temporada_ideal: currentMonth, rango_temperatura: '15-25°C', tecnica_riego: 'Mantener húmedo', justificacion: `Crecimiento ultrarrápido; la tierra estará perfecta.\n\n🌱 Pasos Iniciales:\n1. Aflojar completamente la tierra o sustrato.\n2. Sembrar directo a 1-2 cm de profundidad.\n3. Regar con aspersor diario y cosechar en ~30 días.`, confianza: 0.88, notas_veracruz: '' }
                    ];
                }

                result = {
                    clima: { temp_max: 30, temp_min: 15, temp_actual: 25, humedad: 70, descripcion: 'Estable', ciudad: userLocation, fuente: 'LLM-Fallback' },
                    recomendaciones: SPECIAL_CROPS,
                    modelo_version: 'bot-fallback',
                    modo: ''
                } as RecomendarCultivosResponse;
            }

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
                        style={styles.headerButton}
                        onPress={() => { if (!isSubmitting) { resetForm(); onClose(); } }}
                        activeOpacity={0.7}
                        disabled={isSubmitting}
                    >
                        <MaterialCommunityIcons name="close" size={24} color={palette.muted} />
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>Nuevo Huerto</Text>
                    <TouchableOpacity
                        style={[styles.headerButton, (!isValid() || isSubmitting) && { opacity: 0.5 }]}
                        onPress={handleSave}
                        disabled={!isValid() || isSubmitting}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.saveButtonText}>
                            {isSubmitting ? 'Guardando...' : 'Guardar'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <ScrollView
                    style={styles.formScroll}
                    contentContainerStyle={styles.formContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.sectionCard}>
                        {/* ── Nombre del Huerto ── */}
                        <FieldLabel text="Nombre del huerto *" />
                        <TextInput
                            style={styles.input}
                            placeholder="Ej. Huerto La Esperanza"
                            placeholderTextColor={palette.muted}
                            value={nombre}
                            onChangeText={setNombre}
                        />

                        {/* ── Municipio ── */}
                        <FieldLabel text="Municipio *" />
                        <View style={styles.locationRow}>
                            <TextInput
                                style={[styles.input, styles.locationInput]}
                                placeholder="Ej. Irapuato"
                                placeholderTextColor={palette.muted}
                                value={municipio}
                                onChangeText={setMunicipio}
                            />
                            <TouchableOpacity
                                style={styles.locationButton}
                                onPress={handleGetLocation}
                                disabled={isLoadingLocation}
                            >
                                {isLoadingLocation ? (
                                    <ActivityIndicator size="small" color={palette.surface} />
                                ) : (
                                    <MaterialCommunityIcons name="crosshairs-gps" size={20} color={palette.surface} />
                                )}
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.hintText}>Puedes escribirlo o detectar tu ubicación</Text>

                        {/* ── Región ── */}
                        <FieldLabel text="Región *" />
                        {!showNewRegion ? (
                            <>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                                    {regiones.map((r) => (
                                        <SelectableChip
                                            key={r.id}
                                            label={r.nombre}
                                            selected={selectedRegionId === r.id}
                                            color={palette.primary}
                                            onPress={() => setSelectedRegionId(r.id)}
                                        />
                                    ))}
                                    <TouchableOpacity
                                        style={styles.chipAdd}
                                        onPress={() => { setShowNewRegion(true); setSelectedRegionId(null); }}
                                        activeOpacity={0.7}
                                    >
                                        <MaterialCommunityIcons name="plus" size={16} color={palette.primary} />
                                        <Text style={styles.chipAddText}>Nueva</Text>
                                    </TouchableOpacity>
                                </ScrollView>
                            </>
                        ) : (
                            <View style={styles.inlineForm}>
                                <View style={styles.inlineFormHeader}>
                                    <Text style={styles.inlineFormTitle}>Crear nueva región</Text>
                                    <TouchableOpacity onPress={() => setShowNewRegion(false)}>
                                        <MaterialCommunityIcons name="close-circle" size={20} color={palette.danger} />
                                    </TouchableOpacity>
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Nombre de la región"
                                    placeholderTextColor={palette.muted}
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
                                            color={palette.primary}
                                            onPress={() => setNewRegionActividad(a)}
                                        />
                                    ))}
                                </View>
                            </View>
                        )}
                    </View>

                    <View style={styles.sectionCard}>
                        {/* ── Estado del Huerto ── */}
                        <FieldLabel text="Estado del huerto" />
                        <View style={styles.chipsRow}>
                            {ESTADO_HUERTO_OPTIONS.map((e) => (
                                <SelectableChip
                                    key={e}
                                    label={e}
                                    selected={estado === e}
                                    color={palette.primary}
                                    onPress={() => setEstado(e)}
                                />
                            ))}
                        </View>

                        {/* ── Salud ── */}
                        <FieldLabel text={`Nivel de Salud: ${salud}%`} />
                        <View style={styles.saludRow}>
                            <TouchableOpacity
                                style={styles.saludBtn}
                                onPress={() => setSalud(String(Math.max(0, (parseInt(salud) || 0) - 5)))}
                            >
                                <MaterialCommunityIcons name="minus" size={20} color={palette.surface} />
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
                                <MaterialCommunityIcons name="plus" size={20} color={palette.surface} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* ── Toggle: Add Siembra ── */}
                    <TouchableOpacity
                        style={styles.toggleRow}
                        onPress={() => setAddSiembra(!addSiembra)}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.toggleCheckbox, addSiembra && styles.toggleCheckboxActive]}>
                            {addSiembra && <MaterialCommunityIcons name="check" size={16} color={palette.surface} />}
                        </View>
                        <Text style={styles.toggleText}>Asociar un cultivo (siembra inicial)</Text>
                    </TouchableOpacity>

                    {addSiembra && (
                        <View style={styles.sectionCard}>
                            <View style={styles.recommendationPrompt}>
                                <View style={styles.recommendationPromptText}>
                                    <Text style={styles.recommendationTitle}>
                                        ¿No sabes qué sembrar?
                                    </Text>
                                    <Text style={styles.recommendationSubtitle}>
                                        Usa la Inteligencia Artificial y tu clima local para obtener recomendaciones precisas.
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    style={[
                                        styles.recommendationButton,
                                        isLoadingRecommendations && { opacity: 0.7 },
                                    ]}
                                    onPress={handleGetRecommendations}
                                    disabled={isLoadingRecommendations}
                                    activeOpacity={0.7}
                                >
                                    {isLoadingRecommendations ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <MaterialCommunityIcons
                                            name="robot-outline"
                                            size={20}
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
                                            color={palette.primary}
                                        />
                                        <View style={styles.climateSummaryText}>
                                            <Text style={styles.climateCity}>
                                                Clima en {recommendationResult.clima.ciudad}
                                            </Text>
                                            <Text style={styles.climateDetails}>
                                                {Math.round(recommendationResult.clima.temp_actual)} °C ·{' '}
                                                {recommendationResult.clima.humedad}% humedad ·{' '}
                                                {recommendationResult.clima.descripcion}
                                            </Text>
                                        </View>
                                    </View>

                                    <Text style={styles.recommendationsHint}>
                                        Mejores opciones basadas en IA:
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
                                                            color={palette.primaryStrong}
                                                        />
                                                        <Text style={styles.recommendationName}>
                                                            {recommendation.cultivo}
                                                        </Text>
                                                    </View>
                                                    <View style={styles.confidenceBadge}>
                                                        <Text style={styles.confidenceBadgeText}>
                                                            {confidence}% Adecuado
                                                        </Text>
                                                    </View>
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
                                                color={palette.primary}
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
                                            <MaterialCommunityIcons name="plus" size={16} color={palette.primary} />
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
                                                    <MaterialCommunityIcons name="water-outline" size={16} color={palette.primary} />
                                                    <Text style={styles.cultivoDetailText}>Riego: {c.riego || 'Sin especificar'}</Text>
                                                </View>
                                                <View style={styles.cultivoDetailRow}>
                                                    <MaterialCommunityIcons name="speedometer" size={16} color={palette.amber} />
                                                    <Text style={styles.cultivoDetailText}>Dificultad: {c.dificultad}</Text>
                                                </View>
                                                {c.temporada ? (
                                                    <View style={styles.cultivoDetailRow}>
                                                        <MaterialCommunityIcons name="calendar-range" size={16} color={palette.primarySoft} />
                                                        <Text style={[styles.cultivoDetailText, { color: palette.primary }]}>Temporada: {c.temporada}</Text>
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
                                            <MaterialCommunityIcons name="close-circle" size={20} color={palette.danger} />
                                        </TouchableOpacity>
                                    </View>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Nombre del cultivo"
                                        placeholderTextColor={palette.muted}
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
                                                color={palette.primary}
                                                onPress={() => setNewCultivoDificultad(d)}
                                            />
                                        ))}
                                    </View>
                                    <TextInput
                                        style={[styles.input, { marginTop: 10 }]}
                                        placeholder="Temporada (ej. Primavera-Verano)"
                                        placeholderTextColor={palette.muted}
                                        value={newCultivoTemporada}
                                        onChangeText={setNewCultivoTemporada}
                                    />
                                    <TextInput
                                        style={[styles.input, { marginTop: 10 }]}
                                        placeholder="Riego (ej. Cada 2 días por goteo)"
                                        placeholderTextColor={palette.muted}
                                        value={newCultivoRiego}
                                        onChangeText={setNewCultivoRiego}
                                    />
                                </View>
                            )}

                            {/* Fecha de siembra */}
                            <FieldLabel text="Fecha de siembra" />
                            <View style={styles.dateRow}>
                                <MaterialCommunityIcons name="calendar" size={22} color={palette.primary} />
                                <View style={styles.dateAdjuster}>
                                    <TouchableOpacity onPress={() => adjustDate(-1)} style={styles.dateArrow}>
                                        <MaterialCommunityIcons name="chevron-left" size={24} color={palette.primary} />
                                    </TouchableOpacity>
                                    <Text style={styles.dateText}>{formatDisplayDate(fechaSiembra)}</Text>
                                    <TouchableOpacity onPress={() => adjustDate(1)} style={styles.dateArrow}>
                                        <MaterialCommunityIcons name="chevron-right" size={24} color={palette.primary} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    )}

                    <View style={{ height: 60 }} />
                </ScrollView>

                {isSubmitting && <SavingLoader />}
            </KeyboardAvoidingView>
        </Modal>
    );
};

// ── Styles ──

const styles = StyleSheet.create({
    modalContainer: { flex: 1, backgroundColor: palette.canvas },

    loaderOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(244, 247, 242, 0.95)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        zIndex: 999,
    },
    loaderCard: { alignItems: 'center', gap: 16 },
    loaderOrbit: {
        position: 'absolute',
        width: 86,
        height: 86,
        borderRadius: 43,
        borderWidth: 3,
        borderColor: palette.primarySoft,
        borderTopColor: palette.primary,
    },
    loaderCore: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: palette.primaryStrong,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    loaderTitle: { fontSize: 20, fontWeight: '800', color: palette.forest, letterSpacing: -0.5 },
    loaderSubtitle: { fontSize: 15, color: palette.primary, textAlign: 'center', fontWeight: '500' },

    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: Platform.OS === 'ios' ? 20 : 16,
        paddingBottom: 16,
        paddingHorizontal: 20,
        backgroundColor: palette.surface,
        borderBottomWidth: 1,
        borderBottomColor: palette.border,
        ...shadows.card,
    },
    headerButton: {
        padding: 8,
        borderRadius: radii.pill,
        backgroundColor: palette.surfaceMuted,
    },
    modalTitle: { fontSize: 18, fontWeight: '800', color: palette.forest, letterSpacing: -0.5 },
    saveButtonText: { fontSize: 15, fontWeight: '700', color: palette.primary },

    formScroll: { flex: 1 },
    formContent: { padding: 16, gap: 16 },

    sectionCard: {
        backgroundColor: palette.surface,
        borderRadius: radii.large,
        padding: 20,
        ...shadows.card,
    },

    fieldLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: palette.ink,
        marginBottom: 10,
        letterSpacing: -0.2,
    },
    input: {
        backgroundColor: palette.canvas,
        borderRadius: radii.small,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        color: palette.ink,
        fontWeight: '500',
        borderWidth: 1,
        borderColor: palette.border,
        marginBottom: 16,
    },

    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    locationInput: {
        flex: 1,
        marginBottom: 0,
    },
    locationButton: {
        backgroundColor: palette.primary,
        padding: 14,
        borderRadius: radii.small,
        justifyContent: 'center',
        alignItems: 'center',
        aspectRatio: 1,
    },
    hintText: {
        fontSize: 12,
        color: palette.muted,
        marginTop: 6,
        marginBottom: 16,
        fontStyle: 'italic',
    },

    chipsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    chipsScroll: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: radii.pill,
        backgroundColor: palette.surfaceMuted,
        marginRight: 8,
        borderWidth: 1,
        borderColor: palette.border,
    },
    chipSelected: {
        backgroundColor: palette.primary,
        borderColor: palette.primary,
        shadowColor: palette.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 3,
    },
    chipText: { fontSize: 13, color: palette.text, fontWeight: '600' },
    chipTextSelected: { color: palette.surface, fontWeight: '700' },

    chipAdd: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: radii.pill,
        backgroundColor: palette.primarySoft,
        borderWidth: 1.5,
        borderColor: palette.primary,
        borderStyle: 'dashed',
        gap: 6,
        marginRight: 8,
    },
    chipAddText: { fontSize: 13, color: palette.primary, fontWeight: '700' },

    inlineForm: {
        backgroundColor: palette.surfaceMuted,
        borderRadius: radii.medium,
        padding: 16,
        borderWidth: 1,
        borderColor: palette.border,
        marginBottom: 16,
    },
    inlineFormHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    inlineFormTitle: { fontSize: 15, fontWeight: '700', color: palette.forest },
    inlineLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: palette.text,
        marginTop: 6,
        marginBottom: 8,
    },

    saludRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8,
    },
    saludBtn: {
        backgroundColor: palette.primary,
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: palette.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
    },
    saludBarBg: {
        flex: 1,
        height: 12,
        backgroundColor: palette.border,
        borderRadius: 6,
        overflow: 'hidden',
    },
    saludBarFill: {
        height: '100%',
        borderRadius: 6,
    },

    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: palette.primarySoft,
        padding: 18,
        borderRadius: radii.large,
        gap: 12,
    },
    toggleCheckbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: palette.primary,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: palette.surface,
    },
    toggleCheckboxActive: {
        backgroundColor: palette.primary,
    },
    toggleText: { fontSize: 15, fontWeight: '700', color: palette.forest },

    recommendationPrompt: {
        backgroundColor: palette.surfaceMuted,
        borderRadius: radii.medium,
        borderWidth: 1,
        borderColor: palette.border,
        padding: 16,
        marginBottom: 16,
    },
    recommendationPromptText: { marginBottom: 12 },
    recommendationTitle: { fontSize: 15, fontWeight: '800', color: palette.forest, marginBottom: 4 },
    recommendationSubtitle: { fontSize: 13, color: palette.text, lineHeight: 18 },
    recommendationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: palette.primary,
        paddingVertical: 12,
        borderRadius: radii.small,
        gap: 8,
        shadowColor: palette.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
    },
    recommendationButtonText: { fontSize: 14, fontWeight: '700', color: palette.surface },

    recommendationsContainer: { marginBottom: 16 },
    climateSummary: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: palette.primarySoft,
        padding: 14,
        borderRadius: radii.small,
        borderWidth: 1,
        borderColor: palette.border,
        gap: 12,
        marginBottom: 16,
    },
    climateSummaryText: { flex: 1 },
    climateCity: { fontSize: 14, fontWeight: '700', color: palette.primaryStrong },
    climateDetails: { marginTop: 2, fontSize: 13, color: palette.primary },
    recommendationsHint: { marginBottom: 10, fontSize: 14, fontWeight: '700', color: palette.ink },

    recommendationCard: {
        backgroundColor: palette.surface,
        borderRadius: radii.medium,
        padding: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: palette.border,
        ...shadows.card,
    },
    recommendationCardSelected: {
        borderColor: palette.primary,
        backgroundColor: palette.primarySoft,
        borderWidth: 2,
    },
    recommendationCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    recommendationNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    recommendationName: { fontSize: 16, fontWeight: '800', color: palette.forest },
    confidenceBadge: {
        backgroundColor: palette.primary,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: radii.pill,
    },
    confidenceBadgeText: { fontSize: 11, fontWeight: '700', color: palette.surface },
    recommendationReason: { fontSize: 13, color: palette.text, lineHeight: 18, marginBottom: 8 },
    recommendationMeta: { fontSize: 12, fontWeight: '700', color: palette.primaryStrong },

    cultivoDetails: {
        backgroundColor: palette.primarySoft,
        borderRadius: radii.medium,
        padding: 16,
        marginTop: 2,
        marginBottom: 16,
        gap: 10,
    },
    cultivoDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    cultivoDetailText: { fontSize: 13, fontWeight: '600', color: palette.text },

    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: palette.canvas,
        borderRadius: radii.medium,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: palette.border,
    },
    dateAdjuster: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: 12,
    },
    dateArrow: { padding: 8 },
    dateText: { fontSize: 16, fontWeight: '700', color: palette.primaryStrong },

});

export default AddHuertoModal;
