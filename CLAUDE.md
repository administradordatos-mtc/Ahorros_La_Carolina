# CLAUDE.md — Guía y Convenciones de Desarrollo

Este archivo documenta los comandos frecuentes, las convenciones de codificación y la arquitectura técnica del proyecto para facilitar el desarrollo continuo con agentes de IA.

---

## 1. Comandos de Consola Frecuentes

* **Servidor de Desarrollo**: `npm run dev`
* **Compilación de Producción**: `npm run build`
* **Previsualización de Producción**: `npm run preview`

---

## 2. Arquitectura y Estructura de Archivos

```text
├── dist/                          # Compilación estática resultante de Vite
├── src/
│   ├── js/
│   │   ├── auth.js                # Validación de sesiones y control de roles
│   │   ├── dashboard.js           # Lógica y gráficos del panel principal
│   │   ├── execution.js           # Registro, filtros y lógica de ejecución mensual
│   │   ├── initiatives.js         # Lista de iniciativas y estimaciones
│   │   ├── kpis.js                # Métricas de rendimiento
│   │   ├── supabase.js            # Cliente e inicialización de base de datos
│   │   └── users.js               # Creación y gestión de cuentas
├── supabase/                      # Scripts SQL de base de datos (schema/seeds)
├── *.html                         # Archivos de la vista de la SPA
└── package.json                   # Configuración del empaquetador Vite
```

---

## 3. Convenciones de Código

### A. Autenticación y Carga Segura
* **Caché de Sesión**: Toda página o script que requiera datos autenticados debe usar `checkSession()` de `src/js/auth.js`.
* **Secuenciamiento**: Siempre utilizar `await checkSession()` antes de realizar consultas a Supabase para evitar rechazos de RLS.
* **Visibilidad**: Mantener `visibility: hidden` en el cuerpo del documento (`body`) y activarlo con `document.body.style.visibility = 'visible'` una vez confirmada la sesión.

### B. Rendimiento del Scroll y Eventos
* Evitar consultas de selección del DOM (ej. `document.querySelector`) dentro de bucles continuos (como escuchadores de `scroll`). Almacenar la referencia en una variable estática externa.
* Utilizar `{ passive: true }` en escuchadores de desplazamiento para evitar bloqueos del hilo principal del navegador.

### C. Fechas
* Para formatear fechas en formato `YYYY-MM-DD`, evitar `toLocaleDateString` de forma directa y usar en su lugar concatenación limpia y rellenos con ceros (`padStart(2, '0')`) para evitar discrepancias en diferentes motores de JavaScript.

### D. Iniciativas de Ahorro y Afectación de Caja
* **Foco en Iniciativas**: El control presupuestal y de ahorros se centra en las **Iniciativas de Ahorro**, eliminando las metas y gastos independientes. Las iniciativas inician en estado `'Iniciativa'`.
* **Cálculo de Ahorros Acumulados**: El ahorro anual proyectado se calcula en función de la `fecha_inicio_ejecucion`, multiplicando el valor `esperado_mes` por los meses activos restantes en el año (`12 - mes_inicio + 1`).
* **Ejecución Mensual y Ahorro Real**: El ahorro real se registra mes a mes en la tabla `iniciativas_ejecucion` con los campos de ahorro real y estado de pipeline. El ahorro real validado acumulado se determina sumando el ahorro real ejecutado de las filas en estado `'Validado'` en el año presupuestal actual.
* **Dashboard Acumulado (12 Meses)**: Muestra curvas acumulativas mensuales del ahorro proyectado (Meta) y del ahorro real mensual validado (Real) de la tabla `iniciativas_ejecucion` para simular el impacto real en la caja de la empresa.
