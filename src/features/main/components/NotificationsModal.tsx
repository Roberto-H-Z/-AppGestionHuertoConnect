/**
 * NotificationsModal — Bottom-sheet modal displaying system notifications.
 * Users can mark individual notifications as read/unread and mark all as read.
 * Static demo with mock notification data.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
    Platform,
    Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// ═══════════════════════════════════════════
// ██  TYPES
// ═══════════════════════════════════════════

interface Notification {
    id: string;
    icon: string;
    iconColor: string;
    iconBg: string;
    title: string;
    description: string;
    timestamp: string;
    isRead: boolean;
}

interface NotificationsModalProps {
    visible: boolean;
    onClose: () => void;
}

// ═══════════════════════════════════════════
// ██  MOCK DATA
// ═══════════════════════════════════════════

const INITIAL_NOTIFICATIONS: Notification[] = [
    {
        id: '1',
        icon: 'water-alert',
        iconColor: '#42A5F5',
        iconBg: '#E3F2FD',
        title: 'Riego programado',
        description: 'Tus tomates necesitan riego hoy. No olvides revisar la humedad del suelo.',
        timestamp: 'Hace 10 min',
        isRead: false,
    },
    {
        id: '2',
        icon: 'weather-sunny-alert',
        iconColor: '#FFA726',
        iconBg: '#FFF3E0',
        title: 'Alerta de temperatura',
        description: 'Se esperan temperaturas altas (38°C) mañana. Considera proteger tus cultivos.',
        timestamp: 'Hace 1 hora',
        isRead: false,
    },
    {
        id: '3',
        icon: 'sprout',
        iconColor: '#66BB6A',
        iconBg: '#E8F5E9',
        title: 'Cosecha lista',
        description: 'Tus lechugas están listas para cosechar. ¡Han pasado 45 días desde la siembra!',
        timestamp: 'Hace 3 horas',
        isRead: false,
    },
    {
        id: '4',
        icon: 'bug-outline',
        iconColor: '#EF5350',
        iconBg: '#FFEBEE',
        title: 'Plaga detectada',
        description: 'Se ha detectado actividad de pulgón en la zona de chiles. Revisa tu cultivo.',
        timestamp: 'Hace 5 horas',
        isRead: true,
    },
    {
        id: '5',
        icon: 'account-group',
        iconColor: '#AB47BC',
        iconBg: '#F3E5F5',
        title: 'Nuevo tip de la comunidad',
        description: 'María González compartió un consejo sobre riego por goteo que podría interesarte.',
        timestamp: 'Hace 1 día',
        isRead: true,
    },
    {
        id: '6',
        icon: 'chart-line',
        iconColor: '#26A69A',
        iconBg: '#E0F2F1',
        title: 'Reporte semanal listo',
        description: 'Tu reporte de seguimiento semanal está disponible. Revisa el progreso de tus cultivos.',
        timestamp: 'Hace 2 días',
        isRead: true,
    },
];

// ═══════════════════════════════════════════
// ██  NOTIFICATION ITEM
// ═══════════════════════════════════════════

const NotificationItem: React.FC<{
    notification: Notification;
    onToggleRead: (id: string) => void;
    index: number;
}> = ({ notification, onToggleRead, index }) => {
    const slideAnim = useRef(new Animated.Value(40)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 350,
                delay: index * 60,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 350,
                delay: index * 60,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <Animated.View
            style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
            }}
        >
            <TouchableOpacity
                style={[
                    styles.notificationItem,
                    !notification.isRead && styles.notificationUnread,
                ]}
                activeOpacity={0.6}
                onPress={() => onToggleRead(notification.id)}
            >
                {/* Unread indicator dot */}
                {!notification.isRead && <View style={styles.unreadDot} />}

                {/* Icon */}
                <View
                    style={[
                        styles.notifIconContainer,
                        { backgroundColor: notification.iconBg },
                    ]}
                >
                    <MaterialCommunityIcons
                        name={notification.icon as any}
                        size={22}
                        color={notification.iconColor}
                    />
                </View>

                {/* Content */}
                <View style={styles.notifContent}>
                    <View style={styles.notifHeader}>
                        <Text
                            style={[
                                styles.notifTitle,
                                !notification.isRead && styles.notifTitleUnread,
                            ]}
                            numberOfLines={1}
                        >
                            {notification.title}
                        </Text>
                        <Text style={styles.notifTimestamp}>
                            {notification.timestamp}
                        </Text>
                    </View>
                    <Text
                        style={[
                            styles.notifDescription,
                            !notification.isRead && styles.notifDescriptionUnread,
                        ]}
                        numberOfLines={2}
                    >
                        {notification.description}
                    </Text>
                </View>

                {/* Read/Unread toggle icon */}
                <TouchableOpacity
                    style={styles.toggleReadBtn}
                    activeOpacity={0.5}
                    onPress={() => onToggleRead(notification.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <MaterialCommunityIcons
                        name={notification.isRead ? 'email-outline' : 'email-open-outline'}
                        size={18}
                        color={notification.isRead ? '#BDBDBD' : '#4CAF50'}
                    />
                </TouchableOpacity>
            </TouchableOpacity>
        </Animated.View>
    );
};

// ═══════════════════════════════════════════
// ██  MAIN MODAL
// ═══════════════════════════════════════════

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
    visible,
    onClose,
}) => {
    const [notifications, setNotifications] = useState<Notification[]>(
        INITIAL_NOTIFICATIONS
    );

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    const handleToggleRead = (id: string) => {
        setNotifications((prev) =>
            prev.map((n) =>
                n.id === id ? { ...n, isRead: !n.isRead } : n
            )
        );
    };

    const handleMarkAllRead = () => {
        setNotifications((prev) =>
            prev.map((n) => ({ ...n, isRead: true }))
        );
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
                            <MaterialCommunityIcons
                                name="bell-outline"
                                size={22}
                                color="#1B5E20"
                            />
                            <Text style={styles.title}>Notificaciones</Text>
                            {unreadCount > 0 && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>
                                        {unreadCount}
                                    </Text>
                                </View>
                            )}
                        </View>
                        <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                            <MaterialCommunityIcons
                                name="close"
                                size={24}
                                color="#9E9E9E"
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Mark all as read */}
                    {unreadCount > 0 && (
                        <TouchableOpacity
                            style={styles.markAllBtn}
                            activeOpacity={0.7}
                            onPress={handleMarkAllRead}
                        >
                            <MaterialCommunityIcons
                                name="check-all"
                                size={16}
                                color="#4CAF50"
                            />
                            <Text style={styles.markAllText}>
                                Marcar todo como leído
                            </Text>
                        </TouchableOpacity>
                    )}

                    {/* Notifications List */}
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        {notifications.map((notification, index) => (
                            <NotificationItem
                                key={notification.id}
                                notification={notification}
                                onToggleRead={handleToggleRead}
                                index={index}
                            />
                        ))}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

// ═══════════════════════════════════════════
// ██  STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: Platform.OS === 'ios' ? 36 : 24,
        maxHeight: '85%',
    },

    // ── Header ──
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1B5E20',
    },
    badge: {
        backgroundColor: '#E53935',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 6,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#fff',
    },

    // ── Mark all ──
    markAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-end',
        gap: 4,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
        backgroundColor: '#E8F5E9',
        marginBottom: 12,
    },
    markAllText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4CAF50',
    },

    // ── Scroll ──
    scrollContent: {
        paddingBottom: 10,
    },

    // ── Notification Item ──
    notificationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 14,
        marginBottom: 8,
        borderRadius: 16,
        backgroundColor: '#FAFAFA',
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    notificationUnread: {
        backgroundColor: '#F1F8E9',
        borderColor: '#C8E6C9',
    },

    // ── Unread dot ──
    unreadDot: {
        position: 'absolute',
        top: 14,
        left: 6,
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#4CAF50',
    },

    // ── Icon ──
    notifIconContainer: {
        width: 42,
        height: 42,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },

    // ── Content ──
    notifContent: {
        flex: 1,
    },
    notifHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 3,
    },
    notifTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#616161',
        flex: 1,
    },
    notifTitleUnread: {
        fontWeight: '700',
        color: '#1B5E20',
    },
    notifTimestamp: {
        fontSize: 11,
        color: '#BDBDBD',
        fontWeight: '500',
        marginLeft: 8,
    },
    notifDescription: {
        fontSize: 12,
        color: '#9E9E9E',
        lineHeight: 17,
    },
    notifDescriptionUnread: {
        color: '#757575',
    },

    // ── Toggle read button ──
    toggleReadBtn: {
        marginLeft: 10,
        padding: 4,
    },
});

export default NotificationsModal;
