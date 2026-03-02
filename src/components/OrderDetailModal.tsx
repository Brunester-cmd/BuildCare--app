import { useState, useEffect } from 'react';
import {
    X, MapPin, User, Tag, Calendar, Clock, Save, Trash2,
    Play, Pause, CheckCircle, Paperclip, FileText,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { type WorkOrder, type Status, type Priority, type Category, PRIORITY_COLORS, CATEGORY_LABELS, type Profile } from '../types';
import { useI18n } from '../hooks/useI18n';

interface OrderDetailModalProps {
    order: WorkOrder;
    onClose: () => void;
    onUpdate: (id: string, changes: Partial<WorkOrder> & { files?: FileList | File[] }) => void;
    onDelete: (id: string) => void;
    onChangeStatus: (id: string, status: Status) => void;
}

function fmt(iso: string, lang: string) {
    const locale = lang === 'en' ? 'en-US' : lang === 'pt' ? 'pt-BR' : 'es-AR';
    return new Date(iso).toLocaleString(locale, {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

const PRIORITIES: Priority[] = ['baja', 'media', 'alta', 'urgente'];
const CATEGORIES = Object.keys(CATEGORY_LABELS) as Category[];

export default function OrderDetailModal({ order, onClose, onUpdate, onDelete, onChangeStatus }: OrderDetailModalProps) {
    const { t, lang } = useI18n();
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState<{
        titulo: string;
        descripcion: string;
        prioridad: Priority;
        ubicacion: string;
        categoria: Category;
        asignadoA: string;
        files: File[];
        existingAttachments: { url: string; name: string }[];
    }>({
        titulo: order.titulo,
        descripcion: order.descripcion,
        prioridad: order.prioridad,
        ubicacion: order.ubicacion,
        categoria: order.categoria,
        asignadoA: order.asignadoA,
        files: [],
        existingAttachments: order.attachments || [],
    });
    const [members, setMembers] = useState<Profile[]>([]);
    const [membersLoading, setMembersLoading] = useState(false);

    useEffect(() => {
        if (!editing) return;

        async function fetchMembers() {
            if (!order.tenant_id) return;
            setMembersLoading(true);
            try {
                const { data } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('tenant_id', order.tenant_id)
                    .eq('status', 'active')
                    .order('full_name');
                if (data) setMembers(data);
            } catch (err) {
                console.error('Error fetching members:', err);
            } finally {
                setMembersLoading(false);
            }
        }
        void fetchMembers();
    }, [editing, order.tenant_id]);

    useEffect(() => {
        setForm({
            titulo: order.titulo,
            descripcion: order.descripcion,
            prioridad: order.prioridad,
            ubicacion: order.ubicacion,
            categoria: order.categoria,
            asignadoA: order.asignadoA,
            files: [],
            existingAttachments: order.attachments || [],
        });
    }, [order]);

    function handleSave() {
        onUpdate(order.id, {
            ...form,
            files: form.files,
            attachments: form.existingAttachments
        } as any);
        setEditing(false);
    }

    function handleDelete() {
        if (confirm(t.delete_confirm || '¿Eliminar orden?')) {
            onDelete(order.id);
            onClose();
        }
    }

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && !editing && onClose()}>
            <div className="modal modal--wide">
                <div className="modal-header">
                    <h2 className="modal-title">{t.order_detail}</h2>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="modal-close" onClick={onClose}><X size={18} /></button>
                    </div>
                </div>

                <div className="modal-body">
                    <div className="status-chips">
                        {(['pendiente', 'en-pausa', 'completada'] as Status[])
                            .filter((status) => {
                                if (status === order.estado) return false;
                                if (order.estado === 'en-pausa' && status === 'pendiente') return false;
                                return true;
                            })
                            .map((status) => {
                                const Icon = status === 'pendiente' ? Play : status === 'en-pausa' ? Pause : CheckCircle;
                                const color = status === 'pendiente' ? 'status-chip--pendiente' : status === 'en-pausa' ? 'status-chip--pausa' : 'status-chip--completada';
                                return (
                                    <button
                                        key={status}
                                        className={`status-chip ${color}`}
                                        onClick={() => {
                                            onChangeStatus(order.id, status);
                                            if (status === 'completada') onClose();
                                        }}
                                    >
                                        <Icon size={13} />
                                        {(t as any)[`status_${status.replace('-', '')}`]}
                                    </button>
                                );
                            })}
                    </div>

                    {editing ? (
                        <div className="detail-edit-grid">
                            <div className="form-group">
                                <label className="form-label">{t.title_label}</label>
                                <input className="form-input" value={form.titulo}
                                    onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))}
                                    spellCheck={false} autoCorrect="off" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t.description_label}</label>
                                <textarea className="form-input form-textarea" value={form.descripcion}
                                    onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))}
                                    spellCheck={false} autoCorrect="off" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t.priority_label}</label>
                                <select className="form-input form-select" value={form.prioridad}
                                    onChange={(e) => setForm((p) => ({ ...p, prioridad: e.target.value as Priority }))}>
                                    {PRIORITIES.map((pr) => <option key={pr} value={pr}>{(t as any)[`priority_${pr}`]}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t.location_label}</label>
                                <input className="form-input" value={form.ubicacion}
                                    onChange={(e) => setForm((p) => ({ ...p, ubicacion: e.target.value }))}
                                    spellCheck={false} autoCorrect="off" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t.category_label}</label>
                                <select className="form-input form-select" value={form.categoria}
                                    onChange={(e) => setForm((p) => ({ ...p, categoria: e.target.value as Category }))}>
                                    {CATEGORIES.map((c) => <option key={c} value={c}>{(t as any)[`cat_${c}`] || CATEGORY_LABELS[c]}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t.assigned_to}</label>
                                <div className="input-icon-wrap">
                                    <User size={16} className="input-icon" />
                                    <select
                                        className="form-input form-input--icon form-select"
                                        value={form.asignadoA}
                                        onChange={(e) => setForm((p) => ({ ...p, asignadoA: e.target.value }))}
                                        disabled={membersLoading}
                                    >
                                        <option value="">{t.select_assignee || 'Seleccionar operario'}</option>
                                        {(members as any[]).map((m) => (
                                            <option key={m.id} value={m.full_name || m.email}>
                                                {m.full_name || m.email}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t.file}</label>

                                {form.existingAttachments.length > 0 && (
                                    <div className="edit-attachments-list">
                                        {form.existingAttachments.map((att, i) => (
                                            <div key={i} className="edit-attachment-row">
                                                <span className="edit-attachment-name">{att.name}</span>
                                                <button
                                                    className="btn btn-ghost btn-xs text-danger"
                                                    onClick={() => setForm(p => ({
                                                        ...p,
                                                        existingAttachments: p.existingAttachments.filter((_, idx) => idx !== i)
                                                    }))}
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {form.files.length > 0 && (
                                    <div className="edit-attachments-list">
                                        {form.files.map((file, i) => (
                                            <div key={i} className="edit-attachment-row">
                                                <span className="edit-attachment-name">New: {file.name}</span>
                                                <button
                                                    className="btn btn-ghost btn-xs text-danger"
                                                    onClick={() => setForm(p => ({
                                                        ...p,
                                                        files: p.files.filter((_, idx) => idx !== i)
                                                    }))}
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="file-upload-zone" style={{ marginTop: '0.5rem' }}>
                                    <label className="file-upload-btn btn btn-ghost btn-sm">
                                        <Paperclip size={14} />
                                        {t.upload_file || 'Subir archivos'}
                                        <input
                                            type="file"
                                            multiple
                                            style={{ display: 'none' }}
                                            onChange={(e) => {
                                                const newFiles = Array.from(e.target.files || []);
                                                if (newFiles.length > 0) {
                                                    setForm((p) => ({ ...p, files: [...p.files, ...newFiles] }));
                                                }
                                            }}
                                        />
                                    </label>
                                </div>
                            </div>

                            {/* Moved to footer */}
                        </div>
                    ) : (
                        <>
                            <h3 className="detail-title">{order.titulo}</h3>
                            {order.descripcion && <p className="detail-desc">{order.descripcion}</p>}
                            <div className="detail-meta-grid">
                                <div className="detail-meta-item">
                                    <Tag size={14} />
                                    <span className="detail-meta-label">{t.priority_label}</span>
                                    <span className={`priority-badge ${PRIORITY_COLORS[order.prioridad]}`}>
                                        {(t as any)[`priority_${order.prioridad}`]}
                                    </span>
                                </div>
                                {order.ubicacion && (
                                    <div className="detail-meta-item">
                                        <MapPin size={14} />
                                        <span className="detail-meta-label">{t.location_label}</span>
                                        <span>{order.ubicacion}</span>
                                    </div>
                                )}
                                <div className="detail-meta-item">
                                    <Tag size={14} />
                                    <span className="detail-meta-label">{t.category_label}</span>
                                    <span>{(t as any)[`cat_${order.categoria}`] || CATEGORY_LABELS[order.categoria]}</span>
                                </div>
                                {order.asignadoA && (
                                    <div className="detail-meta-item">
                                        <User size={14} />
                                        <span className="detail-meta-label">{t.assigned_to}</span>
                                        <span>{order.asignadoA}</span>
                                    </div>
                                )}
                                <div className="detail-meta-item">
                                    <Calendar size={14} />
                                    <span className="detail-meta-label">{t.created_at}</span>
                                    <span>{fmt(order.creadoEn, lang)}</span>
                                </div>
                                <div className="detail-meta-item">
                                    <Clock size={14} />
                                    <span className="detail-meta-label">{t.updated_at}</span>
                                    <span>{fmt(order.actualizadoEn, lang)}</span>
                                </div>
                                {order.attachments && order.attachments.length > 0 && (
                                    <div className="detail-attachment-section" style={{ gridColumn: '1 / -1' }}>
                                        <div className="detail-meta-item">
                                            <Paperclip size={14} />
                                            <span className="detail-meta-label">{t.file} ({order.attachments.length})</span>
                                        </div>

                                        <div className="attachments-gallery">
                                            {order.attachments.map((att, i) => (
                                                <div key={i} className="attachment-item">
                                                    <div className="attachment-thumb-container">
                                                        {att.url.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                                                            <img
                                                                src={att.url}
                                                                alt={att.name}
                                                                className="attachment-thumb-img"
                                                                loading="lazy"
                                                            />
                                                        ) : (
                                                            <FileText size={48} className="attachment-file-icon" strokeWidth={1} />
                                                        )}
                                                    </div>

                                                    <div className="attachment-info">
                                                        <span className="attachment-name">{att.name}</span>
                                                        <div className="attachment-actions">
                                                            <a
                                                                href={att.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="btn btn-ghost btn-xs"
                                                                download={att.name}
                                                            >
                                                                {t.view_file}
                                                            </a>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    <div className="modal-footer" style={{ justifyContent: 'space-between', marginTop: '1.5rem' }}>
                        {editing ? (
                            <>
                                <button className="btn btn-ghost" onClick={() => setEditing(false)}>
                                    {t.cancel}
                                </button>

                                <button className="btn btn-danger" onClick={handleDelete} style={{ margin: '0 auto' }}>
                                    <Trash2 size={18} />
                                    {t.delete_order}
                                </button>

                                <button className="btn btn-primary" onClick={handleSave}>
                                    <Save size={18} />
                                    {t.save}
                                </button>
                            </>
                        ) : (
                            <>
                                <button className="btn btn-ghost" onClick={onClose}>
                                    {t.close}
                                </button>
                                <button className="btn btn-primary" onClick={() => setEditing(true)}>
                                    {t.edit}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
