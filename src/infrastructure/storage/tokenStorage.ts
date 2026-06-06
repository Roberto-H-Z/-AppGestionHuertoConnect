import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'huertoconnect_jwt_token';
const USER_ID_KEY = 'huertoconnect_user_id';

/**
 * Servicio para almacenamiento seguro local en el dispositivo.
 * Usa Expo SecureStore (Keychain en iOS, Keystore en Android).
 * Y localStorage como fallback para Web.
 */
export const tokenStorage = {
    /**
     * Guarda el token JWT de forma segura
     */
    saveToken: async (token: string): Promise<void> => {
        try {
            if (Platform.OS === 'web') {
                localStorage.setItem(TOKEN_KEY, token);
            } else {
                await SecureStore.setItemAsync(TOKEN_KEY, token);
            }
        } catch (error) {
            console.error('Error al guardar el token:', error);
            throw error;
        }
    },

    /**
     * Obtiene el token JWT si existe
     */
    getToken: async (): Promise<string | null> => {
        try {
            if (Platform.OS === 'web') {
                return localStorage.getItem(TOKEN_KEY);
            } else {
                return await SecureStore.getItemAsync(TOKEN_KEY);
            }
        } catch (error) {
            console.error('Error al obtener el token:', error);
            return null;
        }
    },

    /**
     * Elimina el token JWT (para logout)
     */
    deleteToken: async (): Promise<void> => {
        try {
            if (Platform.OS === 'web') {
                localStorage.removeItem(TOKEN_KEY);
            } else {
                await SecureStore.deleteItemAsync(TOKEN_KEY);
            }
        } catch (error) {
            console.error('Error al eliminar el token:', error);
        }
    },

    /**
     * Guarda el ID del usuario
     */
    saveUserId: async (userId: string): Promise<void> => {
        try {
            if (Platform.OS === 'web') {
                localStorage.setItem(USER_ID_KEY, userId);
            } else {
                await SecureStore.setItemAsync(USER_ID_KEY, userId);
            }
        } catch (error) {
            console.error('Error al guardar el ID de usuario:', error);
            throw error;
        }
    },

    /**
     * Obtiene el ID del usuario si existe
     */
    getUserId: async (): Promise<string | null> => {
        try {
            if (Platform.OS === 'web') {
                return localStorage.getItem(USER_ID_KEY);
            } else {
                return await SecureStore.getItemAsync(USER_ID_KEY);
            }
        } catch (error) {
            console.error('Error al obtener el ID de usuario:', error);
            return null;
        }
    },

    /**
     * Elimina el ID del usuario
     */
    deleteUserId: async (): Promise<void> => {
        try {
            if (Platform.OS === 'web') {
                localStorage.removeItem(USER_ID_KEY);
            } else {
                await SecureStore.deleteItemAsync(USER_ID_KEY);
            }
        } catch (error) {
            console.error('Error al eliminar el ID de usuario:', error);
        }
    },

    /**
     * Guarda un valor de texto arbitrario localmente
     */
    setItem: async (key: string, value: string): Promise<void> => {
        try {
            if (Platform.OS === 'web') {
                localStorage.setItem(key, value);
            } else {
                await SecureStore.setItemAsync(key, value);
            }
        } catch (error) {
            console.error(`Error al guardar item ${key}:`, error);
        }
    },

    /**
     * Obtiene un valor de texto guardado localmente
     */
    getItem: async (key: string): Promise<string | null> => {
        try {
            if (Platform.OS === 'web') {
                return localStorage.getItem(key);
            } else {
                return await SecureStore.getItemAsync(key);
            }
        } catch (error) {
            console.error(`Error al obtener item ${key}:`, error);
            return null;
        }
    },

    /**
     * Elimina un valor de texto guardado localmente
     */
    removeItem: async (key: string): Promise<void> => {
        try {
            if (Platform.OS === 'web') {
                localStorage.removeItem(key);
            } else {
                await SecureStore.deleteItemAsync(key);
            }
        } catch (error) {
            console.error(`Error al eliminar item ${key}:`, error);
        }
    },

    /**
     * Limpia completamente todos los datos de sesión seguros
     */
    clearAll: async (): Promise<void> => {
        await Promise.all([
            tokenStorage.deleteToken(),
            tokenStorage.deleteUserId(),
            tokenStorage.removeItem('huertoconnect_farmer_perfil'),
            tokenStorage.removeItem('huertoconnect_farmer_acceso_agua')
        ]);
    }
};
