import { useAuth } from '../contexts/AuthContext';
import { translations, type Language } from '../i18n/translations';

export function useI18n() {
    const { profile } = useAuth();
    const lang: Language = (profile?.language as Language) || 'es';
    const t = translations[lang] || translations.es;

    return { t, lang };
}
