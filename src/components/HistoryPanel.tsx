import { useState, useEffect, useCallback } from 'react';
import { X, Clock, CheckCircle, Play, Trash2, RotateCcw, Edit, Hash } from 'lucide-react';
import type { WorkOrderHistory, HistoryEventType } from '../types';
import { useI18n } from '../hooks/useI18n';

interface HistoryPanelProps {
    onClose: () => void;
    loadHistory: (workOrderId?: string) => Promise<WorkOrderHistory[]>;
}

export default function HistoryPanel({ onClose, loadHistory }: HistoryPanelProps) {
    const { t, lang } = useI18n();
    const [events, setEvents] = useState<WorkOrderHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchNum, setSearchNum] = useState('');

    const EVENT_CONFIG: Record<HistoryEventType, {
        label: string;
        icon: typeof Clock;
        color: string;
    }> = {
        created: { label: t.event_created, icon: Play, color: '#16a34a' },
        status_changed: { label: t.event_status_changed, icon: CheckCircle, color: '#f59e0b' },
        updated: { label: t.event_updated, icon: Edit, color: '#3b82f6' },
        deleted: { label: t.event_deleted, icon: Trash2, color: '#ef4444' },
        restored: { label: t.event_restored, icon: RotateCcw, color: '#8b5cf6' },
    };

    function timeAgo(iso: string) {
        const diff = Date.now() - new Date(iso).getTime();
        const m = Math.floor(diff / 60000);
        const h = Math.floor(m / 60);
        const d = Math.floor(h / 24);
        if (d > 0) return t.ago_days.replace('{d}', d.toString());
        if (h > 0) return t.ago_hours.replace('{h}', h.toString());
        if (m > 0) return t.ago_minutes.replace('{m}', m.toString());
        return t.now;
    }

    function formatFull(iso: string) {
        const locale = lang === 'en' ? 'en-US' : lang === 'pt' ? 'pt-BR' : 'es-AR';
        return new Date(iso).toLocaleString(locale, {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    }

    const fetchHistory = useCallback(async () => {
        setLoading(true);
        const data = await loadHistory();
        setEvents(data);
        setLoading(false);
    }, [loadHistory]);

    useEffect(() => { void fetchHistory(); }, [fetchHistory]);

    const filtered = searchNum.trim()
        ? events.filter((e) => e.note?.includes(`#${searchNum.trim()}`))
        : events;

    return (
        <>
            <div className="history-overlay" onClick={onClose} />
            <aside className="history-panel">
                <div className="history-panel-header">
                    <div className="history-panel-title">
                        <Clock size={18} />
                        <span>{t.history_panel_title}</span>
                    </div>
                    <button className="history-close-btn" onClick={onClose} title={t.close}>
                        <X size={18} />
                    </button>
                </div>

                <div className="history-filter">
                    <Hash size={13} />
                    <input
                        type="number"
                        className="history-filter-input"
                        placeholder={t.filter_placeholder}
                        value={searchNum}
                        onChange={(e) => setSearchNum(e.target.value)}
                    />
                    {searchNum && (
                        <button className="history-filter-clear" onClick={() => setSearchNum('')}>✕</button>
                    )}
                </div>

                <div className="history-events">
                    {loading ? (
                        <div className="history-loading">
                            <div className="loading-spinner" />
                            <p>{t.loading_history}</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="history-empty">
                            <Clock size={36} strokeWidth={1.2} />
                            <p>{t.no_events}</p>
                        </div>
                    ) : (
                        filtered.map((ev) => {
                            const cfg = EVENT_CONFIG[ev.event_type] ?? EVENT_CONFIG.updated;
                            const Icon = cfg.icon;
                            return (
                                <div key={ev.id} className="history-event">
                                    <div className="history-event-dot" style={{ background: cfg.color }}>
                                        <Icon size={12} color="white" />
                                    </div>
                                    <div className="history-event-body">
                                        <div className="history-event-header">
                                            <span className="history-event-label" style={{ color: cfg.color }}>
                                                {cfg.label}
                                            </span>
                                            {ev.note && ev.note.includes('#') && (
                                                <span className="history-event-num">
                                                    {ev.note.match(/#\d+/)?.[0]}
                                                </span>
                                            )}
                                            <span className="history-event-time" title={formatFull(ev.created_at)}>
                                                {timeAgo(ev.created_at)}
                                            </span>
                                        </div>

                                        {ev.event_type === 'status_changed' && ev.old_status && ev.new_status && (
                                            <p className="history-event-detail">
                                                <span className="history-status-chip">
                                                    {(t as any)[`status_${ev.old_status.replace('-', '_')}`] || ev.old_status}
                                                </span>
                                                <span className="history-arrow">→</span>
                                                <span className="history-status-chip history-status-chip--new">
                                                    {(t as any)[`status_${ev.new_status.replace('-', '_')}`] || ev.new_status}
                                                </span>
                                            </p>
                                        )}
                                        {ev.note && !ev.note.includes('#') && (
                                            <p className="history-event-note">{ev.note}</p>
                                        )}
                                        {ev.user_name && (
                                            <p className="history-event-user">{t.by} {ev.user_name}</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="history-footer">
                    <button className="btn btn-ghost btn-sm" onClick={() => void fetchHistory()}>
                        ↻ {t.refresh}
                    </button>
                    <span className="history-count">
                        {t.history_count.replace('{count}', filtered.length.toString())}
                    </span>
                </div>
            </aside>
        </>
    );
}
