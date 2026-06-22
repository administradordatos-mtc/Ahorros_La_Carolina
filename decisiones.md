# Registro de Decisiones de Diseño (ADR) — Ahorros La Carolina

Este documento registra las decisiones arquitectónicas y de diseño técnico tomadas durante las refactorizaciones y correcciones del día.

---

## 1. Concurrencia de Autenticación: Patrón de Caché de Promesas
* **Decisión**: Almacenar en caché el objeto Promise resultante de `supabase.auth.getSession()` dentro del módulo `auth.js`.
* **Contexto**: Las páginas del dashboard invocan la autenticación de forma asíncrona tanto en scripts inline (para controlar visibilidad) como en scripts modulares de vista (para cargar datos).
* **Razón**: Evita la duplicación de solicitudes de autenticación en la red y sincroniza la visibilidad del DOM con la carga de datos, eliminando condiciones de carrera.

---

## 2. Gestión de Roles: Acceso de Lectura a Directivos en Metas
* **Decisión**: Permitir a usuarios de rol `directivo` acceder a `goals.html` de forma regular, pero ocultar dinámicamente el botón de creación (`#btn-nueva-meta`).
* **Contexto**: Antes los directivos eran redirigidos abruptamente a `index.html?access_denied=true`, lo que generaba confusión y cortes bruscos en la experiencia.
* **Razón**: Permite la visualización de cifras de ahorro y KPIs (lectura) a todos los roles, manteniendo las restricciones de escritura sólo para administradores.

---

## 3. Optimización de Parallax: Evento de Scroll Pasivo y Caché de Selector
* **Decisión**: Extraer `document.querySelector` fuera del manejador del evento `scroll` y registrar la función con `{ passive: true }`.
* **Contexto**: Consultar el DOM repetidamente en cada pixel de desplazamiento causaba recálculos de diseño síncronos (*layout thrashing*).
* **Razón**: Reduce drásticamente la carga de la CPU y permite una navegación fluida, previniendo congelamientos de la interfaz del navegador.

---

## 4. Formateo de Fechas: Constructor Manual en lugar de `en-CA`
* **Decisión**: Construir el formato de fecha `YYYY-MM-DD` manualmente concatenando año, mes y día con relleno (`padStart`).
* **Contexto**: El uso de `toLocaleDateString('en-CA')` producía resultados incompatibles y excepciones críticas en motores de renderizado más antiguos o integrados (webviews).
* **Razón**: Garantiza consistencia absoluta en el formato de fecha enviado a Supabase en cualquier plataforma.

---

## 5. Reestructuración de Metas a Formato Mensual
* **Decisión**: Cambiar la granularidad del presupuesto de metas semanales a mensuales (`metas_mensuales`) e implementar una llave única compuesta (`departamento_id`, `concepto_id`, `mes`, `anio`).
* **Contexto**: El presupuesto general y los reportes ejecutivos operan de forma mensual, por lo que la granularidad semanal en metas generaba excesiva redundancia y complejidad de cálculo.
* **Razón**: Permite simplificar la lógica de control interno y emparejar directamente el presupuesto mensual con el plan de iniciativas por departamento.

---

## 6. Proyección por Lote (Lógica de Generación Automática)
* **Decisión**: Al guardar una meta, generar registros mensuales de forma masiva desde el mes de inicio seleccionado hasta el mes 12 (Diciembre) del año presupuestal en curso.
* **Contexto**: Los directivos e interventores requerían registrar metas mensuales que permanecen estables hasta fin de año sin necesidad de cargarlas mes a mes manualmente.
* **Razón**: Optimiza el tiempo de configuración presupuestal del administrador y garantiza que el pipeline de ahorros mensuales proyecte de forma completa la meta hasta el cierre del año fiscal.

---

## 7. Tablero Pipeline y Rol de Control Interno
* **Decisión**: Introducir el rol `'control_interno'` y la tabla `validaciones_ahorros` con RLS dedicada para rastrear el ahorro real efectivamente ejecutado.
* **Contexto**: Se necesitaba un flujo de control independiente (pipeline) donde un auditor valide el ahorro proyectado frente al ahorro realmente ejecutado.
* **Razón**: Permite separar la responsabilidad del registro del gasto y el cálculo del ahorro proyectado frente a la auditoría del ahorro neto efectivamente ejecutado, introduciendo estados formales (`Pendiente`, `En Revisión`, `Validado`, `Observado`).

---

## 8. Mantenimiento de Parámetros Dinámicos en UI
* **Decisión**: Habilitar en la interfaz de metas (`goals.html`) la creación y eliminación en cascada de Departamentos y Conceptos presupuestales.
* **Contexto**: Anteriormente las categorías de gasto y meta estaban restringidas por un CHECK constraint estático en PostgreSQL.
* **Razón**: Otorga flexibilidad operativa para expandir o modificar la estructura presupuestal de la empresa sin requerir cambios de código o consultas directas a la base de datos por parte del equipo de TI.
