import { supabase } from '../../../infrastructure/external-services/supabase';

// ── Types ──
export interface SignUpMetadata {
    username: string;
    nombre: string;
    apellido_paterno: string;
    apellido_materno: string;
    telefono: string;
}

// ── Auth Service ──

/**
 * Register a new user with email, password, and profile metadata.
 */
export const signUp = async (
    email: string,
    password: string,
    metadata: SignUpMetadata
) => {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: metadata, // Stored in auth.users.raw_user_meta_data
        },
    });
    return { data, error };
};

/**
 * Sign in with email and password.
 */
export const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    return { data, error };
};

/**
 * Sign out the current user and clear the session.
 */
export const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
};

/**
 * Get the current active session (if any).
 */
export const getSession = async () => {
    const { data, error } = await supabase.auth.getSession();
    return { session: data.session, error };
};

/**
 * Subscribe to auth state changes (login, logout, token refresh).
 * Returns an unsubscribe function.
 */
export const onAuthStateChange = (
    callback: (event: string, session: any) => void
) => {
    const { data } = supabase.auth.onAuthStateChange(callback);
    return data.subscription;
};
