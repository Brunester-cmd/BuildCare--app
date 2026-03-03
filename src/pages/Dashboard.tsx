import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, PauseCircle, CheckCircle2, Plus, LayoutGrid, List, Inbox, SearchX, X, Filter, ChevronDown, CalendarDays } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useWorkOrders } from '../hooks/useWorkOrders';
import { type WorkOrder, type Status, type Profile, type Priority } from '../types';
import StatusCard from '../components/StatusCard';
import WorkOrderCard from '../components/WorkOrderCard';
import WorkOrderRow from '../components/WorkOrderRow';
import NewOrderModal from '../components/NewOrderModal';
import OrderDetailModal from '../components/OrderDetailModal';
import HistoryPanel from '../components/HistoryPanel';
import CalendarView from '../components/CalendarView';
import { useI18n } from '../hooks/useI18n';


type ActiveFilter = 'pendiente' | 'en-pausa' | 'completada' | 'todas';

interface DashboardProps {
    searchQuery: string;
    showHistory: boolean;
    onCloseHistory: () => void;
}

export default function Dashboard({ searchQuery, showHistory, onCloseHistory }: DashboardProps) {
    const {
        loading,
        allOrders,
        pendientes, enPausa, completadas,
        createOrder, updateOrder, changeStatus, deleteOrder,
        loadHistory,
    } = useWorkOrders();
    const navigate = useNavigate();
    const { profile, tenant } = useAuth();
    const { t } = useI18n();
    const [filter, setFilter] = useState<ActiveFilter>('pendiente');
    const [view, setView] = useState<'grid' | 'list' | 'calendar'>('grid');
    const [showNewModal, setShowNewModal] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

    // Advanced Filters & Sort State
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
    const [priorityFilter, setPriorityFilter] = useState<Priority | ''>('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [assigneeFilter, setAssigneeFilter] = useState('');
    const [activeSubmenu, setActiveSubmenu] = useState<'sort' | 'priority' | 'category' | 'assignee' | null>(null);

    // Reset sub-menu when the filter menu closes
    useEffect(() => {
        if (!isMenuOpen) {
            setActiveSubmenu(null);
        }
    }, [isMenuOpen]);

    const [members, setMembers] = useState<Profile[]>([]);
    const [scheduleDate, setScheduleDate] = useState<Date | undefined>(undefined);

    useState(() => {
        async function fetchMembers() {
            const tenantId = tenant?.id || profile?.tenant_id;
            if (!tenantId) return;
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('tenant_id', tenantId)
                .eq('status', 'active')
                .order('full_name');
            if (data) setMembers(data);
        }
        void fetchMembers();
    });

    const baseOrders: WorkOrder[] =
        filter === 'pendiente' ? pendientes :
            filter === 'en-pausa' ? enPausa :
                filter === 'completada' ? completadas : allOrders;

    const q = searchQuery.trim().toLowerCase();
    const filteredOrders = baseOrders.filter((o) => {
        // Search query filter
        const cleanQ = q.replace('#', '');
        const matchesSearch = !q ||
            String(o.orderNumber).padStart(4, '0').includes(cleanQ) ||
            o.titulo.toLowerCase().includes(q) ||
            (o.descripcion && o.descripcion.toLowerCase().includes(q)) ||
            (o.ubicacion && o.ubicacion.toLowerCase().includes(q)) ||
            (o.asignadoA && o.asignadoA.toLowerCase().includes(q)) ||
            (o.prioridad && o.prioridad.toLowerCase().includes(q)) ||
            (o.categoria && o.categoria.toLowerCase().includes(q));

        // Priority filter
        const matchesPriority = !priorityFilter || o.prioridad === priorityFilter;

        // Category filter
        const matchesCategory = !categoryFilter || o.categoria === categoryFilter;

        // Assignee filter
        const matchesAssignee = !assigneeFilter || o.asignadoA.toLowerCase().includes(assigneeFilter.toLowerCase());

        return matchesSearch && matchesPriority && matchesCategory && matchesAssignee;
    });

    // Sorting logic
    filteredOrders.sort((a, b) => {
        const dateA = new Date(a.creadoEn).getTime();
        const dateB = new Date(b.creadoEn).getTime();
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    const isFiltered = !!(priorityFilter || categoryFilter || assigneeFilter);

    function clearAllFilters() {
        setPriorityFilter('');
        setCategoryFilter('');
        setAssigneeFilter('');
    }

    const emptyMessages: Record<ActiveFilter, string> = {
        pendiente: t.no_pending,
        'en-pausa': t.no_paused,
        completada: t.no_completed,
        todas: t.no_pending_requests || 'No hay órdenes',
    };

    async function handleChangeStatus(id: string, status: Status) {
        await changeStatus(id, status);
    }

    const selectedOrder = allOrders.find(o => o.id === selectedOrderId);

    if (loading) return (
        <main className="main-content">
            <div className="loading-orders">
                <div className="loading-spinner" />
                <p>{t.loading_orders || 'Cargando órdenes…'}</p>
            </div>
        </main>
    );

    return (
        <main className="main-content">
            {/* Status cards (Row 1) */}
            <div className="status-cards">
                <StatusCard
                    label={t.pendientes}
                    count={pendientes.length}
                    icon={ClipboardList}
                    isActive={filter === 'pendiente'}
                    onClick={() => setFilter('pendiente')}
                    colorClass="status-icon--blue"
                />
                <StatusCard
                    label={t.en_pausa}
                    count={enPausa.length}
                    icon={PauseCircle}
                    isActive={filter === 'en-pausa'}
                    onClick={() => setFilter('en-pausa')}
                    colorClass="status-icon--amber"
                />
                <StatusCard
                    label={t.completadas}
                    count={completadas.length}
                    icon={CheckCircle2}
                    isActive={filter === 'completada'}
                    onClick={() => setFilter('completada')}
                    colorClass="status-icon--green"
                />
            </div>

            {/* Controls Row (Row 2): View Toggle — Filters — New Order */}
            <div className="dashboard-controls-row">
                <div className="view-toggle">
                    <button
                        className={`view-btn ${view === 'grid' ? 'view-btn--active' : ''}`}
                        onClick={() => setView('grid')}
                        title="Vista grilla"
                    >
                        <LayoutGrid size={18} />
                    </button>
                    <button
                        className={`view-btn ${view === 'list' ? 'view-btn--active' : ''}`}
                        onClick={() => setView('list')}
                        title="Vista lista"
                    >
                        <List size={18} />
                    </button>
                    <button
                        className={`view-btn ${view === 'calendar' ? 'view-btn--active' : ''}`}
                        onClick={() => setView('calendar')}
                        title="Calendario"
                    >
                        <CalendarDays size={18} />
                    </button>
                </div>

                <button className="btn btn-primary btn-glow new-order-btn" onClick={() => { setScheduleDate(undefined); setShowNewModal(true); }}>
                    <Plus size={18} />
                    {t.new_order}
                </button>

                <div className="filter-wrapper">
                    <button
                        className={`filter-menu-toggle ${isMenuOpen || isFiltered ? 'active' : ''}`}
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        <Filter size={18} />
                        <span>{t.filters_title}</span>
                        <ChevronDown size={14} style={{ transform: isMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                    </button>

                    {isFiltered && (
                        <button className="clear-filters-btn" onClick={clearAllFilters} style={{ margin: 0, height: '38px' }}>
                            <X size={16} />
                            {t.clear_filters}
                        </button>
                    )}
                </div>

                {isMenuOpen && (
                    <div className="filter-dropdown-menu">
                        {/* Sort Section */}
                        <div className="filter-menu-section">
                            <button
                                className="filter-submenu-toggle"
                                onClick={() => setActiveSubmenu(activeSubmenu === 'sort' ? null : 'sort')}
                            >
                                <label className="filter-menu-label">{t.filter_date}</label>
                                <ChevronDown size={14} style={{ transform: activeSubmenu === 'sort' ? 'rotate(180deg)' : 'none' }} />
                            </button>
                            {activeSubmenu === 'sort' && (
                                <div className="filter-submenu-content">
                                    <div className="filter-menu-grid">
                                        <button
                                            className={`filter-option ${sortOrder === 'newest' ? 'active' : ''}`}
                                            onClick={() => setSortOrder('newest')}
                                        >
                                            {t.sort_newest}
                                        </button>
                                        <button
                                            className={`filter-option ${sortOrder === 'oldest' ? 'active' : ''}`}
                                            onClick={() => setSortOrder('oldest')}
                                        >
                                            {t.sort_oldest}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Priority Section */}
                        <div className="filter-menu-section">
                            <button
                                className="filter-submenu-toggle"
                                onClick={() => setActiveSubmenu(activeSubmenu === 'priority' ? null : 'priority')}
                            >
                                <label className="filter-menu-label">{t.filter_priority}</label>
                                <ChevronDown size={14} style={{ transform: activeSubmenu === 'priority' ? 'rotate(180deg)' : 'none' }} />
                            </button>
                            {activeSubmenu === 'priority' && (
                                <div className="filter-submenu-content">
                                    <div className="filter-menu-grid">
                                        <button
                                            className={`filter-option ${priorityFilter === '' ? 'active' : ''}`}
                                            onClick={() => setPriorityFilter('')}
                                        >
                                            {t.all_priorities}
                                        </button>
                                        {['baja', 'media', 'alta', 'urgente'].map(p => (
                                            <button
                                                key={p}
                                                className={`filter-option ${priorityFilter === p ? 'active' : ''}`}
                                                onClick={() => setPriorityFilter(p as Priority)}
                                            >
                                                {(t as any)[`priority_${p}`]}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Category Section */}
                        <div className="filter-menu-section">
                            <button
                                className="filter-submenu-toggle"
                                onClick={() => setActiveSubmenu(activeSubmenu === 'category' ? null : 'category')}
                            >
                                <label className="filter-menu-label">{t.filter_category}</label>
                                <ChevronDown size={14} style={{ transform: activeSubmenu === 'category' ? 'rotate(180deg)' : 'none' }} />
                            </button>
                            {activeSubmenu === 'category' && (
                                <div className="filter-submenu-content">
                                    <div className="filter-menu-grid">
                                        <button
                                            className={`filter-option ${categoryFilter === '' ? 'active' : ''}`}
                                            onClick={() => setCategoryFilter('')}
                                        >
                                            {t.all_categories}
                                        </button>
                                        {[
                                            'electrico', 'plomeria', 'climatizacion', 'estructural',
                                            'pintura', 'carpinteria', 'limpieza', 'seguridad',
                                            'informatica', 'otro'
                                        ].map(c => (
                                            <button
                                                key={c}
                                                className={`filter-option ${categoryFilter === c ? 'active' : ''}`}
                                                onClick={() => setCategoryFilter(c)}
                                            >
                                                {(t as any)[`cat_${c}`]}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Assignee Section */}
                        <div className="filter-menu-section">
                            <button
                                className="filter-submenu-toggle"
                                onClick={() => setActiveSubmenu(activeSubmenu === 'assignee' ? null : 'assignee')}
                            >
                                <label className="filter-menu-label">{t.filter_assignee}</label>
                                <ChevronDown size={14} style={{ transform: activeSubmenu === 'assignee' ? 'rotate(180deg)' : 'none' }} />
                            </button>
                            {activeSubmenu === 'assignee' && (
                                <div className="filter-submenu-content">
                                    <div className="filter-menu-grid">
                                        <button
                                            className={`filter-option ${assigneeFilter === '' ? 'active' : ''}`}
                                            onClick={() => setAssigneeFilter('')}
                                        >
                                            {(t as any).all_assignees || 'Todos los operarios'}
                                        </button>
                                        {members.map(m => {
                                            const name = m.full_name || m.email || '';
                                            return (
                                                <button
                                                    key={m.id}
                                                    className={`filter-option ${assigneeFilter === name ? 'active' : ''}`}
                                                    onClick={() => setAssigneeFilter(name)}
                                                >
                                                    {m.full_name || m.email}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>


            {/* Search result info */}
            {q && (
                <p className="search-result-info">
                    {filteredOrders.length === 0
                        ? (t.no_results_for?.replace('{query}', searchQuery) || `Sin resultados para "${searchQuery}"`)
                        : (t.results_found?.replace('{count}', String(filteredOrders.length)).replace('{query}', searchQuery) ||
                            `${filteredOrders.length} resultado${filteredOrders.length !== 1 ? 's' : ''} para "${searchQuery}"`)}
                </p>
            )}

            {/* Orders */}
            {view === 'calendar' ? (
                <CalendarView
                    orders={allOrders}
                    onOrderClick={(id) => setSelectedOrderId(id)}
                    onViewDay={(date) => {
                        const iso = date.toISOString().split('T')[0];
                        navigate(`/dia?date=${iso}`);
                    }}
                />
            ) : filteredOrders.length === 0 ? (
                <div className="empty-state">
                    {q ? <SearchX size={48} strokeWidth={1.2} /> : <Inbox size={48} strokeWidth={1.2} />}
                    <p>{q ? (t.no_results_for?.replace('{query}', searchQuery) || `Sin resultados para "${searchQuery}"`) : emptyMessages[filter]}</p>
                </div>
            ) : (
                <div className={`work-orders-container ${view === 'grid' ? 'view-grid' : 'view-list'}`}>
                    {filteredOrders.map((order) => (
                        view === 'grid' ? (
                            <WorkOrderCard
                                key={order.id}
                                order={order}
                                onChangeStatus={handleChangeStatus}
                                onDelete={deleteOrder}
                                onView={(order) => setSelectedOrderId(order.id)}
                            />
                        ) : (
                            <WorkOrderRow
                                key={order.id}
                                order={order}
                                onChangeStatus={handleChangeStatus}
                                onDelete={deleteOrder}
                                onView={(o) => setSelectedOrderId(o.id)}
                            />
                        )
                    ))}
                </div>
            )}

            {showNewModal && (
                <NewOrderModal
                    initialDate={scheduleDate}
                    onClose={() => { setShowNewModal(false); setScheduleDate(undefined); }}
                    onCreate={createOrder}
                />
            )}

            {selectedOrder && (
                <OrderDetailModal
                    order={selectedOrder}
                    onClose={() => setSelectedOrderId(null)}
                    onUpdate={updateOrder}
                    onDelete={deleteOrder}
                    onChangeStatus={handleChangeStatus}
                />
            )}

            {showHistory && (
                <HistoryPanel
                    onClose={onCloseHistory}
                    loadHistory={loadHistory}
                />
            )}
        </main>
    );
}
