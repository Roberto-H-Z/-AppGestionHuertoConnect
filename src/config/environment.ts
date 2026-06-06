// Platform import removed — single production URL used for all platforms

/**
 * Environment Configuration
 * Centraliza las URLs y configuraciones del entorno.
 * Similar a environment.ts de Angular.
 */

const PRODUCTION_API_BASE_URL = 'http://3.17.60.253:8000/api';
const API_BASE_URL = PRODUCTION_API_BASE_URL;

export const environment = {
    production: false,
    apiUrl: API_BASE_URL,
    services: {
        auth: `${API_BASE_URL}/auth`,
        huertos: `${API_BASE_URL}/huertos`,
        plagas: `${API_BASE_URL}/plagas`,
        chat: `${API_BASE_URL}/chat`,
        reportes: `${API_BASE_URL}/reportes`,
    }
};

export default environment;
