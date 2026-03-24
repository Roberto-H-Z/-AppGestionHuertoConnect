import React from 'react';
import {
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface NotificationsModalProps {
    visible: boolean;
    onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
    visible,
    onClose,
}) => {
    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <MaterialCommunityIcons
                                name="bell-outline"
                                size={22}
                                color="#1B5E20"
                            />
                            <Text style={styles.title}>Notificaciones</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                            <MaterialCommunityIcons
                                name="close"
                                size={24}
                                color="#9E9E9E"
                            />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIconWrap}>
                                <MaterialCommunityIcons
                                    name="bell-check-outline"
                                    size={34}
                                    color="#66BB6A"
                                />
                            </View>
                            <Text style={styles.emptyTitle}>Todo en orden</Text>
                            <Text style={styles.emptySubtitle}>
                                Aún no tienes notificaciones. Cuando ocurra algo importante en tu huerto, aparecerá aquí.
                            </Text>
                        </View>
                    </ScrollView>
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
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1B5E20',
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 12,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 22,
        paddingVertical: 40,
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
