-- Políticas de Seguridad a Nivel de Fila (RLS) para Supabase

-- 1. Políticas para la tabla "perfiles"
create policy "Usuarios autenticados pueden leer perfiles"
on public.perfiles for select
using (auth.role() = 'authenticated');

create policy "Usuarios pueden actualizar su propio perfil"
on public.perfiles for update
using (auth.uid() = id);

create policy "Administradores tienen control total de perfiles"
on public.perfiles for all
using (
    exists (
        select 1 from public.perfiles
        where id = auth.uid() and rol = 'administrador'
    )
);


-- 2. Políticas para la tabla "metas_semanales"
create policy "Usuarios autenticados pueden ver metas"
on public.metas_semanales for select
using (auth.role() = 'authenticated');

create policy "Solo administradores pueden insertar metas"
on public.metas_semanales for insert
with check (
    exists (
        select 1 from public.perfiles
        where id = auth.uid() and rol = 'administrador'
    )
);

create policy "Solo administradores pueden actualizar metas"
on public.metas_semanales for update
using (
    exists (
        select 1 from public.perfiles
        where id = auth.uid() and rol = 'administrador'
    )
);

create policy "Solo administradores pueden borrar metas"
on public.metas_semanales for delete
using (
    exists (
        select 1 from public.perfiles
        where id = auth.uid() and rol = 'administrador'
    )
);


-- 3. Políticas para la tabla "gastos_semanales"
create policy "Usuarios autenticados pueden ver gastos"
on public.gastos_semanales for select
using (auth.role() = 'authenticated');

create policy "Solo administradores pueden insertar gastos"
on public.gastos_semanales for insert
with check (
    exists (
        select 1 from public.perfiles
        where id = auth.uid() and rol = 'administrador'
    )
);

create policy "Solo administradores pueden actualizar gastos"
on public.gastos_semanales for update
using (
    exists (
        select 1 from public.perfiles
        where id = auth.uid() and rol = 'administrador'
    )
);

create policy "Solo administradores pueden borrar gastos"
on public.gastos_semanales for delete
using (
    exists (
        select 1 from public.perfiles
        where id = auth.uid() and rol = 'administrador'
    )
);
