import { useState } from 'react';
import { ClipboardList, PauseCircle, CheckCircle2, Plus, LayoutGrid, List, Inbox } from 'lucide-react';
import { useWorkOrders } from '../hooks/useWorkOrders';
import { type WorkOrder, type Status } from '../types';
import StatusCard from '../components/StatusCard';
import WorkOrderCard from '../components/WorkOrderCard';
import WorkOrderRow from '../components/WorkOrderRow';
import NewOrderModal from '../components/NewOrderModal';
import OrderDetailModal from '../components/OrderDetailModal';

type ActiveFilter = 'pendiente' | 'en-pausa' | 'completada';

export default function Dashboard() {
    const {
        pendientes, enPausa, completadas,
        createOrder, updateOrder, changeStatus, deleteOrder,
    } = useWorkOrders();

    const [filter, setFilter] = useState<ActiveFilter>('pendiente');
    const [view, setView] = useState<'grid' | 'list'>('grid');
    const [showNewModal, setShowNewModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);

    const filteredOrders: WorkOrder[] =
        filter === 'pendiente' ? pendientes :
            filter === 'en-pausa' ? enPausa : completadas;

    const emptyMessages: Record<ActiveFilter, string> = {
        pendiente: 'No hay órdenes pendientes',
        'en-pausa': 'No hay órdenes en pausa',
        completada: 'No hay órdenes completadas',
    };

    function handleChangeStatus(id: string, status: Status) {
        changeStatus(id, status);
        setSelectedOrder((prev) => prev?.id === id ? { ...prev, estado: status } : prev);
    }

    return (
        <main className="main-content">
            {/* Action bar */}
            <div className="action-bar">
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
                </div>
                <button className="btn btn-primary btn-glow" onClick={() => setShowNewModal(true)}>
                    <Plus size={18} />
                    Nueva Orden
                </button>
            </div>

            {/* Status cards */}
            <div className="status-cards">
                <StatusCard
                    label="Pendientes"
                    count={pendientes.length}
                    icon={ClipboardList}
                    isActive={filter === 'pendiente'}
                    onClick={() => setFilter('pendiente')}
                    colorClass="status-icon--amber"
                />
                <StatusCard
                    label="En Pausa"
                    count={enPausa.length}
                    icon={PauseCircle}
                    isActive={filter === 'en-pausa'}
                    onClick={() => setFilter('en-pausa')}
                    colorClass="status-icon--blue"
                />
                <StatusCard
                    label="Completadas"
                    count={completadas.length}
                    icon={CheckCircle2}
                    isActive={filter === 'completada'}
                    onClick={() => setFilter('completada')}
                    colorClass="status-icon--green"
                />
            </div>

            {/* Orders */}
            {filteredOrders.length === 0 ? (
                <div className="empty-state">
                    <Inbox size={48} strokeWidth={1.2} />
                    <p>{emptyMessages[filter]}</p>
                </div>
            ) : view === 'grid' ? (
                <div className="orders-grid">
                    {filteredOrders.map((order) => (
                        <WorkOrderCard
                            key={order.id}
                            order={order}
                            onChangeStatus={handleChangeStatus}
                            onDelete={deleteOrder}
                            onView={setSelectedOrder}
                        />
                    ))}
                </div>
            ) : (
                <div className="orders-list">
                    {filteredOrders.map((order) => (
                        <WorkOrderRow
                            key={order.id}
                            order={order}
                            onChangeStatus={handleChangeStatus}
                            onDelete={deleteOrder}
                            onView={setSelectedOrder}
                        />
                    ))}
                </div>
            )}

            {showNewModal && (
                <NewOrderModal
                    onClose={() => setShowNewModal(false)}
                    onCreate={createOrder}
                />
            )}

            {selectedOrder && (
                <OrderDetailModal
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                    onUpdate={updateOrder}
                    onDelete={deleteOrder}
                    onChangeStatus={handleChangeStatus}
                />
            )}
        </main>
    );
}
