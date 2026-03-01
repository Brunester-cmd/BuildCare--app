import { useState } from 'react';
import {
    MapPin, User, Tag, Calendar, MoreVertical,
    Play, Pause, CheckCircle, Trash2, Eye,
} from 'lucide-react';
import { type WorkOrder, type Status, PRIORITY_LABELS, CATEGORY_LABELS, PRIORITY_COLORS } from '../types';

interface WorkOrderCardProps {
    order: WorkOrder;
    onChangeStatus: (id: string, status: Status) => void;
    onDelete: (id: string) => void;
    onView: (order: WorkOrder) => void;
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('es-AR', {
        day: '2-digit', month: 'short', year: 'numeric',
    });
}

type ActionItem = { status: Status; label: string; icon: typeof Play };
const STATUS_ACTIONS: ActionItem[] = [
    { status: 'pendiente', label: 'Marcar Pendiente', icon: Play },
    { status: 'en-pausa', label: 'Poner en Pausa', icon: Pause },
    { status: 'completada', label: 'Marcar Completada', icon: CheckCircle },
];

export default function WorkOrderCard({ order, onChangeStatus, onDelete, onView }: WorkOrderCardProps) {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <div className="wo-card">
            <div className="wo-card-header">
                <span className={`priority-badge ${PRIORITY_COLORS[order.prioridad]}`}>
                    {PRIORITY_LABELS[order.prioridad]}
                </span>
                <div className="wo-card-actions">
                    <button
                        className="icon-btn"
                        onClick={() => setMenuOpen(!menuOpen)}
                        onBlur={() => setTimeout(() => setMenuOpen(false), 150)}
                    >
                        <MoreVertical size={16} />
                    </button>
                    {menuOpen && (
                        <div className="dropdown-menu">
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
                            <button className="dropdown-item" onClick={() => { onView(order); setMenuOpen(false); }}>
                                <Eye size={14} />
                                Ver detalle
                            </button>
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

            <h3 className="wo-card-title" onClick={() => onView(order)}>{order.titulo}</h3>
            {order.descripcion && <p className="wo-card-desc">{order.descripcion}</p>}

            <div className="wo-card-meta">
                {order.ubicacion && (
                    <span className="meta-item"><MapPin size={12} />{order.ubicacion}</span>
                )}
                {order.asignadoA && (
                    <span className="meta-item"><User size={12} />{order.asignadoA}</span>
                )}
                <span className="meta-item"><Tag size={12} />{CATEGORY_LABELS[order.categoria]}</span>
            </div>

            <div className="wo-card-footer">
                <span className="meta-item"><Calendar size={12} />{formatDate(order.creadoEn)}</span>
            </div>
        </div>
    );
}
