export type Status = 'pendiente' | 'en-pausa' | 'completada' | 'eliminada';
export type Priority = 'baja' | 'media' | 'alta' | 'urgente';
export type Category =
  | 'electrico'
  | 'plomeria'
  | 'climatizacion'
  | 'estructural'
  | 'pintura'
  | 'carpinteria'
  | 'limpieza'
  | 'seguridad'
  | 'otro';

export interface WorkOrder {
  id: string;
  titulo: string;
  descripcion: string;
  prioridad: Priority;
  ubicacion: string;
  categoria: Category;
  asignadoA: string;
  estado: Status;
  creadoEn: string;
  actualizadoEn: string;
  eliminadoEn?: string;
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
  urgente: 'Urgente',
};

export const CATEGORY_LABELS: Record<Category, string> = {
  electrico: 'Eléctrico',
  plomeria: 'Plomería',
  climatizacion: 'Climatización',
  estructural: 'Estructural',
  pintura: 'Pintura',
  carpinteria: 'Carpintería',
  limpieza: 'Limpieza',
  seguridad: 'Seguridad',
  otro: 'Otro',
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  baja: 'bg-green-100 text-green-700 border-green-200',
  media: 'bg-blue-100 text-blue-700 border-blue-200',
  alta: 'bg-orange-100 text-orange-700 border-orange-200',
  urgente: 'bg-red-100 text-red-700 border-red-200',
};
