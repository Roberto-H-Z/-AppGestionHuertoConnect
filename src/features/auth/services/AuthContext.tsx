import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { tokenStorage } from '../../../infrastructure/storage/tokenStorage';
import { authService, UserResponse } from './authService';

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

const DEMO_USER: UserResponse = {
    id: 'demo-huertoconnect',
    email: 'demo.huertoconnect@app.local',
    nombre: 'Agricultor',
    apellidos: 'Demo',
    rol: 'usuario',
    activo: true,
};

const DEMO_SESSION_TOKEN = 'demo-local-session';

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
                // Valida la sesion real guardada antes de mostrar datos privados.
                const userData = await authService.getSession();

                setToken(storedToken);
                setUser(userData);
            } else {
                // Sesion demo local para arrancar la app mientras el login esta desactivado.
                setToken(DEMO_SESSION_TOKEN);
                setUser(DEMO_USER);
            }
        } catch (error) {
            console.log('Sesión inválida o expirada:', error);
            await tokenStorage.clearAll();
            setToken(DEMO_SESSION_TOKEN);
            setUser(DEMO_USER);
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
            // Solo avisa al servidor cuando existe una sesion real guardada.
            if (token && token !== DEMO_SESSION_TOKEN) {
                await authService.logout().catch(e => console.warn('Logout API falló', e));
            }
        } finally {
            await tokenStorage.clearAll();
            setToken(DEMO_SESSION_TOKEN);
            setUser(DEMO_USER);
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
