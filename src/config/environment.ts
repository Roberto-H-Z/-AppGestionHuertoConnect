import { Platform } from 'react-native';

/**
 * Environment Configuration
 * Centraliza las URLs y configuraciones del entorno.
 * Similar a environment.ts de Angular.
 */

// Dependiendo de si ejecutamos en un emulador o navegador (web), el localhost cambia.
const LOCAL_IP = Platform.OS === 'web' ? 'localhost' : '10.0.2.2';

export const environment = {
    production: false,
    apiUrl: `http://${LOCAL_IP}:8000/api`, // API Gateway
    services: {
        auth: `http://${LOCAL_IP}:8000/api/auth`,
        huertos: `http://${LOCAL_IP}:8000/api/huertos`,
        plagas: `http://${LOCAL_IP}:8000/api/plagas`,
        chat: `http://${LOCAL_IP}:8000/api/chat`,
        reportes: `http://${LOCAL_IP}:8000/api/reportes`,
    }
};

export default environment;
