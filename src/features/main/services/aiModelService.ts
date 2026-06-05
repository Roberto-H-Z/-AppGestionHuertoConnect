import { environment } from '../../../config/environment';
import { apiClient } from '../../../infrastructure/api/apiClient';

export interface GardenRecommendationRequest {
    lat: number;
    lon: number;
    municipio: string;
}

export interface PestDetectionRequest {
    imagen_url: string;
}

export type AIModelResponse = Record<string, unknown> | unknown[];

export const aiModelService = {
    recommendGarden: async (payload: GardenRecommendationRequest): Promise<AIModelResponse> => {
        const response = await apiClient.post<AIModelResponse>(
            `${environment.services.huertos}/recomendar`,
            payload
        );
        return response.data;
    },

    detectPest: async (payload: PestDetectionRequest): Promise<AIModelResponse> => {
        const response = await apiClient.post<AIModelResponse>(
            `${environment.services.plagas}/detectar`,
            payload
        );
        return response.data;
    },
};

export default aiModelService;
