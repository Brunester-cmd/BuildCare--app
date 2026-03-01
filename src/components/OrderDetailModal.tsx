import { useState } from 'react';
import {
    X, MapPin, User, Tag, Calendar, Clock, Save, Trash2,
    Play, Pause, CheckCircle,
} from 'lucide-react';
import { type WorkOrder, type Status, type Priority, type Category, PRIORITY_LABELS, CATEGORY_LABELS, PRIORITY_COLORS } from '../types';

interface OrderDetailModalProps {
    order: WorkOrder;
    onClose: () => void;
    onUpdate: (id: string, changes: Partial<WorkOrder>) => void;
    onDelete: (id: string) => void;
    onChangeStatus: (id: string, status: Status) => void;
}

function fmt(iso: string) {
    return new Date(iso).toLocaleString('es-AR', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

type StatusOption = { status: Status; label: string; icon: typeof Play; color: string };
const STATUS_OPTIONS: StatusOption[] = [
    { status: 'pendiente', label: 'Pendiente', icon: Play, color: 'status-chip--pendiente' },
    { status: 'en-pausa', label: 'En Pausa', icon: Pause, color: 'status-chip--pausa' },
    { status: 'completada', label: 'Completada', icon: CheckCircle, color: 'status-chip--completada' },
];

const PRIORITIES: Priority[] = ['baja', 'media', 'alta', 'urgente'];
const CATEGORIES = Object.keys(CATEGORY_LABELS) as Category[];

export default function OrderDetailModal({ order, onClose, onUpdate, onDelete, onChangeStatus }: OrderDetailModalProps) {
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({
        titulo: order.titulo,
        descripcion: order.descripcion,
        prioridad: order.prioridad,
        ubicacion: order.ubicacion,
        categoria: order.categoria,
        asignadoA: order.asignadoA,
    });

    function handleSave() {
        onUpdate(order.id, form);
        setEditing(false);
    }

    function handleDelete() {
        onDelete(order.id);
        onClose();
    }

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal modal--wide">
                <div className="modal-header">
                    <h2 className="modal-title">Detalle de Orden</h2>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {!editing ? (
                            <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>Editar</button>
                        ) : (
                            <>
                                <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>Cancelar</button>
                                <button className="btn btn-primary btn-sm" onClick={handleSave}>
                                    <Save size={14} /> Guardar
                                </button>
                            </>
                        )}
                        <button className="modal-close" onClick={onClose}><X size={18} /></button>
                    </div>
                </div>

                <div className="modal-body">
                    <div className="status-chips">
                        {STATUS_OPTIONS.map(({ status, label, icon: Icon, color }) => (
                            <button
                                key={status}
                                className={`status-chip ${color} ${order.estado === status ? 'status-chip--active' : ''}`}
                                onClick={() => onChangeStatus(order.id, status)}
                            >
                                <Icon size={13} />
                                {label}
                            </button>
                        ))}
                    </div>

                    {editing ? (
                        <>
                            <div className="form-group">
                                <label className="form-label">Título</label>
                                <input className="form-input" value={form.titulo}
                                    onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Descripción</label>
                                <textarea className="form-input form-textarea" value={form.descripcion}
                                    onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Prioridad</label>
                                <select className="form-input form-select" value={form.prioridad}
                                    onChange={(e) => setForm((p) => ({ ...p, prioridad: e.target.value as Priority }))}>
                                    {PRIORITIES.map((pr) => <option key={pr} value={pr}>{PRIORITY_LABELS[pr]}</option>)}
                                </select>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Ubicación</label>
                                    <input className="form-input" value={form.ubicacion}
                                        onChange={(e) => setForm((p) => ({ ...p, ubicacion: e.target.value }))} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Categoría</label>
                                    <select className="form-input form-select" value={form.categoria}
                                        onChange={(e) => setForm((p) => ({ ...p, categoria: e.target.value as Category }))}>
                                        {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Asignado a</label>
                                <input className="form-input" value={form.asignadoA}
                                    onChange={(e) => setForm((p) => ({ ...p, asignadoA: e.target.value }))} />
                            </div>
                        </>
                    ) : (
                        <>
                            <h3 className="detail-title">{order.titulo}</h3>
                            {order.descripcion && <p className="detail-desc">{order.descripcion}</p>}
                            <div className="detail-meta-grid">
                                <div className="detail-meta-item">
                                    <Tag size={14} />
                                    <span className="detail-meta-label">Prioridad</span>
                                    <span className={`priority-badge ${PRIORITY_COLORS[order.prioridad]}`}>
                                        {PRIORITY_LABELS[order.prioridad]}
                                    </span>
                                </div>
                                {order.ubicacion && (
                                    <div className="detail-meta-item">
                                        <MapPin size={14} />
                                        <span className="detail-meta-label">Ubicación</span>
                                        <span>{order.ubicacion}</span>
                                    </div>
                                )}
                                {order.asignadoA && (
                                    <div className="detail-meta-item">
                                        <User size={14} />
                                        <span className="detail-meta-label">Asignado a</span>
                                        <span>{order.asignadoA}</span>
                                    </div>
                                )}
                                <div className="detail-meta-item">
                                    <Tag size={14} />
                                    <span className="detail-meta-label">Categoría</span>
                                    <span>{CATEGORY_LABELS[order.categoria]}</span>
                                </div>
                                <div className="detail-meta-item">
                                    <Calendar size={14} />
                                    <span className="detail-meta-label">Creado</span>
                                    <span>{fmt(order.creadoEn)}</span>
                                </div>
                                <div className="detail-meta-item">
                                    <Clock size={14} />
                                    <span className="detail-meta-label">Actualizado</span>
                                    <span>{fmt(order.actualizadoEn)}</span>
                                </div>
                            </div>
                        </>
                    )}

                    <div className="modal-footer">
                        <button className="btn btn-danger" onClick={handleDelete}>
                            <Trash2 size={15} />
                            Eliminar Orden
                        </button>
                        <button className="btn btn-ghost" onClick={onClose}>Cerrar</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
