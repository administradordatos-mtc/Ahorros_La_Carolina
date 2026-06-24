# Fuentes para NotebookLM — 5. Registro de Decisiones de Diseño (ADR)

Este documento contiene el registro detallado de las Decisiones Arquitectónicas y de Diseño Técnico (ADR, Architectural Decision Records) que han guiado la evolución y refactorizaciones críticas de la Plataforma de Control de Ahorros Operativos para **Transportes La Carolina MTC**.

---

## 1. Introducción y Propósito
El objetivo de registrar estas decisiones es mantener la trazabilidad de por qué se eligieron ciertas soluciones técnicas frente a problemas específicos de rendimiento, experiencia de usuario (UX), seguridad y concurrencia. Esto garantiza que cualquier desarrollador o IA que trabaje sobre el código respete los patrones arquitectónicos adoptados.

---

## 2. Decisiones Técnicas y Arquitectónicas (ADR)

### ADR 1: Concurrencia de Autenticación mediante Caché de Promesas
* **Contexto**: Las páginas del panel cargan dinámicamente datos mediante módulos JS y a la vez ejecutan un script en línea para comprobar la visibilidad del DOM en función del rol. Esto producía llamadas concurrentes e independientes a `supabase.auth.getSession()`.
* **Problema**: El envío múltiple y simultáneo de solicitudes de sesión saturaba la red del cliente y provocaba condiciones de carrera donde la consulta a la base de datos de un módulo fallaba con errores de Seguridad a Nivel de Fila (RLS) porque la sesión no se había validado en el otro script.
* **Decisión**: Almacenar en caché el objeto `Promise` retornado por `supabase.auth.getSession()` en una variable global del módulo `auth.js` (`currentSessionPromise`).
* **Razón**: Múltiples llamadas a `checkSession()` devuelven e interactúan con la misma promesa original. Esto evita solicitudes duplicadas a la API y garantiza que la sesión esté completamente establecida antes de realizar consultas de base de datos.

### ADR 2: Acceso Controlado de Directivos a la Configuración
* **Contexto**: La sección de configuración y metas presupuestales estaba bloqueada para directivos, redireccionando automáticamente a un mensaje de "Acceso Denegado".
* **Problema**: Los usuarios con el rol `directivo` necesitaban ver los KPI de ahorro y límites de meta, pero el bloqueo total interrumpía la navegación y experiencia ejecutiva.
* **Decisión**: Habilitar el acceso a las vistas de metas y parámetros generales a los directivos, pero ocultar y desactivar mediante manipulación reactiva del DOM todos los botones de creación, edición y borrado (por ejemplo, `#btn-nueva-meta`).
* **Razón**: Permite mantener el principio de lectura general para la toma de decisiones directivas sin comprometer la integridad de la base de datos al limitar la escritura estrictamente al rol `administrador`.

### ADR 3: Optimización del Rendimiento en Desplazamiento (Scroll Parallax)
* **Contexto**: Se utilizaba un efecto parallax en cabeceras de tablas y secciones estéticas.
* **Problema**: El manejador del evento `scroll` realizaba consultas de selección del DOM (`document.querySelector`) en cada píxel recorrido, provocando *layout thrashing* (recálculos síncronos de diseño) y caídas de fotogramas (lag) en el navegador.
* **Decisión**: Extraer las consultas de elementos del DOM del manejador de scroll y pasarlas a variables en el ámbito del módulo. Además, se configuró el event listener con la opción `{ passive: true }`.
* **Razón**: Indicar al navegador que el escuchador es pasivo previene el bloqueo del desplazamiento mientras se ejecuta la lógica JS, y el almacenamiento en caché del selector del DOM reduce la carga en la CPU.

### ADR 4: Normalización del Formateo de Fechas en Cliente
* **Contexto**: Se requiere enviar fechas a Supabase en formato estándar `YYYY-MM-DD`.
* **Problema**: El uso previo de `toLocaleDateString('en-CA')` dependía del motor JavaScript del navegador del cliente y su localización local, lo que causaba excepciones críticas en navegadores integrados o versiones webview antiguas.
* **Decisión**: Implementar una función helper en el frontend para construir el string `YYYY-MM-DD` de forma puramente manual concatenando el año, mes y día de forma numérica, rellenando con ceros (`padStart(2, '0')`).
* **Razón**: Otorga consistencia absoluta del formato de fecha enviado a PostgreSQL sin importar el cliente web utilizado.

### ADR 5: Migración de Presupuestos Semanales a Metas Mensuales
* **Contexto**: Anteriormente el control de límites de gasto se realizaba a nivel de "vales" y metas semanales.
* **Problema**: Los reportes generales de finanzas de Transportes La Carolina operan a nivel mensual, y la granularidad semanal generaba un volumen de datos innecesario y fórmulas matemáticas de conversión propensas a errores.
* **Decisión**: Rediseñar el esquema presupuestal a Metas Mensuales (`metas_mensuales`) estableciendo una llave única compuesta por `(departamento_id, concepto_id, mes, anio)`.
* **Razón**: Simplifica drásticamente el flujo de trabajo para el control interno de caja y se integra de manera natural con el ciclo de facturación de la empresa.

### ADR 6: Proyección Presupuestal por Lote (Bulk Upsert)
* **Contexto**: Al crear una meta mensual de departamento, el administrador típicamente desea replicarla para los meses restantes del año presupuestal en curso.
* **Problema**: Registrar mes por mes de manera manual era un proceso administrativo lento y propenso a omisiones.
* **Decisión**: Generar de forma automática y asíncrona un lote de registros desde el mes de inicio seleccionado hasta el mes 12 (Diciembre) del año en curso, enviándolo todo a la base de datos a través de una operación única de `.upsert()` en lote.
* **Razón**: Garantiza la presencia completa del presupuesto del año presupuestal con un solo clic y minimiza las solicitudes de red.

### ADR 7: Estructura Unificada de Ejecución Mensual por Iniciativa
* **Contexto**: El modelo clásico de registrar gastos semanales individuales y compararlos contra presupuestos globales no permitía evaluar el impacto directo de las iniciativas de ahorro.
* **Problema**: No se podía auditar de manera detallada el desempeño mes a mes de una iniciativa de ahorro aprobada específica.
* **Decisión**: Implementar una tabla relacional dedicada llamada `iniciativas_ejecucion` con clave compuesta `(iniciativa_id, mes, anio)`.
* **Razón**: Permite desacoplar la estimación anual (iniciativa de ahorro inicial) de los resultados reales validados mensualmente por Control Interno, guardando de forma explícita el ahorro real, estado de la validación y observaciones específicas por mes.

### ADR 8: Inyección Síncrona de Rama Git Activa en Build-Time
* **Contexto**: Para entornos de desarrollo y staging, es vital visualizar de forma rápida en qué versión/rama del repositorio Git se encuentra desplegada la interfaz.
* **Problema**: Replicar un badge estático en cada archivo HTML causaba duplicidad y complejidad en la actualización del código.
* **Decisión**: Ejecutar el comando `git rev-parse --abbrev-ref HEAD` de forma síncrona dentro de `vite.config.js` durante la fase de empaquetado para definir la variable de entorno de compilación `__GIT_BRANCH__`. En el cliente, `auth.js` inyecta automáticamente un badge dinámico (`#git-branch-badge`) en la cabecera durante la validación de la sesión.
* **Razón**: Centraliza y automatiza la presentación del entorno de desarrollo sin duplicación de código en el DOM HTML (principio DRY).
