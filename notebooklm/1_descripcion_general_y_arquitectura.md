# Fuentes para NotebookLM — 1. Descripción General y Arquitectura

Este documento proporciona una visión general y la arquitectura técnica de la Plataforma de Control de Ahorros Operativos para **Transportes La Carolina MTC**, diseñada como fuente de base de conocimiento para NotebookLM.

---

## 1. Objetivo General del Proyecto
El proyecto está diseñado para controlar, proyectar y auditar de forma mensual las **Iniciativas de Ahorro Presupuestal** de la empresa por departamento. El objetivo principal es medir el impacto financiero real en la caja de la compañía a través de un ciclo completo que va desde la propuesta de ahorro inicial hasta la validación física de su ejecución mensual por parte del equipo de Control Interno.

---

## 2. Pila Tecnológica (Stack Tecnológico)
La aplicación está construida siguiendo un enfoque de alto rendimiento, ligereza y diseño premium (Dark Mode):
1. **Frontend**:
   * **Estructura**: HTML5 semántico.
   * **Estilos**: CSS3 nativo y Tailwind CSS (cargado vía CDN con extensiones de formularios y contenedores interactivos) para un estilo visual unificado y animaciones fluidas.
   * **Lógica**: JavaScript (ES Modules) nativo para control reactivo del DOM.
   * **Herramienta de Compilación**: Vite.js para el empaquetado y optimización de recursos en producción.
2. **Backend e Infraestructura**:
   * **Base de Datos**: PostgreSQL alojado en Supabase.
   * **Autenticación**: Supabase Auth (correo y contraseña).
   * **Seguridad**: Políticas de Seguridad a Nivel de Fila (RLS) en PostgreSQL para controlar el acceso a nivel de registros según el rol del usuario.

---

## 3. Estructura de Archivos del Proyecto
El proyecto sigue una estructura organizada por módulos y responsabilidades:

```text
├── dist/                          # Archivos estáticos optimizados generados por Vite para producción
├── src/
│   ├── js/
│   │   ├── auth.js                # Control de sesión, permisos y caché de promesas de login
│   │   ├── supabase.js            # Inicialización del cliente Supabase con credenciales del entorno
│   │   ├── dashboard.js           # Lógica de KPI Bento y gráficos de tendencias acumulativas de 12 meses
│   │   ├── initiatives.js         # Modal e inserción de iniciativas de ahorro presupuestal
│   │   ├── execution.js           # Lógica interactiva de Tabla y Kanban con Drag & Drop para ejecución mensual
│   │   ├── reports.js             # Lógica analítica interactiva de Reportes Ejecutivos, exportación CSV e impresión PDF
│   │   ├── kpis.js                # Control de valores de indicadores generales
│   │   └── users.js               # Creación y administración de perfiles y restablecimiento de claves
├── supabase/                      # Migraciones, esquemas SQL y semilla de datos (seeds)
├── index.html                     # Vista del Dashboard Principal (KPI Bento y Gráfico Anual)
├── initiatives.html               # Vista de registro de iniciativas de ahorro
├── execution.html                 # Vista del Tablero de Ejecución (Tabla y Kanban interactivo)
├── kpis.html                      # Vista de indicadores de rendimiento
├── users.html                     # Vista de administración de usuarios y roles
├── reports.html                   # Vista de reportes consolidados
├── login.html                     # Vista de inicio de sesión
├── package.json                   # Dependencias, scripts de Vite y metadatos del empaquetado
└── vite.config.js                 # Configuración de Rollup, alias y constantes inyectadas (rama git)
```

---

## 4. Convenciones de Codificación Clave
* ** DRY (Don't Repeat Yourself)**: Lógicas transversales (como el chequeo de roles o la inyección del badge de la rama git actual) se centralizan en `auth.js`.
* **Caché de Autenticación**: Para prevenir cuellos de botella y rechazos de políticas RLS debido a consultas concurrentes de sesión al cargar la página, `auth.js` implementa un patrón de caché de promesa única (`currentSessionPromise`).
* **Seguridad RLS Obligatoria**: Cualquier consulta de datos a Supabase en el cliente JavaScript se realiza *después* de que `checkSession()` resuelva con éxito.
* **Formateo Seguro de Fechas**: Todas las fechas de base de datos se formatean manualmente (`YYYY-MM-DD`) concatenando componentes y rellenando con ceros (`padStart`) para garantizar compatibilidad entre motores web.
