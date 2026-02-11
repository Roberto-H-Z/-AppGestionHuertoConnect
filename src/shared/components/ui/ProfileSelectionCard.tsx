import React from 'react';
import {
    TouchableOpacity,
    View,
    Text,
    StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface ProfileSelectionCardProps {
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    title: string;
    description: string;
    selected: boolean;
    onPress: () => void;
}

export const ProfileSelectionCard: React.FC<ProfileSelectionCardProps> = ({
    icon,
    title,
    description,
    selected,
    onPress,
}) => {
    return (
        <TouchableOpacity
            style={[
                styles.container,
                selected && styles.containerSelected,
            ]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <View style={styles.iconContainer}>
                <MaterialCommunityIcons
                    name={icon}
                    size={32}
                    color="#4CAF50"
                />
            </View>
            <View style={styles.textContainer}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.description}>{description}</Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        borderWidth: 2,
        borderColor: 'transparent',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    containerSelected: {
        borderColor: '#4CAF50',
        backgroundColor: '#f1f8f4',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#E8F5E9',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    textContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1B5E20',
        marginBottom: 4,
    },
    description: {
        fontSize: 13,
        color: '#66BB6A',
        lineHeight: 18,
    },
});

export default ProfileSelectionCard;
