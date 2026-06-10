# Especificación: Tablero Único HTML de Propuestas de Ahorro

**Feature Branch:** `001-tablero-ahorros`  
**Creado:** 2026-06-10  
**Estado:** Draft listo para Antigravity / Spec-Kit  
**Entrada:** Solicitud: "Construir repositorio o tablero único en HTML para todas las propuestas de ahorro. Incluir por departamento: propuesta, responsable, cifra estimada, cálculo, evidencia, fecha de implementación, estado, ahorro real y bloqueo."

---

## Escenario de usuario principal

La gerencia necesita consultar en un único tablero HTML todas las propuestas de ahorro de la organización, agrupadas y filtrables por departamento, responsable y estado. El tablero debe mostrar el ahorro estimado, el cálculo que respalda la cifra, la evidencia disponible, la fecha de implementación, el estado de avance, el ahorro real obtenido y cualquier bloqueo que impida avanzar.

---

## Usuarios

### Gerencia
- Consulta totales de ahorro estimado y real.
- Revisa avances por departamento.
- Identifica propuestas bloqueadas.
- Compara ahorro estimado contra ahorro real.

### Líder de departamento
- Registra o actualiza propuestas en la fuente de datos.
- Mantiene responsable, cálculo, evidencia, estado y bloqueos.
- Informa ahorro real cuando la propuesta se implementa y mide.

### Analista administrador
- Mantiene `data/propuestas_ahorro.csv`.
- Ejecuta el generador del tablero.
- Valida consistencia de campos, estados y cifras.
- Publica o comparte `output/tablero_ahorros.html`.

---

## Requisitos funcionales

### RF-001: Fuente de datos
El sistema debe leer propuestas desde `data/propuestas_ahorro.csv`.

### RF-002: Campos obligatorios
Cada registro debe incluir estas columnas:

- `departamento`
- `propuesta`
- `responsable`
- `cifra_estimada`
- `calculo`
- `evidencia`
- `fecha_implementacion`
- `estado`
- `ahorro_real`
- `bloqueo`

### RF-003: Validación mínima
El sistema debe validar que:

- `departamento`, `propuesta`, `responsable`, `cifra_estimada` y `estado` no estén vacíos.
- `cifra_estimada` sea numérica y mayor o igual a cero.
- `ahorro_real` sea numérica y mayor o igual a cero; si está vacía, se interpreta como cero.
- `estado` pertenezca al catálogo permitido.
- `fecha_implementacion`, si existe, tenga formato `YYYY-MM-DD`.

### RF-004: Estados permitidos
Los estados válidos son:

- Idea
- En análisis
- Aprobada
- En implementación
- Implementada
- Medida
- Bloqueada
- Descartada

### RF-005: Advertencias de calidad de datos
El tablero debe marcar visualmente:

- Propuestas sin evidencia.
- Propuestas sin cálculo.
- Propuestas bloqueadas.

### RF-006: KPIs ejecutivos
El tablero debe mostrar tarjetas KPI con:

- Total de propuestas.
- Ahorro estimado total.
- Ahorro real total.
- Diferencia entre ahorro estimado y ahorro real.
- Número de propuestas bloqueadas.
- Número de propuestas implementadas o medidas.
- Número de propuestas pendientes de evidencia.
- Número de propuestas pendientes de cálculo.

### RF-007: Filtros
El tablero debe permitir filtrar por:

- Departamento.
- Responsable.
- Estado.
- Bloqueadas / no bloqueadas / todas.

### RF-008: Tabla principal
El tablero debe mostrar una tabla con todos los campos obligatorios. La tabla debe ser legible, responsive y permitir consulta ejecutiva.

### RF-009: Resumen por departamento
El tablero debe mostrar un resumen agrupado por departamento con:

- Cantidad de propuestas.
- Ahorro estimado.
- Ahorro real.
- Cantidad de bloqueos.

### RF-010: Exportación
El tablero debe incluir, si es viable sin dependencias externas, botón para exportar la tabla filtrada a CSV desde el navegador.

### RF-011: Salida HTML
El sistema debe generar `output/tablero_ahorros.html` que pueda abrirse localmente sin servidor.

---

## Requisitos no funcionales

- La primera versión debe funcionar sin internet.
- No debe requerir base de datos.
- No debe requerir login.
- Debe usar una estructura simple de carpetas.
- Debe poder ejecutarse con un comando Python.
- Debe incluir pruebas automatizadas.
- Debe incluir datos de ejemplo.

---

## Criterios de aceptación

1. Dado un CSV válido, cuando se ejecuta el generador, entonces se crea `output/tablero_ahorros.html`.
2. Al abrir el HTML, se muestran los KPIs principales.
3. La tabla muestra departamento, propuesta, responsable, cifra estimada, cálculo, evidencia, fecha de implementación, estado, ahorro real y bloqueo.
4. Se puede filtrar por departamento, responsable y estado.
5. Las propuestas bloqueadas se resaltan claramente.
6. Las propuestas sin evidencia se identifican como pendientes de evidencia.
7. Las propuestas sin cálculo se identifican como pendientes de cálculo.
8. El ahorro estimado total y el ahorro real total se calculan correctamente.
9. El resumen por departamento muestra cantidad de propuestas, ahorro estimado, ahorro real y bloqueos.
10. Las pruebas pasan con `pytest -q`.

---

## Fuera de alcance para primera versión

- Base de datos.
- Autenticación de usuarios.
- Edición directa desde el navegador.
- Carga de archivos desde la interfaz.
- Sincronización en tiempo real.
- Publicación automática en SharePoint.
