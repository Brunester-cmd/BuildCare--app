import { useState, useEffect, useCallback } from 'react';
import { type WorkOrder, type Status, type Priority, type Category } from '../types';

const STORAGE_KEY = 'sgo_work_orders';
const RECYCLE_DAYS = 30;

function generateId(): string {
    return `wo_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function loadFromStorage(): WorkOrder[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveToStorage(orders: WorkOrder[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

export interface NewOrderData {
    titulo: string;
    descripcion: string;
    prioridad: Priority;
    ubicacion: string;
    categoria: Category;
    asignadoA: string;
}

export function useWorkOrders() {
    const [allOrders, setAllOrders] = useState<WorkOrder[]>(() => {
        const stored = loadFromStorage();
        // Auto-purge orders in recycle bin older than 30 days
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - RECYCLE_DAYS);
        return stored.filter((o) => {
            if (o.estado === 'eliminada' && o.eliminadoEn) {
                return new Date(o.eliminadoEn) > cutoff;
            }
            return true;
        });
    });

    useEffect(() => {
        saveToStorage(allOrders);
    }, [allOrders]);

    const activeOrders = allOrders.filter((o) => o.estado !== 'eliminada');
    const deletedOrders = allOrders.filter((o) => o.estado === 'eliminada');

    const pendientes = activeOrders.filter((o) => o.estado === 'pendiente');
    const enPausa = activeOrders.filter((o) => o.estado === 'en-pausa');
    const completadas = activeOrders.filter((o) => o.estado === 'completada');

    const createOrder = useCallback((data: NewOrderData) => {
        const now = new Date().toISOString();
        const newOrder: WorkOrder = {
            id: generateId(),
            ...data,
            estado: 'pendiente',
            creadoEn: now,
            actualizadoEn: now,
        };
        setAllOrders((prev) => [newOrder, ...prev]);
        return newOrder;
    }, []);

    const updateOrder = useCallback((id: string, changes: Partial<WorkOrder>) => {
        setAllOrders((prev) =>
            prev.map((o) =>
                o.id === id ? { ...o, ...changes, actualizadoEn: new Date().toISOString() } : o
            )
        );
    }, []);

    const changeStatus = useCallback((id: string, estado: Status) => {
        updateOrder(id, { estado });
    }, [updateOrder]);

    const deleteOrder = useCallback((id: string) => {
        setAllOrders((prev) =>
            prev.map((o) =>
                o.id === id
                    ? { ...o, estado: 'eliminada' as Status, eliminadoEn: new Date().toISOString(), actualizadoEn: new Date().toISOString() }
                    : o
            )
        );
    }, []);

    const restoreOrder = useCallback((id: string) => {
        setAllOrders((prev) =>
            prev.map((o) =>
                o.id === id
                    ? { ...o, estado: 'pendiente' as Status, eliminadoEn: undefined, actualizadoEn: new Date().toISOString() }
                    : o
            )
        );
    }, []);

    const permanentDelete = useCallback((id: string) => {
        setAllOrders((prev) => prev.filter((o) => o.id !== id));
    }, []);

    return {
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
    };
}
