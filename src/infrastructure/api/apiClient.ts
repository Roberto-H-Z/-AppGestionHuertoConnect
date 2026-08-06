import axios from 'axios';
import { environment } from '../../config/environment';
import { tokenStorage } from '../storage/tokenStorage';

/**
 * Cliente HTTP base para la aplicación móvil usando Axios.
 * Apunta al Gateway unificado (ngrok → microservicios).
 *
 * baseURL = environment.apiUrl  →  https://<host>/api
 * Todas las rutas son RELATIVAS al baseURL:  '/auth/login', '/huertos', etc.
 */
export const apiClient = axios.create({
    baseURL: environment.apiUrl,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        // Omitir la página de advertencia de ngrok en peticiones programáticas
        'ngrok-skip-browser-warning': 'true',
    },
    timeout: 30000, // 30 s — el gateway ngrok puede añadir latencia extra
});

// ── Interceptor de Peticiones: inyectar JWT automáticamente ───────────────────
apiClient.interceptors.request.use(
    async (config) => {
        try {
            // Para FormData hay que dejar que axios establezca Content-Type con el boundary
            if (typeof FormData !== 'undefined' && config.data instanceof FormData && config.headers) {
                delete config.headers['Content-Type'];
            }

            const token = await tokenStorage.getToken();
            if (token && config.headers) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error('[apiClient] Error al inyectar el token:', error);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ── Interceptor de Respuestas: manejar errores globales ───────────────────────
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        // 401 → sesión expirada: limpiar credenciales locales
        if (error.response?.status === 401) {
            console.warn('[apiClient] 401 Unauthorized — limpiando sesión local...');
            await tokenStorage.deleteToken();
            await tokenStorage.deleteUserId();
            // TODO: emitir evento global para redirigir al Login
        }

        // Extraer el mensaje descriptivo del formato FastAPI { detail: string | [...] }
        if (error.response?.data?.detail) {
            error.message =
                typeof error.response.data.detail === 'string'
                    ? error.response.data.detail
                    : JSON.stringify(error.response.data.detail);
        }

        return Promise.reject(error);
    }
);
