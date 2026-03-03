// Database types matching Supabase schema
export type UserRole = 'super_admin' | 'admin' | 'user';
export type UserStatus = 'pending' | 'active' | 'suspended';
export type WoStatus = 'pendiente' | 'en-pausa' | 'completada';
export type WoPriority = 'baja' | 'media' | 'alta' | 'urgente';
export type WoCategory =
  | 'electrico' | 'plomeria' | 'climatizacion' | 'estructural'
  | 'pintura' | 'carpinteria' | 'limpieza' | 'seguridad' | 'informatica' | 'otro';

// ── Backward-compatible aliases used by UI components ──────────
export type Status = WoStatus;
export type Priority = WoPriority;
export type Category = WoCategory;

// ── Supabase types ─────────────────────────────────────────────
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  active: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  tenant_id: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  status: UserStatus;
  push_subscription: object | null;
  push_enabled: boolean;
  language: string;
  theme?: string;
  company_name: string | null;
  email?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkOrderDB {
  id: string;
  order_number: number;
  tenant_id: string;
  created_by: string | null;
  titulo: string;
  descripcion: string;
  prioridad: WoPriority;
  ubicacion: string;
  categoria: WoCategory;
  asignado_a: string;
  estado: WoStatus;
  file_url: string | null;
  file_name: string | null;
  attachments: Attachment[] | null;
  fecha_programada: string | null;
  deleted: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Attachment {
  url: string;
  name: string;
}

// ── Local WorkOrder (Supabase hook) ────────────────────────────
export interface WorkOrder {
  id: string;
  orderNumber: number;
  titulo: string;
  descripcion: string;
  prioridad: Priority;
  ubicacion: string;
  categoria: Category;
  asignadoA: string;
  estado: Status | 'eliminada';
  attachments: Attachment[];
  fechaProgramada?: string;
  eliminadoEn?: string;
  creadoEn: string;
  actualizadoEn: string;
  tenant_id?: string;
}


// ── History ────────────────────────────────────────────────────
export type HistoryEventType = 'created' | 'status_changed' | 'updated' | 'deleted' | 'restored';

export interface WorkOrderHistory {
  id: string;
  work_order_id: string;
  tenant_id: string;
  user_id: string | null;
  user_name: string | null;
  event_type: HistoryEventType;
  old_status: string | null;
  new_status: string | null;
  note: string | null;
  created_at: string;
}


// ── Display constants ──────────────────────────────────────────
export const PRIORITY_LABELS: Record<WoPriority, string> = {
  baja: 'Baja', media: 'Media', alta: 'Alta', urgente: 'Urgente',
};
export const PRIORITY_COLORS: Record<WoPriority, string> = {
  baja: 'priority-badge--baja',
  media: 'priority-badge--media',
  alta: 'priority-badge--alta',
  urgente: 'priority-badge--urgente',
};
export const CATEGORY_LABELS: Record<WoCategory, string> = {
  electrico: 'Eléctrico',
  plomeria: 'Plomería',
  climatizacion: 'Climatización',
  estructural: 'Estructural',
  pintura: 'Pintura',
  carpinteria: 'Carpintería',
  limpieza: 'Limpieza',
  seguridad: 'Seguridad',
  informatica: 'Informática',
  otro: 'Otro',
};
