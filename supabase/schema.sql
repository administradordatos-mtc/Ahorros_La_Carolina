-- Esquema de base de datos para Ahorros La Carolina

-- Habilitar extensión UUID si no está activa
create extension if not exists "uuid-ossp";

-- 1. Tabla de Perfiles de Usuarios
create table public.perfiles (
    id uuid references auth.users on delete cascade primary key,
    email text not null,
    rol text not null check (rol in ('administrador', 'directivo')) default 'directivo',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS para Perfiles
alter table public.perfiles enable row level security;

-- 2. Tabla de Metas Semanales (Ahorro presupuestado)
create table public.metas_semanales (
    id uuid default gen_random_uuid() primary key,
    categoria text not null check (categoria in ('Mantenimiento', 'Combustible', 'Personal', 'Peajes', 'Administrativo')),
    monto_meta numeric(15, 2) not null check (monto_meta >= 0),
    semana integer not null check (semana between 1 and 53),
    anio integer not null check (anio >= 2020),
    fecha_inicio date not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    constraint unique_meta_categoria_semana_anio unique (categoria, semana, anio)
);

-- Habilitar RLS para Metas Semanales
alter table public.metas_semanales enable row level security;

-- 3. Tabla de Gastos Semanales (Gastos reales reportados)
create table public.gastos_semanales (
    id uuid default gen_random_uuid() primary key,
    categoria text not null check (categoria in ('Mantenimiento', 'Combustible', 'Personal', 'Peajes', 'Administrativo')),
    monto_gasto numeric(15, 2) not null check (monto_gasto >= 0),
    semana integer not null check (semana between 1 and 53),
    anio integer not null check (anio >= 2020),
    fecha date not null,
    descripcion text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS para Gastos Semanales
alter table public.gastos_semanales enable row level security;

-- 4. Función y Trigger para auto-crear perfil de usuario
create or replace function public.handle_new_user()
returns trigger
security definer set search_path = public
language plpgsql
as $$
begin
  insert into public.perfiles (id, email, rol)
  values (new.id, new.email, 'directivo');
  return new;
end;
$$;

-- Trigger que se activa al insertar en auth.users
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
