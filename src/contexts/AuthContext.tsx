import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Tenant, Profile } from '../types';
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
    signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
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
    const [theme, setThemeState] = useState<Theme>(() => (localStorage.getItem('app-theme') as Theme) || 'azurite');

    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*, tenant:tenants(*)')
                .eq('id', userId)
                .single();

            if (error) throw error;
            if (data) {
                setProfile(data);
                setTenant(data.tenant || null);
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
        }
    };

    useEffect(() => {
        // Handle auth state changes
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id).finally(() => setLoading(false));
            } else {
                setLoading(false);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setProfile(null);
                setTenant(null);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

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

    async function signUp(email: string, password: string, fullName: string) {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: fullName }
            }
        });
        return { error: error?.message || null };
    }

    async function signOut() {
        await supabase.auth.signOut();
    }

    async function refreshProfile() {
        if (user) {
            await fetchProfile(user.id);
        }
    }

    async function updateLanguage(lang: string) {
        if (user) {
            const { error } = await supabase
                .from('profiles')
                .update({ language: lang })
                .eq('id', user.id);
            
            if (!error) {
                await refreshProfile();
            }
        }
    }

    async function setTheme(newTheme: Theme) {
        setThemeState(newTheme);
        localStorage.setItem('app-theme', newTheme);
    }

    const isSuperAdmin = profile?.role === 'super_admin';
    const isAdmin = profile?.role === 'admin' || isSuperAdmin;
    const isActive = profile?.status === 'active';

    return (
        <AuthContext.Provider value={{
            session, user, profile, tenant, loading,
            isSuperAdmin, isAdmin, isActive, theme, setTheme,
            signIn, signUp, signOut, refreshProfile, updateLanguage,
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
