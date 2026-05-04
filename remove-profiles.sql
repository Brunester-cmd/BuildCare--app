-- Script para eliminar la tabla perfiles y dependencias

-- Desactivar políticas RLS temporales en perfiles si es necesario
-- Ya que vamos a borrar la tabla, es mejor hacerlo directamente con cascade.

-- Eliminar tabla historial si aún existe (o referencias)
-- ALTER TABLE public.work_order_history DROP CONSTRAINT IF EXISTS work_order_history_user_id_fkey;

-- Borramos la tabla profiles (y cualquier trigger que dependa de ella)
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Eliminar triggers relacionados
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Informamos a las tablas de work_orders que created_by ahora dependerá directamente de auth.users
ALTER TABLE public.work_orders 
  DROP CONSTRAINT IF EXISTS work_orders_created_by_fkey;

-- Agregamos la FK directo a auth.users (si lo deseamos)
-- ALTER TABLE public.work_orders 
--  ADD CONSTRAINT work_orders_created_by_fkey foreign key (created_by) references auth.users(id) ON DELETE SET NULL;

-- Ya no tenemos tenants asociados a profiles, 
-- ahora tenant_id se maneja de forma independiente si hiciera falta.
-- Las políticas de RLS que dependían de perfiles causaron conflictos en el pasado;
-- al eliminar perfiles, debes rehacer tus políticas de work_orders si estaban basadas en get_auth_role().

-- Las funciones SECURITY DEFINER que creamos antes podemos quitarlas si ya no hay perfiles:
DROP FUNCTION IF EXISTS public.get_auth_tenant_id();
DROP FUNCTION IF EXISTS public.get_auth_role();

-- Eliminamos la política actual que falla (si hay de work_orders) 
-- y creamos una muy permisiva para los usuarios autenticados:
DROP POLICY IF EXISTS "Enable read access for all within tenant" ON public.work_orders;
DROP POLICY IF EXISTS "Enable insert access for all within tenant" ON public.work_orders;
DROP POLICY IF EXISTS "Enable update access for all within tenant" ON public.work_orders;

CREATE POLICY "Work orders access for authenticated users" 
ON public.work_orders FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Hacer lo mismo con tenants si existe una política estricta
DROP POLICY IF EXISTS "Enable read access to public" ON public.tenants;
CREATE POLICY "Tenants read access" ON public.tenants FOR SELECT USING (true);
