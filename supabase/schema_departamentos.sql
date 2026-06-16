-- Esquema de base de datos para Departamentos, Iniciativas de Ahorro y KPIs en Ahorros La Carolina

-- 1. Tabla de Departamentos
create table if not exists public.departamentos (
    id serial primary key,
    nombre text not null unique,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS para Departamentos
alter table public.departamentos enable row level security;

-- 2. Modificar perfiles para asociar a departamentos
alter table public.perfiles 
add column if not exists departamento_id integer references public.departamentos(id) on delete set null;

-- 3. Tabla de Iniciativas de Ahorro
create table if not exists public.iniciativas (
    id uuid default gen_random_uuid() primary key,
    departamento_id integer references public.departamentos(id) on delete cascade not null,
    nombre text not null,
    tipo text not null check (tipo in ('AHORRO', 'INGRESO', 'MIXTA')),
    categoria text not null,
    pesimista_mes numeric(15, 2) not null check (pesimista_mes >= 0),
    base_mes numeric(15, 2) not null check (base_mes >= 0),
    optimista_mes numeric(15, 2) not null check (optimista_mes >= 0),
    esperado_mes numeric(15, 2) not null check (esperado_mes >= 0),
    anual_esperado numeric(15, 2) not null check (anual_esperado >= 0),
    capex numeric(15, 2) check (capex >= 0),
    payback_meses numeric(10, 2) check (payback_meses >= 0),
    roi_12m numeric(10, 2),
    estado text not null check (estado in ('Propuesta', 'En curso', 'Piloto', 'Por desarrollar', 'Negociación', 'Completado')),
    notas text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS para Iniciativas
alter table public.iniciativas enable row level security;

-- 4. Tabla de KPIs por Departamento
create table if not exists public.kpis (
    id uuid default gen_random_uuid() primary key,
    departamento_id integer references public.departamentos(id) on delete cascade not null,
    nombre_kpi text not null,
    linea_base text,
    meta_mensual text,
    frecuencia text default 'Mensual' not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS para KPIs
alter table public.kpis enable row level security;

-- 5. Tabla de Seguimiento de KPIs
create table if not exists public.kpi_seguimiento (
    id uuid default gen_random_uuid() primary key,
    kpi_id uuid references public.kpis(id) on delete cascade not null,
    mes integer not null check (mes between 1 and 12),
    anio integer not null check (anio >= 2020),
    valor_real text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    constraint unique_kpi_mes_anio unique (kpi_id, mes, anio)
);

-- Habilitar RLS para Seguimiento de KPIs
alter table public.kpi_seguimiento enable row level security;


-- 6. Políticas de Seguridad (RLS)

-- Políticas para Departamentos
create policy "Usuarios autenticados pueden ver departamentos"
on public.departamentos for select
using (auth.role() = 'authenticated');

create policy "Solo administradores pueden modificar departamentos"
on public.departamentos for all
using ( public.es_administrador(auth.uid()) );

-- Políticas para Iniciativas
create policy "Usuarios autenticados pueden ver iniciativas"
on public.iniciativas for select
using (auth.role() = 'authenticated');

create policy "Solo administradores pueden modificar iniciativas"
on public.iniciativas for all
using ( public.es_administrador(auth.uid()) );

-- Políticas para KPIs
create policy "Usuarios autenticados pueden ver kpis"
on public.kpis for select
using (auth.role() = 'authenticated');

create policy "Solo administradores pueden modificar kpis"
on public.kpis for all
using ( public.es_administrador(auth.uid()) );

-- Políticas para Seguimiento de KPIs
create policy "Usuarios autenticados pueden ver seguimiento kpis"
on public.kpi_seguimiento for select
using (auth.role() = 'authenticated');

create policy "Solo administradores pueden modificar seguimiento kpis"
on public.kpi_seguimiento for all
using ( public.es_administrador(auth.uid()) );
