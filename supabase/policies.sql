-- Políticas de Seguridad a Nivel de Fila (RLS) para Supabase

-- Función auxiliar para verificar si un usuario es administrador sin generar recursión infinita
create or replace function public.es_administrador(user_id uuid)
returns boolean
security definer
language plpgsql
as $$
begin
  return exists (
    select 1 from public.perfiles
    where id = user_id and rol = 'administrador'
  );
end;
$$;

-- 1. Políticas para la tabla "perfiles"
create policy "Usuarios autenticados pueden leer perfiles"
on public.perfiles for select
using (auth.role() = 'authenticated');

create policy "Usuarios pueden actualizar su propio perfil"
on public.perfiles for update
using (auth.uid() = id);

create policy "Administradores tienen control total de perfiles"
on public.perfiles for all
using ( public.es_administrador(auth.uid()) );


-- 2. Políticas para la tabla "metas_semanales"
create policy "Usuarios autenticados pueden ver metas"
on public.metas_semanales for select
using (auth.role() = 'authenticated');

create policy "Solo administradores pueden insertar metas"
on public.metas_semanales for insert
with check ( public.es_administrador(auth.uid()) );

create policy "Solo administradores pueden actualizar metas"
on public.metas_semanales for update
using ( public.es_administrador(auth.uid()) );

create policy "Solo administradores pueden borrar metas"
on public.metas_semanales for delete
using ( public.es_administrador(auth.uid()) );


-- 3. Políticas para la tabla "gastos_semanales"
create policy "Usuarios autenticados pueden ver gastos"
on public.gastos_semanales for select
using (auth.role() = 'authenticated');

create policy "Solo administradores pueden insertar gastos"
on public.gastos_semanales for insert
with check ( public.es_administrador(auth.uid()) );

create policy "Solo administradores pueden actualizar gastos"
on public.gastos_semanales for update
using ( public.es_administrador(auth.uid()) );

create policy "Solo administradores pueden borrar gastos"
on public.gastos_semanales for delete
using ( public.es_administrador(auth.uid()) );
