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
