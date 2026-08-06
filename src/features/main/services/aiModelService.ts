/**
 * aiModelService — Servicios de Inteligencia Artificial.
 *
 * Endpoints:
 *   POST /huertos/recomendar  → Random Forest: recomienda cultivos según clima real
 *   POST /plagas/detectar     → YOLOv8: detecta plagas en imagen (multipart/form-data)
 */

import { apiClient } from '../../../infrastructure/api/apiClient';
import { environment } from '../../../config/environment';

// ── Tipos: Recomendación de Cultivos ──────────────────────────────────────────

export interface GardenRecommendationRequest {
    lat: number;
    lon: number;
    municipio?: string | null;
    /** ID del huerto (opcional — para guardar la recomendación en BD) */
    huerto_id?: string | null;
}

export interface CultivoRecomendado {
    cultivo: string;
    confianza: number;
    justificacion: string;
    temporada_ideal: string;
    rango_temperatura: string;
    tecnica_riego: string;
    notas_veracruz: string;
    // Campos legacy por compatibilidad con respuestas previas
    nombre?: string;
    crop?: string;
    name?: string;
    probabilidad?: number | string;
    score?: number | string;
    descripcion?: string;
    temporada?: string;
    [key: string]: unknown;
}

export interface ClimaData {
    temp_max: number;
    temp_min: number;
    temp_actual: number;
    humedad: number;
    descripcion: string;
    ciudad: string;
    fuente: string;
}

export interface GardenRecommendationResponse {
    clima: ClimaData;
    recomendaciones: CultivoRecomendado[];
    modelo_version: string;
    /** 'modelo_real' | 'mock' */
    modo: string;
    // Campos legacy
    cultivos?: CultivoRecomendado[];
    predicciones?: CultivoRecomendado[];
    resultado?: CultivoRecomendado[];
    data?: CultivoRecomendado[];
    municipio?: string;
    [key: string]: unknown;
}

// ── Tipos: Detección de Plagas ────────────────────────────────────────────────

export interface TratamientoEcologico {
    nombre: string;
    tipo: string;
    descripcion: string;
    aplicacion: string;
    frecuencia: string;
    disponible_veracruz: boolean;
    [key: string]: unknown;
}

export interface PlagaDetectada {
    plaga: string;
    nombre_cientifico: string;
    confianza: number;
    /** 'Baja' | 'Media' | 'Alta' | 'Crítica' */
    severidad: string;
    descripcion_plaga: string;
    cultivos_afectados: string[];
    tratamientos_ecologicos: TratamientoEcologico[];
    alerta_recomendada: boolean;
    mitigacion_viable: boolean;
    nota_mitigacion?: string | null;
    // Campos legacy / compatibilidad
    clase?: string;
    label?: string;
    name?: string;
    confidence?: number | string;
    score?: number | string;
    bbox?: number[];
    tratamiento?: string;
    [key: string]: unknown;
}

export interface PestDetectionResponse {
    deteccion: PlagaDetectada;
    imagen_analizada: string;
    modelo_version: string;
    /** 'modelo_real' | 'mock' */
    modo: string;
    mensaje: string;
    // Campos legacy
    detecciones?: PlagaDetectada[];
    plagas?: PlagaDetectada[];
    results?: PlagaDetectada[];
    resultado?: PlagaDetectada[];
    data?: PlagaDetectada[];
    [key: string]: unknown;
}

// ── Servicio ──────────────────────────────────────────────────────────────────

export const aiModelService = {

    /**
     * POST /huertos/recomendar
     * Modelo Random Forest: recomienda cultivos según el clima real de la ubicación.
     * Requiere JWT (Bearer token).
     */
    recommendGarden: async (payload: GardenRecommendationRequest): Promise<GardenRecommendationResponse> => {
        const res = await apiClient.post<GardenRecommendationResponse>(
            `${environment.services.huertos}/recomendar`,
            payload
        );
        return res.data;
    },

    /**
     * POST /plagas/detectar
     * Modelo YOLOv8: detecta plagas en una imagen.
     * Envía la imagen como multipart/form-data (campo: "imagen").
     *
     * @param imageUri  - URI local del archivo (resultado de ImagePicker / CameraRoll) O URL pública
     * @param huertoId  - ID del huerto (opcional)
     * @param cultivoId - ID del cultivo (opcional)
     */
    detectPest: async (
        imageUri: string,
        huertoId?: string | null,
        cultivoId?: string | null
    ): Promise<PestDetectionResponse> => {
        const formData = new FormData();

        if (imageUri.startsWith('http://') || imageUri.startsWith('https://')) {
            // URL pública: descargamos el blob y lo adjuntamos como archivo
            const fetchResponse = await fetch(imageUri);
            if (!fetchResponse.ok) {
                throw new Error(`No se pudo descargar la imagen desde la URL proporcionada (${fetchResponse.status})`);
            }
            const blob = await fetchResponse.blob();
            const ext = imageUri.split('?')[0].split('.').pop()?.toLowerCase() || 'jpg';
            const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
            formData.append('imagen', blob, `planta.${ext}`);
            // En entornos React Native, append puede necesitar el formato objeto
            (formData as any)._parts?.pop(); // limpiamos la entrada anterior si la usamos de otra forma
            // Re-hacemos con el formato correcto para React Native
            const rnFormData = new FormData();
            rnFormData.append('imagen', {
                uri: imageUri,
                name: `planta.${ext}`,
                type: mimeType,
            } as any);
            if (huertoId) rnFormData.append('huerto_id', huertoId);
            if (cultivoId) rnFormData.append('cultivo_id', cultivoId);
            const res = await apiClient.post<PestDetectionResponse>(
                `${environment.services.plagas}/detectar`,
                rnFormData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );
            return res.data;
        } else {
            // URI local (archivo del dispositivo)
            const ext = imageUri.split('?')[0].split('.').pop()?.toLowerCase() || 'jpg';
            const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
            formData.append('imagen', {
                uri: imageUri,
                name: `planta.${ext}`,
                type: mimeType,
            } as any);
            if (huertoId) formData.append('huerto_id', huertoId);
            if (cultivoId) formData.append('cultivo_id', cultivoId);
            const res = await apiClient.post<PestDetectionResponse>(
                `${environment.services.plagas}/detectar`,
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );
            return res.data;
        }
    },

    /**
     * POST /plagas/upload-imagen
     * Sube una imagen de plaga a Cloudinary y devuelve la URL + public_id.
     * Úsala antes de POST /plagas para obtener la imagen_url del registro.
     *
     * @param imageUri - URI local del archivo (ImagePicker)
     */
    uploadPlagaImagen: async (imageUri: string): Promise<{ secure_url: string; public_id: string; message: string }> => {
        const ext = imageUri.split('?')[0].split('.').pop()?.toLowerCase() || 'jpg';
        const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
        const formData = new FormData();
        formData.append('imagen', {
            uri: imageUri,
            name: `plaga.${ext}`,
            type: mimeType,
        } as any);
        const res = await apiClient.post<{ secure_url: string; public_id: string; message: string }>(
            `${environment.services.plagas}/upload-imagen`,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        return res.data;
    },
};

export default aiModelService;
