import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View, Platform, StatusBar as RNStatusBar } from 'react-native';
import { palette, radii } from '../theme';

interface HeaderAction {
    icon: string;
    label: string;
    onPress: () => void;
}

interface AppScreenHeaderProps {
    eyebrow?: string;
    title: string;
    subtitle?: string;
    icon: string;
    actions?: HeaderAction[];
}

export const AppScreenHeader: React.FC<AppScreenHeaderProps> = ({
    eyebrow,
    title,
    subtitle,
    icon,
    actions = [],
}) => (
    <View style={styles.header}>
        <View style={styles.copy}>
            <View style={styles.icon}>
                <MaterialCommunityIcons name={icon as any} size={22} color={palette.primary} />
            </View>
            <View style={styles.text}>
                {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
                <Text style={styles.title}>{title}</Text>
                {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
        </View>
        {actions.length > 0 ? (
            <View style={styles.actions}>
                {actions.map((action) => (
                    <Pressable
                        key={action.label}
                        accessibilityLabel={action.label}
                        accessibilityRole="button"
                        hitSlop={8}
                        onPress={action.onPress}
                        style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
                    >
                        <MaterialCommunityIcons name={action.icon as any} size={21} color={palette.forest} />
                    </Pressable>
                ))}
            </View>
        ) : null}
    </View>
);

const styles = StyleSheet.create({
    header: {
        minHeight: 86,
        paddingHorizontal: 18,
        paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 24) + 14 : 14,
        paddingBottom: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: palette.canvas,
    },
    copy: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
    icon: {
        width: 44,
        height: 44,
        borderRadius: radii.medium,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: palette.primarySoft,
    },
    text: { flex: 1 },
    eyebrow: {
        marginBottom: 2,
        color: palette.primary,
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    title: { color: palette.ink, fontSize: 21, fontWeight: '800', letterSpacing: -0.5 },
    subtitle: { marginTop: 2, color: palette.muted, fontSize: 12.5, lineHeight: 17 },
    actions: { flexDirection: 'row', gap: 8, marginLeft: 10 },
    action: {
        width: 42,
        height: 42,
        borderRadius: radii.medium,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: palette.surface,
        borderWidth: 1,
        borderColor: palette.border,
    },
    actionPressed: { opacity: 0.7, backgroundColor: palette.surfaceMuted },
});
