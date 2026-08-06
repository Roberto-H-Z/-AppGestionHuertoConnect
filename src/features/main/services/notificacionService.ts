/**
 * notificacionService — Gestión de notificaciones del usuario.
 *
 * Endpoints (relativos al baseURL /api):
 *   GET   /notificaciones                        — Listar notificaciones
 *   POST  /notificaciones                        — Crear notificación
 *   GET   /notificaciones/resumen                — Resumen/contadores
 *   PATCH /notificaciones/leer-todas             — Marcar todas como leídas
 *   PATCH /notificaciones/{id}/leer              — Marcar una como leída
 */

import { apiClient } from '../../../infrastructure/api/apiClient';
import { environment } from '../../../config/environment';

const NOTIF = environment.services.notificaciones; // '/notificaciones'

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface NotificacionResponse {
    id: string;
    usuario_id: string;
    titulo: string;
    mensaje: string;
    /** 'alerta' | 'info' | 'warning' | 'success' | 'error' */
    tipo: string;
    leida: boolean;
    referencia_id?: string | null;
    referencia_tipo?: string | null;
    fecha?: string | null;
}

export interface NotificacionCreate {
    usuario_id: string;
    titulo: string;
    mensaje: string;
    tipo?: string;
    referencia_id?: string | null;
    referencia_tipo?: string | null;
}

export interface NotificacionResumen {
    total: number;
    no_leidas: number;
    leidas: number;
    por_tipo: Record<string, number>;
}

// ── Servicio ──────────────────────────────────────────────────────────────────

export const notificacionService = {

    /**
     * GET /notificaciones
     * Lista las notificaciones del usuario autenticado.
     */
    list: async (params?: { skip?: number; limit?: number; leida?: boolean; tipo?: string }): Promise<NotificacionResponse[]> => {
        const res = await apiClient.get<NotificacionResponse[]>(NOTIF, { params });
        return res.data ?? [];
    },

    /**
     * POST /notificaciones
     * Crea y almacena una notificación para un usuario.
     */
    create: async (data: NotificacionCreate): Promise<NotificacionResponse> => {
        const res = await apiClient.post<NotificacionResponse>(NOTIF, data);
        return res.data;
    },

    /**
     * GET /notificaciones/resumen
     * Devuelve los contadores de notificaciones del usuario actual.
     */
    getResumen: async (): Promise<NotificacionResumen> => {
        const res = await apiClient.get<NotificacionResumen>(`${NOTIF}/resumen`);
        return res.data;
    },

    /**
     * PATCH /notificaciones/leer-todas
     * Marca todas las notificaciones del usuario como leídas.
     */
    markAllRead: async (): Promise<{ message: string }> => {
        const res = await apiClient.patch<{ message: string }>(`${NOTIF}/leer-todas`);
        return res.data;
    },

    /**
     * PATCH /notificaciones/{id}/leer
     * Marca una notificación específica como leída.
     */
    markRead: async (notifId: string): Promise<{ message: string }> => {
        const res = await apiClient.patch<{ message: string }>(`${NOTIF}/${notifId}/leer`);
        return res.data;
    },
};
