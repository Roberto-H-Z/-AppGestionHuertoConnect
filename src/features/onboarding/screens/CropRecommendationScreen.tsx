import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Animated,
    SafeAreaView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '../../../shared/components/ui';
import { perfilAgricultorService } from '../services/perfilAgricultorService';
import { aiModelService, CultivoRecomendado } from '../../main/services/aiModelService';
import { OnboardingProgressBar } from '../components/OnboardingProgressBar';

export const CropRecommendationScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
    const route = useRoute<any>();
    const { perfil, area_cultivo, ubicacion, acceso_agua, lat, lon } = route.params || {};

    const [isLoading, setIsLoading] = useState(true);
    const [recommendations, setRecommendations] = useState<CultivoRecomendado[]>([]);
    const [selectedCrop, setSelectedCrop] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Animaciones
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const contentSlide = useRef(new Animated.Value(50)).current;

    const fetchRecommendations = async () => {
        setIsLoading(true);
        try {
            const data = await aiModelService.recommendGarden({
                lat: lat || 19.1738,
                lon: lon || -96.1342,
            });
            setRecommendations(data.recomendaciones || data.cultivos || data.predicciones || []);
        } catch (error: any) {
            console.error('Error al obtener recomendaciones (posible 401 por bypass de login):', error?.response?.data || error);
            // Fallback de demostración 
            setRecommendations([
                { cultivo: 'Tomate Cherry', confianza: 0.95, justificacion: 'Ideal para tu tamaño de huerto y clima cálido.', temporada_ideal: 'Primavera', rango_temperatura: '20-30°C', tecnica_riego: 'Por goteo', notas_veracruz: '' },
                { cultivo: 'Lechuga', confianza: 0.88, justificacion: 'Crece rápido en espacios pequeños y necesita poca luz directa.', temporada_ideal: 'Otoño', rango_temperatura: '15-25°C', tecnica_riego: 'Frecuente', notas_veracruz: '' },
                { cultivo: 'Cilantro', confianza: 0.75, justificacion: 'Excelente acompañante para tus tomates y de bajo mantenimiento.', temporada_ideal: 'Todo el año', rango_temperatura: '18-28°C', tecnica_riego: 'Moderado', notas_veracruz: '' }
            ]);
            Alert.alert('Modo Offline/Demo', 'No se pudo conectar a la IA. Mostrando recomendaciones estándar.');
        } finally {
            setIsLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fadeAnim.setValue(0);
            slideAnim.setValue(30);
            contentSlide.setValue(50);

            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: false }),
                Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: false }),
                Animated.timing(contentSlide, { toValue: 0, duration: 1000, delay: 200, useNativeDriver: false }),
            ]).start();
        }, [fadeAnim, slideAnim, contentSlide])
    );

    useEffect(() => {
        fetchRecommendations();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleFinish = async () => {
        if (!selectedCrop) return;
        setIsSaving(true);
        try {
            await perfilAgricultorService.createProfile({
                perfil: perfil,
                area_cultivo: area_cultivo || "0 m²",
                ubicacion: ubicacion || "",
                acceso_agua: acceso_agua || ""
            });
            navigation?.replace('Main');
        } catch (error: any) {
            console.error('Error al guardar perfil final:', error?.response?.data || error);
            // Continuar incluso si falla, para que el Demo Flow termine
            navigation?.replace('Main');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />
            <OnboardingProgressBar currentStep={4} totalSteps={4} />

            {/* Header en línea */}
            <Animated.View style={[styles.headerContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                <TouchableOpacity style={styles.backButtonInline} onPress={() => navigation?.goBack()} activeOpacity={0.7}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.title}>¿Qué cultivarás hoy?</Text>
            </Animated.View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <Animated.View style={[styles.contentContainer, { opacity: fadeAnim, transform: [{ translateY: contentSlide }] }]}>
                    <Text style={styles.subtitle}>
                        Basado en tu entorno, clima actual y experiencia, Brot 🌱 sugiere estos cultivos ideales para empezar:
                    </Text>

                    {isLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#059669" />
                            <Text style={styles.loadingText}>Analizando tu entorno con IA...</Text>
                        </View>
                    ) : recommendations.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <MaterialCommunityIcons name="cloud-off-outline" size={48} color="#9CA3AF" />
                            <Text style={styles.emptyText}>No hay recomendaciones disponibles por ahora.</Text>
                        </View>
                    ) : (
                        recommendations.map((rec, index) => {
                            const name = rec.cultivo || rec.nombre || rec.crop || 'Desconocido';
                            const isSelected = selectedCrop === name;
                            return (
                                <TouchableOpacity
                                    key={index}
                                    style={[styles.cropCard, isSelected && styles.cropCardSelected]}
                                    onPress={() => setSelectedCrop(name)}
                                    activeOpacity={0.8}
                                >
                                    <View style={[styles.iconContainer, isSelected && styles.iconContainerSelected]}>
                                        <MaterialCommunityIcons name="sprout" size={28} color={isSelected ? '#fff' : '#059669'} />
                                    </View>
                                    <View style={styles.textContent}>
                                        <Text style={[styles.cropName, isSelected && styles.cropNameSelected]}>
                                            {name.charAt(0).toUpperCase() + name.slice(1)}
                                        </Text>
                                        <Text style={styles.cropJustification} numberOfLines={2}>
                                            {rec.justificacion || rec.descripcion || `Ideal para la temporada de ${rec.temporada_ideal}`}
                                        </Text>

                                        <View style={styles.tagsRow}>
                                            <View style={styles.tag}>
                                                <MaterialCommunityIcons name="thermometer" size={14} color="#059669" />
                                                <Text style={styles.tagText}>{rec.rango_temperatura || '20-30°C'}</Text>
                                            </View>
                                            <View style={styles.tag}>
                                                <MaterialCommunityIcons name="water" size={14} color="#3B82F6" />
                                                <Text style={styles.tagText}>{rec.tecnica_riego || 'Riego regular'}</Text>
                                            </View>
                                        </View>
                                    </View>
                                    {isSelected && (
                                        <MaterialCommunityIcons name="check-circle" size={24} color="#059669" style={styles.checkIcon} />
                                    )}
                                </TouchableOpacity>
                            );
                        })
                    )}
                </Animated.View>
            </ScrollView>

            <Animated.View style={[styles.buttonContainer, { opacity: fadeAnim }]}>
                <Button
                    title={isSaving ? "Guardando Perfil..." : "¡Empezar a Cultivar!"}
                    onPress={handleFinish}
                    disabled={!selectedCrop || isSaving}
                    style={styles.finishButton}
                />
            </Animated.View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FAFAFA' },
    scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
    headerContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 24, marginBottom: 20 },
    backButtonInline: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, marginRight: 16 },
    title: { fontSize: 24, fontWeight: '800', color: '#111827', lineHeight: 32, flex: 1 },
    contentContainer: { flex: 1 },
    subtitle: { fontSize: 14, color: '#6B7280', marginBottom: 20, lineHeight: 20 },
    loadingContainer: { alignItems: 'center', justifyContent: 'center', padding: 40, marginTop: 40 },
    loadingText: { marginTop: 16, fontSize: 16, color: '#6B7280', fontWeight: '500' },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: 40, marginTop: 40 },
    emptyText: { marginTop: 16, fontSize: 15, color: '#6B7280', textAlign: 'center' },
    cropCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 2, borderColor: '#F3F4F6', alignItems: 'center' },
    cropCardSelected: { borderColor: '#059669', backgroundColor: '#ECFDF5' },
    iconContainer: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#FAFAFA', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    iconContainerSelected: { backgroundColor: '#059669' },
    textContent: { flex: 1 },
    cropName: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
    cropNameSelected: { color: '#059669' },
    cropJustification: { fontSize: 13, color: '#6B7280', marginBottom: 8, lineHeight: 18 },
    tagsRow: { flexDirection: 'row', gap: 8 },
    tag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 4 },
    tagText: { fontSize: 11, fontWeight: '600', color: '#4B5563' },
    checkIcon: { marginLeft: 12 },
    buttonContainer: { paddingHorizontal: 24, paddingBottom: 24, paddingTop: 16, backgroundColor: '#FAFAFA' },
    finishButton: { width: '100%' },
});

export default CropRecommendationScreen;
