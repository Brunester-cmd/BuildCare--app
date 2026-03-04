import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { showLocalNotification } from './usePushNotifications';
import { fetchApi } from '../lib/api';
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
function dbToLocal(row: Record<string, unknown>): WorkOrder {
    let attachments: { url: string; name: string }[] = [];
    try {
        const raw = row.attachments;
        if (typeof raw === 'string') attachments = JSON.parse(raw);
        else if (Array.isArray(raw)) attachments = raw;
    } catch { /* ignore */ }

    return {
        id: row.id as string,
        orderNumber: (row.order_number as number) ?? 0,
        titulo: row.titulo as string,
        descripcion: (row.descripcion as string) ?? '',
        prioridad: row.prioridad as Priority,
        ubicacion: (row.ubicacion as string) ?? '',
        categoria: row.categoria as Category,
        asignadoA: (row.asignado_a as string) ?? '',
        estado: row.deleted ? 'eliminada' : row.estado as Status,
        attachments: attachments.filter(a => a && a.url),
        fechaProgramada: row.fecha_programada as string | undefined,
        observaciones: row.observaciones as string | undefined,
        eliminadoEn: row.deleted_at as string | undefined,
        creadoEn: row.created_at as string,
        actualizadoEn: row.updated_at as string,
        tenant_id: row.tenant_id as string,
    };
}

function generateId() {
    return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
}

export function useWorkOrders() {
    const { profile, tenant } = useAuth();
    const [allOrders, setAllOrders] = useState<WorkOrder[]>([]);
    const [loading, setLoading] = useState(true);

    const tenantId = tenant?.id ?? profile?.tenant_id;

    // ── Load all orders from Worker API ───────────────────────
    const loadOrders = useCallback(async () => {
        if (!tenantId) { setLoading(false); return; }
        try {
            const data = await fetchApi<Record<string, unknown>[]>(`/orders?tenant_id=${tenantId}`);
            setAllOrders(data.map(dbToLocal));
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
        if (!tenantId || !profile?.id) return null;

        // Upload files to Worker (stub: no storage yet)
        const attachments: { url: string; name: string }[] = [];
        // TODO: implement file uploads via Cloudflare R2/Worker once configured

        const id = generateId();
        const orderNumber = allOrders.length > 0
            ? Math.max(...allOrders.map(o => o.orderNumber)) + 1
            : 1;

        try {
            const row = await fetchApi<Record<string, unknown>>('/orders', {
                method: 'POST',
                body: JSON.stringify({
                    id,
                    order_number: orderNumber,
                    tenant_id: tenantId,
                    created_by: profile.id,
                    titulo: data.titulo,
                    descripcion: data.descripcion,
                    prioridad: data.prioridad,
                    ubicacion: data.ubicacion,
                    categoria: data.categoria,
                    asignado_a: data.asignadoA,
                    estado: 'pendiente',
                    fecha_programada: data.fechaProgramada || null,
                    attachments: JSON.stringify(attachments),
                }),
            });

            const newOrder = dbToLocal(row);
            setAllOrders((prev) => [newOrder, ...prev]);
            void showLocalNotification("BuildCare – Nueva Orden", `📋 #${newOrder.orderNumber} ${newOrder.titulo}`);
            return newOrder;
        } catch (err) {
            console.error('useWorkOrders: createOrder error:', err);
            return null;
        }
    }, [tenantId, profile?.id, allOrders]);

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
            await fetchApi(`/orders/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ estado, ...(note ? { observaciones: note } : {}) }),
            });
        } catch (err) {
            console.error('useWorkOrders: changeStatus error:', err);
            // Revert optimistic update
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

        const dbChanges: Record<string, unknown> = {};
        if (changes.titulo !== undefined) dbChanges.titulo = changes.titulo;
        if (changes.descripcion !== undefined) dbChanges.descripcion = changes.descripcion;
        if (changes.prioridad !== undefined) dbChanges.prioridad = changes.prioridad;
        if (changes.ubicacion !== undefined) dbChanges.ubicacion = changes.ubicacion;
        if (changes.categoria !== undefined) dbChanges.categoria = changes.categoria;
        if (changes.asignadoA !== undefined) dbChanges.asignado_a = changes.asignadoA;
        if (changes.fechaProgramada !== undefined) dbChanges.fecha_programada = changes.fechaProgramada;
        if (changes.estado !== undefined) dbChanges.estado = changes.estado;
        dbChanges.attachments = JSON.stringify(finalAttachments);

        try {
            await fetchApi(`/orders/${id}`, { method: 'PUT', body: JSON.stringify(dbChanges) });
        } catch (err) {
            console.error('useWorkOrders: updateOrder error:', err);
        }
    }, [allOrders]);

    const deleteOrder = useCallback(async (id: string) => {
        setAllOrders((prev) =>
            prev.map((o) => o.id === id ? { ...o, estado: 'eliminada' as const, eliminadoEn: new Date().toISOString() } : o)
        );
        try {
            await fetchApi(`/orders/${id}`, { method: 'PUT', body: JSON.stringify({ deleted: true, deleted_at: new Date().toISOString() }) });
        } catch (err) {
            console.error('useWorkOrders: deleteOrder error:', err);
        }
    }, []);

    const restoreOrder = useCallback(async (id: string) => {
        setAllOrders((prev) =>
            prev.map((o) => o.id === id ? { ...o, estado: 'pendiente' as Status, eliminadoEn: undefined } : o)
        );
        try {
            await fetchApi(`/orders/${id}`, { method: 'PUT', body: JSON.stringify({ deleted: false, deleted_at: null, estado: 'pendiente' }) });
        } catch (err) {
            console.error('useWorkOrders: restoreOrder error:', err);
        }
    }, []);

    const permanentDelete = useCallback(async (id: string) => {
        setAllOrders((prev) => prev.filter((o) => o.id !== id));
        try {
            await fetchApi(`/orders/${id}`, { method: 'DELETE' });
        } catch (err) {
            console.error('useWorkOrders: permanentDelete error:', err);
        }
    }, []);

    // ── History query ─────────────────────────────────────────
    const loadHistory = useCallback(async (workOrderId?: string): Promise<WorkOrderHistory[]> => {
        if (!tenantId) return [];
        try {
            const url = workOrderId
                ? `/history?tenant_id=${tenantId}&work_order_id=${workOrderId}`
                : `/history?tenant_id=${tenantId}`;
            return await fetchApi<WorkOrderHistory[]>(url);
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
