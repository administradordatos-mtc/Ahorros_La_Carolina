import { supabase } from './supabase.js';
import { checkSession } from './auth.js';

// Elementos del DOM
const selectYear = document.getElementById('report-year');
const selectMonth = document.getElementById('report-month');
const selectDept = document.getElementById('report-dept');
const btnExportCsv = document.getElementById('btn-export-csv');
const btnPrintPdf = document.getElementById('btn-print-pdf');

const kpiEsperado = document.getElementById('kpi-esperado');
const kpiRealValidado = document.getElementById('kpi-real-validado');
const kpiDesviacion = document.getElementById('kpi-desviacion');
const kpiEficiencia = document.getElementById('kpi-eficiencia');

const spinner = document.getElementById('reports-spinner');
const tableBody = document.getElementById('reports-table-body');

// Estado local
let allDepartamentos = [];
let allIniciativas = [];
let allEjecuciones = [];
let dataFiltradaParaExportar = []; // Guarda las filas renderizadas para exportar a CSV

// Formateador de pesos colombianos
const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(val || 0);
};

// Nombres de los meses en español
const nombreMeses = [
    "", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

// Inicialización
const init = async () => {
    if (!supabase) {
        console.warn('Reports: El cliente Supabase no está inicializado.');
        return;
    }

    try {
        showSpinner(true);
        
        // 1. Validar la sesión antes de cualquier consulta RLS
        const session = await checkSession();
        if (!session) {
            console.warn('Reports: No hay sesión activa.');
            return;
        }

        // Mostrar menú de usuarios si el rol es administrador
        const userRole = localStorage.getItem('user_role');
        if (userRole === 'administrador') {
            const menuUsuarios = document.getElementById('menu-usuarios');
            const mobileMenuUsuarios = document.getElementById('mobile-menu-usuarios');
            if (menuUsuarios) menuUsuarios.classList.remove('hidden');
            if (mobileMenuUsuarios) mobileMenuUsuarios.classList.remove('hidden');
        }

        // 2. Cargar catálogos
        await loadDepartments();
        await loadInitialData();

        // 3. Registrar escuchadores de eventos
        if (selectYear) selectYear.addEventListener('change', refreshView);
        if (selectMonth) selectMonth.addEventListener('change', refreshView);
        if (selectDept) selectDept.addEventListener('change', refreshView);

        if (btnExportCsv) btnExportCsv.addEventListener('click', exportToCSV);
        if (btnPrintPdf) btnPrintPdf.addEventListener('click', () => window.print());

        // 4. Primera carga de datos
        await refreshView();

    } catch (err) {
        console.error('Error durante la inicialización de reportes:', err);
    } finally {
        showSpinner(false);
    }
};

/**
 * Muestra u oculta el spinner de carga
 */
function showSpinner(show) {
    if (spinner) {
        if (show) {
            spinner.classList.remove('hidden');
        } else {
            spinner.classList.add('hidden');
        }
    }
}

/**
 * Carga los departamentos de la base de datos
 */
async function loadDepartments() {
    if (!selectDept) return;
    try {
        const { data: depts, error } = await supabase
            .from('departamentos')
            .select('*')
            .order('nombre', { ascending: true });

        if (error) throw error;

        allDepartamentos = depts || [];
        selectDept.innerHTML = '<option value="">General (Todos)</option>';

        allDepartamentos.forEach(d => {
            const opt = document.createElement('option');
            opt.value = d.id;
            opt.textContent = d.nombre;
            selectDept.appendChild(opt);
        });

    } catch (err) {
        console.error('Error al cargar departamentos:', err);
    }
}

/**
 * Carga iniciativas y ejecuciones en memoria
 */
async function loadInitialData() {
    try {
        const [inisResult, ejecResult] = await Promise.all([
            supabase.from('iniciativas').select('*').order('nombre', { ascending: true }),
            supabase.from('iniciativas_ejecucion').select('*')
        ]);

        if (inisResult.error) throw inisResult.error;
        if (ejecResult.error) throw ejecResult.error;

        allIniciativas = inisResult.data || [];
        allEjecuciones = ejecResult.data || [];

    } catch (err) {
        console.error('Error al cargar datos de Supabase:', err);
    }
}

/**
 * Refresca la vista en base a los filtros actuales
 */
async function refreshView() {
    showSpinner(true);
    try {
        const selectedYear = parseInt(selectYear.value);
        const selectedMonthVal = selectMonth.value;
        const selectedMonth = selectedMonthVal === 'all' ? 'all' : parseInt(selectedMonthVal);
        const selectedDeptId = selectDept.value !== '' ? parseInt(selectDept.value) : null;

        // 1. Filtrar iniciativas por departamento
        const inisFiltradas = selectedDeptId
            ? allIniciativas.filter(i => i.departamento_id === selectedDeptId)
            : allIniciativas;

        // Variables de acumulación de KPIs
        let totalEsperado = 0;
        let totalRealValidado = 0;
        const listadoFilas = [];

        inisFiltradas.forEach(i => {
            // Determinar mes y año de inicio de la iniciativa
            let yearStart = selectedYear;
            let monthStart = 1;
            
            if (i.fecha_inicio_ejecucion) {
                // Parse seguro en zona horaria local
                const dStart = new Date(i.fecha_inicio_ejecucion + 'T12:00:00');
                yearStart = dStart.getFullYear();
                monthStart = dStart.getMonth() + 1;
            }

            let ahorroProyectadoIniciativa = 0;
            let ahorroRealIniciativa = 0;
            let estadoPipelineIniciativa = 'Pendiente';
            let observacionesIniciativa = '';

            if (selectedMonth === 'all') {
                // Cálculo Anual
                // Calcular meses activos en el año seleccionado
                let mesesActivos = 0;
                if (yearStart < selectedYear) {
                    mesesActivos = 12;
                } else if (yearStart === selectedYear) {
                    mesesActivos = Math.max(0, 12 - monthStart + 1);
                } else {
                    mesesActivos = 0;
                }

                ahorroProyectadoIniciativa = (Number(i.esperado_mes) || 0) * mesesActivos;

                // Consolidar ejecuciones del año
                const ejecsAnio = allEjecuciones.filter(e => 
                    e.iniciativa_id === i.id && 
                    e.anio === selectedYear
                );

                if (ejecsAnio.length > 0) {
                    // Sumar todo el ahorro real reportado
                    ahorroRealIniciativa = ejecsAnio.reduce((acc, e) => acc + (Number(e.ahorro_real_ejecutado) || 0), 0);
                    
                    // Sumar al total validado general solo los registros individuales que estén validados
                    const realValidadoAnio = ejecsAnio
                        .filter(e => e.estado_pipeline === 'Validado')
                        .reduce((acc, e) => acc + (Number(e.ahorro_real_ejecutado) || 0), 0);
                    totalRealValidado += realValidadoAnio;

                    // Determinar estado consolidado anual
                    if (ejecsAnio.some(e => e.estado_pipeline === 'Observado')) {
                        estadoPipelineIniciativa = 'Observado';
                    } else if (ejecsAnio.some(e => e.estado_pipeline === 'En Revisión')) {
                        estadoPipelineIniciativa = 'En Revisión';
                    } else if (ejecsAnio.every(e => e.estado_pipeline === 'Validado')) {
                        estadoPipelineIniciativa = 'Validado';
                    } else {
                        estadoPipelineIniciativa = 'En Revisión';
                    }

                    // Concatenar observaciones no vacías
                    observacionesIniciativa = ejecsAnio
                        .map(e => e.observaciones ? `${nombreMeses[e.mes]}: ${e.observaciones.trim()}` : '')
                        .filter(obs => obs !== '')
                        .join(' | ');
                } else {
                    estadoPipelineIniciativa = 'Pendiente';
                    observacionesIniciativa = 'Sin ejecuciones registradas en el año.';
                }

            } else {
                // Cálculo Mensual
                // La iniciativa está activa en el mes/año seleccionado?
                const estaActiva = (selectedYear > yearStart) || (selectedYear === yearStart && selectedMonth >= monthStart);
                ahorroProyectadoIniciativa = estaActiva ? (Number(i.esperado_mes) || 0) : 0;

                // Buscar ejecución del mes
                const ejecMes = allEjecuciones.find(e => 
                    e.iniciativa_id === i.id && 
                    e.mes === selectedMonth && 
                    e.anio === selectedYear
                );

                if (ejecMes) {
                    ahorroRealIniciativa = Number(ejecMes.ahorro_real_ejecutado) || 0;
                    estadoPipelineIniciativa = ejecMes.estado_pipeline || 'Pendiente';
                    observacionesIniciativa = ejecMes.observaciones || '';

                    if (estadoPipelineIniciativa === 'Validado') {
                        totalRealValidado += ahorroRealIniciativa;
                    }
                } else {
                    ahorroRealIniciativa = 0;
                    estadoPipelineIniciativa = 'Pendiente';
                    observacionesIniciativa = estaActiva ? 'Pendiente por registrar ejecución.' : 'Iniciativa no activa en este periodo.';
                }
            }

            totalEsperado += ahorroProyectadoIniciativa;

            // Obtener nombre del departamento
            const depto = allDepartamentos.find(d => d.id === i.departamento_id);
            const deptoNombre = depto ? depto.nombre : 'No definido';

            listadoFilas.push({
                nombre: i.nombre,
                tipoAhorro: i.tipo_ahorro || 'General',
                departamento: deptoNombre,
                proyectado: ahorroProyectadoIniciativa,
                real: ahorroRealIniciativa,
                estado: estadoPipelineIniciativa,
                desviacion: ahorroRealIniciativa - ahorroProyectadoIniciativa,
                observaciones: observacionesIniciativa
            });
        });

        // Actualizar datos del estado para exportar
        dataFiltradaParaExportar = listadoFilas;

        // 3. Renderizar KPIs Bento
        const desviacionNeta = totalRealValidado - totalEsperado;
        const eficienciaVal = totalEsperado > 0 ? (totalRealValidado / totalEsperado) * 100 : 0.0;

        kpiEsperado.textContent = formatCurrency(totalEsperado);
        kpiRealValidado.textContent = formatCurrency(totalRealValidado);
        
        // Dar color a la desviación
        kpiDesviacion.textContent = formatCurrency(desviacionNeta);
        if (desviacionNeta < 0) {
            kpiDesviacion.className = "font-headline-lg text-3xl mt-sm text-red-400";
        } else if (desviacionNeta > 0) {
            kpiDesviacion.className = "font-headline-lg text-3xl mt-sm text-green-400";
        } else {
            kpiDesviacion.className = "font-headline-lg text-3xl mt-sm text-on-surface";
        }

        kpiEficiencia.textContent = `${eficienciaVal.toFixed(1)} %`;

        // 4. Renderizar Tabla Detallada
        renderTable(listadoFilas, selectedMonth, selectedYear);

    } catch (err) {
        console.error('Error al refrescar la vista de reportes:', err);
    } finally {
        showSpinner(false);
    }
}

/**
 * Renderiza los elementos de la tabla en el DOM
 */
function renderTable(filas, mes, anio) {
    if (!tableBody) return;
    tableBody.innerHTML = '';

    if (filas.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="py-lg text-center text-on-surface-variant">
                    No se encontraron iniciativas para el filtro seleccionado.
                </td>
            </tr>
        `;
        return;
    }

    const stringPeriodo = mes === 'all' ? `Año ${anio}` : `${nombreMeses[mes]} ${anio}`;

    filas.forEach(f => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-surface-container-high transition-colors";

        // Clases de color para el badge del estado
        let badgeClass = "bg-surface-variant text-on-surface-variant";
        if (f.estado === 'Validado') {
            badgeClass = "bg-green-500/10 text-green-400 border border-green-500/20";
        } else if (f.estado === 'En Revisión') {
            badgeClass = "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20";
        } else if (f.estado === 'Observado') {
            badgeClass = "bg-red-500/10 text-red-400 border border-red-500/20";
        }

        // Color para desviación de fila
        let desClass = "text-on-surface text-right";
        if (f.desviacion < 0) {
            desClass = "text-red-400 text-right font-semibold";
        } else if (f.desviacion > 0) {
            desClass = "text-green-400 text-right font-semibold";
        }

        tr.innerHTML = `
            <td class="py-4 px-6">
                <div class="font-semibold text-on-surface">${f.nombre}</div>
                <div class="text-xs text-on-surface-variant font-medium">${f.tipoAhorro}</div>
            </td>
            <td class="py-4 px-6 text-on-surface-variant">${f.departamento}</td>
            <td class="py-4 px-6 text-on-surface-variant text-sm font-medium">${stringPeriodo}</td>
            <td class="py-4 px-6 text-right font-semibold text-on-surface">${formatCurrency(f.proyectado)}</td>
            <td class="py-4 px-6 text-right font-semibold text-on-surface">${formatCurrency(f.real)}</td>
            <td class="py-4 px-6 text-center">
                <span class="px-sm py-1 rounded-full text-xs font-bold uppercase tracking-wider ${badgeClass}">
                    ${f.estado}
                </span>
            </td>
            <td class="${desClass}">${formatCurrency(f.desviacion)}</td>
            <td class="py-4 px-6 text-on-surface-variant text-xs max-w-xs truncate" title="${f.observaciones || ''}">
                ${f.observaciones || '<span class="opacity-30">—</span>'}
            </td>
        `;

        tableBody.appendChild(tr);
    });
}

/**
 * Exporta los datos actualmente filtrados a un archivo CSV
 */
function exportToCSV() {
    if (dataFiltradaParaExportar.length === 0) {
        alert('No hay datos disponibles en el reporte para exportar.');
        return;
    }

    const selectedYear = selectYear.value;
    const selectedMonthVal = selectMonth.value;
    const stringMes = selectedMonthVal === 'all' ? 'todos' : nombreMeses[parseInt(selectedMonthVal)].toLowerCase();

    // Crear cabeceras
    let csvContent = "Iniciativa,Tipo de Ahorro,Departamento,Ahorro Proyectado,Ahorro Real,Estado Pipeline,Desviacion,Observaciones\r\n";

    // Agregar filas
    dataFiltradaParaExportar.forEach(f => {
        // Escapar comillas dobles en campos de texto
        const nombreEscapado = `"${f.nombre.replace(/"/g, '""')}"`;
        const tipoEscapado = `"${f.tipoAhorro.replace(/"/g, '""')}"`;
        const deptoEscapado = `"${f.departamento.replace(/"/g, '""')}"`;
        const observacionesEscapadas = `"${(f.observaciones || '').replace(/"/g, '""')}"`;

        const fila = [
            nombreEscapado,
            tipoEscapado,
            deptoEscapado,
            f.proyectado,
            f.real,
            f.estado,
            f.desviacion,
            observacionesEscapadas
        ].join(",");

        csvContent += fila + "\r\n";
    });

    // Crear blob y descargar
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `reporte_ejecutivo_${selectedYear}_${stringMes}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Iniciar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
