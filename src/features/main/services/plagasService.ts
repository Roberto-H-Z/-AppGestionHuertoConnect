/**
 * plagasService — CRUD de alertas/registros de plagas del huerto.
 *
 * NOTA: Este servicio es para REGISTROS de plagas en BD (diferente de
 * aiModelService.detectPest que ejecuta el modelo YOLOv8).
 *
 * Endpoints (relativos al baseURL /api):
 *   GET    /alertas               — Listar alertas del usuario
 *   POST   /alertas               — Crear alerta de plaga
 *   GET    /alertas/{id}          — Obtener alerta
 *   PATCH  /alertas/{id}          — Actualizar alerta (estado)
 *   DELETE /alertas/{id}          — Eliminar alerta
 *   GET    /predicciones          — Listar predicciones guardadas
 *   POST   /predicciones          — Guardar predicción de cultivo
 *   GET    /predicciones/{id}     — Obtener predicción
 */

import { apiClient } from '../../../infrastructure/api/apiClient';

// ── Tipos: Alertas ────────────────────────────────────────────────────────────

export interface AlertaResponse {
    id: string;
    huerto_id: string;
    tipo: string;
    descripcion: string;
    severidad: 'Baja' | 'Media' | 'Alta' | 'Crítica';
    estado: 'Pendiente' | 'En_tratamiento' | 'Resuelta';
    imagen_url?: string | null;
    fecha?: string | null;
    nombre_plaga?: string | null;
    confianza?: number | null;
    tratamientos_ecologicos?: unknown[] | null;
}

export interface AlertaCreate {
    huerto_id: string;
    tipo: string;
    descripcion: string;
    severidad?: 'Baja' | 'Media' | 'Alta' | 'Crítica';
    imagen_url?: string | null;
    nombre_plaga?: string | null;
    confianza?: number | null;
    tratamientos_ecologicos?: unknown[] | null;
}

export interface AlertaUpdate {
    estado?: 'Pendiente' | 'En_tratamiento' | 'Resuelta';
    descripcion?: string | null;
    severidad?: 'Baja' | 'Media' | 'Alta' | 'Crítica';
}

// ── Tipos: Predicciones ───────────────────────────────────────────────────────

export interface PrediccionResponse {
    id: string;
    huerto_id?: string | null;
    municipio: string;
    lat: number;
    lon: number;
    cultivos_recomendados: unknown[];
    clima?: unknown | null;
    fecha?: string | null;
}

export interface PrediccionCreate {
    huerto_id?: string | null;
    municipio: string;
    lat: number;
    lon: number;
    cultivos_recomendados: unknown[];
    clima?: unknown | null;
}

// ── Servicio: Alertas ─────────────────────────────────────────────────────────

export const alertasService = {

    list: async (params?: { skip?: number; limit?: number; huerto_id?: string; estado?: string }): Promise<AlertaResponse[]> => {
        const res = await apiClient.get<AlertaResponse[]>('/alertas', { params });
        return res.data ?? [];
    },

    create: async (data: AlertaCreate): Promise<AlertaResponse> => {
        const res = await apiClient.post<AlertaResponse>('/alertas', data);
        return res.data;
    },

    getById: async (id: string): Promise<AlertaResponse> => {
        const res = await apiClient.get<AlertaResponse>(`/alertas/${id}`);
        return res.data;
    },

    update: async (id: string, data: AlertaUpdate): Promise<AlertaResponse> => {
        const res = await apiClient.patch<AlertaResponse>(`/alertas/${id}`, data);
        return res.data;
    },

    delete: async (id: string): Promise<{ message: string }> => {
        const res = await apiClient.delete<{ message: string }>(`/alertas/${id}`);
        return res.data;
    },
};

// ── Servicio: Predicciones ────────────────────────────────────────────────────

export const prediccionesService = {

    list: async (params?: { skip?: number; limit?: number }): Promise<PrediccionResponse[]> => {
        const res = await apiClient.get<PrediccionResponse[]>('/predicciones', { params });
        return res.data ?? [];
    },

    create: async (data: PrediccionCreate): Promise<PrediccionResponse> => {
        const res = await apiClient.post<PrediccionResponse>('/predicciones', data);
        return res.data;
    },

    getById: async (id: string): Promise<PrediccionResponse> => {
        const res = await apiClient.get<PrediccionResponse>(`/predicciones/${id}`);
        return res.data;
    },
};
