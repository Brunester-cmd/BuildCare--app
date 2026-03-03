import { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';

interface DateInputProps {
    value: string; // YYYY-MM-DD
    onChange: (value: string) => void;
    className?: string;
    placeholder?: string;
}

export default function DateInput({ value, onChange, className, placeholder }: DateInputProps) {
    // Internal text state for typing (DD.MM.YYYY)
    const [text, setText] = useState('');
    const dateInputRef = useRef<HTMLInputElement>(null);

    // Update internal text when external value changes (e.g., from initialValue or save)
    useEffect(() => {
        if (value) {
            const [y, m, d] = value.split('-');
            if (y && m && d) {
                setText(`${d}.${m}.${y}`);
            }
        } else {
            setText('');
        }
    }, [value]);

    // Handle manual typing
    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setText(val);

        // Try to parse partial or full date
        // Supports DD.MM.YYYY, DD/MM/YYYY, DD-MM-YYYY
        const match = val.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
        if (match) {
            let [_, d, m, y] = match;
            d = d.padStart(2, '0');
            m = m.padStart(2, '0');
            const iso = `${y}-${m}-${d}`;
            // Simple validation before emitting
            const date = new Date(iso);
            if (!isNaN(date.getTime())) {
                onChange(iso);
            }
        } else if (val === '') {
            onChange('');
        }
    };

    // Handle native date picker selection
    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
    };

    return (
        <div className="input-icon-wrap">
            <CalendarIcon
                size={16}
                className="input-icon"
                style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                onClick={() => dateInputRef.current?.showPicker()}
            />
            <input
                type="text"
                className={`form-input form-input--icon ${className || ''}`}
                value={text}
                onChange={handleTextChange}
                placeholder={placeholder || 'DD.MM.YYYY'}
            />
            {/* Hidden native date input for the calendar picker */}
            <input
                ref={dateInputRef}
                type="date"
                style={{
                    position: 'absolute',
                    opacity: 0,
                    width: 0,
                    height: 0,
                    pointerEvents: 'none'
                }}
                value={value}
                onChange={handleDateChange}
                tabIndex={-1}
            />
        </div>
    );
}
