-- Migration script to restructure iniciativas and clean up old data

-- 1. Add fecha_inicio_ejecucion to iniciativas table if it does not exist
alter table public.iniciativas 
add column if not exists fecha_inicio_ejecucion date;

-- 2. Populate fecha_inicio_ejecucion for existing initiatives
update public.iniciativas 
set fecha_inicio_ejecucion = created_at::date 
where fecha_inicio_ejecucion is null;

-- 3. Set a default value or NOT NULL constraint to make it clean
alter table public.iniciativas 
alter column fecha_inicio_ejecucion set default now()::date;

-- 4. Map existing statuses to 'Iniciativa' or 'Validada'
-- Map 'En curso', 'Completado', 'Confirmado', 'Materializado' to 'Validada'
-- Map everything else to 'Iniciativa'
update public.iniciativas 
set estado = case 
    when estado in ('En curso', 'Completado', 'Confirmado', 'Materializado') then 'Validada'
    else 'Iniciativa'
end;

-- 5. Drop the old state check constraint and apply the new one
alter table public.iniciativas 
drop constraint if exists iniciativas_estado_check;

alter table public.iniciativas 
add constraint iniciativas_estado_check check (estado in ('Iniciativa', 'Validada'));

-- 6. Clean up old weekly expenses and weekly goals to align with new box focus
delete from public.gastos_semanales;
delete from public.metas_semanales;
