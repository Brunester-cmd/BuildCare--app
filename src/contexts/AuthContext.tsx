import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Profile, Tenant } from '../types';
import type { Theme } from '../hooks/useTheme';

interface AuthContextValue {
    session: any | null;
    user: any | null;
    profile: Profile | null;
    tenant: Tenant | null;
    loading: boolean;
    isSuperAdmin: boolean;
    isAdmin: boolean;
    isActive: boolean;
    theme: Theme;
    setTheme: (theme: Theme) => Promise<void>;
    signIn: (email: string, password: string) => Promise<{ error: string | null }>;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
    updateLanguage: (lang: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<any | null>(null);
    const [user, setUser] = useState<any | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [loading, setLoading] = useState(true);
    const [theme, setThemeState] = useState<Theme>('light');

    useEffect(() => {
        // Handle auth state changes
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                void fetchProfile(session.user.id);
            } else {
                setLoading(false);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                void fetchProfile(session.user.id);
            } else {
                setProfile(null);
                setTenant(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    async function fetchProfile(userId: string) {
        try {
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (profileError) throw profileError;

            if (profileData) {
                setProfile(profileData);
                setThemeState((profileData.theme as Theme) || 'light');

                if (profileData.tenant_id) {
                    const { data: tenantData, error: tenantError } = await supabase
                        .from('tenants')
                        .select('*')
                        .eq('id', profileData.tenant_id)
                        .single();

                    if (!tenantError) {
                        setTenant(tenantData);
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('dark', 'theme-earth', 'theme-cherry', 'theme-azurite', 'theme-oceanic', 'theme-pastel', 'theme-mineral', 'theme-autumn', 'theme-industrial');
        if (theme === 'dark') {
            root.classList.add('dark');
        } else if (theme !== 'light') {
            root.classList.add(`theme-${theme}`);
        }
    }, [theme]);

    async function signIn(email: string, password: string) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error: error?.message || null };
    }

    async function signOut() {
        await supabase.auth.signOut();
    }

    async function refreshProfile() {
        if (user?.id) {
            await fetchProfile(user.id);
        }
    }

    async function updateLanguage(lang: string) {
        if (!user?.id) return;
        const { error } = await supabase
            .from('profiles')
            .update({ language: lang })
            .eq('id', user.id);

        if (!error) {
            setProfile(prev => prev ? { ...prev, language: lang } : null);
        }
    }

    async function setTheme(newTheme: Theme) {
        setThemeState(newTheme);
        if (user?.id) {
            await supabase
                .from('profiles')
                .update({ theme: newTheme })
                .eq('id', user.id);
        }
    }

    const isSuperAdmin = profile?.role === 'super_admin';
    const isAdmin = profile?.role === 'admin' || isSuperAdmin;
    const isActive = profile?.status === 'active';

    return (
        <AuthContext.Provider value={{
            session, user, profile, tenant, loading,
            isSuperAdmin, isAdmin, isActive, theme, setTheme,
            signIn, signOut, refreshProfile, updateLanguage,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
