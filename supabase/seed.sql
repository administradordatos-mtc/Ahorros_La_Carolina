-- Datos semilla de ejemplo para Ahorros La Carolina (Idempotente)

-- 1. Limpiar gastos de prueba existentes para evitar duplicados al re-ejecutar
delete from public.gastos_semanales where anio = 2026 and semana in (20, 21, 22);

-- 2. Insertar/Actualizar Metas Semanales de ejemplo para semanas 20, 21 y 22 del año 2026
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
('Administrativo', 150000.00, 22, 2026, '2026-05-25')
on conflict (categoria, semana, anio)
do update set
  monto_meta = excluded.monto_meta,
  fecha_inicio = excluded.fecha_inicio;


-- 3. Insertar Gastos Reales Semanales para las mismas semanas
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


-- 4. INSERTAR DATOS DE DEPARTAMENTOS E INICIATIVAS (EXCEL TECNOLOGÍA)

-- Insertar Departamento
insert into public.departamentos (id, nombre)
values (1, 'Tecnología (TI)')
on conflict (nombre) do update set nombre = excluded.nombre;

-- Limpiar iniciativas viejas de Tecnología para evitar duplicados al re-sembrar
delete from public.iniciativas where departamento_id = 1;

-- Insertar las 7 iniciativas del archivo Excel
insert into public.iniciativas (departamento_id, nombre, tipo, categoria, pesimista_mes, base_mes, optimista_mes, esperado_mes, anual_esperado, capex, payback_meses, roi_12m, estado, notas) values
(1, 'Renegociar LM Solución - objetivo ahorro 20-30% (gasto ~$128M/año)', 'AHORRO', 'Renegociación proveedor', 6000000.00, 6000000.00, 6000000.00, 6000000.00, 36000000.00, null, null, null, 'Negociación', 'Varia la cotizacion debido a que ellos no colocan el gps'),
(1, 'Plan repotenciación de equipos (vida útil +2-3 años, ahorro 15-20%)', 'AHORRO', 'Optimización proceso', 0.00, 0.00, 0.00, 0.00, 0.00, null, null, null, 'Propuesta', 'En Revision Debido a verificacio de repotenciacion de equipos y años de usoso posibles y tecnologia actual'),
(1, 'Aplicativo de alertas de repuestos repetitivos (con Mantenimiento)', 'AHORRO', 'Tecnología', 0.00, 0.00, 0.00, 0.00, 0.00, null, null, null, 'Por desarrollar', 'Plan SAAS'),
(1, 'Plataforma de control interno Carolina S.A.S - repositorio + anotaciones + data', 'AHORRO', 'Tecnología', 0.00, 0.00, 0.00, 0.00, 0.00, null, null, null, 'Por desarrollar', 'Plan SAAS'),
(1, 'App Carolina S.A.S - reporte taller + accidentalidad (piloto 8 días)', 'MIXTA', 'Tecnología', 0.00, 0.00, 0.00, 0.00, 0.00, null, null, null, 'Piloto', 'Plan SAAS'),
(1, 'Automatización WhatsApp con app Víctor (~$0.03 USD/conexión)', 'AHORRO', 'Tecnología', 0.00, 0.00, 0.00, 0.00, 0.00, null, null, null, 'Propuesta', 'Plan SAAS'),
(1, 'Gestion Llantas Pro (Control interno)', 'AHORRO', 'Tecnología', 947689.00, 947689.00, 947689.00, 947689.00, 5686134.00, null, null, null, 'En curso', 'Implementado apartir de abril del 2026');

-- Limpiar KPIs viejos de Tecnología para evitar duplicados al re-sembrar
delete from public.kpis where departamento_id = 1;

-- Insertar los 5 KPIs del Excel
insert into public.kpis (id, departamento_id, nombre_kpi, linea_base, meta_mensual, frecuencia) values
('kpi-accidentalidad-0000000000', 1, 'Accidentalidad (eventos/mes)', 'Línea Base', 'Meta Mensual', 'Mensual'),
('kpi-rotacion-00000000000000', 1, 'Rotación de personal', 'Línea Base', 'Meta Mensual', 'Mensual'),
('kpi-ausentismo-000000000000', 1, 'Ausentismo de conductores', 'Línea Base', 'Meta Mensual', 'Mensual'),
('kpi-conductorestarde-00000', 1, 'Conductores tarde', 'Línea Base', 'Meta Mensual', 'Mensual'),
('kpi-ahorromaterializado-000', 1, 'Ahorro materializado vs. proyectado', 'Línea Base', 'Meta Mensual', 'Mensual');
