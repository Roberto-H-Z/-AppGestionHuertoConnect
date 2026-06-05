/**
 * AIChatScreen
 * Chat publico para consultar recomendaciones de cultivo y analisis de plagas.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    Easing,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    StatusBar as NativeStatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { aiModelService, AIModelResponse } from '../services/aiModelService';

const { width } = Dimensions.get('window');

type ModelMode = 'chat' | 'garden' | 'pest';
type MessageStatus = 'idle' | 'success' | 'error';

interface Message {
    id: string;
    sender: 'user' | 'ai' | 'system';
    title?: string;
    text: string;
    timestamp: Date;
    status?: MessageStatus;
}

interface LocationState {
    lat: number;
    lon: number;
    municipio: string;
}

const DEFAULT_LOCATION: LocationState = {
    lat: 19.5312,
    lon: -96.9276,
    municipio: 'Xalapa',
};

const modeConfig: Record<ModelMode, {
    label: string;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    accent: string;
    placeholder: string;
}> = {
    chat: {
        label: 'Asistente',
        icon: 'message-text-outline',
        accent: '#4CAF50',
        placeholder: 'Escribe tu consulta sobre el huerto...',
    },
    garden: {
        label: 'Cultivos',
        icon: 'sprout-outline',
        accent: '#43A047',
        placeholder: 'Escribe tu municipio...',
    },
    pest: {
        label: 'Plagas',
        icon: 'bug-outline',
        accent: '#66BB6A',
        placeholder: 'Pega la URL publica de una foto...',
    },
};

const quickActions: Array<{
    mode: ModelMode;
    label: string;
    prompt: string;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
}> = [
    { mode: 'garden', label: 'Cultivos ideales', prompt: 'Xalapa', icon: 'sprout-outline' },
    { mode: 'pest', label: 'Revisar plaga', prompt: '', icon: 'bug-outline' },
    { mode: 'chat', label: 'Consejos rapidos', prompt: 'Que puedes recomendarme', icon: 'lightbulb-on-outline' },
];

const getTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const extractUrl = (text: string) => {
    const match = text.match(/https?:\/\/[^\s]+/i);
    return match?.[0] ?? null;
};

const compactValue = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
    }
    if (Array.isArray(value)) {
        return value.map(compactValue).filter(Boolean).join(', ');
    }
    if (typeof value === 'object') {
        return Object.entries(value as Record<string, unknown>)
            .slice(0, 5)
            .map(([key, item]) => `${key}: ${compactValue(item)}`)
            .join('\n');
    }
    return String(value);
};

const formatGardenResponse = (data: AIModelResponse) => {
    const source = Array.isArray(data) ? data : data as Record<string, unknown>;
    const candidates = Array.isArray(source)
        ? source
        : (source.recomendaciones || source.cultivos || source.predicciones || source.resultado || source.data);

    if (Array.isArray(candidates) && candidates.length > 0) {
        const lines = candidates.slice(0, 6).map((item, index) => {
            if (typeof item === 'string') return `${index + 1}. ${item}`;
            const record = item as Record<string, unknown>;
            const name = record.nombre || record.cultivo || record.crop || record.name || `Opcion ${index + 1}`;
            const score = record.probabilidad || record.score || record.confianza;
            return `${index + 1}. ${name}${score ? ` (${score})` : ''}`;
        });
        return `Cultivos recomendados:\n\n${lines.join('\n')}`;
    }

    return `Estas son las recomendaciones encontradas:\n\n${compactValue(source)}`;
};

const formatPestResponse = (data: AIModelResponse) => {
    const source = Array.isArray(data) ? data : data as Record<string, unknown>;
    const detections = Array.isArray(source)
        ? source
        : (source.detecciones || source.plagas || source.results || source.resultado || source.data);

    if (Array.isArray(detections) && detections.length > 0) {
        const lines = detections.slice(0, 6).map((item, index) => {
            if (typeof item === 'string') return `${index + 1}. ${item}`;
            const record = item as Record<string, unknown>;
            const name = record.plaga || record.clase || record.label || record.name || `Deteccion ${index + 1}`;
            const confidence = record.confianza || record.confidence || record.score;
            return `${index + 1}. ${name}${confidence ? ` - confianza: ${confidence}` : ''}`;
        });
        return `Resultado del analisis de plagas:\n\n${lines.join('\n')}`;
    }

    return `Resultado del analisis:\n\n${compactValue(source)}`;
};

const buildGeneralReply = () =>
    'Puedo ayudarte a elegir cultivos adecuados y revisar imagenes publicas de plantas con posibles plagas.\n\nUsa las opciones superiores o escribe tu duda en lenguaje natural.';

const getPublicErrorMessage = (error: any, fallback: string) => {
    const rawMessage = String(error?.message ?? '');
    if (/token|jwt|auth|autentic/i.test(rawMessage)) {
        return 'No pude completar la consulta en este momento. Intenta de nuevo mas tarde.';
    }
    return rawMessage || fallback;
};

const TypingIndicator: React.FC = () => {
    const pulse = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, {
                    toValue: 1,
                    duration: 650,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulse, {
                    toValue: 0,
                    duration: 650,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, [pulse]);

    return (
        <View style={styles.typingRow}>
            <Animated.View
                style={[
                    styles.typingCore,
                    {
                        opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] }),
                        transform: [{
                            scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.04] }),
                        }],
                    },
                ]}
            >
                <ActivityIndicator size="small" color="#4CAF50" />
                <Text style={styles.typingText}>Analizando tu consulta</Text>
            </Animated.View>
        </View>
    );
};

const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
    const isUser = message.sender === 'user';
    const isSystem = message.sender === 'system';
    const icon = isUser ? 'account-outline' : isSystem ? 'shield-check-outline' : 'robot-outline';

    return (
        <View style={[styles.messageRow, isUser && styles.messageRowUser]}>
            {!isUser && (
                <View style={[styles.messageAvatar, isSystem && styles.systemAvatar]}>
                    <MaterialCommunityIcons name={icon} size={17} color={isSystem ? '#1B5E20' : '#4CAF50'} />
                </View>
            )}
            <View
                style={[
                    styles.messageBubble,
                    isUser ? styles.userBubble : styles.aiBubble,
                    message.status === 'error' && styles.errorBubble,
                ]}
            >
                {message.title && <Text style={styles.messageTitle}>{message.title}</Text>}
                <Text style={[styles.messageText, isUser && styles.userMessageText]}>{message.text}</Text>
                <Text style={[styles.messageTime, isUser && styles.userMessageTime]}>
                    {getTime(message.timestamp)}
                </Text>
            </View>
        </View>
    );
};

export const AIChatScreen: React.FC = () => {
    const [mode, setMode] = useState<ModelMode>('chat');
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            sender: 'system',
            title: 'Asistente listo',
            text: 'Preguntame sobre cultivos, clima o plagas. Tambien puedes usar las opciones rapidas para iniciar.',
            timestamp: new Date(),
            status: 'success',
        },
    ]);
    const scrollRef = useRef<ScrollView>(null);
    const currentMode = modeConfig[mode];

    const appendMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>) => {
        setMessages(prev => [
            ...prev,
            {
                ...message,
                id: `${Date.now()}-${prev.length}`,
                timestamp: new Date(),
            },
        ]);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    }, []);

    const runGardenModel = useCallback(async (municipioInput?: string) => {
        const municipio = municipioInput?.trim() || DEFAULT_LOCATION.municipio;
        appendMessage({
            sender: 'user',
            text: 'Recomendar cultivos para mi huerto',
        });
        setIsLoading(true);
        try {
            const data = await aiModelService.recommendGarden({
                lat: DEFAULT_LOCATION.lat,
                lon: DEFAULT_LOCATION.lon,
                municipio,
            });
            appendMessage({
                sender: 'ai',
                title: 'Recomendacion de cultivos',
                text: formatGardenResponse(data),
                status: 'success',
            });
        } catch (error: any) {
            appendMessage({
                sender: 'ai',
                title: 'No pude generar recomendaciones',
                text: getPublicErrorMessage(error, 'Intenta de nuevo en unos minutos.'),
                status: 'error',
            });
        } finally {
            setIsLoading(false);
        }
    }, [appendMessage]);

    const runPestModel = useCallback(async (imageUrl: string) => {
        appendMessage({
            sender: 'user',
            text: `Analizar imagen: ${imageUrl}`,
        });
        setIsLoading(true);
        try {
            const data = await aiModelService.detectPest({ imagen_url: imageUrl });
            appendMessage({
                sender: 'ai',
                title: 'Analisis de plagas',
                text: formatPestResponse(data),
                status: 'success',
            });
        } catch (error: any) {
            appendMessage({
                sender: 'ai',
                title: 'No pude analizar la imagen',
                text: getPublicErrorMessage(error, 'Verifica que la URL de la imagen sea publica.'),
                status: 'error',
            });
        } finally {
            setIsLoading(false);
        }
    }, [appendMessage]);

    const handleSend = useCallback(async (overrideText?: string, overrideMode?: ModelMode) => {
        const text = (overrideText ?? inputText).trim();
        const activeMode = overrideMode ?? mode;
        if (!text || isLoading) return;

        setInputText('');

        if (activeMode === 'garden') {
            await runGardenModel(text);
            return;
        }

        if (activeMode === 'pest') {
            const url = extractUrl(text);
            if (!url) {
                appendMessage({
                    sender: 'ai',
                    title: 'Imagen requerida',
                    text: 'Comparte un enlace publico de la foto para poder revisar la planta.',
                    status: 'error',
                });
                return;
            }
            await runPestModel(url);
            return;
        }

        appendMessage({ sender: 'user', text });
        const url = extractUrl(text);
        const lower = text.toLowerCase();
        if (url || lower.includes('plaga') || lower.includes('imagen')) {
            if (url) await runPestModel(url);
            else appendMessage({
                sender: 'ai',
                title: 'Revisar plaga',
                text: 'Comparte un enlace publico de la foto de la planta para iniciar el analisis.',
            });
            return;
        }

        if (lower.includes('cultivo') || lower.includes('huerto') || lower.includes('clima') || lower.includes('recom')) {
            await runGardenModel(text.replace(/cultivos?|huertos?|clima|recomendar|recomienda/gi, '').trim());
            return;
        }

        appendMessage({
            sender: 'ai',
            title: 'Asistente',
            text: buildGeneralReply(),
        });
    }, [appendMessage, inputText, isLoading, mode, runGardenModel, runPestModel]);

    const handleQuickAction = useCallback((action: typeof quickActions[number]) => {
        setMode(action.mode);
        if (!action.prompt) {
            appendMessage({
                sender: 'ai',
                title: action.label,
                text: 'Comparte un enlace publico de la foto de la planta para revisar posibles plagas.',
            });
            return;
        }
        handleSend(action.prompt, action.mode);
    }, [appendMessage, handleSend]);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />
            <LinearGradient
                colors={['#F7FFF5', '#EEF8E8', '#E8F5E9']}
                locations={[0, 0.45, 1]}
                style={StyleSheet.absoluteFill}
            />

            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <View style={styles.brandMark}>
                        <MaterialCommunityIcons name="robot-happy-outline" size={24} color="#4CAF50" />
                    </View>
                    <View style={styles.headerCopy}>
                        <Text style={styles.headerEyebrow}>HUERTOCONNECT</Text>
                        <Text style={styles.headerTitle}>Asistente de Huerto</Text>
                    </View>
                    <View style={styles.liveBadge}>
                        <MaterialCommunityIcons name="star-outline" size={16} color="#4CAF50" />
                    </View>
                </View>

                <View style={styles.modeRow}>
                    {(Object.keys(modeConfig) as ModelMode[]).map(item => {
                        const config = modeConfig[item];
                        const active = mode === item;
                        return (
                            <TouchableOpacity
                                key={item}
                                style={[styles.modeButton, active && { borderColor: config.accent, backgroundColor: '#E8F5E9' }]}
                                onPress={() => setMode(item)}
                                activeOpacity={0.78}
                            >
                                <MaterialCommunityIcons name={config.icon} size={17} color={active ? config.accent : '#8AA3A0'} />
                                <Text style={[styles.modeText, active && { color: config.accent }]}>{config.label}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            <KeyboardAvoidingView
                style={styles.body}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    ref={scrollRef}
                    style={styles.messagesScroll}
                    contentContainerStyle={styles.messagesContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.quickGrid}>
                        {quickActions.map(action => (
                            <TouchableOpacity
                                key={action.label}
                                style={styles.quickAction}
                                onPress={() => handleQuickAction(action)}
                                disabled={isLoading}
                            >
                                <MaterialCommunityIcons name={action.icon} size={18} color="#4CAF50" />
                                <Text style={styles.quickActionText}>{action.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {messages.map(message => (
                        <MessageBubble key={message.id} message={message} />
                    ))}
                    {isLoading && <TypingIndicator />}
                </ScrollView>

                <View style={styles.inputDock}>
                    <View style={styles.inputWrap}>
                        <MaterialCommunityIcons name={currentMode.icon} size={20} color={currentMode.accent} />
                        <TextInput
                            style={styles.textInput}
                            placeholder={currentMode.placeholder}
                            placeholderTextColor="#6F8581"
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                            maxLength={700}
                        />
                    </View>
                    <TouchableOpacity
                        style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
                        onPress={() => handleSend()}
                        disabled={!inputText.trim() || isLoading}
                        activeOpacity={0.78}
                    >
                        {isLoading ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <MaterialCommunityIcons name="arrow-up" size={22} color="#FFFFFF" />
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7FFF5',
    },
    header: {
        paddingHorizontal: 18,
        paddingTop: Platform.OS === 'android' ? (NativeStatusBar.currentHeight ?? 24) + 8 : 10,
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(76, 175, 80, 0.12)',
        backgroundColor: 'rgba(255,255,255,0.82)',
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    brandMark: {
        width: 44,
        height: 44,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E8F5E9',
        borderWidth: 1,
        borderColor: '#C8E6C9',
    },
    headerCopy: {
        flex: 1,
        marginLeft: 12,
    },
    headerEyebrow: {
        color: '#66BB6A',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1.2,
    },
    headerTitle: {
        color: '#1B5E20',
        fontSize: 21,
        fontWeight: '800',
        marginTop: 2,
    },
    liveBadge: {
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
        width: 38,
        height: 38,
        backgroundColor: '#F1F8E9',
        borderWidth: 1,
        borderColor: '#C8E6C9',
    },
    modeRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
    },
    modeButton: {
        flex: 1,
        minHeight: 38,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#DCEED9',
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    modeText: {
        color: '#6F8F68',
        fontSize: 12,
        fontWeight: '800',
    },
    body: {
        flex: 1,
    },
    messagesScroll: {
        flex: 1,
    },
    messagesContent: {
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 156,
    },
    quickGrid: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 14,
    },
    quickAction: {
        flex: 1,
        minHeight: 48,
        borderRadius: 18,
        paddingHorizontal: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#C8E6C9',
        ...Platform.select({
            android: { elevation: 2 },
            ios: {
                shadowColor: '#4CAF50',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
            },
        }),
    },
    quickActionText: {
        color: '#2E7D32',
        fontSize: 11,
        fontWeight: '800',
        textAlign: 'center',
        marginTop: 4,
    },
    messageRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: 12,
    },
    messageRowUser: {
        justifyContent: 'flex-end',
    },
    messageAvatar: {
        width: 30,
        height: 30,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
        backgroundColor: '#E8F5E9',
        borderWidth: 1,
        borderColor: '#C8E6C9',
    },
    systemAvatar: {
        backgroundColor: '#C8E6C9',
    },
    messageBubble: {
        maxWidth: width * 0.76,
        borderRadius: 18,
        paddingHorizontal: 13,
        paddingVertical: 11,
    },
    aiBubble: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#DCEED9',
        ...Platform.select({
            android: { elevation: 2 },
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
            },
        }),
    },
    userBubble: {
        backgroundColor: '#4CAF50',
    },
    errorBubble: {
        borderColor: 'rgba(239, 68, 68, 0.22)',
        backgroundColor: '#FFF1F2',
    },
    messageTitle: {
        color: '#2E7D32',
        fontSize: 12,
        fontWeight: '900',
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    messageText: {
        color: '#1F3D20',
        fontSize: 14,
        lineHeight: 21,
    },
    userMessageText: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
    messageTime: {
        color: '#9E9E9E',
        fontSize: 10,
        marginTop: 7,
    },
    userMessageTime: {
        color: 'rgba(255,255,255,0.72)',
        textAlign: 'right',
    },
    typingRow: {
        flexDirection: 'row',
        marginBottom: 12,
        marginLeft: 38,
    },
    typingCore: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 9,
        borderRadius: 18,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#DCEED9',
    },
    typingText: {
        color: '#2E7D32',
        fontSize: 12,
        fontWeight: '800',
    },
    inputDock: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 10,
        paddingHorizontal: 14,
        paddingTop: 12,
        paddingBottom: 92,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: 'rgba(76, 175, 80, 0.12)',
    },
    inputWrap: {
        flex: 1,
        minHeight: 52,
        maxHeight: 112,
        borderRadius: 24,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 9,
        paddingHorizontal: 13,
        paddingVertical: 13,
        backgroundColor: '#F1F8E9',
        borderWidth: 1,
        borderColor: '#C8E6C9',
    },
    textInput: {
        flex: 1,
        color: '#1B5E20',
        fontSize: 14,
        lineHeight: 19,
        padding: 0,
        maxHeight: 86,
    },
    sendButton: {
        width: 52,
        height: 52,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4CAF50',
    },
    sendButtonDisabled: {
        opacity: 0.45,
    },
});

export default AIChatScreen;
