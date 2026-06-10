# Plan Técnico: Tablero Único HTML de Propuestas de Ahorro

**Feature:** `001-tablero-ahorros`  
**Spec:** `specs/001-tablero-ahorros/spec.md`  
**Constitución:** `.specify/memory/constitution.md`

---

## Resumen

Construir un generador local de tablero HTML que lee propuestas de ahorro desde un CSV, valida datos, calcula indicadores gerenciales y genera un archivo HTML autocontenido para consulta en navegador.

---

## Stack técnico

- Python 3.11+
- pandas
- Jinja2
- pytest
- HTML
- CSS
- JavaScript vanilla

---

## Estructura propuesta

```text
ahorro/
├── data/
│   └── propuestas_ahorro.csv
├── output/
│   └── tablero_ahorros.html
├── src/
│   ├── __init__.py
│   ├── validate_data.py
│   ├── metrics.py
│   └── generate_dashboard.py
├── templates/
│   └── tablero_ahorros.html.j2
├── tests/
│   ├── test_validate_data.py
│   ├── test_metrics.py
│   └── test_generate_dashboard.py
├── specs/
│   └── 001-tablero-ahorros/
│       ├── spec.md
│       ├── plan.md
│       ├── data-model.md
│       ├── quickstart.md
│       └── tasks.md
├── README.md
└── requirements.txt
```

---

## Componentes

### `data/propuestas_ahorro.csv`
Archivo fuente editable por el analista administrador.

### `src/validate_data.py`
Responsable de:

- Cargar CSV.
- Validar columnas obligatorias.
- Normalizar cifras vacías.
- Validar estados.
- Validar fechas.
- Marcar pendientes de evidencia y cálculo.

### `src/metrics.py`
Responsable de calcular:

- Total de propuestas.
- Ahorro estimado total.
- Ahorro real total.
- Diferencia estimado vs real.
- Propuestas bloqueadas.
- Propuestas implementadas o medidas.
- Pendientes de evidencia.
- Pendientes de cálculo.
- Resumen por departamento.

### `src/generate_dashboard.py`
Responsable de:

- Leer datos.
- Validar datos.
- Calcular métricas.
- Renderizar plantilla Jinja2.
- Guardar `output/tablero_ahorros.html`.

### `templates/tablero_ahorros.html.j2`
Plantilla HTML con:

- KPIs.
- Filtros.
- Tabla principal.
- Resumen por departamento.
- JavaScript local para filtros y exportación.
- CSS embebido o local.

---

## Validaciones

Columnas requeridas:

```python
REQUIRED_COLUMNS = [
    "departamento",
    "propuesta",
    "responsable",
    "cifra_estimada",
    "calculo",
    "evidencia",
    "fecha_implementacion",
    "estado",
    "ahorro_real",
    "bloqueo",
]
```

Estados permitidos:

```python
ALLOWED_STATES = {
    "Idea",
    "En análisis",
    "Aprobada",
    "En implementación",
    "Implementada",
    "Medida",
    "Bloqueada",
    "Descartada",
}
```

---

## Reglas de cálculo

- `ahorro_estimado_total`: suma de `cifra_estimada`.
- `ahorro_real_total`: suma de `ahorro_real`.
- `diferencia_ahorro`: `ahorro_estimado_total - ahorro_real_total`.
- `propuestas_bloqueadas`: estado igual a `Bloqueada` o campo `bloqueo` no vacío.
- `propuestas_implementadas`: estado en `Implementada` o `Medida`.
- `pendientes_evidencia`: campo `evidencia` vacío.
- `pendientes_calculo`: campo `calculo` vacío.

---

## Interfaz HTML

### KPIs
Mostrar tarjetas superiores con valores formateados en COP.

### Filtros
Controles `select` para:

- Departamento.
- Responsable.
- Estado.
- Bloqueo.

### Tabla
La tabla debe incluir todas las columnas solicitadas. Debe aplicar clases CSS:

- `.row-blocked` para bloqueadas.
- `.warning-evidence` para falta de evidencia.
- `.warning-calculation` para falta de cálculo.

### Exportación
Función JavaScript `exportFilteredCSV()` que toma filas visibles y descarga CSV.

---

## Comandos

Instalar dependencias:

```bash
pip install -r requirements.txt
```

Generar tablero:

```bash
python src/generate_dashboard.py
```

Probar:

```bash
pytest -q
```

Abrir HTML:

```bash
xdg-open output/tablero_ahorros.html
```

---

## Riesgos y mitigaciones

### Riesgo: CSV con estados mal escritos
Mitigación: validación estricta y error claro.

### Riesgo: cifras con separadores de miles
Mitigación: normalizar valores removiendo puntos, comas y símbolos COP cuando sea posible.

### Riesgo: evidencia incompleta
Mitigación: no bloquear generación, pero marcar advertencia visible.

### Riesgo: sobreingeniería
Mitigación: mantener primera versión sin backend, sin login y sin base de datos.

---

## Verificación final

La implementación debe considerarse lista solo si:

- `pytest -q` pasa.
- `python src/generate_dashboard.py` termina sin error.
- Existe `output/tablero_ahorros.html`.
- El HTML contiene KPIs, filtros, tabla y resumen por departamento.
