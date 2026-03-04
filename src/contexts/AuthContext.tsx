import { createContext, useContext, useEffect, useState } from 'react';
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
    const mockUser = { id: 'mock-user-id', email: 'admin@buildcare.local' };

    const mockProfile: Profile = {
        id: 'mock-user-id',
        tenant_id: '00000000-0000-0000-0000-000000000000',
        full_name: 'D1 Admin',
        role: 'super_admin',
        status: 'active',
        theme: 'light',
        language: 'es',
        company_name: 'Sistema Principal',
        avatar_url: null,
        push_subscription: null,
        push_enabled: false,
        email: 'admin@buildcare.local',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    const mockTenant: Tenant = {
        id: '00000000-0000-0000-0000-000000000000',
        name: 'Sistema Principal',
        slug: 'sistema-principal',
        active: true,
        logo_url: null,
        created_at: new Date().toISOString()
    };

    const [session] = useState<any>({ access_token: 'mock-token' });
    const [user] = useState<any>(mockUser);
    const [profile] = useState<Profile | null>(mockProfile);
    const [tenant] = useState<Tenant | null>(mockTenant);
    const loading = false;
    const [theme, setThemeState] = useState<Theme>('light');

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('dark', 'theme-earth', 'theme-cherry', 'theme-azurite', 'theme-oceanic', 'theme-pastel', 'theme-mineral', 'theme-autumn', 'theme-industrial');
        if (theme === 'dark') {
            root.classList.add('dark');
        } else if (theme !== 'light') {
            root.classList.add(`theme-${theme}`);
        }
    }, [theme]);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async function signIn(_email: string, _password: string) {
        return { error: null };
    }

    async function signOut() {
        // Mock sign out — will be implemented with Cloudflare Access
    }

    async function refreshProfile() {
        // Mock refresh — will fetch from Worker API
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async function updateLanguage(_lang: string) {
        // Mock — will update via Worker API
    }

    async function setTheme(newTheme: Theme) {
        setThemeState(newTheme);
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
