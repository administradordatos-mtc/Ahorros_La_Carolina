-- SQL Migration: Restructure to monthly execution tracking per initiative

-- 1. Create table iniciativas_ejecucion
create table if not exists public.iniciativas_ejecucion (
    id uuid default gen_random_uuid() primary key,
    iniciativa_id uuid references public.iniciativas(id) on delete cascade not null,
    mes integer not null check (mes between 1 and 12),
    anio integer not null check (anio >= 2020),
    ahorro_real_ejecutado numeric(15, 2) not null check (ahorro_real_ejecutado >= 0) default 0,
    estado_pipeline text not null check (estado_pipeline in ('Pendiente', 'En Revisión', 'Validado', 'Observado')) default 'Pendiente',
    observaciones text,
    validado_por uuid references auth.users(id) on delete set null,
    fecha_validacion timestamp with time zone default timezone('utc'::text, now()),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    constraint unique_iniciativa_mes_anio unique (iniciativa_id, mes, anio)
);

-- 2. Enable Row Level Security (RLS)
alter table public.iniciativas_ejecucion enable row level security;

-- 3. Drop existing policies if they exist (to ensure clean migration)
drop policy if exists "Usuarios autenticados pueden ver ejecuciones" on public.iniciativas_ejecucion;
drop policy if exists "Solo admin y control interno pueden modificar ejecuciones" on public.iniciativas_ejecucion;

-- 4. Create RLS Policies
create policy "Usuarios autenticados pueden ver ejecuciones"
on public.iniciativas_ejecucion for select
using (auth.role() = 'authenticated');

create policy "Solo admin y control interno pueden modificar ejecuciones"
on public.iniciativas_ejecucion for all
using ( public.es_control_interno_o_admin(auth.uid()) );

-- 5. Clean up old tables
drop table if exists public.validaciones_ahorros cascade;
drop table if exists public.metas_mensuales cascade;
