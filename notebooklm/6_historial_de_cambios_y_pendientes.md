# Fuentes para NotebookLM — 6. Historial de Cambios y Pendientes

Este documento consolida el historial de desarrollo, optimizaciones de código, refactorizaciones y la lista de tareas pendientes (backlog) de la Plataforma de Control de Ahorros Operativos para **Transportes La Carolina MTC**.

---## 1. Historial de Cambios y Lanzamientos

### A. Dinamización y Filtros Temporales en Reportes Ejecutivos (24 de Junio de 2026)
* **Rediseño e Interactividad (`reports.html`)**: Reemplazado todo el grid de reportes estáticos obsoletos (2023 y 2024) por un panel interactivo con barra de filtros para seleccionar Año, Mes y Departamento. Incorporación de Bento Cards de KPIs (Ahorro Proyectado, Ahorro Real Validado, Desviación Neta, Eficiencia de Validación) y una tabla detallada con spinner de carga.
* **Lógica del Negocio y Consultas Supabase (`src/js/reports.js`)**: Creación de un script dedicado que consulta `iniciativas` e `iniciativas_ejecucion` y calcula en tiempo real el ahorro proyectado del periodo (acotado a la fecha de inicio de ejecución de cada iniciativa) y el ahorro real validado.
* **Exportación CSV e Impresión PDF**: Implementación de un exportador CSV reactivo que genera y descarga dinámicamente un archivo con los datos del periodo seleccionado. Configuración de estilos `@media print` para generar impresiones en PDF limpias y profesionales, ocultando elementos del sistema como el menú lateral y los filtros de búsqueda.
* **Verificación de Compilación**: Ejecutado `npm run build` con éxito, verificando que Vite empaqueta la vista y su lógica JS sin dependencias rotas.

### B. Actualización y Refactorización (23 de Junio de 2026)
* **Visualización de Rama Git Activa**:
  * Configuración de inyección de la rama Git actual en tiempo de compilación (`vite.config.js`) mediante la constante `__GIT_BRANCH__`.
  * Renderizado dinámico de un badge estilizado (`#git-branch-badge`) en la barra superior común (`auth.js`), permitiendo identificar visualmente si se visualiza la versión de producción o de desarrollo en cualquier página autenticada.
* **Módulo de Ejecución Mensual por Iniciativa**:
  * Creación y despliegue del script de base de datos (`supabase/restructure_ejecuciones.sql`) para crear la tabla relacional `iniciativas_ejecucion`.
  * Diseño e implementación de la interfaz `execution.html` con selectores interactivos para filtrar por Departamento, Mes y Año.
  * Lógica reactiva en `src/js/execution.js` para cargar el cruce de iniciativas, permitir el registro individual del ahorro real ejecutado y bloquear las celdas para el rol directivo (modo solo lectura).
  * Rediseño de las Bento Cards del Dashboard (`src/js/dashboard.js`) para sumarizar e integrar los ahorros de ejecuciones que se encuentren en estado `'Validado'`.

### C. Consolidación y Orientación a Iniciativas (22 de Junio de 2026)
* **Simplificación del Control Financiero**:
  * Eliminación física de los módulos obsoletos de Gastos Semanales y Metas (`expenses.html`, `goals.html`, `src/js/expenses.js`, `src/js/goals.js`).
  * Redirección de los accesos directos del dashboard hacia la creación de Iniciativas de Ahorro (`initiatives.html`).
* **Seguridad en Aprobación de Iniciativas**:
  * Eliminación del selector de estado en el modal de creación de iniciativas, garantizando que todo nuevo registro inicie en el flujo de aprobación con estado `'Iniciativa'`.
* **Cálculo de Proyecciones de Caja**:
  * Implementación del factor de meses activos restantes en el ejercicio fiscal (`12 - mes_inicio + 1`) para proyectar con precisión el ahorro esperado anual.
* **Visualización y Gráficos**:
  * Rediseño del gráfico de línea del dashboard principal para mostrar curvas acumulativas continuas de Ahorro Proyectado versus Ahorro Real Validado.
  * Integración de selectores rápidos en la tabla de Movimientos Recientes para cambiar estados en tiempo real (exclusivo para administradores y auditores).
  * Inclusión de botones de borrado físico en iniciativas y transacciones condicionados al rol de administrador.

### D. UX, Seguridad y Rendimiento (17 de Junio de 2026)
* **Ajuste de Densidad Visual**:
  * Redefinición del espaciado vertical de la barra de navegación lateral (`space-y-3`) para evitar cortes tipográficos.
  * Ajuste de celdas y filas en todas las tablas de la aplicación a `py-4 px-6` para una lectura limpia de cifras financieras.
* **Resolución de Condiciones de Carrera (Concurrencia)**:
  * Implementación de la caché de promesas de sesión en `auth.js` (`currentSessionPromise`) para prevenir el envío duplicado de tokens de autenticación y resolver rechazos RLS en Supabase.
* **Desempeño en Desplazamiento (Scroll)**:
  * Modificación del parallax de las cabeceras; uso de variables de caché del DOM para evitar consultas duplicadas en el bucle de scroll e inclusión de escuchadores de eventos pasivos (`{ passive: true }`).

---

## 2. Plan de Tareas Pendientes (Backlog de Desarrollo)

### A. Funcionalidades Financieras y Auditoría
1. **Alertas de Desviación Presupuestal**:
   * Desarrollar validaciones lógicas en el cliente que muestren un aviso de confirmación si el "Ahorro Real" ingresado supera en más de un 150% el "Ahorro Esperado Mes".
   * Razón: Evita errores tipográficos comunes en el ingreso manual de cifras financieras.

### B. Infraestructura y Rendimiento
1. **Feedback Visual Completo (Spinners)**:
   * Ya implementado en la vista de ejecución (`execution.html`) y reportes (`reports.html`). Se puede replicar este spinner de carga en otras vistas principales (`index.html`, `initiatives.html`, `kpis.html`) para mitigar la percepción de retraso durante la inicialización de Supabase y validación de sesión.
2. **Pruebas de Carga en Staging**:
   * Configurar e igualar el esquema de producción con el script local de migración de base de datos PostgreSQL, verificando las políticas de seguridad (RLS).
   * Razón: Garantiza la estabilidad del sistema antes de habilitar el acceso masivo a usuarios finales.

### C. Calidad y Mantenimiento de Código
1. **Automatización de Formato y Estilo**:
   * Incorporar Prettier y ESLint en los scripts de pre-commit para obligar a un estándar de codificación limpio y uniforme en todo el repositorio.
2. **Pruebas de Integración de Seguridad**:
   * Implementar scripts de testing automático que verifiquen el bloqueo de acceso y redirección a `login.html` de rutas no autenticadas.
