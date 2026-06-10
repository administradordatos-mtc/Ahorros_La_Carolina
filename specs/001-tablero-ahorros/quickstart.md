# Quickstart: Tablero de Ahorros

## 1. Instalar dependencias

```bash
pip install -r requirements.txt
```

## 2. Revisar CSV fuente

Archivo esperado:

```text
data/propuestas_ahorro.csv
```

Columnas obligatorias:

```text
departamento,propuesta,responsable,cifra_estimada,calculo,evidencia,fecha_implementacion,estado,ahorro_real,bloqueo
```

## 3. Generar tablero

```bash
python src/generate_dashboard.py
```

## 4. Abrir resultado

```bash
xdg-open output/tablero_ahorros.html
```

En Windows:

```powershell
start output/tablero_ahorros.html
```

## 5. Ejecutar pruebas

```bash
pytest -q
```

## Resultado esperado

- Se genera `output/tablero_ahorros.html`.
- El tablero muestra KPIs.
- El tablero permite filtros.
- La tabla muestra todas las propuestas.
- Las propuestas bloqueadas quedan resaltadas.
- El resumen por departamento queda visible.
