-- 1. Crear tabla de Conceptos Presupuestales (Maestro de Conceptos)
create table if not exists public.conceptos (
    id serial primary key,
    nombre text not null unique,
    descripcion text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS para Conceptos
alter table public.conceptos enable row level security;

-- Insertar conceptos iniciales por defecto
insert into public.conceptos (nombre, descripcion) values
('Combustible', 'Gastos asociados a combustible de la flota de transporte MTC'),
('Mantenimiento', 'Mantenimiento preventivo y correctivo de los vehículos'),
('Personal', 'Nómina, seguridad social y prestaciones del personal operativo'),
('Peajes', 'Pagos de peajes en rutas nacionales y urbanas'),
('Administrativo', 'Gastos de papelería, servicios públicos y administración de oficinas')
on conflict (nombre) do nothing;


-- 2. Eliminar las restricciones de checks estáticos de categorías en las tablas originales
alter table public.metas_semanales drop constraint if exists metas_semanales_categoria_check;
alter table public.gastos_semanales drop constraint if exists gastos_semanales_categoria_check;


-- 3. Habilitar el rol 'control_interno' en perfiles
alter table public.perfiles drop constraint if exists perfiles_rol_check;
alter table public.perfiles add constraint perfiles_rol_check check (rol in ('administrador', 'directivo', 'control_interno'));


-- 4. Crear tabla de Metas Mensuales
create table if not exists public.metas_mensuales (
    id uuid default gen_random_uuid() primary key,
    departamento_id integer references public.departamentos(id) on delete cascade not null,
    concepto_id integer references public.conceptos(id) on delete cascade not null,
    monto_meta numeric(15, 2) not null check (monto_meta >= 0),
    mes integer not null check (mes between 1 and 12),
    anio integer not null check (anio >= 2020),
    fecha_inicio date not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    constraint unique_meta_dept_concepto_mes_anio unique (departamento_id, concepto_id, mes, anio)
);

-- Habilitar RLS para Metas Mensuales
alter table public.metas_mensuales enable row level security;


-- 5. Crear función de validación de rol de Control Interno o Administrador
create or replace function public.es_control_interno_o_admin(user_id uuid)
returns boolean
security definer
language plpgsql
as $$
begin
  return exists (
    select 1 from public.perfiles
    where id = user_id and rol in ('administrador', 'control_interno')
  );
end;
$$;


-- 6. Crear tabla del Pipeline de Validación de Ahorros
create table if not exists public.validaciones_ahorros (
    id uuid default gen_random_uuid() primary key,
    departamento_id integer references public.departamentos(id) on delete cascade not null,
    concepto_id integer references public.conceptos(id) on delete cascade not null,
    mes integer not null check (mes between 1 and 12),
    anio integer not null check (anio >= 2020),
    ahorro_proyectado numeric(15, 2) not null default 0,
    ahorro_real_ejecutado numeric(15, 2) check (ahorro_real_ejecutado >= 0),
    estado_pipeline text not null check (estado_pipeline in ('Pendiente', 'En Revisión', 'Validado', 'Observado')) default 'Pendiente',
    validado_por uuid references auth.users(id) on delete set null,
    observaciones text,
    fecha_validacion timestamp with time zone default timezone('utc'::text, now()),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    constraint unique_val_ahorro_dept_concepto_mes_anio unique (departamento_id, concepto_id, mes, anio)
);

-- Habilitar RLS para Validaciones de Ahorros
alter table public.validaciones_ahorros enable row level security;


-- 7. Políticas de Seguridad (RLS)

-- Políticas para conceptos
create policy "Usuarios autenticados pueden ver conceptos"
on public.conceptos for select
using (auth.role() = 'authenticated');

create policy "Solo administradores pueden modificar conceptos"
on public.conceptos for all
using ( public.es_administrador(auth.uid()) );

-- Políticas para metas_mensuales
create policy "Usuarios autenticados pueden ver metas mensuales"
on public.metas_mensuales for select
using (auth.role() = 'authenticated');

create policy "Solo administradores pueden modificar metas mensuales"
on public.metas_mensuales for all
using ( public.es_administrador(auth.uid()) );

-- Políticas para validaciones_ahorros
create policy "Usuarios autenticados pueden ver validaciones de ahorros"
on public.validaciones_ahorros for select
using (auth.role() = 'authenticated');

create policy "Solo admin y control interno pueden modificar validaciones"
on public.validaciones_ahorros for all
using ( public.es_control_interno_o_admin(auth.uid()) );
