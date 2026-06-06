/**
 * huertoService — CRUD operations for Huertos, Regiones, Cultivos & Siembras.
 * All endpoints require JWT (injected automatically by apiClient interceptor).
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

    /** GET /huertos — List all huertos for the authenticated user */
    getHuertos: async (): Promise<Huerto[]> => {
        const res = await apiClient.get('/huertos');
        return res.data || [];
    },

    /** GET /huertos/{id} — Get a single huerto by ID */
    getHuerto: async (id: string): Promise<Huerto> => {
        const res = await apiClient.get(`/huertos/${id}`);
        return res.data;
    },

    /** POST /huertos — Create a new huerto */
    createHuerto: async (data: HuertoCreate): Promise<Huerto> => {
        const res = await apiClient.post('/huertos', data);
        return res.data;
    },

    /** PUT /huertos/{id} — Update an existing huerto */
    updateHuerto: async (id: string, data: HuertoUpdate): Promise<Huerto> => {
        const res = await apiClient.put(`/huertos/${id}`, data);
        return res.data;
    },

    /** DELETE /huertos/{id} — Delete a huerto */
    deleteHuerto: async (id: string): Promise<void> => {
        await apiClient.delete(`/huertos/${id}`);
    },

    /** POST /huertos/recomendar — Recommend crops using location and real weather */
    recomendarCultivos: async (
        data: RecomendarCultivosRequest
    ): Promise<RecomendarCultivosResponse> => {
        const res = await apiClient.post('/huertos/recomendar', data);
        return res.data;
    },

    // ═══════════════════════════════════════════════════════════════
    // REGIONES
    // ═══════════════════════════════════════════════════════════════

    /** GET /regiones — List all regions */
    getRegiones: async (): Promise<Region[]> => {
        const res = await apiClient.get('/regiones');
        return res.data || [];
    },

    /** GET /regiones/{id} — Get a single region */
    getRegion: async (id: string): Promise<Region> => {
        const res = await apiClient.get(`/regiones/${id}`);
        return res.data;
    },

    /** POST /regiones — Create a new region */
    createRegion: async (data: RegionCreate): Promise<Region> => {
        const res = await apiClient.post('/regiones', data);
        return res.data;
    },

    // ═══════════════════════════════════════════════════════════════
    // CULTIVOS
    // ═══════════════════════════════════════════════════════════════

    /** GET /cultivos — List all available crops */
    getCultivos: async (): Promise<Cultivo[]> => {
        const res = await apiClient.get('/cultivos');
        return res.data || [];
    },

    /** POST /cultivos — Create a new crop type */
    createCultivo: async (data: CultivoCreate): Promise<Cultivo> => {
        const res = await apiClient.post('/cultivos', data);
        return res.data;
    },

    // ═══════════════════════════════════════════════════════════════
    // SIEMBRAS (Huerto ↔ Cultivo relationship)
    // ═══════════════════════════════════════════════════════════════

    /** GET /cultivos/siembras/{huerto_id} — Get all siembras for a huerto */
    getSiembras: async (huertoId: string): Promise<Siembra[]> => {
        const res = await apiClient.get(`/cultivos/siembras/${huertoId}`);
        return res.data || [];
    },

    /** POST /cultivos/siembras — Associate a cultivo to a huerto */
    createSiembra: async (data: SiembraCreate): Promise<Siembra> => {
        const res = await apiClient.post('/cultivos/siembras', data);
        return res.data;
    },
};
