# claude-obsidian: Agent Instructions

This repo is a Claude Code plugin **and** an Obsidian vault that builds persistent, compounding knowledge bases using Andrej Karpathy's LLM Wiki pattern.

## Available Skills

- speckit-plan
- speckit-specify
- speckit-tasks
- speckit-implement
- speckit-analyze

## Recent Accomplishments (June 22, 2026)

* **Reestructuración a Metas Mensuales**: Reemplazadas las metas semanales y las categorías estáticas en `goals.html` y `goals.js` por una arquitectura de Metas Mensuales, utilizando el catálogo de Departamentos y el nuevo Maestro de Conceptos presupuestales.
* **Proyección de Metas por Lote**: Lógica de guardado mensual que genera de forma automática y asíncrona proyecciones de límites de gasto mensuales desde el mes de inicio del ahorro hasta el 31 de diciembre del año presupuestal en Supabase.
* **Tablero de Validación Pipeline**: Nueva interfaz y lógica para Control Interno (`'control_interno'`) y Administradores que calcula ahorros proyectados (Meta - Gasto Real) y permite registrar el ahorro real efectivamente ejecutado, cambiar el estado del pipeline (`Pendiente`, `En Revisión`, `Validado`, `Observado`) y añadir observaciones de control.
* **Parámetros Generales**: Nueva pestaña interactiva que permite a los Administradores realizar el mantenimiento (creación, listado y eliminación en cascada) de Departamentos y Conceptos presupuestales directamente desde la interfaz.
* **Compatibilidad de Gastos**: Agrupación inteligente de registros de `gastos_semanales` por concepto, mes y año para calcular el gasto real acumulado por departamento manteniendo compatibilidad retroactiva.

## Recent Accomplishments (June 17, 2026)

* **Layout & Spacing**: Resolved density of views, increasing sidebar elements to `space-y-3` and table rows to `py-4 px-6`.
* **Goals View (Access & Role Control)**: Opened view to directivo roles, hiding the form controls programmatically.
* **Async Concurrency Fix**: Caching of checkSession promises in `auth.js` to prevent double execution and database RLS errors.
* **Scroll & Parallax Fix**: Removed continuous query selector inside scroll loops, used passive event listeners, and safe fallback scroll offsets.

## Knowledge base files
* [memoria.md](file:///c:/Users/administradordatos/TRANSPORTES%20LA%20CAROLINA/Administracion%20Datos%20-%20Documentos/La%20Carolina%20De%20Transporte/Projects/Ahorros_La_Carolina/memoria.md) — Complete memory log of today's work.
* [pendientes.md](file:///c:/Users/administradordatos/TRANSPORTES%20LA%20CAROLINA/Administracion%20Datos%20-%20Documentos/La%20Carolina%20De%20Transporte/Projects/Ahorros_La_Carolina/pendientes.md) — Product backlog and pending features.
* [decisiones.md](file:///c:/Users/administradordatos/TRANSPORTES%20LA%20CAROLINA/Administracion%20Datos%20-%20Documentos/La%20Carolina%20De%20Transporte/Projects/Ahorros_La_Carolina/decisiones.md) — Technical and design decisions.
* [CLAUDE.md](file:///c:/Users/administradordatos/TRANSPORTES%20LA%20CAROLINA/Administracion%20Datos%20-%20Documentos/La%20Carolina%20De%20Transporte/Projects/Ahorros_La_Carolina/CLAUDE.md) — Code guidelines and routing structure.
* [cloud.md](file:///c:/Users/administradordatos/TRANSPORTES%20LA%20CAROLINA/Administracion%20Datos%20-%20Documentos/La%20Carolina%20De%20Transporte/Projects/Ahorros_La_Carolina/cloud.md) — Redundant copy of guidelines.
* [task.md](file:///C:/Users/administradordatos/.gemini/antigravity/brain/20a6bbac-6412-4850-857a-4739fc40d811/task.md) — Current task board status.
