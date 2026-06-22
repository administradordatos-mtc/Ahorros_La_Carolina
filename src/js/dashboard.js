import { supabase } from './supabase.js';
import { Chart, registerables } from 'chart.js';

// Registrar componentes de Chart.js
Chart.register(...registerables);

// Instancia global del gráfico
let myChart = null;

// Elementos del DOM
const selectDept = document.getElementById('dashboard-dept');
const cardAhorroTotal = document.getElementById('card-ahorro-total');
const cardPresupuestoRestante = document.getElementById('card-presupuesto-restante');
const progressPresupuesto = document.getElementById('progress-presupuesto');
const textPresupuestoUtilizado = document.getElementById('text-presupuesto-utilizado');
const cardEficiencia = document.getElementById('card-eficiencia');

// Formateador de pesos colombianos
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

// Estado local
let allDepartamentos = [];
let allConceptos = [];
let allMetasMensuales = [];
let allGastosSemanales = [];
let allValidacionesAhorros = [];

const init = async () => {
    if (!supabase) {
        console.warn('Dashboard: Supabase client is not initialized.');
        return;
    }

    // 1. Cargar lista de departamentos
    await loadDepartments();

    // 2. Cargar datos iniciales
    await loadInitialData();

    // 3. Escuchar cambios de filtro de departamento
    if (selectDept) {
        selectDept.addEventListener('change', async (e) => {
            const deptId = e.target.value;
            await refreshView(deptId);
        });
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

/**
 * Carga departamentos desde Supabase
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

        // Cargar también el catálogo de conceptos
        const { data: concts } = await supabase.from('conceptos').select('*');
        allConceptos = concts || [];

    } catch (err) {
        console.error('Error al cargar departamentos en dashboard:', err);
    }
}

/**
 * Carga todos los datos iniciales y actualiza la vista
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

        // Por defecto, refrescar la vista General
        await refreshView('');

    } catch (err) {
        console.error('Error al cargar datos en el dashboard:', err);
    }
}

/**
 * Calcula el gasto real mensual agrupado por mes, año, concepto y departamento de forma retrocompatible
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
            const matchDept = !g.departamento_id || g.departamento_id === deptId;
            
            return matchPeriod && matchConcepto && matchDept;
        })
        .reduce((sum, g) => sum + (Number(g.monto_gasto) || 0), 0);
}

/**
 * Refresca los componentes visuales del Dashboard según el departamento
 */
async function refreshView(deptId) {
    const parsedDeptId = deptId !== '' ? parseInt(deptId) : null;

    // 1. Filtrar metas mensuales y validaciones
    const metasFiltradas = parsedDeptId
        ? allMetasMensuales.filter(m => m.departamento_id === parsedDeptId)
        : allMetasMensuales;

    const validsFiltradas = parsedDeptId
        ? allValidacionesAhorros.filter(v => v.departamento_id === parsedDeptId)
        : allValidacionesAhorros;

    // 2. Calcular Ahorro Reportado (Meta - Gasto)
    let ahorroReportadoTotal = 0;
    metasFiltradas.forEach(meta => {
        const concepto = allConceptos.find(c => c.id === meta.concepto_id);
        if (!concepto) return;
        const gastoReal = getGastoMensual(meta.departamento_id, concepto.nombre, meta.mes, meta.anio);
        const ahorroProyectado = Number(meta.monto_meta) - gastoReal;
        ahorroReportadoTotal += ahorroProyectado;
    });

    if (cardAhorroTotal) {
        cardAhorroTotal.textContent = formatCurrency(ahorroReportadoTotal);
    }

    // 3. Calcular Ahorro Real Validado por Control Interno (estado === 'Validado')
    const ahorroRealValidadoTotal = validsFiltradas
        .filter(v => v.estado_pipeline === 'Validated' || v.estado_pipeline === 'Validado')
        .reduce((sum, v) => sum + (Number(v.ahorro_real_ejecutado) || 0), 0);

    if (cardPresupuestoRestante) {
        cardPresupuestoRestante.textContent = formatCurrency(ahorroRealValidadoTotal);
    }

    // 4. Progreso de Validación (% de Ahorro Validado vs Ahorro Reportado)
    const porcentajeValidado = ahorroReportadoTotal > 0
        ? Math.max(0, Math.min(100, Math.round((ahorroRealValidadoTotal / ahorroReportadoTotal) * 100)))
        : 0;

    if (progressPresupuesto) {
        progressPresupuesto.style.width = `${porcentajeValidado}%`;
    }

    if (textPresupuestoUtilizado) {
        textPresupuestoUtilizado.textContent = `${porcentajeValidado}% Ahorro Validado por Control Interno`;
    }

    // 5. Eficiencia de Validación
    if (cardEficiencia) {
        cardEficiencia.textContent = `${porcentajeValidado}%`;
    }

    // 6. Si es vista de departamento, cargar también sus iniciativas de ahorro en el gráfico y panel
    if (parsedDeptId) {
        // Cargar iniciativas para el departamento
        try {
            const { data: inis } = await supabase
                .from('iniciativas')
                .select('*')
                .eq('departamento_id', parsedDeptId);
            
            renderInitiativesBarChart(inis || []);
            renderRecentInitiatives(inis || []);
        } catch (err) {
            console.error('Error al cargar iniciativas del departamento:', err);
        }
    } else {
        // Vista general: Renderizar gráfico lineal acumulado mensual de Metas vs Gastos vs Ahorros Validados
        renderMonthlyLineChart(metasFiltradas, validsFiltradas);
        renderRecentExpensesList(deptId);
    }
}

/**
 * Renderiza el gráfico de progreso de forma mensual (12 meses)
 */
function renderMonthlyLineChart(metas, valids) {
    const canvas = document.getElementById('savingsChart');
    if (!canvas) return;

    const mesesLabels = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const metasMensualesArray = Array(12).fill(0);
    const gastosMensualesArray = Array(12).fill(0);
    const ahorroValidadoArray = Array(12).fill(0);

    // Agrupar metas mensuales por mes (año actual)
    metas.filter(m => m.anio === actualYear).forEach(meta => {
        const mIdx = meta.mes - 1;
        if (mIdx >= 0 && mIdx < 12) {
            metasMensualesArray[mIdx] += Number(meta.monto_meta) || 0;
            
            // Buscar concepto y calcular el gasto real de este mes y concepto
            const concepto = allConceptos.find(c => c.id === meta.concepto_id);
            if (concepto) {
                const gasto = getGastoMensual(meta.departamento_id, concepto.nombre, meta.mes, meta.anio);
                gastosMensualesArray[mIdx] += gasto;
            }
        }
    });

    // Agrupar validaciones de ahorro real
    valids.filter(v => v.anio === actualYear && (v.estado_pipeline === 'Validado' || v.estado_pipeline === 'Validated')).forEach(v => {
        const mIdx = v.mes - 1;
        if (mIdx >= 0 && mIdx < 12) {
            ahorroValidadoArray[mIdx] += Number(v.ahorro_real_ejecutado) || 0;
        }
    });

    if (myChart) myChart.destroy();

    myChart = new Chart(canvas, {
        type: 'line',
        data: {
            labels: mesesLabels,
            datasets: [
                {
                    label: 'Meta Límite',
                    data: metasMensualesArray,
                    borderColor: '#98907f',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0.3,
                    pointBackgroundColor: '#98907f',
                    pointBorderColor: '#0B0D0F',
                    pointRadius: 4,
                },
                {
                    label: 'Gasto Real',
                    data: gastosMensualesArray,
                    borderColor: '#f1d47f',
                    backgroundColor: 'rgba(241, 212, 127, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.3,
                    pointBackgroundColor: '#f1d47f',
                    pointBorderColor: '#0B0D0F',
                    pointRadius: 4,
                },
                {
                    label: 'Ahorro Validado',
                    data: ahorroValidadoArray,
                    borderColor: '#10B981',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.3,
                    pointBackgroundColor: '#10B981',
                    pointBorderColor: '#0B0D0F',
                    pointRadius: 4,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${formatCurrency(context.raw)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    grid: { color: 'rgba(241, 212, 127, 0.05)' },
                    ticks: {
                        color: '#98907f',
                        callback: function(value) {
                            return `$${(value / 1000000).toFixed(1)}M`;
                        }
                    }
                },
                x: {
                    grid: { color: 'rgba(241, 212, 127, 0.05)' },
                    ticks: { color: '#98907f' }
                }
            }
        }
    });
}

/**
 * Renderiza el gráfico de barras por departamento (Iniciativas)
 */
function renderInitiativesBarChart(inis) {
    const canvas = document.getElementById('savingsChart');
    if (!canvas) return;

    const filteredInis = inis.filter(i => parseFloat(i.esperado_mes) > 0);
    const labels = filteredInis.map(i => i.nombre.length > 20 ? i.nombre.substring(0, 17) + '...' : i.nombre);
    const expectedData = filteredInis.map(i => parseFloat(i.esperado_mes));

    if (myChart) myChart.destroy();

    myChart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: 'Ahorro Mensual Esperado',
                    data: expectedData,
                    backgroundColor: '#C52724',
                    borderColor: '#a0020e',
                    borderWidth: 1,
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${formatCurrency(context.raw)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    grid: { color: 'rgba(241, 212, 127, 0.05)' },
                    ticks: {
                        color: '#98907f',
                        callback: function(value) {
                            if (value >= 1000000) {
                                return `$${(value / 1000000).toFixed(1)}M`;
                            }
                            return `$${value.toLocaleString('es-CO')}`;
                        }
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#98907f' }
                }
            }
        }
    });
}

/**
 * Renderiza los últimos gastos del dashboard con opción de eliminar para el administrador
 */
function renderRecentExpensesList(deptId) {
    const container = document.getElementById('recent-movements-container');
    if (!container) return;

    container.innerHTML = '';
    const sorted = [...allGastosSemanales].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, 5);

    if (sorted.length === 0) {
        container.innerHTML = `<div class="text-center p-md text-on-surface-variant">No hay gastos recientes.</div>`;
        return;
    }

    const userRole = localStorage.getItem('user_role');

    sorted.forEach(g => {
        let icon = 'receipt_long';
        let colorClass = 'text-primary';

        switch (g.categoria) {
            case 'Combustible': icon = 'oil_barrel'; colorClass = 'text-secondary'; break;
            case 'Mantenimiento': icon = 'build'; colorClass = 'text-primary'; break;
            case 'Personal': icon = 'badge'; colorClass = 'text-blue-400'; break;
            case 'Peajes': icon = 'local_shipping'; colorClass = 'text-emerald-400'; break;
            case 'Administrativo': icon = 'description'; colorClass = 'text-zinc-400'; break;
        }

        const dateStr = new Date(g.fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });

        const deleteBtnHtml = userRole === 'administrador'
            ? `<button class="btn-delete-gasto text-on-surface-variant hover:text-red-400 p-1 rounded ml-sm transition-colors" data-id="${g.id}" title="Eliminar gasto">
                   <span class="material-symbols-outlined text-[16px]">delete</span>
               </button>`
            : '';

        const row = document.createElement('div');
        row.className = 'flex items-center justify-between p-sm hover:bg-surface-container-high transition-colors rounded-lg group';
        row.innerHTML = `
            <div class="flex items-center gap-md">
                <div class="w-12 h-12 bg-surface-container-lowest flex items-center justify-center rounded">
                    <span class="material-symbols-outlined ${colorClass}">${icon}</span>
                </div>
                <div>
                    <p class="font-body-lg text-body-lg text-on-surface">${g.categoria} - ${g.descripcion || 'Gasto'}</p>
                    <p class="font-label-sm text-label-sm text-on-surface-variant">${dateStr} • Semana ${g.semana}</p>
                </div>
            </div>
            <div class="flex items-center gap-sm">
                <div class="text-right">
                    <p class="font-data-mono text-body-lg text-on-surface">-${formatCurrency(Number(g.monto_gasto))}</p>
                    <span class="text-secondary text-[10px] uppercase font-bold tracking-tighter">Procesado</span>
                </div>
                ${deleteBtnHtml}
            </div>
        `;
        container.appendChild(row);
    });

    // Configurar listener de eliminación de gasto
    document.querySelectorAll('.btn-delete-gasto').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const gastoId = e.currentTarget.getAttribute('data-id');
            if (confirm('¿Está seguro de que desea eliminar este gasto de la base de datos?')) {
                try {
                    const { error } = await supabase
                        .from('gastos_semanales')
                        .delete()
                        .eq('id', gastoId);

                    if (error) throw error;
                    
                    // Recargar datos y refrescar la vista
                    await loadInitialData();
                } catch (err) {
                    console.error('Error al eliminar el gasto:', err);
                    alert('Error: ' + err.message);
                }
            }
        });
    });
}

/**
 * Renderiza las iniciativas recientes del dashboard (Vista Departamento)
 */
function renderRecentInitiatives(inis) {
    const container = document.getElementById('recent-movements-container');
    if (!container) return;

    container.innerHTML = '';
    const sorted = [...inis].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);

    if (sorted.length === 0) {
        container.innerHTML = `<div class="text-center p-md text-on-surface-variant">No hay iniciativas registradas.</div>`;
        return;
    }

    sorted.forEach(i => {
        let icon = 'lightbulb';
        let colorClass = 'text-amber-400';

        if (i.estado === 'En curso') { icon = 'play_circle'; colorClass = 'text-green-400'; }
        else if (i.estado === 'Completado') { icon = 'check_circle'; colorClass = 'text-cyan-400'; }
        else if (i.estado === 'Negociación') { icon = 'handshake'; colorClass = 'text-purple-400'; }

        const dateStr = new Date(i.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });

        const row = document.createElement('div');
        row.className = 'flex items-center justify-between p-sm hover:bg-surface-container-high transition-colors rounded-lg group';
        row.innerHTML = `
            <div class="flex items-center gap-md">
                <div class="w-12 h-12 bg-surface-container-lowest flex items-center justify-center rounded">
                    <span class="material-symbols-outlined ${colorClass}">${icon}</span>
                </div>
                <div>
                    <p class="font-body-lg text-body-lg text-on-surface font-semibold truncate max-w-xs" title="${i.nombre}">${i.nombre}</p>
                    <p class="font-label-sm text-label-sm text-on-surface-variant">${dateStr} • Estado: ${i.estado}</p>
                </div>
            </div>
            <div class="text-right">
                <p class="font-data-mono text-body-lg text-green-400">+${formatCurrency(Number(i.esperado_mes))}/mes</p>
                <span class="text-primary text-[10px] uppercase font-bold tracking-tighter">${i.tipo}</span>
            </div>
        `;
        container.appendChild(row);
    });
}
