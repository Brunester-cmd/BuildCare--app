import { useState, useRef, useEffect } from 'react';
import { X, Save, Paperclip, FileText, User } from 'lucide-react';
import type { NewOrderData } from '../hooks/useWorkOrders';
import { type Priority, type Category, CATEGORY_LABELS, type Profile } from '../types';
import { useI18n } from '../hooks/useI18n';
import { useAuth } from '../contexts/AuthContext';
import DateInput from './DateInput';

interface NewOrderModalProps {
    onClose: () => void;
    onCreate: (data: NewOrderData) => Promise<unknown>;
    initialDate?: Date;
    members?: Profile[];
}

const PRIORITIES: Priority[] = ['baja', 'media', 'alta', 'urgente'];
const CATEGORIES = Object.keys(CATEGORY_LABELS) as Category[];

export default function NewOrderModal({ onClose, onCreate, initialDate, members = [] }: NewOrderModalProps) {
    const { t } = useI18n();
    const { profile, tenant, refreshProfile } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        console.log('NewOrderModal: mounted. initialDate:', initialDate);
        void refreshProfile();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const [form, setForm] = useState<NewOrderData>(() => {
        let initialFecha = '';
        if (initialDate) {
            const y = initialDate.getFullYear();
            const m = String(initialDate.getMonth() + 1).padStart(2, '0');
            const dStr = String(initialDate.getDate()).padStart(2, '0');
            initialFecha = `${y}-${m}-${dStr}`;
        }
        return {
            titulo: '',
            descripcion: '',
            prioridad: 'media',
            ubicacion: '',
            categoria: 'otro',
            asignadoA: '',
            fechaProgramada: initialFecha,
            files: [],
        };
    });
    const [titleError, setTitleError] = useState('');
    const [submitError, setSubmitError] = useState('');
    const [saving, setSaving] = useState(false);

    function set<K extends keyof NewOrderData>(field: K, value: NewOrderData[K]) {
        setForm((prev) => ({ ...prev, [field]: value }));
        if (field === 'titulo') setTitleError('');
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        if (selectedFiles.length > 0) {
            set('files', [...(form.files || []), ...selectedFiles]);
        }
    };

    const removeFile = (index: number) => {
        const newFiles = [...(form.files || [])];
        newFiles.splice(index, 1);
        set('files', newFiles);
        if (newFiles.length === 0 && fileInputRef.current) fileInputRef.current.value = '';
    };

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.titulo.trim()) { setTitleError(t.required_title); return; }

        const tenantId = tenant?.id || profile?.tenant_id || '00000000-0000-0000-0000-000000000000';
        if (!tenantId) {
            setSubmitError(t.error_missing_tenant);
            return;
        }

        setSaving(true);
        console.log('Attempting to create order with data:', form);
        try {
            const result = await onCreate(form);
            console.log('Order creation result:', result);
            if (!result) {
                console.warn('onCreate returned null');
                setSubmitError(t.error_creating_order || 'Error al crear la orden. Verificá tu conexión o permisos.');
                return;
            }
            onClose();
        } catch (err) {
            console.error('Error creating order:', err);
            setSubmitError(t.error_creating_order || 'Error al crear la orden.');
        } finally {
            setSaving(false);
        }
    }


    return (
        <div className="modal-overlay">
            <div className="modal">
                <div className="modal-header">
                    <h2 className="modal-title">{initialDate ? 'Agendar Orden' : t.new_order_title}</h2>
                    <button className="modal-close" onClick={onClose}><X size={18} /></button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    {submitError && <div className="form-error-banner">{submitError}</div>}
                    <div className="form-group">
                        <label className="form-label">{t.title_label} *</label>
                        <input
                            className={`form-input ${titleError ? 'form-input--error' : ''}`}
                            placeholder={t.title_placeholder}
                            value={form.titulo}
                            onChange={(e) => set('titulo', e.target.value)}
                            spellCheck={false}
                            autoCorrect="off"
                        />
                        {titleError && <span className="form-error">{titleError}</span>}
                    </div>


                    <div className="form-group">
                        <label className="form-label">{t.description_label}</label>
                        <textarea
                            className="form-input form-textarea"
                            placeholder={t.description_placeholder}
                            value={form.descripcion}
                            onChange={(e) => set('descripcion', e.target.value)}
                            spellCheck={false}
                            autoCorrect="off"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">{t.priority_label}</label>
                        <select
                            className="form-input form-select"
                            value={form.prioridad}
                            onChange={(e) => set('prioridad', e.target.value as Priority)}
                        >
                            {PRIORITIES.map((p) => (
                                <option key={p} value={p}>{t[`priority_${p}`]}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">{t.location_label}</label>
                        <input
                            className="form-input"
                            placeholder={t.location_placeholder}
                            value={form.ubicacion}
                            onChange={(e) => set('ubicacion', e.target.value)}
                            spellCheck={false}
                            autoCorrect="off"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">{t.category_label}</label>
                        <select
                            className="form-input form-select"
                            value={form.categoria}
                            onChange={(e) => set('categoria', e.target.value as Category)}
                        >
                            {CATEGORIES.map((c) => (
                                <option key={c} value={c}>{t[`cat_${c}`] || CATEGORY_LABELS[c]}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">{t.assigned_to}</label>
                        <div className="input-icon-wrap" style={{ marginBottom: '0.5rem' }}>
                            <User size={16} className="input-icon" />
                            <select
                                className="form-input form-input--icon form-select"
                                value={""}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (!val) return;
                                    const current = form.asignadoA ? form.asignadoA.split(', ').filter(Boolean) : [];
                                    if (!current.includes(val)) {
                                        set('asignadoA', [...current, val].join(', '));
                                    }
                                }}
                                disabled={false}
                            >
                                <option value="">{t.select_assignee || 'Seleccionar operario'}</option>
                                {members.map((m) => {
                                    const name = m.full_name || m.email;
                                    return (
                                        <option key={m.id} value={name}>
                                            {name}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                        {form.asignadoA && (
                            <div className="edit-attachments-list">
                                {form.asignadoA.split(', ').filter(Boolean).map((assignee, i) => (
                                    <div key={i} className="selected-file-badge" style={{ marginBottom: '0.4rem', background: 'var(--slate-100)', color: 'var(--slate-700)', borderColor: 'var(--slate-200)' }}>
                                        <User size={14} />
                                        <span className="file-name-text">{assignee}</span>
                                        <button
                                            type="button"
                                            className="file-remove-btn"
                                            onClick={() => {
                                                const current = form.asignadoA!.split(', ').filter(Boolean);
                                                set('asignadoA', current.filter(a => a !== assignee).join(', '));
                                            }}
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Fecha Programada (Opcional)</label>
                        <DateInput
                            value={form.fechaProgramada || ''}
                            onChange={(val) => set('fechaProgramada', val)}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">{t.attach_file}</label>
                        <div className="file-upload-container">
                            <input
                                type="file"
                                multiple
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                            />

                            <button
                                type="button"
                                className="btn btn-ghost btn-attach"
                                onClick={() => fileInputRef.current?.click()}
                                style={{ marginBottom: '0.5rem' }}
                            >
                                <Paperclip size={16} />
                                {t.select_file}
                            </button>

                            {form.files && form.files.length > 0 && (
                                <div className="edit-attachments-list" style={{ marginTop: '0.5rem' }}>
                                    {Array.from(form.files).map((file, i) => (
                                        <div key={i} className="selected-file-badge" style={{ marginBottom: '0.4rem' }}>
                                            <FileText size={14} />
                                            <span className="file-name-text">{file.name}</span>
                                            <button type="button" className="file-remove-btn" onClick={() => removeFile(i)}>
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="modal-footer modal-footer--space">
                        <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>{t.cancel}</button>
                        <div /> {/* Spacer for centering */}
                        <button type="submit" className="btn btn-primary btn-glow" disabled={saving}>
                            {saving ? <span className="btn-spinner" /> : <Save size={16} />}
                            {saving ? t.saving : t.create_order}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

