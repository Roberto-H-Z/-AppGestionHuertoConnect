/**
 * HuertoCard — Collapsible card displaying huerto information.
 * Compact: icon + nombre + estado badge + salud bar
 * Expanded: region, siembras list, weather, specs link
 */

import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    LayoutAnimation,
    Platform,
    UIManager,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { HuertoConDetalles, ESTADO_COLORS, SiembraConCultivo } from '../types/cropTypes';
import { palette, radii, shadows } from '../theme';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface HuertoCardProps {
    data: HuertoConDetalles;
    defaultExpanded?: boolean;
    onWeatherPress?: () => void;
    onSpecsPress?: (cultivoNombre: string) => void;
    onDeletePress?: (huertoId: string) => void;
    weatherText?: string;
}

// ── Siembra row ──

const SiembraItem: React.FC<{
    siembra: SiembraConCultivo;
    onSpecsPress?: (nombre: string) => void;
}> = ({ siembra, onSpecsPress }) => {
    const estadoColors: Record<string, string> = {
        Activo: '#4CAF50',
        Cosechado: '#FF9800',
        Perdido: '#EF5350',
    };

    const nombre = siembra.cultivo?.nombre || 'Cultivo desconocido';
    const fecha = siembra.fecha_siembra
        ? new Date(siembra.fecha_siembra + 'T12:00:00').toLocaleDateString('es-MX', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        })
        : 'Sin fecha';

    return (
        <TouchableOpacity
            style={styles.siembraItem}
            activeOpacity={onSpecsPress ? 0.7 : 1}
            onPress={() => onSpecsPress?.(nombre)}
        >
            <View style={styles.siembraIcon}>
                <MaterialCommunityIcons name="sprout" size={18} color="#66BB6A" />
            </View>
            <View style={styles.siembraInfo}>
                <Text style={styles.siembraNombre}>{nombre}</Text>
                <Text style={styles.siembraFecha}>{fecha}</Text>
            </View>
            <View style={[styles.siembraEstadoBadge, { backgroundColor: (estadoColors[siembra.estado] || '#9E9E9E') + '20' }]}>
                <View style={[styles.siembraEstadoDot, { backgroundColor: estadoColors[siembra.estado] || '#9E9E9E' }]} />
                <Text style={[styles.siembraEstadoText, { color: estadoColors[siembra.estado] || '#9E9E9E' }]}>
                    {siembra.estado}
                </Text>
            </View>
        </TouchableOpacity>
    );
};

// ── Summary item ──

const SummaryItem: React.FC<{
    icon: string;
    label: string;
    value: string;
    color?: string;
    onPress?: () => void;
}> = ({ icon, label, value, color = '#4CAF50', onPress }) => {
    const content = (
        <View style={[styles.summaryItem, onPress && styles.summaryItemTappable]}>
            <MaterialCommunityIcons name={icon as any} size={22} color={color} />
            <Text style={styles.summaryLabel}>{label}</Text>
            <Text style={styles.summaryValue}>{value}</Text>
        </View>
    );

    if (onPress) {
        return (
            <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={{ width: '47%' }}>
                {React.cloneElement(content, { style: [styles.summaryItem, styles.summaryItemTappable] })}
            </TouchableOpacity>
        );
    }
    return content;
};

// ── Main component ──

export const HuertoCard: React.FC<HuertoCardProps> = ({
    data,
    defaultExpanded = false,
    onWeatherPress,
    onSpecsPress,
    onDeletePress,
    weatherText = '-- °C',
}) => {
    const { huerto, region, siembras } = data;
    const [expanded, setExpanded] = useState(defaultExpanded);
    const rotateAnim = useRef(new Animated.Value(defaultExpanded ? 1 : 0)).current;

    const estadoStyle = ESTADO_COLORS[huerto.estado] || ESTADO_COLORS.Optimo;

    const toggleExpand = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        Animated.timing(rotateAnim, {
            toValue: expanded ? 0 : 1,
            duration: 250,
            useNativeDriver: false,
        }).start();
        setExpanded(!expanded);
    };

    const chevronRotation = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg'],
    });

    const saludPercent = Math.min(100, Math.max(0, huerto.salud));

    return (
        <View style={styles.card}>
            {/* Header - always visible */}
            <TouchableOpacity
                onPress={toggleExpand}
                activeOpacity={0.8}
                style={styles.cardHeader}
            >
                <View style={[styles.iconContainer, { backgroundColor: estadoStyle.bg }]}>
                    <MaterialCommunityIcons name="sprout" size={28} color={estadoStyle.text} />
                </View>
                <View style={styles.headerInfo}>
                    <View style={styles.headerTopRow}>
                        <Text style={styles.huertoName} numberOfLines={1}>{huerto.nombre}</Text>
                        <View style={[styles.estadoBadge, { backgroundColor: estadoStyle.bg }]}>
                            <Text style={[styles.estadoText, { color: estadoStyle.text }]}>{huerto.estado}</Text>
                        </View>
                    </View>
                    {huerto.municipio ? (
                        <Text style={styles.municipioText}>{huerto.municipio}</Text>
                    ) : null}
                    {/* Compact salud bar */}
                    <View style={styles.saludBarCompact}>
                        <View style={[styles.saludBarFill, { width: `${saludPercent}%`, backgroundColor: estadoStyle.bar }]} />
                    </View>
                </View>
                <Animated.View style={{ transform: [{ rotate: chevronRotation }] }}>
                    <MaterialCommunityIcons name="chevron-down" size={24} color="#9E9E9E" />
                </Animated.View>
            </TouchableOpacity>

            {/* Expanded content */}
            {expanded && (
                <View style={styles.expandedContent}>
                    {/* Salud section */}
                    <View style={styles.saludSection}>
                        <Text style={styles.sectionLabel}>Salud del Huerto</Text>
                        <View style={styles.saludRow}>
                            <View style={styles.saludBarBg}>
                                <View
                                    style={[styles.saludBarFillLarge, { width: `${saludPercent}%`, backgroundColor: estadoStyle.bar }]}
                                />
                            </View>
                            <Text style={[styles.saludPercent, { color: estadoStyle.text }]}>{saludPercent}%</Text>
                        </View>
                    </View>

                    {/* Region badge */}
                    {region && (
                        <View style={styles.regionBadge}>
                            <MaterialCommunityIcons name="map-marker-outline" size={16} color="#66BB6A" />
                            <Text style={styles.regionText}>{region.nombre}</Text>
                            <View style={[
                                styles.actividadDot,
                                {
                                    backgroundColor: region.actividad === 'Alta' ? '#4CAF50'
                                        : region.actividad === 'Media' ? '#FFC107' : '#EF5350',
                                },
                            ]} />
                            <Text style={styles.actividadText}>{region.actividad}</Text>
                        </View>
                    )}

                    {/* Siembras list */}
                    {siembras.length > 0 && (
                        <View style={styles.siembrasSection}>
                            <Text style={styles.sectionLabel}>
                                Cultivos Sembrados ({siembras.length})
                            </Text>
                            {siembras.map((s) => (
                                <SiembraItem
                                    key={s.id}
                                    siembra={s}
                                    onSpecsPress={onSpecsPress}
                                />
                            ))}
                        </View>
                    )}

                    {/* Summary grid */}
                    <Text style={styles.summaryTitle}>Información</Text>
                    <View style={styles.summaryGrid}>
                        <SummaryItem
                            icon="white-balance-sunny"
                            label="Clima"
                            value={weatherText}
                            color="#FFA726"
                            onPress={onWeatherPress}
                        />
                        <SummaryItem
                            icon="calendar-clock"
                            label="Creado"
                            value={huerto.created_at
                                ? new Date(huerto.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
                                : 'Reciente'
                            }
                        />
                    </View>

                    {/* Delete button */}
                    {onDeletePress && (
                        <TouchableOpacity
                            style={styles.deleteBtn}
                            onPress={() => onDeletePress(huerto.id)}
                            activeOpacity={0.7}
                        >
                            <MaterialCommunityIcons name="delete-outline" size={18} color="#EF5350" />
                            <Text style={styles.deleteBtnText}>Eliminar huerto</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: palette.surface,
        borderRadius: radii.large,
        marginHorizontal: 0,
        marginBottom: 14,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: palette.border,
        ...shadows.card,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    headerInfo: {
        flex: 1,
    },
    headerTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 2,
    },
    huertoName: {
        fontSize: 17,
        fontWeight: '700',
        color: palette.forest,
        flex: 1,
        marginRight: 8,
    },
    estadoBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
    },
    estadoText: {
        fontSize: 11,
        fontWeight: '700',
    },
    municipioText: {
        fontSize: 12,
        color: palette.muted,
        fontWeight: '500',
        marginBottom: 4,
    },
    saludBarCompact: {
        height: 4,
        backgroundColor: '#E0E0E0',
        borderRadius: 2,
        overflow: 'hidden',
        marginTop: 2,
    },
    saludBarFill: {
        height: '100%',
        borderRadius: 2,
    },

    // Expanded
    expandedContent: {
        paddingHorizontal: 14,
        paddingBottom: 16,
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: palette.text,
        marginBottom: 8,
    },
    saludSection: {
        backgroundColor: palette.surfaceMuted,
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
    },
    saludRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    saludBarBg: {
        flex: 1,
        height: 10,
        backgroundColor: '#E0E0E0',
        borderRadius: 5,
        overflow: 'hidden',
    },
    saludBarFillLarge: {
        height: '100%',
        borderRadius: 5,
    },
    saludPercent: {
        fontSize: 16,
        fontWeight: '800',
        minWidth: 42,
        textAlign: 'right',
    },

    // Region
    regionBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
        marginBottom: 14,
    },
    regionText: {
        fontSize: 13,
        color: '#2E7D32',
        fontWeight: '600',
    },
    actividadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    actividadText: {
        fontSize: 11,
        color: '#66BB6A',
        fontWeight: '500',
    },

    // Siembras
    siembrasSection: {
        marginBottom: 14,
    },
    siembraItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: palette.surfaceMuted,
        borderRadius: 10,
        padding: 10,
        marginBottom: 6,
    },
    siembraIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#E8F5E9',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    siembraInfo: {
        flex: 1,
    },
    siembraNombre: {
        fontSize: 14,
        fontWeight: '600',
        color: palette.forest,
    },
    siembraFecha: {
        fontSize: 11,
        color: palette.muted,
        marginTop: 1,
    },
    siembraEstadoBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    siembraEstadoDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    siembraEstadoText: {
        fontSize: 11,
        fontWeight: '600',
    },

    // Summary grid
    summaryTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: palette.forest,
        marginBottom: 10,
    },
    summaryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 14,
    },
    summaryItem: {
        width: '47%',
        backgroundColor: '#F1F8E9',
        borderRadius: 12,
        padding: 14,
    },
    summaryItemTappable: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#C8E6C9',
    },
    summaryLabel: {
        fontSize: 11,
        color: palette.muted,
        marginTop: 6,
        fontWeight: '500',
    },
    summaryValue: {
        fontSize: 13,
        color: palette.forest,
        fontWeight: '700',
        marginTop: 2,
    },

    // Delete
    deleteBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: '#FFEBEE',
        marginTop: 4,
    },
    deleteBtnText: {
        fontSize: 13,
        color: '#EF5350',
        fontWeight: '600',
    },
});

export default HuertoCard;
