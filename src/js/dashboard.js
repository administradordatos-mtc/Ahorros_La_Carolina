import { supabase } from './supabase.js';
import { Chart, registerables } from 'chart.js';

// Registrar los controladores y componentes necesarios de Chart.js
Chart.register(...registerables);

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Obtener datos de Supabase
    try {
        const { data: metas, error: metasError } = await supabase
            .from('metas_semanales')
            .select('*');

        const { data: gastos, error: gastosError } = await supabase
            .from('gastos_semanales')
            .select('*');

        if (metasError) throw metasError;
        if (gastosError) throw gastosError;

        // 2. Procesar datos y calcular métricas
        const totalMeta = metas.reduce((sum, m) => sum + Number(m.monto_meta), 0);
        const totalGasto = gastos.reduce((sum, g) => sum + Number(g.monto_gasto), 0);
        const ahorroTotal = totalMeta - totalGasto;
        
        // Actualizar Ahorro Total Card
        const cardAhorroTotal = document.getElementById('card-ahorro-total');
        if (cardAhorroTotal) {
            cardAhorroTotal.textContent = `$${ahorroTotal.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
        }

        // Encontrar la última semana disponible en el sistema
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

        // Si no hay datos, usar semana por defecto
        if (latestWeek === 0) {
            latestWeek = 22;
            latestYear = 2026;
        }

        // Calcular metas y gastos de la última semana
        const metaUltimaSemana = metas
            .filter(m => m.semana === latestWeek && m.anio === latestYear)
            .reduce((sum, m) => sum + Number(m.monto_meta), 0);

        const gastoUltimoSemana = gastos
            .filter(g => g.semana === latestWeek && g.anio === latestYear)
            .reduce((sum, g) => sum + Number(g.monto_gasto), 0);

        const presupuestoRestante = metaUltimaSemana - gastoUltimoSemana;
        const porcentajeUtilizado = metaUltimaSemana > 0 ? Math.round((gastoUltimoSemana / metaUltimaSemana) * 100) : 0;

        // Actualizar Presupuesto Restante Card
        const cardPresupuestoRestante = document.getElementById('card-presupuesto-restante');
        if (cardPresupuestoRestante) {
            cardPresupuestoRestante.textContent = `$${Math.max(0, presupuestoRestante).toLocaleString('es-CO', { minimumFractionDigits: 0 })}`;
        }

        const progressPresupuesto = document.getElementById('progress-presupuesto');
        if (progressPresupuesto) {
            progressPresupuesto.style.width = `${Math.min(100, porcentajeUtilizado)}%`;
            if (porcentajeUtilizado > 100) {
                progressPresupuesto.classList.replace('bg-primary', 'bg-red-500');
            }
        }

        const textPresupuestoUtilizado = document.getElementById('text-presupuesto-utilizado');
        if (textPresupuestoUtilizado) {
            textPresupuestoUtilizado.textContent = `${porcentajeUtilizado}% Utilizado (Semana ${latestWeek}, ${latestYear})`;
        }

        // Calcular Eficiencia General (Compliance)
        const eficiencia = totalMeta > 0 
            ? Math.max(0, Math.min(100, (1 - Math.abs(totalGasto - totalMeta) / totalMeta) * 100)) 
            : 0;

        const cardEficiencia = document.getElementById('card-eficiencia');
        if (cardEficiencia) {
            cardEficiencia.textContent = `${eficiencia.toFixed(1)}%`;
        }

        // 3. Renderizar Gráfico (Chart.js)
        renderChart(metas, gastos);

        // 4. Renderizar Movimientos Recientes
        renderRecentMovements(gastos);

    } catch (err) {
        console.error('Error al cargar datos del dashboard:', err);
    }
});

/**
 * Renderiza el progreso de ahorros semanal/anual usando Chart.js.
 */
function renderChart(metas, gastos) {
    const canvas = document.getElementById('savingsChart');
    if (!canvas) return;

    // Obtener lista de semanas únicas ordenadas
    const semanasMap = {};

    metas.forEach(m => {
        const key = `${m.anio}-W${String(m.semana).padStart(2, '0')}`;
        if (!semanasMap[key]) {
            semanasMap[key] = { label: `Semana ${m.semana}`, meta: 0, gasto: 0, anio: m.anio, semana: m.semana };
        }
        semanasMap[key].meta += Number(m.monto_meta);
    });

    gastos.forEach(g => {
        const key = `${g.anio}-W${String(g.semana).padStart(2, '0')}`;
        if (!semanasMap[key]) {
            semanasMap[key] = { label: `Semana ${g.semana}`, meta: 0, gasto: 0, anio: g.anio, semana: g.semana };
        }
        semanasMap[key].gasto += Number(g.monto_gasto);
    });

    const sortedWeeks = Object.keys(semanasMap).sort().map(key => semanasMap[key]);

    const labels = sortedWeeks.map(w => w.label);
    const metaData = sortedWeeks.map(w => w.meta);
    const gastoData = sortedWeeks.map(w => w.gasto);

    new Chart(canvas, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Gasto Real',
                    data: gastoData,
                    borderColor: '#f1d47f', // Oro Carolina
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
                    borderColor: '#98907f', // Color Outline
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
                legend: {
                    display: false // Usamos nuestra propia leyenda del HTML
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: $${context.raw.toLocaleString('es-CO')}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    grid: {
                        color: 'rgba(241, 212, 127, 0.05)'
                    },
                    ticks: {
                        color: '#98907f',
                        callback: function(value) {
                            return `$${(value / 1000000).toFixed(1)}M`;
                        }
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(241, 212, 127, 0.05)'
                    },
                    ticks: {
                        color: '#98907f'
                    }
                }
            }
        }
    });
}

/**
 * Renderiza los últimos gastos registrados en la base de datos.
 */
function renderRecentMovements(gastos) {
    const container = document.getElementById('recent-movements-container');
    if (!container) return;

    // Limpiar el contenido mock anterior
    container.innerHTML = '';

    // Ordenar gastos por fecha descendente
    const sortedGastos = [...gastos].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, 5);

    if (sortedGastos.length === 0) {
        container.innerHTML = `
            <div class="text-center p-md text-on-surface-variant font-body-md">
                No hay movimientos registrados recientemente.
            </div>
        `;
        return;
    }

    sortedGastos.forEach(g => {
        let icon = 'receipt_long';
        let colorClass = 'text-primary';

        switch (g.categoria) {
            case 'Combustible':
                icon = 'oil_barrel';
                colorClass = 'text-secondary';
                break;
            case 'Mantenimiento':
                icon = 'build';
                colorClass = 'text-primary';
                break;
            case 'Personal':
                icon = 'badge';
                colorClass = 'text-blue-400';
                break;
            case 'Peajes':
                icon = 'local_shipping';
                colorClass = 'text-emerald-400';
                break;
            case 'Administrativo':
                icon = 'description';
                colorClass = 'text-zinc-400';
                break;
        }

        const dateStr = new Date(g.fecha).toLocaleDateString('es-CO', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });

        const row = document.createElement('div');
        row.className = 'flex items-center justify-between p-sm hover:bg-surface-container-high transition-colors cursor-pointer group';
        row.innerHTML = `
            <div class="flex items-center gap-md">
                <div class="w-12 h-12 bg-surface-container-lowest flex items-center justify-center rounded">
                    <span class="material-symbols-outlined ${colorClass}">${icon}</span>
                </div>
                <div>
                    <p class="font-body-lg text-body-lg text-on-surface">${g.categoria} - ${g.descripcion || 'Sin descripción'}</p>
                    <p class="font-label-sm text-label-sm text-on-surface-variant">${dateStr} • Semana ${g.semana}</p>
                </div>
            </div>
            <div class="text-right">
                <p class="font-data-mono text-body-lg text-on-surface">-$${Number(g.monto_gasto).toLocaleString('es-CO', { maximumFractionDigits: 0 })}</p>
                <span class="text-secondary text-[10px] uppercase font-bold tracking-tighter">Procesado</span>
            </div>
        `;

        container.appendChild(row);
    });
}
