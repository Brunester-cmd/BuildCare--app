import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ClipboardList } from 'lucide-react';
import { useWorkOrders } from '../hooks/useWorkOrders';
import OrderDetailModal from '../components/OrderDetailModal';
import { useState } from 'react';
import type { WorkOrder, Status } from '../types';
import { PRIORITY_LABELS, CATEGORY_LABELS, PRIORITY_COLORS } from '../types';

const STATUS_LABELS: Record<string, string> = {
    pendiente: 'Pendiente',
    'en-pausa': 'En pausa',
    completada: 'Completada',
};

const STATUS_CLASS: Record<string, string> = {
    pendiente: 'status-badge--pendiente',
    'en-pausa': 'status-badge--pausa',
    completada: 'status-badge--completada',
};

export default function DayOrdersPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const dateParam = searchParams.get('date'); // e.g. "2025-03-03"

    const { allOrders, updateOrder, deleteOrder, changeStatus } = useWorkOrders();
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

    // Parse the date
    const pageDate = dateParam ? new Date(dateParam + 'T12:00:00') : new Date();
    const dateString = pageDate.toISOString().split('T')[0];

    const dayOrders: WorkOrder[] = allOrders.filter(order => {
        const targetDate = order.fechaProgramada
            ? new Date(order.fechaProgramada)
            : new Date(order.creadoEn);
        return targetDate.toISOString().split('T')[0] === dateString;
    });

    const dateLabel = pageDate.toLocaleDateString('es-AR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const selectedOrder = allOrders.find(o => o.id === selectedOrderId);

    async function handleChangeStatus(id: string, status: Status) {
        await changeStatus(id, status);
    }

    return (
        <main className="main-content">
            {/* Page header */}
            <div className="day-page-header">
                <button
                    className="btn btn-ghost btn-sm day-page-back"
                    onClick={() => navigate(-1)}
                >
                    <ArrowLeft size={16} />
                    Volver al calendario
                </button>
                <div className="day-page-title-block">
                    <ClipboardList size={22} />
                    <div>
                        <h1 className="day-page-title">
                            {dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)}
                        </h1>
                        <p className="day-page-subtitle">
                            {dayOrders.length === 0
                                ? 'Sin órdenes asignadas'
                                : `${dayOrders.length} orden${dayOrders.length !== 1 ? 'es' : ''} de trabajo`}
                        </p>
                    </div>
                </div>
            </div>

            {/* Orders */}
            {dayOrders.length === 0 ? (
                <div className="empty-state">
                    <ClipboardList size={48} strokeWidth={1.2} />
                    <p>No hay órdenes asignadas para este día</p>
                </div>
            ) : (
                <div className="day-page-list">
                    {dayOrders.map(order => (
                        <div
                            key={order.id}
                            className="day-page-card"
                            onClick={() => setSelectedOrderId(order.id)}
                        >
                            <div className="day-page-card-top">
                                <span className="day-page-order-num">#{String(order.orderNumber).padStart(4, '0')}</span>
                                <span className={`status-badge ${STATUS_CLASS[order.estado] ?? ''}`}>
                                    {STATUS_LABELS[order.estado] ?? order.estado}
                                </span>
                            </div>
                            <h3 className="day-page-card-title">{order.titulo}</h3>
                            {order.descripcion && (
                                <p className="day-page-card-desc">{order.descripcion}</p>
                            )}
                            <div className="day-page-card-meta">
                                <span className={`priority-badge ${PRIORITY_COLORS[order.prioridad]}`}>
                                    {PRIORITY_LABELS[order.prioridad]}
                                </span>
                                <span className="day-page-meta-sep">·</span>
                                <span>{CATEGORY_LABELS[order.categoria]}</span>
                                {order.ubicacion && (
                                    <>
                                        <span className="day-page-meta-sep">·</span>
                                        <span>{order.ubicacion}</span>
                                    </>
                                )}
                                {order.asignadoA && (
                                    <>
                                        <span className="day-page-meta-sep">·</span>
                                        <span>👷 {order.asignadoA}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Order detail modal */}
            {selectedOrder && (
                <OrderDetailModal
                    order={selectedOrder}
                    onClose={() => setSelectedOrderId(null)}
                    onUpdate={updateOrder}
                    onDelete={deleteOrder}
                    onChangeStatus={handleChangeStatus}
                />
            )}
        </main>
    );
}
