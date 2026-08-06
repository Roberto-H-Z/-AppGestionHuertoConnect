/**
 * reportesService — Generación y consulta de reportes del huerto.
 *
 * Endpoints (relativos al baseURL /api):
 *   GET  /reportes                          — Listar reportes generados
 *   POST /reportes/generar                  — Generar nuevo reporte
 *   GET  /reportes/{id}                     — Obtener reporte por ID
 *   GET  /reportes/{id}/pdf                 — Descargar reporte en PDF
 */

import { apiClient } from '../../../infrastructure/api/apiClient';
import { environment } from '../../../config/environment';

const REPORTES = environment.services.reportes; // '/reportes'

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface ReporteResponse {
    id: string;
    usuario_id: string;
    huerto_id?: string | null;
    /** 'mensual' | 'semanal' | 'personalizado' | 'cosecha' */
    tipo: string;
    periodo_inicio?: string | null;
    periodo_fin?: string | null;
    datos?: Record<string, unknown> | null;
    pdf_url?: string | null;
    fecha?: string | null;
}

export interface ReporteGenerar {
    huerto_id?: string | null;
    tipo?: string;
    periodo_inicio?: string | null;
    periodo_fin?: string | null;
}

// ── Servicio ──────────────────────────────────────────────────────────────────

export const reportesService = {

    /**
     * GET /reportes
     * Lista los reportes del usuario autenticado.
     */
    list: async (params?: { skip?: number; limit?: number; tipo?: string }): Promise<ReporteResponse[]> => {
        const res = await apiClient.get<ReporteResponse[]>(REPORTES, { params });
        return res.data ?? [];
    },

    /**
     * POST /reportes/generar
     * Genera un nuevo reporte para el huerto indicado.
     */
    generar: async (data: ReporteGenerar): Promise<ReporteResponse> => {
        const res = await apiClient.post<ReporteResponse>(`${REPORTES}/generar`, data);
        return res.data;
    },

    /**
     * GET /reportes/{id}
     * Obtiene los detalles de un reporte específico.
     */
    getById: async (reporteId: string): Promise<ReporteResponse> => {
        const res = await apiClient.get<ReporteResponse>(`${REPORTES}/${reporteId}`);
        return res.data;
    },

    /**
     * GET /reportes/{id}/pdf
     * Devuelve la URL pública del PDF del reporte.
     */
    getPdfUrl: async (reporteId: string): Promise<string | null> => {
        try {
            const res = await apiClient.get<{ pdf_url: string }>(`${REPORTES}/${reporteId}/pdf`);
            return res.data?.pdf_url ?? null;
        } catch {
            return null;
        }
    },
};

export default reportesService;
