# Tasks: Tablero Único HTML de Propuestas de Ahorro

**Feature:** `001-tablero-ahorros`  
**Input:** `specs/001-tablero-ahorros/spec.md`, `plan.md`, `data-model.md`

---

## Fase 1: Estructura base

- [ ] T001 Crear carpetas `data/`, `src/`, `templates/`, `output/` y `tests/`.
- [ ] T002 Crear `requirements.txt` con `pandas`, `jinja2` y `pytest`.
- [ ] T003 Crear `data/propuestas_ahorro.csv` con datos de ejemplo.
- [ ] T004 Crear `src/__init__.py`.

## Fase 2: Validación de datos

- [ ] T005 Crear `src/validate_data.py` con `REQUIRED_COLUMNS`.
- [ ] T006 Agregar catálogo `ALLOWED_STATES`.
- [ ] T007 Implementar función `load_proposals(csv_path)`.
- [ ] T008 Implementar validación de columnas obligatorias.
- [ ] T009 Implementar validación de campos obligatorios no vacíos.
- [ ] T010 Implementar normalización de `cifra_estimada` y `ahorro_real`.
- [ ] T011 Implementar validación de estados permitidos.
- [ ] T012 Implementar validación de fecha `YYYY-MM-DD`.
- [ ] T013 Agregar columnas derivadas `pendiente_evidencia`, `pendiente_calculo`, `esta_bloqueada` e `implementada_o_medida`.

## Fase 3: Métricas

- [ ] T014 Crear `src/metrics.py`.
- [ ] T015 Implementar cálculo de total de propuestas.
- [ ] T016 Implementar cálculo de ahorro estimado total.
- [ ] T017 Implementar cálculo de ahorro real total.
- [ ] T018 Implementar cálculo de diferencia de ahorro.
- [ ] T019 Implementar conteo de bloqueadas.
- [ ] T020 Implementar conteo de implementadas o medidas.
- [ ] T021 Implementar conteo de pendientes de evidencia.
- [ ] T022 Implementar conteo de pendientes de cálculo.
- [ ] T023 Implementar resumen por departamento.

## Fase 4: Plantilla HTML

- [ ] T024 Crear `templates/tablero_ahorros.html.j2`.
- [ ] T025 Agregar encabezado y estilos base responsive.
- [ ] T026 Agregar tarjetas KPI.
- [ ] T027 Agregar filtros por departamento, responsable, estado y bloqueo.
- [ ] T028 Agregar tabla principal con todos los campos obligatorios.
- [ ] T029 Agregar resaltado visual para bloqueadas.
- [ ] T030 Agregar indicadores visuales para falta de evidencia y falta de cálculo.
- [ ] T031 Agregar resumen por departamento.
- [ ] T032 Agregar JavaScript de filtros.
- [ ] T033 Agregar JavaScript para exportar CSV filtrado.

## Fase 5: Generador

- [ ] T034 Crear `src/generate_dashboard.py`.
- [ ] T035 Integrar carga y validación de CSV.
- [ ] T036 Integrar cálculo de métricas.
- [ ] T037 Integrar renderizado Jinja2.
- [ ] T038 Guardar resultado en `output/tablero_ahorros.html`.
- [ ] T039 Mostrar mensaje de éxito con ruta del HTML generado.

## Fase 6: Pruebas

- [ ] T040 Crear `tests/test_validate_data.py`.
- [ ] T041 Probar carga correcta del CSV.
- [ ] T042 Probar error por columna faltante.
- [ ] T043 Probar error por estado inválido.
- [ ] T044 Probar normalización de cifras.
- [ ] T045 Crear `tests/test_metrics.py`.
- [ ] T046 Probar cálculo de KPIs.
- [ ] T047 Probar resumen por departamento.
- [ ] T048 Crear `tests/test_generate_dashboard.py`.
- [ ] T049 Probar que se genera `output/tablero_ahorros.html`.

## Fase 7: Documentación y verificación

- [ ] T050 Actualizar `README.md` con instalación, uso y estructura.
- [ ] T051 Ejecutar `pytest -q`.
- [ ] T052 Ejecutar `python src/generate_dashboard.py`.
- [ ] T053 Verificar existencia de `output/tablero_ahorros.html`.
- [ ] T054 Confirmar que el HTML incluye KPIs, filtros, tabla y resumen por departamento.

---

## Orden recomendado de implementación

1. Fase 1
2. Fase 2
3. Fase 3
4. Fase 4
5. Fase 5
6. Fase 6
7. Fase 7

## Restricciones

- No agregar base de datos.
- No agregar login.
- No agregar backend.
- No depender de internet.
- No cambiar los nombres de columnas sin actualizar spec, plan, pruebas y plantilla.
