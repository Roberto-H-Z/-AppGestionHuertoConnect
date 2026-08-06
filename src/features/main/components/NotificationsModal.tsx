import React, { useEffect, useState, useCallback } from 'react';
import {
    ActivityIndicator,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { notificacionService, NotificacionResponse } from '../services/notificacionService';

interface NotificationsModalProps {
    visible: boolean;
    onClose: () => void;
}

/** Devuelve el icono y color según el tipo de notificación */
const getTypeStyle = (tipo: string): { icon: string; color: string } => {
    switch (tipo) {
        case 'alerta': return { icon: 'alert-circle-outline', color: '#EF4444' };
        case 'warning': return { icon: 'alert-outline', color: '#F59E0B' };
        case 'success': return { icon: 'check-circle-outline', color: '#10B981' };
        case 'error': return { icon: 'close-circle-outline', color: '#DC2626' };
        case 'info':
        default: return { icon: 'information-outline', color: '#3B82F6' };
    }
};

/** Formatea una fecha ISO a texto relativo sencillo */
const formatFecha = (fecha?: string | null): string => {
    if (!fecha) return '';
    try {
        const d = new Date(fecha);
        const now = Date.now();
        const diff = Math.floor((now - d.getTime()) / 1000); // segundos
        if (diff < 60) return 'Ahora';
        if (diff < 3600) return `${Math.floor(diff / 60)} min`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
        return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
    } catch {
        return '';
    }
};

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ visible, onClose }) => {
    const [notifications, setNotifications] = useState<NotificacionResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [noLeidas, setNoLeidas] = useState(0);

    const loadNotifications = useCallback(async () => {
        if (!visible) return;
        setLoading(true);
        try {
            const [data, resumen] = await Promise.all([
                notificacionService.list({ limit: 30 }),
                notificacionService.getResumen().catch(() => null),
            ]);
            setNotifications(data);
            if (resumen) setNoLeidas(resumen.no_leidas);
        } catch (err) {
            console.warn('[NotificationsModal] Error al cargar notificaciones:', err);
        } finally {
            setLoading(false);
        }
    }, [visible]);

    useEffect(() => {
        loadNotifications();
    }, [loadNotifications]);

    const handleMarkAllRead = async () => {
        try {
            await notificacionService.markAllRead();
            setNotifications(prev => prev.map(n => ({ ...n, leida: true })));
            setNoLeidas(0);
        } catch (err) {
            console.warn('[NotificationsModal] Error al marcar como leídas:', err);
        }
    };

    const handleMarkRead = async (notifId: string) => {
        try {
            await notificacionService.markRead(notifId);
            setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, leida: true } : n));
            setNoLeidas(prev => Math.max(0, prev - 1));
        } catch {
            // Silencioso
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <MaterialCommunityIcons name="bell-outline" size={22} color="#1B5E20" />
                            <Text style={styles.title}>Notificaciones</Text>
                            {noLeidas > 0 && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>{noLeidas}</Text>
                                </View>
                            )}
                        </View>
                        <View style={styles.headerRight}>
                            {noLeidas > 0 && (
                                <TouchableOpacity
                                    onPress={handleMarkAllRead}
                                    style={styles.markAllBtn}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.markAllText}>Marcar leídas</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                                <MaterialCommunityIcons name="close" size={24} color="#9E9E9E" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Content */}
                    {loading ? (
                        <View style={styles.center}>
                            <ActivityIndicator color="#059669" size="large" />
                            <Text style={styles.loadingText}>Cargando notificaciones...</Text>
                        </View>
                    ) : notifications.length === 0 ? (
                        <View style={styles.center}>
                            <View style={styles.emptyIconWrap}>
                                <MaterialCommunityIcons name="bell-off-outline" size={36} color="#A7F3D0" />
                            </View>
                            <Text style={styles.emptyTitle}>Sin notificaciones</Text>
                            <Text style={styles.emptySubtitle}>
                                Recibirás alertas de tus huertos, riego, plagas y más por aquí.
                            </Text>
                        </View>
                    ) : (
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.scrollContent}
                        >
                            {notifications.map((notif) => {
                                const { icon, color } = getTypeStyle(notif.tipo);
                                return (
                                    <TouchableOpacity
                                        key={notif.id}
                                        style={[styles.notificationItem, !notif.leida && styles.notificationUnread]}
                                        activeOpacity={0.75}
                                        onPress={() => !notif.leida && handleMarkRead(notif.id)}
                                    >
                                        <View style={[styles.notificationIcon, { backgroundColor: `${color}18` }]}>
                                            <MaterialCommunityIcons name={icon as any} size={22} color={color} />
                                        </View>
                                        <View style={styles.notificationCopy}>
                                            <View style={styles.notificationTop}>
                                                <Text style={styles.notificationTitle} numberOfLines={2}>
                                                    {notif.titulo}
                                                </Text>
                                                <Text style={styles.notificationTime}>
                                                    {formatFecha(notif.fecha)}
                                                </Text>
                                            </View>
                                            <Text style={styles.notificationDetail} numberOfLines={3}>
                                                {notif.mensaje}
                                            </Text>
                                        </View>
                                        {!notif.leida && <View style={styles.unreadDot} />}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.28)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        maxHeight: '82%',
        minHeight: '45%',
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingTop: 14,
        paddingHorizontal: 18,
        paddingBottom: Platform.OS === 'ios' ? 28 : 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1B5E20',
    },
    badge: {
        backgroundColor: '#EF4444',
        borderRadius: 10,
        paddingHorizontal: 7,
        paddingVertical: 2,
        minWidth: 20,
        alignItems: 'center',
    },
    badgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '800',
    },
    markAllBtn: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        backgroundColor: '#F0FDF4',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#A7F3D0',
    },
    markAllText: {
        color: '#059669',
        fontSize: 12,
        fontWeight: '700',
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 12,
        paddingTop: 14,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 22,
        paddingVertical: 40,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#78909C',
    },
    notificationItem: {
        flexDirection: 'row',
        gap: 12,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F4F1',
        alignItems: 'flex-start',
    },
    notificationUnread: {
        backgroundColor: '#F0FDF4',
        borderRadius: 14,
        paddingHorizontal: 8,
        marginHorizontal: -8,
    },
    notificationIcon: {
        width: 44,
        height: 44,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    notificationCopy: { flex: 1 },
    notificationTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 10,
    },
    notificationTitle: {
        flex: 1,
        fontSize: 14,
        fontWeight: '800',
        color: '#1B5E20',
    },
    notificationTime: {
        fontSize: 11,
        fontWeight: '700',
        color: '#9E9E9E',
    },
    notificationDetail: {
        marginTop: 4,
        fontSize: 13,
        lineHeight: 19,
        color: '#60756B',
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#059669',
        marginTop: 6,
        flexShrink: 0,
    },
    emptyIconWrap: {
        width: 78,
        height: 78,
        borderRadius: 39,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F1F8E9',
        marginBottom: 14,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1B5E20',
    },
    emptySubtitle: {
        marginTop: 8,
        fontSize: 14,
        lineHeight: 21,
        color: '#78909C',
        textAlign: 'center',
    },
});

export default NotificationsModal;
