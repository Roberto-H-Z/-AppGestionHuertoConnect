import { environment } from '../../../config/environment';
import { apiClient } from '../../../infrastructure/api/apiClient';
import { tokenStorage } from '../../../infrastructure/storage/tokenStorage';

export interface GardenRecommendationRequest {
    lat: number;
    lon: number;
    municipio: string;
}

export interface PestDetectionRequest {
    imagen_url: string;
}

export type AIModelResponse = Record<string, unknown> | unknown[];

const ensureSessionToken = async () => {
    const token = await tokenStorage.getToken();
    if (!token) {
        throw new Error('No hay un JWT guardado. Reactiva el login o guarda una sesión para probar los modelos protegidos.');
    }
};

export const aiModelService = {
    recommendGarden: async (payload: GardenRecommendationRequest): Promise<AIModelResponse> => {
        await ensureSessionToken();
        const response = await apiClient.post<AIModelResponse>(
            `${environment.services.huertos}/recomendar`,
            payload
        );
        return response.data;
    },

    detectPest: async (payload: PestDetectionRequest): Promise<AIModelResponse> => {
        await ensureSessionToken();
        const response = await apiClient.post<AIModelResponse>(
            `${environment.services.plagas}/detectar`,
            payload
        );
        return response.data;
    },
};

export default aiModelService;
