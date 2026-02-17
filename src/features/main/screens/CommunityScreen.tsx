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
    ScrollView,
    TouchableOpacity,
    Image,
    Animated,
    Easing,
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
    author: {
        name: string;
        avatar: string;
        location: string;
    };
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

const MOCK_POSTS: Post[] = [
    {
        id: '1',
        author: {
            name: 'María González',
            avatar: '👩‍🌾',
            location: 'Morelos, México',
        },
        cropType: 'Tomates',
        title: 'Cosecha increíble de tomates cherry 🍅',
        description: 'Después de 75 días, mis tomates cherry están perfectos. El secreto: riego por goteo y poda semanal de chupones. ¡La paciencia vale la pena!',
        image: 'https://images.unsplash.com/photo-1592921870504-f47070bf2794?w=800',
        likes: 124,
        comments: 18,
        shares: 7,
        timestamp: 'Hace 2 horas',
        isLiked: false,
    },
    {
        id: '2',
        author: {
            name: 'Carlos Ruiz',
            avatar: '👨‍🌾',
            location: 'Jalisco, México',
        },
        cropType: 'Lechugas',
        title: 'Sistema hidropónico casero',
        description: 'Construí mi sistema hidropónico con tubos PVC. Las lechugas crecen 40% más rápido que en tierra. Sistema NFT básico, súper económico.',
        image: 'https://images.unsplash.com/photo-1622383563227-04401ab4e5ea?w=800',
        likes: 89,
        comments: 23,
        shares: 15,
        timestamp: 'Hace 5 horas',
        isLiked: true,
    },
    {
        id: '3',
        author: {
            name: 'Ana Martínez',
            avatar: '👩‍🌾',
            location: 'Puebla, México',
        },
        cropType: 'Chiles',
        title: 'Chiles habaneros de color perfecto 🌶️',
        description: 'Mis habaneros cambiaron de verde a naranja intenso. Clave: exposición solar directa y fertilizante rico en potasio cada 15 días.',
        likes: 67,
        comments: 12,
        shares: 4,
        timestamp: 'Hace 1 día',
        isLiked: false,
    },
    {
        id: '4',
        author: {
            name: 'Roberto Sánchez',
            avatar: '🧑‍🌾',
            location: 'Guanajuato, México',
        },
        cropType: 'Fresas',
        title: 'Control natural de plagas',
        description: 'Planté albahaca entre las fresas y las plagas desaparecieron. Las plantas compañeras funcionan de maravilla. ¡100% orgánico!',
        image: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800',
        likes: 156,
        comments: 31,
        shares: 22,
        timestamp: 'Hace 2 días',
        isLiked: true,
    },
    {
        id: '5',
        author: {
            name: 'Laura Torres',
            avatar: '👩‍🌾',
            location: 'Veracruz, México',
        },
        cropType: 'Hierbas',
        title: 'Jardín vertical de hierbas aromáticas',
        description: 'Aproveché un espacio reducido creando un jardín vertical. Tengo albahaca, cilantro, perejil y menta. Perfecto para cocinar fresco todos los días.',
        image: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=800',
        likes: 92,
        comments: 14,
        shares: 9,
        timestamp: 'Hace 3 días',
        isLiked: false,
    },
];

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
            Animated.spring(slideAnim, {
                toValue: 1,
                friction: 8,
                useNativeDriver: true,
            }).start();
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
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                style={styles.modalOverlay}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <TouchableOpacity
                    style={styles.modalBackdrop}
                    activeOpacity={1}
                    onPress={onClose}
                />
                <Animated.View
                    style={[
                        styles.modalContent,
                        {
                            transform: [{
                                translateY: slideAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [600, 0],
                                }),
                            }],
                        },
                    ]}
                >
                    {/* Header */}
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
                            <MaterialCommunityIcons name="close" size={24} color="#757575" />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Nueva Publicación</Text>
                        <TouchableOpacity
                            onPress={handleSubmit}
                            disabled={!title.trim() || !description.trim()}
                            style={styles.modalSubmitButton}
                        >
                            <Text style={[
                                styles.modalSubmitText,
                                (!title.trim() || !description.trim()) && styles.modalSubmitTextDisabled,
                            ]}>
                                Publicar
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                        {/* Crop type selector */}
                        <Text style={styles.modalLabel}>Tipo de cultivo</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.cropSelectorScroll}
                        >
                            {CROP_OPTIONS.map((crop, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.cropOption,
                                        selectedCrop === crop && styles.cropOptionActive,
                                    ]}
                                    onPress={() => setSelectedCrop(crop)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[
                                        styles.cropOptionText,
                                        selectedCrop === crop && styles.cropOptionTextActive,
                                    ]}>
                                        {crop}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* Title input */}
                        <Text style={styles.modalLabel}>Título</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Ej: Técnica de poda para más frutos"
                            placeholderTextColor="#9E9E9E"
                            value={title}
                            onChangeText={setTitle}
                            maxLength={100}
                        />

                        {/* Description input */}
                        <Text style={styles.modalLabel}>Descripción</Text>
                        <TextInput
                            style={[styles.modalInput, styles.modalInputMultiline]}
                            placeholder="Comparte tu experiencia y consejos..."
                            placeholderTextColor="#9E9E9E"
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            maxLength={500}
                            textAlignVertical="top"
                        />
                        <Text style={styles.characterCount}>
                            {description.length}/500
                        </Text>
                    </ScrollView>
                </Animated.View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

// ═══════════════════════════════════════════
// ██  FILTER CHIP
// ═══════════════════════════════════════════

const FilterChip: React.FC<{
    label: string;
    isActive: boolean;
    onPress: () => void;
}> = ({ label, isActive, onPress }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.95,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 3,
            useNativeDriver: true,
        }).start();
    };

    return (
        <TouchableOpacity
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <Animated.View
                style={[
                    styles.filterChip,
                    isActive && styles.filterChipActive,
                    { transform: [{ scale: scaleAnim }] },
                ]}
            >
                <Text style={[
                    styles.filterChipText,
                    isActive && styles.filterChipTextActive,
                ]}>
                    {label}
                </Text>
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
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                friction: 8,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <Animated.View
            style={[
                styles.postCard,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                },
            ]}
        >
            {/* Author header */}
            <View style={styles.postHeader}>
                <View style={styles.authorInfo}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarEmoji}>{post.author.avatar}</Text>
                    </View>
                    <View style={styles.authorTextContainer}>
                        <Text style={styles.authorName}>{post.author.name}</Text>
                        <View style={styles.metaRow}>
                            <MaterialCommunityIcons name="map-marker" size={12} color="#66BB6A" />
                            <Text style={styles.authorLocation}>{post.author.location}</Text>
                            <Text style={styles.timestamp}>• {post.timestamp}</Text>
                        </View>
                    </View>
                </View>
                <TouchableOpacity style={styles.moreButton}>
                    <MaterialCommunityIcons name="dots-vertical" size={20} color="#9E9E9E" />
                </TouchableOpacity>
            </View>

            {/* Crop tag */}
            <View style={styles.cropTag}>
                <MaterialCommunityIcons name="sprout" size={14} color="#2E7D32" />
                <Text style={styles.cropTagText}>{post.cropType}</Text>
            </View>

            {/* Content */}
            <Text style={styles.postTitle}>{post.title}</Text>
            <Text style={styles.postDescription}>{post.description}</Text>

            {/* Image */}
            {post.image && (
                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: post.image }}
                        style={styles.postImage}
                        resizeMode="cover"
                    />
                </View>
            )}

            {/* Interaction bar */}
            <View style={styles.interactionBar}>
                <TouchableOpacity
                    style={styles.interactionButton}
                    onPress={() => onLike(post.id)}
                    activeOpacity={0.7}
                >
                    <MaterialCommunityIcons
                        name={post.isLiked ? 'heart' : 'heart-outline'}
                        size={22}
                        color={post.isLiked ? '#E53935' : '#757575'}
                    />
                    <Text style={[
                        styles.interactionText,
                        post.isLiked && styles.interactionTextActive,
                    ]}>
                        {post.likes}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.interactionButton} activeOpacity={0.7}>
                    <MaterialCommunityIcons name="comment-outline" size={22} color="#757575" />
                    <Text style={styles.interactionText}>{post.comments}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.interactionButton} activeOpacity={0.7}>
                    <MaterialCommunityIcons name="share-variant-outline" size={22} color="#757575" />
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
        setPosts(prevPosts =>
            prevPosts.map(post =>
                post.id === postId
                    ? {
                        ...post,
                        isLiked: !post.isLiked,
                        likes: post.isLiked ? post.likes - 1 : post.likes + 1,
                    }
                    : post
            )
        );
    };

    const handleCreatePost = (title: string, description: string, cropType: string) => {
        const newPost: Post = {
            id: Date.now().toString(),
            author: {
                name: 'Tú',
                avatar: '🧑‍🌾',
                location: 'Tu ubicación',
            },
            cropType,
            title,
            description,
            likes: 0,
            comments: 0,
            shares: 0,
            timestamp: 'Ahora mismo',
            isLiked: false,
        };
        setPosts(prev => [newPost, ...prev]);
    };

    const filteredPosts = selectedFilter === 'Todos'
        ? posts
        : posts.filter(post => post.cropType === selectedFilter);

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <MaterialCommunityIcons name="account-group" size={26} color="#4CAF50" />
                    <Text style={styles.headerTitle}>Comunidad</Text>
                </View>
                <TouchableOpacity style={styles.headerAction}>
                    <MaterialCommunityIcons name="magnify" size={24} color="#66BB6A" />
                </TouchableOpacity>
            </View>

            {/* Filters */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filtersContainer}
                contentContainerStyle={styles.filtersContent}
            >
                {CROP_FILTERS.map((filter, index) => (
                    <FilterChip
                        key={index}
                        label={filter}
                        isActive={selectedFilter === filter}
                        onPress={() => setSelectedFilter(filter)}
                    />
                ))}
            </ScrollView>

            {/* Posts feed */}
            <ScrollView
                style={styles.feed}
                contentContainerStyle={styles.feedContent}
                showsVerticalScrollIndicator={false}
            >
                {filteredPosts.map(post => (
                    <PostCard key={post.id} post={post} onLike={handleLike} />
                ))}

                {filteredPosts.length === 0 && (
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="sprout-outline" size={60} color="#C8E6C9" />
                        <Text style={styles.emptyStateText}>
                            No hay publicaciones de {selectedFilter}
                        </Text>
                    </View>
                )}
            </ScrollView>

            {/* FAB — Create post */}
            <TouchableOpacity
                style={styles.fab}
                activeOpacity={0.8}
                onPress={() => setModalVisible(true)}
            >
                <MaterialCommunityIcons name="plus" size={28} color="#fff" />
            </TouchableOpacity>

            {/* Create post modal */}
            <CreatePostModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onSubmit={handleCreatePost}
            />
        </View>
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
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1B5E20',
        marginLeft: 10,
        letterSpacing: 0.3,
    },
    headerAction: {
        padding: 6,
    },

    // ── Filters ──
    filtersContainer: {
        maxHeight: 52,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(76, 175, 80, 0.08)',
    },
    filtersContent: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F1F8E9',
        borderWidth: 1.5,
        borderColor: '#C8E6C9',
    },
    filterChipActive: {
        backgroundColor: '#4CAF50',
        borderColor: '#4CAF50',
    },
    filterChipText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2E7D32',
    },
    filterChipTextActive: {
        color: '#fff',
    },

    // ── Feed ──
    feed: {
        flex: 1,
    },
    feedContent: {
        paddingTop: 12,
        paddingBottom: 90,
    },

    // ── Post card ──
    postCard: {
        backgroundColor: '#fff',
        marginHorizontal: 12,
        marginBottom: 12,
        borderRadius: 16,
        padding: 16,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
            },
            android: { elevation: 3 },
        }),
    },
    postHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    authorInfo: {
        flexDirection: 'row',
        flex: 1,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#E8F5E9',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#C8E6C9',
        marginRight: 10,
    },
    avatarEmoji: {
        fontSize: 24,
    },
    authorTextContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    authorName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1B5E20',
        marginBottom: 3,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    authorLocation: {
        fontSize: 12,
        color: '#66BB6A',
        marginLeft: 3,
        marginRight: 6,
    },
    timestamp: {
        fontSize: 12,
        color: '#9E9E9E',
    },
    moreButton: {
        padding: 4,
    },
    cropTag: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        backgroundColor: '#E8F5E9',
        marginBottom: 12,
    },
    cropTagText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#2E7D32',
        marginLeft: 4,
    },
    postTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1B5E20',
        marginBottom: 8,
        lineHeight: 23,
    },
    postDescription: {
        fontSize: 15,
        color: '#558B2F',
        lineHeight: 22,
        marginBottom: 12,
    },
    imageContainer: {
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 14,
    },
    postImage: {
        width: '100%',
        height: 220,
        backgroundColor: '#E8F5E9',
    },
    interactionBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(76, 175, 80, 0.1)',
        gap: 24,
    },
    interactionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    interactionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#757575',
    },
    interactionTextActive: {
        color: '#E53935',
    },

    // ── Empty state ──
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyStateText: {
        fontSize: 16,
        color: '#9E9E9E',
        marginTop: 16,
    },

    // ── FAB ──
    fab: {
        position: 'absolute',
        right: 16,
        bottom: 100,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#388E3C',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4,
                shadowRadius: 10,
            },
            android: { elevation: 6 },
        }),
    },

    // ── Modal ──
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '85%',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
            },
            android: { elevation: 8 },
        }),
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(76, 175, 80, 0.1)',
    },
    modalCloseButton: {
        padding: 4,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1B5E20',
    },
    modalSubmitButton: {
        padding: 4,
    },
    modalSubmitText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#4CAF50',
    },
    modalSubmitTextDisabled: {
        color: '#C8E6C9',
    },
    modalBody: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 24,
    },
    modalLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1B5E20',
        marginBottom: 8,
        marginTop: 16,
    },
    cropSelectorScroll: {
        maxHeight: 46,
        marginBottom: 8,
    },
    cropOption: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F1F8E9',
        borderWidth: 1.5,
        borderColor: '#C8E6C9',
        marginRight: 8,
    },
    cropOptionActive: {
        backgroundColor: '#4CAF50',
        borderColor: '#4CAF50',
    },
    cropOptionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2E7D32',
    },
    cropOptionTextActive: {
        color: '#fff',
    },
    modalInput: {
        backgroundColor: '#F1F8E9',
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#C8E6C9',
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: '#1B5E20',
    },
    modalInputMultiline: {
        height: 140,
        paddingTop: 12,
    },
    characterCount: {
        fontSize: 12,
        color: '#9E9E9E',
        textAlign: 'right',
        marginTop: 6,
    },
});

export default CommunityScreen;
