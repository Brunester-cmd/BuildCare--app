import { type LucideIcon } from 'lucide-react';

interface StatusCardProps {
    label: string;
    count: number;
    icon: LucideIcon;
    isActive: boolean;
    onClick: () => void;
    colorClass: string;
}

export default function StatusCard({ label, count, icon: Icon, isActive, onClick, colorClass }: StatusCardProps) {
    return (
        <button onClick={onClick} className={`status-card ${isActive ? 'status-card--active' : ''}`}>
            <div className={`status-icon ${colorClass}`}>
                <Icon size={18} strokeWidth={2} />
            </div>
            <div className="status-info">
                <span className="status-count">{count}</span>
                <span className="status-label">{label}</span>
            </div>
        </button>
    );
}
