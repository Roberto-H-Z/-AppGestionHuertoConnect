/**
 * chatbotService — CRUD operations for the Chatbot conversations & messages.
 * All endpoints require JWT (injected automatically by apiClient interceptor).
 *
 * API endpoints:
 *   GET    /chatbot/conversaciones                    — List conversations
 *   POST   /chatbot/conversaciones                    — Create conversation
 *   GET    /chatbot/conversaciones/{conv_id}/mensajes  — List messages
 *   POST   /chatbot/conversaciones/{conv_id}/mensajes  — Create message (user prompt)
 *   PATCH  /chatbot/conversaciones/{conv_id}/cerrar    — Close conversation
 */

import { apiClient } from '../../../infrastructure/api/apiClient';

// ── Types ──────────────────────────────────────────────────────

/** Mensaje individual dentro de una conversación */
export interface MensajeOut {
    id: string;
    conversacion_id: string;
    rol: 'user' | 'assistant' | 'system';
    contenido: string;
    fecha?: string | null;
}

/** Conversación (sin mensajes) */
export interface ConversacionOut {
    id: string;
    usuario_id: string;
    tema: string;
    ultimo_mensaje?: string | null;
    estado: string; // 'activa' | 'cerrada'
    fecha?: string | null;
}

/** Payload para crear una conversación */
export interface ConversacionCreate {
    tema: string;
}

/** Payload para enviar una pregunta al chatbot */
export interface MensajeCreate {
    contenido: string;
    rol?: 'user' | 'assistant' | 'system';
}

// ── Service ────────────────────────────────────────────────────

export const chatbotService = {

    /**
     * GET /chatbot/conversaciones
     * Lista las conversaciones del usuario autenticado.
     */
    listConversaciones: async (skip = 0, limit = 20): Promise<ConversacionOut[]> => {
        const res = await apiClient.get('/chatbot/conversaciones', {
            params: { skip, limit },
        });
        return res.data || [];
    },

    /**
     * POST /chatbot/conversaciones
     * Crea una nueva conversación con un tema dado.
     */
    createConversacion: async (data: ConversacionCreate): Promise<ConversacionOut> => {
        const res = await apiClient.post('/chatbot/conversaciones', data);
        return res.data;
    },

    /**
     * GET /chatbot/conversaciones/{conv_id}/mensajes
     * Lista todos los mensajes de una conversación.
     */
    listMensajes: async (convId: string): Promise<MensajeOut[]> => {
        const res = await apiClient.get(`/chatbot/conversaciones/${convId}/mensajes`);
        return res.data || [];
    },

    /**
     * POST /chatbot/conversaciones/{conv_id}/mensajes
     * Envía un mensaje a la conversación.
     */
    createMensaje: async (convId: string, data: MensajeCreate): Promise<MensajeOut> => {
        const res = await apiClient.post(`/chatbot/conversaciones/${convId}/mensajes`, data);
        return res.data;
    },

    /**
     * PATCH /chatbot/conversaciones/{conv_id}/cerrar
     * Cierra una conversación.
     */
    closeConversacion: async (convId: string): Promise<{ message: string }> => {
        const res = await apiClient.patch(`/chatbot/conversaciones/${convId}/cerrar`);
        return res.data;
    },
};
