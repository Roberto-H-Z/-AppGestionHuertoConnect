/**
 * AIChatScreen — Premium AI assistant chat interface.
 * Connected to the production chatbot API:
 *   POST /chatbot/conversaciones          — Start a conversation
 *   POST /chatbot/conversaciones/{id}/mensajes  — Store messages
 *   GET  /chatbot/conversaciones          — List past conversations
 *   PATCH /chatbot/conversaciones/{id}/cerrar   — Close a conversation
 *
 * Keeps the futuristic design: animated typing indicator,
 * glassmorphism message bubbles, smooth entrance animations,
 * and a conversation history drawer.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
    chatbotService,
    ConversacionOut,
    MensajeOut,
} from '../services/chatbotService';

const { width } = Dimensions.get('window');

// ═══════════════════════════════════════════
// ██  TYPES
// ═══════════════════════════════════════════

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
}

const getAssistantResponse = (input: string): string => {
    const normalized = input.toLowerCase();

    if (
        normalized.includes('hojas plateadas') ||
        normalized.includes('puntos negros') ||
        normalized.includes('trips')
    ) {
        return 'Los síntomas coinciden con una posible presencia de trips. Las zonas plateadas aparecen por el daño al tejido y los puntos negros suelen ser sus excrementos. Revisa el envés con una lupa, retira las hojas muy afectadas y coloca trampas adhesivas azules o amarillas. Puedes aplicar jabón potásico o aceite de neem al atardecer, repitiendo según las indicaciones del producto.';
    }

    if (normalized.includes('riego') || normalized.includes('regar')) {
        return 'Riega temprano por la mañana y dirige el agua a la base de la planta. Comprueba primero los 2 o 3 cm superiores del suelo: si siguen húmedos, espera. Es mejor un riego profundo y espaciado que muchos riegos superficiales.';
    }

    if (
        normalized.includes('plaga') ||
        normalized.includes('pulgón') ||
        normalized.includes('mosca blanca')
    ) {
        return 'Revisa el envés de las hojas para identificar la plaga. Como manejo inicial, retira las partes muy afectadas, usa trampas adhesivas y aplica jabón potásico al atardecer. Evita mezclar tratamientos sin revisar antes las indicaciones del producto.';
    }

    if (normalized.includes('tomate') || normalized.includes('jitomate')) {
        return 'El tomate necesita entre 6 y 8 horas de sol, suelo con buen drenaje y riego profundo sin mojar demasiado las hojas. Mantén una humedad estable para reducir el agrietamiento y elimina hojas enfermas o que toquen el suelo.';
    }

    if (
        normalized.includes('abono') ||
        normalized.includes('fertilizante') ||
        normalized.includes('compost')
    ) {
        return 'Puedes comenzar con compost maduro o humus de lombriz alrededor de la planta, sin pegarlo al tallo. Aplica cantidades moderadas y observa la respuesta del cultivo; demasiado nitrógeno produce muchas hojas y pocos frutos.';
    }

    if (normalized.includes('clima') || normalized.includes('temperatura')) {
        return 'La recomendación depende del cultivo y de tu temperatura local. Protege las plantas del sol intenso del mediodía, vigila que el suelo no se seque con viento o calor y evita regar de noche cuando hay mucha humedad.';
    }

    return 'Puedo ayudarte con riego, plagas, cultivos, fertilización y clima. Cuéntame qué planta tienes, qué síntomas observas, desde cuándo aparecen y cómo la estás regando para darte una recomendación más precisa.';
};

// ═══════════════════════════════════════════
// ██  TYPING INDICATOR — animated dots
// ═══════════════════════════════════════════

const TypingIndicator: React.FC = () => {
    const dot1 = useRef(new Animated.Value(0)).current;
    const dot2 = useRef(new Animated.Value(0)).current;
    const dot3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animateDot = (dot: Animated.Value, delay: number) =>
            Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(dot, {
                        toValue: 1,
                        duration: 400,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: false,
                    }),
                    Animated.timing(dot, {
                        toValue: 0,
                        duration: 400,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: false,
                    }),
                ])
            );

        const a1 = animateDot(dot1, 0);
        const a2 = animateDot(dot2, 200);
        const a3 = animateDot(dot3, 400);
        a1.start(); a2.start(); a3.start();

        return () => { a1.stop(); a2.stop(); a3.stop(); };
    }, []);

    const renderDot = (anim: Animated.Value) => {
        const translateY = anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -6],
        });
        const opacity = anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.4, 1],
        });
        return (
            <Animated.View
                style={[
                    styles.typingDot,
                    { transform: [{ translateY }], opacity },
                ]}
            />
        );
    };

    return (
        <View style={styles.typingContainer}>
            <View style={styles.typingBubble}>
                <View style={styles.typingDots}>
                    {renderDot(dot1)}
                    {renderDot(dot2)}
                    {renderDot(dot3)}
                </View>
            </View>
        </View>
    );
};

// ═══════════════════════════════════════════
// ██  MESSAGE BUBBLE — with entrance animation
// ═══════════════════════════════════════════

const MessageBubble: React.FC<{ message: Message; index: number }> = ({ message, index }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(message.sender === 'user' ? 30 : -30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 350,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                friction: 8,
                tension: 65,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const isUser = message.sender === 'user';
    const timeStr = message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <Animated.View
            style={[
                styles.messageRow,
                isUser ? styles.messageRowUser : styles.messageRowAI,
                {
                    opacity: fadeAnim,
                    transform: [{ translateX: slideAnim }],
                },
            ]}
        >
            {/* AI avatar */}
            {!isUser && (
                <View style={styles.aiAvatar}>
                    <MaterialCommunityIcons name="robot-outline" size={18} color="#fff" />
                </View>
            )}

            <View style={[
                styles.messageBubble,
                isUser ? styles.userBubble : styles.aiBubble,
            ]}>
                <Text style={[
                    styles.messageText,
                    isUser ? styles.userText : styles.aiText,
                ]}>
                    {message.text}
                </Text>
                <Text style={[
                    styles.messageTime,
                    isUser ? styles.userTime : styles.aiTime,
                ]}>
                    {timeStr}
                </Text>
            </View>
        </Animated.View>
    );
};

// ═══════════════════════════════════════════
// ██  SUGGESTION CHIPS
// ═══════════════════════════════════════════

const suggestions = [
    { label: '💧 Riego', query: '¿Cómo debo regar mis cultivos?' },
    { label: '🐛 Plagas', query: '¿Cómo controlar plagas en mi huerto?' },
    { label: '🍅 Tomates', query: '¿Cómo cultivar tomates correctamente?' },
    { label: '🌱 Abono', query: '¿Qué abono debo usar para mi huerto?' },
    { label: '🌤️ Clima', query: '¿Cómo afecta el clima a mis cultivos?' },
];

// ═══════════════════════════════════════════
// ██  HEADER with subtle glow
// ═══════════════════════════════════════════

const ChatHeader: React.FC<{
    onNewChat: () => void;
    onShowHistory: () => void;
    hasActiveConversation: boolean;
}> = ({ onNewChat, onShowHistory, hasActiveConversation }) => {
    const glowAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, {
                    toValue: 1,
                    duration: 2000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: false,
                }),
                Animated.timing(glowAnim, {
                    toValue: 0,
                    duration: 2000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: false,
                }),
            ])
        ).start();
    }, []);

    const glowOpacity = glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.8],
    });

    return (
        <View style={styles.header}>
            <View style={styles.headerLeft}>
                <View style={styles.headerIconContainer}>
                    <View style={styles.headerIcon}>
                        <MaterialCommunityIcons name="robot-outline" size={22} color="#fff" />
                    </View>
                    <Animated.View style={[styles.headerIconGlow, { opacity: glowOpacity }]} />
                </View>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.headerTitle}>HuertoConnect IA</Text>
                    <View style={styles.statusRow}>
                        <View style={styles.statusDot} />
                        <Text style={styles.statusText}>En línea</Text>
                    </View>
                </View>
            </View>
            <View style={styles.headerActions}>
                {hasActiveConversation && (
                    <TouchableOpacity style={styles.headerAction} onPress={onNewChat}>
                        <MaterialCommunityIcons name="chat-plus-outline" size={22} color="#66BB6A" />
                    </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.headerAction} onPress={onShowHistory}>
                    <MaterialCommunityIcons name="history" size={22} color="#66BB6A" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

// ═══════════════════════════════════════════
// ██  EMPTY STATE — welcome message
// ═══════════════════════════════════════════

const WelcomeState: React.FC<{ onSuggestionPress: (q: string) => void }> = ({ onSuggestionPress }) => {
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 6,
                tension: 50,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <Animated.View style={[
            styles.welcomeContainer,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}>
            <View style={styles.welcomeIconOuter}>
                <View style={styles.welcomeIcon}>
                    <MaterialCommunityIcons name="robot-happy-outline" size={44} color="#fff" />
                </View>
            </View>
            <Text style={styles.welcomeTitle}>¡Hola! 👋</Text>
            <Text style={styles.welcomeSubtitle}>
                Soy tu asistente inteligente de HuertoConnect.{'\n'}
                Pregúntame sobre el cuidado de tu huerto.
            </Text>
            <Text style={styles.welcomeHint}>Prueba con alguna de estas opciones:</Text>
            <View style={styles.suggestionsGrid}>
                {suggestions.map((s, i) => (
                    <TouchableOpacity
                        key={i}
                        style={styles.suggestionChip}
                        onPress={() => onSuggestionPress(s.query)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.suggestionText}>{s.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </Animated.View>
    );
};

// ═══════════════════════════════════════════
// ██  CONVERSATION HISTORY MODAL
// ═══════════════════════════════════════════

const ConversationHistoryModal: React.FC<{
    visible: boolean;
    onClose: () => void;
    conversations: ConversacionOut[];
    onSelect: (conv: ConversacionOut) => void;
    isLoading: boolean;
    activeConvId?: string;
}> = ({ visible, onClose, conversations, onSelect, isLoading, activeConvId }) => {
    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.historyOverlay}>
                <View style={styles.historyContainer}>
                    {/* Header */}
                    <View style={styles.historyHeader}>
                        <Text style={styles.historyTitle}>Conversaciones</Text>
                        <TouchableOpacity onPress={onClose} style={styles.historyCloseBtn}>
                            <MaterialCommunityIcons name="close" size={22} color="#666" />
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    {isLoading ? (
                        <View style={styles.historyLoading}>
                            <ActivityIndicator size="large" color="#4CAF50" />
                            <Text style={styles.historyLoadingText}>Cargando conversaciones...</Text>
                        </View>
                    ) : conversations.length === 0 ? (
                        <View style={styles.historyEmpty}>
                            <MaterialCommunityIcons name="chat-outline" size={48} color="#C8E6C9" />
                            <Text style={styles.historyEmptyText}>No hay conversaciones previas</Text>
                        </View>
                    ) : (
                        <ScrollView style={styles.historyList} showsVerticalScrollIndicator={false}>
                            {conversations.map((conv) => (
                                <TouchableOpacity
                                    key={conv.id}
                                    style={[
                                        styles.historyItem,
                                        conv.id === activeConvId && styles.historyItemActive,
                                    ]}
                                    onPress={() => onSelect(conv)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.historyItemIcon}>
                                        <MaterialCommunityIcons
                                            name={isConvActive(conv.estado) ? 'chat-processing-outline' : 'chat-outline'}
                                            size={22}
                                            color={isConvActive(conv.estado) ? '#4CAF50' : '#9E9E9E'}
                                        />
                                    </View>
                                    <View style={styles.historyItemContent}>
                                        <Text style={styles.historyItemTema} numberOfLines={2}>
                                            {conv.tema}
                                        </Text>
                                        <View style={styles.historyItemMeta}>
                                            <Text style={styles.historyItemDate}>
                                                {conv.fecha
                                                    ? new Date(conv.fecha).toLocaleDateString('es-MX', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })
                                                    : 'Reciente'}
                                            </Text>
                                            {!isConvActive(conv.estado) && (
                                                <View style={styles.historyClosedBadge}>
                                                    <Text style={styles.historyClosedText}>Cerrada</Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                    <MaterialCommunityIcons name="chevron-right" size={20} color="#C8E6C9" />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}
                </View>
            </View>
        </Modal>
    );
};

// ═══════════════════════════════════════════
// ██  HELPER: Convert API messages to UI messages
// ═══════════════════════════════════════════

const apiMessageToUI = (msg: MensajeOut): Message => ({
    id: msg.id,
    text: msg.contenido,
    sender: msg.rol === 'user' ? 'user' : 'ai',
    timestamp: msg.fecha ? new Date(msg.fecha) : new Date(),
});

/** Helper to check if a conversation status represents an active chat */
const isConvActive = (estado?: string): boolean => {
    if (!estado) return false;
    const norm = estado.toLowerCase().trim();
    return norm === 'activa' || norm === 'activo' || norm === 'abierta' || norm === 'abierto';
};

// ═══════════════════════════════════════════
// ██  MAIN SCREEN
// ═══════════════════════════════════════════

export const AIChatScreen: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [conversationActive, setConversationActive] = useState(true);
    const [conversations, setConversations] = useState<ConversacionOut[]>([]);
    const [historyVisible, setHistoryVisible] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);
    const scrollRef = useRef<ScrollView>(null);
    const inputRef = useRef<TextInput>(null);

    const scrollToBottom = useCallback(() => {
        setTimeout(() => {
            scrollRef.current?.scrollToEnd({ animated: true });
        }, 100);
    }, []);

    // ── Load conversation history when modal opens ──
    const loadConversations = useCallback(async () => {
        setHistoryLoading(true);
        try {
            const convs = await chatbotService.listConversaciones(0, 50);
            setConversations(convs);
        } catch (error) {
            console.warn('[AIChatScreen] Error loading conversations:', error);
        } finally {
            setHistoryLoading(false);
        }
    }, []);

    // ── Load messages from a specific conversation ──
    const loadConversation = useCallback(async (conv: ConversacionOut) => {
        try {
            const msgs = await chatbotService.listMensajes(conv.id);
            setMessages(msgs.map(apiMessageToUI));
            setConversationId(conv.id);
            setConversationActive(isConvActive(conv.estado));
            setHistoryVisible(false);
            scrollToBottom();
        } catch (error: any) {
            Alert.alert('Error', error?.message || 'No se pudieron cargar los mensajes.');
        }
    }, [scrollToBottom]);

    // ── Start a new conversation ──
    const startNewChat = useCallback(() => {
        setMessages([]);
        setConversationId(null);
        setConversationActive(true);
        setInputText('');
    }, []);

    // ── Send message ──
    const sendMessage = useCallback(async (text: string) => {
        if (!text.trim() || isTyping) return;

        const userText = text.trim();

        // Show user message immediately
        const userMsg: Message = {
            id: 'temp-' + Date.now(),
            text: userText,
            sender: 'user',
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setIsTyping(true);
        scrollToBottom();

        try {
            let convId = conversationId;

            // 1. If no active conversation, create one with the first message as the topic
            if (!convId) {
                const tema = userText.length > 60 ? userText.substring(0, 60) + '...' : userText;
                const newConv = await chatbotService.createConversacion({ tema });
                convId = newConv.id;
                setConversationId(convId);
                setConversationActive(isConvActive(newConv.estado));
            }

            // The API stores messages but does not generate assistant replies.
            await chatbotService.createMensaje(convId, {
                contenido: userText,
                rol: 'user',
            });

            const assistantText = getAssistantResponse(userText);
            await chatbotService.createMensaje(convId, {
                contenido: assistantText,
                rol: 'assistant',
            });

            const updatedMessages = await chatbotService.listMensajes(convId);
            setMessages(updatedMessages.map(apiMessageToUI));
        } catch (error: any) {
            console.error('[AIChatScreen] Error sending message:', error);

            // Show error as an AI message so the user sees feedback
            const errorMsg: Message = {
                id: 'error-' + Date.now(),
                text: '❌ No se pudo enviar el mensaje. Verifica tu conexión e inténtalo de nuevo.',
                sender: 'ai',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
            scrollToBottom();
        }
    }, [conversationId, isTyping, scrollToBottom]);

    const handleSend = useCallback(() => {
        sendMessage(inputText);
    }, [inputText, sendMessage]);

    const handleSuggestion = useCallback((query: string) => {
        sendMessage(query);
    }, [sendMessage]);

    const handleShowHistory = useCallback(() => {
        setHistoryVisible(true);
        loadConversations();
    }, [loadConversations]);

    const handleSelectConversation = useCallback((conv: ConversacionOut) => {
        loadConversation(conv);
    }, [loadConversation]);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            {/* Header */}
            <ChatHeader
                onNewChat={startNewChat}
                onShowHistory={handleShowHistory}
                hasActiveConversation={conversationId !== null}
            />

            {/* Chat area */}
            <KeyboardAvoidingView
                style={styles.chatArea}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <ScrollView
                    ref={scrollRef}
                    style={styles.messagesScroll}
                    contentContainerStyle={styles.messagesContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {messages.length === 0 ? (
                        <WelcomeState onSuggestionPress={handleSuggestion} />
                    ) : (
                        <>
                            {messages.map((msg, i) => (
                                <MessageBubble key={msg.id} message={msg} index={i} />
                            ))}
                            {isTyping && <TypingIndicator />}
                        </>
                    )}
                </ScrollView>

                {/* Quick suggestions when chat is active */}
                {messages.length > 0 && !isTyping && conversationActive && (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.quickSuggestions}
                        contentContainerStyle={styles.quickSuggestionsContent}
                    >
                        {suggestions.map((s, i) => (
                            <TouchableOpacity
                                key={i}
                                style={styles.quickChip}
                                onPress={() => handleSuggestion(s.query)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.quickChipText}>{s.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}

                {/* Conversation closed banner */}
                {!conversationActive && conversationId && (
                    <View style={styles.closedBanner}>
                        <MaterialCommunityIcons name="lock-outline" size={16} color="#FF9800" />
                        <Text style={styles.closedBannerText}>Esta conversación está cerrada.</Text>
                        <TouchableOpacity onPress={startNewChat}>
                            <Text style={styles.closedBannerLink}>Nueva conversación</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Input bar */}
                <View style={styles.inputBar}>
                    <View style={styles.inputContainer}>
                        <TextInput
                            ref={inputRef}
                            style={styles.textInput}
                            placeholder="Escribe tu consulta..."
                            placeholderTextColor="#9E9E9E"
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                            maxLength={500}
                            returnKeyType="default"
                            editable={conversationActive}
                        />
                    </View>
                    <TouchableOpacity
                        style={[
                            styles.sendButton,
                            (!inputText.trim() || !conversationActive) && styles.sendButtonDisabled,
                        ]}
                        onPress={handleSend}
                        disabled={!inputText.trim() || isTyping || !conversationActive}
                        activeOpacity={0.7}
                    >
                        {isTyping ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <MaterialCommunityIcons
                                name="send"
                                size={20}
                                color={inputText.trim() && conversationActive ? '#fff' : '#A5D6A7'}
                            />
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            {/* Conversation History Modal */}
            <ConversationHistoryModal
                visible={historyVisible}
                onClose={() => setHistoryVisible(false)}
                conversations={conversations}
                onSelect={handleSelectConversation}
                isLoading={historyLoading}
                activeConvId={conversationId || undefined}
            />
        </SafeAreaView>
    );
};

// ═══════════════════════════════════════════
// ██  STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F1F8E9',
    },

    // ── Header ──
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(76, 175, 80, 0.1)',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
            },
            android: { elevation: 3 },
        }),
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerIconContainer: {
        position: 'relative',
        marginRight: 12,
    },
    headerIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerIconGlow: {
        position: 'absolute',
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '#66BB6A',
        top: -4,
        left: -4,
    },
    headerTextContainer: {
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1B5E20',
        letterSpacing: 0.3,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    statusDot: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
        backgroundColor: '#4CAF50',
        marginRight: 5,
    },
    statusText: {
        fontSize: 12,
        color: '#66BB6A',
        fontWeight: '500',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    headerAction: {
        padding: 6,
    },

    // ── Chat area ──
    chatArea: {
        flex: 1,
    },
    messagesScroll: {
        flex: 1,
    },
    messagesContent: {
        paddingHorizontal: 12,
        paddingTop: 16,
        paddingBottom: 8,
    },

    // ── Welcome state ──
    welcomeContainer: {
        alignItems: 'center',
        paddingTop: 40,
        paddingHorizontal: 20,
    },
    welcomeIconOuter: {
        marginBottom: 20,
    },
    welcomeIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#4CAF50',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.35,
                shadowRadius: 12,
            },
            android: { elevation: 8 },
        }),
    },
    welcomeTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: '#1B5E20',
        marginBottom: 8,
    },
    welcomeSubtitle: {
        fontSize: 15,
        color: '#558B2F',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 28,
    },
    welcomeHint: {
        fontSize: 13,
        color: '#9E9E9E',
        fontWeight: '600',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        marginBottom: 14,
    },
    suggestionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 10,
    },
    suggestionChip: {
        paddingHorizontal: 18,
        paddingVertical: 11,
        borderRadius: 22,
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: '#C8E6C9',
        ...Platform.select({
            ios: {
                shadowColor: '#4CAF50',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 6,
            },
            android: { elevation: 2 },
        }),
    },
    suggestionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2E7D32',
    },

    // ── Messages ──
    messageRow: {
        flexDirection: 'row',
        marginBottom: 12,
        alignItems: 'flex-end',
    },
    messageRowUser: {
        justifyContent: 'flex-end',
    },
    messageRowAI: {
        justifyContent: 'flex-start',
    },
    aiAvatar: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
        marginBottom: 2,
    },
    messageBubble: {
        maxWidth: width * 0.72,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 11,
    },
    userBubble: {
        backgroundColor: '#4CAF50',
        borderBottomRightRadius: 6,
        ...Platform.select({
            ios: {
                shadowColor: '#388E3C',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 6,
            },
            android: { elevation: 3 },
        }),
    },
    aiBubble: {
        backgroundColor: '#fff',
        borderBottomLeftRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(76, 175, 80, 0.12)',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.06,
                shadowRadius: 6,
            },
            android: { elevation: 2 },
        }),
    },
    messageText: {
        fontSize: 15,
        lineHeight: 21,
    },
    userText: {
        color: '#fff',
    },
    aiText: {
        color: '#1B5E20',
    },
    messageTime: {
        fontSize: 10,
        marginTop: 5,
    },
    userTime: {
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'right',
    },
    aiTime: {
        color: '#9E9E9E',
    },

    // ── Typing indicator ──
    typingContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: 12,
    },
    typingBubble: {
        backgroundColor: '#fff',
        borderRadius: 20,
        borderBottomLeftRadius: 6,
        paddingHorizontal: 18,
        paddingVertical: 14,
        marginLeft: 38,
        borderWidth: 1,
        borderColor: 'rgba(76, 175, 80, 0.12)',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
            },
            android: { elevation: 1 },
        }),
    },
    typingDots: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    typingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#66BB6A',
    },

    // ── Quick suggestions ──
    quickSuggestions: {
        maxHeight: 46,
        borderTopWidth: 1,
        borderTopColor: 'rgba(76, 175, 80, 0.08)',
        backgroundColor: '#F1F8E9',
    },
    quickSuggestionsContent: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        gap: 8,
    },
    quickChip: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#C8E6C9',
    },
    quickChipText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#2E7D32',
    },

    // ── Closed conversation banner ──
    closedBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: '#FFF8E1',
        borderTopWidth: 1,
        borderTopColor: '#FFE082',
        gap: 8,
    },
    closedBannerText: {
        fontSize: 13,
        color: '#F57F17',
        fontWeight: '500',
    },
    closedBannerLink: {
        fontSize: 13,
        color: '#4CAF50',
        fontWeight: '700',
        textDecorationLine: 'underline',
    },

    // ── Input bar ──
    inputBar: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 12,
        paddingTop: 10,
        paddingBottom: 85,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: 'rgba(76, 175, 80, 0.1)',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.04,
                shadowRadius: 6,
            },
            android: { elevation: 4 },
        }),
    },
    inputContainer: {
        flex: 1,
        backgroundColor: '#F1F8E9',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#C8E6C9',
        paddingHorizontal: 16,
        paddingVertical: Platform.OS === 'ios' ? 10 : 6,
        marginRight: 10,
        maxHeight: 100,
    },
    textInput: {
        fontSize: 15,
        color: '#1B5E20',
        maxHeight: 80,
        lineHeight: 20,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#388E3C',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 6,
            },
            android: { elevation: 4 },
        }),
    },
    sendButtonDisabled: {
        backgroundColor: '#E8F5E9',
        ...Platform.select({
            ios: { shadowOpacity: 0 },
            android: { elevation: 0 },
        }),
    },

    // ── Conversation History Modal ──
    historyOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    historyContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '75%',
        paddingBottom: 30,
    },
    historyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 18,
        borderBottomWidth: 1,
        borderBottomColor: '#E8F5E9',
    },
    historyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1B5E20',
    },
    historyCloseBtn: {
        padding: 4,
    },
    historyLoading: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    historyLoadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#9E9E9E',
    },
    historyEmpty: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    historyEmptyText: {
        marginTop: 12,
        fontSize: 14,
        color: '#9E9E9E',
    },
    historyList: {
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 12,
        borderRadius: 14,
        marginBottom: 6,
        backgroundColor: '#FAFFF5',
    },
    historyItemActive: {
        backgroundColor: '#E8F5E9',
        borderWidth: 1.5,
        borderColor: '#4CAF50',
    },
    historyItemIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E8F5E9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    historyItemContent: {
        flex: 1,
    },
    historyItemTema: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1B5E20',
        marginBottom: 4,
    },
    historyItemMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    historyItemDate: {
        fontSize: 12,
        color: '#9E9E9E',
    },
    historyClosedBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        backgroundColor: '#FFF3E0',
    },
    historyClosedText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#FF9800',
    },
});

export default AIChatScreen;
