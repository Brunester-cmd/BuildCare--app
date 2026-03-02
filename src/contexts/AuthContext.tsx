import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile, Tenant } from '../types';

interface AuthContextValue {
    session: Session | null;
    user: User | null;
    profile: Profile | null;
    tenant: Tenant | null;
    loading: boolean;
    isSuperAdmin: boolean;
    isAdmin: boolean;
    isActive: boolean;
    signIn: (email: string, password: string) => Promise<{ error: string | null }>;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
    updateLanguage: (lang: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = useCallback(async (uid: string) => {
        const { data: prof } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', uid)
            .single();

        if (prof) {
            setProfile(prof as Profile);
            if (prof.tenant_id) {
                const { data: ten } = await supabase
                    .from('tenants')
                    .select('*')
                    .eq('id', prof.tenant_id)
                    .single();
                if (ten) setTenant(ten as Tenant);
                else setTenant(null);
            } else {
                setTenant(null);
            }
        }
    }, []);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session: s } }) => {
            setSession(s);
            setUser(s?.user ?? null);
            if (s?.user) fetchProfile(s.user.id).finally(() => setLoading(false));
            else setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_ev, s) => {
            setSession(s);
            setUser(s?.user ?? null);
            if (s?.user) fetchProfile(s.user.id);
            else { setProfile(null); setTenant(null); }
        });

        return () => subscription.unsubscribe();
    }, [fetchProfile]);

    // Realtime profile subscription
    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel(`profile_changes:${user.id}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'profiles',
                filter: `id=eq.${user.id}`
            }, () => {
                void fetchProfile(user.id);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, fetchProfile]);

    async function signIn(email: string, password: string) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { error: error.message };

        if (data?.user) {
            const { data: prof } = await supabase
                .from('profiles')
                .select('status, tenant_id, role')
                .eq('id', data.user.id)
                .single();

            if (!prof) {
                await supabase.auth.signOut();
                return { error: 'Tu cuenta ha sido eliminada. Debés solicitar acceso nuevamente.' };
            }

            if (prof.status === 'suspended') {
                await supabase.auth.signOut();
                return { error: 'Tu cuenta ha sido suspendida. Contactá al administrador.' };
            }

            if (prof.tenant_id && prof.role !== 'super_admin') {
                const { data: ten } = await supabase
                    .from('tenants')
                    .select('active')
                    .eq('id', prof.tenant_id)
                    .single();

                if (!ten || !ten.active) {
                    await supabase.auth.signOut();
                    return { error: 'La empresa a la que perteneces ha sido desactivada o eliminada.' };
                }
            }
        }

        return { error: null };
    }

    async function signOut() {
        await supabase.auth.signOut();
        setProfile(null);
        setTenant(null);
    }

    async function refreshProfile() {
        if (user) await fetchProfile(user.id);
    }

    async function updateLanguage(lang: string) {
        if (!user) return;
        setProfile(prev => prev ? { ...prev, language: lang } : null);
        await supabase.from('profiles').update({ language: lang }).eq('id', user.id);
    }

    const isSuperAdmin = profile?.role === 'super_admin';
    const isAdmin = profile?.role === 'admin' || isSuperAdmin;
    const isActive = profile?.status === 'active';

    return (
        <AuthContext.Provider value={{
            session, user, profile, tenant, loading,
            isSuperAdmin, isAdmin, isActive,
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
