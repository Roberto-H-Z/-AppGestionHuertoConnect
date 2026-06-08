import { Platform, ViewStyle } from 'react-native';

export const palette = {
    canvas: '#F4F7F2',
    surface: '#FFFFFF',
    surfaceMuted: '#EDF3EA',
    forest: '#163B2D',
    primary: '#2F6B4F',
    primaryStrong: '#24543F',
    primarySoft: '#DDECE2',
    sage: '#88A98F',
    amber: '#D89532',
    amberSoft: '#F8EBD5',
    ink: '#17221D',
    text: '#34443C',
    muted: '#6E7C74',
    border: '#DDE5DE',
    danger: '#B94A48',
    dangerSoft: '#F8E5E3',
} as const;

export const radii = {
    small: 12,
    medium: 18,
    large: 26,
    pill: 999,
} as const;

export const shadows = {
    card: Platform.select<ViewStyle>({
        ios: {
            shadowColor: '#163B2D',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.08,
            shadowRadius: 16,
        },
        android: { elevation: 3 },
        web: {
            // @ts-ignore React Native Web supports boxShadow.
            boxShadow: '0 8px 24px rgba(22, 59, 45, 0.08)',
        },
        default: {},
    }),
} as const;
