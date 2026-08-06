/**
 * huertoService — CRUD operations for Huertos, Regiones, Cultivos & Siembras.
 *
 * Endpoints (relativos al baseURL del apiClient = /api):
 *   GET    /huertos                         — Listar huertos del usuario
 *   POST   /huertos                         — Crear huerto
 *   GET    /huertos/{id}                    — Obtener huerto
 *   PUT    /huertos/{id}                    — Actualizar huerto
 *   DELETE /huertos/{id}                    — Eliminar huerto (soft-delete)
 *   POST   /huertos/recomendar              — IA: recomendar cultivos por ubicación
 *
 *   GET    /regiones                        — Listar regiones
 *   GET    /regiones/{id}                   — Obtener región
 *   POST   /regiones                        — Crear región
 *   PUT    /regiones/{id}                   — Actualizar región
 *   DELETE /regiones/{id}                   — Eliminar región
 *   GET    /regiones/{id}/plantios          — Plantíos de una región
 *
 *   GET    /cultivos                        — Listar cultivos
 *   POST   /cultivos                        — Crear cultivo
 *   PUT    /cultivos/{id}                   — Actualizar cultivo
 *   DELETE /cultivos/{id}                   — Eliminar cultivo
 *   POST   /cultivos/siembras               — Asociar cultivo a huerto (siembra)
 *   GET    /cultivos/siembras/{huerto_id}   — Listar siembras de un huerto
 *
 * Todos los endpoints requieren JWT (inyectado por el interceptor de apiClient).
 */

import { apiClient } from '../../../infrastructure/api/apiClient';
import type {
    Huerto,
    HuertoCreate,
    HuertoUpdate,
    Region,
    RegionCreate,
    Cultivo,
    CultivoCreate,
    Siembra,
    SiembraCreate,
    RecomendarCultivosRequest,
    RecomendarCultivosResponse,
} from '../types/cropTypes';

export const huertoService = {

    // ═══════════════════════════════════════════════════════════════
    // HUERTOS
    // ═══════════════════════════════════════════════════════════════

    /** GET /huertos — Lista los huertos del usuario autenticado */
    getHuertos: async (params?: { skip?: number; limit?: number; region_id?: string; estado?: string }): Promise<Huerto[]> => {
        const res = await apiClient.get('/huertos', { params });
        return res.data ?? [];
    },

    /** GET /huertos/{id} — Obtiene un huerto específico */
    getHuerto: async (id: string): Promise<Huerto> => {
        const res = await apiClient.get(`/huertos/${id}`);
        return res.data;
    },

    /** POST /huertos — Crea un nuevo huerto asignado al usuario actual */
    createHuerto: async (data: HuertoCreate): Promise<Huerto> => {
        const res = await apiClient.post('/huertos', data);
        return res.data;
    },

    /** PUT /huertos/{id} — Actualiza un huerto */
    updateHuerto: async (id: string, data: HuertoUpdate): Promise<Huerto> => {
        const res = await apiClient.put(`/huertos/${id}`, data);
        return res.data;
    },

    /** DELETE /huertos/{id} — Soft-delete de un huerto */
    deleteHuerto: async (id: string): Promise<{ message: string }> => {
        const res = await apiClient.delete(`/huertos/${id}`);
        return res.data;
    },

    /**
     * POST /huertos/recomendar
     * IA Random Forest: recomienda cultivos según el clima real de la ubicación.
     */
    recomendarCultivos: async (data: RecomendarCultivosRequest): Promise<RecomendarCultivosResponse> => {
        const res = await apiClient.post('/huertos/recomendar', data);
        return res.data;
    },

    // ═══════════════════════════════════════════════════════════════
    // REGIONES
    // ═══════════════════════════════════════════════════════════════

    /** GET /regiones — Lista todas las regiones */
    getRegiones: async (params?: { skip?: number; limit?: number }): Promise<Region[]> => {
        const res = await apiClient.get('/regiones', { params });
        return res.data ?? [];
    },

    /** GET /regiones/{id} — Obtiene una región específica */
    getRegion: async (id: string): Promise<Region> => {
        const res = await apiClient.get(`/regiones/${id}`);
        return res.data;
    },

    /** POST /regiones — Crea una nueva región */
    createRegion: async (data: RegionCreate): Promise<Region> => {
        const res = await apiClient.post('/regiones', data);
        return res.data;
    },

    /** PUT /regiones/{id} — Actualiza una región */
    updateRegion: async (id: string, data: Partial<RegionCreate>): Promise<Region> => {
        const res = await apiClient.put(`/regiones/${id}`, data);
        return res.data;
    },

    /** DELETE /regiones/{id} — Elimina una región */
    deleteRegion: async (id: string): Promise<{ message: string }> => {
        const res = await apiClient.delete(`/regiones/${id}`);
        return res.data;
    },

    // ═══════════════════════════════════════════════════════════════
    // CULTIVOS
    // ═══════════════════════════════════════════════════════════════

    /** GET /cultivos — Lista todos los cultivos disponibles */
    getCultivos: async (params?: { skip?: number; limit?: number; activo?: boolean }): Promise<Cultivo[]> => {
        const res = await apiClient.get('/cultivos', { params });
        return res.data ?? [];
    },

    /** POST /cultivos — Crea un nuevo tipo de cultivo */
    createCultivo: async (data: CultivoCreate): Promise<Cultivo> => {
        const res = await apiClient.post('/cultivos', data);
        return res.data;
    },

    /** PUT /cultivos/{id} — Actualiza un cultivo */
    updateCultivo: async (id: string, data: Partial<CultivoCreate>): Promise<Cultivo> => {
        const res = await apiClient.put(`/cultivos/${id}`, data);
        return res.data;
    },

    /** DELETE /cultivos/{id} — Elimina un cultivo */
    deleteCultivo: async (id: string): Promise<{ message: string }> => {
        const res = await apiClient.delete(`/cultivos/${id}`);
        return res.data;
    },

    // ═══════════════════════════════════════════════════════════════
    // SIEMBRAS (Huerto ↔ Cultivo)
    // ═══════════════════════════════════════════════════════════════

    /** GET /cultivos/siembras/{huerto_id} — Lista todas las siembras de un huerto */
    getSiembras: async (huertoId: string): Promise<Siembra[]> => {
        const res = await apiClient.get(`/cultivos/siembras/${huertoId}`);
        return res.data ?? [];
    },

    /** POST /cultivos/siembras — Asocia un cultivo a un huerto */
    createSiembra: async (data: SiembraCreate): Promise<Siembra> => {
        const res = await apiClient.post('/cultivos/siembras', data);
        return res.data;
    },
};
