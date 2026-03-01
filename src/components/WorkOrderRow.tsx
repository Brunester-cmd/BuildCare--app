import { useState } from 'react';
import {
    MapPin, User, Tag, Calendar, MoreVertical,
    Play, Pause, CheckCircle, Trash2, Eye,
} from 'lucide-react';
import { type WorkOrder, type Status, PRIORITY_LABELS, CATEGORY_LABELS, PRIORITY_COLORS } from '../types';

interface WorkOrderRowProps {
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

export default function WorkOrderRow({ order, onChangeStatus, onDelete, onView }: WorkOrderRowProps) {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <div className="wo-row">
            <div className="wo-row-main">
                <span className={`priority-badge ${PRIORITY_COLORS[order.prioridad]}`}>
                    {PRIORITY_LABELS[order.prioridad]}
                </span>
                <div className="wo-row-info">
                    <h3 className="wo-row-title" onClick={() => onView(order)}>{order.titulo}</h3>
                    {order.descripcion && <p className="wo-row-desc">{order.descripcion}</p>}
                </div>
            </div>

            <div className="wo-row-meta">
                {order.ubicacion && <span className="meta-item"><MapPin size={12} />{order.ubicacion}</span>}
                {order.asignadoA && <span className="meta-item"><User size={12} />{order.asignadoA}</span>}
                <span className="meta-item"><Tag size={12} />{CATEGORY_LABELS[order.categoria]}</span>
                <span className="meta-item"><Calendar size={12} />{formatDate(order.creadoEn)}</span>
            </div>

            <div className="wo-row-actions">
                <button
                    className="icon-btn"
                    onClick={() => setMenuOpen(!menuOpen)}
                    onBlur={() => setTimeout(() => setMenuOpen(false), 150)}
                >
                    <MoreVertical size={16} />
                </button>
                {menuOpen && (
                    <div className="dropdown-menu dropdown-menu--left">
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
    );
}
