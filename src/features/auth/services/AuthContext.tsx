import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { tokenStorage } from '../../../infrastructure/storage/tokenStorage';
import { authService, UserResponse } from './authService';
import { apiClient } from '../../../infrastructure/api/apiClient';

interface AuthContextType {
    user: UserResponse | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    signIn: (token: string, userData?: UserResponse) => Promise<void>;
    signOut: () => Promise<void>;
    checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<UserResponse | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    /**
     * Comprueba si hay una sesión activa guardada y la valida contra la API.
     */
    const checkSession = async () => {
        setIsLoading(true);
        try {
            const storedToken = await tokenStorage.getToken();

            if (storedToken) {
                // Verificar si el token es válido consultando la API
                // El interceptor añadirá el token a esta llamada automáticamente
                const userData = await authService.getSession();

                setToken(storedToken);
                setUser(userData);
            } else {
                setToken(null);
                setUser(null);
            }
        } catch (error) {
            console.log('Sesión inválida o expirada:', error);
            await tokenStorage.clearAll();
            setToken(null);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    // Al arrancar, comprobamos la sesión
    useEffect(() => {
        checkSession();
    }, []);

    /**
     * Función a llamar después de un login o registro exitoso.
     * Guarda el token, configura axios y obtiene/asigna el usuario.
     */
    const signIn = async (newToken: string, userData?: UserResponse) => {
        await tokenStorage.saveToken(newToken);
        setToken(newToken);

        if (userData) {
            setUser(userData);
            await tokenStorage.saveUserId(userData.id);
        } else {
            // Si no nos pasan el usuario inicial, lo descargamos
            await checkSession();
        }
    };

    /**
     * Función para cerrar sesión. Llama al endpoint de logout y limpia los datos locales.
     */
    const signOut = async () => {
        try {
            // Intentamos desloguear del servidor si tenemos un token válido
            if (token) {
                await authService.logout().catch(e => console.warn('Logout API falló', e));
            }
        } finally {
            await tokenStorage.clearAll();
            setToken(null);
            setUser(null);
        }
    };

    const value = {
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        signIn,
        signOut,
        checkSession
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

/**
 * Hook personalizado para usar el contexto de autenticación más fácilmente
 */
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth debe ser usado dentro de un AuthProvider');
    }
    return context;
};
