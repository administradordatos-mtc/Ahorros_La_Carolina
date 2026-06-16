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
('Administrativo', 130000.00, 22, 2026, '2026-05-28', 'Implementos de seguridad industrial taller')
on conflict do nothing;


-- 4. INSERTAR DATOS DE DEPARTAMENTOS
insert into public.departamentos (id, nombre) values
(1, 'Tecnología (TI)'),
(2, 'Tesorería'),
(3, 'Contabilidad'),
(4, 'Mantenimiento y Compras'),
(5, 'Operaciones'),
(6, 'Comercial'),
(7, 'Talento Humano')
on conflict (id) do update set nombre = excluded.nombre;

-- Limpiar iniciativas anteriores para evitar duplicados al re-sembrar
delete from public.iniciativas;

-- 5. INSERTAR INICIATIVAS DEL EXCEL POR DEPARTAMENTO
insert into public.iniciativas (departamento_id, nombre, tipo, categoria, pesimista_mes, base_mes, optimista_mes, esperado_mes, anual_esperado, capex, payback_meses, roi_12m, estado, notas) values
-- ID 1: Tecnología (TI)
(1, 'Renegociar LM Solución — objetivo ahorro 20-30% (gasto ~$128M/año)', 'AHORRO', 'Renegociación proveedor', 6000000.00, 6000000.00, 6000000.00, 6000000.00, 36000000.00, null, null, null, 'Negociación', 'Varia la cotizacion debido a que ellos no colocan el gps'),
(1, 'Plan repotenciación de equipos (vida útil +2-3 años, ahorro 15-20%)', 'AHORRO', 'Optimización proceso', 0.00, 0.00, 0.00, 0.00, 0.00, null, null, null, 'Propuesta', 'En Revision Debido a verificacio de repotenciacion de equipos y años de usoso posibles y tecnologia actual'),
(1, 'Aplicativo de alertas de repuestos repetitivos (con Mantenimiento)', 'AHORRO', 'Tecnología', 0.00, 0.00, 0.00, 0.00, 0.00, null, null, null, 'Por desarrollar', 'Plan SAAS'),
(1, 'Plataforma de control interno Carolina S.A.S — repositorio + anotaciones + data', 'AHORRO', 'Tecnología', 0.00, 0.00, 0.00, 0.00, 0.00, null, null, null, 'Por desarrollar', 'Plan SAAS'),
(1, 'App Carolina S.A.S — reporte taller + accidentalidad (piloto 8 días)', 'MIXTA', 'Tecnología', 0.00, 0.00, 0.00, 0.00, 0.00, null, null, null, 'Piloto', 'Plan SAAS'),
(1, 'Automatización WhatsApp con app Víctor (~$0.03 USD/conexión)', 'AHORRO', 'Tecnología', 0.00, 0.00, 0.00, 0.00, 0.00, null, null, null, 'Propuesta', 'Plan SAAS'),
(1, 'Gestion Llantas Pro (Control interno)', 'AHORRO', 'Tecnología', 947689.00, 947689.00, 947689.00, 947689.00, 5686134.00, null, null, null, 'En curso', 'Implementado apartir de abril del 2026'),

-- ID 2: Tesorería
(2, 'Cambio transportadora a Atlas', 'AHORRO', 'Cambio proveedor', 3590000.00, 3590000.00, 3590000.00, 3590000.00, 25130000.00, null, null, null, 'Confirmado', ''),
(2, 'Comisión ACH (BBVA → Banco Bogotá) disminucion 70%', 'AHORRO', 'Renegociación proveedor', 772000.00, 772000.00, 772000.00, 772000.00, 5404000.00, null, null, null, 'Confirmado', ''),
(2, 'Optimización GMF (4×1000 → 2×1000)', 'AHORRO', 'Renegociación proveedor', 1120000.00, 1120000.00, 1120000.00, 1120000.00, 7840000.00, null, null, null, 'Confirmado', ''),
(2, 'Digitalización de informes de afiliados — firma digital y trazabilidad', 'AHORRO', 'Digitalización', 0.00, 0.00, 0.00, 0.00, 0.00, null, null, null, 'En curso', ''),

-- ID 3: Contabilidad
(3, 'Ahorro porcentual en impuestos — revisión software contable y tributario', 'AHORRO', 'Optimización proceso', 0.00, 0.00, 0.00, 0.00, 0.00, null, null, null, 'Análisis', ''),
(3, 'Reducción consumo de papel + digitalización archivo muerto', 'AHORRO', 'Digitalización', 0.00, 0.00, 0.00, 0.00, 0.00, null, null, null, 'Análisis', ''),
(3, 'Implementación de firma digital corporativa', 'AHORRO', 'Digitalización', 0.00, 0.00, 0.00, 0.00, 0.00, null, null, null, 'Propuesta', ''),
(3, 'Beneficios tributarios autos a GAS (IVA, retención, renta) — Edith', 'AHORRO', 'Optimización proceso', 5833333.00, 5833333.00, 5833333.00, 5833333.00, 69999996.00, null, null, null, 'Análisis', ''),
(3, 'Reducción de horas extras (operativo y mantenimiento)', 'AHORRO', 'Optimización proceso', 0.00, 0.00, 0.00, 0.00, 0.00, null, null, null, 'En análisis', ''),
(3, 'Revisión horas sábados — anticipación reducción jornada (Jorge, John, Edith)', 'AHORRO', 'Optimización proceso', 300000.00, 300000.00, 300000.00, 300000.00, 3600000.00, null, null, null, 'En análisis', ''),
(3, 'Migración a facturación electrónica gratuita DIAN', 'AHORRO', 'Digitalización', 173200.00, 173200.00, 173200.00, 173200.00, 2078400.00, null, null, null, 'En análisis', ''),

-- ID 4: Mantenimiento y Compras
(4, 'Reducción consolidada de repuestos (34.5% vs. 2026)', 'AHORRO', 'Renegociación proveedor', 0.00, 0.00, 0.00, 0.00, 0.00, null, null, null, 'Materializado', ''),
(4, 'Sistema de inyección — ahorro acumulado', 'AHORRO', 'Cambio proveedor', 916667.00, 916667.00, 916667.00, 916667.00, 11000004.00, null, null, null, 'Materializado', ''),
(4, 'Alternadores — de $780k a $250k (18 unidades)', 'AHORRO', 'Cambio proveedor', 800000.00, 800000.00, 800000.00, 800000.00, 9600000.00, null, null, null, 'Materializado', ''),
(4, 'Renegociación proveedores — metodología mínimo 3 cotizaciones', 'AHORRO', 'Renegociación proveedor', 0.00, 0.00, 0.00, 0.00, 0.00, null, null, null, 'En curso', ''),
(4, 'Mejoramiento / reducción de horas extras del área', 'AHORRO', 'Optimización proceso', 0.00, 0.00, 0.00, 0.00, 0.00, null, null, null, 'Propuesta', ''),
(4, 'Plan renovación de celulares y equipos — listado activos + renegociación (Helmut/Cindy)', 'AHORRO', 'Tecnología', 0.00, 0.00, 0.00, 0.00, 0.00, null, null, null, 'Por desarrollar', ''),
(4, 'Aplicativo de alertas de repuestos repetitivos', 'AHORRO', 'Tecnología', 0.00, 0.00, 0.00, 0.00, 0.00, null, null, null, 'Por desarrollar', ''),
(4, 'Urea automotriz de $6341 a $3900', 'AHORRO', 'CAMBIO DE MODELO', 2730006.00, 2730006.00, 2730006.00, 2730006.00, 19110042.00, null, null, null, 'Propuesta', ''),
(4, 'Valor referencia DIESEL hoy $11251', 'AHORRO', 'Renegociación proveedor', 4969600.00, 5730570.00, 6522600.00, 5730570.00, 34383420.00, null, null, null, 'Propuesta', ''),

-- ID 5: Operaciones
(5, 'Proyecto Helmut — ahorro combustible y optimización de rutas (entrega 9 jun)', 'MIXTA', 'Optimización proceso', 22493000.00, 25000000.00, 28116000.00, 25101500.00, 301218000.00, null, null, null, 'En análisis', ''),
(5, 'Piloto Miramar — 48-50 vehículos, 3 viajes/vehículo, frecuencia 4-5 min', 'MIXTA', 'Optimización proceso', 0.00, 0.00, 0.00, 0.00, 0.00, null, null, null, 'Diseño', ''),
(5, 'Plan de operaciones — mejoramiento del servicio (puntualidad, UX, seguridad)', 'INGRESO', 'Nueva fuente ingreso', 0.00, 0.00, 0.00, 0.00, 0.00, null, null, null, 'Diseño', ''),
(5, 'Ruta Alameda-circunvalar-cra 38-centro — gestión Área Metropolitana (Dr. Fabio)', 'INGRESO', 'Nueva fuente ingreso', 0.00, 0.00, 0.00, 0.00, 0.00, null, null, null, 'Gestión', ''),
(5, 'Incremento de usuarios — segmentos universidad/hospital · app Buzii', 'INGRESO', 'Nueva fuente ingreso', 0.00, 0.00, 0.00, 0.00, 0.00, null, null, null, 'Propuesta', ''),

-- ID 6: Comercial
(6, 'Publimedios — pantallas publicitarias en buses (piloto 2 MS + 2 fotón)', 'INGRESO', 'Nueva fuente ingreso', 0.00, 0.00, 0.00, 0.00, 0.00, null, null, null, 'Piloto', ''),
(6, 'Servicios B2B / Corporativos — escolar, eventos, EPS/ARL', 'INGRESO', 'B2B / Corporativo', 0.00, 0.00, 0.00, 0.00, 0.00, null, null, null, 'Propuesta', ''),
(6, 'Monetización redes Instagram/Facebook (Cámara de Comercio completada)', 'INGRESO', 'Monetización activos', 0.00, 0.00, 0.00, 0.00, 0.00, null, null, null, 'Propuesta', ''),
(6, 'Negociar con Ismael — mitad posts por mitad precio', 'AHORRO', 'Renegociación proveedor', 0.00, 0.00, 0.00, 0.00, 0.00, null, null, null, 'Propuesta', ''),
(6, 'Almacén de repuestos · pan de bonos · aerobuses · alianzas', 'INGRESO', 'Nueva fuente ingreso', 0.00, 0.00, 0.00, 0.00, 0.00, null, null, null, 'Propuesta', ''),

-- ID 7: Talento Humano
(7, 'Cambio proveedor polígrafo (Comfamiliar más económico)', 'AHORRO', 'Reducción consumo', 440000.00, 440000.00, 440000.00, 440000.00, 2640000.00, null, null, null, 'Propuesta', 'Con base en el promedio calculado de 3,67 poligrafias/mes'),
(7, 'Reubicación de aprendices para reemplazar cargos fijos', 'AHORRO', 'Optimización proceso', 2715430.00, 2715430.00, 2715430.00, 2715430.00, 16292580.00, null, null, null, 'Propuesta', 'El aprendiz puede reemplazar un cargo fijo con rotacion cada 6 meses'),
(7, 'Reducción de actividades de bienestar', 'AHORRO', 'Reducción consumo', 2783333.00, 2783333.00, 2783333.00, 2783333.00, 16699998.00, null, null, null, 'Propuesta', 'Promedio mensual correspondiente a los 6 meses restantes del año'),
(7, 'Recuperación en exámenes médicos de ingreso', 'MIXTA', 'Nueva fuente ingreso', 3360000.00, 3360000.00, 3360000.00, 3360000.00, 20160000.00, null, null, null, 'Confirmado', 'Promedio mensual de ingresos por mes segun los ultimos 7 meses');


-- Limpiar KPIs anteriores para evitar duplicados al re-sembrar
delete from public.kpis;

-- 6. INSERTAR LOS 5 KPIS PARA TODOS LOS DEPARTAMENTOS
insert into public.kpis (id, departamento_id, nombre_kpi, linea_base, meta_mensual, frecuencia) values
-- KPIs para Tecnología (TI) - ID 1
('10000000-0000-0000-0000-000000000001', 1, 'Accidentalidad (eventos/mes)', 'Línea Base', 'Meta Mensual', 'Mensual'),
('10000000-0000-0000-0000-000000000002', 1, 'Rotación de personal', 'Línea Base', 'Meta Mensual', 'Mensual'),
('10000000-0000-0000-0000-000000000003', 1, 'Ausentismo de conductores', 'Línea Base', 'Meta Mensual', 'Mensual'),
('10000000-0000-0000-0000-000000000004', 1, 'Conductores tarde', 'Línea Base', 'Meta Mensual', 'Mensual'),
('10000000-0000-0000-0000-000000000005', 1, 'Ahorro materializado vs. proyectado', 'Línea Base', 'Meta Mensual', 'Mensual'),

-- KPIs para Tesorería - ID 2
('20000000-0000-0000-0000-000000000001', 2, 'Accidentalidad (eventos/mes)', 'Línea Base', 'Meta Mensual', 'Mensual'),
('20000000-0000-0000-0000-000000000002', 2, 'Rotación de personal', 'Línea Base', 'Meta Mensual', 'Mensual'),
('20000000-0000-0000-0000-000000000003', 2, 'Ausentismo de conductores', 'Línea Base', 'Meta Mensual', 'Mensual'),
('20000000-0000-0000-0000-000000000004', 2, 'Conductores tarde', 'Línea Base', 'Meta Mensual', 'Mensual'),
('20000000-0000-0000-0000-000000000005', 2, 'Ahorro materializado vs. proyectado', 'Línea Base', 'Meta Mensual', 'Mensual'),

-- KPIs para Contabilidad - ID 3
('30000000-0000-0000-0000-000000000001', 3, 'Accidentalidad (eventos/mes)', 'Línea Base', 'Meta Mensual', 'Mensual'),
('30000000-0000-0000-0000-000000000002', 3, 'Rotación de personal', 'Línea Base', 'Meta Mensual', 'Mensual'),
('30000000-0000-0000-0000-000000000003', 3, 'Ausentismo de conductores', 'Línea Base', 'Meta Mensual', 'Mensual'),
('30000000-0000-0000-0000-000000000004', 3, 'Conductores tarde', 'Línea Base', 'Meta Mensual', 'Mensual'),
('30000000-0000-0000-0000-000000000005', 3, 'Ahorro materializado vs. proyectado', 'Línea Base', 'Meta Mensual', 'Mensual'),

-- KPIs para Mantenimiento y Compras - ID 4
('40000000-0000-0000-0000-000000000001', 4, 'Accidentalidad (eventos/mes)', 'Línea Base', 'Meta Mensual', 'Mensual'),
('40000000-0000-0000-0000-000000000002', 4, 'Rotación de personal', 'Línea Base', 'Meta Mensual', 'Mensual'),
('40000000-0000-0000-0000-000000000003', 4, 'Ausentismo de conductores', 'Línea Base', 'Meta Mensual', 'Mensual'),
('40000000-0000-0000-0000-000000000004', 4, 'Conductores tarde', 'Línea Base', 'Meta Mensual', 'Mensual'),
('40000000-0000-0000-0000-000000000005', 4, 'Ahorro materializado vs. proyectado', 'Línea Base', 'Meta Mensual', 'Mensual'),

-- KPIs para Operaciones - ID 5
('50000000-0000-0000-0000-000000000001', 5, 'Accidentalidad (eventos/mes)', 'Línea Base', 'Meta Mensual', 'Mensual'),
('50000000-0000-0000-0000-000000000002', 5, 'Rotación de personal', 'Línea Base', 'Meta Mensual', 'Mensual'),
('50000000-0000-0000-0000-000000000003', 5, 'Ausentismo de conductores', 'Línea Base', 'Meta Mensual', 'Mensual'),
('50000000-0000-0000-0000-000000000004', 5, 'Conductores tarde', 'Línea Base', 'Meta Mensual', 'Mensual'),
('50000000-0000-0000-0000-000000000005', 5, 'Ahorro materializado vs. proyectado', 'Línea Base', 'Meta Mensual', 'Mensual'),

-- KPIs para Comercial - ID 6
('60000000-0000-0000-0000-000000000001', 6, 'Accidentalidad (eventos/mes)', 'Línea Base', 'Meta Mensual', 'Mensual'),
('60000000-0000-0000-0000-000000000002', 6, 'Rotación de personal', 'Línea Base', 'Meta Mensual', 'Mensual'),
('60000000-0000-0000-0000-000000000003', 6, 'Ausentismo de conductores', 'Línea Base', 'Meta Mensual', 'Mensual'),
('60000000-0000-0000-0000-000000000004', 6, 'Conductores tarde', 'Línea Base', 'Meta Mensual', 'Mensual'),
('60000000-0000-0000-0000-000000000005', 6, 'Ahorro materializado vs. proyectado', 'Línea Base', 'Meta Mensual', 'Mensual'),

-- KPIs para Talento Humano - ID 7
('70000000-0000-0000-0000-000000000001', 7, 'Accidentalidad (eventos/mes)', 'Línea Base', 'Meta Mensual', 'Mensual'),
('70000000-0000-0000-0000-000000000002', 7, 'Rotación de personal', 'Línea Base', 'Meta Mensual', 'Mensual'),
('70000000-0000-0000-0000-000000000003', 7, 'Ausentismo de conductores', 'Línea Base', 'Meta Mensual', 'Mensual'),
('70000000-0000-0000-0000-000000000004', 7, 'Conductores tarde', 'Línea Base', 'Meta Mensual', 'Mensual'),
('70000000-0000-0000-0000-000000000005', 7, 'Ahorro materializado vs. proyectado', 'Línea Base', 'Meta Mensual', 'Mensual');
