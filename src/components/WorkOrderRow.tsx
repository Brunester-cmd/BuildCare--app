import { useState } from 'react';
import {
    MapPin, User, Tag, Calendar, MoreVertical,
    Play, Pause, CheckCircle, Trash2, X, Hash,
} from 'lucide-react';
import { type WorkOrder, type Status, PRIORITY_LABELS, CATEGORY_LABELS, PRIORITY_COLORS } from '../types';

interface WorkOrderRowProps {
    order: WorkOrder;
    onChangeStatus: (id: string, status: Status, note?: string) => void;
    onDelete: (id: string) => void;
    onView: (order: WorkOrder) => void;
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleString('es-AR', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

type ActionItem = { status: Status; label: string; icon: typeof Play };
const STATUS_ACTIONS: ActionItem[] = [
    { status: 'pendiente', label: 'Marcar Pendiente', icon: Play },
    { status: 'en-pausa', label: 'Pausar', icon: Pause },
    { status: 'completada', label: 'Marcar Completada', icon: CheckCircle },
];

export default function WorkOrderRow({ order, onChangeStatus, onDelete, onView }: WorkOrderRowProps) {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <div
            className="wo-row wo-row--clickable"
            onClick={() => { if (!menuOpen) onView(order); }}
        >
            <div className="wo-row-main">
                <div className="wo-row-badges">
                    <span className={`priority-badge ${PRIORITY_COLORS[order.prioridad]}`}>
                        {PRIORITY_LABELS[order.prioridad]}
                    </span>
                    <span className="order-number-badge">
                        <Hash size={10} />
                        {String(order.orderNumber).padStart(4, '0')}
                    </span>
                </div>
                <div className="wo-row-info">
                    <h3 className="wo-row-title">{order.titulo}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {order.descripcion && <p className="wo-row-desc">{order.descripcion}</p>}
                        {order.observaciones && (
                            <div className="pause-reason-tag" style={{
                                fontSize: '0.75rem',
                                color: 'var(--amber-700)',
                                background: 'var(--amber-50)',
                                padding: '0.15rem 0.5rem',
                                borderRadius: '1rem',
                                width: 'fit-content',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                border: '1px solid var(--amber-100)'
                            }}>
                                <Pause size={10} />
                                <strong>Motivo:</strong> {order.observaciones}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="wo-row-meta">
                {order.ubicacion && <span className="meta-item"><MapPin size={12} />{order.ubicacion}</span>}
                {order.asignadoA && <span className="meta-item"><User size={12} />{order.asignadoA}</span>}
                <span className="meta-item"><Tag size={12} />{CATEGORY_LABELS[order.categoria]}</span>
                <span className="meta-item"><Calendar size={12} />{formatDate(order.creadoEn)}</span>
            </div>

            <div className="wo-row-actions" onClick={(e) => e.stopPropagation()}>
                <button
                    className="icon-btn"
                    onClick={() => setMenuOpen(!menuOpen)}
                    onBlur={() => setTimeout(() => setMenuOpen(false), 150)}
                >
                    <MoreVertical size={16} />
                </button>
                {menuOpen && (
                    <div className="dropdown-menu">
                        <div className="dropdown-close-row">
                            <span className="dropdown-title">Acciones</span>
                            <button className="dropdown-close-btn" onClick={() => setMenuOpen(false)} title="Cerrar">
                                <X size={14} />
                            </button>
                        </div>
                        <div className="dropdown-section-label">Cambiar estado</div>
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
                            Eliminar
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
