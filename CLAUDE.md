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
│   │   ├── expenses.js            # Registro y cálculos de gastos semanales
│   │   ├── goals.js               # Semáforos y KPIs de metas semanales
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
