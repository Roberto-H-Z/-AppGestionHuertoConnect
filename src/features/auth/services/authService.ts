import { apiClient } from '../../../infrastructure/api/apiClient';
import { environment } from '../../../config/environment';

/**
 * authService — Endpoints de autenticación del gateway unificado.
 *
 * Todos los endpoints son relativos al baseURL del apiClient (/api):
 *   POST /auth/register        → Registro paso 1 (envía OTP)
 *   POST /auth/login           → Login paso 1   (envía OTP)
 *   POST /auth/verify-otp      → Verifica OTP y devuelve JWT
 *   POST /auth/resend-otp      → Reenvía OTP (máx. 3 veces)
 *   POST /auth/forgot-password → Recuperación de contraseña (envía OTP)
 *   POST /auth/reset-password  → Cambia contraseña con resetToken
 *   GET  /auth/session         → Valida JWT y retorna datos del usuario
 *   GET  /auth/me              → Alias de /auth/session
 *   POST /auth/logout          → Cierra la sesión actual
 *   POST /auth/google          → Login/Registro con Google Sign-In
 */

// ── Tipos de Request ──────────────────────────────────────────────────────────

export interface RegisterData {
    nombre: string;
    apellidos?: string;
    email: string;
    password: string;
    confirmPassword?: string;
}

export interface LoginData {
    email: string;
    password: string;
}

export interface VerifyOtpData {
    challengeId: string;
    otpCode: string;
}

export interface ResendOtpData {
    challengeId: string;
}

export interface ForgotPasswordData {
    email: string;
}

export interface ResetPasswordData {
    /** Token obtenido de POST /auth/verify-otp (tipo reset-password) */
    resetToken: string;
    newPassword: string;
}

export interface GoogleLoginData {
    /** Google ID token (JWT) recibido del botón Google Sign-In */
    credential: string;
}

// ── Tipos de Response ─────────────────────────────────────────────────────────

/** Respuesta de register, login, send-otp, resend-otp */
export interface ChallengeResponse {
    message: string;
    challengeId: string;
    expiresAt: string;
    maskedEmail: string;
    /** Solo en entorno de desarrollo — el código OTP en texto claro */
    devOtpCode?: string | null;
}

/** Respuesta de verify-otp */
export interface VerifyOtpResponse {
    message: string;
    /** JWT de acceso — presente cuando el tipo de challenge era 'registro' o 'login' */
    token?: string | null;
    expiresAt?: string | null;
    userId?: string | null;
    /** Token de un solo uso para cambiar contraseña — presente cuando el tipo era 'reset-password' */
    resetToken?: string | null;
}

/** Respuesta de /auth/session y /auth/me */
export interface UserResponse {
    id: string;
    nombre: string;
    apellidos: string;
    email: string;
    role: string;
    estado: string;
    email_verificado: boolean;
    profile_picture?: string | null;
    auth_provider: string;
    /** Fecha de creación (puede no venir en todos los endpoints) */
    created_at?: string | null;
}

/** Respuesta de /auth/google */
export interface GoogleAuthResponse {
    message: string;
    token: string;
    expiresAt: string;
    userId: string;
    isNewUser: boolean;
}

/** Respuesta de /auth/forgot-password */
export interface ForgotPasswordResponse {
    message: string;
    challengeId?: string;
    expiresAt?: string;
    maskedEmail?: string;
}

/** Respuesta genérica de mensaje */
export interface MessageResponse {
    message: string;
}

// ── Servicio ──────────────────────────────────────────────────────────────────

const AUTH = environment.services.auth; // '/auth'

export const authService = {

    /**
     * POST /auth/register
     * Paso 1 del registro: crea (o actualiza) el usuario y envía OTP.
     * @returns ChallengeResponse con challengeId para confirmar en /verify-otp
     */
    register: async (data: RegisterData): Promise<ChallengeResponse> => {
        const res = await apiClient.post<ChallengeResponse>(`${AUTH}/register`, data);
        return res.data;
    },

    /**
     * POST /auth/login
     * Paso 1 del login: valida email+contraseña y envía OTP (2FA).
     * @returns ChallengeResponse con challengeId para confirmar en /verify-otp
     */
    login: async (data: LoginData): Promise<ChallengeResponse> => {
        const res = await apiClient.post<ChallengeResponse>(`${AUTH}/login`, data);
        return res.data;
    },

    /**
     * POST /auth/verify-otp
     * Paso 2 del registro/login: verifica el código OTP recibido por correo.
     * - Tipo 'registro' o 'login' → devuelve { token, userId, expiresAt }
     * - Tipo 'reset-password'     → devuelve { resetToken }
     */
    verifyOtp: async (data: VerifyOtpData): Promise<VerifyOtpResponse> => {
        const res = await apiClient.post<VerifyOtpResponse>(`${AUTH}/verify-otp`, data);
        return res.data;
    },

    /**
     * POST /auth/resend-otp
     * Reenvía un nuevo código OTP para el challenge activo (máx. 3 veces).
     */
    resendOtp: async (challengeId: string): Promise<ChallengeResponse> => {
        const payload: ResendOtpData = { challengeId };
        const res = await apiClient.post<ChallengeResponse>(`${AUTH}/resend-otp`, payload);
        return res.data;
    },

    /**
     * POST /auth/forgot-password
     * Inicia el flujo de recuperación: envía un OTP de tipo 'reset-password'.
     * Anti-enumeración: siempre responde 200 aunque el email no exista.
     */
    forgotPassword: async (email: string): Promise<ForgotPasswordResponse> => {
        const res = await apiClient.post<ForgotPasswordResponse>(`${AUTH}/forgot-password`, { email });
        return res.data;
    },

    /**
     * POST /auth/reset-password
     * Cambia la contraseña usando el resetToken (válido 10 min, un solo uso).
     * El resetToken se obtiene de /verify-otp cuando el challenge era 'reset-password'.
     * Tras el cambio, todas las sesiones activas del usuario quedan revocadas.
     */
    resetPassword: async (data: ResetPasswordData): Promise<MessageResponse> => {
        const res = await apiClient.post<MessageResponse>(`${AUTH}/reset-password`, data);
        return res.data;
    },

    /**
     * GET /auth/session
     * Valida el JWT del header Authorization y retorna los datos del usuario.
     * Usar para verificar sesiones guardadas al iniciar la app.
     */
    getSession: async (): Promise<UserResponse> => {
        const res = await apiClient.get<UserResponse>(`${AUTH}/session`);
        return res.data;
    },

    /**
     * GET /auth/me — alias de /auth/session
     */
    getMe: async (): Promise<UserResponse> => {
        const res = await apiClient.get<UserResponse>(`${AUTH}/me`);
        return res.data;
    },

    /**
     * POST /auth/logout
     * Revoca la sesión activa (identificada por el jti del JWT actual).
     */
    logout: async (): Promise<MessageResponse> => {
        const res = await apiClient.post<MessageResponse>(`${AUTH}/logout`);
        return res.data;
    },

    /**
     * POST /auth/google
     * Login/Registro con Google Sign-In (sin OTP — directo).
     * - Usuario nuevo → se crea con email_verificado=True.
     * - Usuario existente → actualiza profile_picture y auth_provider.
     */
    googleLogin: async (data: GoogleLoginData): Promise<GoogleAuthResponse> => {
        const res = await apiClient.post<GoogleAuthResponse>(`${AUTH}/google`, data);
        return res.data;
    },
};
