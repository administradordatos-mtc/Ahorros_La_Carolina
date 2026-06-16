import { supabase } from './supabase.js';
import { Chart, registerables } from 'chart.js';

// Registrar los controladores y componentes necesarios de Chart.js
Chart.register(...registerables);

// Variable para almacenar la instancia global del gráfico
let myChart = null;

// Elementos del DOM
const selectDept = document.getElementById('dashboard-dept');
const cardAhorroTotal = document.getElementById('card-ahorro-total');
const cardPresupuestoRestante = document.getElementById('card-presupuesto-restante');
const progressPresupuesto = document.getElementById('progress-presupuesto');
const textPresupuestoUtilizado = document.getElementById('text-presupuesto-utilizado');
const cardEficiencia = document.getElementById('card-eficiencia');
const labelAhorroTotal = document.querySelector('#card-ahorro-total')?.previousElementSibling;
const labelPresupuestoRestante = document.querySelector('#card-presupuesto-restante')?.previousElementSibling;
const labelEficiencia = document.querySelector('#card-eficiencia')?.previousElementSibling;

// Formateadores
const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(val || 0);
};

const init = async () => {
    if (!supabase) {
        console.warn('Dashboard: Supabase client is not initialized.');
        return;
    }

    // 1. Cargar lista de departamentos en el selector
    await loadDepartments();

    // 2. Cargar datos iniciales (Vista General)
    await updateDashboard('');

    // 3. Escuchar cambios de filtro de departamento
    if (selectDept) {
        selectDept.addEventListener('change', async (e) => {
            const deptId = e.target.value;
            await updateDashboard(deptId);
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

        // Limpiar
        selectDept.innerHTML = '<option value="">General (Todos)</option>';

        if (depts && depts.length > 0) {
            depts.forEach(d => {
                const opt = document.createElement('option');
                opt.value = d.id;
                opt.textContent = d.nombre;
                selectDept.appendChild(opt);
            });
        }
    } catch (err) {
        console.error('Error al cargar departamentos en dashboard:', err);
    }
}

/**
 * Actualiza el contenido del dashboard basándose en el departamento seleccionado
 */
async function updateDashboard(deptId) {
    try {
        if (!deptId) {
            // --- VISTA GENERAL (COMPAÑÍA) ---
            if (labelAhorroTotal) labelAhorroTotal.textContent = 'Ahorro Total';
            if (labelPresupuestoRestante) labelPresupuestoRestante.textContent = 'Presupuesto Restante';
            if (labelEficiencia) labelEficiencia.textContent = 'Eficiencia del Mes';

            const { data: metas, error: metasError } = await supabase
                .from('metas_semanales')
                .select('*');

            const { data: gastos, error: gastosError } = await supabase
                .from('gastos_semanales')
                .select('*');

            if (metasError) throw metasError;
            if (gastosError) throw gastosError;

            // Procesar métricas generales
            const totalMeta = metas.reduce((sum, m) => sum + Number(m.monto_meta), 0);
            const totalGasto = gastos.reduce((sum, g) => sum + Number(g.monto_gasto), 0);
            const ahorroTotal = totalMeta - totalGasto;

            if (cardAhorroTotal) {
                cardAhorroTotal.textContent = formatCurrency(ahorroTotal);
            }

            // Encontrar la última semana
            let latestWeek = 0;
            let latestYear = 0;
            metas.forEach(m => {
                if (m.anio > latestYear || (m.anio === latestYear && m.semana > latestWeek)) {
                    latestYear = m.anio;
                    latestWeek = m.semana;
                }
            });
            gastos.forEach(g => {
                if (g.anio > latestYear || (g.anio === latestYear && g.semana > latestWeek)) {
                    latestYear = g.anio;
                    latestWeek = g.semana;
                }
            });
            if (latestWeek === 0) {
                latestWeek = 22;
                latestYear = 2026;
            }

            const metaUltimaSemana = metas
                .filter(m => m.semana === latestWeek && m.anio === latestYear)
                .reduce((sum, m) => sum + Number(m.monto_meta), 0);

            const gastoUltimoSemana = gastos
                .filter(g => g.semana === latestWeek && g.anio === latestYear)
                .reduce((sum, g) => sum + Number(g.monto_gasto), 0);

            const presupuestoRestante = metaUltimaSemana - gastoUltimoSemana;
            const porcentajeUtilizado = metaUltimaSemana > 0 ? Math.round((gastoUltimoSemana / metaUltimaSemana) * 100) : 0;

            if (cardPresupuestoRestante) {
                cardPresupuestoRestante.textContent = formatCurrency(presupuestoRestante);
            }

            if (progressPresupuesto) {
                progressPresupuesto.className = 'bg-primary h-full transition-all duration-1000';
                progressPresupuesto.style.width = `${Math.min(100, porcentajeUtilizado)}%`;
                if (porcentajeUtilizado > 100) {
                    progressPresupuesto.classList.replace('bg-primary', 'bg-red-500');
                }
            }

            if (textPresupuestoUtilizado) {
                textPresupuestoUtilizado.textContent = `${porcentajeUtilizado}% Utilizado (Semana ${latestWeek}, ${latestYear})`;
            }

            const eficiencia = totalMeta > 0 
                ? Math.max(0, Math.min(100, (1 - Math.abs(totalGasto - totalMeta) / totalMeta) * 100)) 
                : 0;

            if (cardEficiencia) {
                cardEficiencia.textContent = `${eficiencia.toFixed(1)}%`;
            }

            // Renderizar Gráfico de Líneas General
            renderLineChart(metas, gastos);

            // Renderizar Movimientos Recientes de Gastos
            renderRecentExpenses(gastos);

        } else {
            // --- VISTA DE DEPARTAMENTO (EJ. TECNOLOGÍA) ---
            if (labelAhorroTotal) labelAhorroTotal.textContent = 'Ahorro Anual Esperado';
            if (labelPresupuestoRestante) labelPresupuestoRestante.textContent = 'Ahorro Mensual Esperado';
            if (labelEficiencia) labelEficiencia.textContent = 'Proyectos En Ejecución';

            const { data: inis, error: inisError } = await supabase
                .from('iniciativas')
                .select('*')
                .eq('departamento_id', deptId);

            if (inisError) throw inisError;

            // Calcular Métricas del Departamento
            let totalMesEsperado = 0;
            let totalAnioEsperado = 0;
            let enCurso = 0;
            let totalInis = inis.length;

            inis.forEach(i => {
                totalMesEsperado += parseFloat(i.esperado_mes) || 0;
                totalAnioEsperado += parseFloat(i.anual_esperado) || 0;
                if (i.estado === 'En curso' || i.estado === 'Completado') {
                    enCurso++;
                }
            });

            const porcentajeEnCurso = totalInis > 0 ? Math.round((enCurso / totalInis) * 100) : 0;

            if (cardAhorroTotal) {
                cardAhorroTotal.textContent = formatCurrency(totalAnioEsperado);
            }

            if (cardPresupuestoRestante) {
                cardPresupuestoRestante.textContent = formatCurrency(totalMesEsperado);
            }

            if (progressPresupuesto) {
                progressPresupuesto.className = 'bg-primary h-full transition-all duration-1000';
                progressPresupuesto.style.width = `${porcentajeEnCurso}%`;
            }

            if (textPresupuestoUtilizado) {
                textPresupuestoUtilizado.textContent = `${enCurso} de ${totalInis} Iniciativas En Curso`;
            }

            if (cardEficiencia) {
                cardEficiencia.textContent = `${porcentajeEnCurso}%`;
            }

            // Renderizar Gráfico de Barras de Iniciativas
            renderInitiativesBarChart(inis);

            // Renderizar Listado de Iniciativas Recientes
            renderRecentInitiatives(inis);
        }
    } catch (err) {
        console.error('Error al actualizar dashboard:', err);
    }
}

/**
 * Renderiza el gráfico de líneas (General)
 */
function renderLineChart(metas, gastos) {
    const canvas = document.getElementById('savingsChart');
    if (!canvas) return;

    const semanasMap = {};
    metas.forEach(m => {
        const key = `${m.anio}-W${String(m.semana).padStart(2, '0')}`;
        if (!semanasMap[key]) {
            semanasMap[key] = { label: `Semana ${m.semana}`, meta: 0, gasto: 0 };
        }
        semanasMap[key].meta += Number(m.monto_meta);
    });

    gastos.forEach(g => {
        const key = `${g.anio}-W${String(g.semana).padStart(2, '0')}`;
        if (!semanasMap[key]) {
            semanasMap[key] = { label: `Semana ${g.semana}`, meta: 0, gasto: 0 };
        }
        semanasMap[key].gasto += Number(g.monto_gasto);
    });

    const sortedWeeks = Object.keys(semanasMap).sort().map(key => semanasMap[key]);
    const labels = sortedWeeks.map(w => w.label);
    const metaData = sortedWeeks.map(w => w.meta);
    const gastoData = sortedWeeks.map(w => w.gasto);

    if (myChart) myChart.destroy();

    myChart = new Chart(canvas, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Gasto Real',
                    data: gastoData,
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
                    label: 'Meta de Límite',
                    data: metaData,
                    borderColor: '#98907f',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0.3,
                    pointBackgroundColor: '#98907f',
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

    // Solo graficar iniciativas que tengan un ahorro esperado mayor a 0
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
                    backgroundColor: '#C52724', // Rojo Corazón
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
 * Renderiza los últimos gastos del dashboard (Vista General)
 */
function renderRecentExpenses(gastos) {
    const container = document.getElementById('recent-movements-container');
    if (!container) return;

    container.innerHTML = '';
    const sorted = [...gastos].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, 5);

    if (sorted.length === 0) {
        container.innerHTML = `<div class="text-center p-md text-on-surface-variant">No hay gastos recientes.</div>`;
        return;
    }

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
            <div class="text-right">
                <p class="font-data-mono text-body-lg text-on-surface">-${formatCurrency(Number(g.monto_gasto))}</p>
                <span class="text-secondary text-[10px] uppercase font-bold tracking-tighter">Procesado</span>
            </div>
        `;
        container.appendChild(row);
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
