import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const BIOMETRIC_ENABLED_KEY = 'biometric_enabled_'; // + userId

// ── Availability checks ──

/**
 * Returns true if the device has biometric hardware (Face ID sensor,
 * fingerprint reader, etc.).
 */
export const hasBiometricHardware = async (): Promise<boolean> => {
    try {
        return await LocalAuthentication.hasHardwareAsync();
    } catch {
        return false;
    }
};

/**
 * Returns true if the user has enrolled at least one biometric method
 * (e.g. a registered face or fingerprint on the device).
 */
export const isBiometricEnrolled = async (): Promise<boolean> => {
    try {
        return await LocalAuthentication.isEnrolledAsync();
    } catch {
        return false;
    }
};

/**
 * Full check: hardware available AND user has enrolled biometrics.
 */
export const isBiometricAvailable = async (): Promise<boolean> => {
    const hasHardware = await hasBiometricHardware();
    const isEnrolled = await isBiometricEnrolled();
    return hasHardware && isEnrolled;
};

/**
 * Returns the supported biometric types on this device
 * (e.g. FACIAL_RECOGNITION, FINGERPRINT, IRIS).
 */
export const getSupportedBiometricTypes = async () => {
    try {
        return await LocalAuthentication.supportedAuthenticationTypesAsync();
    } catch {
        return [];
    }
};

// ── Authentication prompt ──

/**
 * Shows the system biometric dialog (Face ID, fingerprint, etc.).
 * Returns { success, error }.
 */
export const authenticate = async (
    promptMessage = 'Inicia sesión con biometría'
): Promise<{ success: boolean; error?: string }> => {
    try {
        const result = await LocalAuthentication.authenticateAsync({
            promptMessage,
            fallbackLabel: 'Usar contraseña',
            disableDeviceFallback: false, // Allow PIN/pattern as fallback
            cancelLabel: 'Cancelar',
        });

        if (result.success) {
            return { success: true };
        }

        return {
            success: false,
            error: result.error || 'Autenticación biométrica cancelada',
        };
    } catch {
        return { success: false, error: 'Error al acceder a la biometría' };
    }
};

// ── User preference (per-user setting stored in SecureStore) ──

/**
 * Save whether the user wants biometric login enabled.
 */
export const setBiometricEnabled = async (
    userId: string,
    enabled: boolean
): Promise<void> => {
    try {
        await SecureStore.setItemAsync(
            BIOMETRIC_ENABLED_KEY + userId,
            enabled ? 'true' : 'false'
        );
    } catch {
        // Ignore errors
    }
};

/**
 * Check if the user has opted in to biometric login.
 */
export const isBiometricEnabled = async (
    userId: string
): Promise<boolean> => {
    try {
        const value = await SecureStore.getItemAsync(
            BIOMETRIC_ENABLED_KEY + userId
        );
        return value === 'true';
    } catch {
        return false;
    }
};
