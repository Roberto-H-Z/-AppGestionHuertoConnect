/**
 * AIChatScreen — Premium AI assistant chat interface.
 * Futuristic, minimalist design with animated typing indicator,
 * glassmorphism message bubbles, and smooth entrance animations.
 * Static demo with mock AI responses about garden care.
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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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

// ═══════════════════════════════════════════
// ██  MOCK AI RESPONSES
// ═══════════════════════════════════════════

const AI_RESPONSES: Record<string, string> = {
    'hola': '¡Hola! 🌿 Soy tu asistente de HuertoConnect. Estoy aquí para ayudarte con el cuidado de tu huerto. ¿En qué puedo ayudarte hoy?',
    'riego': '💧 Para un riego óptimo, te recomiendo:\n\n• **Tomates**: Regar cada 2-3 días, 2L por planta\n• **Lechugas**: Riego diario ligero, mantener suelo húmedo\n• **Chiles**: Cada 3-4 días, evitar encharcamiento\n\n¿Necesitas información específica sobre algún cultivo?',
    'plagas': '🐛 Control de plagas orgánico:\n\n• **Pulgones**: Solución de jabón potásico al 1%\n• **Mosca blanca**: Trampas amarillas adhesivas\n• **Orugas**: Bacillus thuringiensis (Bt)\n• **Caracoles**: Trampas de cerveza\n\n¿Te preocupa alguna plaga en específico?',
    'tomate': '🍅 Guía completa del tomate:\n\n• **Temperatura ideal**: 20-25°C\n• **Luz solar**: 6-8 horas directas\n• **Riego**: Profundo cada 2-3 días\n• **Poda**: Eliminar chupones semanalmente\n• **Cosecha**: 60-85 días después del trasplante\n\n¡Tu cultivo de tomate se ve prometedor!',
    'abono': '🌱 Fertilización recomendada:\n\n• **Compost casero**: Aplicar cada 3 semanas\n• **Humus de lombriz**: Ideal para semilleros\n• **Té de plátano**: Rico en potasio para floración\n• **Ceniza de madera**: Aporta calcio y potasio\n\n¿Quieres que te explique cómo preparar alguno?',
    'clima': '🌤️ Según los datos actuales de tu zona:\n\n• La temperatura es adecuada para la mayoría de hortalizas\n• Humedad relativa favorable\n• Sin riesgo de heladas en los próximos 7 días\n\nTe recomiendo aprovechar para sembrar cultivos de temporada.',
};

const DEFAULT_RESPONSE = '🤔 Interesante pregunta. Como tu asistente de huerto, puedo ayudarte con:\n\n• 💧 **Riego** — Frecuencia y cantidad\n• 🐛 **Plagas** — Identificación y control\n• 🌱 **Abono** — Fertilización orgánica\n• 🍅 **Cultivos** — Guías específicas\n• 🌤️ **Clima** — Recomendaciones\n\n¿Sobre qué tema te gustaría saber más?';

const getAIResponse = (input: string): string => {
    const lower = input.toLowerCase().trim();
    for (const [key, response] of Object.entries(AI_RESPONSES)) {
        if (lower.includes(key)) return response;
    }
    return DEFAULT_RESPONSE;
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
    { label: '💧 Riego', query: 'riego' },
    { label: '🐛 Plagas', query: 'plagas' },
    { label: '🍅 Tomates', query: 'tomate' },
    { label: '🌱 Abono', query: 'abono' },
    { label: '🌤️ Clima', query: 'clima' },
];

// ═══════════════════════════════════════════
// ██  HEADER with subtle glow
// ═══════════════════════════════════════════

const ChatHeader: React.FC = () => {
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
            <TouchableOpacity style={styles.headerAction}>
                <MaterialCommunityIcons name="dots-vertical" size={22} color="#66BB6A" />
            </TouchableOpacity>
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
// ██  MAIN SCREEN
// ═══════════════════════════════════════════

export const AIChatScreen: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<ScrollView>(null);
    const inputRef = useRef<TextInput>(null);

    const scrollToBottom = useCallback(() => {
        setTimeout(() => {
            scrollRef.current?.scrollToEnd({ animated: true });
        }, 100);
    }, []);

    const sendMessage = useCallback((text: string) => {
        if (!text.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            text: text.trim(),
            sender: 'user',
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setIsTyping(true);
        scrollToBottom();

        // Simulate AI "thinking" delay
        const delay = 1000 + Math.random() * 1500;
        setTimeout(() => {
            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: getAIResponse(text),
                sender: 'ai',
                timestamp: new Date(),
            };
            setIsTyping(false);
            setMessages(prev => [...prev, aiMsg]);
            scrollToBottom();
        }, delay);
    }, [scrollToBottom]);

    const handleSend = useCallback(() => {
        sendMessage(inputText);
    }, [inputText, sendMessage]);

    const handleSuggestion = useCallback((query: string) => {
        sendMessage(query);
    }, [sendMessage]);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            {/* Header */}
            <ChatHeader />

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
                {messages.length > 0 && !isTyping && (
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
                        />
                    </View>
                    <TouchableOpacity
                        style={[
                            styles.sendButton,
                            !inputText.trim() && styles.sendButtonDisabled,
                        ]}
                        onPress={handleSend}
                        disabled={!inputText.trim() || isTyping}
                        activeOpacity={0.7}
                    >
                        <MaterialCommunityIcons
                            name="send"
                            size={20}
                            color={inputText.trim() ? '#fff' : '#A5D6A7'}
                        />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
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
});

export default AIChatScreen;
