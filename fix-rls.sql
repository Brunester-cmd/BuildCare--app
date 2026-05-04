-- 1. Create helper functions to bypass RLS and avoid infinite recursion
CREATE OR REPLACE FUNCTION public.get_auth_tenant_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER SET search_path = public
STABLE
AS $$
  SELECT tenant_id FROM profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER SET search_path = public
STABLE
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- 2. Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Tenants are viewable by users who belong to them" ON public.tenants;

DROP POLICY IF EXISTS "Users can view profiles in their tenant" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles in their tenant" ON public.profiles;

DROP POLICY IF EXISTS "Users can view work orders in their tenant" ON public.work_orders;
DROP POLICY IF EXISTS "Users can insert work orders in their tenant" ON public.work_orders;
DROP POLICY IF EXISTS "Users can update work orders in their tenant" ON public.work_orders;
DROP POLICY IF EXISTS "Users can delete work orders in their tenant" ON public.work_orders;

DROP POLICY IF EXISTS "Users can view work order history in their tenant" ON public.work_order_history;
DROP POLICY IF EXISTS "Users can insert work order history in their tenant" ON public.work_order_history;

-- 3. Recreate policies using the helper functions
CREATE POLICY "Tenants are viewable by users who belong to them" ON public.tenants
  FOR SELECT USING (
    id = public.get_auth_tenant_id()
    OR public.get_auth_role() = 'super_admin'
  );

CREATE POLICY "Users can view profiles in their tenant" ON public.profiles
  FOR SELECT USING (
    tenant_id = public.get_auth_tenant_id()
    OR public.get_auth_role() = 'super_admin'
  );

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admins can update profiles in their tenant" ON public.profiles
  FOR UPDATE USING (
    tenant_id = public.get_auth_tenant_id() 
    AND public.get_auth_role() IN ('admin', 'super_admin')
  );

CREATE POLICY "Users can view work orders in their tenant" ON public.work_orders
  FOR SELECT USING (
    tenant_id = public.get_auth_tenant_id()
  );

CREATE POLICY "Users can insert work orders in their tenant" ON public.work_orders
  FOR INSERT WITH CHECK (
    tenant_id = public.get_auth_tenant_id() OR public.get_auth_role() = 'super_admin'
  );

CREATE POLICY "Users can update work orders in their tenant" ON public.work_orders
  FOR UPDATE USING (
    tenant_id = public.get_auth_tenant_id()
  );

CREATE POLICY "Users can delete work orders in their tenant" ON public.work_orders
  FOR DELETE USING (
    tenant_id = public.get_auth_tenant_id()
  );

CREATE POLICY "Users can view work order history in their tenant" ON public.work_order_history
  FOR SELECT USING (
    tenant_id = public.get_auth_tenant_id()
  );

CREATE POLICY "Users can insert work order history in their tenant" ON public.work_order_history
  FOR INSERT WITH CHECK (
    tenant_id = public.get_auth_tenant_id() OR public.get_auth_role() = 'super_admin'
  );

-- 4. Update the trigger to give new users the default tenant
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, tenant_id)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    -- Asigna el tenant por defecto "Sistema Principal"
    '00000000-0000-0000-0000-000000000000'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Fix existing users with NULL tenant_id
UPDATE public.profiles 
SET tenant_id = '00000000-0000-0000-0000-000000000000' 
WHERE tenant_id IS NULL;
