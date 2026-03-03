import { X, ExternalLink, ClipboardList, Plus } from 'lucide-react';
import type { WorkOrder } from '../types';
import { PRIORITY_LABELS, CATEGORY_LABELS } from '../types';

interface DayOrdersModalProps {
    date: Date;
    orders: WorkOrder[];
    onClose: () => void;
    onViewDay: (date: Date) => void;
    onOrderClick: (orderId: string) => void;
    onNewOrder: (date: Date) => void;
}

const STATUS_LABELS: Record<string, string> = {
    pendiente: 'Pendiente',
    'en-pausa': 'En pausa',
    completada: 'Completada',
};

const STATUS_CLASS: Record<string, string> = {
    pendiente: 'day-modal-status--pendiente',
    'en-pausa': 'day-modal-status--pausa',
    completada: 'day-modal-status--completada',
};

const PRIORITY_DOT: Record<string, string> = {
    baja: 'dot--baja',
    media: 'dot--media',
    alta: 'dot--alta',
    urgente: 'dot--urgente',
};

export default function DayOrdersModal({ date, orders, onClose, onViewDay, onOrderClick, onNewOrder }: DayOrdersModalProps) {
    const dateLabel = date.toLocaleDateString('es-AR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <div className="day-modal-overlay" onClick={onClose}>
            <div className="day-modal" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="day-modal-header">
                    <div className="day-modal-header-left">
                        <ClipboardList size={18} />
                        <div>
                            <h3 className="day-modal-title">
                                {dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)}
                            </h3>
                            <p className="day-modal-subtitle">
                                {orders.length === 0
                                    ? 'Sin órdenes asignadas'
                                    : `${orders.length} orden${orders.length !== 1 ? 'es' : ''} de trabajo`}
                            </p>
                        </div>
                    </div>
                    <button className="day-modal-close" onClick={onClose} title="Cerrar">
                        <X size={18} />
                    </button>
                </div>

                {/* Orders list */}
                <div className="day-modal-body">
                    {orders.length === 0 ? (
                        <div className="day-modal-empty">
                            <ClipboardList size={36} strokeWidth={1.2} />
                            <p>No hay órdenes para este día</p>
                        </div>
                    ) : (
                        <ul className="day-modal-list">
                            {orders.map(order => (
                                <li
                                    key={order.id}
                                    className="day-modal-item"
                                    onClick={() => { onOrderClick(order.id); onClose(); }}
                                >
                                    <div className="day-modal-item-top">
                                        <span className="day-modal-order-number">#{String(order.orderNumber).padStart(4, '0')}</span>
                                        <span className={`day-modal-status ${STATUS_CLASS[order.estado] ?? ''}`}>
                                            {STATUS_LABELS[order.estado] ?? order.estado}
                                        </span>
                                    </div>
                                    <p className="day-modal-item-title">{order.titulo}</p>
                                    <div className="day-modal-item-meta">
                                        <span className={`day-modal-priority-dot ${PRIORITY_DOT[order.prioridad]}`} />
                                        <span>{PRIORITY_LABELS[order.prioridad]}</span>
                                        <span className="day-modal-sep">·</span>
                                        <span>{CATEGORY_LABELS[order.categoria]}</span>
                                        {order.asignadoA && (
                                            <>
                                                <span className="day-modal-sep">·</span>
                                                <span>{order.asignadoA}</span>
                                            </>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Footer */}
                <div className="day-modal-footer">
                    <button className="btn btn-ghost btn-sm" onClick={onClose}>
                        Cerrar
                    </button>
                    <button
                        className="btn btn-primary btn-sm btn-glow"
                        onClick={() => { onNewOrder(date); onClose(); }}
                    >
                        <Plus size={14} />
                        Nueva Orden
                    </button>
                    <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => { onViewDay(date); onClose(); }}
                    >
                        <ExternalLink size={14} />
                        Ver detalles del día
                    </button>
                </div>
            </div>
        </div>
    );
}
