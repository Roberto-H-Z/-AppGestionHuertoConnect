/**
 * AIChatScreen — Asistente IA de HuertoConnect
 *
 * 3 modos de operación:
 *   🤖 Asistente General  → Texto libre + respuestas inteligentes
 *   🌽 Cultivos           → POST /huertos/recomendar (Random Forest + Clima)
 *   🐛 Plagas             → POST /plagas/detectar    (YOLOv8)
 *
 * Colorimetría: alineada con el resto de la app (#F1F8E9, #4CAF50, #1B5E20, #fff)
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

const { width } = Dimensions.get('window');

// ══════════════════════════════════════════════════════
//  TIPOS
// ══════════════════════════════════════════════════════

type ChatMode = 'chat' | 'cultivos' | 'plagas';
type MessageType = 'text' | 'cultivos_result' | 'plagas_result' | 'error' | 'system';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    type: MessageType;
    timestamp: Date;
    cultivosData?: CultivoRecomendado[];
    plagasData?: PlagaDetectada[];
    imagenUrl?: string;
    municipio?: string;
}

// ══════════════════════════════════════════════════════
//  CONFIGURACIÓN DE MODOS
// ══════════════════════════════════════════════════════

const MODE_CONFIG = {
    chat: {
        label: 'Asistente',
        icon: 'robot-outline' as const,
        color: '#4CAF50',
        bg: '#E8F5E9',
        placeholder: 'Escribe tu pregunta sobre el huerto...',
        hint: 'Pregúntame sobre riego, plagas, cultivos o fertilización',
    },
    cultivos: {
        label: 'Cultivos IA',
        icon: 'sprout-outline' as const,
        color: '#2E7D32',
        bg: '#F1F8E9',
        placeholder: 'Escribe tu municipio (ej: Xalapa)...',
        hint: 'El modelo Random Forest analizará el clima de tu zona',
    },
    plagas: {
        label: 'Detectar Plaga',
        icon: 'bug-outline' as const,
        color: '#F57F17',
        bg: '#FFF8E1',
        placeholder: 'Pega la URL pública de tu foto de planta...',
        hint: 'El modelo YOLOv8 detectará plagas en la imagen',
    },
};

// ══════════════════════════════════════════════════════
//  RESPUESTAS DEL ASISTENTE GENERAL
// ══════════════════════════════════════════════════════

const getAssistantResponse = (input: string): string => {
    const n = input.toLowerCase();
    if (n.includes('hojas plateadas') || n.includes('trips') || n.includes('puntos negros'))
        return 'Los síntomas coinciden con presencia de trips. Las zonas plateadas aparecen por daño al tejido y los puntos negros son sus excrementos.\n\nAcciones recomendadas:\n• Revisa el envés de las hojas con una lupa\n• Retira las hojas muy afectadas\n• Coloca trampas adhesivas azules o amarillas\n• Aplica jabón potásico al atardecer';
    if (n.includes('riego') || n.includes('regar'))
        return 'Guía de riego:\n\n• Riega temprano por la mañana\n• Dirige el agua a la base de la planta\n• Revisa los 2-3 cm superiores del suelo antes de regar\n• Prefiere riegos profundos y espaciados';
    if (n.includes('plaga') || n.includes('pulgón') || n.includes('mosca blanca'))
        return 'Para identificar la plaga:\n\n• Revisa el envés de las hojas\n• Busca huevos, larvas o excrementos\n\nManejo inicial:\n• Retira las partes muy afectadas\n• Usa trampas adhesivas amarillas\n• Aplica jabón potásico al atardecer';
    if (n.includes('tomate') || n.includes('jitomate'))
        return 'Cultivo de tomate:\n\n• Necesita 6-8 horas de sol directo\n• Suelo con buen drenaje\n• Riego profundo sin mojar las hojas\n• Elimina hojas que toquen el suelo';
    if (n.includes('abono') || n.includes('fertilizante') || n.includes('compost'))
        return 'Fertilización orgánica:\n\n• Comienza con compost maduro o humus de lombriz\n• Aplica alrededor de la planta sin tocar el tallo\n• Cantidades moderadas al principio\n• Demasiado nitrógeno = muchas hojas, pocos frutos';
    if (n.includes('clima') || n.includes('temperatura'))
        return 'Para recomendaciones personalizadas según tu clima, usa el modo "Cultivos IA" — el modelo analizará las condiciones meteorológicas de tu municipio.';
    return 'Soy el asistente IA de HuertoConnect. Puedo ayudarte con:\n\n• Riego y nutrición de plantas\n• Identificación de plagas\n• Selección de cultivos\n• Clima y temporadas de siembra\n\nO usa los modos especializados arriba para análisis con inteligencia artificial real.';
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
        <Animated.View key={key} style={[
            styles.typingDot,
            { transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }) }] }
        ]} />
    );

    return (
        <View style={styles.typingRow}>
            <View style={styles.aiAvatarSmall}>
                <MaterialCommunityIcons name="robot-outline" size={14} color="#4CAF50" />
            </View>
            <View style={styles.typingBubble}>
                {dot(d1, 'a')}{dot(d2, 'b')}{dot(d3, 'c')}
            </View>
        </View>
    );
};

// ══════════════════════════════════════════════════════
//  TARJETA CULTIVOS (resultado Random Forest)
// ══════════════════════════════════════════════════════

const CultivosCard: React.FC<{ cultivos: CultivoRecomendado[]; municipio?: string }> = ({ cultivos, municipio }) => (
    <View style={styles.resultCard}>
        <View style={styles.resultCardHeader}>
            <View style={styles.resultCardIconGreen}>
                <MaterialCommunityIcons name="sprout" size={16} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.resultCardTitle}>Cultivos Recomendados</Text>
                {municipio ? (
                    <Text style={styles.resultCardSub}>Para {municipio} · Modelo Random Forest</Text>
                ) : null}
            </View>
        </View>

        {cultivos.length === 0 ? (
            <Text style={styles.resultEmpty}>No se encontraron recomendaciones para esta zona.</Text>
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
//  TARJETA PLAGAS (resultado YOLOv8)
// ══════════════════════════════════════════════════════

const PlagasCard: React.FC<{ plagas: PlagaDetectada[]; imagenUrl?: string }> = ({ plagas, imagenUrl }) => (
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
                <MaterialCommunityIcons name="shield-check-outline" size={28} color="#4CAF50" />
                <Text style={styles.plagaOkText}>No se detectaron plagas en la imagen</Text>
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
                    {p.tratamiento ? (
                        <Text style={styles.plagaTratamiento}>Tratamiento: {String(p.tratamiento)}</Text>
                    ) : null}
                </View>
            );
        })}
    </View>
);

// ══════════════════════════════════════════════════════
//  BURBUJA DE MENSAJE
// ══════════════════════════════════════════════════════

const MessageBubble: React.FC<{ msg: Message; accentColor: string }> = ({ msg, accentColor }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(msg.sender === 'user' ? 16 : -16)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
            Animated.spring(slideAnim, { toValue: 0, friction: 9, tension: 100, useNativeDriver: true }),
        ]).start();
    }, []);

    const isUser = msg.sender === 'user';
    const time = msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

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
                {/* Tarjetas especiales IA */}
                {msg.type === 'cultivos_result' && msg.cultivosData && (
                    <CultivosCard cultivos={msg.cultivosData} municipio={msg.municipio} />
                )}
                {msg.type === 'plagas_result' && msg.plagasData && (
                    <PlagasCard plagas={msg.plagasData} imagenUrl={msg.imagenUrl} />
                )}
                {/* Burbuja de texto */}
                {(msg.type === 'text' || msg.type === 'error' || msg.type === 'system') && (
                    <View style={[
                        styles.msgBubble,
                        isUser ? [styles.userBubble, { backgroundColor: accentColor }] : styles.aiBubble,
                        msg.type === 'error' && styles.errorBubble,
                    ]}>
                        <Text style={[styles.msgText, isUser ? styles.userMsgText : styles.aiMsgText]}>
                            {msg.text}
                        </Text>
                    </View>
                )}
                <Text style={[styles.msgTime, isUser && { textAlign: 'right' }]}>{time}</Text>
            </View>

            {isUser && (
                <View style={[styles.aiAvatarSmall, { backgroundColor: accentColor + '22', borderColor: accentColor + '55', marginBottom: 18 }]}>
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
                    <Text style={styles.modalTitle}>Historial</Text>
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

    // Mensaje de bienvenida al cambiar modo
    useEffect(() => {
        const welcomes: Record<ChatMode, string> = {
            chat: '¡Hola! Soy tu asistente de horticultura. Pregúntame lo que necesites sobre tu huerto: riego, plagas, cultivos o fertilización.',
            cultivos: 'Modo Recomendación de Cultivos activado.\n\nEscribe el nombre de tu municipio y el modelo de IA (Random Forest + datos climáticos) te recomendará los mejores cultivos para tu zona.',
            plagas: 'Modo Detección de Plagas activado.\n\nPega la URL pública de una foto de tu planta y el modelo YOLOv8 de visión artificial detectará posibles plagas.',
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
        } catch {
            return currentId;
        }
    }, []);

    const loadHistory = useCallback(async () => {
        setHistoryLoading(true);
        try {
            const data = await chatbotService.listConversaciones(0, 30);
            setConversations(data);
        } catch { /* silent */ } finally {
            setHistoryLoading(false);
        }
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

    // ── ENVÍO DE MENSAJE ──────────────────────────────
    const handleSend = useCallback(async () => {
        const text = inputText.trim();
        if (!text || isTyping) return;

        setInputText('');
        setIsTyping(true);
        addMessage({ text, sender: 'user', type: 'text' });
        let currentId = convId;

        try {
            if (mode === 'cultivos') {
                currentId = await persistMessage(text, 'user', currentId) ?? currentId;
                const response = await aiModelService.recommendGarden({ lat: 19.5312, lon: -96.9276, municipio: text });
                const cultivos = extractCultivos(response);
                const reply = cultivos.length > 0
                    ? `Encontré ${cultivos.length} cultivos recomendados para ${text}`
                    : `No encontré recomendaciones específicas para "${text}". Intenta con otro municipio.`;
                addMessage({ text: reply, sender: 'ai', type: 'cultivos_result', cultivosData: cultivos, municipio: text });
                await persistMessage(reply, 'assistant', currentId);

            } else if (mode === 'plagas') {
                if (!text.startsWith('http')) {
                    addMessage({ text: 'Por favor pega una URL válida de imagen (debe comenzar con https://...)', sender: 'ai', type: 'error' });
                    return;
                }
                currentId = await persistMessage(`Analizar imagen: ${text}`, 'user', currentId) ?? currentId;
                const response = await aiModelService.detectPest({ imagen_url: text });
                const plagas = extractPlagas(response);
                const reply = plagas.length > 0
                    ? `Se detectaron ${plagas.length} posibles plagas en la imagen`
                    : 'No se detectaron plagas en la imagen analizada';
                addMessage({ text: reply, sender: 'ai', type: 'plagas_result', plagasData: plagas, imagenUrl: text });
                await persistMessage(reply, 'assistant', currentId);

            } else {
                currentId = await persistMessage(text, 'user', currentId) ?? currentId;
                const reply = getAssistantResponse(text);
                addMessage({ text: reply, sender: 'ai', type: 'text' });
                await persistMessage(reply, 'assistant', currentId);
            }

        } catch (error: any) {
            const msg = error?.response?.data?.detail || error?.message || 'Error al conectar con el servidor.';
            addMessage({ text: msg, sender: 'ai', type: 'error' });
        } finally {
            setIsTyping(false);
            scrollToBottom();
        }
    }, [inputText, isTyping, mode, convId, addMessage, persistMessage, scrollToBottom]);

    // ── RENDER ────────────────────────────────────────

    return (
        <SafeAreaView style={styles.root}>
            <StatusBar style="dark" />

            {/* ── HEADER ── */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={styles.headerIconBg}>
                        <MaterialCommunityIcons name="robot-outline" size={22} color="#4CAF50" />
                    </View>
                    <View>
                        <Text style={styles.headerTitle}>HuertoConnect IA</Text>
                        <View style={styles.headerStatus}>
                            <View style={styles.statusDot} />
                            <Text style={styles.statusLabel}>Modelos activos</Text>
                        </View>
                    </View>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity
                        style={styles.headerBtn}
                        onPress={() => {
                            setMessages([]);
                            setConvId(null);
                            setMode('chat');
                        }}
                    >
                        <MaterialCommunityIcons name="chat-plus-outline" size={20} color="#4CAF50" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.headerBtn}
                        onPress={() => { loadHistory(); setHistoryVisible(true); }}
                    >
                        <MaterialCommunityIcons name="history" size={20} color="#757575" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* ── SELECTOR DE MODO ── */}
            <View style={styles.modeBar}>
                {(['chat', 'cultivos', 'plagas'] as ChatMode[]).map(m => {
                    const cfg = MODE_CONFIG[m];
                    const active = mode === m;
                    return (
                        <TouchableOpacity
                            key={m}
                            style={[styles.modeTab, active && { backgroundColor: cfg.color, borderColor: cfg.color }]}
                            onPress={() => setMode(m)}
                            activeOpacity={0.8}
                        >
                            <MaterialCommunityIcons
                                name={cfg.icon}
                                size={15}
                                color={active ? '#fff' : '#9E9E9E'}
                            />
                            <Text style={[styles.modeTabLabel, { color: active ? '#fff' : '#9E9E9E' }]}>
                                {cfg.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* ── HINT ── */}
            <View style={[styles.hintBar, { backgroundColor: modeConfig.bg }]}>
                <MaterialCommunityIcons name="information-outline" size={13} color={modeConfig.color} />
                <Text style={[styles.hintText, { color: modeConfig.color }]}>{modeConfig.hint}</Text>
            </View>

            {/* ── MENSAJES + INPUT ── */}
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <ScrollView
                    ref={scrollRef}
                    style={styles.msgList}
                    contentContainerStyle={styles.msgListContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {messages.map(msg => (
                        <MessageBubble key={msg.id} msg={msg} accentColor={modeConfig.color} />
                    ))}
                    {isTyping && <TypingIndicator />}
                    {/* Espacio extra para la barra de navegación */}
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
                            returnKeyType="send"
                            blurOnSubmit={false}
                        />
                        <TouchableOpacity
                            style={[
                                styles.sendBtn,
                                { backgroundColor: modeConfig.color },
                                (!inputText.trim() || isTyping) && styles.sendBtnDisabled,
                            ]}
                            onPress={handleSend}
                            disabled={!inputText.trim() || isTyping}
                            activeOpacity={0.8}
                        >
                            {isTyping
                                ? <ActivityIndicator size="small" color="#fff" />
                                : <MaterialCommunityIcons name="send" size={18} color="#fff" />
                            }
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>

            {/* ── HISTORIAL MODAL ── */}
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
//  ESTILOS — colorimetría de la app (#F1F8E9, #4CAF50, #1B5E20)
// ══════════════════════════════════════════════════════

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F1F8E9' },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E8F5E9',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    headerIconBg: {
        width: 42, height: 42, borderRadius: 21,
        backgroundColor: '#E8F5E9',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1.5, borderColor: '#C8E6C9',
    },
    headerTitle: { fontSize: 16, fontWeight: '700', color: '#1B5E20' },
    headerStatus: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 1 },
    statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4CAF50' },
    statusLabel: { fontSize: 11, color: '#66BB6A' },
    headerActions: { flexDirection: 'row', gap: 6 },
    headerBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: '#F5F5F5',
        alignItems: 'center', justifyContent: 'center',
    },

    // Selector de modo
    modeBar: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        paddingHorizontal: 12,
        paddingVertical: 10,
        gap: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E8F5E9',
    },
    modeTab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: '#F5F5F5',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    modeTabLabel: { fontSize: 11, fontWeight: '700' },

    // Hint
    hintBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
    },
    hintText: { fontSize: 11, flex: 1, fontWeight: '500' },

    // Lista de mensajes
    msgList: { flex: 1, backgroundColor: '#F8FDF8' },
    msgListContent: {
        paddingHorizontal: 12,
        paddingTop: 12,
        paddingBottom: 8,
        gap: 8,
    },

    msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
    msgRowUser: { justifyContent: 'flex-end' },
    msgRowAI: { justifyContent: 'flex-start' },

    aiAvatarSmall: {
        width: 28, height: 28, borderRadius: 14,
        backgroundColor: '#E8F5E9',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: '#C8E6C9',
        flexShrink: 0,
    },
    msgContentWrapper: { flex: 1, maxWidth: width * 0.72, gap: 3 },

    msgBubble: {
        borderRadius: 18,
        paddingHorizontal: 14,
        paddingVertical: 10,
        maxWidth: '100%',
    },
    userBubble: { borderBottomRightRadius: 4 },
    aiBubble: {
        backgroundColor: '#fff',
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
    },
    errorBubble: {
        backgroundColor: '#FFF3E0',
        borderWidth: 1,
        borderColor: '#FFB74D',
        borderBottomLeftRadius: 4,
    },
    msgText: { fontSize: 14, lineHeight: 21 },
    userMsgText: { color: '#fff' },
    aiMsgText: { color: '#212121' },
    msgTime: { fontSize: 10, color: '#BDBDBD', marginTop: 1 },

    // Typing
    typingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    typingBubble: {
        flexDirection: 'row', gap: 4, alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 18, paddingHorizontal: 14, paddingVertical: 12,
        borderWidth: 1, borderColor: '#E0E0E0',
        elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2,
    },
    typingDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#4CAF50' },

    // Input bar — paddingBottom = tab bar height
    inputBar: {
        backgroundColor: '#fff',
        paddingHorizontal: 12,
        paddingTop: 10,
        paddingBottom: 90, // Espacio para la barra de navegación inferior
        borderTopWidth: 1,
        borderTopColor: '#E8F5E9',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        backgroundColor: '#F5F5F5',
        borderRadius: 24,
        borderWidth: 1.5,
        paddingLeft: 12,
        paddingRight: 6,
        paddingVertical: 6,
        gap: 8,
    },
    inputPrefixIcon: { paddingBottom: 3, flexShrink: 0 },
    input: {
        flex: 1,
        fontSize: 14,
        color: '#212121',
        maxHeight: 100,
        paddingVertical: 4,
        lineHeight: 20,
    },
    sendBtn: {
        width: 38, height: 38, borderRadius: 19,
        alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
    },
    sendBtnDisabled: { opacity: 0.4 },

    // Tarjetas de resultado IA
    resultCard: {
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: '#C8E6C9',
        gap: 10,
        elevation: 2,
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        maxWidth: width * 0.78,
    },
    resultCardPlagas: {
        borderColor: '#FFCC80',
        shadowColor: '#FF9800',
    },
    resultCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    resultCardIconGreen: {
        width: 34, height: 34, borderRadius: 10,
        backgroundColor: '#4CAF50', alignItems: 'center', justifyContent: 'center',
    },
    resultCardIconOrange: {
        width: 34, height: 34, borderRadius: 10,
        backgroundColor: '#FF9800', alignItems: 'center', justifyContent: 'center',
    },
    resultCardTitle: { fontSize: 13, fontWeight: '700', color: '#1B5E20' },
    resultCardSub: { fontSize: 10, color: '#9E9E9E', marginTop: 1 },
    resultEmpty: { fontSize: 12, color: '#9E9E9E', textAlign: 'center', paddingVertical: 8 },

    // Cultivos
    cultivoItem: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#F1F8E9', borderRadius: 10,
        padding: 10, gap: 10,
    },
    cultivoNumber: {
        width: 24, height: 24, borderRadius: 12,
        backgroundColor: '#C8E6C9', alignItems: 'center', justifyContent: 'center',
    },
    cultivoNumberText: { fontSize: 11, fontWeight: '700', color: '#2E7D32' },
    cultivoName: { fontSize: 13, fontWeight: '600', color: '#1B5E20' },
    cultivoDesc: { fontSize: 11, color: '#757575', marginTop: 2 },
    cultivoMeta: { fontSize: 10, color: '#9E9E9E', marginTop: 2 },
    confBadge: {
        backgroundColor: '#E8F5E9', borderRadius: 8,
        paddingHorizontal: 8, paddingVertical: 3,
    },
    confBadgeText: { fontSize: 11, fontWeight: '700', color: '#4CAF50' },

    // Plagas
    plagaPreview: { width: '100%', height: 130, borderRadius: 10 },
    plagaOk: { alignItems: 'center', gap: 6, paddingVertical: 6 },
    plagaOkText: { fontSize: 13, color: '#4CAF50', fontWeight: '500', textAlign: 'center' },
    plagaItem: {
        backgroundColor: '#FFF8E1', borderRadius: 10,
        padding: 10, gap: 6,
    },
    plagaItemHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    plagaName: { flex: 1, fontSize: 13, fontWeight: '600', color: '#E65100' },
    plagaConf: { fontSize: 12, color: '#FF9800', fontWeight: '700' },
    confBar: {
        height: 4, backgroundColor: '#E0E0E0',
        borderRadius: 2, overflow: 'hidden',
    },
    confBarFill: { height: 4, borderRadius: 2 },
    plagaTratamiento: { fontSize: 11, color: '#757575' },

    // Historial modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalSheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        paddingHorizontal: 20, paddingBottom: 30,
        maxHeight: '75%',
        borderTopWidth: 1, borderColor: '#E8F5E9',
    },
    modalHandle: {
        width: 40, height: 4, borderRadius: 2, backgroundColor: '#E0E0E0',
        alignSelf: 'center', marginTop: 12, marginBottom: 16,
    },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    modalTitle: { fontSize: 16, fontWeight: '700', color: '#1B5E20' },
    modalClose: {
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center',
    },
    modalCenter: { alignItems: 'center', paddingVertical: 40, gap: 10 },
    modalCenterText: { fontSize: 14, color: '#9E9E9E' },

    historyItem: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#F9F9F9', borderRadius: 12,
        padding: 14, marginBottom: 8,
        borderWidth: 1, borderColor: '#EEEEEE',
    },
    historyItemActive: { borderColor: '#A5D6A7', backgroundColor: '#F1F8E9' },
    historyItemTitle: { fontSize: 13, color: '#212121', fontWeight: '500' },
    historyItemDate: { fontSize: 11, color: '#9E9E9E', marginTop: 3 },
    closedBadge: {
        backgroundColor: '#F5F5F5', borderRadius: 6,
        paddingHorizontal: 6, paddingVertical: 2, marginRight: 6,
    },
    closedBadgeText: { fontSize: 10, color: '#9E9E9E' },
});

export default AIChatScreen;
