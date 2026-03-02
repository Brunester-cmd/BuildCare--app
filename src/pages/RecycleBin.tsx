import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, RotateCcw, AlertTriangle, Inbox, ArrowLeft } from 'lucide-react';
import { useWorkOrders } from '../hooks/useWorkOrders';
import { PRIORITY_COLORS } from '../types';
import { useI18n } from '../hooks/useI18n';

function daysLeft(eliminadoEn?: string): number {
    if (!eliminadoEn) return 30;
    const deleted = new Date(eliminadoEn).getTime();
    const now = Date.now();
    const diffDays = Math.ceil((deleted + 30 * 86400000 - now) / 86400000);
    return Math.max(0, diffDays);
}

export default function RecycleBin() {
    const navigate = useNavigate();
    const { t, lang } = useI18n();
    const { deletedOrders, restoreOrder, permanentDelete } = useWorkOrders();
    const [confirmId, setConfirmId] = useState<string | null>(null);

    function formatDate(iso: string) {
        const locale = lang === 'en' ? 'en-US' : lang === 'pt' ? 'pt-BR' : 'es-AR';
        return new Date(iso).toLocaleDateString(locale, {
            day: '2-digit', month: 'short', year: 'numeric',
        });
    }

    return (
        <main className="main-content">
            <div className="recycle-header">
                <div className="recycle-title-group">
                    <button className="btn btn-ghost btn-sm back-btn" onClick={() => navigate('/')} title={t.back_to_dashboard}>
                        <ArrowLeft size={18} />
                        <span>{t.back_to_dashboard}</span>
                    </button>
                    <div className="title-separator" />
                    <Trash2 size={22} />
                    <h2 className="recycle-title">{t.recycle_bin_title}</h2>
                </div>
                <div className="recycle-notice">
                    <AlertTriangle size={14} />
                    {t.recycle_notice}
                </div>
            </div>

            {deletedOrders.length === 0 ? (
                <div className="empty-state">
                    <Inbox size={48} strokeWidth={1.2} />
                    <p>{t.empty_trash_msg}</p>
                </div>
            ) : (
                <div className="orders-list">
                    {deletedOrders.map((order) => {
                        const days = daysLeft(order.eliminadoEn);
                        return (
                            <div key={order.id} className="wo-row wo-row--deleted">
                                <div className="wo-row-main">
                                    <span className={`priority-badge ${PRIORITY_COLORS[order.prioridad]}`}>
                                        {(t as any)[`priority_${order.prioridad}`]}
                                    </span>
                                    <div className="wo-row-info">
                                        <h3 className="wo-row-title wo-row-title--muted">{order.titulo}</h3>
                                        {order.descripcion && <p className="wo-row-desc">{order.descripcion}</p>}
                                    </div>
                                </div>

                                <div className="wo-row-meta">
                                    <span className="meta-item">{(t as any)[`cat_${order.categoria}`] || order.categoria}</span>
                                    {order.eliminadoEn && (
                                        <span className="meta-item">{t.deleted_on}: {formatDate(order.eliminadoEn)}</span>
                                    )}
                                    <span className={`days-badge ${days <= 3 ? 'days-badge--urgent' : ''}`}>
                                        {t.days_left.replace('{n}', days.toString())}
                                    </span>
                                </div>

                                <div className="wo-row-actions">
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => restoreOrder(order.id)}
                                        title={t.restore}
                                    >
                                        <RotateCcw size={14} />
                                        {t.restore}
                                    </button>
                                    {confirmId === order.id ? (
                                        <div className="confirm-inline">
                                            <span>{t.confirm_action}</span>
                                            <button
                                                className="btn btn-danger btn-sm"
                                                onClick={() => { permanentDelete(order.id); setConfirmId(null); }}
                                            >
                                                {t.confirm_delete_btn}
                                            </button>
                                            <button className="btn btn-ghost btn-sm" onClick={() => setConfirmId(null)}>
                                                {t.no_btn}
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={() => setConfirmId(order.id)}
                                            title={t.delete_permanently}
                                        >
                                            <Trash2 size={14} />
                                            {t.delete}
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
