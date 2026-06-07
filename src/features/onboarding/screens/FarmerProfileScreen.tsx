import React, { useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Dimensions,
    Animated,
    SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import { Button } from '../../../shared/components/ui';
import { ProfileSelectionCard } from '../../../shared/components/ui/ProfileSelectionCard';

const { width, height } = Dimensions.get('window');

type ProfileType = 'novice' | 'intermediate' | 'large-scale' | null;

export const FarmerProfileScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
    const [selectedProfile, setSelectedProfile] = useState<ProfileType>(null);

    // Animaciones
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const cardsSlide = useRef(new Animated.Value(50)).current;

    useFocusEffect(
        useCallback(() => {
            // Resetear animaciones
            fadeAnim.setValue(0);
            slideAnim.setValue(30);
            cardsSlide.setValue(50);

            // Animación de entrada
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(cardsSlide, {
                    toValue: 0,
                    duration: 1000,
                    delay: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }, [fadeAnim, slideAnim, cardsSlide])
    );

    const handleNext = () => {
        navigation?.navigate('GardenArea', { perfil: selectedProfile });
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Título */}
                <Animated.View
                    style={[
                        styles.headerContainer,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        },
                    ]}
                >
                    <Text style={styles.title}>¿Cuál es tu perfil de agricultor?</Text>
                </Animated.View>

                {/* Opciones de perfil */}
                <Animated.View
                    style={[
                        styles.cardsContainer,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: cardsSlide }],
                        },
                    ]}
                >
                    <ProfileSelectionCard
                        icon="sprout"
                        title="Agricultor Novato"
                        description="Estoy empezando mi primer huerto."
                        selected={selectedProfile === 'novice'}
                        onPress={() => setSelectedProfile('novice')}
                    />

                    <ProfileSelectionCard
                        icon="leaf"
                        title="Productor Intermedio"
                        description="Tengo algo de experiencia y busco optimizar."
                        selected={selectedProfile === 'intermediate'}
                        onPress={() => setSelectedProfile('intermediate')}
                    />

                    <ProfileSelectionCard
                        icon="pine-tree"
                        title="Cultivador a Gran Escala"
                        description="Gestiono cultivos extensos y busco análisis."
                        selected={selectedProfile === 'large-scale'}
                        onPress={() => setSelectedProfile('large-scale')}
                    />
                </Animated.View>

                {/* Botón siguiente */}
                <Animated.View
                    style={[
                        styles.buttonContainer,
                        {
                            opacity: fadeAnim,
                        },
                    ]}
                >
                    <Button
                        title="Siguiente"
                        onPress={handleNext}
                        disabled={!selectedProfile}
                        style={styles.nextButton}
                    />
                </Animated.View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: height * 0.08,
        paddingBottom: 40,
    },
    headerContainer: {
        marginBottom: 32,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#111827',
        textAlign: 'center',
        lineHeight: 32,
    },
    cardsContainer: {
        marginBottom: 32,
    },
    buttonContainer: {
        marginTop: 'auto',
    },
    nextButton: {
        width: '100%',
    },
});

export default FarmerProfileScreen;
