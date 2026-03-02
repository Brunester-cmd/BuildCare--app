import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { showLocalNotification } from './usePushNotifications';
import type { WorkOrder, WorkOrderHistory, Status, Priority, Category, WoStatus, HistoryEventType } from '../types';

// ── Shape returned by this hook ───────────────────────────────
export interface NewOrderData {
    titulo: string;
    descripcion: string;
    prioridad: Priority;
    ubicacion: string;
    categoria: Category;
    asignadoA: string;
    files?: FileList | File[];
}

/** DB row → local WorkOrder */
function dbToLocal(row: Record<string, unknown>): WorkOrder {
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
        attachments: (row.attachments as any[])?.filter(a => a && a.url) ?? [],
        eliminadoEn: row.deleted_at as string | undefined,
        creadoEn: row.created_at as string,
        actualizadoEn: row.updated_at as string,
        tenant_id: row.tenant_id as string,
    };
}

/** Write a history event to Supabase */
async function writeHistory(
    workOrderId: string,
    tenantId: string,
    userId: string | undefined,
    userName: string | undefined,
    eventType: HistoryEventType,
    opts?: { oldStatus?: string; newStatus?: string; note?: string }
) {
    await supabase.from('work_order_history').insert({
        work_order_id: workOrderId,
        tenant_id: tenantId,
        user_id: userId ?? null,
        user_name: userName ?? null,
        event_type: eventType,
        old_status: opts?.oldStatus ?? null,
        new_status: opts?.newStatus ?? null,
        note: opts?.note ?? null,
    });
}

export function useWorkOrders() {
    const { profile, tenant } = useAuth();
    const [allOrders, setAllOrders] = useState<WorkOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

    const tenantId = tenant?.id ?? profile?.tenant_id;

    // ── Load all orders ───────────────────────────────────────
    const loadOrders = useCallback(async () => {
        if (!tenantId) { setLoading(false); return; }
        const { data, error } = await supabase
            .from('work_orders')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('order_number', { ascending: false });
        if (!error && data) setAllOrders(data.map(dbToLocal));
        setLoading(false);
    }, [tenantId]);

    useEffect(() => { void loadOrders(); }, [loadOrders]);

    // ── Realtime ─────────────────────────────────────────────
    useEffect(() => {
        if (!tenantId) return;
        if (channelRef.current) supabase.removeChannel(channelRef.current);

        const channel = supabase
            .channel(`work_orders:${tenantId}`)
            .on('postgres_changes', {
                event: '*', schema: 'public',
                table: 'work_orders',
                filter: `tenant_id=eq.${tenantId}`,
            }, async (payload) => {
                if (payload.eventType === 'INSERT') {
                    const newOrder = dbToLocal(payload.new as Record<string, unknown>);
                    setAllOrders((prev) => {
                        if (prev.find(o => o.id === newOrder.id)) return prev;
                        return [newOrder, ...prev];
                    });
                    if ((payload.new as any).created_by !== profile?.id) {
                        void showLocalNotification("BuildCare – Nueva Orden", `📋 #${newOrder.orderNumber} ${newOrder.titulo}`);
                    }
                } else if (payload.eventType === 'UPDATE') {
                    const updated = dbToLocal(payload.new as Record<string, unknown>);
                    setAllOrders((prev) => prev.map(o => o.id === updated.id ? updated : o));
                } else if (payload.eventType === 'DELETE') {
                    const id = (payload.old as any).id;
                    setAllOrders((prev) => prev.filter(o => o.id !== id));
                } else {
                    void loadOrders();
                }
            })
            .subscribe();

        channelRef.current = channel;
        return () => { supabase.removeChannel(channel); };
    }, [tenantId, profile?.id, loadOrders]);

    // ── Derived state ─────────────────────────────────────────
    const activeOrders = allOrders.filter((o) => o.estado !== 'eliminada');
    const deletedOrders = allOrders.filter((o) => o.estado === 'eliminada');
    const pendientes = activeOrders.filter((o) => o.estado === 'pendiente');
    const enPausa = activeOrders.filter((o) => o.estado === 'en-pausa');
    const completadas = activeOrders.filter((o) => o.estado === 'completada');

    // ── CRUD ─────────────────────────────────────────────────
    const createOrder = useCallback(async (data: NewOrderData): Promise<WorkOrder | null> => {
        if (!tenantId || !profile?.id) return null;

        const attachments: { url: string; name: string }[] = [];

        if (data.files && data.files.length > 0) {
            const fileList = Array.from(data.files);
            for (const file of fileList) {
                const fileExt = file.name.split('.').pop();
                const filePath = `${tenantId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('work_order_attachments')
                    .upload(filePath, file);

                if (!uploadError) {
                    const { data: { publicUrl } } = supabase.storage
                        .from('work_order_attachments')
                        .getPublicUrl(filePath);
                    attachments.push({ url: publicUrl, name: file.name });
                }
            }
        }

        const { data: row, error: insertError } = await supabase
            .from('work_orders')
            .insert({
                tenant_id: tenantId, created_by: profile.id,
                titulo: data.titulo, descripcion: data.descripcion,
                prioridad: data.prioridad, ubicacion: data.ubicacion,
                categoria: data.categoria, asignado_a: data.asignadoA,
                estado: 'pendiente' as WoStatus,
                attachments: attachments,
            })
            .select()
            .single();

        if (insertError) {
            console.error('Error inserting work order:', insertError);
            return null;
        }
        if (!row) return null;
        const newOrder = dbToLocal(row as Record<string, unknown>);

        // Manual state update for immediate UI feedback
        setAllOrders((prev) => [newOrder, ...prev]);

        // History
        void writeHistory(newOrder.id, tenantId, profile.id, profile.full_name ?? undefined, 'created', {
            newStatus: 'pendiente',
            note: `Orden #${newOrder.orderNumber} creada`,
        });
        return newOrder;
    }, [tenantId, profile?.id, profile?.full_name]);

    const changeStatus = useCallback(async (id: string, estado: Status) => {
        // Optimistic update — apply immediately so the UI reacts at once
        setAllOrders((prev) =>
            prev.map((o) => o.id === id ? { ...o, estado, actualizadoEn: new Date().toISOString() } : o)
        );
        const current = allOrders.find((o) => o.id === id);
        await supabase.from('work_orders').update({ estado: estado as WoStatus }).eq('id', id);
        // History
        if (tenantId && current) {
            void writeHistory(id, tenantId, profile?.id, profile?.full_name ?? undefined, 'status_changed', {
                oldStatus: current.estado,
                newStatus: estado,
            });
        }
    }, [allOrders, tenantId, profile?.id, profile?.full_name]);

    const updateOrder = useCallback(async (id: string, changes: Partial<WorkOrder> & { files?: FileList | File[] }) => {
        const currentOrder = allOrders.find(o => o.id === id);
        const justUploaded: { url: string; name: string }[] = [];

        if (changes.files && changes.files.length > 0) {
            const fileList = Array.from(changes.files);
            for (const file of fileList) {
                const fileExt = file.name.split('.').pop();
                const filePath = `${tenantId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('work_order_attachments')
                    .upload(filePath, file);

                if (!uploadError) {
                    const { data: { publicUrl } } = supabase.storage
                        .from('work_order_attachments')
                        .getPublicUrl(filePath);
                    justUploaded.push({ url: publicUrl, name: file.name });
                } else {
                    console.error('Error uploading file in updateOrder:', uploadError);
                }
            }
        }

        // Combine surviving existing attachments with the ones just uploaded
        const survivors = (changes as any).attachments || (currentOrder ? currentOrder.attachments : []);
        const finalAttachments = [...survivors, ...justUploaded];

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
        if (changes.estado !== undefined) dbChanges.estado = changes.estado;
        dbChanges.attachments = finalAttachments;

        if (Object.keys(dbChanges).length === 0) return;
        const { error: updateError } = await supabase.from('work_orders').update(dbChanges).eq('id', id);
        if (updateError) {
            console.error('Error updating work order in DB:', updateError);
        }

        if (tenantId) {
            void writeHistory(id, tenantId, profile?.id, profile?.full_name ?? undefined, 'updated');
        }
    }, [tenantId, profile?.id, profile?.full_name]);

    const deleteOrder = useCallback(async (id: string) => {
        setAllOrders((prev) =>
            prev.map((o) => o.id === id ? { ...o, estado: 'eliminada' as const, eliminadoEn: new Date().toISOString() } : o)
        );
        await supabase.from('work_orders')
            .update({ deleted: true, deleted_at: new Date().toISOString() }).eq('id', id);
        if (tenantId) {
            void writeHistory(id, tenantId, profile?.id, profile?.full_name ?? undefined, 'deleted');
        }
    }, [tenantId, profile?.id, profile?.full_name]);

    const restoreOrder = useCallback(async (id: string) => {
        setAllOrders((prev) =>
            prev.map((o) => o.id === id ? { ...o, estado: 'pendiente' as Status, eliminadoEn: undefined } : o)
        );
        await supabase.from('work_orders')
            .update({ deleted: false, deleted_at: null }).eq('id', id);
        if (tenantId) {
            void writeHistory(id, tenantId, profile?.id, profile?.full_name ?? undefined, 'restored');
        }
    }, [tenantId, profile?.id, profile?.full_name]);

    const permanentDelete = useCallback(async (id: string) => {
        setAllOrders((prev) => prev.filter((o) => o.id !== id));
        await supabase.from('work_orders').delete().eq('id', id);
    }, []);

    // ── History query ─────────────────────────────────────────
    const loadHistory = useCallback(async (workOrderId?: string) => {
        if (!tenantId) return [];
        let q = supabase
            .from('work_order_history')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false })
            .limit(100);
        if (workOrderId) q = q.eq('work_order_id', workOrderId);
        const { data } = await q;
        return (data ?? []) as WorkOrderHistory[];
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
