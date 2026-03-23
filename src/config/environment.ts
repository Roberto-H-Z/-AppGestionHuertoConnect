import { Platform } from 'react-native';

/**
 * Environment Configuration
 * Centraliza las URLs y configuraciones del entorno.
 * Similar a environment.ts de Angular.
 */

// Web keeps localhost. Physical devices must use the PC LAN IP.
const WEB_HOST = 'localhost';
const DEVICE_HOST = '192.168.1.68';
const API_HOST = Platform.OS === 'web' ? WEB_HOST : DEVICE_HOST;

export const environment = {
    production: false,
    apiUrl: `http://${API_HOST}:8000/api`, // API Gateway
    services: {
        auth: `http://${API_HOST}:8000/api/auth`,
        huertos: `http://${API_HOST}:8000/api/huertos`,
        plagas: `http://${API_HOST}:8000/api/plagas`,
        chat: `http://${API_HOST}:8000/api/chat`,
        reportes: `http://${API_HOST}:8000/api/reportes`,
    }
};

export default environment;
