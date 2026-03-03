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

CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE RESTRICT,
  full_name text,
  avatar_url text,
  role user_role DEFAULT 'user'::user_role,
  status user_status DEFAULT 'pending'::user_status,
  push_subscription jsonb,
  push_enabled boolean DEFAULT false,
  language text DEFAULT 'es',
  theme text DEFAULT 'light',
  company_name text,
  email text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.work_orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number serial NOT NULL,
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
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
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_name text,
  event_type history_event_type NOT NULL,
  old_status text,
  new_status text,
  note text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS configuration
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_history ENABLE ROW LEVEL SECURITY;

-- Policies for tenants
CREATE POLICY "Tenants are viewable by users who belong to them" ON public.tenants
  FOR SELECT USING (
    id IN (SELECT tenant_id FROM public.profiles WHERE profiles.id = auth.uid())
    OR (SELECT role FROM public.profiles WHERE profiles.id = auth.uid()) = 'super_admin'
  );

-- Policies for profiles
CREATE POLICY "Users can view profiles in their tenant" ON public.profiles
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM public.profiles WHERE profiles.id = auth.uid())
    OR role = 'super_admin'
  );
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Admins can update profiles in their tenant" ON public.profiles
  FOR UPDATE USING (
    tenant_id IN (SELECT tenant_id FROM public.profiles WHERE profiles.id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Policies for work orders
CREATE POLICY "Users can view work orders in their tenant" ON public.work_orders
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM public.profiles WHERE profiles.id = auth.uid())
  );
CREATE POLICY "Users can insert work orders in their tenant" ON public.work_orders
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM public.profiles WHERE profiles.id = auth.uid())
  );
CREATE POLICY "Users can update work orders in their tenant" ON public.work_orders
  FOR UPDATE USING (
    tenant_id IN (SELECT tenant_id FROM public.profiles WHERE profiles.id = auth.uid())
  );
CREATE POLICY "Users can delete work orders in their tenant" ON public.work_orders
  FOR DELETE USING (
    tenant_id IN (SELECT tenant_id FROM public.profiles WHERE profiles.id = auth.uid())
  );

-- Policies for work order history
CREATE POLICY "Users can view work order history in their tenant" ON public.work_order_history
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM public.profiles WHERE profiles.id = auth.uid())
  );
CREATE POLICY "Users can insert work order history in their tenant" ON public.work_order_history
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM public.profiles WHERE profiles.id = auth.uid())
  );

-- Storage bucket for work order attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('work_order_attachments', 'work_order_attachments', true);
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'work_order_attachments');
CREATE POLICY "Upload Access" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'work_order_attachments');

-- Storage bucket for avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
CREATE POLICY "Avatars Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Avatars Upload Access" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call handle_new_user after insert on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Default initial data (optional but recommended to create super admin testing user or a default tenant)
INSERT INTO public.tenants (id, name, slug) VALUES ('00000000-0000-0000-0000-000000000000', 'Sistema Principal', 'sistema-principal');
