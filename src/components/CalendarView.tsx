import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { WorkOrder } from '../types';
import DayOrdersModal from './DayOrdersModal';

interface CalendarViewProps {
    orders: WorkOrder[];
    onOrderClick?: (orderId: string) => void;
    onViewDay?: (date: Date) => void;
    onNewOrder?: (date: Date) => void;
}

export default function CalendarView({ orders, onOrderClick, onViewDay, onNewOrder }: CalendarViewProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState<{ date: Date; orders: WorkOrder[] } | null>(null);

    const { daysInMonth, firstDayOfMonth } = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        return {
            daysInMonth: new Date(year, month + 1, 0).getDate(),
            firstDayOfMonth: new Date(year, month, 1).getDay(),
        };
    }, [currentDate]);

    // Monday-first: if Sunday (0) → 6, otherwise subtract 1
    const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    const days = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const output: { date: Date | null; orders: WorkOrder[] }[] = [];

        for (let i = 0; i < adjustedFirstDay; i++) {
            output.push({ date: null, orders: [] });
        }
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i);
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const dStr = String(date.getDate()).padStart(2, '0');
            const dateString = `${y}-${m}-${dStr}`;

            const dayOrders = orders.filter(order => {
                const f = order.fechaProgramada;
                const c = order.creadoEn;
                const datePart = f ? f.split('T')[0] : c.split('T')[0];
                return datePart === dateString;
            });
            output.push({ date, orders: dayOrders });
        }

        // Pad to complete last row (always 7 cols)
        while (output.length % 7 !== 0) {
            output.push({ date: null, orders: [] });
        }

        return output;
    }, [currentDate, daysInMonth, adjustedFirstDay, orders]);

    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const goToday = () => setCurrentDate(new Date());

    const monthName = currentDate.toLocaleString('es-AR', { month: 'long' });
    const year = currentDate.getFullYear();
    const isCurrentMonth =
        new Date().getMonth() === currentDate.getMonth() &&
        new Date().getFullYear() === currentDate.getFullYear();

    const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    // Priority dot colors for mini indicators
    const PRIORITY_DOT_COLORS: Record<string, string> = {
        baja: '#22c55e',
        media: '#f59e0b',
        alta: '#f97316',
        urgente: '#ef4444',
    };

    function handleCellClick(cell: { date: Date | null; orders: WorkOrder[] }) {
        if (!cell.date) return;
        setSelectedDay({ date: cell.date, orders: cell.orders });
    }

    return (
        <div className="calendar-container">
            {/* Header */}
            <div className="calendar-header">
                <div className="calendar-nav">
                    <button className="icon-btn" onClick={prevMonth} title="Mes Anterior">
                        <ChevronLeft size={20} />
                    </button>
                    <h2 className="calendar-title">
                        {monthName.charAt(0).toUpperCase() + monthName.slice(1)} {year}
                    </h2>
                    <button className="icon-btn" onClick={nextMonth} title="Mes Próximo">
                        <ChevronRight size={20} />
                    </button>
                </div>
                {!isCurrentMonth && (
                    <button className="btn btn-ghost btn-sm" onClick={goToday}>
                        Hoy
                    </button>
                )}
            </div>

            {/* Grid */}
            <div className="calendar-grid-wrapper">
                {/* Day name headers */}
                <div className="calendar-day-headers">
                    {weekDays.map(day => (
                        <div key={day} className="calendar-day-name">{day}</div>
                    ))}
                </div>

                {/* Fixed-size 7-column grid */}
                <div className="calendar-grid">
                    {days.map((cell, idx) => {
                        const hasOrders = cell.orders.length > 0;

                        return (
                            <div
                                key={idx}
                                className={[
                                    'calendar-cell',
                                    !cell.date ? 'calendar-cell--empty' : '',
                                    cell.date && hasOrders ? 'calendar-cell--has-orders' : '',
                                    cell.date ? 'calendar-cell--clickable' : '',
                                ].join(' ')}
                                onClick={() => handleCellClick(cell)}
                            >
                                {cell.date && (
                                    <>
                                        <span className="calendar-date-number">
                                            {cell.date.getDate()}
                                        </span>

                                        {/* Priority color dots (max 3 dots, one per priority level) */}
                                        {hasOrders && (
                                            <div className="calendar-order-dots">
                                                {/* Show up to 4 unique priority dots */}
                                                {[...new Set(cell.orders.map(o => o.prioridad))].slice(0, 4).map(p => (
                                                    <span
                                                        key={p}
                                                        className="calendar-dot"
                                                        style={{ background: PRIORITY_DOT_COLORS[p] }}
                                                    />
                                                ))}
                                            </div>
                                        )}

                                        {/* Order count badge */}
                                        {hasOrders && (
                                            <span className="calendar-order-count">
                                                {cell.orders.length}
                                            </span>
                                        )}
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Day orders popup modal */}
            {
                selectedDay && (
                    <DayOrdersModal
                        date={selectedDay.date}
                        orders={selectedDay.orders}
                        onClose={() => setSelectedDay(null)}
                        onViewDay={(date) => {
                            setSelectedDay(null);
                            onViewDay?.(date);
                        }}
                        onOrderClick={(orderId) => {
                            setSelectedDay(null);
                            onOrderClick?.(orderId);
                        }}
                        onNewOrder={(date) => {
                            setSelectedDay(null);
                            onNewOrder?.(date);
                        }}
                    />
                )
            }
        </div >
    );
}
