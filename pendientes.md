# Tareas Pendientes — Ahorros La Carolina

Este documento lista las tareas pendientes y próximas mejoras identificadas para la Plataforma de Control de Ahorros Operativos.

---

## 1. Próximas Mejoras y Refactorizaciones

### A. Feedback Visual de Carga (Spinners)
* Añadir un componente de indicador de carga (spinner o esqueleto animado) en la sección principal de datos de cada página (`index.html`, `goals.html`, `expenses.html`, etc.) para mitigar la percepción de retraso durante la autenticación y consulta inicial.

### B. Pruebas de Carga y Concurrencia
* Validar el comportamiento de la caché de promesas de sesión ante conexiones lentas (simulación 3G/2G en Chrome DevTools) para asegurar que no ocurran efectos colaterales de renderizado.

### C. Despliegue y Pruebas en Staging
* Validar que la autenticación y políticas de RLS en el entorno de producción de Supabase y Vercel coincidan exactamente con la base de datos de desarrollo.

---

## 2. Automatización y Calidad de Código
* Configurar linters y formateadores (Prettier/ESLint) para asegurar que el espaciado de las tablas y layouts sea uniforme.
* Diseñar pruebas de integración automáticas para verificar que la redirección por falta de sesión funcione correctamente sin depender de intervención manual.
