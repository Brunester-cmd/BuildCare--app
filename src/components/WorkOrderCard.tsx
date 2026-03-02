import { useState } from 'react';
import {
    MapPin, User, Tag, Calendar, MoreVertical,
    Play, Pause, CheckCircle, Trash2, X, Hash,
} from 'lucide-react';
import { type WorkOrder, type Status, PRIORITY_COLORS, CATEGORY_LABELS } from '../types';
import { useI18n } from '../hooks/useI18n';

interface WorkOrderCardProps {
    order: WorkOrder;
    onChangeStatus: (id: string, status: Status) => void;
    onDelete: (id: string) => void;
    onView: (order: WorkOrder) => void;
}

export default function WorkOrderCard({ order, onChangeStatus, onDelete, onView }: WorkOrderCardProps) {
    const { t, lang } = useI18n();
    const [menuOpen, setMenuOpen] = useState(false);

    function formatDate(iso: string) {
        const locale = lang === 'en' ? 'en-US' : lang === 'pt' ? 'pt-BR' : 'es-AR';
        return new Date(iso).toLocaleDateString(locale, {
            day: '2-digit', month: 'short', year: 'numeric',
        });
    }

    const STATUS_ACTIONS = [
        { status: 'pendiente', label: t.status_pendiente_btn, icon: Play },
        { status: 'en-pausa', label: t.status_pausa_btn, icon: Pause },
        { status: 'completada', label: t.status_completada_btn, icon: CheckCircle },
    ] as const;

    return (
        <div
            className="wo-card wo-card--clickable"
            onClick={() => { if (!menuOpen) onView(order); }}
        >
            <div className="wo-card-header">
                <div className="wo-card-header-left">
                    <span className={`priority-badge ${PRIORITY_COLORS[order.prioridad]}`}>
                        {(t as any)[`priority_${order.prioridad}`]}
                    </span>
                    <span className="order-number-badge">
                        <Hash size={10} />
                        {String(order.orderNumber).padStart(4, '0')}
                    </span>
                </div>
                <div className="wo-card-actions">
                    <button
                        className="icon-btn"
                        onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
                        onBlur={() => setTimeout(() => setMenuOpen(false), 150)}
                    >
                        <MoreVertical size={16} />
                    </button>
                    {menuOpen && (
                        <div className="dropdown-menu" onClick={(e) => e.stopPropagation()}>
                            <div className="dropdown-close-row">
                                <span className="dropdown-title">{t.actions}</span>
                                <button className="dropdown-close-btn" onClick={() => setMenuOpen(false)} title={t.close}>
                                    <X size={14} />
                                </button>
                            </div>
                            <div className="dropdown-section-label">{t.change_status}</div>
                            {STATUS_ACTIONS.filter((a) => a.status !== order.estado).map(({ status, label, icon: Icon }) => (
                                <button
                                    key={status}
                                    className="dropdown-item"
                                    onClick={() => { onChangeStatus(order.id, status); setMenuOpen(false); }}
                                >
                                    <Icon size={14} />
                                    {label}
                                </button>
                            ))}
                            <div className="dropdown-divider" />
                            <button
                                className="dropdown-item dropdown-item--danger"
                                onClick={() => { onDelete(order.id); setMenuOpen(false); }}
                            >
                                <Trash2 size={14} />
                                {t.delete}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <h3 className="wo-card-title">{order.titulo}</h3>
            {order.descripcion && <p className="wo-card-desc">{order.descripcion}</p>}

            <div className="wo-card-meta">
                {order.ubicacion && (
                    <span className="meta-item"><MapPin size={12} />{order.ubicacion}</span>
                )}
                {order.asignadoA && (
                    <span className="meta-item"><User size={12} />{order.asignadoA}</span>
                )}
                <span className="meta-item">
                    <Tag size={12} />
                    {(t as any)[`cat_${order.categoria}`] || CATEGORY_LABELS[order.categoria]}
                </span>
            </div>

            <div className="wo-card-footer">
                <span className="meta-item"><Calendar size={12} />{formatDate(order.creadoEn)}</span>
                <span className="wo-card-hint">{t.click_to_view}</span>
            </div>
        </div>
    );
}
