# Fuentes para NotebookLM — 4. Ejecución Mensual y Tablero Kanban

Este documento detalla el funcionamiento del panel de seguimiento mensual, el flujo del pipeline de ahorros y la implementación técnica de la vista Kanban Interactiva.

---

## 1. Flujo Presupuestal Mensual
El control de ahorros opera a nivel mensual:
1. **Creación**: Una iniciativa se registra en el sistema con su departamento, fecha de inicio y una estimación de ahorro esperado mensual (`esperado_mes`).
2. **Ciclo Mensual**: Para cada mes del año presupuestal, se debe registrar el rendimiento real de la iniciativa.
3. **Pipeline de Aprobación**: Los registros de ejecución mensual avanzan a través de los siguientes estados:
   * **Pendiente**: Iniciada la medición mensual del ahorro, a la espera de datos reales.
   * **En Revisión**: Datos del ahorro real ingresados y bajo análisis.
   * **Validado**: El ahorro real ha sido auditado y aprobado formalmente por Control Interno o el Administrador. **Únicamente los montos en este estado se consolidan en las estadísticas de ahorro real del Dashboard**.
   * **Observado**: El ahorro mensual presenta anomalías o requiere corrección. Las observaciones correspondientes se detallan en el campo de notas.

---

## 2. Interfaz Dual de Ejecución (`execution.html`)
La pantalla de ejecución mensual expone una interfaz interactiva con dos vistas intercambiables:

### A. Vista de Tabla (Planilla de Control)
* Diseñada para auditorías detalladas e inserción rápida de observaciones por teclado.
* Renderiza una tabla estructurada por columnas.
* Cada fila cuenta con un botón **Guardar** individual que realiza un upsert de esa fila y cambia temporalmente de estilo a un check verde (`#10B981`) para dar retroalimentación de éxito.

### B. Vista Kanban (Tablero de Control Visual)
* Diseñada para visualizar el estado general del pipeline de forma interactiva.
* Distribuye las iniciativas como tarjetas en 4 columnas correspondientes a los estados del pipeline.
* Las tarjetas se pueden arrastrar y soltar de forma interactiva entre columnas para cambiar de estado automáticamente en la base de datos.

---

## 3. Implementación Técnica del Kanban y Drag & Drop
El tablero está construido sobre la API de Drag & Drop nativa de HTML5 para optimizar el rendimiento y evitar dependencias de librerías de terceros:

1. **Atributos de Arrastre**:
   * Las tarjetas reciben el atributo `draggable="true"` únicamente si el usuario tiene rol de escritura (`administrador` o `control_interno`) y la iniciativa ya ha comenzado.
   * Al iniciar el arrastre (`dragstart`), se guarda el `id` de la iniciativa en el portapapeles del evento (`e.dataTransfer.setData`) y se añade una clase de opacidad (`opacity-40`) a la tarjeta original.
2. **Zonas de Destino (Dropzones)**:
   * Cada columna del Kanban tiene un área con clase `.kanban-cards-area` y un atributo `data-status`.
   * Al arrastrar una tarjeta sobre una columna (`dragover`), se activa un estilo visual con borde segmentado dorado (`drag-over`).
   * Al soltar la tarjeta (`drop`), el script extrae el `id` de la iniciativa, identifica la columna de destino, y ejecuta una petición `upsert` a Supabase para actualizar el registro `iniciativas_ejecucion`.
3. **Regla de Relleno Automático (UX Premium)**:
   * Si una tarjeta tiene un valor de Ahorro Real de `0` y el usuario la arrastra a la columna **Validado** o **En Revisión**, el script extrae el ahorro esperado mensual de la tarjeta y **pre-llena automáticamente** el input del ahorro real con este valor esperado antes de guardar. Esto ahorra tiempo de transcripción manual a los auditores si la meta de ahorro se cumplió sin variaciones.
4. **Fechas de Inicio (Tarjetas Bloqueadas)**:
   * Si la fecha actual filtrada en la interfaz es anterior a la `fecha_inicio_ejecucion` de la iniciativa, la tarjeta se bloquea visualmente, recibe un distintivo de **"No Iniciada"**, y se desactiva el arrastre (`draggable="false"`).
