import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { showLocalNotification } from './usePushNotifications';
import type { WorkOrder, WorkOrderHistory, Status, Priority, Category } from '../types';

// ── Shape returned by this hook ───────────────────────────────
export interface NewOrderData {
    titulo: string;
    descripcion: string;
    prioridad: Priority;
    ubicacion: string;
    categoria: Category;
    asignadoA: string;
    fechaProgramada?: string;
    files?: FileList | File[];
}

/** DB row → local WorkOrder */
function dbToWorkOrder(row: any): WorkOrder {
    let attachments: { url: string; name: string }[] = [];
    try {
        const raw = row.attachments;
        if (typeof raw === 'string') attachments = JSON.parse(raw);
        else if (Array.isArray(raw)) attachments = raw;
    } catch { /* ignore */ }

    return {
        id: row.id,
        orderNumber: row.order_number ?? 0,
        titulo: row.titulo,
        descripcion: row.descripcion ?? '',
        prioridad: row.prioridad,
        ubicacion: row.ubicacion ?? '',
        categoria: row.categoria,
        asignadoA: row.asignado_a ?? '',
        estado: row.deleted ? 'eliminada' : row.estado,
        attachments: attachments.filter(a => a && a.url),
        fechaProgramada: row.fecha_programada,
        observaciones: row.observaciones,
        eliminadoEn: row.deleted_at,
        creadoEn: row.created_at,
        actualizadoEn: row.updated_at,
        tenant_id: row.tenant_id,
    };
}

export function useWorkOrders() {
    const { profile, tenant } = useAuth();
    const [allOrders, setAllOrders] = useState<WorkOrder[]>([]);
    const [loading, setLoading] = useState(true);

    const tenantId = tenant?.id ?? profile?.tenant_id;

    // ── Load all orders from Supabase ───────────────────────
    const loadOrders = useCallback(async () => {
        const effectiveTenantId = tenantId || '00000000-0000-0000-0000-000000000000';
        try {
            const { data, error } = await supabase
                .from('work_orders')
                .select('*')
                .eq('tenant_id', effectiveTenantId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setAllOrders(data.map(dbToWorkOrder));
        } catch (err) {
            console.error('useWorkOrders: loadOrders error:', err);
            setAllOrders([]);
        } finally {
            setLoading(false);
        }
    }, [tenantId]);

    useEffect(() => { void loadOrders(); }, [loadOrders]);

    // ── Derived state ─────────────────────────────────────────
    const activeOrders = allOrders.filter((o) => o.estado !== 'eliminada');
    const deletedOrders = allOrders.filter((o) => o.estado === 'eliminada');
    const pendientes = activeOrders.filter((o) => o.estado === 'pendiente');
    const enPausa = activeOrders.filter((o) => o.estado === 'en-pausa');
    const completadas = activeOrders.filter((o) => o.estado === 'completada');

    // ── CRUD ─────────────────────────────────────────────────
    const createOrder = useCallback(async (data: NewOrderData): Promise<WorkOrder | null> => {
        const effectiveTenantId = tenantId || '00000000-0000-0000-0000-000000000000';
        const effectiveProfileId = profile?.id || null;

        const attachments: { url: string; name: string }[] = [];
        // TODO: implement file uploads to Supabase Storage if needed

        try {
            const { data: newRow, error } = await supabase
                .from('work_orders')
                .insert([{
                    tenant_id: effectiveTenantId,
                    created_by: effectiveProfileId,
                    titulo: data.titulo,
                    descripcion: data.descripcion,
                    prioridad: data.prioridad,
                    ubicacion: data.ubicacion,
                    categoria: data.categoria,
                    asignado_a: data.asignadoA,
                    estado: 'pendiente',
                    fecha_programada: data.fechaProgramada || null,
                    attachments: attachments.length > 0 ? attachments : null,
                }])
                .select()
                .single();

            if (error) throw error;

            const newOrder = dbToWorkOrder(newRow);
            setAllOrders((prev) => [newOrder, ...prev]);
            void showLocalNotification("BuildCare – Nueva Orden", `📋 #${newOrder.orderNumber} ${newOrder.titulo}`);
            return newOrder;
        } catch (err) {
            console.error('useWorkOrders: createOrder error:', err);
            return null;
        }
    }, [tenantId, profile?.id]);

    const changeStatus = useCallback(async (id: string, estado: Status, note?: string) => {
        const current = allOrders.find((o) => o.id === id);
        // Optimistic update
        setAllOrders((prev) =>
            prev.map((o) => o.id === id ? {
                ...o,
                estado,
                observaciones: note ?? o.observaciones,
                actualizadoEn: new Date().toISOString()
            } : o)
        );

        try {
            const { error } = await supabase
                .from('work_orders')
                .update({
                    estado,
                    ...(note ? { observaciones: note } : {}),
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;
        } catch (err) {
            console.error('useWorkOrders: changeStatus error:', err);
            if (current) {
                setAllOrders((prev) => prev.map((o) => o.id === id ? current : o));
            }
        }
    }, [allOrders]);

    const updateOrder = useCallback(async (id: string, changes: Partial<WorkOrder> & { files?: FileList | File[] }) => {
        const currentOrder = allOrders.find(o => o.id === id);
        const survivors = (changes as any).attachments || (currentOrder ? currentOrder.attachments : []);
        const finalAttachments = [...survivors];

        // Optimistic update
        setAllOrders((prev) =>
            prev.map((o) => o.id === id ? {
                ...o,
                ...changes,
                attachments: finalAttachments,
                actualizadoEn: new Date().toISOString()
            } : o)
        );

        const dbChanges: any = {};
        if (changes.titulo !== undefined) dbChanges.titulo = changes.titulo;
        if (changes.descripcion !== undefined) dbChanges.descripcion = changes.descripcion;
        if (changes.prioridad !== undefined) dbChanges.prioridad = changes.prioridad;
        if (changes.ubicacion !== undefined) dbChanges.ubicacion = changes.ubicacion;
        if (changes.categoria !== undefined) dbChanges.categoria = changes.categoria;
        if (changes.asignadoA !== undefined) dbChanges.asignado_a = changes.asignadoA;
        if (changes.fechaProgramada !== undefined) dbChanges.fecha_programada = changes.fechaProgramada;
        if (changes.estado !== undefined) dbChanges.estado = changes.estado;
        dbChanges.attachments = finalAttachments.length > 0 ? finalAttachments : null;
        dbChanges.updated_at = new Date().toISOString();

        try {
            const { error } = await supabase.from('work_orders').update(dbChanges).eq('id', id);
            if (error) throw error;
        } catch (err) {
            console.error('useWorkOrders: updateOrder error:', err);
        }
    }, [allOrders]);

    const deleteOrder = useCallback(async (id: string) => {
        setAllOrders((prev) =>
            prev.map((o) => o.id === id ? { ...o, estado: 'eliminada' as const, eliminadoEn: new Date().toISOString() } : o)
        );
        try {
            const { error } = await supabase
                .from('work_orders')
                .update({
                    deleted: true,
                    deleted_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);
            if (error) throw error;
        } catch (err) {
            console.error('useWorkOrders: deleteOrder error:', err);
        }
    }, []);

    const restoreOrder = useCallback(async (id: string) => {
        setAllOrders((prev) =>
            prev.map((o) => o.id === id ? { ...o, estado: 'pendiente' as Status, eliminadoEn: undefined } : o)
        );
        try {
            const { error } = await supabase
                .from('work_orders')
                .update({
                    deleted: false,
                    deleted_at: null,
                    estado: 'pendiente',
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);
            if (error) throw error;
        } catch (err) {
            console.error('useWorkOrders: restoreOrder error:', err);
        }
    }, []);

    const permanentDelete = useCallback(async (id: string) => {
        setAllOrders((prev) => prev.filter((o) => o.id !== id));
        try {
            const { error } = await supabase.from('work_orders').delete().eq('id', id);
            if (error) throw error;
        } catch (err) {
            console.error('useWorkOrders: permanentDelete error:', err);
        }
    }, []);

    const loadHistory = useCallback(async (workOrderId?: string): Promise<WorkOrderHistory[]> => {
        const effectiveTenantId = tenantId || '00000000-0000-0000-0000-000000000000';
        try {
            let query = supabase
                .from('work_order_history')
                .select('*')
                .eq('tenant_id', effectiveTenantId)
                .order('created_at', { ascending: false });

            if (workOrderId) {
                query = query.eq('work_order_id', workOrderId);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data as WorkOrderHistory[];
        } catch (err) {
            console.error('useWorkOrders: loadHistory error:', err);
            return [];
        }
    }, [tenantId]);

    return {
        loading,
        allOrders,
        activeOrders,
        deletedOrders,
        pendientes,
        enPausa,
        completadas,
        createOrder,
        updateOrder,
        changeStatus,
        deleteOrder,
        restoreOrder,
        permanentDelete,
        loadHistory,
    };
}
