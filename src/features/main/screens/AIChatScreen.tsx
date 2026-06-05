/**
 * AIChatScreen
 * Conecta el chatbot con los modelos protegidos del gateway:
 * - Random Forest de huertos: POST /api/huertos/recomendar
 * - YOLOv8 de plagas: POST /api/plagas/detectar
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import * as Location from 'expo-location';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { environment } from '../../../config/environment';
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
    source: 'default' | 'device';
}

const DEFAULT_LOCATION: LocationState = {
    lat: 19.5312,
    lon: -96.9276,
    municipio: 'Xalapa',
    source: 'default',
};

const modeConfig: Record<ModelMode, {
    label: string;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    accent: string;
    placeholder: string;
}> = {
    chat: {
        label: 'Chat IA',
        icon: 'message-text-outline',
        accent: '#7DD3FC',
        placeholder: 'Pregunta por cultivos, clima o plagas...',
    },
    garden: {
        label: 'Cultivos',
        icon: 'sprout-outline',
        accent: '#A7F3D0',
        placeholder: 'Municipio para recomendar cultivos...',
    },
    pest: {
        label: 'Plagas',
        icon: 'bug-outline',
        accent: '#FDE68A',
        placeholder: 'Pega una URL pública de imagen...',
    },
};

const quickActions: Array<{
    mode: ModelMode;
    label: string;
    prompt: string;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
}> = [
    { mode: 'garden', label: 'Recomendar cultivos', prompt: 'Xalapa', icon: 'sprout-outline' },
    { mode: 'pest', label: 'Detectar plaga', prompt: 'https://raw.githubusercontent.com/ultralytics/yolov5/master/data/images/bus.jpg', icon: 'bug-outline' },
    { mode: 'chat', label: 'Cómo usar IA', prompt: 'Que modelos tienes disponibles', icon: 'auto-fix' },
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
        return `Recomendacion del modelo Random Forest:\n\n${lines.join('\n')}`;
    }

    return `Respuesta del modelo de huertos:\n\n${compactValue(source)}`;
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
        return `Deteccion YOLOv8 completada:\n\n${lines.join('\n')}`;
    }

    return `Respuesta del modelo de plagas:\n\n${compactValue(source)}`;
};

const buildGeneralReply = () =>
    'Tengo dos conexiones reales disponibles:\n\n- Cultivos: clima + Random Forest con latitud, longitud y municipio.\n- Plagas: YOLOv8 con una URL publica de imagen.\n\nPuedes usar los chips superiores o escribir "cultivos en Xalapa" o pegar una URL de imagen para plagas.';

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
                <ActivityIndicator size="small" color="#A7F3D0" />
                <Text style={styles.typingText}>Procesando modelo</Text>
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
                    <MaterialCommunityIcons name={icon} size={17} color={isSystem ? '#0F172A' : '#A7F3D0'} />
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
    const [location, setLocation] = useState<LocationState>(DEFAULT_LOCATION);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            sender: 'system',
            title: 'Nucleo IA listo',
            text: 'Selecciona un modelo o escribe una consulta. Los endpoints usan el JWT guardado por la app.',
            timestamp: new Date(),
            status: 'success',
        },
    ]);
    const scrollRef = useRef<ScrollView>(null);
    const currentMode = modeConfig[mode];

    const endpointLabel = useMemo(() => {
        if (mode === 'garden') return `${environment.services.huertos}/recomendar`;
        if (mode === 'pest') return `${environment.services.plagas}/detectar`;
        return environment.apiUrl;
    }, [mode]);

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

    const useDeviceLocation = useCallback(async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                appendMessage({
                    sender: 'system',
                    title: 'Ubicacion no autorizada',
                    text: 'Se mantiene Xalapa como coordenada de prueba para el modelo de huertos.',
                    status: 'error',
                });
                return;
            }

            const current = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });
            const [geo] = await Location.reverseGeocodeAsync({
                latitude: current.coords.latitude,
                longitude: current.coords.longitude,
            });

            setLocation({
                lat: current.coords.latitude,
                lon: current.coords.longitude,
                municipio: geo?.city || geo?.subregion || geo?.region || 'Mi ubicacion',
                source: 'device',
            });
        } catch (error: any) {
            appendMessage({
                sender: 'system',
                title: 'Error de ubicacion',
                text: 'No fue posible obtener coordenadas del dispositivo. Se conserva Xalapa como ubicacion de prueba.',
                status: 'error',
            });
        }
    }, [appendMessage]);

    const runGardenModel = useCallback(async (municipioInput?: string) => {
        const municipio = municipioInput?.trim() || location.municipio;
        appendMessage({
            sender: 'user',
            text: `Recomendar cultivos para ${municipio}`,
        });
        setIsLoading(true);
        try {
            const data = await aiModelService.recommendGarden({
                lat: location.lat,
                lon: location.lon,
                municipio,
            });
            appendMessage({
                sender: 'ai',
                title: 'Modelo de Huertos',
                text: `${formatGardenResponse(data)}\n\nCoordenadas usadas: ${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}`,
                status: 'success',
            });
        } catch (error: any) {
            appendMessage({
                sender: 'ai',
                title: 'No se pudo consultar Huertos IA',
                text: error.message || 'El modelo de huertos no respondio.',
                status: 'error',
            });
        } finally {
            setIsLoading(false);
        }
    }, [appendMessage, location]);

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
                title: 'Modelo de Plagas YOLOv8',
                text: formatPestResponse(data),
                status: 'success',
            });
        } catch (error: any) {
            appendMessage({
                sender: 'ai',
                title: 'No se pudo consultar Plagas IA',
                text: error.message || 'El modelo de vision artificial no respondio.',
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
                    title: 'URL publica requerida',
                    text: 'Pega una URL publica de la foto. Ejemplo: https://.../planta.jpg',
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
                title: 'Plagas IA',
                text: 'Para YOLOv8 necesito la URL publica de la imagen de la planta.',
            });
            return;
        }

        if (lower.includes('cultivo') || lower.includes('huerto') || lower.includes('clima') || lower.includes('recom')) {
            await runGardenModel(text.replace(/cultivos?|huertos?|clima|recomendar|recomienda/gi, '').trim());
            return;
        }

        appendMessage({
            sender: 'ai',
            title: 'Asistente IA',
            text: buildGeneralReply(),
        });
    }, [appendMessage, inputText, isLoading, mode, runGardenModel, runPestModel]);

    const handleQuickAction = useCallback((action: typeof quickActions[number]) => {
        setMode(action.mode);
        handleSend(action.prompt, action.mode);
    }, [handleSend]);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />
            <LinearGradient
                colors={['#061418', '#0B1F24', '#0E2A22']}
                locations={[0, 0.48, 1]}
                style={StyleSheet.absoluteFill}
            />

            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <View style={styles.brandMark}>
                        <MaterialCommunityIcons name="brain" size={24} color="#A7F3D0" />
                    </View>
                    <View style={styles.headerCopy}>
                        <Text style={styles.headerEyebrow}>HUERTOCONNECT INTELLIGENCE</Text>
                        <Text style={styles.headerTitle}>Centro de Analisis IA</Text>
                    </View>
                    <View style={styles.liveBadge}>
                        <View style={styles.liveDot} />
                        <Text style={styles.liveText}>API</Text>
                    </View>
                </View>

                <View style={styles.endpointPanel}>
                    <Text style={styles.endpointLabel}>Endpoint activo</Text>
                    <Text style={styles.endpointValue} numberOfLines={1}>{endpointLabel}</Text>
                </View>

                <View style={styles.modeRow}>
                    {(Object.keys(modeConfig) as ModelMode[]).map(item => {
                        const config = modeConfig[item];
                        const active = mode === item;
                        return (
                            <TouchableOpacity
                                key={item}
                                style={[styles.modeButton, active && { borderColor: config.accent, backgroundColor: 'rgba(255,255,255,0.10)' }]}
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
                    <View style={styles.telemetryGrid}>
                        <View style={styles.telemetryCell}>
                            <Text style={styles.telemetryLabel}>Lat</Text>
                            <Text style={styles.telemetryValue}>{location.lat.toFixed(4)}</Text>
                        </View>
                        <View style={styles.telemetryCell}>
                            <Text style={styles.telemetryLabel}>Lon</Text>
                            <Text style={styles.telemetryValue}>{location.lon.toFixed(4)}</Text>
                        </View>
                        <TouchableOpacity style={styles.locationButton} onPress={useDeviceLocation}>
                            <MaterialCommunityIcons name="crosshairs-gps" size={16} color="#A7F3D0" />
                            <Text style={styles.locationText}>{location.source === 'device' ? location.municipio : 'Usar ubicacion'}</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.quickGrid}>
                        {quickActions.map(action => (
                            <TouchableOpacity
                                key={action.label}
                                style={styles.quickAction}
                                onPress={() => handleQuickAction(action)}
                                disabled={isLoading}
                            >
                                <MaterialCommunityIcons name={action.icon} size={18} color="#E5FDF6" />
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
                            <ActivityIndicator size="small" color="#0B1F24" />
                        ) : (
                            <MaterialCommunityIcons name="arrow-up" size={22} color="#0B1F24" />
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
        backgroundColor: '#061418',
    },
    header: {
        paddingHorizontal: 18,
        paddingTop: Platform.OS === 'android' ? (NativeStatusBar.currentHeight ?? 24) + 8 : 10,
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(167, 243, 208, 0.12)',
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
        backgroundColor: 'rgba(167, 243, 208, 0.10)',
        borderWidth: 1,
        borderColor: 'rgba(167, 243, 208, 0.24)',
    },
    headerCopy: {
        flex: 1,
        marginLeft: 12,
    },
    headerEyebrow: {
        color: '#7DD3FC',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1.2,
    },
    headerTitle: {
        color: '#F8FAFC',
        fontSize: 21,
        fontWeight: '800',
        marginTop: 2,
    },
    liveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 8,
        paddingHorizontal: 9,
        paddingVertical: 6,
        backgroundColor: 'rgba(125, 211, 252, 0.10)',
        borderWidth: 1,
        borderColor: 'rgba(125, 211, 252, 0.28)',
    },
    liveDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: '#22C55E',
        marginRight: 6,
    },
    liveText: {
        color: '#BAE6FD',
        fontSize: 11,
        fontWeight: '800',
    },
    endpointPanel: {
        marginTop: 14,
        padding: 10,
        borderRadius: 8,
        backgroundColor: 'rgba(15, 23, 42, 0.52)',
        borderWidth: 1,
        borderColor: 'rgba(148, 163, 184, 0.18)',
    },
    endpointLabel: {
        color: '#8AA3A0',
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    endpointValue: {
        color: '#DDFCF1',
        fontSize: 12,
        marginTop: 4,
    },
    modeRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
    },
    modeButton: {
        flex: 1,
        minHeight: 38,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(148, 163, 184, 0.18)',
        backgroundColor: 'rgba(15, 23, 42, 0.34)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    modeText: {
        color: '#8AA3A0',
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
    telemetryGrid: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    telemetryCell: {
        width: 84,
        paddingVertical: 9,
        paddingHorizontal: 10,
        borderRadius: 8,
        backgroundColor: 'rgba(2, 6, 23, 0.36)',
        borderWidth: 1,
        borderColor: 'rgba(167, 243, 208, 0.16)',
    },
    telemetryLabel: {
        color: '#8AA3A0',
        fontSize: 10,
        fontWeight: '700',
    },
    telemetryValue: {
        color: '#F8FAFC',
        fontSize: 13,
        fontWeight: '800',
        marginTop: 2,
    },
    locationButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(167, 243, 208, 0.20)',
        backgroundColor: 'rgba(167, 243, 208, 0.08)',
        paddingHorizontal: 10,
    },
    locationText: {
        color: '#DDFCF1',
        fontSize: 12,
        fontWeight: '800',
    },
    quickGrid: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 14,
    },
    quickAction: {
        flex: 1,
        minHeight: 48,
        borderRadius: 8,
        paddingHorizontal: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(30, 41, 59, 0.64)',
        borderWidth: 1,
        borderColor: 'rgba(125, 211, 252, 0.20)',
    },
    quickActionText: {
        color: '#E5FDF6',
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
        backgroundColor: 'rgba(167, 243, 208, 0.10)',
        borderWidth: 1,
        borderColor: 'rgba(167, 243, 208, 0.24)',
    },
    systemAvatar: {
        backgroundColor: '#A7F3D0',
    },
    messageBubble: {
        maxWidth: width * 0.76,
        borderRadius: 8,
        paddingHorizontal: 13,
        paddingVertical: 11,
    },
    aiBubble: {
        backgroundColor: 'rgba(15, 23, 42, 0.76)',
        borderWidth: 1,
        borderColor: 'rgba(167, 243, 208, 0.16)',
    },
    userBubble: {
        backgroundColor: '#A7F3D0',
    },
    errorBubble: {
        borderColor: 'rgba(248, 113, 113, 0.48)',
        backgroundColor: 'rgba(127, 29, 29, 0.35)',
    },
    messageTitle: {
        color: '#7DD3FC',
        fontSize: 12,
        fontWeight: '900',
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    messageText: {
        color: '#E2E8F0',
        fontSize: 14,
        lineHeight: 21,
    },
    userMessageText: {
        color: '#052E2B',
        fontWeight: '700',
    },
    messageTime: {
        color: '#64748B',
        fontSize: 10,
        marginTop: 7,
    },
    userMessageTime: {
        color: 'rgba(5, 46, 43, 0.55)',
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
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: 'rgba(15, 23, 42, 0.76)',
        borderWidth: 1,
        borderColor: 'rgba(167, 243, 208, 0.16)',
    },
    typingText: {
        color: '#DDFCF1',
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
        backgroundColor: 'rgba(6, 20, 24, 0.96)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(167, 243, 208, 0.12)',
    },
    inputWrap: {
        flex: 1,
        minHeight: 52,
        maxHeight: 112,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 9,
        paddingHorizontal: 13,
        paddingVertical: 13,
        backgroundColor: 'rgba(15, 23, 42, 0.82)',
        borderWidth: 1,
        borderColor: 'rgba(148, 163, 184, 0.20)',
    },
    textInput: {
        flex: 1,
        color: '#F8FAFC',
        fontSize: 14,
        lineHeight: 19,
        padding: 0,
        maxHeight: 86,
    },
    sendButton: {
        width: 52,
        height: 52,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#A7F3D0',
    },
    sendButtonDisabled: {
        opacity: 0.45,
    },
});

export default AIChatScreen;
