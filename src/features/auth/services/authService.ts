import { apiClient } from '../../../infrastructure/api/apiClient';
import { environment } from '../../../config/environment';

// --- Tipos de Request ---
export interface RegisterData {
    nombre: string;
    apellidos?: string; // opcional pero lo mandaremos si está
    email: string;
    password: string;
    confirmPassword: string;
}

export interface LoginData {
    email: string;
    password: string;
}

export interface VerifyOtpData {
    challengeId: string;
    otpCode: string;
}

export interface ResetPasswordData {
    resetToken: string;
    newPassword: string;
}

// --- Tipos de Response ---
export interface ChallengeResponse {
    challengeId: string;
    message: string;
    maskedEmail?: string;
    expiresAt?: string;
}

export interface VerifyOtpResponse {
    message: string;
    token?: string; // Cuando es 'registro' o 'login'
    resetToken?: string;  // Cuando es 'reset-password'
    expiresAt?: string;
    userId?: string;
}

export interface UserResponse {
    id: string;
    email: string;
    nombre: string;
    apellidos: string;
    rol: string;
    activo: boolean;
}

/**
 * Auth Service
 * Envuelve las llamadas HTTP a los endpoints de autenticación.
 */
export const authService = {
    /**
     * Inicia el registro de un nuevo usuario. Devuelve un challenge OTP.
     */
    register: async (data: RegisterData): Promise<ChallengeResponse> => {
        const response = await apiClient.post<ChallengeResponse>(`${environment.services.auth}/register`, data);
        return response.data;
    },

    /**
     * Inicia el login de un usuario. Devuelve un challenge OTP.
     */
    login: async (data: LoginData): Promise<ChallengeResponse> => {
        const response = await apiClient.post<ChallengeResponse>(`${environment.services.auth}/login`, data);
        return response.data;
    },

    /**
     * Verifica el código OTP para completar el registro, login o reset_password.
     */
    verifyOtp: async (data: VerifyOtpData): Promise<VerifyOtpResponse> => {
        const response = await apiClient.post<VerifyOtpResponse>(`${environment.services.auth}/verify-otp`, data);
        return response.data;
    },

    /**
     * Reenvía un nuevo código OTP para un challenge existente.
     */
    resendOtp: async (challengeId: string): Promise<ChallengeResponse> => {
        const response = await apiClient.post<ChallengeResponse>(`${environment.services.auth}/resend-otp`, {
            challengeId: challengeId
        });
        return response.data;
    },

    /**
     * Solicita recuperar la contraseña. Devuelve un challenge OTP.
     */
    forgotPassword: async (email: string): Promise<ChallengeResponse> => {
        const response = await apiClient.post<ChallengeResponse>(`${environment.services.auth}/forgot-password`, { email });
        return response.data;
    },

    /**
     * Establece la nueva contraseña usando el token obtenido en verifyOtp.
     */
    resetPassword: async (data: ResetPasswordData): Promise<any> => {
        const response = await apiClient.post(`${environment.services.auth}/reset-password`, data);
        return response.data;
    },

    /**
     * Obtiene los datos del usuario de la sesión actual (valida que el JWT esté activo).
     */
    getSession: async (): Promise<UserResponse> => {
        const response = await apiClient.get<UserResponse>(`${environment.services.auth}/session`);
        return response.data;
    },

    /**
     * Cierra la sesión activa.
     */
    logout: async (): Promise<any> => {
        const response = await apiClient.post(`${environment.services.auth}/logout`);
        return response.data;
    }
};
