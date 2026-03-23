import { apiClient } from '../../../infrastructure/api/apiClient';

export interface PerfilAgricultorCreate {
    perfil: string;
    area_cultivo: string;
    ubicacion: string;
    acceso_agua: string;
    huerto_id?: string;
    cosechas_id?: string;
}

export const perfilAgricultorService = {
    createProfile: async (data: PerfilAgricultorCreate) => {
        const response = await apiClient.post('/perfil-agricultor', data);
        return response.data;
    },
    getMyProfile: async () => {
        const response = await apiClient.get('/perfil-agricultor/me');
        return response.data;
    }
};
