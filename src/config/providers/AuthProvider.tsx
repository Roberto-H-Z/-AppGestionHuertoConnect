import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import * as authServiceModule from '../../features/auth/services/authService';

// ── Context types ──
interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ error: any }>;
    signUp: (
        email: string,
        password: string,
        metadata: authServiceModule.SignUpMetadata
    ) => Promise<{ error: any }>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    loading: true,
    signIn: async () => ({ error: null }),
    signUp: async () => ({ error: null }),
    signOut: async () => { },
});

// ── Hook ──
export const useAuth = () => useContext(AuthContext);

// ── Provider ──
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    // Listen for auth state changes (login, logout, token refresh)
    useEffect(() => {
        // 1. Get the initial session
        const initSession = async () => {
            const { session: currentSession } = await authServiceModule.getSession();
            setSession(currentSession);
            setUser(currentSession?.user ?? null);
            setLoading(false);
        };
        initSession();

        // 2. Subscribe to future changes
        const subscription = authServiceModule.onAuthStateChange(
            (_event, newSession) => {
                setSession(newSession);
                setUser(newSession?.user ?? null);
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    // ── Actions ──

    const signIn = async (email: string, password: string) => {
        const { data, error } = await authServiceModule.signIn(email, password);
        if (!error && data.session) {
            setSession(data.session);
            setUser(data.session.user);
        }
        return { error };
    };

    const signUp = async (
        email: string,
        password: string,
        metadata: authServiceModule.SignUpMetadata
    ) => {
        const { data, error } = await authServiceModule.signUp(
            email,
            password,
            metadata
        );
        if (!error && data.session) {
            setSession(data.session);
            setUser(data.session.user);
        }
        return { error };
    };

    const signOut = async () => {
        await authServiceModule.signOut();
        setSession(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{ user, session, loading, signIn, signUp, signOut }}
        >
            {children}
        </AuthContext.Provider>
    );
};
