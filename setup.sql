-- Enums
CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'user');
CREATE TYPE user_status AS ENUM ('pending', 'active', 'suspended');
CREATE TYPE wo_status AS ENUM ('pendiente', 'en-pausa', 'completada');
CREATE TYPE wo_priority AS ENUM ('baja', 'media', 'alta', 'urgente');
CREATE TYPE wo_category AS ENUM (
  'electrico', 'plomeria', 'climatizacion', 'estructural',
  'pintura', 'carpinteria', 'limpieza', 'seguridad', 'informatica', 'otro'
);
CREATE TYPE history_event_type AS ENUM ('created', 'status_changed', 'updated', 'deleted', 'restored');

-- Tables
CREATE TABLE public.tenants (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  logo_url text,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.work_orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number serial NOT NULL,
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  titulo text NOT NULL,
  descripcion text,
  prioridad wo_priority DEFAULT 'media'::wo_priority,
  ubicacion text,
  categoria wo_category DEFAULT 'otro'::wo_category,
  asignado_a text,
  estado wo_status DEFAULT 'pendiente'::wo_status,
  file_url text,
  file_name text,
  attachments jsonb DEFAULT '[]'::jsonb,
  fecha_programada date,
  observaciones text,
  deleted boolean DEFAULT false,
  deleted_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.work_order_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  work_order_id uuid REFERENCES public.work_orders(id) ON DELETE CASCADE NOT NULL,
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name text,
  event_type history_event_type NOT NULL,
  old_status text,
  new_status text,
  note text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS configuration
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_history ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Tenants read access" ON public.tenants FOR SELECT USING (true);

-- Very permissive policies for authenticated users
CREATE POLICY "Work orders access for authenticated users" 
  ON public.work_orders FOR ALL 
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Work order history access for authenticated users" 
  ON public.work_order_history FOR ALL 
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Storage bucket for work order attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('work_order_attachments', 'work_order_attachments', true) ON CONFLICT DO NOTHING;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'work_order_attachments');
CREATE POLICY "Upload Access" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'work_order_attachments');

-- Storage bucket for avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;
CREATE POLICY "Avatars Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Avatars Upload Access" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');

-- Default initial data (optional but recommended to create a default tenant)
INSERT INTO public.tenants (id, name, slug) VALUES ('00000000-0000-0000-0000-000000000000', 'Sistema Principal', 'sistema-principal') ON CONFLICT DO NOTHING;
