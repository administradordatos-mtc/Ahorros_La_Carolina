# Ahorro - Tablero Único de Propuestas de Ahorro

Proyecto generado con metodología Spec-Kit y ejecutado con Hermes.

## Objetivo

Consolidar en un único tablero HTML todas las propuestas de ahorro por departamento, incluyendo:

- Departamento
- Propuesta
- Responsable
- Cifra estimada
- Cálculo
- Evidencia
- Fecha de implementación
- Estado
- Ahorro real
- Bloqueo

## Estructura

```text
├── data/propuestas_ahorro.csv
├── output/tablero_ahorros.html
├── src/validate_data.py
├── src/metrics.py
├── src/generate_dashboard.py
├── templates/tablero_ahorros.html.j2
├── tests/
├── specs/001-tablero-ahorros/
└── .specify/
```

## Instalar dependencias

```bash
pip install -r requirements.txt
```

## Ejecutar pruebas

```bash
pytest -q
```

## Generar tablero

```bash
python src/generate_dashboard.py
```

## Abrir tablero

```bash
xdg-open output/tablero_ahorros.html
```

En Windows:

```powershell
start output/tablero_ahorros.html
```

## Estados permitidos

- Idea
- En análisis
- Aprobada
- En implementación
- Implementada
- Medida
- Bloqueada
- Descartada

## Notas

Primera versión local, sin base de datos, sin login y sin backend obligatorio.
