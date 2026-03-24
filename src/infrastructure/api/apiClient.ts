import axios from 'axios';
import { environment } from '../../config/environment';
import { tokenStorage } from '../storage/tokenStorage';

/**
 * Cliente HTTP base para la aplicación móvil usando Axios.
 * Configurado con la URL base del Gateway (microservicios).
 */
export const apiClient = axios.create({
    baseURL: environment.apiUrl,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    timeout: 20000,
});

// Interceptor de Peticiones: Añadir Token JWT automáticamente
apiClient.interceptors.request.use(
    async (config) => {
        try {
            if (typeof FormData !== 'undefined' && config.data instanceof FormData && config.headers) {
                delete config.headers['Content-Type'];
            }

            const token = await tokenStorage.getToken();
            if (token && config.headers) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error('Error al obtener el token en el interceptor:', error);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor de Respuestas: Manejar expiración de token/errores globales
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        // Redirigir al login si es 401 Unauthorized sin importar el endpoint
        // (En un futuro se podría añadir lógica para Refresh Tokens aquí)
        if (error.response && error.response.status === 401) {
            console.warn('Sesión expirada o no autorizada (401). Limpiando token...');
            await tokenStorage.deleteToken();
            await tokenStorage.deleteUserId();
            // TODO: Emitir evento o usar Context para redirigir a Login globalmente
        }

        // Mejorar los mensajes de error de la API si vienen en el formato { detail: string } (FastAPI)
        if (error.response && error.response.data && error.response.data.detail) {
            error.message = typeof error.response.data.detail === 'string'
                ? error.response.data.detail
                : JSON.stringify(error.response.data.detail);
        }

        return Promise.reject(error);
    }
);
