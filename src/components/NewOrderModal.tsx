import { useState } from 'react';
import { X, Save } from 'lucide-react';
import type { NewOrderData } from '../hooks/useWorkOrders';
import { type Priority, type Category, CATEGORY_LABELS } from '../types';

interface NewOrderModalProps {
    onClose: () => void;
    onCreate: (data: NewOrderData) => void;
}

const PRIORITIES: Priority[] = ['baja', 'media', 'alta', 'urgente'];
const PRIORITY_LABELS_LOCAL: Record<Priority, string> = {
    baja: 'Baja', media: 'Media', alta: 'Alta', urgente: 'Urgente',
};
const CATEGORIES = Object.keys(CATEGORY_LABELS) as Category[];

export default function NewOrderModal({ onClose, onCreate }: NewOrderModalProps) {
    const [form, setForm] = useState<NewOrderData>({
        titulo: '',
        descripcion: '',
        prioridad: 'media',
        ubicacion: '',
        categoria: 'otro',
        asignadoA: '',
    });
    const [titleError, setTitleError] = useState('');

    function set<K extends keyof NewOrderData>(field: K, value: NewOrderData[K]) {
        setForm((prev) => ({ ...prev, [field]: value }));
        if (field === 'titulo') setTitleError('');
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.titulo.trim()) { setTitleError('El título es requerido'); return; }
        onCreate(form);
        onClose();
    }

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal">
                <div className="modal-header">
                    <h2 className="modal-title">Nueva Orden de Trabajo</h2>
                    <button className="modal-close" onClick={onClose}><X size={18} /></button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="form-group">
                        <label className="form-label">Título *</label>
                        <input
                            className={`form-input ${titleError ? 'form-input--error' : ''}`}
                            placeholder="Ej: Reparación de iluminación en pasillo"
                            value={form.titulo}
                            onChange={(e) => set('titulo', e.target.value)}
                        />
                        {titleError && <span className="form-error">{titleError}</span>}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Descripción</label>
                        <textarea
                            className="form-input form-textarea"
                            placeholder="Describe el trabajo a realizar..."
                            value={form.descripcion}
                            onChange={(e) => set('descripcion', e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Prioridad</label>
                        <select
                            className="form-input form-select"
                            value={form.prioridad}
                            onChange={(e) => set('prioridad', e.target.value as Priority)}
                        >
                            {PRIORITIES.map((p) => (
                                <option key={p} value={p}>{PRIORITY_LABELS_LOCAL[p]}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Ubicación</label>
                            <input
                                className="form-input"
                                placeholder="Ej: Piso 3, Oficina 302"
                                value={form.ubicacion}
                                onChange={(e) => set('ubicacion', e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Categoría</label>
                            <select
                                className="form-input form-select"
                                value={form.categoria}
                                onChange={(e) => set('categoria', e.target.value as Category)}
                            >
                                {CATEGORIES.map((c) => (
                                    <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Asignado a</label>
                        <input
                            className="form-input"
                            placeholder="Nombre del técnico"
                            value={form.asignadoA}
                            onChange={(e) => set('asignadoA', e.target.value)}
                        />
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn btn-primary">
                            <Save size={16} />
                            Crear Orden
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
