import { apiClient } from '../../../infrastructure/api/apiClient';

export interface PerfilAgricultorCreate {
    perfil: string;
    area_cultivo: string;
    ubicacion: string;
    acceso_agua: string;
    huerto_id?: string;
    cosechas_id?: string;
}

const PROFILE_CACHE_TTL_MS = 2 * 60 * 1000;

let cachedProfile: any = null;
let cachedAt = 0;
let inflightProfileRequest: Promise<any> | null = null;

export const perfilAgricultorService = {
    createProfile: async (data: PerfilAgricultorCreate) => {
        const response = await apiClient.post('/perfil-agricultor', data);
        cachedProfile = response.data;
        cachedAt = Date.now();
        return response.data;
    },
    getMyProfile: async () => {
        const now = Date.now();

        if (cachedProfile && now - cachedAt < PROFILE_CACHE_TTL_MS) {
            return cachedProfile;
        }

        if (inflightProfileRequest) {
            return inflightProfileRequest;
        }

        inflightProfileRequest = apiClient.get('/perfil-agricultor/me')
            .then((response) => {
                cachedProfile = response.data;
                cachedAt = Date.now();
                return response.data;
            })
            .finally(() => {
                inflightProfileRequest = null;
            });

        return inflightProfileRequest;
    },
    clearProfileCache: () => {
        cachedProfile = null;
        cachedAt = 0;
        inflightProfileRequest = null;
    },
};
