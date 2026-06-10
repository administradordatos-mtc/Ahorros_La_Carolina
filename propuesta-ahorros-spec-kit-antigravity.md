# Solución Spec-Kit: Tablero Único HTML de Propuestas de Ahorro

> **Objetivo:** Construir un repositorio/tablero único en HTML para consolidar, controlar y hacer seguimiento a todas las propuestas de ahorro por departamento.
>
> **Entorno objetivo:** Spec-Kit con integración **Antigravity** (`agy`).
>
> **Resultado esperado:** Una aplicación o sitio HTML local/web que permita visualizar, filtrar y actualizar propuestas de ahorro con evidencia, responsables, cálculos, estados, ahorro real y bloqueos.

---

## 1. Inicialización del proyecto con Spec-Kit para Antigravity

Ejecutar en terminal:

```bash
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git
specify init tablero-ahorros --integration agy
cd tablero-ahorros
```

Si el proyecto ya existe:

```bash
specify init . --integration agy --force
```

> Nota: en Spec-Kit, Antigravity usa la clave de integración `agy` y es una integración basada en skills.

---

## 2. Constitución del proyecto

Ejecutar en Antigravity el comando de Spec-Kit:

```text
/speckit.constitution
```

Usar este contenido:

```text
Crea la constitución del proyecto "Tablero Único de Propuestas de Ahorro".

Principios obligatorios:

1. Trazabilidad total:
   - Cada propuesta debe tener responsable, departamento, cifra estimada, cálculo, evidencia, fecha de implementación, estado, ahorro real y bloqueo.
   - No se debe permitir una propuesta sin departamento, responsable, monto estimado y estado.

2. Simplicidad operativa:
   - La solución debe poder ejecutarse localmente y abrirse fácilmente en navegador.
   - Priorizar HTML claro, filtros simples y datos verificables.
   - Evitar sobreingeniería.

3. Datos verificables:
   - Toda cifra estimada debe indicar el cálculo usado.
   - Toda propuesta debe poder asociar evidencia: archivo, enlace, imagen, documento o comentario verificable.
   - El ahorro real debe diferenciarse del ahorro estimado.

4. Control gerencial:
   - El tablero debe permitir ver totales por departamento, estado, responsable y mes.
   - Debe mostrar propuestas bloqueadas y motivo del bloqueo.
   - Debe mostrar diferencia entre ahorro estimado y ahorro real.

5. Estados normalizados:
   - Los estados permitidos son:
     - Idea
     - En análisis
     - Aprobada
     - En implementación
     - Implementada
     - Medida
     - Bloqueada
     - Descartada

6. Diseño:
   - El tablero debe ser limpio, ejecutivo y fácil de presentar.
   - Usar tarjetas de indicadores, filtros y tabla principal.
   - El HTML debe ser responsive.

7. Calidad:
   - Cada funcionalidad debe ser verificable.
   - El proyecto debe incluir datos de ejemplo.
   - El resultado debe poder probarse sin depender inicialmente de base de datos externa.
```

Archivo esperado:

```text
.specify/memory/constitution.md
```

---

## 3. Especificación funcional

Ejecutar:

```text
/speckit.specify
```

Usar este prompt:

```text
Construir un repositorio o tablero único en HTML para gestionar todas las propuestas de ahorro de la organización.

El tablero debe consolidar propuestas por departamento e incluir obligatoriamente los siguientes campos:

- Departamento
- Propuesta
- Responsable
- Cifra estimada de ahorro
- Cálculo usado para estimar el ahorro
- Evidencia
- Fecha de implementación
- Estado
- Ahorro real
- Bloqueo o motivo de bloqueo

El objetivo es que la gerencia pueda consultar en un solo lugar todas las oportunidades de ahorro, saber en qué estado están, cuánto ahorro estimado representan, cuánto ahorro real se ha conseguido y qué propuestas están bloqueadas.

Usuarios principales:

1. Gerencia:
   - Consulta totales de ahorro estimado y real.
   - Revisa avances por departamento.
   - Identifica bloqueos.

2. Líderes de departamento:
   - Registran o actualizan propuestas.
   - Adjuntan evidencia o describen la evidencia disponible.
   - Actualizan estado y ahorro real.

3. Analista administrador:
   - Mantiene el archivo fuente de datos.
   - Genera o publica el tablero HTML.
   - Valida consistencia de cifras, cálculos y estados.

Requisitos funcionales:

1. Visualización ejecutiva:
   - Mostrar tarjetas KPI con:
     - Total de propuestas.
     - Ahorro estimado total.
     - Ahorro real total.
     - Diferencia entre ahorro estimado y real.
     - Número de propuestas bloqueadas.
     - Número de propuestas implementadas.

2. Filtros:
   - Filtrar por departamento.
   - Filtrar por responsable.
   - Filtrar por estado.
   - Filtrar por rango de fecha de implementación.
   - Filtrar propuestas bloqueadas.

3. Tabla principal:
   - Mostrar todas las propuestas con sus campos.
   - Permitir ordenamiento por ahorro estimado, ahorro real, fecha, departamento y estado.
   - Resaltar visualmente propuestas bloqueadas.
   - Resaltar propuestas implementadas o medidas.

4. Vista por departamento:
   - Mostrar resumen agrupado por departamento.
   - Incluir cantidad de propuestas, ahorro estimado, ahorro real y bloqueos.

5. Evidencia:
   - Cada propuesta debe tener un campo de evidencia.
   - La evidencia puede ser texto, enlace, ruta de archivo o referencia documental.
   - Si no existe evidencia, el tablero debe marcar la propuesta como pendiente de evidencia.

6. Cálculo:
   - Cada propuesta debe explicar cómo se calculó el ahorro estimado.
   - El cálculo puede ser fórmula, comentario técnico o referencia a archivo.
   - Si no hay cálculo, marcar como pendiente de cálculo.

7. Estados:
   - Usar solo estados normalizados:
     - Idea
     - En análisis
     - Aprobada
     - En implementación
     - Implementada
     - Medida
     - Bloqueada
     - Descartada

8. Datos de entrada:
   - En la primera versión, usar un archivo CSV o JSON local como fuente de datos.
   - Incluir datos de ejemplo para probar el tablero.
   - El tablero debe poder regenerarse a partir del archivo fuente.

9. Salida:
   - Generar un archivo HTML final llamado `tablero_ahorros.html`.
   - El HTML debe abrirse en navegador sin servidor.
   - Incluir CSS y JavaScript en el mismo HTML o en archivos locales simples.

10. Exportación:
   - Permitir exportar la tabla filtrada a CSV desde el navegador, si es viable en la primera versión.

Criterios de aceptación:

- Al abrir el HTML, se muestran KPIs principales.
- Se puede filtrar por departamento, responsable y estado.
- La tabla muestra todos los campos obligatorios.
- Las propuestas bloqueadas se identifican claramente.
- El ahorro estimado y real se totalizan correctamente.
- El tablero funciona con datos de ejemplo.
- El tablero no depende de internet para funcionar en la primera versión.
```

Archivo esperado:

```text
specs/001-tablero-ahorros/spec.md
```

---

## 4. Clarificación de requisitos

Ejecutar:

```text
/speckit.clarify
```

Respuestas sugeridas si Antigravity pregunta:

```text
1. Fuente inicial de datos:
   CSV local llamado data/propuestas_ahorro.csv.

2. Edición de datos:
   Para la primera versión, no se editará directamente en el HTML.
   Los datos se editan en CSV y se regenera el HTML.

3. Evidencia:
   Puede ser enlace, ruta de archivo o texto descriptivo.

4. Moneda:
   Pesos colombianos COP.

5. Formato de cifras:
   Separador de miles con punto y sin decimales.

6. Fechas:
   Formato YYYY-MM-DD.

7. Primera versión:
   Debe funcionar completamente local, sin backend ni base de datos.

8. Departamentos:
   Deben venir desde el CSV, no estar quemados en código.

9. Estados:
   Solo se aceptan estados normalizados.

10. Exportación:
   Sí, incluir botón para exportar CSV filtrado si no complica demasiado.
```

---

## 5. Plan técnico

Ejecutar:

```text
/speckit.plan
```

Usar este prompt:

```text
Crear la solución como un generador local de tablero HTML.

Stack técnico:

- Python 3.11 o superior.
- pandas para leer, validar y procesar el CSV.
- Jinja2 para renderizar el HTML.
- HTML, CSS y JavaScript vanilla para la interfaz.
- Sin base de datos en la primera versión.
- Sin servidor obligatorio.

Estructura esperada:

- data/propuestas_ahorro.csv: archivo fuente de datos.
- src/validate_data.py: validación de columnas, estados, fechas y cifras.
- src/generate_dashboard.py: generación del HTML.
- templates/tablero_ahorros.html.j2: plantilla HTML.
- output/tablero_ahorros.html: tablero generado.
- tests/: pruebas de validación y generación.
- README.md: instrucciones para ejecutar.

Reglas técnicas:

1. El CSV debe contener las columnas:
   - departamento
   - propuesta
   - responsable
   - cifra_estimada
   - calculo
   - evidencia
   - fecha_implementacion
   - estado
   - ahorro_real
   - bloqueo

2. Validaciones:
   - departamento no vacío.
   - propuesta no vacía.
   - responsable no vacío.
   - cifra_estimada numérica y mayor o igual a cero.
   - ahorro_real numérico y mayor o igual a cero.
   - estado dentro del catálogo permitido.
   - fecha_implementacion con formato válido YYYY-MM-DD si existe.
   - marcar advertencia si cálculo está vacío.
   - marcar advertencia si evidencia está vacía.

3. KPIs:
   - total_propuestas
   - ahorro_estimado_total
   - ahorro_real_total
   - diferencia_ahorro
   - propuestas_bloqueadas
   - propuestas_implementadas
   - propuestas_pendientes_evidencia
   - propuestas_pendientes_calculo

4. HTML:
   - Debe contener tarjetas KPI.
   - Debe contener filtros por departamento, responsable, estado y bloqueo.
   - Debe contener tabla ordenable o filtrable.
   - Debe resaltar bloqueadas.
   - Debe resaltar pendientes de cálculo/evidencia.
   - Debe incluir botón de exportación CSV filtrada.

5. Diseño:
   - Estilo ejecutivo.
   - Paleta sobria: fondo claro, tarjetas blancas, acentos azul/verde/rojo.
   - Responsive para pantalla de escritorio y portátil.

6. Ejecución:
   - Comando principal:
     python src/generate_dashboard.py

7. Pruebas:
   - Validar que el CSV de ejemplo cargue correctamente.
   - Validar que los KPIs se calculen correctamente.
   - Validar que estados inválidos generen error.
   - Validar que se genere output/tablero_ahorros.html.
```

Archivos esperados:

```text
specs/001-tablero-ahorros/plan.md
specs/001-tablero-ahorros/research.md
specs/001-tablero-ahorros/data-model.md
specs/001-tablero-ahorros/quickstart.md
```

---

## 6. Modelo de datos propuesto

Usar como referencia para revisar `data-model.md`:

```markdown
# Modelo de Datos: Propuesta de Ahorro

## Entidad: PropuestaAhorro

| Campo | Tipo | Obligatorio | Descripción |
|---|---:|---:|---|
| departamento | texto | sí | Área responsable o beneficiaria de la propuesta |
| propuesta | texto | sí | Descripción corta de la iniciativa de ahorro |
| responsable | texto | sí | Persona encargada del seguimiento |
| cifra_estimada | número | sí | Ahorro estimado en COP |
| calculo | texto | sí recomendado | Fórmula o explicación del cálculo |
| evidencia | texto | sí recomendado | Enlace, ruta o soporte documental |
| fecha_implementacion | fecha | no | Fecha esperada o real de implementación |
| estado | catálogo | sí | Estado normalizado de la propuesta |
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
```

---

## 7. CSV de ejemplo

Crear archivo:

```text
data/propuestas_ahorro.csv
```

Contenido sugerido:

```csv
departamento,propuesta,responsable,cifra_estimada,calculo,evidencia,fecha_implementacion,estado,ahorro_real,bloqueo
Operaciones,Optimizar rutas de despacho,Carlos Perez,8500000,"Reducción de km recorridos x costo promedio por km","Informe rutas abril",2026-07-01,En análisis,0,
Mantenimiento,Compra consolidada de repuestos,Ana Gomez,12000000,"Diferencia entre precio actual y precio negociado x volumen","Cotización proveedor",2026-06-20,Aprobada,0,
Administración,Digitalizar archivo físico,Laura Ruiz,3500000,"Horas administrativas ahorradas x costo hora","Levantamiento interno",2026-08-01,Idea,0,
Talento Humano,Reducir horas extra por programación,Diego Torres,6000000,"Horas extra promedio mensual x valor hora extra","Reporte nómina",2026-07-15,En implementación,1500000,
Compras,Renegociar contrato de papelería,Maria Lopez,2500000,"Consumo anual actual - propuesta proveedor","Contrato comparativo",2026-06-30,Bloqueada,0,"Pendiente aprobación jurídica"
```

---

## 8. Generación de tareas

Ejecutar:

```text
/speckit.tasks
```

El `tasks.md` debería incluir tareas similares a estas:

```markdown
# Tasks: Tablero Único de Propuestas de Ahorro

## Fase 1: Estructura base

- [ ] Crear estructura de carpetas: data/, src/, templates/, output/, tests/.
- [ ] Crear archivo CSV de ejemplo en data/propuestas_ahorro.csv.
- [ ] Crear README.md con instrucciones iniciales.

## Fase 2: Validación de datos

- [ ] Crear catálogo de estados permitidos.
- [ ] Crear función para cargar CSV.
- [ ] Validar columnas obligatorias.
- [ ] Validar campos obligatorios no vacíos.
- [ ] Validar cifras numéricas.
- [ ] Validar fecha en formato YYYY-MM-DD.
- [ ] Generar advertencias para propuestas sin cálculo.
- [ ] Generar advertencias para propuestas sin evidencia.

## Fase 3: Cálculo de indicadores

- [ ] Calcular total de propuestas.
- [ ] Calcular ahorro estimado total.
- [ ] Calcular ahorro real total.
- [ ] Calcular diferencia entre estimado y real.
- [ ] Calcular propuestas bloqueadas.
- [ ] Calcular propuestas implementadas o medidas.
- [ ] Calcular pendientes de evidencia.
- [ ] Calcular pendientes de cálculo.
- [ ] Calcular resumen por departamento.

## Fase 4: Plantilla HTML

- [ ] Crear plantilla Jinja2 del tablero.
- [ ] Agregar tarjetas KPI.
- [ ] Agregar filtros por departamento, responsable, estado y bloqueo.
- [ ] Agregar tabla principal.
- [ ] Resaltar propuestas bloqueadas.
- [ ] Resaltar pendientes de cálculo o evidencia.
- [ ] Agregar resumen por departamento.
- [ ] Agregar botón de exportación CSV filtrada.

## Fase 5: Generador

- [ ] Crear script src/generate_dashboard.py.
- [ ] Leer CSV.
- [ ] Validar datos.
- [ ] Calcular KPIs.
- [ ] Renderizar HTML.
- [ ] Guardar output/tablero_ahorros.html.

## Fase 6: Pruebas

- [ ] Probar carga correcta del CSV.
- [ ] Probar validación de columnas faltantes.
- [ ] Probar error por estado inválido.
- [ ] Probar cálculo correcto de KPIs.
- [ ] Probar generación del HTML.

## Fase 7: Verificación final

- [ ] Ejecutar pruebas completas.
- [ ] Generar tablero con datos de ejemplo.
- [ ] Abrir HTML en navegador.
- [ ] Confirmar que filtros funcionan.
- [ ] Confirmar que exportación CSV funciona.
```

---

## 9. Implementación

Cuando Spec-Kit haya generado `tasks.md`, ejecutar:

```text
/speckit.implement
```

Instrucción adicional recomendada para Antigravity:

```text
Implementa las tareas de forma secuencial.
No avances a la siguiente fase si la fase anterior no fue verificada.
Después de cada fase, ejecuta las pruebas disponibles o una validación manual.
No agregues base de datos, autenticación ni servidor web en esta primera versión.
Mantén la solución local, simple y funcional.
```

---

## 10. Comandos esperados del proyecto final

Instalar dependencias:

```bash
pip install pandas jinja2 pytest
```

Generar tablero:

```bash
python src/generate_dashboard.py
```

Ejecutar pruebas:

```bash
pytest -q
```

Abrir resultado:

```bash
xdg-open output/tablero_ahorros.html
```

En Windows:

```powershell
start output/tablero_ahorros.html
```

---

## 11. Criterios de aceptación finales

El desarrollo se considera completo cuando:

- Existe `data/propuestas_ahorro.csv` con datos de ejemplo.
- Existe `output/tablero_ahorros.html` generado correctamente.
- El HTML abre sin servidor.
- Se muestran KPIs principales.
- Se muestran todas las propuestas.
- Se puede filtrar por departamento, responsable, estado y bloqueo.
- Se resaltan propuestas bloqueadas.
- Se identifican propuestas sin evidencia.
- Se identifican propuestas sin cálculo.
- Se calcula ahorro estimado total.
- Se calcula ahorro real total.
- Se muestra diferencia entre estimado y real.
- Se muestra resumen por departamento.
- Las pruebas pasan con `pytest -q`.

---

## 12. Prompt corto para pegar directamente en Antigravity

Si quieres hacerlo más rápido, puedes pegar esto en Antigravity después de inicializar Spec-Kit:

```text
Quiero construir con metodología Spec-Kit un tablero único HTML de propuestas de ahorro.

Primero crea o actualiza la constitución del proyecto.
Luego crea la especificación funcional.
Después ejecuta clarificación.
Luego genera el plan técnico.
Después genera tasks.md.
Finalmente implementa solo cuando spec.md, plan.md y tasks.md estén completos.

La solución debe ser local, simple y ejecutable sin servidor.
Debe usar Python, pandas, Jinja2, HTML, CSS y JavaScript vanilla.
La fuente inicial será data/propuestas_ahorro.csv.
La salida será output/tablero_ahorros.html.

Campos obligatorios:
- departamento
- propuesta
- responsable
- cifra_estimada
- calculo
- evidencia
- fecha_implementacion
- estado
- ahorro_real
- bloqueo

Estados permitidos:
- Idea
- En análisis
- Aprobada
- En implementación
- Implementada
- Medida
- Bloqueada
- Descartada

El tablero debe incluir:
- KPIs ejecutivos.
- Filtros por departamento, responsable, estado y bloqueo.
- Tabla principal.
- Resumen por departamento.
- Resaltado de bloqueos.
- Advertencias por falta de cálculo o evidencia.
- Exportación CSV filtrada si es viable.

No agregues base de datos, login ni backend en la primera versión.
Incluye datos de ejemplo, pruebas y README.
```

---

## 13. Recomendación de control

Antes de implementar, pedir a Antigravity:

```text
Audita el spec.md, plan.md y tasks.md.
Confirma si todos los campos obligatorios están cubiertos.
Confirma si hay sobreingeniería.
Confirma si la primera versión se puede ejecutar localmente.
No implementes hasta que la auditoría esté aprobada.
```

Después de implementar:

```text
Ejecuta pytest -q.
Ejecuta python src/generate_dashboard.py.
Verifica que output/tablero_ahorros.html existe.
Revisa que el HTML incluya los KPIs, filtros, tabla y resumen por departamento.
```
