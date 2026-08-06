/**
 * Environment Configuration
 * Centraliza las URLs y configuraciones del entorno.
 *
 * Gateway unificado: todas las rutas pasan por /api/*
 * Auth:         /api/auth/...
 * Huertos:      /api/huertos/... | /api/regiones/... | /api/cultivos/...
 * Plagas/IA:    /api/plagas/...  | /api/alertas/...  | /api/predicciones/...
 * Chatbot:      /api/chatbot/...
 * Agent IA:     /api/agent/v1/...
 * Reportes:     /api/reportes/...
 * Notifs:       /api/notificaciones/...
 * Usuarios:     /api/usuarios/...
 */

const GATEWAY_BASE = 'https://crudeness-retaining-rearview.ngrok-free.dev/api';

export const environment = {
    production: true,

    /** Base URL del gateway — usado por apiClient.baseURL */
    apiUrl: GATEWAY_BASE,

    /** Prefijos de servicio (relativos al baseURL del apiClient) */
    services: {
        // Auth OTP
        auth: '/auth',

        // Huertos, Regiones, Cultivos, Siembras, IA recomendar
        huertos: '/huertos',
        regiones: '/regiones',
        cultivos: '/cultivos',

        // Plagas / IA YOLOv8
        plagas: '/plagas',

        // Chatbot
        chatbot: '/chatbot',

        // Agent IA (Brot)
        agent: '/agent/v1',

        // Reportes & Auditoría
        reportes: '/reportes',
        auditoria: '/auditoria',

        // Notificaciones
        notificaciones: '/notificaciones',

        // Usuarios (admin)
        usuarios: '/usuarios',

        // Dashboard KPIs
        dashboard: '/dashboard',
    },
};

export default environment;
