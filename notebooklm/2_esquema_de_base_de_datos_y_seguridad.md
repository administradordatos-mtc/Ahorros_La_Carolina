# Fuentes para NotebookLM — 2. Esquema de Base de Datos y Seguridad

Este documento detalla el esquema relacional de la base de datos PostgreSQL en Supabase y el diseño de la seguridad a nivel de fila (RLS).

---

## 1. Tabla: `perfiles`
Extiende la información de los usuarios registrados en Supabase Auth (`auth.users`) asociando un rol específico a cada cuenta.
* **Campos**:
  * `id`: `uuid` primary key (referencia a `auth.users(id)`).
  * `email`: `text` (correo electrónico del usuario).
  * `rol`: `text` (restricción CHECK para permitir únicamente `'administrador'`, `'directivo'`, o `'control_interno'`).
  * `created_at`: `timestamp with time zone`.
* **Políticas RLS**:
  * Lectura abierta para usuarios autenticados.
  * Modificación restringida al rol `'administrador'`.

---

## 2. Tabla: `departamentos`
Representa las áreas funcionales de Transportes La Carolina MTC donde se originan las iniciativas de ahorro.
* **Campos**:
  * `id`: `serial` primary key.
  * `nombre`: `text` unique (ej. "Operaciones", "Taller", "Sistemas", "Administración").
  * `descripcion`: `text`.
  * `created_at`: `timestamp with time zone`.
* **Políticas RLS**:
  * Lectura abierta para cualquier usuario autenticado.
  * Escritura/Modificación restringida al rol `'administrador'`.

---

## 3. Tabla: `iniciativas`
Registra los planes propuestos de ahorro anual y su estimación de rendimiento mensual de caja.
* **Campos**:
  * `id`: `uuid` primary key.
  * `departamento_id`: `integer` references `departamentos(id)` on delete cascade (área que origina el ahorro).
  * `nombre`: `text` (título de la iniciativa).
  * `tipo`: `text` (CHECK constraint: `'AHORRO'`, `'INGRESO'` o `'MIXTA'`).
  * `categoria`: `text` (ej. "Tecnología", "Combustible", "Flota").
  * `fecha_inicio_ejecucion`: `date` (fecha en la que el ahorro empezará a operar).
  * `pesimista_mes`: `numeric(15,2)` (estimación mensual en el peor escenario).
  * `base_mes`: `numeric(15,2)` (estimación mensual media).
  * `optimista_mes`: `numeric(15,2)` (estimación mensual en el mejor escenario).
  * `esperado_mes`: `numeric(15,2)` (ahorro mensual meta esperado).
  * `anual_esperado`: `numeric(15,2)` (cálculo proyectado de caja según los meses activos del año presupuestal).
  * `capex`: `numeric(15,2)` (inversión de capital requerida, opcional).
  * `payback_meses`: `numeric(5,1)` (tiempo de retorno de inversión en meses, opcional).
  * `roi_12m`: `numeric(6,1)` (retorno sobre la inversión proyectado a 12 meses, opcional).
  * `estado`: `text` (por defecto `'Iniciativa'`).
  * `notas`: `text` (comentarios y metodología de medición).
  * `created_at`: `timestamp with time zone`.
* **Políticas RLS**:
  * Lectura abierta para usuarios autenticados.
  * Inserción y borrado permitido únicamente a administradores (`rol = 'administrador'`).

---

## 4. Tabla: `iniciativas_ejecucion`
Tabla centralizada del pipeline de ejecución mensual. Registra el ahorro real obtenido mes a mes por cada iniciativa y su validación por auditoría.
* **Campos**:
  * `id`: `uuid` primary key.
  * `iniciativa_id`: `uuid` references `iniciativas(id)` on delete cascade (iniciativa auditada).
  * `mes`: `integer` (CHECK constraint entre `1` y `12`).
  * `anio`: `integer` (CHECK constraint superior o igual a `2020`).
  * `ahorro_real_ejecutado`: `numeric(15,2)` (ahorro efectivamente realizado en ese mes).
  * `estado_pipeline`: `text` (CHECK constraint: `'Pendiente'`, `'En Revisión'`, `'Validado'`, o `'Observado'`).
  * `observaciones`: `text` (observaciones del auditor de control interno).
  * `validado_por`: `uuid` references `auth.users(id)` (auditor que validó el registro).
  * `fecha_validacion`: `timestamp with time zone`.
  * `created_at` / `updated_at`: `timestamp with time zone`.
* **Restricción de Unicidad Compuesta**:
  * `constraint unique_iniciativa_mes_anio unique (iniciativa_id, mes, anio)`. Garantiza que solo exista **una fila** de ejecución para una iniciativa en un mes y año específicos, habilitando la operación de guardado interactivo por lote (`upsert`).
* **Políticas RLS**:
  * Lectura abierta para usuarios autenticados.
  * Inserción, actualización y borrado restringidos únicamente a administradores y personal de control interno (`public.es_control_interno_o_admin(auth.uid())`).

---

## 5. Funciones Auxiliares de Seguridad (PostgreSQL PL/pgSQL)
Para prevenir bucles de recursión infinita en las políticas RLS, se utilizan funciones auxiliares con la directiva `security definer`:

1. **`public.es_administrador(user_id uuid)`**:
   * Devuelve `true` si el perfil del usuario tiene `rol = 'administrador'`.
2. **`public.es_control_interno_o_admin(user_id uuid)`**:
   * Devuelve `true` si el perfil del usuario tiene `rol = 'administrador'` o `rol = 'control_interno'`.
