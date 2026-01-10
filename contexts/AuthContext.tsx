import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';

export interface UserProfile {
    id: string;
    name: string;
    email: string;
    avatar: string;
    role?: string;
    phone?: string;
    location?: string;
    bio?: string;
    memberSince: string;
    authProvider: 'email' | 'google' | 'apple';
}

interface AuthContextType {
    isAuthenticated: boolean;
    user: UserProfile | null;
    isLoading: boolean;
    login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
    signUp: (email: string, password: string, name: string) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    loginWithApple: () => Promise<void>;
    loginWithBiometric: () => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Map Supabase user to our App UserProfile
    const mapUser = (sbUser: User): UserProfile => {
        const metadata = sbUser.user_metadata || {};
        return {
            id: sbUser.id,
            name: metadata.full_name || metadata.name || sbUser.email?.split('@')[0] || 'Viajante',
            email: sbUser.email || '',
            avatar: metadata.avatar_url || `https://ui-avatars.com/api/?name=${sbUser.email || 'User'}&background=667eea&color=fff`,
            role: 'Viajante',
            memberSince: sbUser.created_at,
            authProvider: (sbUser.app_metadata.provider as any) || 'email',
            bio: metadata.bio || '',
            location: metadata.location || ''
        };
    };

    useEffect(() => {
        // Check for active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                setUser(mapUser(session.user));
                setIsAuthenticated(true);
            }
            setIsLoading(false);
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                setUser(mapUser(session.user));
                setIsAuthenticated(true);
            } else {
                setUser(null);
                setIsAuthenticated(false);
            }
            setIsLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const login = useCallback(async (email: string, password: string, rememberMe = false) => {
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const signUp = useCallback(async (email: string, password: string, name: string) => {
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: name,
                    }
                }
            });
            if (error) throw error;
            // Note: By default Supabase requires email confirmation. 
            // If disabled in dashboard, user is logged in immediately.
        } catch (error) {
            console.error('Signup error:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const loginWithGoogle = useCallback(async () => {
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin
                }
            });
            if (error) throw error;
        } catch (error) {
            console.error('Google login error:', error);
            setIsLoading(false);
        }
    }, []);

    const loginWithApple = useCallback(async () => {
        // Not fully configured yet - requires Apple Developer Account
        console.warn('Apple login requires further configuration in Supabase');
        alert('Login com Apple requer configuração adicional no painel do Supabase.');
        setIsLoading(false);
    }, []);

    const loginWithBiometric = useCallback(async () => {
        console.warn('Biometric login is not yet implemented with Supabase');
        alert('Login biométrico será implementado em breve.');
        setIsLoading(false);
    }, []);

    const logout = useCallback(async () => {
        setIsLoading(true);
        await supabase.auth.signOut();
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('user'); // Clean up old local storage if any
        localStorage.removeItem('authToken');
        setIsLoading(false);
    }, []);

    const value = useMemo(() => ({
        isAuthenticated,
        user,
        isLoading,
        login,
        signUp,
        loginWithGoogle,
        loginWithApple,
        loginWithBiometric,
        logout
    }), [
        isAuthenticated,
        user,
        isLoading,
        login,
        signUp,
        loginWithGoogle,
        loginWithApple,
        loginWithBiometric,
        logout
    ]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
