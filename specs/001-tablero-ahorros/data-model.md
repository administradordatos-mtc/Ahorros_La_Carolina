# Modelo de Datos: Propuestas de Ahorro

## Entidad: `PropuestaAhorro`

| Campo | Tipo | Obligatorio | Descripción |
|---|---:|---:|---|
| departamento | texto | sí | Área responsable o beneficiaria de la propuesta |
| propuesta | texto | sí | Descripción corta de la iniciativa de ahorro |
| responsable | texto | sí | Persona encargada del seguimiento |
| cifra_estimada | número | sí | Ahorro estimado en COP |
| calculo | texto | recomendado | Fórmula o explicación del ahorro estimado |
| evidencia | texto | recomendado | Enlace, ruta, documento o soporte |
| fecha_implementacion | fecha | no | Fecha esperada o real en formato YYYY-MM-DD |
| estado | catálogo | sí | Estado normalizado |
| ahorro_real | número | no | Ahorro medido después de implementar |
| bloqueo | texto | no | Motivo del bloqueo o restricción |

## Estados permitidos

- Idea
- En análisis
- Aprobada
- En implementación
- Implementada
- Medida
- Bloqueada
- Descartada

## Campos derivados

| Campo | Regla |
|---|---|
| pendiente_evidencia | `True` si `evidencia` está vacío |
| pendiente_calculo | `True` si `calculo` está vacío |
| esta_bloqueada | `True` si `estado == "Bloqueada"` o `bloqueo` no está vacío |
| implementada_o_medida | `True` si `estado` está en `Implementada`, `Medida` |

## KPIs

- `total_propuestas`: cantidad de registros.
- `ahorro_estimado_total`: suma de `cifra_estimada`.
- `ahorro_real_total`: suma de `ahorro_real`.
- `diferencia_ahorro`: ahorro estimado total menos ahorro real total.
- `propuestas_bloqueadas`: conteo de propuestas bloqueadas.
- `propuestas_implementadas`: conteo de propuestas en estado Implementada o Medida.
- `propuestas_pendientes_evidencia`: conteo sin evidencia.
- `propuestas_pendientes_calculo`: conteo sin cálculo.

## Resumen por departamento

Agrupar por `departamento` y calcular:

- Cantidad de propuestas.
- Ahorro estimado total.
- Ahorro real total.
- Cantidad de bloqueos.
