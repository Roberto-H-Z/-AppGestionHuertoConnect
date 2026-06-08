/**
 * AIChatScreen — Asistente IA de HuertoConnect
 *
 * 3 modos:
 *   🤖 Asistente   → Texto libre con respuestas inteligentes
 *   🌽 Cultivos IA → POST /huertos/recomendar (Random Forest + Clima real)
 *   🐛 Detectar    → POST /plagas/detectar (YOLOv8 Visión Artificial)
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Animated,
    Easing,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
    Alert,
    ActivityIndicator,
    Modal,
    Image,
    SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { chatbotService, ConversacionOut, MensajeOut } from '../services/chatbotService';
import { aiModelService, CultivoRecomendado, PlagaDetectada } from '../services/aiModelService';
import { geocodeMunicipio } from '../services/geocodingService';
import { AppScreenHeader } from '../components';
import { palette, radii, shadows } from '../theme';

const { width } = Dimensions.get('window');

// ── Formatear hora en timezone del dispositivo ────────────────────────
const formatTime = (date: Date): string => {
    try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        return new Intl.DateTimeFormat('es-MX', {
            hour: '2-digit', minute: '2-digit', hour12: true, timeZone: tz,
        }).format(date);
    } catch {
        const h = date.getHours();
        const m = date.getMinutes().toString().padStart(2, '0');
        return `${h % 12 || 12}:${m} ${h >= 12 ? 'PM' : 'AM'}`;
    }
};

// ── Mapeo de códigos WMO a iconos y colores ───────────────────────────
const getWeatherInfo = (code: number): { condition: string; icon: string; color: string } => {
    if (code === 0 || code === 1) return { condition: 'Despejado', icon: 'weather-sunny', color: '#FFB300' };
    if (code <= 3)  return { condition: 'Nublado', icon: 'weather-partly-cloudy', color: '#78909C' };
    if (code <= 48) return { condition: 'Niebla', icon: 'weather-fog', color: '#90A4AE' };
    if (code <= 55) return { condition: 'Llovizna', icon: 'weather-partly-rainy', color: '#42A5F5' };
    if (code <= 65) return { condition: 'Lluvia', icon: 'weather-rainy', color: '#1E88E5' };
    if (code <= 82) return { condition: 'Chubascos', icon: 'weather-pouring', color: '#1565C0' };
    if (code <= 99) return { condition: 'Tormenta', icon: 'weather-lightning', color: '#6A1B9A' };
    return { condition: 'Nublado', icon: 'weather-cloudy', color: '#78909C' };
};

// ── Obtener clima actual de Open-Meteo (sin API key) ──────────────────
const fetchCurrentWeather = async (lat: number, lon: number): Promise<WeatherInfo | null> => {
    try {
        const url =
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
            `&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,precipitation` +
            `&timezone=auto&forecast_days=1`;
        const res = await fetch(url);
        if (!res.ok) return null;
        const data = await res.json();
        const c = data.current;
        const info = getWeatherInfo(c.weather_code ?? 0);
        return {
            temperature: Math.round(c.temperature_2m ?? 0),
            humidity: Math.round(c.relative_humidity_2m ?? 0),
            windSpeed: Math.round(c.wind_speed_10m ?? 0),
            precipitation: c.precipitation ?? 0,
            weatherCode: c.weather_code ?? 0,
            condition: info.condition,
            icon: info.icon,
            iconColor: info.color,
        };
    } catch {
        return null;
    }
};

// ══════════════════════════════════════════════════════
//  TIPOS
// ══════════════════════════════════════════════════════

type ChatMode = 'chat' | 'cultivos' | 'plagas';
type MessageType = 'text' | 'cultivos_result' | 'plagas_result' | 'treatments_result' | 'error' | 'system';

interface WeatherInfo {
    temperature: number;
    humidity: number;
    windSpeed: number;
    precipitation: number;
    weatherCode: number;
    condition: string;
    icon: string;
    iconColor: string;
}

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    type: MessageType;
    timestamp: Date;
    cultivosData?: CultivoRecomendado[];
    plagasData?: PlagaDetectada[];
    imagenUrl?: string;
    treatmentsData?: any[];
    pestName?: string;
    municipio?: string;
    region?: string;
    weatherInfo?: WeatherInfo;
}

// ══════════════════════════════════════════════════════
//  CONFIGURACIÓN DE MODOS
// ══════════════════════════════════════════════════════

const MODE_CONFIG = {
    chat: {
        label: 'Asistente',
        icon: 'robot-outline' as const,
        color: '#059669',
        lightBg: '#ECFDF5',
        placeholder: 'Escribe tu pregunta sobre el huerto...',
        hint: 'Pregúntame sobre riego, plagas, cultivos o fertilización',
    },
    cultivos: {
        label: 'Cultivos IA',
        icon: 'sprout-outline' as const,
        color: '#047857',
        lightBg: '#F0FDF4',
        placeholder: 'Escribe tu municipio (ej: Xalapa, Monterrey)...',
        hint: 'IA: Random Forest + datos climáticos reales de tu zona',
    },
    plagas: {
        label: 'Detectar Plaga',
        icon: 'bug-outline' as const,
        color: '#DC2626',
        lightBg: '#FEF2F2',
        placeholder: 'Pega la URL pública de la foto de tu planta...',
        hint: 'IA: YOLOv8 detectará plagas en la imagen',
    },
};

// ══════════════════════════════════════════════════════
//  CHIPS DE ACCIONES RÁPIDAS
// ══════════════════════════════════════════════════════

const QUICK_CHIPS_CHAT = [
    { label: 'Cómo regar', prompt: '¿Cómo debo regar mis plantas?' },
    { label: 'Identificar plaga', prompt: '¿Cómo identifico si hay una plaga?' },
    { label: 'Cultivar tomate', prompt: '¿Cómo cultivo tomates?' },
    { label: 'Abono orgánico', prompt: '¿Qué abono uso para mi huerto?' },
];

const QUICK_CHIPS_CULTIVOS = [
    { label: 'Xalapa, Ver.', prompt: 'Xalapa' },
    { label: 'Monterrey, N.L.', prompt: 'Monterrey' },
    { label: 'Mérida, Yuc.', prompt: 'Mérida' },
    { label: 'Oaxaca, Oax.', prompt: 'Oaxaca' },
];

// ══════════════════════════════════════════════════════
//  RESPUESTAS DEL ASISTENTE GENERAL
// ══════════════════════════════════════════════════════

const getAssistantResponse = (input: string): string => {
    const n = input.toLowerCase();
    if (n.includes('hojas plateadas') || n.includes('trips') || n.includes('puntos negros'))
        return 'Los síntomas coinciden con trips. Las zonas plateadas son daño al tejido y los puntos negros son sus excrementos.\n\nAcciones:\n• Revisa el envés con una lupa\n• Retira hojas muy afectadas\n• Coloca trampas adhesivas azules o amarillas\n• Aplica jabón potásico al atardecer';
    if (n.includes('riego') || n.includes('regar') || n.includes('agua'))
        return 'Guía de riego:\n\n• Riega temprano por la mañana\n• Dirige el agua a la base, no a las hojas\n• Revisa los 3 cm superiores del suelo antes de regar — si están húmedos, espera\n• Prefiere riegos profundos y espaciados sobre muchos superficiales\n• En verano, riega más seguido; en invierno reduce la frecuencia';
    if (n.includes('plaga') || n.includes('pulgón') || n.includes('mosca blanca') || n.includes('insecto'))
        return 'Para identificar una plaga:\n\n• Revisa el envés de las hojas (ahí se esconden)\n• Busca huevos, larvas o excrementos\n• Observa si las hojas están amarillas, deformadas o con manchas\n\nManejo inicial:\n• Retira las partes muy afectadas\n• Usa trampas adhesivas amarillas\n• Aplica jabón potásico al atardecer\n\n💡 Para un análisis preciso, usa el modo "Detectar Plaga" y sube una foto';
    if (n.includes('tomate') || n.includes('jitomate'))
        return 'Cultivo de tomate:\n\n• Necesita 6-8 horas de sol directo\n• Suelo rico en materia orgánica con buen drenaje\n• Riega profundo sin mojar las hojas\n• Mantén humedad estable para evitar grietas\n• Elimina las hojas que toquen el suelo\n• Temperatura ideal: 18-26°C';
    if (n.includes('abono') || n.includes('fertiliz') || n.includes('compost') || n.includes('nutriente'))
        return 'Fertilización orgánica:\n\n• Compost maduro o humus de lombriz son los mejores\n• Aplica alrededor de la planta sin tocar el tallo\n• Comienza con poca cantidad y observa la respuesta\n• Demasiado nitrógeno = muchas hojas, pocos frutos\n• Fertiliza cada 3-4 semanas en temporada de crecimiento';
    if (n.includes('clima') || n.includes('temperatura') || n.includes('cultiv') || n.includes('sembrar') || n.includes('plantar'))
        return '🌽 Para recomendaciones de cultivos según el clima de TU zona, usa el modo "Cultivos IA" — el modelo de Inteligencia Artificial analizará los datos meteorológicos de tu municipio y te dirá qué plantar.';
    if (n.includes('url') || n.includes('foto') || n.includes('imagen') || n.includes('fotograf'))
        return '🐛 Para analizar fotos de tu planta con IA, cambia al modo "Detectar Plaga" en los botones de arriba. Ahí podrás pegar la URL de una foto pública de tu planta y el modelo YOLOv8 detectará plagas.';
    if (n.length < 20 && /^[a-záéíóúñA-ZÁÉÍÓÚÑ\s]+$/.test(input.trim()))
        return '🌿 Parece que escribiste el nombre de una ciudad. Si quieres recomendaciones de cultivos para esa zona, usa el modo "Cultivos IA" en los botones de arriba y vuelve a escribir el municipio ahí.';
    return 'Soy el asistente de HuertoConnect. Puedo ayudarte con:\n\n• 💧 Riego y nutrición de plantas\n• 🐛 Identificación y control de plagas\n• 🌱 Selección de cultivos\n• 🌤️ Clima y temporadas de siembra\n\nPara análisis con IA real:\n• Cultivos IA → escribe tu municipio\n• Detectar Plaga → pega la URL de una foto';
};

// ══════════════════════════════════════════════════════
//  FORMATEO DE RESULTADOS IA
// ══════════════════════════════════════════════════════

const extractCultivos = (data: unknown): CultivoRecomendado[] => {
    const d = data as Record<string, unknown>;
    const list = d?.recomendaciones || d?.cultivos || d?.predicciones || d?.resultado || d?.data;
    return Array.isArray(list) ? list.slice(0, 8) : Array.isArray(data) ? (data as CultivoRecomendado[]).slice(0, 8) : [];
};

const extractPlagas = (data: unknown): PlagaDetectada[] => {
    const d = data as Record<string, unknown>;
    // El modelo YOLOv8 retorna un objeto simple bajo la clave "deteccion"
    if (d?.deteccion && typeof d.deteccion === 'object' && !Array.isArray(d.deteccion)) {
        return [d.deteccion as PlagaDetectada];
    }
    const list = d?.detecciones || d?.plagas || d?.results || d?.resultado || d?.data;
    return Array.isArray(list) ? list.slice(0, 6) : Array.isArray(data) ? (data as PlagaDetectada[]).slice(0, 6) : [];
};

const getNombreCultivo = (c: CultivoRecomendado, i: number) =>
    String(c.nombre || c.cultivo || c.crop || c.name || `Cultivo ${i + 1}`);

const getNombrePlaga = (p: PlagaDetectada, i: number) =>
    String(p.plaga || p.clase || p.label || p.name || `Detección ${i + 1}`);

const getConfianzaPct = (value: unknown): number | null => {
    if (value === null || value === undefined) return null;
    const num = parseFloat(String(value));
    if (isNaN(num)) return null;
    return num > 1 ? num : num * 100;
};

// ══════════════════════════════════════════════════════
//  TYPING INDICATOR
// ══════════════════════════════════════════════════════

const TypingIndicator: React.FC = () => {
    const d1 = useRef(new Animated.Value(0)).current;
    const d2 = useRef(new Animated.Value(0)).current;
    const d3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const anim = (d: Animated.Value, delay: number) =>
            Animated.loop(Animated.sequence([
                Animated.delay(delay),
                Animated.timing(d, { toValue: 1, duration: 320, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(d, { toValue: 0, duration: 320, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ]));
        const a1 = anim(d1, 0); const a2 = anim(d2, 140); const a3 = anim(d3, 280);
        a1.start(); a2.start(); a3.start();
        return () => { a1.stop(); a2.stop(); a3.stop(); };
    }, []);

    const dot = (anim: Animated.Value, key: string) => (
        <Animated.View key={key} style={[styles.typingDot, {
            transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }) }]
        }]} />
    );

    return (
        <View style={styles.typingRow}>
            <View style={styles.aiAvatarSmall}>
                <MaterialCommunityIcons name="robot-outline" size={14} color="#4CAF50" />
            </View>
            <View style={styles.typingBubble}>
                {dot(d1, 'a')}{dot(d2, 'b')}{dot(d3, 'c')}
                <Text style={styles.typingLabel}>Analizando...</Text>
            </View>
        </View>
    );
};

// ══════════════════════════════════════════════════════
//  TARJETA CULTIVOS
// ══════════════════════════════════════════════════════

const CultivosCard: React.FC<{ cultivos: CultivoRecomendado[]; municipio?: string; region?: string; weatherInfo?: WeatherInfo }> = ({ cultivos, municipio, region, weatherInfo }) => (
    <View style={styles.resultCard}>
        {/* Encabezado */}
        <View style={styles.resultCardHeader}>
            <View style={styles.resultCardIconGreen}>
                <MaterialCommunityIcons name="sprout" size={16} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.resultCardTitle}>Cultivos Recomendados</Text>
                <Text style={styles.resultCardSub}>
                    {municipio}{region ? `, ${region}` : ''} · Random Forest
                </Text>
            </View>
        </View>

        {/* Clima en tiempo real */}
        {weatherInfo && (
            <View style={styles.weatherStrip}>
                <View style={styles.weatherStripLeft}>
                    <MaterialCommunityIcons
                        name={weatherInfo.icon as any}
                        size={28}
                        color={weatherInfo.iconColor}
                    />
                    <View>
                        <Text style={styles.weatherTemp}>{weatherInfo.temperature}°C</Text>
                        <Text style={styles.weatherCond}>{weatherInfo.condition}</Text>
                    </View>
                </View>
                <View style={styles.weatherStats}>
                    <View style={styles.weatherStat}>
                        <MaterialCommunityIcons name="water-percent" size={13} color="#42A5F5" />
                        <Text style={styles.weatherStatText}>{weatherInfo.humidity}%</Text>
                    </View>
                    <View style={styles.weatherStat}>
                        <MaterialCommunityIcons name="weather-windy" size={13} color="#78909C" />
                        <Text style={styles.weatherStatText}>{weatherInfo.windSpeed} km/h</Text>
                    </View>
                    {weatherInfo.precipitation > 0 && (
                        <View style={styles.weatherStat}>
                            <MaterialCommunityIcons name="umbrella-outline" size={13} color="#1E88E5" />
                            <Text style={styles.weatherStatText}>{weatherInfo.precipitation} mm</Text>
                        </View>
                    )}
                </View>
            </View>
        )}

        {/* Lista de cultivos */}
        {cultivos.length === 0 ? (
            <View style={styles.emptyResult}>
                <MaterialCommunityIcons name="sprout-outline" size={28} color="#C8E6C9" />
                <Text style={styles.emptyResultText}>No se encontraron recomendaciones.{'\n'}Intenta con otro municipio.</Text>
            </View>
        ) : cultivos.map((c, i) => {
            const conf = getConfianzaPct(c.probabilidad ?? c.score ?? c.confianza);
            return (
                <View key={i} style={styles.cultivoItem}>
                    <View style={styles.cultivoNumber}>
                        <Text style={styles.cultivoNumberText}>{i + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.cultivoName}>{getNombreCultivo(c, i)}</Text>
                        {c.descripcion ? <Text style={styles.cultivoDesc}>{String(c.descripcion)}</Text> : null}
                        {c.temporada ? <Text style={styles.cultivoMeta}>Temporada: {String(c.temporada)}</Text> : null}
                    </View>
                    {conf !== null ? (
                        <View style={styles.confBadge}>
                            <Text style={styles.confBadgeText}>{conf.toFixed(0)}%</Text>
                        </View>
                    ) : null}
                </View>
            );
        })}
    </View>
);

// ══════════════════════════════════════════════════════
//  TARJETA PLAGAS
// ══════════════════════════════════════════════════════

const PlagasCard: React.FC<{ plagas: PlagaDetectada[]; imagenUrl?: string; onAction?: (action: string, payload: any) => void }> = ({ plagas, imagenUrl, onAction }) => (
    <View style={[styles.resultCard, styles.resultCardPlagas]}>
        <View style={styles.resultCardHeader}>
            <View style={styles.resultCardIconOrange}>
                <MaterialCommunityIcons name="bug" size={16} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={[styles.resultCardTitle, { color: '#E65100' }]}>Análisis de Plagas</Text>
                <Text style={styles.resultCardSub}>YOLOv8 · Visión Artificial</Text>
            </View>
        </View>

        {imagenUrl ? (
            <Image source={{ uri: imagenUrl }} style={styles.plagaPreview} resizeMode="cover" />
        ) : null}

        {plagas.length === 0 ? (
            <View style={styles.plagaOk}>
                <MaterialCommunityIcons name="shield-check-outline" size={32} color="#4CAF50" />
                <Text style={styles.plagaOkText}>No se detectaron plagas ✅ (V2){'\n'}La planta parece sana</Text>
            </View>
        ) : plagas.map((p, i) => {
            const conf = getConfianzaPct(p.confianza ?? p.confidence ?? p.score);
            const pct = conf !== null ? Math.min(conf, 100) : null;
            const barColor = pct !== null ? (pct > 70 ? '#F44336' : pct > 40 ? '#FF9800' : '#4CAF50') : '#4CAF50';
            return (
                <View key={i} style={styles.plagaItem}>
                    <View style={styles.plagaItemHeader}>
                        <MaterialCommunityIcons name="alert-circle-outline" size={14} color="#FF9800" />
                        <Text style={styles.plagaName}>{getNombrePlaga(p, i)}</Text>
                        {pct !== null ? <Text style={styles.plagaConf}>{pct.toFixed(1)}%</Text> : null}
                    </View>
                    {pct !== null && (
                        <View style={styles.confBar}>
                            <View style={[styles.confBarFill, { width: `${pct}%` as any, backgroundColor: barColor }]} />
                        </View>
                    )}
                    {p.tratamientos_ecologicos && p.tratamientos_ecologicos.length > 0 ? (
                        <TouchableOpacity 
                            style={styles.actionBtn}
                            onPress={() => onAction && onAction('show_treatments', p)}
                            activeOpacity={0.7}
                        >
                            <MaterialCommunityIcons name="leaf-circle-outline" size={16} color="#059669" />
                            <Text style={styles.actionBtnText}>Ver tratamientos ecológicos</Text>
                        </TouchableOpacity>
                    ) : p.tratamiento ? (
                        <Text style={styles.plagaTratamiento}>Tratamiento: {String(p.tratamiento)}</Text>
                    ) : null}
                </View>
            );
        })}
    </View>
);

// ══════════════════════════════════════════════════════
//  TARJETA TRATAMIENTOS
// ══════════════════════════════════════════════════════

const TreatmentsCard: React.FC<{ treatments: any[]; pestName: string }> = ({ treatments, pestName }) => (
    <View style={[styles.resultCard, { borderColor: '#A7F3D0', shadowColor: '#059669' }]}>
        <View style={styles.resultCardHeader}>
            <View style={[styles.resultCardIconOrange, { backgroundColor: '#059669' }]}>
                <MaterialCommunityIcons name="leaf" size={16} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={[styles.resultCardTitle, { color: '#059669' }]}>Tratamientos Ecológicos</Text>
                <Text style={styles.resultCardSub}>Para {pestName}</Text>
            </View>
        </View>

        {treatments.map((t, i) => (
            <View key={i} style={[styles.plagaItem, { backgroundColor: '#F0FDF4', borderColor: '#D1FAE5' }]}>
                <View style={[styles.plagaItemHeader, { marginBottom: 4 }]}>
                    <MaterialCommunityIcons name="shield-check" size={16} color="#059669" />
                    <Text style={[styles.plagaName, { color: '#065F46', flex: 1 }]}>{t.nombre || 'Tratamiento'}</Text>
                    {t.tipo ? (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{String(t.tipo).toUpperCase()}</Text>
                        </View>
                    ) : null}
                </View>
                {t.descripcion ? <Text style={styles.plagaTratamiento}>{t.descripcion}</Text> : null}
                {t.aplicacion ? (
                    <View style={styles.treatmentUsage}>
                        <MaterialCommunityIcons name="water-pump" size={14} color="#059669" />
                        <Text style={styles.treatmentUsageText}>{t.aplicacion}</Text>
                    </View>
                ) : null}
                {t.frecuencia ? (
                    <View style={[styles.treatmentUsage, { marginTop: 4 }]}>
                        <MaterialCommunityIcons name="calendar-clock" size={14} color="#059669" />
                        <Text style={styles.treatmentUsageText}>{t.frecuencia}</Text>
                    </View>
                ) : null}
            </View>
        ))}
    </View>
);

// ══════════════════════════════════════════════════════
//  TEXTO CON FORMATO (SIMPLE MARKDOWN)
// ══════════════════════════════════════════════════════

const FormattedText: React.FC<{ text: string; style: any }> = ({ text, style }) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return (
        <Text style={style}>
            {parts.map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <Text key={i} style={{ fontWeight: 'bold', color: '#047857' }}>{part.slice(2, -2)}</Text>;
                }
                return <Text key={i}>{part}</Text>;
            })}
        </Text>
    );
};

// ══════════════════════════════════════════════════════
//  BURBUJA DE MENSAJE
// ══════════════════════════════════════════════════════

const MessageBubble: React.FC<{ msg: Message; accentColor: string; onAction?: (action: string, payload: any) => void }> = ({ msg, accentColor, onAction }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(msg.sender === 'user' ? 16 : -16)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
            Animated.spring(slideAnim, { toValue: 0, friction: 9, tension: 100, useNativeDriver: true }),
        ]).start();
    }, []);

    const isUser = msg.sender === 'user';
    const time = formatTime(msg.timestamp);

    return (
        <Animated.View style={[
            styles.msgRow,
            isUser ? styles.msgRowUser : styles.msgRowAI,
            { opacity: fadeAnim, transform: [{ translateX: slideAnim }] },
        ]}>
            {!isUser && (
                <View style={[styles.aiAvatarSmall, { marginBottom: 18 }]}>
                    <MaterialCommunityIcons name="robot-outline" size={14} color="#4CAF50" />
                </View>
            )}

            <View style={[styles.msgContentWrapper, isUser && { alignItems: 'flex-end' }]}>
                {msg.type === 'cultivos_result' && msg.cultivosData && (
                    <CultivosCard cultivos={msg.cultivosData} municipio={msg.municipio} region={msg.region} weatherInfo={msg.weatherInfo} />
                )}
                {msg.type === 'plagas_result' && msg.plagasData && (
                    <PlagasCard plagas={msg.plagasData} imagenUrl={msg.imagenUrl} onAction={onAction} />
                )}
                {msg.type === 'treatments_result' && msg.treatmentsData && msg.pestName && (
                    <TreatmentsCard treatments={msg.treatmentsData} pestName={msg.pestName} />
                )}
                {(msg.type === 'text' || msg.type === 'error' || msg.type === 'system') && (
                    <View style={[
                        styles.msgBubble,
                        isUser ? [styles.userBubble, { backgroundColor: accentColor }] : styles.aiBubble,
                        msg.type === 'error' && styles.errorBubble,
                    ]}>
                        {isUser ? (
                            <Text style={[styles.msgText, styles.userMsgText]}>
                                {msg.text}
                            </Text>
                        ) : (
                            <FormattedText 
                                text={msg.text} 
                                style={[styles.msgText, styles.aiMsgText, msg.type === 'error' && { color: '#B91C1C' }]} 
                            />
                        )}
                    </View>
                )}
                <Text style={[styles.msgTime, isUser && { textAlign: 'right' }]}>{time}</Text>
            </View>

            {isUser && (
                <View style={[styles.aiAvatarSmall, {
                    backgroundColor: accentColor + '22',
                    borderColor: accentColor + '55',
                    marginBottom: 18,
                }]}>
                    <MaterialCommunityIcons name="account" size={14} color={accentColor} />
                </View>
            )}
        </Animated.View>
    );
};

// ══════════════════════════════════════════════════════
//  MODAL DE HISTORIAL
// ══════════════════════════════════════════════════════

const HistoryModal: React.FC<{
    visible: boolean;
    onClose: () => void;
    conversations: ConversacionOut[];
    onSelect: (c: ConversacionOut) => void;
    loading: boolean;
    activeId?: string;
}> = ({ visible, onClose, conversations, onSelect, loading, activeId }) => (
    <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
                <View style={styles.modalHandle} />
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Historial de conversaciones</Text>
                    <TouchableOpacity onPress={onClose} style={styles.modalClose}>
                        <MaterialCommunityIcons name="close" size={20} color="#757575" />
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View style={styles.modalCenter}>
                        <ActivityIndicator color="#4CAF50" />
                        <Text style={styles.modalCenterText}>Cargando...</Text>
                    </View>
                ) : conversations.length === 0 ? (
                    <View style={styles.modalCenter}>
                        <MaterialCommunityIcons name="chat-outline" size={40} color="#C8E6C9" />
                        <Text style={styles.modalCenterText}>Sin conversaciones anteriores</Text>
                    </View>
                ) : (
                    <ScrollView showsVerticalScrollIndicator={false}>
                        {conversations.map(c => (
                            <TouchableOpacity
                                key={c.id}
                                style={[styles.historyItem, c.id === activeId && styles.historyItemActive]}
                                onPress={() => onSelect(c)}
                                activeOpacity={0.7}
                            >
                                <MaterialCommunityIcons
                                    name={c.estado === 'activa' ? 'chat-processing-outline' : 'chat-outline'}
                                    size={20}
                                    color={c.id === activeId ? '#4CAF50' : '#9E9E9E'}
                                />
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={styles.historyItemTitle} numberOfLines={2}>{c.tema}</Text>
                                    {c.fecha ? (
                                        <Text style={styles.historyItemDate}>
                                            {new Date(c.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                    ) : null}
                                </View>
                                {c.estado !== 'activa' && (
                                    <View style={styles.closedBadge}>
                                        <Text style={styles.closedBadgeText}>Cerrada</Text>
                                    </View>
                                )}
                                <MaterialCommunityIcons name="chevron-right" size={18} color="#BDBDBD" />
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}
            </View>
        </View>
    </Modal>
);

// ══════════════════════════════════════════════════════
//  PANTALLA PRINCIPAL
// ══════════════════════════════════════════════════════

export const AIChatScreen: React.FC = () => {
    const [mode, setMode] = useState<ChatMode>('chat');
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [convId, setConvId] = useState<string | null>(null);
    const [conversations, setConversations] = useState<ConversacionOut[]>([]);
    const [historyVisible, setHistoryVisible] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);

    const scrollRef = useRef<ScrollView>(null);
    const modeConfig = MODE_CONFIG[mode];

    // Mensaje de bienvenida y chips al cambiar modo
    useEffect(() => {
        const welcomes: Record<ChatMode, string> = {
            chat: '¡Hola! Soy tu asistente de horticultura 🌿\n\nPuedo ayudarte con riego, plagas, cultivos y fertilización.\n\nO usa los modos de IA arriba para análisis con Inteligencia Artificial real.',
            cultivos: '🌽 Modo Cultivos IA activado\n\nEscribe el nombre de tu municipio (puede ser cualquier ciudad de México) y el modelo de IA analizará el clima real de esa zona para recomendarte los mejores cultivos.',
            plagas: '🐛 Modo Detección de Plagas activado\n\nPega la URL pública de una foto de tu planta. El modelo YOLOv8 analizará la imagen y detectará posibles plagas con un nivel de confianza.',
        };
        setMessages([{
            id: `welcome-${mode}-${Date.now()}`,
            text: welcomes[mode],
            sender: 'ai',
            type: 'system',
            timestamp: new Date(),
        }]);
        setConvId(null);
        setInputText('');
    }, [mode]);

    const scrollToBottom = useCallback(() => {
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    }, []);

    const addMessage = useCallback((msg: Omit<Message, 'id' | 'timestamp'>) => {
        setMessages(prev => [...prev, { ...msg, id: `${Date.now()}-${Math.random()}`, timestamp: new Date() }]);
        scrollToBottom();
    }, [scrollToBottom]);

    const handleAction = useCallback((action: string, payload: any) => {
        if (action === 'show_treatments') {
            const p = payload as PlagaDetectada;
            const pestName = p.plaga || p.clase || p.label || p.name || 'la plaga';
            
            // Mensaje del usuario preguntando
            const userText = `¿Cómo puedo tratar ${pestName}?`;
            addMessage({ text: userText, sender: 'user', type: 'text' });
            
            // Respuesta de la IA con los tratamientos
            setTimeout(() => {
                setIsTyping(true);
                setTimeout(() => {
                    if (p.tratamientos_ecologicos && Array.isArray(p.tratamientos_ecologicos)) {
                        addMessage({ 
                            text: 'Tratamientos encontrados.', 
                            sender: 'ai', 
                            type: 'treatments_result', 
                            treatmentsData: p.tratamientos_ecologicos, 
                            pestName 
                        });
                    } else if (p.tratamiento) {
                        addMessage({ 
                            text: `Aquí tienes una recomendación para tratar **${pestName}**:\n\n${p.tratamiento}`, 
                            sender: 'ai', 
                            type: 'text' 
                        });
                    } else {
                        addMessage({ text: 'Lo siento, no encontré tratamientos específicos en la base de datos.', sender: 'ai', type: 'text' });
                    }
                    setIsTyping(false);
                }, 1000);
            }, 500);
        }
    }, [addMessage]);

    const persistMessage = useCallback(async (texto: string, rol: 'user' | 'assistant', currentId: string | null): Promise<string | null> => {
        try {
            let id = currentId;
            if (!id) {
                const tema = texto.length > 60 ? texto.substring(0, 60) + '...' : texto;
                const conv = await chatbotService.createConversacion({ tema });
                id = conv.id;
                setConvId(id);
            }
            await chatbotService.createMensaje(id, { contenido: texto, rol });
            return id;
        } catch { return currentId; }
    }, []);

    const loadHistory = useCallback(async () => {
        setHistoryLoading(true);
        try {
            const data = await chatbotService.listConversaciones(0, 30);
            setConversations(data);
        } catch { /* silent */ } finally { setHistoryLoading(false); }
    }, []);

    const loadConversation = useCallback(async (conv: ConversacionOut) => {
        try {
            const msgs = await chatbotService.listMensajes(conv.id);
            setMessages(msgs.map((m: MensajeOut) => ({
                id: m.id, text: m.contenido,
                sender: m.rol === 'user' ? 'user' : 'ai',
                type: 'text' as MessageType,
                timestamp: m.fecha ? new Date(m.fecha) : new Date(),
            })));
            setConvId(conv.id);
            setHistoryVisible(false);
            scrollToBottom();
        } catch (e: any) {
            Alert.alert('Error', e?.message || 'No se pudieron cargar los mensajes.');
        }
    }, [scrollToBottom]);

    const sendMessage = useCallback(async (text: string) => {
        const trimmed = text.trim();
        if (!trimmed || isTyping) return;

        setInputText('');
        setIsTyping(true);
        addMessage({ text: trimmed, sender: 'user', type: 'text' });
        let currentId = convId;

        try {
            // ── CULTIVOS: geocodificación real + modelo ──────────
            if (mode === 'cultivos') {
                currentId = await persistMessage(trimmed, 'user', currentId) ?? currentId;

                // Geocodificación: convierte el municipio a coordenadas reales
                const geo = await geocodeMunicipio(trimmed);

                if (!geo) {
                    const errMsg = `No pude encontrar las coordenadas de "${trimmed}". Intenta con el nombre completo (ej: "Xalapa", "Ciudad de México", "Guadalajara").`;
                    addMessage({ text: errMsg, sender: 'ai', type: 'error' });
                    await persistMessage(errMsg, 'assistant', currentId);
                    return;
                }

                // Fetch cultivos + clima EN PARALELO para menor latencia
                const [response, weatherInfo] = await Promise.all([
                    aiModelService.recommendGarden({
                        lat: geo.lat,
                        lon: geo.lon,
                        municipio: geo.name,
                    }),
                    fetchCurrentWeather(geo.lat, geo.lon),
                ]);

                const cultivos = extractCultivos(response);
                const reply = cultivos.length > 0
                    ? `Encontré ${cultivos.length} cultivos recomendados para ${geo.name}${geo.region ? `, ${geo.region}` : ''}`
                    : `No encontré recomendaciones específicas para "${geo.name}". La API puede no tener datos climáticos de esta zona todavía.`;

                addMessage({
                    text: reply, sender: 'ai', type: 'cultivos_result',
                    cultivosData: cultivos, municipio: geo.name, region: geo.region,
                    weatherInfo: weatherInfo ?? undefined,
                });
                await persistMessage(reply, 'assistant', currentId);

            // ── PLAGAS: YOLOv8 ───────────────────────────────────
            } else if (mode === 'plagas') {
                if (!trimmed.startsWith('http')) {
                    addMessage({
                        text: 'La URL debe comenzar con https://...\n\nEjemplo:\nhttps://images.unsplash.com/photo-xxx.jpg',
                        sender: 'ai', type: 'error',
                    });
                    return;
                }
                currentId = await persistMessage(`Analizar imagen: ${trimmed}`, 'user', currentId) ?? currentId;
                const response = await aiModelService.detectPest({ imagen_url: trimmed });
                const plagas = extractPlagas(response);
                const reply = plagas.length > 0
                    ? `Detecté ${plagas.length} posible${plagas.length > 1 ? 's' : ''} plaga${plagas.length > 1 ? 's' : ''} en la imagen`
                    : 'La imagen fue analizada. No se detectaron plagas — la planta parece sana.';
                addMessage({ text: reply, sender: 'ai', type: 'plagas_result', plagasData: plagas, imagenUrl: trimmed });
                await persistMessage(reply, 'assistant', currentId);

            // ── ASISTENTE: texto libre ───────────────────────────
            } else {
                currentId = await persistMessage(trimmed, 'user', currentId) ?? currentId;
                const reply = getAssistantResponse(trimmed);
                addMessage({ text: reply, sender: 'ai', type: 'text' });
                await persistMessage(reply, 'assistant', currentId);
            }

        } catch (error: any) {
            const msg = error?.response?.data?.detail || error?.message || 'Error de conexión. Verifica tu internet e intenta de nuevo.';
            addMessage({ text: `Error: ${msg}`, sender: 'ai', type: 'error' });
        } finally {
            setIsTyping(false);
            scrollToBottom();
        }
    }, [isTyping, mode, convId, addMessage, persistMessage, scrollToBottom]);

    const handleSend = useCallback(() => sendMessage(inputText), [sendMessage, inputText]);
    const handleChip = useCallback((prompt: string) => sendMessage(prompt), [sendMessage]);

    // ── RENDER ────────────────────────────────────────

    const quickChips = mode === 'cultivos' ? QUICK_CHIPS_CULTIVOS : mode === 'chat' ? QUICK_CHIPS_CHAT : [];
    const showChips = messages.length <= 1 && quickChips.length > 0;

    return (
        <SafeAreaView style={styles.root}>
            <StatusBar style="dark" />

            <AppScreenHeader
                eyebrow="Asistente inteligente"
                title="Cuida mejor tu huerto"
                subtitle="Consulta, recomienda cultivos o analiza señales de plagas."
                icon="creation-outline"
                actions={[
                    {
                        icon: 'plus',
                        label: 'Nueva conversación',
                        onPress: () => { setMessages([]); setConvId(null); setMode('chat'); },
                    },
                    {
                        icon: 'history',
                        label: 'Ver historial',
                        onPress: () => { loadHistory(); setHistoryVisible(true); },
                    },
                ]}
            />

            {/* ── SELECTOR DE MODO ── */}
            <View style={styles.modeBar}>
                <View style={styles.modeTabsRow}>
                {(['chat', 'cultivos', 'plagas'] as ChatMode[]).map(m => {
                    const cfg = MODE_CONFIG[m];
                    const active = mode === m;
                    return (
                        <TouchableOpacity
                            key={m}
                            style={[styles.modeTab, active && { backgroundColor: cfg.color }]}
                            onPress={() => setMode(m)}
                            activeOpacity={0.75}
                            accessibilityRole="button"
                            accessibilityState={{ selected: active }}
                        >
                            <MaterialCommunityIcons name={cfg.icon} size={18} color={active ? '#fff' : palette.muted} />
                            <Text style={[styles.modeTabLabel, { color: active ? '#fff' : '#6B7280' }]}>{cfg.label}</Text>
                        </TouchableOpacity>
                    );
                })}
                </View>
            </View>

            {/* ── HINT ── */}
            <View style={[styles.hintBar, { backgroundColor: modeConfig.lightBg }]}>
                <MaterialCommunityIcons name="information-outline" size={13} color={modeConfig.color} />
                <Text style={[styles.hintText, { color: modeConfig.color }]}>{modeConfig.hint}</Text>
            </View>

            {/* ── MENSAJES + INPUT ── */}
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <ScrollView
                    ref={scrollRef}
                    style={styles.msgList}
                    contentContainerStyle={styles.msgListContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {messages.map(msg => (
                        <MessageBubble key={msg.id} msg={msg} accentColor={modeConfig.color} onAction={handleAction} />
                    ))}

                    {/* Chips de acciones rápidas */}
                    {showChips && !isTyping && (
                        <View style={styles.chipsContainer}>
                            <Text style={styles.chipsLabel}>Prueba con:</Text>
                            <View style={styles.chipsRow}>
                                {quickChips.map((chip, i) => (
                                    <TouchableOpacity
                                        key={i}
                                        style={[styles.chip, { borderColor: modeConfig.color + '55' }]}
                                        onPress={() => handleChip(chip.prompt)}
                                        activeOpacity={0.7}
                                    >
                                        <MaterialCommunityIcons name="arrow-top-right" size={14} color={modeConfig.color} />
                                        <Text style={[styles.chipText, { color: modeConfig.color }]}>{chip.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}

                    {isTyping && <TypingIndicator />}
                    <View style={{ height: 8 }} />
                </ScrollView>

                {/* ── INPUT BAR ── */}
                <View style={styles.inputBar}>
                    <View style={[styles.inputWrapper, { borderColor: modeConfig.color + '55' }]}>
                        <MaterialCommunityIcons
                            name={mode === 'cultivos' ? 'map-marker-outline' : mode === 'plagas' ? 'link-variant' : 'message-outline'}
                            size={18}
                            color={modeConfig.color}
                            style={styles.inputPrefixIcon}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder={modeConfig.placeholder}
                            placeholderTextColor="#BDBDBD"
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                            maxLength={500}
                            blurOnSubmit={false}
                        />
                        <TouchableOpacity
                            style={[styles.sendBtn, { backgroundColor: modeConfig.color }, (!inputText.trim() || isTyping) && styles.sendBtnDisabled]}
                            onPress={handleSend}
                            disabled={!inputText.trim() || isTyping}
                            activeOpacity={0.8}
                        >
                            {isTyping
                                ? <ActivityIndicator size="small" color="#fff" />
                                : <MaterialCommunityIcons name="send" size={18} color="#fff" />}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>

            <HistoryModal
                visible={historyVisible}
                onClose={() => setHistoryVisible(false)}
                conversations={conversations}
                onSelect={loadConversation}
                loading={historyLoading}
                activeId={convId ?? undefined}
            />
        </SafeAreaView>
    );
};

// ══════════════════════════════════════════════════════
//  ESTILOS
// ══════════════════════════════════════════════════════

const styles = StyleSheet.create({
    // ── Base ────────────────────────────────────────────────────────────
    root: { flex: 1, backgroundColor: palette.canvas },

    // ── Mode selector ────────────────────────────────────────────────────
    modeBar: {
        backgroundColor: palette.canvas,
        paddingHorizontal: 14, paddingBottom: 10,
    },
    modeTabsRow: {
        flexDirection: 'row',
        backgroundColor: palette.surface,
        borderRadius: radii.medium, padding: 4, gap: 4,
        borderWidth: 1, borderColor: palette.border,
    },
    modeTab: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 6, paddingVertical: 10, borderRadius: 14,
    },
    modeTabLabel: { fontSize: 11.5, fontWeight: '700', letterSpacing: -0.1 },

    // ── Hint bar ─────────────────────────────────────────────────────────
    hintBar: {
        flexDirection: 'row', alignItems: 'center', gap: 7,
        marginHorizontal: 14,
        paddingHorizontal: 12, paddingVertical: 9,
        borderRadius: radii.small,
    },
    hintText: { fontSize: 11.5, flex: 1, fontWeight: '500', letterSpacing: -0.1 },

    // ── Messages list ────────────────────────────────────────────────────
    msgList: { flex: 1, backgroundColor: palette.canvas },
    msgListContent: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 10, gap: 10 },

    msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 7 },
    msgRowUser: { justifyContent: 'flex-end' },
    msgRowAI: { justifyContent: 'flex-start' },

    aiAvatarSmall: {
        width: 30, height: 30, borderRadius: 15,
        backgroundColor: palette.primarySoft,
        alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
    },
    msgContentWrapper: { flex: 1, maxWidth: width * 0.74, gap: 4 },

    msgBubble: { borderRadius: radii.medium, paddingHorizontal: 16, paddingVertical: 12 },
    userBubble: { borderBottomRightRadius: 5 },
    aiBubble: {
        backgroundColor: palette.surface, borderBottomLeftRadius: 5,
        borderWidth: 1, borderColor: palette.border,
    },
    errorBubble: {
        backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderBottomLeftRadius: 5,
    },
    msgText: { fontSize: 14.5, lineHeight: 22, letterSpacing: -0.1 },
    userMsgText: { color: '#FFFFFF', fontWeight: '500' },
    aiMsgText: { color: '#111827' },
    msgTime: { fontSize: 10, color: '#D1D5DB', marginTop: 4, letterSpacing: 0.2 },

    // ── Typing indicator ─────────────────────────────────────────────────
    typingRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
    typingBubble: {
        flexDirection: 'row', gap: 5, alignItems: 'center',
        backgroundColor: '#FFFFFF', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 13,
        borderWidth: 1, borderColor: '#EDEDED',
        elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3,
    },
    typingDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#059669' },
    typingLabel: { fontSize: 11, color: '#9CA3AF', marginLeft: 4, fontWeight: '500' },

    // ── Quick chips ──────────────────────────────────────────────────────
    chipsContainer: { paddingTop: 6, paddingBottom: 10, gap: 10 },
    chipsLabel: { fontSize: 11, color: palette.muted, fontWeight: '800', marginLeft: 2, letterSpacing: 0.8, textTransform: 'uppercase' },
    chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingHorizontal: 13, paddingVertical: 9,
        borderRadius: radii.pill, borderWidth: 1,
        backgroundColor: palette.surface,
    },
    chipText: { fontSize: 12, fontWeight: '600' },

    // ── Input bar ────────────────────────────────────────────────────────
    inputBar: {
        backgroundColor: palette.canvas,
        paddingHorizontal: 12, paddingTop: 10, paddingBottom: 90,
        borderTopWidth: 1, borderTopColor: palette.border,
    },
    inputWrapper: {
        flexDirection: 'row', alignItems: 'flex-end',
        backgroundColor: palette.surface, borderRadius: 24, borderWidth: 1.5,
        paddingLeft: 13, paddingRight: 5, paddingVertical: 5, gap: 8,
        ...shadows.card,
    },
    inputPrefixIcon: { paddingBottom: 4, flexShrink: 0 },
    input: { flex: 1, fontSize: 14, color: '#1F2937', maxHeight: 100, paddingVertical: 5, lineHeight: 20 },
    sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    sendBtnDisabled: { opacity: 0.35 },

    // ── Result cards ─────────────────────────────────────────────────────
    resultCard: {
        backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14,
        borderWidth: 1, borderColor: '#D1FAE5', gap: 10,
        elevation: 2, shadowColor: '#059669', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8,
        maxWidth: width * 0.8,
    },
    resultCardPlagas: { borderColor: '#FECACA', shadowColor: '#DC2626' },
    resultCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    resultCardIconGreen: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#059669', alignItems: 'center', justifyContent: 'center' },
    resultCardIconOrange: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#DC2626', alignItems: 'center', justifyContent: 'center' },
    resultCardTitle: { fontSize: 13, fontWeight: '700', color: '#065F46', letterSpacing: -0.2 },
    resultCardSub: { fontSize: 10, color: '#9CA3AF', marginTop: 2, letterSpacing: 0.1 },

    emptyResult: { alignItems: 'center', gap: 8, paddingVertical: 14 },
    emptyResultText: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', lineHeight: 18 },

    cultivoItem: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#F0FDF4', borderRadius: 12, padding: 11, gap: 10,
        borderWidth: 1, borderColor: '#D1FAE5',
    },
    cultivoNumber: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#A7F3D0', alignItems: 'center', justifyContent: 'center' },
    cultivoNumberText: { fontSize: 11, fontWeight: '800', color: '#065F46' },
    cultivoName: { fontSize: 13, fontWeight: '600', color: '#065F46', letterSpacing: -0.2 },
    cultivoDesc: { fontSize: 11, color: '#6B7280', marginTop: 2, lineHeight: 16 },
    cultivoMeta: { fontSize: 10, color: '#9CA3AF', marginTop: 2 },
    confBadge: { backgroundColor: '#ECFDF5', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
    confBadgeText: { fontSize: 11, fontWeight: '700', color: '#059669' },

    // ── Weather strip ────────────────────────────────────────────────────
    weatherStrip: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#EFF6FF', borderRadius: 12, padding: 11,
        borderWidth: 1, borderColor: '#BFDBFE',
    },
    weatherStripLeft: { flexDirection: 'row', alignItems: 'center', gap: 9 },
    weatherTemp: { fontSize: 20, fontWeight: '700', color: '#1D4ED8', letterSpacing: -0.5 },
    weatherCond: { fontSize: 11, color: '#60A5FA', marginTop: 1, fontWeight: '500' },
    weatherStats: { flexDirection: 'column', gap: 5, alignItems: 'flex-end' },
    weatherStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    weatherStatText: { fontSize: 11, color: '#475569', fontWeight: '500' },

    // ── Plagas card ──────────────────────────────────────────────────────
    plagaPreview: { width: '100%', height: 140, borderRadius: 12 },
    plagaOk: { alignItems: 'center', gap: 8, paddingVertical: 10 },
    plagaOkText: { fontSize: 13, color: '#059669', fontWeight: '600', textAlign: 'center' },
    plagaItem: { backgroundColor: '#FEF2F2', borderRadius: 12, padding: 11, gap: 6, borderWidth: 1, borderColor: '#FECACA' },
    plagaItemHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    plagaName: { flex: 1, fontSize: 13, fontWeight: '600', color: '#DC2626' },
    plagaConf: { fontSize: 12, color: '#DC2626', fontWeight: '700' },
    confBar: { height: 4, backgroundColor: '#FEE2E2', borderRadius: 2, overflow: 'hidden' },
    confBarFill: { height: 4, borderRadius: 2 },
    plagaTratamiento: { fontSize: 13, color: '#4B5563', lineHeight: 18, marginTop: 10 },
    actionBtn: { 
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        backgroundColor: '#ECFDF5', paddingVertical: 8, paddingHorizontal: 14, 
        borderRadius: 8, marginTop: 12, borderWidth: 1, borderColor: '#D1FAE5'
    },
    actionBtnText: { fontSize: 12.5, fontWeight: '600', color: '#059669' },
    badge: { backgroundColor: '#D1FAE5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    badgeText: { fontSize: 9, fontWeight: '700', color: '#059669' },
    treatmentUsage: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 8 },
    treatmentUsageText: { fontSize: 12, color: '#065F46', flex: 1, lineHeight: 16 },

    // ── History modal ────────────────────────────────────────────────────
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
    modalSheet: {
        backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24,
        paddingHorizontal: 20, paddingBottom: 30, maxHeight: '75%',
    },
    modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB', alignSelf: 'center', marginTop: 12, marginBottom: 16 },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    modalTitle: { fontSize: 16, fontWeight: '700', color: '#111827', letterSpacing: -0.3 },
    modalClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
    modalCenter: { alignItems: 'center', paddingVertical: 40, gap: 10 },
    modalCenterText: { fontSize: 14, color: '#9CA3AF' },

    historyItem: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#FAFAFA',
        borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#F3F4F6',
    },
    historyItemActive: { borderColor: '#6EE7B7', backgroundColor: '#F0FDF4' },
    historyItemTitle: { fontSize: 13, color: '#1F2937', fontWeight: '500', lineHeight: 19 },
    historyItemDate: { fontSize: 11, color: '#9CA3AF', marginTop: 3 },
    closedBadge: { backgroundColor: '#F3F4F6', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginRight: 6 },
    closedBadgeText: { fontSize: 10, color: '#9CA3AF' },
});

export default AIChatScreen;
