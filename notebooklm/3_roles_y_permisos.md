# Fuentes para NotebookLM — 3. Roles y Permisos de Usuario

Este documento detalla el control de accesos, los roles funcionales de la plataforma y el comportamiento dinámico de la interfaz según los perfiles de usuario.

---

## 1. Definición de Roles del Negocio
La plataforma está diseñada para tres roles operativos distintos:

### A. Administrador (`administrador`)
* **Propósito**: Encargado de la gestión técnica y presupuestal del sistema.
* **Permisos**:
  * Control total de la base de datos (CRUD) en todas las tablas.
  * Gestión de usuarios (creación, edición y asignación de roles en la base de datos y Supabase Auth).
  * Mantenimiento de catálogos generales (Departamentos y Conceptos).
  * Creación y borrado físico de Iniciativas.
  * Registro y validación del ahorro mensual ejecutado en el pipeline.
  * Acceso completo al Dashboard y Reportes.

### B. Control Interno (`control_interno`)
* **Propósito**: Auditor de caja y del ahorro. Su función es fiscalizar la ejecución real de las propuestas.
* **Permisos**:
  * Acceso de lectura a todas las secciones.
  * **Acceso de escritura en Ejecución Mensual**: Registro y modificación de la tabla `iniciativas_ejecucion` (monto real de ahorro, cambio del estado del pipeline y adición de observaciones).
  * *Restricciones*: No puede eliminar iniciativas ni administrar otros usuarios o catálogos generales.

### C. Directivo (`directivo`)
* **Propósito**: Visualizador ejecutivo de la salud presupuestal de la empresa.
* **Permisos**:
  * Acceso de **solo lectura** en toda la plataforma.
  * Visualización del Dashboard (KPI Bento, Gráficos de tendencias) y Reportes.
  * *Restricciones*: Todos los formularios de registro de iniciativas y de ejecución mensual se muestran completamente bloqueados (inputs deshabilitados, botones de guardado ocultos) mostrando un indicador visual de solo lectura (ícono de candado).

---

## 2. Implementación del Control en el Cliente (Frontend)

El flujo de seguridad de sesión se coordina en el módulo `src/js/auth.js` de la siguiente forma:

1. **Chequeo de Sesión (`checkSession`)**:
   * Valida la existencia de una sesión de Supabase Auth activa.
   * Si la sesión no es válida, limpia el rol local y redirige al usuario a `login.html` inmediatamente.
   * Si es válida, lee el rol de la base de datos (tabla `perfiles`) y lo almacena temporalmente en `localStorage` (`user_role`).
2. **Coordinación de Interfaz (`actualizarInterfazUsuario`)**:
   * Se ejecuta de forma automática tras validar la sesión.
   * Modifica el nombre del operador y su rol expuesto en el Drawer Lateral.
   * Si el usuario es `directivo`, oculta controles de creación de iniciativas (`#btn-nueva-iniciativa`) y desactiva inputs.
   * Si el usuario es `administrador`, remueve la clase `hidden` de los accesos a "Usuarios" (`#menu-usuarios` y `#mobile-menu-usuarios`) en el HTML para hacerlos visibles.
3. **Caché de Promesas de Autenticación**:
   * Previene condiciones de carrera cuando scripts inline (en el HTML) y scripts de módulo (como `execution.js`) intentan validar la sesión concurrentemente.
   * Ambas llamadas resuelven la misma promesa única almacenada en memoria, evitando múltiples solicitudes repetidas en la red y garantizando la coherencia visual.
