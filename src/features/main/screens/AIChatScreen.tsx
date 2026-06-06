/**
 * AIChatScreen — Asistente IA de HuertoConnect
 *
 * Tres modos de operación:
 *   🤖 Asistente General  → Texto libre, respuestas inteligentes locales + persistencia API
 *   🌽 Cultivos           → POST /huertos/recomendar (Random Forest + Clima)
 *   🐛 Plagas             → POST /plagas/detectar    (YOLOv8 Visión Artificial)
 *
 * Todos los mensajes se persisten en /chatbot/conversaciones via chatbotService.
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
    StatusBar as RNStatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { chatbotService, ConversacionOut, MensajeOut } from '../services/chatbotService';
import { aiModelService, CultivoRecomendado, PlagaDetectada } from '../services/aiModelService';

const { width, height } = Dimensions.get('window');
const STATUSBAR_HEIGHT = RNStatusBar.currentHeight ?? 0;

// ══════════════════════════════════════════════════════════════
//  TIPOS
// ══════════════════════════════════════════════════════════════

type ChatMode = 'chat' | 'cultivos' | 'plagas';
type MessageType = 'text' | 'cultivos_result' | 'plagas_result' | 'error' | 'system';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    type: MessageType;
    timestamp: Date;
    // Datos estructurados de los modelos IA
    cultivosData?: CultivoRecomendado[];
    plagasData?: PlagaDetectada[];
    imagenUrl?: string;
    municipio?: string;
}

// ══════════════════════════════════════════════════════════════
//  CONFIGURACIÓN DE MODOS
// ══════════════════════════════════════════════════════════════

const MODE_CONFIG: Record<ChatMode, {
    label: string;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    gradient: [string, string];
    accent: string;
    inputPlaceholder: string;
    hint: string;
}> = {
    chat: {
        label: 'Asistente',
        icon: 'robot-outline',
        gradient: ['#0d4f3c', '#0a3d2e'],
        accent: '#4ade80',
        inputPlaceholder: 'Escribe tu pregunta sobre el huerto...',
        hint: 'Pregúntame sobre riego, cultivos, clima o fertilización',
    },
    cultivos: {
        label: 'Cultivos',
        icon: 'sprout-outline',
        gradient: ['#14532d', '#0f3d21'],
        accent: '#86efac',
        inputPlaceholder: 'Escribe tu municipio (ej: Xalapa)...',
        hint: 'Escribe tu municipio y el modelo IA te recomendará cultivos ideales',
    },
    plagas: {
        label: 'Plagas',
        icon: 'bug-outline',
        gradient: ['#1a1a0a', '#2d1a00'],
        accent: '#fbbf24',
        inputPlaceholder: 'Pega la URL pública de la foto de tu planta...',
        hint: 'El modelo YOLOv8 analizará la imagen y detectará posibles plagas',
    },
};

// ══════════════════════════════════════════════════════════════
//  RESPUESTAS DEL ASISTENTE GENERAL
// ══════════════════════════════════════════════════════════════

const getAssistantResponse = (input: string): string => {
    const n = input.toLowerCase();
    if (n.includes('hojas plateadas') || n.includes('puntos negros') || n.includes('trips'))
        return '🔍 Los síntomas coinciden con una posible presencia de **trips**. Las zonas plateadas aparecen por el daño al tejido y los puntos negros son sus excrementos.\n\n✅ Acciones recomendadas:\n• Revisa el envés con una lupa\n• Retira las hojas muy afectadas\n• Coloca trampas adhesivas azules o amarillas\n• Aplica jabón potásico o aceite de neem al atardecer';
    if (n.includes('riego') || n.includes('regar'))
        return '💧 **Guía de riego inteligente:**\n\n• Riega temprano por la mañana\n• Dirige el agua a la base de la planta\n• Comprueba los 2-3 cm superiores del suelo antes\n• Prefiere riegos profundos y espaciados sobre muchos superficiales';
    if (n.includes('plaga') || n.includes('pulgón') || n.includes('mosca blanca'))
        return '🐛 Para identificar la plaga:\n\n• Revisa el envés de las hojas\n• Busca huevos, larvas o excrementos\n\n✅ Manejo inicial:\n• Retira partes muy afectadas\n• Usa trampas adhesivas\n• Aplica jabón potásico al atardecer';
    if (n.includes('tomate') || n.includes('jitomate'))
        return '🍅 **Cultivo de tomate:**\n\n• Necesita 6-8 horas de sol directo\n• Suelo con buen drenaje\n• Riego profundo sin mojar las hojas\n• Mantén humedad estable para evitar agrietamiento\n• Elimina hojas que toquen el suelo';
    if (n.includes('abono') || n.includes('fertilizante') || n.includes('compost'))
        return '🌱 **Fertilización orgánica:**\n\n• Comienza con compost maduro o humus de lombriz\n• Aplica alrededor de la planta, sin tocar el tallo\n• Cantidades moderadas primero\n• Demasiado nitrógeno = muchas hojas, pocos frutos';
    if (n.includes('clima') || n.includes('temperatura'))
        return '🌤️ Para recomendaciones personalizadas según tu clima usa el modo **🌽 Cultivos** — el modelo de IA analizará las condiciones meteorológicas de tu municipio.';
    return '👋 Soy el asistente IA de HuertoConnect. Puedo ayudarte con:\n\n• 💧 Riego y nutrición\n• 🌱 Selección de cultivos\n• 🐛 Identificación de plagas\n• 🌤️ Clima y temporadas\n\nO usa los modos especializados arriba para análisis con inteligencia artificial real.';
};

// ══════════════════════════════════════════════════════════════
//  FORMATEO DE RESULTADOS DE MODELOS IA
// ══════════════════════════════════════════════════════════════

const extractCultivos = (data: unknown): CultivoRecomendado[] => {
    const d = data as Record<string, unknown>;
    const list = d?.recomendaciones || d?.cultivos || d?.predicciones || d?.resultado || d?.data;
    return Array.isArray(list) ? list.slice(0, 8) :
        Array.isArray(data) ? (data as CultivoRecomendado[]).slice(0, 8) : [];
};

const extractPlagas = (data: unknown): PlagaDetectada[] => {
    const d = data as Record<string, unknown>;
    const list = d?.detecciones || d?.plagas || d?.results || d?.resultado || d?.data;
    return Array.isArray(list) ? list.slice(0, 8) :
        Array.isArray(data) ? (data as PlagaDetectada[]).slice(0, 8) : [];
};

const formatConfianza = (value: number | string | undefined): string => {
    if (value === undefined || value === null) return '';
    const num = parseFloat(String(value));
    if (isNaN(num)) return String(value);
    return num > 1 ? `${num.toFixed(1)}%` : `${(num * 100).toFixed(1)}%`;
};

const getNombreCultivo = (c: CultivoRecomendado, i: number): string =>
    String(c.nombre || c.cultivo || c.crop || c.name || `Cultivo ${i + 1}`);

const getNombrePlaga = (p: PlagaDetectada, i: number): string =>
    String(p.plaga || p.clase || p.label || p.name || `Detección ${i + 1}`);

// ══════════════════════════════════════════════════════════════
//  TYPING INDICATOR
// ══════════════════════════════════════════════════════════════

const TypingIndicator: React.FC<{ color?: string }> = ({ color = '#4ade80' }) => {
    const d1 = useRef(new Animated.Value(0)).current;
    const d2 = useRef(new Animated.Value(0)).current;
    const d3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const anim = (d: Animated.Value, delay: number) =>
            Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(d, { toValue: 1, duration: 350, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                    Animated.timing(d, { toValue: 0, duration: 350, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                ])
            );
        const a1 = anim(d1, 0); const a2 = anim(d2, 150); const a3 = anim(d3, 300);
        a1.start(); a2.start(); a3.start();
        return () => { a1.stop(); a2.stop(); a3.stop(); };
    }, []);

    const dot = (anim: Animated.Value) => (
        <Animated.View style={[
            styles.typingDot,
            { backgroundColor: color },
            { transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -7] }) }], opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }
        ]} />
    );

    return (
        <View style={styles.typingRow}>
            <View style={[styles.typingBubble, { borderColor: color + '33' }]}>
                <MaterialCommunityIcons name="robot-outline" size={14} color={color} style={{ marginRight: 8 }} />
                <View style={styles.typingDots}>
                    {dot(d1)}{dot(d2)}{dot(d3)}
                </View>
                <Text style={[styles.typingLabel, { color }]}>Analizando...</Text>
            </View>
        </View>
    );
};

// ══════════════════════════════════════════════════════════════
//  TARJETA DE CULTIVOS (resultado del modelo IA)
// ══════════════════════════════════════════════════════════════

const CultivosCard: React.FC<{ cultivos: CultivoRecomendado[]; municipio?: string }> = ({ cultivos, municipio }) => (
    <View style={styles.resultCard}>
        <View style={styles.resultCardHeader}>
            <LinearGradient colors={['#14532d', '#166534']} style={styles.resultCardIcon}>
                <MaterialCommunityIcons name="sprout" size={18} color="#86efac" />
            </LinearGradient>
            <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.resultCardTitle}>🌽 Cultivos Recomendados</Text>
                {municipio ? <Text style={styles.resultCardSubtitle}>Para {municipio} · Modelo Random Forest</Text> : null}
            </View>
        </View>
        {cultivos.length === 0 ? (
            <Text style={styles.resultCardEmpty}>No se encontraron recomendaciones para esta zona.</Text>
        ) : cultivos.map((c, i) => {
            const conf = c.probabilidad || c.score || c.confianza;
            const confStr = conf ? formatConfianza(conf as number | string) : null;
            return (
                <View key={i} style={styles.resultItem}>
                    <View style={styles.resultItemLeft}>
                        <Text style={styles.resultItemNumber}>{i + 1}</Text>
                    </View>
                    <View style={styles.resultItemContent}>
                        <Text style={styles.resultItemName}>{getNombreCultivo(c, i)}</Text>
                        {c.descripcion ? <Text style={styles.resultItemDesc}>{String(c.descripcion)}</Text> : null}
                        {c.temporada ? <Text style={styles.resultItemMeta}>🗓️ {String(c.temporada)}</Text> : null}
                    </View>
                    {confStr ? (
                        <View style={styles.resultItemBadge}>
                            <Text style={styles.resultItemBadgeText}>{confStr}</Text>
                        </View>
                    ) : null}
                </View>
            );
        })}
    </View>
);

// ══════════════════════════════════════════════════════════════
//  TARJETA DE PLAGAS (resultado del modelo YOLOv8)
// ══════════════════════════════════════════════════════════════

const PlagasCard: React.FC<{ plagas: PlagaDetectada[]; imagenUrl?: string }> = ({ plagas, imagenUrl }) => (
    <View style={[styles.resultCard, styles.resultCardPlagas]}>
        <View style={styles.resultCardHeader}>
            <LinearGradient colors={['#78350f', '#92400e']} style={styles.resultCardIcon}>
                <MaterialCommunityIcons name="bug" size={18} color="#fbbf24" />
            </LinearGradient>
            <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[styles.resultCardTitle, { color: '#fbbf24' }]}>🐛 Análisis de Plagas</Text>
                <Text style={styles.resultCardSubtitle}>Modelo YOLOv8 · Visión Artificial</Text>
            </View>
        </View>

        {imagenUrl ? (
            <Image source={{ uri: imagenUrl }} style={styles.plagaImage} resizeMode="cover" />
        ) : null}

        {plagas.length === 0 ? (
            <View style={styles.plagasEmptyContainer}>
                <MaterialCommunityIcons name="shield-check" size={28} color="#4ade80" />
                <Text style={styles.plagasEmptyText}>No se detectaron plagas en la imagen ✅</Text>
            </View>
        ) : plagas.map((p, i) => {
            const conf = p.confianza || p.confidence || p.score;
            const confNum = conf ? parseFloat(String(conf)) : null;
            const confPct = confNum !== null ? (confNum > 1 ? confNum : confNum * 100) : null;
            return (
                <View key={i} style={styles.plagaItem}>
                    <View style={styles.plagaItemHeader}>
                        <MaterialCommunityIcons name="alert-circle" size={14} color="#fbbf24" />
                        <Text style={styles.plagaItemName}>{getNombrePlaga(p, i)}</Text>
                        {confPct !== null ? (
                            <Text style={styles.plagaConf}>{confPct.toFixed(1)}%</Text>
                        ) : null}
                    </View>
                    {confPct !== null && (
                        <View style={styles.confBar}>
                            <View style={[styles.confBarFill, {
                                width: `${Math.min(confPct, 100)}%` as any,
                                backgroundColor: confPct > 70 ? '#ef4444' : confPct > 40 ? '#fbbf24' : '#4ade80',
                            }]} />
                        </View>
                    )}
                    {p.tratamiento ? <Text style={styles.plagaTratamiento}>💊 {String(p.tratamiento)}</Text> : null}
                </View>
            );
        })}
    </View>
);

// ══════════════════════════════════════════════════════════════
//  BURBUJA DE MENSAJE
// ══════════════════════════════════════════════════════════════

const MessageBubble: React.FC<{ msg: Message; accentColor: string }> = ({ msg, accentColor }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(msg.sender === 'user' ? 20 : -20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
            Animated.spring(slideAnim, { toValue: 0, friction: 9, tension: 80, useNativeDriver: true }),
        ]).start();
    }, []);

    const isUser = msg.sender === 'user';
    const time = msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <Animated.View style={[
            styles.msgRow,
            isUser ? styles.msgRowUser : styles.msgRowAI,
            { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }
        ]}>
            {!isUser && (
                <View style={[styles.aiAvatar, { backgroundColor: accentColor + '22', borderColor: accentColor + '55' }]}>
                    <MaterialCommunityIcons name="robot-outline" size={16} color={accentColor} />
                </View>
            )}

            <View style={styles.msgContent}>
                {/* Tarjetas especiales de IA */}
                {msg.type === 'cultivos_result' && msg.cultivosData && (
                    <CultivosCard cultivos={msg.cultivosData} municipio={msg.municipio} />
                )}
                {msg.type === 'plagas_result' && msg.plagasData && (
                    <PlagasCard plagas={msg.plagasData} imagenUrl={msg.imagenUrl} />
                )}
                {/* Burbuja de texto estándar */}
                {(msg.type === 'text' || msg.type === 'error' || msg.type === 'system') && (
                    <View style={[
                        styles.msgBubble,
                        isUser
                            ? [styles.userBubble, { borderColor: accentColor + '44' }]
                            : msg.type === 'error'
                                ? styles.errorBubble
                                : styles.aiBubble,
                    ]}>
                        {isUser && (
                            <LinearGradient
                                colors={[accentColor + 'DD', accentColor + 'AA']}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                style={StyleSheet.absoluteFill}
                            />
                        )}
                        <Text style={[styles.msgText, isUser ? styles.userMsgText : styles.aiMsgText]}>
                            {msg.text}
                        </Text>
                    </View>
                )}
                <Text style={[styles.msgTime, isUser ? styles.userMsgTime : styles.aiMsgTime]}>{time}</Text>
            </View>

            {isUser && (
                <View style={[styles.userAvatar, { backgroundColor: accentColor + '33', borderColor: accentColor + '66' }]}>
                    <MaterialCommunityIcons name="account" size={16} color={accentColor} />
                </View>
            )}
        </Animated.View>
    );
};

// ══════════════════════════════════════════════════════════════
//  MODAL DE HISTORIAL
// ══════════════════════════════════════════════════════════════

const HistoryModal: React.FC<{
    visible: boolean;
    onClose: () => void;
    conversations: ConversacionOut[];
    onSelect: (c: ConversacionOut) => void;
    loading: boolean;
    activeId?: string;
}> = ({ visible, onClose, conversations, onSelect, loading, activeId }) => (
    <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.historyOverlay}>
            <View style={styles.historySheet}>
                <View style={styles.historyHandle} />
                <View style={styles.historyHeader}>
                    <Text style={styles.historyTitle}>Historial de conversaciones</Text>
                    <TouchableOpacity onPress={onClose} style={styles.historyClose}>
                        <MaterialCommunityIcons name="close" size={22} color="#9ca3af" />
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View style={styles.historyCentered}>
                        <ActivityIndicator color="#4ade80" size="large" />
                        <Text style={styles.historyLoadingText}>Cargando...</Text>
                    </View>
                ) : conversations.length === 0 ? (
                    <View style={styles.historyCentered}>
                        <MaterialCommunityIcons name="chat-outline" size={44} color="#374151" />
                        <Text style={styles.historyEmptyText}>Sin conversaciones anteriores</Text>
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
                                    color={c.id === activeId ? '#4ade80' : '#6b7280'}
                                />
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={styles.historyItemTitle} numberOfLines={2}>{c.tema}</Text>
                                    {c.fecha && (
                                        <Text style={styles.historyItemDate}>
                                            {new Date(c.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                    )}
                                </View>
                                {c.estado !== 'activa' && (
                                    <View style={styles.historyClosedBadge}>
                                        <Text style={styles.historyClosedText}>Cerrada</Text>
                                    </View>
                                )}
                                <MaterialCommunityIcons name="chevron-right" size={18} color="#374151" />
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}
            </View>
        </View>
    </Modal>
);

// ══════════════════════════════════════════════════════════════
//  PANTALLA PRINCIPAL
// ══════════════════════════════════════════════════════════════

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
    const tabAnim = useRef(new Animated.Value(0)).current;
    const headerGlow = useRef(new Animated.Value(0)).current;

    const modeConfig = MODE_CONFIG[mode];

    // Mensaje de bienvenida al cambiar modo
    useEffect(() => {
        const welcomeMessages: Record<ChatMode, string> = {
            chat: '👋 ¡Hola! Soy tu asistente de horticultura. Pregúntame lo que necesites sobre tu huerto.',
            cultivos: '🌽 Modo **Recomendación de Cultivos** activado.\n\nEscribe el nombre de tu municipio y el modelo de IA (Random Forest + datos climáticos) te recomendará los mejores cultivos para tu zona.',
            plagas: '🐛 Modo **Detección de Plagas** activado.\n\nPega la URL pública de una foto de tu planta y el modelo YOLOv8 de visión artificial analizará la imagen para detectar posibles plagas.',
        };
        const welcome: Message = {
            id: `welcome-${mode}-${Date.now()}`,
            text: welcomeMessages[mode],
            sender: 'ai',
            type: 'system',
            timestamp: new Date(),
        };
        setMessages([welcome]);
        setConvId(null);
        setInputText('');
    }, [mode]);

    // Animación continua del glow del header
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(headerGlow, { toValue: 1, duration: 2000, useNativeDriver: true }),
                Animated.timing(headerGlow, { toValue: 0, duration: 2000, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    // Animación de cambio de tab
    const handleModeChange = (newMode: ChatMode) => {
        if (newMode === mode) return;
        Animated.spring(tabAnim, { toValue: ['chat', 'cultivos', 'plagas'].indexOf(newMode), useNativeDriver: false, friction: 7, tension: 50 }).start();
        setMode(newMode);
    };

    const scrollToBottom = useCallback(() => {
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    }, []);

    const addMessage = useCallback((msg: Omit<Message, 'id' | 'timestamp'>) => {
        setMessages(prev => [...prev, { ...msg, id: `${Date.now()}-${Math.random()}`, timestamp: new Date() }]);
        scrollToBottom();
    }, [scrollToBottom]);

    // ── Cargar historial ──
    const loadHistory = useCallback(async () => {
        setHistoryLoading(true);
        try {
            const data = await chatbotService.listConversaciones(0, 30);
            setConversations(data);
        } catch (e) {
            console.warn('[Chat] Error cargando historial:', e);
        } finally {
            setHistoryLoading(false);
        }
    }, []);

    // ── Cargar conversación del historial ──
    const loadConversation = useCallback(async (conv: ConversacionOut) => {
        try {
            const msgs = await chatbotService.listMensajes(conv.id);
            const uiMsgs: Message[] = msgs.map((m: MensajeOut) => ({
                id: m.id,
                text: m.contenido,
                sender: m.rol === 'user' ? 'user' : 'ai',
                type: 'text',
                timestamp: m.fecha ? new Date(m.fecha) : new Date(),
            }));
            setMessages(uiMsgs);
            setConvId(conv.id);
            setHistoryVisible(false);
            scrollToBottom();
        } catch (e: any) {
            Alert.alert('Error', e?.message || 'No se pudieron cargar los mensajes.');
        }
    }, [scrollToBottom]);

    // ── Nuevo chat ──
    const startNewChat = useCallback(() => {
        setMessages([]);
        setConvId(null);
        setInputText('');
        handleModeChange('chat');
    }, []);

    // ── Persistir mensaje en la API ──
    const persistMessage = useCallback(async (texto: string, rol: 'user' | 'assistant', currentConvId: string | null): Promise<string | null> => {
        try {
            let id = currentConvId;
            if (!id) {
                const tema = texto.length > 60 ? texto.substring(0, 60) + '...' : texto;
                const conv = await chatbotService.createConversacion({ tema });
                id = conv.id;
                setConvId(id);
            }
            await chatbotService.createMensaje(id, { contenido: texto, rol });
            return id;
        } catch (e) {
            console.warn('[Chat] Error persistiendo mensaje:', e);
            return currentConvId;
        }
    }, []);

    // ══════════════════════════════════════════════════
    //  ENVÍO DE MENSAJE — lógica según modo
    // ══════════════════════════════════════════════════

    const handleSend = useCallback(async () => {
        const text = inputText.trim();
        if (!text || isTyping) return;

        setInputText('');
        setIsTyping(true);

        // Mostrar mensaje del usuario
        addMessage({ text, sender: 'user', type: 'text' });

        let currentConvId = convId;

        try {
            // ── Modo Cultivos: llama al modelo Random Forest ──
            if (mode === 'cultivos') {
                currentConvId = await persistMessage(text, 'user', currentConvId) ?? currentConvId;

                const municipio = text;
                // Coordenadas por defecto de Xalapa (el frontend puede mejorar esto con geolocalización)
                const response = await aiModelService.recommendGarden({
                    lat: 19.5312,
                    lon: -96.9276,
                    municipio,
                });
                const cultivos = extractCultivos(response);
                const aiText = cultivos.length > 0
                    ? `✅ Encontré ${cultivos.length} cultivos recomendados para ${municipio}`
                    : `No encontré recomendaciones específicas para "${municipio}". Intenta con otro municipio.`;

                addMessage({ text: aiText, sender: 'ai', type: 'cultivos_result', cultivosData: cultivos, municipio });
                currentConvId = await persistMessage(aiText, 'assistant', currentConvId) ?? currentConvId;
            }

            // ── Modo Plagas: llama al modelo YOLOv8 ──
            else if (mode === 'plagas') {
                if (!text.startsWith('http')) {
                    addMessage({ text: '⚠️ Por favor pega una URL válida de imagen (debe comenzar con https://...)', sender: 'ai', type: 'error' });
                    return;
                }
                currentConvId = await persistMessage(`Analizar imagen: ${text}`, 'user', currentConvId) ?? currentConvId;

                const response = await aiModelService.detectPest({ imagen_url: text });
                const plagas = extractPlagas(response);
                const aiText = plagas.length > 0
                    ? `🐛 Se detectaron ${plagas.length} posibles plagas en la imagen`
                    : '✅ No se detectaron plagas en la imagen analizada';

                addMessage({ text: aiText, sender: 'ai', type: 'plagas_result', plagasData: plagas, imagenUrl: text });
                currentConvId = await persistMessage(aiText, 'assistant', currentConvId) ?? currentConvId;
            }

            // ── Modo Chat: asistente general ──
            else {
                currentConvId = await persistMessage(text, 'user', currentConvId) ?? currentConvId;
                const reply = getAssistantResponse(text);
                addMessage({ text: reply, sender: 'ai', type: 'text' });
                currentConvId = await persistMessage(reply, 'assistant', currentConvId) ?? currentConvId;
            }

        } catch (error: any) {
            console.error('[Chat] Error:', error);
            const errMsg = error?.response?.data?.detail || error?.message || 'Error al conectar con el servidor. Verifica tu conexión.';
            addMessage({ text: `❌ ${errMsg}`, sender: 'ai', type: 'error' });
        } finally {
            setIsTyping(false);
            scrollToBottom();
        }
    }, [inputText, isTyping, mode, convId, addMessage, persistMessage, scrollToBottom]);

    // ══════════════════════════════════════════════════
    //  RENDER
    // ══════════════════════════════════════════════════

    const accentColor = modeConfig.accent;
    const tabWidth = (width - 48) / 3;

    return (
        <View style={styles.root}>
            <StatusBar style="light" />
            <LinearGradient colors={['#030d07', '#061408', '#040c07']} style={StyleSheet.absoluteFill} />

            {/* HEADER */}
            <View style={[styles.header, { paddingTop: STATUSBAR_HEIGHT + 12 }]}>
                <Animated.View style={[styles.headerGlow, { opacity: headerGlow.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.8] }), backgroundColor: accentColor }]} />
                <View style={styles.headerContent}>
                    <View style={styles.headerLeft}>
                        <LinearGradient colors={[accentColor + '44', accentColor + '22']} style={styles.headerIconBg}>
                            <MaterialCommunityIcons name="robot-outline" size={20} color={accentColor} />
                        </LinearGradient>
                        <View>
                            <Text style={styles.headerTitle}>HuertoConnect IA</Text>
                            <View style={styles.statusRow}>
                                <View style={[styles.statusDot, { backgroundColor: '#4ade80' }]} />
                                <Text style={styles.statusText}>Modelos activos</Text>
                            </View>
                        </View>
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity style={styles.headerBtn} onPress={startNewChat}>
                            <MaterialCommunityIcons name="chat-plus-outline" size={20} color={accentColor} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.headerBtn} onPress={() => { loadHistory(); setHistoryVisible(true); }}>
                            <MaterialCommunityIcons name="history" size={20} color="#9ca3af" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* SELECTOR DE MODO */}
                <View style={styles.tabContainer}>
                    <Animated.View style={[
                        styles.tabIndicator,
                        { width: tabWidth - 8, backgroundColor: accentColor + '33', borderColor: accentColor + '88' },
                        { transform: [{ translateX: tabAnim.interpolate({ inputRange: [0, 1, 2], outputRange: [4, tabWidth + 4, tabWidth * 2 + 4] }) }] }
                    ]} />
                    {(['chat', 'cultivos', 'plagas'] as ChatMode[]).map(m => {
                        const cfg = MODE_CONFIG[m];
                        const isActive = mode === m;
                        return (
                            <TouchableOpacity
                                key={m}
                                style={[styles.tab, { width: tabWidth }]}
                                onPress={() => handleModeChange(m)}
                                activeOpacity={0.7}
                            >
                                <MaterialCommunityIcons
                                    name={cfg.icon}
                                    size={16}
                                    color={isActive ? accentColor : '#6b7280'}
                                />
                                <Text style={[styles.tabLabel, { color: isActive ? accentColor : '#6b7280' }]}>
                                    {cfg.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            {/* HINT CONTEXTUAL */}
            <View style={[styles.hintBar, { borderColor: accentColor + '22' }]}>
                <MaterialCommunityIcons name="information-outline" size={13} color={accentColor + 'AA'} />
                <Text style={[styles.hintText, { color: accentColor + 'AA' }]}>{modeConfig.hint}</Text>
            </View>

            {/* MENSAJES */}
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <ScrollView
                    ref={scrollRef}
                    style={styles.messageList}
                    contentContainerStyle={styles.messageListContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {messages.map(msg => (
                        <MessageBubble key={msg.id} msg={msg} accentColor={accentColor} />
                    ))}
                    {isTyping && <TypingIndicator color={accentColor} />}
                </ScrollView>

                {/* INPUT */}
                <View style={[styles.inputContainer, { borderTopColor: accentColor + '22' }]}>
                    <View style={[styles.inputWrapper, { borderColor: accentColor + '44' }]}>
                        <MaterialCommunityIcons
                            name={mode === 'cultivos' ? 'map-marker-outline' : mode === 'plagas' ? 'link-variant' : 'message-text-outline'}
                            size={18}
                            color={accentColor + 'AA'}
                            style={styles.inputIcon}
                        />
                        <TextInput
                            style={[styles.input, { color: '#f0fdf4' }]}
                            placeholder={modeConfig.inputPlaceholder}
                            placeholderTextColor="#4b5563"
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                            maxLength={500}
                            onSubmitEditing={handleSend}
                            blurOnSubmit={false}
                        />
                        <TouchableOpacity
                            style={[styles.sendBtn, { backgroundColor: accentColor, opacity: (!inputText.trim() || isTyping) ? 0.4 : 1 }]}
                            onPress={handleSend}
                            disabled={!inputText.trim() || isTyping}
                        >
                            {isTyping
                                ? <ActivityIndicator size="small" color="#000" />
                                : <MaterialCommunityIcons name="send" size={18} color="#000" />
                            }
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>

            {/* MODAL HISTORIAL */}
            <HistoryModal
                visible={historyVisible}
                onClose={() => setHistoryVisible(false)}
                conversations={conversations}
                onSelect={loadConversation}
                loading={historyLoading}
                activeId={convId ?? undefined}
            />
        </View>
    );
};

// ══════════════════════════════════════════════════════════════
//  ESTILOS
// ══════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#030d07' },

    // Header
    header: {
        backgroundColor: 'rgba(6, 20, 8, 0.97)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(74, 222, 128, 0.1)',
        paddingHorizontal: 16,
        paddingBottom: 0,
        overflow: 'hidden',
    },
    headerGlow: {
        position: 'absolute',
        top: 0, left: '20%', right: '20%',
        height: 1,
        borderRadius: 2,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 12,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    headerIconBg: {
        width: 40, height: 40, borderRadius: 20,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: 'rgba(74,222,128,0.2)',
    },
    headerTitle: { fontSize: 16, fontWeight: '700', color: '#f0fdf4' },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusText: { fontSize: 11, color: '#6b7280' },
    headerActions: { flexDirection: 'row', gap: 4 },
    headerBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center', justifyContent: 'center',
    },

    // Tabs de modo
    tabContainer: {
        flexDirection: 'row',
        height: 44,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 12,
        marginBottom: 12,
        padding: 4,
        position: 'relative',
    },
    tabIndicator: {
        position: 'absolute',
        top: 4, bottom: 4,
        borderRadius: 9,
        borderWidth: 1,
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        zIndex: 1,
    },
    tabLabel: { fontSize: 12, fontWeight: '600' },

    // Hint bar
    hintBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 7,
        borderBottomWidth: 1,
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    hintText: { fontSize: 11, flex: 1 },

    // Mensajes
    messageList: { flex: 1 },
    messageListContent: { paddingHorizontal: 14, paddingVertical: 16, gap: 10 },

    msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, maxWidth: '100%' },
    msgRowUser: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
    msgRowAI: { alignSelf: 'flex-start' },

    aiAvatar: {
        width: 30, height: 30, borderRadius: 15,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, flexShrink: 0,
    },
    userAvatar: {
        width: 30, height: 30, borderRadius: 15,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, flexShrink: 0,
    },
    msgContent: { maxWidth: width * 0.72, gap: 4 },

    msgBubble: {
        borderRadius: 18,
        paddingHorizontal: 14,
        paddingVertical: 10,
        overflow: 'hidden',
        position: 'relative',
    },
    userBubble: {
        borderBottomRightRadius: 4,
        borderWidth: 1,
    },
    aiBubble: {
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    errorBubble: {
        backgroundColor: 'rgba(239,68,68,0.12)',
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(239,68,68,0.3)',
    },
    msgText: { fontSize: 14, lineHeight: 20 },
    userMsgText: { color: '#000', fontWeight: '500' },
    aiMsgText: { color: '#e2f5e9' },
    msgTime: { fontSize: 10 },
    userMsgTime: { color: 'rgba(255,255,255,0.35)', textAlign: 'right' },
    aiMsgTime: { color: '#4b5563', textAlign: 'left' },

    // Typing
    typingRow: { alignSelf: 'flex-start', paddingLeft: 38 },
    typingBubble: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderWidth: 1,
        gap: 4,
    },
    typingDots: { flexDirection: 'row', gap: 4, alignItems: 'center' },
    typingDot: { width: 6, height: 6, borderRadius: 3 },
    typingLabel: { fontSize: 12, marginLeft: 4 },

    // Tarjeta resultado IA
    resultCard: {
        backgroundColor: 'rgba(20, 83, 45, 0.25)',
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: 'rgba(74, 222, 128, 0.2)',
        maxWidth: width * 0.78,
        gap: 10,
    },
    resultCardPlagas: {
        backgroundColor: 'rgba(120, 53, 15, 0.25)',
        borderColor: 'rgba(251, 191, 36, 0.2)',
    },
    resultCardHeader: { flexDirection: 'row', alignItems: 'center' },
    resultCardIcon: {
        width: 36, height: 36, borderRadius: 10,
        alignItems: 'center', justifyContent: 'center',
    },
    resultCardTitle: { fontSize: 13, fontWeight: '700', color: '#86efac' },
    resultCardSubtitle: { fontSize: 10, color: '#6b7280', marginTop: 1 },
    resultCardEmpty: { fontSize: 13, color: '#6b7280', textAlign: 'center', paddingVertical: 8 },

    resultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 10,
        padding: 10,
        gap: 10,
    },
    resultItemLeft: {
        width: 24, height: 24, borderRadius: 12,
        backgroundColor: 'rgba(74, 222, 128, 0.15)',
        alignItems: 'center', justifyContent: 'center',
    },
    resultItemNumber: { fontSize: 11, fontWeight: '700', color: '#4ade80' },
    resultItemContent: { flex: 1 },
    resultItemName: { fontSize: 13, fontWeight: '600', color: '#d1fae5' },
    resultItemDesc: { fontSize: 11, color: '#6b7280', marginTop: 2 },
    resultItemMeta: { fontSize: 10, color: '#4b5563', marginTop: 2 },
    resultItemBadge: {
        backgroundColor: 'rgba(74, 222, 128, 0.15)',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    resultItemBadgeText: { fontSize: 11, color: '#4ade80', fontWeight: '600' },

    // Plagas
    plagaImage: { width: '100%', height: 140, borderRadius: 10, marginVertical: 4 },
    plagasEmptyContainer: { alignItems: 'center', gap: 8, paddingVertical: 8 },
    plagasEmptyText: { fontSize: 13, color: '#4ade80', textAlign: 'center' },
    plagaItem: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 10,
        padding: 10,
        gap: 8,
    },
    plagaItemHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    plagaItemName: { flex: 1, fontSize: 13, fontWeight: '600', color: '#fde68a' },
    plagaConf: { fontSize: 12, color: '#fbbf24', fontWeight: '700' },
    confBar: {
        height: 4, backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 2, overflow: 'hidden',
    },
    confBarFill: { height: 4, borderRadius: 2 },
    plagaTratamiento: { fontSize: 11, color: '#9ca3af' },

    // Input
    inputContainer: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        backgroundColor: 'rgba(3, 13, 7, 0.98)',
        borderTopWidth: 1,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 24,
        borderWidth: 1,
        paddingLeft: 12,
        paddingRight: 6,
        paddingVertical: 6,
        gap: 8,
    },
    inputIcon: { paddingBottom: 4 },
    input: {
        flex: 1,
        fontSize: 14,
        maxHeight: 100,
        paddingVertical: 4,
        lineHeight: 20,
    },
    sendBtn: {
        width: 36, height: 36, borderRadius: 18,
        alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
    },

    // Historial modal
    historyOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.75)',
        justifyContent: 'flex-end',
    },
    historySheet: {
        backgroundColor: '#0d1f12',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingBottom: 30,
        maxHeight: height * 0.75,
        borderTopWidth: 1,
        borderColor: 'rgba(74, 222, 128, 0.15)',
    },
    historyHandle: {
        width: 40, height: 4, borderRadius: 2,
        backgroundColor: '#374151',
        alignSelf: 'center',
        marginTop: 12, marginBottom: 16,
    },
    historyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    historyTitle: { fontSize: 16, fontWeight: '700', color: '#f0fdf4' },
    historyClose: {
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.06)',
        alignItems: 'center', justifyContent: 'center',
    },
    historyCentered: { alignItems: 'center', paddingVertical: 40, gap: 12 },
    historyLoadingText: { fontSize: 13, color: '#6b7280' },
    historyEmptyText: { fontSize: 14, color: '#4b5563', textAlign: 'center' },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 12,
        padding: 14,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        gap: 0,
    },
    historyItemActive: {
        borderColor: 'rgba(74, 222, 128, 0.35)',
        backgroundColor: 'rgba(74, 222, 128, 0.06)',
    },
    historyItemTitle: { fontSize: 13, color: '#d1fae5', fontWeight: '500' },
    historyItemDate: { fontSize: 11, color: '#6b7280', marginTop: 3 },
    historyClosedBadge: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginRight: 6,
    },
    historyClosedText: { fontSize: 10, color: '#6b7280' },
});

export default AIChatScreen;
