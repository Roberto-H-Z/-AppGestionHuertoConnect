/**
 * CommunityScreen — Social feed for sharing crop tips and ideas.
 * Users can view posts, like, comment, and filter by crop type.
 * Static demo with mock posts from community members.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    Image,
    Animated,
    Platform,
    Dimensions,
    Modal,
    TextInput,
    KeyboardAvoidingView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// ═══════════════════════════════════════════
// ██  TYPES
// ═══════════════════════════════════════════

interface Post {
    id: string;
    author: { name: string; avatar: string; location: string };
    cropType: string;
    title: string;
    description: string;
    image?: string;
    likes: number;
    comments: number;
    shares: number;
    timestamp: string;
    isLiked: boolean;
}

// ═══════════════════════════════════════════
// ██  MOCK DATA
// ═══════════════════════════════════════════

const CROP_FILTERS = ['Todos', 'Tomates', 'Lechugas', 'Chiles', 'Fresas', 'Hierbas'];
const MOCK_POSTS: Post[] = [];

// ═══════════════════════════════════════════
// ██  CREATE POST MODAL
// ═══════════════════════════════════════════

const CreatePostModal: React.FC<{
    visible: boolean;
    onClose: () => void;
    onSubmit: (title: string, description: string, cropType: string) => void;
}> = ({ visible, onClose, onSubmit }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedCrop, setSelectedCrop] = useState('Tomates');
    const slideAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.spring(slideAnim, { toValue: 1, friction: 8, useNativeDriver: true }).start();
        } else {
            slideAnim.setValue(0);
        }
    }, [visible]);

    const handleSubmit = () => {
        if (!title.trim() || !description.trim()) return;
        onSubmit(title.trim(), description.trim(), selectedCrop);
        setTitle('');
        setDescription('');
        setSelectedCrop('Tomates');
        onClose();
    };

    const CROP_OPTIONS = ['Tomates', 'Lechugas', 'Chiles', 'Fresas', 'Hierbas'];

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose} />
                <Animated.View
                    style={[
                        styles.modalContent,
                        { transform: [{ translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [600, 0] }) }] },
                    ]}
                >
                    <View style={styles.modalHandle} />
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
                            <MaterialCommunityIcons name="close" size={20} color="#6B7280" />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Nueva Publicación</Text>
                        <TouchableOpacity
                            onPress={handleSubmit}
                            disabled={!title.trim() || !description.trim()}
                            style={[styles.modalSubmitButton, (!title.trim() || !description.trim()) && styles.modalSubmitButtonDisabled]}
                        >
                            <Text style={styles.modalSubmitText}>Publicar</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                        <Text style={styles.modalLabel}>Tipo de cultivo</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cropSelectorScroll}>
                            {CROP_OPTIONS.map((crop, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[styles.cropOption, selectedCrop === crop && styles.cropOptionActive]}
                                    onPress={() => setSelectedCrop(crop)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.cropOptionText, selectedCrop === crop && styles.cropOptionTextActive]}>
                                        {crop}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <Text style={styles.modalLabel}>Título</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Ej: Técnica de poda para más frutos"
                            placeholderTextColor="#9CA3AF"
                            value={title}
                            onChangeText={setTitle}
                            maxLength={100}
                        />

                        <Text style={styles.modalLabel}>Descripción</Text>
                        <TextInput
                            style={[styles.modalInput, styles.modalInputMultiline]}
                            placeholder="Comparte tu experiencia y consejos..."
                            placeholderTextColor="#9CA3AF"
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            maxLength={500}
                            textAlignVertical="top"
                        />
                        <Text style={styles.characterCount}>{description.length}/500</Text>
                    </ScrollView>
                </Animated.View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

// ═══════════════════════════════════════════
// ██  FILTER CHIP
// ═══════════════════════════════════════════

const FilterChip: React.FC<{ label: string; isActive: boolean; onPress: () => void }> = ({ label, isActive, onPress }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }).start();
    const handlePressOut = () => Animated.spring(scaleAnim, { toValue: 1, friction: 3, useNativeDriver: true }).start();

    return (
        <TouchableOpacity onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={onPress} activeOpacity={0.8}>
            <Animated.View style={[styles.filterChip, isActive && styles.filterChipActive, { transform: [{ scale: scaleAnim }] }]}>
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>{label}</Text>
            </Animated.View>
        </TouchableOpacity>
    );
};

// ═══════════════════════════════════════════
// ██  POST CARD
// ═══════════════════════════════════════════

const PostCard: React.FC<{ post: Post; onLike: (id: string) => void }> = ({ post, onLike }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.spring(slideAnim, { toValue: 0, friction: 8, useNativeDriver: true }),
        ]).start();
    }, []);

    return (
        <Animated.View style={[styles.postCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            {/* Author header */}
            <View style={styles.postHeader}>
                <View style={styles.authorInfo}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarEmoji}>{post.author.avatar}</Text>
                    </View>
                    <View style={styles.authorTextContainer}>
                        <Text style={styles.authorName}>{post.author.name}</Text>
                        <View style={styles.metaRow}>
                            <MaterialCommunityIcons name="map-marker" size={12} color="#059669" />
                            <Text style={styles.authorLocation}>{post.author.location}</Text>
                            <Text style={styles.timestamp}>• {post.timestamp}</Text>
                        </View>
                    </View>
                </View>
                <TouchableOpacity style={styles.moreButton}>
                    <MaterialCommunityIcons name="dots-vertical" size={20} color="#9CA3AF" />
                </TouchableOpacity>
            </View>

            {/* Crop tag */}
            <View style={styles.cropTag}>
                <MaterialCommunityIcons name="sprout" size={13} color="#059669" />
                <Text style={styles.cropTagText}>{post.cropType}</Text>
            </View>

            <Text style={styles.postTitle}>{post.title}</Text>
            <Text style={styles.postDescription}>{post.description}</Text>

            {post.image && (
                <View style={styles.imageContainer}>
                    <Image source={{ uri: post.image }} style={styles.postImage} resizeMode="cover" />
                </View>
            )}

            {/* Interaction bar */}
            <View style={styles.interactionBar}>
                <TouchableOpacity style={styles.interactionButton} onPress={() => onLike(post.id)} activeOpacity={0.7}>
                    <MaterialCommunityIcons name={post.isLiked ? 'heart' : 'heart-outline'} size={21} color={post.isLiked ? '#EF4444' : '#9CA3AF'} />
                    <Text style={[styles.interactionText, post.isLiked && styles.interactionTextActive]}>{post.likes}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.interactionButton} activeOpacity={0.7}>
                    <MaterialCommunityIcons name="comment-outline" size={21} color="#9CA3AF" />
                    <Text style={styles.interactionText}>{post.comments}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.interactionButton} activeOpacity={0.7}>
                    <MaterialCommunityIcons name="share-variant-outline" size={21} color="#9CA3AF" />
                    <Text style={styles.interactionText}>{post.shares}</Text>
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
};

// ═══════════════════════════════════════════
// ██  MAIN SCREEN
// ═══════════════════════════════════════════

export const CommunityScreen: React.FC = () => {
    const [selectedFilter, setSelectedFilter] = useState('Todos');
    const [posts, setPosts] = useState(MOCK_POSTS);
    const [modalVisible, setModalVisible] = useState(false);

    const handleLike = (postId: string) => {
        setPosts(prev => prev.map(post =>
            post.id === postId
                ? { ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likes - 1 : post.likes + 1 }
                : post
        ));
    };

    const handleCreatePost = (title: string, description: string, cropType: string) => {
        const newPost: Post = {
            id: Date.now().toString(),
            author: { name: 'Tú', avatar: '🧑‍🌾', location: 'Tu ubicación' },
            cropType, title, description,
            likes: 0, comments: 0, shares: 0,
            timestamp: 'Ahora mismo', isLiked: false,
        };
        setPosts(prev => [newPost, ...prev]);
    };

    const filteredPosts = selectedFilter === 'Todos' ? posts : posts.filter(p => p.cropType === selectedFilter);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={styles.headerIconBg}>
                        <MaterialCommunityIcons name="account-group" size={22} color="#059669" />
                    </View>
                    <Text style={styles.headerTitle}>Comunidad</Text>
                </View>
                <TouchableOpacity style={styles.headerAction}>
                    <MaterialCommunityIcons name="magnify" size={22} color="#374151" />
                </TouchableOpacity>
            </View>

            {/* Filters */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer} contentContainerStyle={styles.filtersContent}>
                {CROP_FILTERS.map((filter, index) => (
                    <FilterChip key={index} label={filter} isActive={selectedFilter === filter} onPress={() => setSelectedFilter(filter)} />
                ))}
            </ScrollView>

            {/* Posts feed */}
            <ScrollView style={styles.feed} contentContainerStyle={styles.feedContent} showsVerticalScrollIndicator={false}>
                {filteredPosts.map(post => (
                    <PostCard key={post.id} post={post} onLike={handleLike} />
                ))}

                {filteredPosts.length === 0 && (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIconBg}>
                            <MaterialCommunityIcons name="account-group-outline" size={40} color="#059669" />
                        </View>
                        <Text style={styles.emptyStateText}>No hay publicaciones de {selectedFilter}</Text>
                        <Text style={styles.emptyStateSubtext}>¡Sé el primero en publicar!</Text>
                    </View>
                )}
            </ScrollView>

            {/* FAB */}
            <TouchableOpacity style={styles.fab} activeOpacity={0.85} onPress={() => setModalVisible(true)}>
                <MaterialCommunityIcons name="plus" size={26} color="#fff" />
            </TouchableOpacity>

            <CreatePostModal visible={modalVisible} onClose={() => setModalVisible(false)} onSubmit={handleCreatePost} />
        </SafeAreaView>
    );
};

// ═══════════════════════════════════════════
// ██  STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FAFAFA' },

    // ── Header ──────────────────────────────────────────────
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 13,
        backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
        elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 6,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    headerIconBg: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827', letterSpacing: -0.3 },
    headerAction: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },

    // ── Filters ───────────────────────────────────────────────
    filtersContainer: { maxHeight: 52, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
    filtersContent: { paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
    filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6' },
    filterChipActive: { backgroundColor: '#059669' },
    filterChipText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
    filterChipTextActive: { color: '#fff' },

    // ── Feed ──────────────────────────────────────────────────
    feed: { flex: 1 },
    feedContent: { paddingTop: 12, paddingBottom: 90 },

    // ── Post card ─────────────────────────────────────────────
    postCard: {
        backgroundColor: '#FFFFFF', marginHorizontal: 14, marginBottom: 12, borderRadius: 18, padding: 16,
        borderWidth: 1, borderColor: '#F3F4F6',
        elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6,
    },
    postHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    authorInfo: { flexDirection: 'row', flex: 1 },
    avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    avatarEmoji: { fontSize: 22 },
    authorTextContainer: { flex: 1, justifyContent: 'center' },
    authorName: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 3, letterSpacing: -0.1 },
    metaRow: { flexDirection: 'row', alignItems: 'center' },
    authorLocation: { fontSize: 12, color: '#059669', marginLeft: 3, marginRight: 6, fontWeight: '500' },
    timestamp: { fontSize: 12, color: '#9CA3AF' },
    moreButton: { padding: 4 },
    cropTag: {
        flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
        paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
        backgroundColor: '#ECFDF5', marginBottom: 10, borderWidth: 1, borderColor: '#D1FAE5',
    },
    cropTagText: { fontSize: 12, fontWeight: '600', color: '#059669', marginLeft: 4 },
    postTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 6, lineHeight: 22, letterSpacing: -0.3 },
    postDescription: { fontSize: 14, color: '#4B5563', lineHeight: 21, marginBottom: 12 },
    imageContainer: { borderRadius: 12, overflow: 'hidden', marginBottom: 14 },
    postImage: { width: '100%', height: 220, backgroundColor: '#F3F4F6' },
    interactionBar: { flexDirection: 'row', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6', gap: 24 },
    interactionButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    interactionText: { fontSize: 14, fontWeight: '600', color: '#9CA3AF' },
    interactionTextActive: { color: '#EF4444' },

    // ── Empty state ───────────────────────────────────────────
    emptyState: { alignItems: 'center', paddingVertical: 60, gap: 10 },
    emptyIconBg: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
    emptyStateText: { fontSize: 15, color: '#374151', fontWeight: '600' },
    emptyStateSubtext: { fontSize: 13, color: '#9CA3AF' },

    // ── FAB ───────────────────────────────────────────────────
    fab: {
        position: 'absolute', right: 16, bottom: 100, width: 54, height: 54, borderRadius: 27,
        backgroundColor: '#059669', justifyContent: 'center', alignItems: 'center',
        shadowColor: '#059669', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 8,
    },

    // ── Modal ─────────────────────────────────────────────────
    modalOverlay: { flex: 1, justifyContent: 'flex-end' },
    modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
    modalContent: {
        backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%',
        elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.12, shadowRadius: 16,
    },
    modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB', alignSelf: 'center', marginTop: 12, marginBottom: 4 },
    modalHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
    },
    modalCloseButton: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
    modalTitle: { fontSize: 17, fontWeight: '700', color: '#111827', letterSpacing: -0.3 },
    modalSubmitButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#059669' },
    modalSubmitButtonDisabled: { backgroundColor: '#D1FAE5' },
    modalSubmitText: { fontSize: 14, fontWeight: '700', color: '#fff' },
    modalBody: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 },
    modalLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 16, letterSpacing: 0.1 },
    cropSelectorScroll: { maxHeight: 46, marginBottom: 8 },
    cropOption: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6', marginRight: 8 },
    cropOptionActive: { backgroundColor: '#059669' },
    cropOptionText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
    cropOptionTextActive: { color: '#fff' },
    modalInput: {
        backgroundColor: '#F9FAFB', borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E7EB',
        paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#1F2937',
    },
    modalInputMultiline: { height: 130, paddingTop: 12 },
    characterCount: { fontSize: 12, color: '#9CA3AF', textAlign: 'right', marginTop: 6 },
});

export default CommunityScreen;
