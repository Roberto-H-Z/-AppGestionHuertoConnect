/**
 * agentService — Modelo de IA generativo "Brot" de HuertoConnect.
 *
 * El agente es un asistente especializado en agricultura que utiliza un modelo
 * de lenguaje grande (LLM) con contexto de los huertos y cultivos del usuario.
 *
 * Endpoints (relativos al baseURL /api):
 *   POST   /agent/v1/chat                                  — Envía mensaje y recibe respuesta
 *   GET    /agent/v1/conversations/{conversation_id}/messages — Historial de una conversación
 *   DELETE /agent/v1/conversations/{conversation_id}        — Elimina una conversación
 *
 * Características:
 *   - Mantiene contexto de la conversación usando session_id
 *   - Tiene memoria de huertos, cultivos y alertas del usuario
 *   - Puede responder sobre plagas, riego, fertilización, clima, etc.
 *   - Genera respuestas en español optimizadas para agricultores mexicanos
 */

import { apiClient } from '../../../infrastructure/api/apiClient';
import { environment } from '../../../config/environment';

const AGENT = environment.services.agent; // '/agent/v1'

// ── Request Types ─────────────────────────────────────────────────────────────

export interface AgentChatRequest {
    /** Texto del mensaje del usuario */
    message: string;
    /**
     * ID de sesión para mantener contexto (conversación continua).
     * Si es null/undefined, el agente crea una sesión nueva.
     */
    conversation_id?: string | null;
}

// ── Response Types ────────────────────────────────────────────────────────────

export interface AgentChatResponse {
    /** Respuesta generada por el modelo */
    answer: string;
    /** ID de la sesión (úsalo para el siguiente mensaje) */
    conversation_id?: string | null;
    /** Estado y metadatos extras */
    status?: string;
    request_id?: string;
    model?: string;
}

export interface AgentAction {
    /** Tipo de acción: 'recommend_cultivo' | 'create_alert' | 'show_weather' | etc. */
    type: string;
    /** Payload de la acción */
    payload: Record<string, unknown>;
}

export interface AgentConversationMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp?: string | null;
}

// ── Service ──────────────────────────────────────────────────────────────────

export const agentService = {

    /**
     * POST /agent/v1/chat
     *
     * Envía un mensaje al agente IA "Brot" y obtiene su respuesta.
     * Mantiene el contexto de la conversación usando session_id.
     * Timeout extendido a 60s porque el LLM puede tardar.
     *
     * @param message    - Texto del usuario
     * @param conversationId  - ID de sesión (null = nueva conversación)
     */
    chat: async (
        message: string,
        conversationId?: string | null
    ): Promise<AgentChatResponse> => {
        const payload: AgentChatRequest = {
            message,
            ...(conversationId ? { conversation_id: conversationId } : {}),
        };
        console.log('[agentService] POST', `${AGENT}/chat`, { message: message.substring(0, 50), conversationId });
        const res = await apiClient.post<AgentChatResponse>(`${AGENT}/chat`, payload, {
            timeout: 60000, // 60s — los modelos LLM pueden tardar
        });
        console.log('[agentService] Respuesta OK, conversation_id:', res.data?.conversation_id);
        return res.data;
    },

    /**
     * GET /agent/v1/conversations/{conversation_id}/messages
     * Obtiene los mensajes de una conversación del agente.
     */
    getConversationMessages: async (conversationId: string): Promise<AgentConversationMessage[]> => {
        try {
            const res = await apiClient.get<AgentConversationMessage[]>(
                `${AGENT}/conversations/${conversationId}/messages`
            );
            return res.data || [];
        } catch (err: any) {
            console.warn('[agentService] Error al obtener mensajes:', err?.message);
            return [];
        }
    },

    /**
     * DELETE /agent/v1/conversations/{conversation_id}
     * Elimina una conversación del agente (borra el historial).
     */
    deleteConversation: async (conversationId: string): Promise<void> => {
        await apiClient.delete(`${AGENT}/conversations/${conversationId}`);
    },
};

export default agentService;
