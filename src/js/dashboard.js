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
let allIniciativas = [];

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

    } catch (err) {
        console.error('Error al cargar departamentos en dashboard:', err);
    }
}

/**
 * Carga todos los datos iniciales y actualiza la vista
 */
async function loadInitialData() {
    try {
        const { data: inis, error } = await supabase
            .from('iniciativas')
            .select('*');

        if (error) throw error;

        allIniciativas = inis || [];

        // Por defecto, refrescar la vista General
        await refreshView('');

    } catch (err) {
        console.error('Error al cargar datos en el dashboard:', err);
    }
}

/**
 * Refresca los componentes visuales del Dashboard según el departamento
 */
async function refreshView(deptId) {
    const parsedDeptId = deptId !== '' ? parseInt(deptId) : null;

    // 1. Filtrar iniciativas del departamento seleccionado (o todas)
    const inisFiltradas = parsedDeptId
        ? allIniciativas.filter(i => i.departamento_id === parsedDeptId)
        : allIniciativas;

    // 2. Calcular Ahorros Acumulados
    let ahorroReportadoTotal = 0;
    let ahorroRealValidadoTotal = 0;

    inisFiltradas.forEach(i => {
        const startMonth = i.fecha_inicio_ejecucion
            ? new Date(i.fecha_inicio_ejecucion + 'T12:00:00').getMonth() + 1
            : 1;
        const activeMonths = Math.max(0, 12 - startMonth + 1);
        const proyectadoAnual = (Number(i.esperado_mes) || 0) * activeMonths;
        const validadoAnual = i.estado === 'Validada' ? proyectadoAnual : 0;

        ahorroReportadoTotal += proyectadoAnual;
        ahorroRealValidadoTotal += validadoAnual;
    });

    if (cardAhorroTotal) {
        cardAhorroTotal.textContent = formatCurrency(ahorroReportadoTotal);
    }

    if (cardPresupuestoRestante) {
        cardPresupuestoRestante.textContent = formatCurrency(ahorroRealValidadoTotal);
    }

    // 3. Progreso de Validación (% de Ahorro Validado vs Ahorro Reportado)
    const porcentajeValidado = ahorroReportadoTotal > 0
        ? Math.max(0, Math.min(100, Math.round((ahorroRealValidadoTotal / ahorroReportadoTotal) * 100)))
        : 0;

    if (progressPresupuesto) {
        progressPresupuesto.style.width = `${porcentajeValidado}%`;
    }

    if (textPresupuestoUtilizado) {
        textPresupuestoUtilizado.textContent = `${porcentajeValidado}% Ahorro Validado por Control Interno`;
    }

    // 4. Eficiencia de Validación
    if (cardEficiencia) {
        cardEficiencia.textContent = `${porcentajeValidado}%`;
    }

    // 5. Renderizar gráfico acumulado y lista de movimientos (siempre iniciativas)
    renderMonthlyLineChart(inisFiltradas);
    renderRecentInitiatives(inisFiltradas);
}

/**
 * Renderiza el gráfico de progreso de forma mensual (12 meses)
 */
function renderMonthlyLineChart(inis) {
    const canvas = document.getElementById('savingsChart');
    if (!canvas) return;

    const mesesLabels = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const proyectadoMensual = Array(12).fill(0);
    const realMensual = Array(12).fill(0);

    // Filtrar iniciativas para el año actual
    const inisAñoActual = inis.filter(i => {
        const year = i.fecha_inicio_ejecucion
            ? new Date(i.fecha_inicio_ejecucion + 'T12:00:00').getFullYear()
            : actualYear;
        return year === actualYear;
    });

    // Para cada mes (1 a 12), calcular el ahorro mensual activo
    const ahorroProyectadoMes = Array(12).fill(0);
    const ahorroRealMes = Array(12).fill(0);

    inisAñoActual.forEach(i => {
        const startMonth = i.fecha_inicio_ejecucion
            ? new Date(i.fecha_inicio_ejecucion + 'T12:00:00').getMonth() + 1
            : 1;
        const esperado = Number(i.esperado_mes) || 0;
        const isValidated = (i.estado === 'Validada');

        // Se activa a partir de startMonth
        for (let m = startMonth; m <= 12; m++) {
            ahorroProyectadoMes[m - 1] += esperado;
            if (isValidated) {
                ahorroRealMes[m - 1] += esperado;
            }
        }
    });

    // Ahora calculamos el acumulado mensual
    let acumProyectado = 0;
    let acumReal = 0;
    for (let m = 0; m < 12; m++) {
        acumProyectado += ahorroProyectadoMes[m];
        acumReal += ahorroRealMes[m];
        proyectadoMensual[m] = acumProyectado;
        realMensual[m] = acumReal;
    }

    if (myChart) myChart.destroy();

    myChart = new Chart(canvas, {
        type: 'line',
        data: {
            labels: mesesLabels,
            datasets: [
                {
                    label: 'Ahorro Proyectado (Meta)',
                    data: proyectadoMensual,
                    borderColor: '#f1d47f',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0.3,
                    pointBackgroundColor: '#f1d47f',
                    pointBorderColor: '#0B0D0F',
                    pointRadius: 4,
                },
                {
                    label: 'Ahorro Real (Validado)',
                    data: realMensual,
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 3,
                    fill: true,
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
 * Renderiza las iniciativas recientes del dashboard (Vista Departamento)
 */
function renderRecentInitiatives(inis) {
    const container = document.getElementById('recent-movements-container');
    if (!container) return;

    container.innerHTML = '';
    const sorted = [...inis].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);

    if (sorted.length === 0) {
        container.innerHTML = `<div class="text-center p-md text-on-surface-variant font-body-md">No hay iniciativas registradas.</div>`;
        return;
    }

    const userRole = localStorage.getItem('user_role');

    sorted.forEach(i => {
        let icon = 'lightbulb';
        let colorClass = 'text-amber-400';

        if (i.estado === 'Validada') { icon = 'check_circle'; colorClass = 'text-emerald-400'; }

        const dateStr = new Date(i.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });

        const deleteBtnHtml = userRole === 'administrador'
            ? `<button class="btn-delete-ini-dash text-on-surface-variant hover:text-red-400 p-1 rounded ml-sm transition-colors" data-id="${i.id}" title="Eliminar iniciativa">
                   <span class="material-symbols-outlined text-[16px]">delete</span>
               </button>`
            : '';

        let estadoHtml = '';
        if (userRole === 'administrador' || userRole === 'control_interno') {
            estadoHtml = `
                <select class="status-select-dash bg-[#121414] border border-primary/15 text-primary font-body-md text-xs py-[2px] px-xs rounded cursor-pointer outline-none focus:ring-1 focus:ring-primary/20" data-id="${i.id}">
                    <option value="Iniciativa" ${i.estado === 'Iniciativa' ? 'selected' : ''}>Iniciativa</option>
                    <option value="Validada" ${i.estado === 'Validada' ? 'selected' : ''}>Validada</option>
                </select>
            `;
        } else {
            let badgeClass = i.estado === 'Validada' ? 'bg-green-500/25 text-green-400 border-green-500/40' : 'bg-zinc-700/50 text-zinc-300 border-zinc-600/30';
            estadoHtml = `
                <span class="px-xs py-[2px] rounded text-[10px] font-bold border uppercase ${badgeClass}">
                    ${i.estado}
                </span>
            `;
        }

        const row = document.createElement('div');
        row.className = 'flex items-center justify-between p-sm hover:bg-surface-container-high transition-colors rounded-lg group';
        row.innerHTML = `
            <div class="flex items-center gap-md">
                <div class="w-12 h-12 bg-surface-container-lowest flex items-center justify-center rounded">
                    <span class="material-symbols-outlined ${colorClass}">${icon}</span>
                </div>
                <div>
                    <p class="font-body-lg text-body-lg text-on-surface font-semibold truncate max-w-xs" title="${i.nombre}">${i.nombre}</p>
                    <p class="font-label-sm text-label-sm text-on-surface-variant">${dateStr} • ${estadoHtml}</p>
                </div>
            </div>
            <div class="flex items-center gap-sm">
                <div class="text-right">
                    <p class="font-data-mono text-body-lg text-green-400">+${formatCurrency(Number(i.esperado_mes))}/mes</p>
                    <span class="text-primary text-[10px] uppercase font-bold tracking-tighter">${i.tipo}</span>
                </div>
                ${deleteBtnHtml}
            </div>
        `;
        container.appendChild(row);
    });

    // Configurar listener para cambiar estado
    container.querySelectorAll('.status-select-dash').forEach(select => {
        select.addEventListener('change', async (e) => {
            const iniId = e.target.getAttribute('data-id');
            const newStatus = e.target.value;
            try {
                const { error } = await supabase
                    .from('iniciativas')
                    .update({ estado: newStatus })
                    .eq('id', iniId);

                if (error) throw error;
                await loadInitialData();
            } catch (err) {
                console.error('Error al actualizar estado en dashboard:', err);
                alert('Error al actualizar estado: ' + err.message);
            }
        });
    });

    // Configurar listener para eliminar
    container.querySelectorAll('.btn-delete-ini-dash').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const iniId = e.currentTarget.getAttribute('data-id');
            if (confirm('¿Está seguro de que desea eliminar esta iniciativa de ahorro?')) {
                try {
                    const { error } = await supabase
                        .from('iniciativas')
                        .delete()
                        .eq('id', iniId);

                    if (error) throw error;
                    await loadInitialData();
                } catch (err) {
                    console.error('Error al eliminar iniciativa en dashboard:', err);
                    alert('Error al eliminar iniciativa: ' + err.message);
                }
            }
        });
    });
}

