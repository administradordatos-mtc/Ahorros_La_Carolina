# Tareas Pendientes — Ahorros La Carolina

Este documento lista las tareas pendientes y próximas mejoras identificadas para la Plataforma de Control de Ahorros Operativos.

---

## 1. Próximas Mejoras y Refactorizaciones

### A. Alertas de Validación Financiera
* Implementar alertas automáticas si el Ahorro Real Ejecutado registrado excede de forma desmedida el Ahorro Esperado Mes, sirviendo como filtro preventivo ante errores tipográficos al registrar montos.

### B. Feedback Visual de Carga (Spinners)
* Ya implementado en la vista de ejecución (`execution.html`) y reportes (`reports.html`). Se puede replicar este spinner de carga en otras vistas principales (`index.html`, `initiatives.html`, `kpis.html`) para mitigar la percepción de retraso durante la inicialización de Supabase y validación de sesión.

### C. Pruebas de Carga y Concurrencia
* Validar el comportamiento de la caché de promesas de sesión ante conexiones lentas (simulación de red lenta en Chrome DevTools) para asegurar que no ocurran retrasos molestos de renderizado.

### D. Despliegue y Pruebas en Staging
* Confirmar que la estructura de la tabla `iniciativas_ejecucion` y políticas de RLS en el entorno de producción de Supabase coincidan exactamente con el script SQL de migración y base de datos de desarrollo.


---

## 2. Automatización y Calidad de Código
* Configurar linters y formateadores (Prettier/ESLint) para asegurar la uniformidad en el espaciado de tablas y layouts.
* Diseñar pruebas de integración automáticas para verificar que la redirección por falta de sesión funcione correctamente sin depender de intervención manual.
