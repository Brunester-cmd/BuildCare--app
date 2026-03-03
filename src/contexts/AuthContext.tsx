import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile, Tenant } from '../types';
import type { Theme } from '../hooks/useTheme';

interface AuthContextValue {
    session: Session | null;
    user: User | null;
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
    // Hardcoded global state that mimics an active super_admin user
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

    const mockSession = {
        access_token: 'dummy_token',
        refresh_token: 'dummy_refresh',
        expires_in: 3600,
        expires_at: 9999999999,
        token_type: 'bearer',
        user: { id: 'public-user-123', email: 'public@buildcare.app' } as any
    };

    const mockProfile = {
        id: 'public-user-123',
        tenant_id: '00000000-0000-0000-0000-000000000000',
        full_name: 'BuildCare Master',
        role: 'super_admin',
        status: 'active',
        theme: theme
    } as any;

    const mockTenant = {
        id: '00000000-0000-0000-0000-000000000000',
        name: 'BuildCare Público',
        slug: 'buildcare-publico',
        active: true
    } as any;

    async function signIn() { return { error: null }; }
    async function signOut() { }
    async function refreshProfile() { }
    async function updateLanguage() { }

    async function setTheme(newTheme: Theme) {
        setThemeState(newTheme);
    }

    return (
        <AuthContext.Provider value={{
            session: mockSession,
            user: mockSession.user,
            profile: mockProfile,
            tenant: mockTenant,
            loading: false, // Never loading
            isSuperAdmin: true,
            isAdmin: true,
            isActive: true,
            theme,
            setTheme,
            signIn,
            signOut,
            refreshProfile,
            updateLanguage,
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
