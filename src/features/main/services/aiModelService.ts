import { environment } from '../../../config/environment';
import { apiClient } from '../../../infrastructure/api/apiClient';

// ── Petición al modelo de cultivos ─────────────────────────────
export interface GardenRecommendationRequest {
    lat: number;
    lon: number;
    municipio: string;
}

// ── Respuesta del modelo de cultivos (Random Forest) ───────────
export interface CultivoRecomendado {
    nombre?: string;
    cultivo?: string;
    crop?: string;
    name?: string;
    probabilidad?: number | string;
    score?: number | string;
    confianza?: number | string;
    descripcion?: string;
    temporada?: string;
    [key: string]: unknown;
}

export interface GardenRecommendationResponse {
    recomendaciones?: CultivoRecomendado[];
    cultivos?: CultivoRecomendado[];
    predicciones?: CultivoRecomendado[];
    resultado?: CultivoRecomendado[];
    data?: CultivoRecomendado[];
    municipio?: string;
    clima?: Record<string, unknown>;
    [key: string]: unknown;
}

// ── Petición al modelo de plagas ────────────────────────────────
export interface PestDetectionRequest {
    imagen_url: string;
    huerto_id?: string | null;
    cultivo_id?: string | null;
}

// ── Respuesta del modelo de plagas (YOLOv8) ─────────────────────
export interface TratamientoEcologico {
    nombre?: string;
    descripcion?: string;
    aplicacion?: string;
    frecuencia?: string;
    tipo?: string;
    [key: string]: unknown;
}

export interface PlagaDetectada {
    plaga?: string;
    nombre_cientifico?: string;
    clase?: string;
    label?: string;
    name?: string;
    confianza?: number | string;
    confidence?: number | string;
    score?: number | string;
    severidad?: string;
    bbox?: number[];
    descripcion_plaga?: string;
    cultivos_afectados?: string[];
    tratamiento?: string;
    tratamientos_ecologicos?: TratamientoEcologico[];
    alerta_recomendada?: boolean;
    mitigacion_viable?: boolean;
    nota_mitigacion?: string | null;
    [key: string]: unknown;
}

export interface PestDetectionResponse {
    // Respuesta real del API: objeto singular 'deteccion'
    deteccion?: PlagaDetectada;
    imagen_analizada?: string;
    modelo_version?: string;
    modo?: string;
    mensaje?: string;
    // Campos legacy por si cambian
    detecciones?: PlagaDetectada[];
    plagas?: PlagaDetectada[];
    results?: PlagaDetectada[];
    resultado?: PlagaDetectada[];
    data?: PlagaDetectada[];
    imagen_url?: string;
    procesado?: boolean;
    [key: string]: unknown;
}

export type AIModelResponse = Record<string, unknown> | unknown[];

// ── Servicio ────────────────────────────────────────────────────
export const aiModelService = {
    /**
     * POST /huertos/recomendar
     * Modelo Random Forest: recomienda cultivos según clima de la zona.
     */
    recommendGarden: async (payload: GardenRecommendationRequest): Promise<GardenRecommendationResponse> => {
        const response = await apiClient.post<GardenRecommendationResponse>(
            `${environment.services.huertos}/recomendar`,
            payload
        );
        return response.data;
    },

    /**
     * POST /plagas/detectar
     * Modelo YOLOv8: detecta plagas en una imagen pública (URL).
     */
    detectPest: async (payload: PestDetectionRequest): Promise<PestDetectionResponse> => {
        const response = await apiClient.post<PestDetectionResponse>(
            `${environment.services.plagasModel}/detectar`,
            payload
        );
        return response.data;
    },
};

export default aiModelService;
