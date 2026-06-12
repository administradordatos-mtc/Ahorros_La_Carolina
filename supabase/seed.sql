-- Datos semilla de ejemplo para Ahorros La Carolina

-- 1. Insertar Metas Semanales de ejemplo para semanas 20, 21 y 22 del año 2026
insert into public.metas_semanales (categoria, monto_meta, semana, anio, fecha_inicio) values
-- Semana 20 (Mayo 2026)
('Combustible', 1500000.00, 20, 2026, '2026-05-11'),
('Mantenimiento', 800000.00, 20, 2026, '2026-05-11'),
('Peajes', 300000.00, 20, 2026, '2026-05-11'),
('Administrativo', 150000.00, 20, 2026, '2026-05-11'),

-- Semana 21
('Combustible', 1500000.00, 21, 2026, '2026-05-18'),
('Mantenimiento', 800000.00, 21, 2026, '2026-05-18'),
('Peajes', 300000.00, 21, 2026, '2026-05-18'),
('Administrativo', 150000.00, 21, 2026, '2026-05-18'),

-- Semana 22
('Combustible', 1500000.00, 22, 2026, '2026-05-25'),
('Mantenimiento', 900000.00, 22, 2026, '2026-05-25'),
('Peajes', 300000.00, 22, 2026, '2026-05-25'),
('Administrativo', 150000.00, 22, 2026, '2026-05-25');


-- 2. Insertar Gastos Reales Semanales para las mismas semanas
insert into public.gastos_semanales (categoria, monto_gasto, semana, anio, fecha, descripcion) values
-- Semana 20 (Combustible bajo la meta -> ahorro exitoso!)
('Combustible', 1320400.00, 20, 2026, '2026-05-14', 'Consumo combustible Zona Norte Flota A-12'),
('Mantenimiento', 780000.00, 20, 2026, '2026-05-15', 'Taller Central - Cambio de filtros y aceites generales'),
('Peajes', 295000.00, 20, 2026, '2026-05-12', 'Peaje ruta metropolitana'),
('Administrativo', 145000.00, 20, 2026, '2026-05-13', 'Papelería y servicios administrativos taller'),

-- Semana 21 (Mantenimiento excedió un poco la meta)
('Combustible', 1480000.00, 21, 2026, '2026-05-20', 'Consumo combustible semanal completo'),
('Mantenimiento', 820000.00, 21, 2026, '2026-05-22', 'Mantenimiento correctivo preventivo buseta 45'),
('Peajes', 310000.00, 21, 2026, '2026-05-19', 'Rutas extras de despachos especiales'),
('Administrativo', 120000.00, 21, 2026, '2026-05-21', 'Gastos operativos menores de la oficina principal'),

-- Semana 22 (Ahorros significativos en combustible)
('Combustible', 1250000.00, 22, 2026, '2026-05-27', 'Control optimizado de rutas y rendimiento'),
('Mantenimiento', 750000.00, 22, 2026, '2026-05-29', 'Revisión y scanner preventivo buses de ruta troncal'),
('Peajes', 280000.00, 22, 2026, '2026-05-26', 'Tránsitos peaje Barranquilla'),
('Administrativo', 130000.00, 22, 2026, '2026-05-28', 'Implementos de seguridad industrial taller');
