import { useState } from 'react';
import { Trash2, RotateCcw, AlertTriangle, Inbox } from 'lucide-react';
import { useWorkOrders } from '../hooks/useWorkOrders';
import { PRIORITY_LABELS, CATEGORY_LABELS, PRIORITY_COLORS } from '../types';

function daysLeft(eliminadoEn?: string): number {
    if (!eliminadoEn) return 30;
    const deleted = new Date(eliminadoEn).getTime();
    const now = Date.now();
    const diffDays = Math.ceil((deleted + 30 * 86400000 - now) / 86400000);
    return Math.max(0, diffDays);
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('es-AR', {
        day: '2-digit', month: 'short', year: 'numeric',
    });
}

export default function RecycleBin() {
    const { deletedOrders, restoreOrder, permanentDelete } = useWorkOrders();
    const [confirmId, setConfirmId] = useState<string | null>(null);

    return (
        <main className="main-content">
            <div className="recycle-header">
                <div className="recycle-title-group">
                    <Trash2 size={22} />
                    <h2 className="recycle-title">Papelera de Reciclaje</h2>
                </div>
                <div className="recycle-notice">
                    <AlertTriangle size={14} />
                    Las órdenes se eliminan permanentemente después de 30 días
                </div>
            </div>

            {deletedOrders.length === 0 ? (
                <div className="empty-state">
                    <Inbox size={48} strokeWidth={1.2} />
                    <p>La papelera está vacía</p>
                </div>
            ) : (
                <div className="orders-list">
                    {deletedOrders.map((order) => {
                        const days = daysLeft(order.eliminadoEn);
                        return (
                            <div key={order.id} className="wo-row wo-row--deleted">
                                <div className="wo-row-main">
                                    <span className={`priority-badge ${PRIORITY_COLORS[order.prioridad]}`}>
                                        {PRIORITY_LABELS[order.prioridad]}
                                    </span>
                                    <div className="wo-row-info">
                                        <h3 className="wo-row-title wo-row-title--muted">{order.titulo}</h3>
                                        {order.descripcion && <p className="wo-row-desc">{order.descripcion}</p>}
                                    </div>
                                </div>

                                <div className="wo-row-meta">
                                    <span className="meta-item">{CATEGORY_LABELS[order.categoria]}</span>
                                    {order.eliminadoEn && (
                                        <span className="meta-item">Eliminado: {formatDate(order.eliminadoEn)}</span>
                                    )}
                                    <span className={`days-badge ${days <= 3 ? 'days-badge--urgent' : ''}`}>
                                        {days}d restantes
                                    </span>
                                </div>

                                <div className="wo-row-actions">
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => restoreOrder(order.id)}
                                        title="Restaurar"
                                    >
                                        <RotateCcw size={14} />
                                        Restaurar
                                    </button>
                                    {confirmId === order.id ? (
                                        <div className="confirm-inline">
                                            <span>¿Confirmar?</span>
                                            <button
                                                className="btn btn-danger btn-sm"
                                                onClick={() => { permanentDelete(order.id); setConfirmId(null); }}
                                            >
                                                Sí, eliminar
                                            </button>
                                            <button className="btn btn-ghost btn-sm" onClick={() => setConfirmId(null)}>
                                                No
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={() => setConfirmId(order.id)}
                                            title="Eliminar permanentemente"
                                        >
                                            <Trash2 size={14} />
                                            Eliminar
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </main>
    );
}
