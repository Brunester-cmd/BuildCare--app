import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Building2, Users, Clock, CheckCircle, XCircle,
    Trash2, Plus, Search, RefreshCw, ArrowLeft,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Profile, Tenant } from '../types';
import { useI18n } from '../hooks/useI18n';

interface PendingUser extends Profile { email?: string }

export default function AdminPanel() {
    const navigate = useNavigate();
    const { t, lang } = useI18n();
    const [tab, setTab] = useState<'tenants' | 'pending' | 'users'>('pending');
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
    const [allUsers, setAllUsers] = useState<PendingUser[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [newTenantName, setNewTenantName] = useState('');
    const [addingTenant, setAddingTenant] = useState(false);
    const [expandedTenants, setExpandedTenants] = useState<Set<string>>(new Set());

    const load = useCallback(async () => {
        setLoading(true);
        const [{ data: t_data }, { data: p_data }] = await Promise.all([
            supabase.from('tenants').select('*').order('created_at', { ascending: false }),
            supabase.from('profiles').select('*').neq('role', 'super_admin').order('created_at', { ascending: false }),
        ]);

        setTenants((t_data ?? []) as Tenant[]);
        const all = (p_data ?? []) as PendingUser[];
        setAllUsers(all);
        setPendingUsers(all.filter(u => u.status === 'pending'));
        setLoading(false);
    }, []);

    useEffect(() => { void load(); }, [load]);

    async function approveUser(userId: string) {
        setLoading(true);
        try {
            // 1. Get user profile to see their requested company
            const { data: userProf } = await supabase
                .from('profiles')
                .select('company_name')
                .eq('id', userId)
                .single();

            const companyName = userProf?.company_name?.trim();
            let targetTenantId: string | null = null;

            if (companyName) {
                // 2. Check if tenant exists
                const { data: existing } = await supabase
                    .from('tenants')
                    .select('id')
                    .ilike('name', companyName)
                    .single();

                if (existing) {
                    targetTenantId = existing.id;
                } else {
                    // 3. Create new tenant
                    const slug = companyName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                    const { data: newTen, error: tenErr } = await supabase
                        .from('tenants')
                        .insert({ name: companyName, slug })
                        .select()
                        .single();
                    if (!tenErr && newTen) {
                        targetTenantId = newTen.id;
                    }
                }
            }

            // 4. Update profile
            await supabase.from('profiles').update({
                status: 'active',
                tenant_id: targetTenantId
            }).eq('id', userId);

            await load();
        } catch (err) {
            console.error('Error approving user:', err);
        } finally {
            setLoading(false);
        }
    }

    async function rejectUser(userId: string) {
        await supabase.from('profiles').update({ status: 'suspended' }).eq('id', userId);
        await load();
    }

    async function createTenant() {
        if (!newTenantName.trim()) return;
        const slug = newTenantName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        await supabase.from('tenants').insert({ name: newTenantName.trim(), slug });
        setNewTenantName('');
        setAddingTenant(false);
        await load();
    }

    async function toggleTenant(id: string, active: boolean) {
        const newActive = !active;
        await supabase.from('tenants').update({ active: newActive }).eq('id', id);
        // Cascade: suspend all users when deactivating, reactivate them when activating
        if (!newActive) {
            await supabase.from('profiles').update({ status: 'suspended' }).eq('tenant_id', id).neq('role', 'super_admin');
        } else {
            await supabase.from('profiles').update({ status: 'active' }).eq('tenant_id', id).neq('role', 'super_admin');
        }
        await load();
    }

    async function deleteUser(id: string) {
        if (!window.confirm(t.delete_user_confirm)) return;
        setLoading(true);
        try {
            const { error } = await supabase.from('profiles').delete().eq('id', id);
            if (error) throw error;
            await load();
        } catch (err) {
            console.error('Error deleting user:', err);
            alert('Error al eliminar usuario');
        } finally {
            setLoading(false);
        }
    }

    async function deleteTenant(id: string) {
        if (!window.confirm(t.delete_company_confirm)) return;
        setLoading(true);
        try {
            // Sequential deletion to handle foreign keys (if cascade not set in DB)
            await supabase.from('work_order_history').delete().eq('tenant_id', id);
            await supabase.from('work_orders').delete().eq('tenant_id', id);
            await supabase.from('profiles').delete().eq('tenant_id', id);
            const { error } = await supabase.from('tenants').delete().eq('id', id);
            if (error) throw error;
            await load();
        } catch (err) {
            console.error('Error deleting tenant:', err);
            alert('Error al eliminar empresa');
        } finally {
            setLoading(false);
        }
    }

    function toggleTenantExpansion(id: string) {
        setExpandedTenants(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    const filteredUsers = allUsers.filter((u) =>
        [u.full_name, u.company_name, u.email].some((f) =>
            f?.toLowerCase().includes(search.toLowerCase())
        )
    );

    const locale = lang === 'en' ? 'en-US' : lang === 'pt' ? 'pt-BR' : 'es-AR';

    return (
        <main className="main-content">
            <div className="admin-header" style={{ position: 'relative', justifyContent: 'center' }}>
                <button
                    className="btn btn-ghost btn-sm back-btn"
                    style={{ position: 'absolute', left: 0 }}
                    onClick={() => navigate('/')}
                    title={t.back_to_dashboard}
                >
                    <ArrowLeft size={18} />
                    <span>{t.back_to_dashboard}</span>
                </button>
                <div className="admin-title-group" style={{ justifyContent: 'center' }}>
                    <h1 className="admin-title">{t.admin_panel}</h1>
                </div>
                <button
                    className="icon-btn"
                    style={{ position: 'absolute', right: 0 }}
                    onClick={() => load()}
                    title={t.refresh}
                >
                    <RefreshCw size={16} className={loading ? 'spin' : ''} />
                </button>
            </div>

            {/* Tabs */}
            <div className="admin-tabs">
                <button
                    className={`admin-tab ${tab === 'pending' ? 'admin-tab--active' : ''}`}
                    onClick={() => setTab('pending')}
                >
                    <Clock size={15} />
                    {t.requests_tab}
                    {pendingUsers.length > 0 && (
                        <span className="admin-tab-badge">{pendingUsers.length}</span>
                    )}
                </button>
                <button
                    className={`admin-tab ${tab === 'tenants' ? 'admin-tab--active' : ''}`}
                    onClick={() => setTab('tenants')}
                >
                    <Building2 size={15} />
                    {t.companies_tab}
                </button>
                <button
                    className={`admin-tab ${tab === 'users' ? 'admin-tab--active' : ''}`}
                    onClick={() => setTab('users')}
                >
                    <Users size={15} />
                    {t.users_tab}
                </button>
            </div>

            {/* Solicitudes pendientes */}
            {tab === 'pending' && (
                <div className="admin-section">
                    {pendingUsers.length === 0 ? (
                        <div className="empty-state">
                            <CheckCircle size={40} strokeWidth={1.2} />
                            <p>{t.no_pending_requests}</p>
                        </div>
                    ) : (
                        <div className="admin-list">
                            {pendingUsers.map((u) => (
                                <div key={u.id} className="admin-row">
                                    <div className="admin-row-info">
                                        <p className="admin-row-name">{u.full_name || t.no_name}</p>
                                        <p className="admin-row-sub">{u.company_name} · {u.id.slice(0, 8)}…</p>
                                        <p className="admin-row-date">
                                            {t.requested_on}: {new Date(u.created_at).toLocaleDateString(locale)}
                                        </p>
                                    </div>
                                    <div className="admin-row-actions">
                                        <button
                                            className="btn btn-sm btn-success"
                                            onClick={() => approveUser(u.id)}
                                        >
                                            <CheckCircle size={14} /> {t.approve}
                                        </button>
                                        <button
                                            className="btn btn-sm btn-danger"
                                            onClick={() => rejectUser(u.id)}
                                        >
                                            <XCircle size={14} /> {t.reject}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Empresas (Tenants) */}
            {tab === 'tenants' && (
                <div className="admin-section">
                    <div className="admin-section-bar">
                        <h2 className="admin-section-title">{t.registered_companies}</h2>
                        <button
                            className="btn btn-primary btn-sm"
                            onClick={() => setAddingTenant(!addingTenant)}
                        >
                            <Plus size={14} /> {t.new_company_btn}
                        </button>
                    </div>

                    {addingTenant && (
                        <div className="admin-add-row">
                            <input
                                className="form-input"
                                placeholder={t.company_name}
                                value={newTenantName}
                                onChange={(e) => setNewTenantName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && createTenant()}
                            />
                            <button className="btn btn-primary btn-sm" onClick={createTenant}>{t.create_btn}</button>
                            <button className="btn btn-ghost btn-sm" onClick={() => setAddingTenant(false)}>{t.cancel}</button>
                        </div>
                    )}

                    <div className="admin-list">
                        {tenants.map((tenant) => (
                            <div key={tenant.id} className="admin-company-group">
                                <div className="admin-row">
                                    <div className="admin-row-info">
                                        <p className="admin-row-name">{tenant.name}</p>
                                        <p className="admin-row-sub">Slug: {tenant.slug}</p>
                                    </div>
                                    <div className="admin-row-actions">
                                        <span className={`status-chip-sm ${tenant.active ? 'status-chip-sm--active' : 'status-chip-sm--inactive'}`}>
                                            {tenant.active ? t.active_state : t.inactive_state}
                                        </span>
                                        <button
                                            className="btn btn-ghost btn-sm"
                                            onClick={() => toggleTenant(tenant.id, tenant.active)}
                                        >
                                            {tenant.active ? t.deactivate : t.activate}
                                        </button>
                                        <button
                                            className="btn btn-ghost btn-sm btn-danger-soft"
                                            onClick={() => deleteTenant(tenant.id)}
                                            title={t.confirm_delete_permanent}
                                            style={{ color: '#ef4444' }}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                        <button
                                            className="btn btn-ghost btn-sm"
                                            onClick={() => toggleTenantExpansion(tenant.id)}
                                        >
                                            {expandedTenants.has(tenant.id) ? t.hide_users : t.view_users}
                                        </button>
                                    </div>
                                </div>

                                {
                                    expandedTenants.has(tenant.id) && (
                                        <div className="nested-users-list">
                                            {allUsers.filter(u => u.tenant_id === tenant.id).length > 0 ? (
                                                allUsers.filter(u => u.tenant_id === tenant.id).map(u => (
                                                    <div key={u.id} className="nested-user-item">
                                                        <div className="nested-user-info">
                                                            <span className="nested-user-name">{u.full_name || t.no_name}</span>
                                                            <span className="nested-user-email">{u.email}</span>
                                                        </div>
                                                        <div className="nested-user-badges">
                                                            <span className={`badge badge-${u.role}`}>{u.role}</span>
                                                            <span className={`badge badge-${u.status}`}>{t[`status_${u.status}` as keyof typeof t] || u.status}</span>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="nested-empty-msg">{t.no_users_in_company}</div>
                                            )}
                                        </div>
                                    )
                                }
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Usuarios activos */}
            {tab === 'users' && (
                <div className="admin-section">
                    <div className="admin-section-bar">
                        <h2 className="admin-section-title">{t.users_tab}</h2>
                        <div className="search-box" style={{ width: 'auto' }}>
                            <Search size={14} className="search-icon" />
                            <input
                                className="search-input"
                                placeholder={t.search_users_placeholder}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="admin-list">
                        {filteredUsers.map((u) => (
                            <div key={u.id} className="admin-row">
                                <div className="admin-row-info">
                                    <p className="admin-row-name">{u.full_name || t.no_name}</p>
                                    <p className="admin-row-sub">{u.company_name} · {u.role}</p>
                                </div>
                                <div className="admin-row-actions">
                                    <span className={`
                                        status-chip-sm
                                        ${u.status === 'active' ? 'status-chip-sm--active' : ''}
                                        ${u.status === 'suspended' ? 'status-chip-sm--inactive' : ''}
                                    `}>
                                        {u.status === 'active' ? (t as any).status_active || 'Active' : t.suspended_state}
                                    </span>
                                    {!u.tenant_id && u.status === 'active' && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            <span className="status-chip-sm status-chip-sm--inactive" style={{ color: '#ef4444', borderColor: '#fecaca' }}>
                                                ⚠️ Sin Empresa
                                            </span>
                                            <button
                                                className="btn btn-sm btn-primary"
                                                onClick={() => approveUser(u.id)}
                                                title="Vincular empresa y habilitar creación"
                                            >
                                                <RefreshCw size={12} /> Vincular
                                            </button>
                                        </div>
                                    )}
                                    {u.status === 'active' ? (
                                        <button className="btn btn-ghost btn-sm" onClick={() => rejectUser(u.id)}>
                                            <Trash2 size={13} /> {t.suspend_btn}
                                        </button>
                                    ) : (
                                        <button className="btn btn-sm btn-success" onClick={() => approveUser(u.id)}>
                                            <CheckCircle size={13} /> {t.activate}
                                        </button>
                                    )}
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => deleteUser(u.id)}
                                        title={t.confirm_delete_permanent}
                                        style={{ color: '#ef4444' }}
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </main>
    );
}
