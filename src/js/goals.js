import { supabase } from './supabase.js';
import { checkSession } from './auth.js';

// DOM elements - Tabs
const tabMetas = document.getElementById('tab-metas');
const tabValidacion = document.getElementById('tab-validacion');
const tabParametros = document.getElementById('tab-parametros');

const sectionMetas = document.getElementById('section-metas');
const sectionValidacion = document.getElementById('section-validacion');
const sectionParametros = document.getElementById('section-parametros');

// DOM elements - Modal
const btnNuevaMeta = document.getElementById('btn-nueva-meta');
const btnCloseModal = document.getElementById('btn-close-modal');
const modal = document.getElementById('new-goal-modal');
const form = document.getElementById('goal-form');

const selectGoalDept = document.getElementById('goal-dept');
const selectGoalConcepto = document.getElementById('goal-concepto');
const inputGoalAmount = document.getElementById('goal-amount');
const selectGoalStartMonth = document.getElementById('goal-start-month');
const inputGoalYear = document.getElementById('goal-year');
const inputGoalDate = document.getElementById('goal-date');

// DOM elements - Goals List & Filters
const goalsGridContainer = document.getElementById('goals-grid-container');
const filterDept = document.getElementById('filter-dept');
const filterConcepto = document.getElementById('filter-concepto');
const filterMonth = document.getElementById('filter-month');
const filterYear = document.getElementById('filter-year');

// DOM elements - KPIs
const kpiTasaCumplimiento = document.getElementById('kpi-tasa-cumplimiento');
const kpiDesviacionTotal = document.getElementById('kpi-desviacion-total');
const kpiDesviacionLabel = document.getElementById('kpi-desviacion-label');
const kpiCategoriaCritica = document.getElementById('kpi-categoria-critica');

// DOM elements - Validation Panel
const valFilterMonth = document.getElementById('val-filter-month');
const valFilterYear = document.getElementById('val-filter-year');
const valFilterDept = document.getElementById('val-filter-dept');
const validationTableBody = document.getElementById('validation-table-body');

// DOM elements - Parametros
const deptForm = document.getElementById('dept-form');
const inputNewDeptName = document.getElementById('new-dept-name');
const deptsListBody = document.getElementById('depts-list-body');

const conceptoForm = document.getElementById('concepto-form');
const inputNewConceptoName = document.getElementById('new-concepto-name');
const inputNewConceptoDesc = document.getElementById('new-concepto-desc');
const conceptosListBody = document.getElementById('conceptos-list-body');

// State Variables
let currentUser = null;
let userRole = 'directivo';
let userDeptId = null;

let allDepartamentos = [];
let allConceptos = [];
let allMetasMensuales = [];
let allGastosSemanales = [];
let allValidacionesAhorros = [];

// Formateador de moneda
const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(val || 0);
};

// Obtener mes y año actual
const today = new Date();
const actualMonth = today.getMonth() + 1;
const actualYear = today.getFullYear();

// Inicializar fechas por defecto en el modal
if (inputGoalYear) inputGoalYear.value = actualYear;
if (selectGoalStartMonth) selectGoalStartMonth.value = actualMonth;
if (inputGoalDate) {
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    inputGoalDate.value = `${yyyy}-${mm}-${dd}`;
}

// Inicializar aplicación
const init = async () => {
    try {
        if (!supabase) {
            console.warn('Goals: Supabase client is not initialized.');
            mostrarErrorVisual(new Error('El cliente de Supabase no está configurado.'));
            return;
        }

        // 1. Validar la sesión
        const session = await checkSession();
        if (!session) return; // checkSession maneja la redirección

        currentUser = session.user || session;
        userRole = session.rol || 'directivo';
        userDeptId = session.departamento_id || null;

        document.body.style.visibility = 'visible';

        // 2. Control de accesos por rol
        // Si el rol es directivo, ocultamos el botón de crear meta
        if (userRole === 'directivo' && btnNuevaMeta) {
            btnNuevaMeta.classList.add('hidden');
        }
        
        // Mostrar pestaña parámetros solo para administrador
        if (userRole === 'administrador' && tabParametros) {
            tabParametros.classList.remove('hidden');
        }

        // 3. Cargar catálogos iniciales
        await loadCatalogs();

        // 4. Cargar datos principales
        await loadInitialData();

        // 5. Configurar manejadores de eventos
        setupEventListeners();

    } catch (error) {
        console.error('Error crítico durante la inicialización de Metas:', error);
        mostrarErrorVisual(error);
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

/**
 * Carga los catálogos de Departamentos y Conceptos
 */
async function loadCatalogs() {
    try {
        const { data: depts, error: deptsError } = await supabase
            .from('departamentos')
            .select('*')
            .order('nombre', { ascending: true });

        const { data: concts, error: conctsError } = await supabase
            .from('conceptos')
            .select('*')
            .order('nombre', { ascending: true });

        if (deptsError) throw deptsError;
        if (conctsError) throw conctsError;

        allDepartamentos = depts || [];
        allConceptos = concts || [];

        // Llenar selectores del modal
        populateSelect(selectGoalDept, allDepartamentos, 'id', 'nombre', 'Seleccione un departamento');
        populateSelect(selectGoalConcepto, allConceptos, 'id', 'nombre', 'Seleccione un concepto');

        // Llenar selectores de filtros
        populateSelect(filterDept, allDepartamentos, 'id', 'nombre', 'Todos los departamentos');
        populateSelect(filterConcepto, allConceptos, 'id', 'nombre', 'Todos los conceptos');
        populateSelect(valFilterDept, allDepartamentos, 'id', 'nombre', 'Todos los departamentos');

        // Si el usuario es directivo, auto-seleccionar y deshabilitar filtro de departamento
        if (userRole === 'directivo' && userDeptId) {
            if (filterDept) {
                filterDept.value = userDeptId;
                filterDept.disabled = true;
            }
            if (valFilterDept) {
                valFilterDept.value = userDeptId;
                valFilterDept.disabled = true;
            }
            if (selectGoalDept) {
                selectGoalDept.value = userDeptId;
                selectGoalDept.disabled = true;
            }
        }

    } catch (err) {
        console.error('Error al cargar catálogos:', err);
        alert('Error al cargar parámetros: ' + err.message);
    }
}

/**
 * Llena dinámicamente un elemento select con datos
 */
function populateSelect(selectElement, dataArray, valueKey, textKey, defaultText) {
    if (!selectElement) return;
    
    // Guardar el valor seleccionado actual para mantenerlo si es posible
    const currentValue = selectElement.value;
    
    selectElement.innerHTML = `<option value="">${defaultText}</option>`;
    dataArray.forEach(item => {
        const opt = document.createElement('option');
        opt.value = item[valueKey];
        opt.textContent = item[textKey];
        selectElement.appendChild(opt);
    });

    if (currentValue && [...selectElement.options].some(o => o.value === currentValue)) {
        selectElement.value = currentValue;
    }
}

/**
 * Carga metas mensuales, gastos semanales y validaciones
 */
async function loadInitialData() {
    try {
        const { data: metas, error: metasError } = await supabase
            .from('metas_mensuales')
            .select('*');

        const { data: gastos, error: gastosError } = await supabase
            .from('gastos_semanales')
            .select('*');

        const { data: valids, error: validsError } = await supabase
            .from('validaciones_ahorros')
            .select('*');

        if (metasError) throw metasError;
        if (gastosError) throw gastosError;
        if (validsError) throw validsError;

        allMetasMensuales = metas || [];
        allGastosSemanales = gastos || [];
        allValidacionesAhorros = valids || [];

        // Si es pestaña activa, renderizar correspondientes
        if (sectionMetas && !sectionMetas.classList.contains('hidden')) {
            calculateAndRenderKPIs();
            renderMetasGrid();
        } else if (sectionValidacion && !sectionValidacion.classList.contains('hidden')) {
            renderValidationTable();
        } else if (sectionParametros && !sectionParametros.classList.contains('hidden')) {
            renderParametrosLists();
        }

    } catch (err) {
        console.error('Error al cargar datos principales:', err);
        mostrarErrorVisual(err);
    }
}

/**
 * Configura los escuchadores de eventos DOM
 */
function setupEventListeners() {
    // Tab switching
    if (tabMetas) tabMetas.addEventListener('click', () => switchTab('metas'));
    if (tabValidacion) tabValidacion.addEventListener('click', () => switchTab('validacion'));
    if (tabParametros) tabParametros.addEventListener('click', () => switchTab('parametros'));

    // Filtros de metas
    if (filterDept) filterDept.addEventListener('change', renderMetasGrid);
    if (filterConcepto) filterConcepto.addEventListener('change', renderMetasGrid);
    if (filterMonth) filterMonth.addEventListener('change', renderMetasGrid);
    if (filterYear) filterYear.addEventListener('change', renderMetasGrid);

    // Filtros de validación
    if (valFilterMonth) valFilterMonth.addEventListener('change', renderValidationTable);
    if (valFilterYear) valFilterYear.addEventListener('change', renderValidationTable);
    if (valFilterDept) valFilterDept.addEventListener('change', renderValidationTable);

    // Modal abrir/cerrar
    if (btnNuevaMeta && modal) {
        btnNuevaMeta.addEventListener('click', () => {
            modal.classList.remove('hidden');
            if (userRole === 'directivo' && userDeptId && selectGoalDept) {
                selectGoalDept.value = userDeptId;
                selectGoalDept.disabled = true;
            }
        });
    }
    if (btnCloseModal && modal) {
        btnCloseModal.addEventListener('click', () => modal.classList.add('hidden'));
    }
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.add('hidden');
        });
    }

    // Guardar Meta y Proyectar (Lote)
    if (form) {
        form.addEventListener('submit', handleNewGoalSubmit);
    }

    // Formularios de Parámetros
    if (deptForm) {
        deptForm.addEventListener('submit', handleNewDeptSubmit);
    }
    if (conceptoForm) {
        conceptoForm.addEventListener('submit', handleNewConceptoSubmit);
    }
}

/**
 * Maneja el cambio de pestañas de navegación
 */
function switchTab(tabName) {
    // Botones
    [tabMetas, tabValidacion, tabParametros].forEach(btn => {
        if (btn) {
            btn.classList.remove('border-primary', 'text-primary');
            btn.classList.add('border-transparent', 'text-on-surface-variant');
        }
    });

    // Secciones
    [sectionMetas, sectionValidacion, sectionParametros].forEach(sec => {
        if (sec) sec.classList.add('hidden');
    });

    if (tabName === 'metas') {
        if (tabMetas) {
            tabMetas.classList.remove('border-transparent', 'text-on-surface-variant');
            tabMetas.classList.add('border-primary', 'text-primary');
        }
        if (sectionMetas) sectionMetas.classList.remove('hidden');
        calculateAndRenderKPIs();
        renderMetasGrid();
    } else if (tabName === 'validacion') {
        if (tabValidacion) {
            tabValidacion.classList.remove('border-transparent', 'text-on-surface-variant');
            tabValidacion.classList.add('border-primary', 'text-primary');
        }
        if (sectionValidacion) sectionValidacion.classList.remove('hidden');
        renderValidationTable();
    } else if (tabName === 'parametros') {
        if (tabParametros) {
            tabParametros.classList.remove('border-transparent', 'text-on-surface-variant');
            tabParametros.classList.add('border-primary', 'text-primary');
        }
        if (sectionParametros) sectionParametros.classList.remove('hidden');
        renderParametrosLists();
    }
}

/**
 * Calcula gasto real acumulado por mes, año, concepto y opcionalmente departamento
 */
function getGastoMensual(deptId, conceptoNombre, mes, anio) {
    return allGastosSemanales
        .filter(g => {
            const gDate = new Date(g.fecha + 'T12:00:00');
            const gMes = gDate.getMonth() + 1;
            const gAnio = gDate.getFullYear();
            const matchPeriod = gMes === mes && gAnio === anio;
            const matchConcepto = g.categoria === conceptoNombre;
            
            // Si el gasto tiene la columna departamento_id de forma nativa la validamos
            // de lo contrario se considera retrocompatible (se asume del departamento que lo tiene)
            const matchDept = !g.departamento_id || g.departamento_id === deptId;
            
            return matchPeriod && matchConcepto && matchDept;
        })
        .reduce((sum, g) => sum + (Number(g.monto_gasto) || 0), 0);
}

/**
 * Calcula y renderiza indicadores de KPI en el dashboard de metas
 */
function calculateAndRenderKPIs() {
    if (allMetasMensuales.length === 0) {
        if (kpiTasaCumplimiento) kpiTasaCumplimiento.textContent = '0%';
        if (kpiDesviacionTotal) kpiDesviacionTotal.textContent = '$0';
        if (kpiCategoriaCritica) kpiCategoriaCritica.textContent = 'NINGUNO';
        return;
    }

    // Filtrar metas del departamento si el usuario es directivo
    const metasAFiltrar = (userRole === 'directivo' && userDeptId)
        ? allMetasMensuales.filter(m => m.departamento_id === userDeptId)
        : allMetasMensuales;

    if (metasAFiltrar.length === 0) {
        if (kpiTasaCumplimiento) kpiTasaCumplimiento.textContent = '--%';
        if (kpiDesviacionTotal) kpiDesviacionTotal.textContent = '$0';
        if (kpiCategoriaCritica) kpiCategoriaCritica.textContent = 'NINGUNO';
        return;
    }

    let metasCumplidas = 0;
    let ahorroTotalAcumulado = 0;
    const desviacionNegativaPorConcepto = {};

    metasAFiltrar.forEach(meta => {
        const depto = allDepartamentos.find(d => d.id === meta.departamento_id);
        const concepto = allConceptos.find(c => c.id === meta.concepto_id);
        if (!depto || !concepto) return;

        const gastoReal = getGastoMensual(meta.departamento_id, concepto.nombre, meta.mes, meta.anio);
        const limiteMeta = Number(meta.monto_meta) || 0;
        const ahorroProyectado = limiteMeta - gastoReal;
        
        ahorroTotalAcumulado += ahorroProyectado;

        if (ahorroProyectado >= 0) {
            metasCumplidas++;
        } else {
            const exceso = Math.abs(ahorroProyectado);
            desviacionNegativaPorConcepto[concepto.nombre] = (desviacionNegativaPorConcepto[concepto.nombre] || 0) + exceso;
        }
    });

    // Tasa de cumplimiento
    const tasa = Math.round((metasCumplidas / metasAFiltrar.length) * 100);
    if (kpiTasaCumplimiento) {
        kpiTasaCumplimiento.textContent = `${tasa}%`;
    }

    // Ahorro o sobregasto neto
    if (kpiDesviacionTotal) {
        kpiDesviacionTotal.textContent = formatCurrency(Math.abs(ahorroTotalAcumulado));
        if (ahorroTotalAcumulado >= 0) {
            kpiDesviacionTotal.className = 'font-data-mono text-display-lg text-emerald-400 mt-xs';
            if (kpiDesviacionLabel) kpiDesviacionLabel.textContent = 'Ahorro neto proyectado';
        } else {
            kpiDesviacionTotal.className = 'font-data-mono text-display-lg text-secondary mt-xs';
            if (kpiDesviacionLabel) kpiDesviacionLabel.textContent = 'Sobregasto neto proyectado';
        }
    }

    // Concepto crítico (mayor sobregasto acumulado)
    let catCritica = 'NINGUNO';
    let maxSobregasto = 0;

    Object.keys(desviacionNegativaPorConcepto).forEach(cat => {
        if (desviacionNegativaPorConcepto[cat] > maxSobregasto) {
            maxSobregasto = desviacionNegativaPorConcepto[cat];
            catCritica = cat.toUpperCase();
        }
    });

    if (kpiCategoriaCritica) {
        kpiCategoriaCritica.textContent = catCritica;
    }
}

/**
 * Renderiza el bento grid de metas mensuales
 */
function renderMetasGrid() {
    if (!goalsGridContainer) return;

    const deptVal = filterDept?.value ? parseInt(filterDept.value) : '';
    const conceptoVal = filterConcepto?.value ? parseInt(filterConcepto.value) : '';
    const monthVal = filterMonth?.value ? parseInt(filterMonth.value) : '';
    const yearVal = filterYear?.value ? parseInt(filterYear.value) : '';

    // Filtrar metas en memoria
    const filtered = allMetasMensuales.filter(meta => {
        const matchDept = !deptVal || meta.departamento_id === deptVal;
        const matchConcepto = !conceptoVal || meta.concepto_id === conceptoVal;
        const matchMonth = !monthVal || meta.mes === monthVal;
        const matchYear = !yearVal || meta.anio === yearVal;

        // Si el usuario es directivo, forzar filtrado de su departamento
        const matchRoleDept = userRole !== 'directivo' || meta.departamento_id === userDeptId;

        return matchDept && matchConcepto && matchMonth && matchYear && matchRoleDept;
    });

    goalsGridContainer.innerHTML = '';

    if (filtered.length === 0) {
        goalsGridContainer.innerHTML = `
            <div class="col-span-2 text-center p-lg text-on-surface-variant font-body-md bg-surface-container-low rounded-xl c-frame border border-primary/10">
                No hay metas presupuestales mensuales que coincidan con los filtros seleccionados.
            </div>
        `;
        return;
    }

    // Ordenar metas por año y mes descendente
    const sorted = [...filtered].sort((a, b) => {
        if (b.anio !== a.anio) return b.anio - a.anio;
        return b.mes - a.mes;
    });

    const nombresMeses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    sorted.forEach(meta => {
        const depto = allDepartamentos.find(d => d.id === meta.departamento_id);
        const concepto = allConceptos.find(c => c.id === meta.concepto_id);
        if (!depto || !concepto) return;

        const totalGasto = getGastoMensual(meta.departamento_id, concepto.nombre, meta.mes, meta.anio);
        const montoMeta = Number(meta.monto_meta) || 0;
        const ratio = montoMeta > 0 ? Math.round((totalGasto / montoMeta) * 100) : 0;

        let icon = 'flag';
        let iconBgColor = 'bg-primary/10';
        let iconColor = 'text-primary';

        switch (concepto.nombre) {
            case 'Combustible':
                icon = 'local_gas_station';
                iconBgColor = 'bg-secondary-container/20';
                iconColor = 'text-secondary';
                break;
            case 'Mantenimiento':
                icon = 'build';
                iconBgColor = 'bg-primary/10';
                iconColor = 'text-primary';
                break;
            case 'Personal':
                icon = 'badge';
                iconBgColor = 'bg-blue-500/10';
                iconColor = 'text-blue-400';
                break;
            case 'Peajes':
                icon = 'local_shipping';
                iconBgColor = 'bg-emerald-500/10';
                iconColor = 'text-emerald-400';
                break;
            case 'Administrativo':
                icon = 'description';
                iconBgColor = 'bg-zinc-500/10';
                iconColor = 'text-zinc-400';
                break;
        }

        // Semáforo de estado
        let statusText = 'BAJO LÍMITE';
        let statusClass = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
        let pulseClass = '';

        if (ratio > 100) {
            statusText = 'EXCEDIDO';
            statusClass = 'bg-red-500/10 text-red-400 border border-red-500/30';
            pulseClass = 'pulse-critical';
        } else if (ratio >= 80) {
            statusText = 'CRÍTICO';
            statusClass = 'bg-amber-500/10 text-amber-400 border border-amber-500/30';
            pulseClass = 'pulse-warn';
        }

        // Alerta preventiva para el mes actual
        const isCurrentMonth = (meta.anio === actualYear && meta.mes === actualMonth);
        let projectionHtml = '';

        if (isCurrentMonth) {
            const diasDelMes = new Date(meta.anio, meta.mes, 0).getDate();
            const diaActual = Math.max(1, today.getDate());
            
            const gastoProyectado = (totalGasto / diaActual) * diasDelMes;
            const ratioProyectado = meta.monto_meta > 0 ? Math.round((gastoProyectado / meta.monto_meta) * 100) : 0;

            if (ratioProyectado > 100 && ratio <= 100) {
                projectionHtml = `
                    <div class="mt-xs p-xs bg-amber-500/10 border border-amber-500/20 rounded text-[11px] text-amber-400 flex items-center gap-xs">
                        <span class="material-symbols-outlined text-[14px]">warning</span>
                        <span><strong>Alerta Preventiva:</strong> Proyección de cierre: $${Math.round(gastoProyectado).toLocaleString('es-CO')} (${ratioProyectado}%).</span>
                    </div>
                `;
            } else if (ratioProyectado > 100 && ratio > 100) {
                projectionHtml = `
                    <div class="mt-xs p-xs bg-red-500/10 border border-red-500/20 rounded text-[11px] text-red-400 flex items-center gap-xs">
                        <span class="material-symbols-outlined text-[14px]">error</span>
                        <span>Proyección final: $${Math.round(gastoProyectado).toLocaleString('es-CO')} (${ratioProyectado}%).</span>
                    </div>
                `;
            } else {
                projectionHtml = `
                    <div class="mt-xs p-xs bg-emerald-500/5 border border-emerald-500/10 rounded text-[11px] text-emerald-400/80 flex items-center gap-xs">
                        <span class="material-symbols-outlined text-[14px]">trending_flat</span>
                        <span>Proyección final bajo control: $${Math.round(gastoProyectado).toLocaleString('es-CO')} (${ratioProyectado}%).</span>
                    </div>
                `;
            }
        }

        const card = document.createElement('div');
        card.className = `bg-surface-container-low p-md rounded-xl c-frame flex flex-col gap-md group hover:bg-surface-container transition-all ${pulseClass}`;
        
        // Agregar botón de eliminar si el usuario es administrador
        const btnEliminarHtml = userRole === 'administrador'
            ? `<button class="btn-delete-meta text-on-surface-variant hover:text-red-400 p-1 rounded transition-colors" data-id="${meta.id}" title="Eliminar meta">
                   <span class="material-symbols-outlined text-[18px]">delete</span>
               </button>`
            : '';

        card.innerHTML = `
            <div class="flex justify-between items-start">
                <div class="flex gap-sm items-center">
                    <div class="p-xs ${iconBgColor} rounded-lg">
                        <span class="material-symbols-outlined ${iconColor}" style="font-variation-settings: 'FILL' 1;">${icon}</span>
                    </div>
                    <div>
                        <h3 class="font-title-lg text-title-lg text-on-surface">${depto.nombre} — ${concepto.nombre}</h3>
                        <p class="font-body-md text-body-md text-on-surface-variant">${nombresMeses[meta.mes - 1]} ${meta.anio} ${isCurrentMonth ? '<span class="text-primary font-bold">(MES ACTUAL)</span>' : ''}</p>
                    </div>
                </div>
                <div class="flex items-center gap-xs">
                    <span class="${statusClass} px-xs py-base text-label-sm rounded-sm font-label-sm uppercase tracking-wider">${statusText}</span>
                    ${btnEliminarHtml}
                </div>
            </div>
            <div class="mt-base">
                <div class="flex justify-between items-end mb-xs">
                    <span class="font-data-mono text-data-mono text-primary">
                        $${totalGasto.toLocaleString('es-CO', { maximumFractionDigits: 0 })} 
                        <span class="text-on-surface-variant text-sm font-normal">/ $${Number(meta.monto_meta).toLocaleString('es-CO', { maximumFractionDigits: 0 })}</span>
                    </span>
                    <span class="font-data-mono text-data-mono text-primary">${ratio}%</span>
                </div>
                <!-- Route Line Progress Bar -->
                <div class="h-6 relative flex items-center overflow-hidden">
                    <svg class="w-full h-2 absolute top-1/2 -translate-y-1/2 opacity-20" preserveAspectRatio="none">
                        <path d="M0 4 Q 20 0, 40 4 T 80 4 T 120 4 T 160 4 T 200 4 T 240 4 T 280 4 T 320 4 T 360 4 T 400 4 T 440 4 T 480 4 T 520 4 T 560 4 T 600 4" fill="none" stroke="#f1d47f" stroke-width="2"></path>
                    </svg>
                    <div class="h-1 ${ratio > 100 ? 'bg-red-500' : (ratio >= 80 ? 'bg-amber-500' : 'bg-primary')} relative transition-all duration-1000 ease-out flex items-center justify-end" style="width: ${Math.min(100, ratio)}%;">
                        <span class="${ratio > 100 ? 'text-red-500' : (ratio >= 80 ? 'text-amber-500' : 'text-primary')} translate-x-1/2 font-bold select-none text-xl">»»</span>
                    </div>
                </div>
                ${projectionHtml}
            </div>
        `;

        goalsGridContainer.appendChild(card);
    });

    // Configurar listener para botones de eliminar meta
    document.querySelectorAll('.btn-delete-meta').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const metaId = e.currentTarget.getAttribute('data-id');
            if (confirm('¿Está seguro de que desea eliminar esta meta presupuestal?')) {
                try {
                    const { error } = await supabase
                        .from('metas_mensuales')
                        .delete()
                        .eq('id', metaId);

                    if (error) throw error;
                    await loadInitialData();
                } catch (err) {
                    console.error('Error al eliminar la meta:', err);
                    alert('Error al eliminar la meta: ' + err.message);
                }
            }
        });
    });

    // Efectos de hover para las tarjetas c-frame
    document.querySelectorAll('.c-frame').forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.borderColor = 'rgba(241, 212, 127, 0.4)';
        });
        card.addEventListener('mouseleave', () => {
            card.style.borderColor = 'rgba(241, 212, 127, 0.15)';
        });
    });
}

/**
 * Guarda una nueva meta mensual en lote (proyección hasta diciembre del año de presupuesto)
 */
async function handleNewGoalSubmit(e) {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    submitBtn.innerHTML = 'PROYECTANDO...';
    submitBtn.disabled = true;

    // Obtener valores deshabilitando select de departamento temporalmente si es directivo
    const deptId = parseInt(selectGoalDept.value);
    const conceptoId = parseInt(selectGoalConcepto.value);
    const amount = parseFloat(inputGoalAmount.value);
    const startMonth = parseInt(selectGoalStartMonth.value);
    const year = parseInt(inputGoalYear.value);
    const dateVal = inputGoalDate.value;

    try {
        if (!deptId || !conceptoId || isNaN(amount) || !startMonth || !year) {
            throw new Error('Todos los campos son requeridos y deben ser válidos.');
        }

        // Proyectar metas mensuales desde startMonth hasta el mes 12 (Diciembre)
        const metasLote = [];
        for (let m = startMonth; m <= 12; m++) {
            // Fecha de inicio estructurada al primer día del mes correspondiente
            const startMonthDate = `${year}-${String(m).padStart(2, '0')}-01`;
            
            metasLote.push({
                departamento_id: deptId,
                concepto_id: conceptoId,
                monto_meta: amount,
                mes: m,
                anio: year,
                fecha_inicio: startMonthDate
            });
        }

        // Guardar por lote (upsert para evitar duplicados y actualizar de forma transparente)
        const { error } = await supabase
            .from('metas_mensuales')
            .upsert(metasLote, {
                onConflict: 'departamento_id,concepto_id,mes,anio'
            });

        if (error) throw error;

        submitBtn.innerHTML = '<span class="material-symbols-outlined">check_circle</span> METAS GENERADAS';
        submitBtn.classList.replace('rojo-corazon', 'bg-emerald-600');

        await loadInitialData();

        // Limpiar monto
        inputGoalAmount.value = '';

        setTimeout(() => {
            submitBtn.innerHTML = originalText;
            submitBtn.classList.replace('bg-emerald-600', 'rojo-corazon');
            submitBtn.disabled = false;
            modal.classList.add('hidden');
        }, 1500);

    } catch (err) {
        console.error('Error al guardar/proyectar la meta:', err);
        alert('Error al guardar metas: ' + err.message);
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

/**
 * Renderiza la tabla de validación de pipeline (para control interno)
 */
function renderValidationTable() {
    if (!validationTableBody) return;

    const monthVal = valFilterMonth?.value ? parseInt(valFilterMonth.value) : actualMonth;
    const yearVal = valFilterYear?.value ? parseInt(valFilterYear.value) : actualYear;
    const deptVal = valFilterDept?.value ? parseInt(valFilterDept.value) : '';

    // Filtrar metas de metas_mensuales para el periodo
    const metasPeriodo = allMetasMensuales.filter(meta => {
        const matchMonth = meta.mes === monthVal;
        const matchYear = meta.anio === yearVal;
        const matchDept = !deptVal || meta.departamento_id === deptVal;

        // Si es directivo, solo puede ver su departamento
        const matchRoleDept = userRole !== 'directivo' || meta.departamento_id === userDeptId;

        return matchMonth && matchYear && matchDept && matchRoleDept;
    });

    validationTableBody.innerHTML = '';

    if (metasPeriodo.length === 0) {
        validationTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="py-8 px-6 text-center text-on-surface-variant bg-surface-container-lowest">
                    No hay metas registradas para validar en este mes/año.
                </td>
            </tr>
        `;
        return;
    }

    metasPeriodo.forEach(meta => {
        const depto = allDepartamentos.find(d => d.id === meta.departamento_id);
        const concepto = allConceptos.find(c => c.id === meta.concepto_id);
        if (!depto || !concepto) return;

        // Gasto real acumulado
        const gastoReal = getGastoMensual(meta.departamento_id, concepto.nombre, meta.mes, meta.anio);
        
        // Ahorro proyectado = Meta - Gasto
        const ahorroProyectado = Number(meta.monto_meta) - gastoReal;

        // Buscar validación en la base de datos
        const validacion = allValidacionesAhorros.find(v => 
            v.departamento_id === meta.departamento_id &&
            v.concepto_id === meta.concepto_id &&
            v.mes === meta.mes &&
            v.anio === meta.anio
        );

        const ahorroRealValue = validacion ? (validacion.ahorro_real_ejecutado !== null ? validacion.ahorro_real_ejecutado : '') : '';
        const estadoValue = validacion ? validacion.estado_pipeline : 'Pendiente';
        const obsValue = validacion ? (validacion.observaciones || '') : '';

        const row = document.createElement('tr');
        row.className = 'border-b border-primary/5 hover:bg-surface-container-high transition-colors';

        // Solo permitir editar si el usuario es Administrador o Control Interno
        const isEditable = (userRole === 'administrador' || userRole === 'control_interno');
        const disabledAttr = isEditable ? '' : 'disabled';
        const readOnlyBg = isEditable ? 'bg-[#0B0D0F] focus:border-primary' : 'bg-transparent border-transparent select-none cursor-default';

        row.innerHTML = `
            <td class="py-4 px-6 font-semibold">
                <div>${depto.nombre}</div>
                <div class="text-[11px] text-primary/70 tracking-wider font-normal mt-[2px]">${concepto.nombre}</div>
            </td>
            <td class="py-4 px-6 font-data-mono">${formatCurrency(meta.monto_meta)}</td>
            <td class="py-4 px-6 font-data-mono">${formatCurrency(gastoReal)}</td>
            <td class="py-4 px-6 font-data-mono text-emerald-400">${formatCurrency(ahorroProyectado)}</td>
            
            <!-- Entrada Ahorro Real Ejecutado -->
            <td class="py-4 px-6">
                <input type="number" step="0.01" value="${ahorroRealValue}" ${disabledAttr} placeholder="${ahorroProyectado.toFixed(0)}" 
                       class="${readOnlyBg} border border-primary/10 text-on-surface font-data-mono text-sm px-2 py-1 rounded w-36 outline-none focus:ring-1 focus:ring-primary/20 transition-all val-input-ahorro"/>
            </td>
            
            <!-- Selector Pipeline -->
            <td class="py-4 px-6">
                <select ${disabledAttr} class="${readOnlyBg} border border-primary/10 text-primary font-body-md text-xs px-2 py-1 rounded outline-none focus:ring-1 focus:ring-primary/20 transition-all val-select-estado min-w-[120px]">
                    <option value="Pendiente" ${estadoValue === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                    <option value="En Revisión" ${estadoValue === 'En Revisión' ? 'selected' : ''}>En Revisión</option>
                    <option value="Validado" ${estadoValue === 'Validado' ? 'selected' : ''}>Validado</option>
                    <option value="Observado" ${estadoValue === 'Observado' ? 'selected' : ''}>Observado</option>
                </select>
            </td>

            <!-- Observaciones -->
            <td class="py-4 px-6">
                <input type="text" value="${obsValue}" ${disabledAttr} placeholder="Añadir observaciones" 
                       class="${readOnlyBg} border border-primary/10 text-on-surface font-body-md text-xs px-2 py-1 rounded w-full outline-none focus:ring-1 focus:ring-primary/20 transition-all val-input-obs"/>
            </td>

            <!-- Acciones -->
            <td class="py-4 px-6 text-center">
                ${isEditable ? `
                    <button class="btn-save-validation bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-3 py-1 rounded transition-all active:scale-95 flex items-center justify-center gap-xs mx-auto"
                            data-dept="${meta.departamento_id}" data-concepto="${meta.concepto_id}" data-mes="${meta.mes}" data-anio="${meta.anio}">
                        <span class="material-symbols-outlined text-[14px]">save</span>
                        GUARDAR
                    </button>
                ` : `
                    <span class="text-on-surface-variant text-[11px] italic">Solo lectura</span>
                `}
            </td>
        `;

        validationTableBody.appendChild(row);
    });

    // Configurar manejador para el guardado de validación
    document.querySelectorAll('.btn-save-validation').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const saveBtn = e.currentTarget;
            const row = saveBtn.closest('tr');
            
            const deptId = parseInt(saveBtn.getAttribute('data-dept'));
            const conceptoId = parseInt(saveBtn.getAttribute('data-concepto'));
            const mes = parseInt(saveBtn.getAttribute('data-mes'));
            const anio = parseInt(saveBtn.getAttribute('data-anio'));

            const inputAhorro = row.querySelector('.val-input-ahorro');
            const selectEstado = row.querySelector('.val-select-estado');
            const inputObs = row.querySelector('.val-input-obs');

            const ahorroRealVal = inputAhorro.value !== '' ? parseFloat(inputAhorro.value) : null;
            const estadoVal = selectEstado.value;
            const obsVal = inputObs.value.trim();

            const originalText = saveBtn.innerHTML;
            saveBtn.innerHTML = 'GUARDANDO...';
            saveBtn.disabled = true;

            try {
                // Cálculo del ahorro proyectado para guardar de forma transparente
                const metaItem = allMetasMensuales.find(m => m.departamento_id === deptId && m.concepto_id === conceptoId && m.mes === mes && m.anio === anio);
                const conceptoItem = allConceptos.find(c => c.id === conceptoId);
                const gastoReal = getGastoMensual(deptId, conceptoItem.nombre, mes, anio);
                const ahorroProyectadoVal = metaItem ? (Number(metaItem.monto_meta) - gastoReal) : 0;

                const { error } = await supabase
                    .from('validaciones_ahorros')
                    .upsert({
                        departamento_id: deptId,
                        concepto_id: conceptoId,
                        mes: mes,
                        anio: anio,
                        ahorro_proyectado: ahorroProyectadoVal,
                        ahorro_real_ejecutado: ahorroRealVal,
                        estado_pipeline: estadoVal,
                        observaciones: obsVal,
                        validado_por: currentUser.id,
                        fecha_validacion: new Date().toISOString()
                    }, {
                        onConflict: 'departamento_id,concepto_id,mes,anio'
                    });

                if (error) throw error;

                saveBtn.innerHTML = '<span class="material-symbols-outlined text-[14px]">check</span> HECHO';
                saveBtn.classList.replace('bg-emerald-600', 'bg-emerald-800');

                // Recargar datos locales
                const { data: valids } = await supabase.from('validaciones_ahorros').select('*');
                allValidacionesAhorros = valids || [];

                setTimeout(() => {
                    saveBtn.innerHTML = originalText;
                    saveBtn.classList.replace('bg-emerald-800', 'bg-emerald-600');
                    saveBtn.disabled = false;
                }, 1000);

            } catch (err) {
                console.error('Error al guardar validación:', err);
                alert('Error al guardar la validación: ' + err.message);
                saveBtn.innerHTML = originalText;
                saveBtn.disabled = false;
            }
        });
    });
}

/**
 * Renderiza y gestiona las listas de la pestaña Parámetros (Departamentos y Conceptos)
 */
function renderParametrosLists() {
    if (deptsListBody) {
        deptsListBody.innerHTML = '';
        if (allDepartamentos.length === 0) {
            deptsListBody.innerHTML = '<tr><td colspan="2" class="py-4 text-center text-on-surface-variant">No hay departamentos creados.</td></tr>';
        } else {
            allDepartamentos.forEach(dept => {
                const tr = document.createElement('tr');
                tr.className = 'border-b border-primary/5 hover:bg-surface-container-high transition-colors';
                tr.innerHTML = `
                    <td class="py-3 px-4 font-semibold">${dept.nombre}</td>
                    <td class="py-3 px-4 text-right">
                        <button class="btn-delete-dept text-on-surface-variant hover:text-red-400 p-1 rounded" data-id="${dept.id}" title="Eliminar departamento y todas sus metas">
                            <span class="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                    </td>
                `;
                deptsListBody.appendChild(tr);
            });

            // Configurar listener eliminar departamento
            document.querySelectorAll('.btn-delete-dept').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const deptId = parseInt(e.currentTarget.getAttribute('data-id'));
                    if (confirm('¡CUIDADO! Eliminar este departamento borrará en cascada todas las metas, kpis e iniciativas asociadas. ¿Desea continuar?')) {
                        try {
                            const { error } = await supabase
                                .from('departamentos')
                                .delete()
                                .eq('id', deptId);

                            if (error) throw error;
                            await loadCatalogs();
                            await loadInitialData();
                        } catch (err) {
                            console.error('Error al eliminar departamento:', err);
                            alert('Error: ' + err.message);
                        }
                    }
                });
            });
        }
    }

    if (conceptosListBody) {
        conceptosListBody.innerHTML = '';
        if (allConceptos.length === 0) {
            conceptosListBody.innerHTML = '<tr><td colspan="3" class="py-4 text-center text-on-surface-variant">No hay conceptos presupuestales creados.</td></tr>';
        } else {
            allConceptos.forEach(concept => {
                const tr = document.createElement('tr');
                tr.className = 'border-b border-primary/5 hover:bg-surface-container-high transition-colors';
                tr.innerHTML = `
                    <td class="py-3 px-4 font-semibold text-primary">${concept.nombre}</td>
                    <td class="py-3 px-4 text-on-surface-variant">${concept.descripcion || 'Sin descripción'}</td>
                    <td class="py-3 px-4 text-right">
                        <button class="btn-delete-concept text-on-surface-variant hover:text-red-400 p-1 rounded" data-id="${concept.id}" title="Eliminar concepto">
                            <span class="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                    </td>
                `;
                conceptosListBody.appendChild(tr);
            });

            // Configurar listener eliminar concepto
            document.querySelectorAll('.btn-delete-concept').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const conceptId = parseInt(e.currentTarget.getAttribute('data-id'));
                    if (confirm('¡CUIDADO! Eliminar este concepto borrará todas las metas presupuestales que lo usen. ¿Desea continuar?')) {
                        try {
                            const { error } = await supabase
                                .from('conceptos')
                                .delete()
                                .eq('id', conceptId);

                            if (error) throw error;
                            await loadCatalogs();
                            await loadInitialData();
                        } catch (err) {
                            console.error('Error al eliminar concepto:', err);
                            alert('Error: ' + err.message);
                        }
                    }
                });
            });
        }
    }
}

/**
 * Crea un nuevo departamento
 */
async function handleNewDeptSubmit(e) {
    e.preventDefault();
    const nombre = inputNewDeptName.value.trim();
    if (!nombre) return;

    try {
        const { error } = await supabase
            .from('departamentos')
            .insert([{ nombre }]);

        if (error) throw error;
        inputNewDeptName.value = '';
        await loadCatalogs();
        await loadInitialData();
    } catch (err) {
        console.error('Error al crear departamento:', err);
        alert('Error: ' + err.message);
    }
}

/**
 * Crea un nuevo concepto presupuestal
 */
async function handleNewConceptoSubmit(e) {
    e.preventDefault();
    const nombre = inputNewConceptoName.value.trim();
    const descripcion = inputNewConceptoDesc.value.trim();
    if (!nombre) return;

    try {
        const { error } = await supabase
            .from('conceptos')
            .insert([{ nombre, descripcion }]);

        if (error) throw error;
        inputNewConceptoName.value = '';
        inputNewConceptoDesc.value = '';
        await loadCatalogs();
        await loadInitialData();
    } catch (err) {
        console.error('Error al crear concepto:', err);
        alert('Error: ' + err.message);
    }
}

/**
 * Dibuja un banner visible de error en el DOM en caso de error crítico
 */
function mostrarErrorVisual(error) {
    document.body.style.visibility = 'visible';

    const errorBanner = document.createElement('div');
    errorBanner.style.position = 'fixed';
    errorBanner.style.top = '0';
    errorBanner.style.left = '0';
    errorBanner.style.width = '100%';
    errorBanner.style.backgroundColor = '#690005';
    errorBanner.style.color = '#ffdad6';
    errorBanner.style.padding = '16px';
    errorBanner.style.textAlign = 'center';
    errorBanner.style.zIndex = '99999';
    errorBanner.style.fontFamily = 'sans-serif';
    errorBanner.innerHTML = `<strong>Error en Panel de Metas:</strong> Ocurrió un error en tiempo de ejecución: <code>${error.message || error}</code>. Por favor contacta al administrador.`;
    document.body.appendChild(errorBanner);
}
