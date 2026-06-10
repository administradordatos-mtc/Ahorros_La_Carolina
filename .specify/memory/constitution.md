# Constitución del Proyecto: Tablero Único de Propuestas de Ahorro

## Principios obligatorios

### 1. Trazabilidad total
Cada propuesta de ahorro debe conservar trazabilidad mínima: departamento, propuesta, responsable, cifra estimada, cálculo, evidencia, fecha de implementación, estado, ahorro real y bloqueo. No se acepta una propuesta sin departamento, responsable, monto estimado y estado.

### 2. Simplicidad operativa
La primera versión debe ejecutarse localmente, abrirse en navegador y funcionar sin servidor, base de datos ni autenticación. Se prioriza HTML claro, filtros simples y datos verificables.

### 3. Datos verificables
Toda cifra estimada debe indicar el cálculo usado. Toda propuesta debe asociar evidencia como texto, enlace, ruta de archivo o referencia documental. El ahorro real debe diferenciarse del ahorro estimado.

### 4. Control gerencial
El tablero debe permitir ver totales por departamento, estado, responsable y mes. Debe mostrar propuestas bloqueadas, motivo del bloqueo y diferencia entre ahorro estimado y real.

### 5. Estados normalizados
Los únicos estados permitidos son: Idea, En análisis, Aprobada, En implementación, Implementada, Medida, Bloqueada y Descartada.

### 6. Diseño ejecutivo
El tablero debe ser limpio, responsive y fácil de presentar. Debe incluir tarjetas KPI, filtros, tabla principal y resumen por departamento.

### 7. Calidad y verificación
Cada funcionalidad debe ser verificable. El proyecto debe incluir datos de ejemplo, pruebas automatizadas y generación comprobable de `output/tablero_ahorros.html`.

## Restricciones de la primera versión

- No agregar base de datos.
- No agregar login.
- No agregar backend obligatorio.
- No depender de internet para visualizar el HTML generado.
- Fuente inicial: `data/propuestas_ahorro.csv`.
- Salida principal: `output/tablero_ahorros.html`.

## Gobernanza

Cualquier cambio técnico debe respetar esta constitución. Si una decisión introduce complejidad innecesaria, debe justificarse en `specs/001-tablero-ahorros/plan.md` antes de implementarse.
