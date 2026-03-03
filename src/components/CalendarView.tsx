import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { WorkOrder } from '../types';
import { PRIORITY_COLORS } from '../types';

interface CalendarViewProps {
    orders: WorkOrder[];
    onDateClick?: (date: Date) => void;
    onOrderClick?: (orderId: string) => void;
}

export default function CalendarView({ orders, onDateClick, onOrderClick }: CalendarViewProps) {
    const [currentDate, setCurrentDate] = useState(new Date());

    const { daysInMonth, firstDayOfMonth } = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        return {
            daysInMonth: new Date(year, month + 1, 0).getDate(),
            firstDayOfMonth: new Date(year, month, 1).getDay(), // 0 = Sunday, 1 = Monday, etc.
        };
    }, [currentDate]);

    // Calendar logic: we want Monday to be the first day of the week, so adjust firstDayOfMonth
    // If it's 0 (Sunday), make it 6. Otherwise subtract 1.
    const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    const days = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const output = [];

        // Empty cells for the start of the week
        for (let i = 0; i < adjustedFirstDay; i++) {
            output.push({ date: null, orders: [] });
        }

        // Real days
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i);
            const dateString = date.toISOString().split('T')[0];

            // Orders matching this date (fechaProgramada takes precedence)
            const dayOrders = orders.filter(order => {
                const targetDate = order.fechaProgramada
                    ? new Date(order.fechaProgramada)
                    : new Date(order.creadoEn);
                return targetDate.toISOString().split('T')[0] === dateString;
            });

            output.push({ date, orders: dayOrders });
        }

        return output;
    }, [currentDate, daysInMonth, adjustedFirstDay, orders]);

    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const today = () => setCurrentDate(new Date());

    const monthName = currentDate.toLocaleString('default', { month: 'long' });
    const year = currentDate.getFullYear();
    const isCurrentMonth = new Date().getMonth() === currentDate.getMonth() && new Date().getFullYear() === currentDate.getFullYear();

    const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    return (
        <div className="calendar-container">
            <div className="calendar-header">
                <div className="calendar-nav">
                    <button className="icon-btn" onClick={prevMonth} title="Mes Anterior">
                        <ChevronLeft size={20} />
                    </button>
                    <h2 className="calendar-title">{monthName.charAt(0).toUpperCase() + monthName.slice(1)} {year}</h2>
                    <button className="icon-btn" onClick={nextMonth} title="Mes Próximo">
                        <ChevronRight size={20} />
                    </button>
                </div>
                {!isCurrentMonth && (
                    <button className="btn btn-ghost btn-sm" onClick={today}>
                        Hoy
                    </button>
                )}
            </div>

            <div className="calendar-grid-wrapper">
                <div className="calendar-day-headers">
                    {weekDays.map(day => (
                        <div key={day} className="calendar-day-name">{day}</div>
                    ))}
                </div>

                <div className="calendar-grid">
                    {days.map((cell, idx) => {
                        const isToday = cell.date &&
                            cell.date.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];

                        return (
                            <div
                                key={idx}
                                className={`calendar-cell ${!cell.date ? 'calendar-cell--empty' : ''} ${isToday ? 'calendar-cell--today' : ''}`}
                                onClick={() => cell.date && onDateClick?.(cell.date)}
                            >
                                {cell.date && (
                                    <div className="calendar-date-number">
                                        {cell.date.getDate()}
                                    </div>
                                )}
                                <div className="calendar-cell-orders">
                                    {cell.orders.map(order => (
                                        <div
                                            key={order.id}
                                            className="calendar-order-chip"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onOrderClick?.(order.id);
                                            }}
                                            title={order.titulo}
                                        >
                                            <div className={`calendar-order-color ${PRIORITY_COLORS[order.prioridad]}`}></div>
                                            <span className="calendar-order-text">#{order.orderNumber} {order.titulo}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
