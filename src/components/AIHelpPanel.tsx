import { useState } from 'react';
import {
    Sparkles, Loader2, AlertTriangle, Lightbulb,
    Wrench, Clock, ShieldCheck, ChevronDown, ChevronUp,
    ListChecks, Package, X,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { WorkOrder } from '../types';

interface AIHelpResult {
    diagnostico: string;
    pasos: string[];
    materiales: string[];
    tiempoEstimado: string;
    seguridad: string[];
    consejo: string;
}

interface AIHelpPanelProps {
    order: WorkOrder;
}

export default function AIHelpPanel({ order }: AIHelpPanelProps) {
    const [result, setResult] = useState<AIHelpResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expanded, setExpanded] = useState(true);
    const [hasAsked, setHasAsked] = useState(false);

    async function fetchAIHelp() {
        setLoading(true);
        setError(null);
        setHasAsked(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            if (!token) {
                throw new Error('No estás autenticado');
            }

            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const response = await fetch(`${supabaseUrl}/functions/v1/ai-work-order-help`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    titulo: order.titulo,
                    descripcion: order.descripcion,
                    categoria: order.categoria,
                    prioridad: order.prioridad,
                    ubicacion: order.ubicacion,
                }),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || `Error ${response.status}`);
            }

            const data: AIHelpResult = await response.json();
            setResult(data);
        } catch (err: any) {
            console.error('AI Help error:', err);
            setError(err.message || 'No se pudo obtener la ayuda de IA');
        } finally {
            setLoading(false);
        }
    }

    // Initial state — show the button
    if (!hasAsked) {
        return (
            <div className="ai-help-trigger">
                <button className="ai-help-btn" onClick={fetchAIHelp}>
                    <span className="ai-help-btn-shimmer" />
                    <Sparkles size={16} />
                    <span>Asistente IA</span>
                </button>
            </div>
        );
    }

    // Loading state
    if (loading) {
        return (
            <div className="ai-help-panel ai-help-panel--loading">
                <div className="ai-help-loading">
                    <div className="ai-help-loading-icon">
                        <Loader2 size={24} className="spin" />
                    </div>
                    <div className="ai-help-loading-text">
                        <span>Analizando orden de trabajo</span>
                        <span className="ai-typing-dots">
                            <span>.</span><span>.</span><span>.</span>
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="ai-help-panel ai-help-panel--error">
                <div className="ai-help-error">
                    <AlertTriangle size={18} />
                    <span>{error}</span>
                    <button className="btn btn-ghost btn-sm" onClick={fetchAIHelp}>
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    // Result
    if (!result) return null;

    return (
        <div className="ai-help-panel">
            <div className="ai-help-header" onClick={() => setExpanded(!expanded)}>
                <div className="ai-help-header-left">
                    <Sparkles size={16} className="ai-help-icon" />
                    <span className="ai-help-title">Asistente IA</span>
                </div>
                <div className="ai-help-header-right">
                    <button
                        className="ai-help-refresh"
                        onClick={(e) => { e.stopPropagation(); fetchAIHelp(); }}
                        title="Regenerar"
                    >
                        <Loader2 size={14} />
                    </button>
                    <button
                        className="ai-help-close"
                        onClick={(e) => { e.stopPropagation(); setHasAsked(false); setResult(null); }}
                        title="Cerrar"
                    >
                        <X size={14} />
                    </button>
                    {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
            </div>

            {expanded && (
                <div className="ai-help-body">
                    {/* Diagnóstico */}
                    {result.diagnostico && (
                        <div className="ai-section ai-section--diagnostico">
                            <div className="ai-section-header">
                                <Lightbulb size={15} />
                                <span>Diagnóstico</span>
                            </div>
                            <p className="ai-section-text">{result.diagnostico}</p>
                        </div>
                    )}

                    {/* Pasos */}
                    {result.pasos && result.pasos.length > 0 && (
                        <div className="ai-section ai-section--pasos">
                            <div className="ai-section-header">
                                <ListChecks size={15} />
                                <span>Pasos Sugeridos</span>
                            </div>
                            <ol className="ai-steps-list">
                                {result.pasos.map((paso, i) => (
                                    <li key={i}>{paso}</li>
                                ))}
                            </ol>
                        </div>
                    )}

                    {/* Materiales & Tiempo */}
                    <div className="ai-section-row">
                        {result.materiales && result.materiales.length > 0 && (
                            <div className="ai-section ai-section--materiales">
                                <div className="ai-section-header">
                                    <Package size={15} />
                                    <span>Materiales</span>
                                </div>
                                <ul className="ai-materials-list">
                                    {result.materiales.map((mat, i) => (
                                        <li key={i}>{mat}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {result.tiempoEstimado && (
                            <div className="ai-section ai-section--tiempo">
                                <div className="ai-section-header">
                                    <Clock size={15} />
                                    <span>Tiempo Estimado</span>
                                </div>
                                <p className="ai-time-value">{result.tiempoEstimado}</p>
                            </div>
                        )}
                    </div>

                    {/* Seguridad */}
                    {result.seguridad && result.seguridad.length > 0 && (
                        <div className="ai-section ai-section--seguridad">
                            <div className="ai-section-header">
                                <ShieldCheck size={15} />
                                <span>Seguridad</span>
                            </div>
                            <ul className="ai-safety-list">
                                {result.seguridad.map((s, i) => (
                                    <li key={i}>{s}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Consejo */}
                    {result.consejo && (
                        <div className="ai-section ai-section--consejo">
                            <div className="ai-section-header">
                                <Wrench size={15} />
                                <span>Consejo Profesional</span>
                            </div>
                            <p className="ai-section-text">{result.consejo}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
