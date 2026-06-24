# Memoria del Proyecto — Ahorros La Carolina

Este documento contiene el registro de todo el trabajo, depuración, optimización e implementación realizados en el proyecto de la Plataforma de Control de Ahorros Operativos para **Transportes La Carolina MTC**.

---

## 1. Trabajo Realizado y Desarrollos (22 de Junio de 2026)

### A. Corrección del Menú Lateral (Sidebar) y UX
* **Ajuste de Sidebar**: Corregido el ancho de la navegación lateral desktop (cambiado `w-xl` y `w-80` a `w-64 shrink-0`) en todos los archivos HTML principales (`index.html`, `initiatives.html`, `kpis.html`, `users.html`) para evitar el colapso del menú y cortes de texto.
* **Dashboard Consolidado**: Rediseño de las tarjetas Bento y la lógica en `src/js/dashboard.js` para calcular: Ahorro Reportado (Proyectado), Ahorro Real Validado, y Eficiencia de Validación a nivel de Iniciativas.
* **Ocultación de Secciones Obsoletas**: Se removieron las secciones "Gastos" y "Metas" de los menús laterales y móviles. Se actualizó el botón rápido en el Dashboard de "REPORTAR GASTO" a "NUEVA INICIATIVA", redirigiendo a iniciativas.

### B. Enfoque y Reestructuración en Iniciativas de Ahorro (Caja General)
* **Formulario y Estados Simplificados**: Se añadió la captura de la fecha de inicio (`fecha_inicio_ejecucion`) y departamento en el modal de creación de iniciativas, y se retiró el selector de estado del HTML (`initiatives.html`), forzando en el script (`src/js/initiatives.js`) que toda nueva iniciativa empiece estrictamente en estado `'Iniciativa'`.
* **Sincronización de Departamento**: Se implementó una lógica reactiva en el formulario que pre-selecciona automáticamente el departamento en el modal basándose en el filtro activo del listado principal.
* **Cálculo de Ahorros Dinámicos**: Se reestructuró la lógica para calcular el ahorro anual esperado multiplicando el `esperado_mes` por los meses activos restantes en el año presupuestal (`12 - startMonth + 1`).
* **Validación Directa en Dashboard y Tablas**: Los administradores y auditores de Control Interno pueden validar en tiempo real el estado de una iniciativa (cambiar entre `'Iniciativa'` y `'Validada'`) a través de un select dropdown interactivo directamente en las tablas y en la lista de movimientos recientes del Dashboard.
* **Eliminación de Código y Registros**: Se añadieron botones de eliminación física en la tabla de iniciativas y en la lista de movimientos recientes del Dashboard para usuarios con el rol `'administrador'`. Asimismo, se eliminaron físicamente del proyecto los archivos heredados `expenses.html`, `goals.html`, `src/js/expenses.js` y `src/js/goals.js`, removiendo sus entradas de compilación en `vite.config.js`.
* **Gráfico Acumulado Anual (12 Meses)**: Se rediseñó el gráfico de línea de progreso anual para mostrar dos curvas acumulativas (Ahorro Proyectado en base a iniciativas activas, y Ahorro Real Validado en base a iniciativas aprobadas por Control Interno).
* **Corrección de Sintaxis**: Se resolvió una condición de syntax error en `initiatives.js` (falta de llave de cierre) que impedía la compilación.

### C. Reestructuración de Metas a Formato Mensual (Fase Anterior)
* **Migración SQL (`supabase/restructure_metas.sql`)**: Se diseñó el script SQL para crear la tabla de `conceptos` (Maestro de Conceptos), ampliar la restricción de rol en `perfiles` para el nuevo rol `'control_interno'`, crear `metas_mensuales` (con llave única compuesta por departamento, concepto, mes y año) y la tabla de `validaciones_ahorros` con RLS.
* **Rediseño de Modal y Filtros (`goals.html`)**: Se reestructuró el modal de creación de metas para usar selectores dinámicos en lugar de inputs estáticos, permitiendo elegir el Departamento, el Concepto Presupuestal, el Monto Límite Mensual, el Año de presupuesto, el Mes de Inicio y la Fecha de Inicio.

### D. Proyección de Metas por Lote
* **Generación Automática**: En `goals.js`, al registrar una nueva meta mensual, el sistema realiza un bucle desde el mes de inicio del ahorro hasta el mes 12 (Diciembre) del año presupuestal, construyendo un lote de objetos de meta.
* **Upsert en Supabase**: Las metas mensuales se guardan mediante la función `.upsert()` por lote, garantizando que se creen o actualicen de forma masiva y limpia sin duplicar registros.

### E. Tablero Pipeline de Validación para Control Interno
* **Acceso y Roles**: Se modificó `auth.js` para admitir e integrar al nuevo rol `'control_interno'`.
* **Tablero Interactivo**: Se implementó una tabla interactiva en `#section-validacion` donde se calcula automáticamente el Gasto Real Mensual (agrupando los gastos semanales de ese periodo y concepto) y el Ahorro Proyectado (Meta Mensual - Gasto Real Mensual).
* **Edición y Guardado de Pipeline**: Los usuarios con rol `control_interno` o `administrador` pueden registrar el ahorro real efectivamente ejecutado, cambiar el estado del pipeline entre `Pendiente`, `En Revisión`, `Validado` y `Observado`, e ingresar observaciones de control.
* **Fórmula de Gasto Retrocompatible**: Se implementó en `goals.js` un cálculo robusto de gastos mensuales agrupando `gastos_semanales` que coincidan en mes, año y categoría del concepto, admitiendo filtros opcionales de departamento si se habilitan en los gastos, garantizando compatibilidad retroactiva total.

### F. Gestión de Parámetros Generales
* **Pestaña de Parámetros**: Se implementó una pestaña exclusiva para el Administrador que carga y expone los catálogos en listas reactivas.
* **CRUD de Parámetros**: Permite la creación y eliminación en cascada de Departamentos y Conceptos directamente en la UI mediante formularios dedicados integrados con Supabase.

### G. Verificación y Compilación
* **Build de Producción**: Se ejecutó exitosamente el comando `npm run build` confirmando que Vite empaqueta de forma correcta todos los módulos sin errores de compilación.

---

## 2. Trabajo Realizado y Optimizaciones (17 de Junio de 2026)

### A. Mejoras de Espaciado y UX (Información Compacta)
* **Barra de Navegación Lateral (Sidebar)**: Se incrementó la holgura de los elementos de navegación a `space-y-3` o `gap-3` (12px de separación) en todas las vistas de la aplicación (`index.html`, `expenses.html`, `goals.html`, `reports.html`, `initiatives.html`, `kpis.html`, `users.html`).
* **Tablas de Datos**: Se modificó el renderizado dinámico de filas y celdas en `initiatives.js`, `kpis.js` y `users.js` para aplicar paddings equilibrados de `py-4 px-6`.
* **Encabezados Estáticos (`th`)**: Se actualizaron los paddings a `py-4 px-6` en los archivos HTML correspondientes.

### B. Control de Roles y Acceso al Panel de Metas
* Se habilitó el acceso al panel de Metas (`goals.html`) a usuarios con rol `directivo` eliminando la restricción de rol en `checkSession()`.
* Se incorporó lógica en `goals.js` para detectar si el usuario autenticado no es administrador y, en ese caso, ocultar dinámicamente el botón "NUEVA META" (`#btn-nueva-meta`).

### C. Resolución de la Condición de Carrera en la Sesión (Caché de Promesa)
* **Problema**: `checkSession()` (inline en HTML) y el script del componente `goals.js` se ejecutaban en paralelo. `goals.js` realizaba consultas a Supabase antes de que la sesión estuviera cargada y validada en el cliente, resultando en rechazos de políticas RLS y bloqueos en la interfaz.
* **Solución (Caché de Promesa)**: Se implementó un patrón de caché de promesa única en `auth.js` usando la variable `currentSessionPromise`. Múltiples llamadas simultáneas a `checkSession()` resuelven y esperan la misma solicitud HTTP original, previniendo peticiones duplicadas y coordinando de forma segura la visibilidad de la página.

### D. Optimización del Scroll y Parallax (Cuelgues del Navegador)
* **Problema**: El escuchador de `scroll` para el efecto parallax en `goals.html` realizaba consultas frecuentes al DOM (`document.querySelector`) en cada píxel de movimiento y calculaba valores que podían resultar en `NaN` en navegadores/webviews heredados, congelando el hilo de ejecución principal.
* **Solución**: 
  1. Se extrajo la consulta del DOM fuera del bucle de scroll.
  2. Se implementó una verificación segura (`window.scrollY || window.pageYOffset || 0`) para garantizar un valor numérico válido.
  3. Se registró el evento con `{ passive: true }` para habilitar el desplazamiento suave independiente del hilo de JavaScript.

### E. Robustez y Manejo de Errores de Base de Datos
* Se agregaron bloques `try-catch` robustos en accesos a `localStorage`.
* Se implementaron fallbacks seguros en los comparadores de ordenamiento (`.sort()`) en `goals.js` para evitar excepciones si la base de datos devuelve categorías, semanas o años nulos.
* Se agregó un banner visual prominente de error en caso de que el cliente Supabase falle al inicializarse.

---

## 3. Trabajo Realizado y Desarrollos (23 de Junio de 2026)

### A. Visualización de Rama Git Activa en Pantalla
* **Constante en Build (`vite.config.js`)**: Configurado Vite para ejecutar `git rev-parse --abbrev-ref HEAD` de manera síncrona en tiempo de compilación y registrar la rama activa en la constante global `__GIT_BRANCH__`.
* **Inyección Dinámica de Interfaz (`src/js/auth.js`)**: Modificado el actualizador de interfaz (`actualizarInterfazUsuario`) para inyectar dinámicamente un badge de estilo Tailwind (`#git-branch-badge`) al lado del título "LA CAROLINA MTC" en la cabecera superior. Esto permite que cualquier vista autenticada muestre la rama actual en tiempo real sin modificar los archivos HTML individuales.
* **Verificación y Compilación**: Validado que `npm run build` compila correctamente el proyecto de producción e incluye el nombre de la rama en el haz empaquetado.

### B. Registro y Seguimiento de Ejecución Mensual
* **Creación de Tabla en Base de Datos**: Diseñado el script `supabase/restructure_ejecuciones.sql` para crear la tabla `iniciativas_ejecucion` que registra el ahorro real, estado de pipeline y observaciones por mes y año con clave única combinada. Limpieza de tablas obsoletas de metas y validaciones de conceptos.
* **Diseño e Implementación de la Vista de Ejecución (`execution.html`)**: Desarrollada una vista para ingresar y validar los ahorros mensuales con selectores de filtros de Departamento, Mes y Año.
* **Desarrollo de la Lógica Interactiva (`src/js/execution.js`)**: Implementada la lógica de carga cruzada (iniciativas con ejecuciones registradas), bloqueo de campos en base a rol (`directivo` de solo lectura) y guardado reactivo individual por fila vía upsert.
* **Actualización del Dashboard (`src/js/dashboard.js`)**: Adaptadas las Bento Cards y la lógica del gráfico anual de 12 meses para reflejar el ahorro real consolidando las ejecuciones en estado `'Validado'` en lugar de basarse en el estado binario general de las iniciativas.
* **Vinculación en Navegación y Compilación**: Agregado el enlace a "Ejecución" (`execution.html`) en la barra lateral desktop y menú móvil de las 5 vistas del proyecto. Añadido el entry point a `vite.config.js`.

---

## 4. Trabajo Realizado y Desarrollos (24 de Junio de 2026)

### A. Dinamización y Filtros Temporales en Reportes Ejecutivos
* **Rediseño e Interactividad (`reports.html`)**: Reemplazado todo el grid de reportes estáticos obsoletos (2023 y 2024) por un panel interactivo con barra de filtros para seleccionar Año, Mes y Departamento. Incorporación de Bento Cards de KPIs (Ahorro Proyectado, Ahorro Real Validado, Desviación Neta, Eficiencia de Validación) y una tabla detallada con spinner de carga.
* **Lógica del Negocio y Consultas Supabase (`src/js/reports.js`)**: Creación de un script dedicado que consulta `iniciativas` e `iniciativas_ejecucion` y calcula en tiempo real el ahorro proyectado del periodo (acotado a la fecha de inicio de ejecución de cada iniciativa) y el ahorro real validado.
* **Exportación CSV e Impresión PDF**: Implementación de un exportador CSV reactivo que genera y descarga dinámicamente un archivo con los datos del periodo seleccionado. Configuración de estilos `@media print` para generar impresiones en PDF limpias y profesionales, ocultando elementos del sistema como el menú lateral y los filtros de búsqueda.
* **Verificación de Compilación**: Ejecutado `npm run build` con éxito, verificando que Vite empaqueta la vista y su lógica JS sin dependencias rotas.

