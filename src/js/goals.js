import { supabase } from './supabase.js';

// DOM elements
const btnNuevaMeta = document.getElementById('btn-nueva-meta');
const btnCloseModal = document.getElementById('btn-close-modal');
const modal = document.getElementById('new-goal-modal');
const form = document.getElementById('goal-form');

const selectCategory = document.getElementById('goal-category');
const inputAmount = document.getElementById('goal-amount');
const inputWeek = document.getElementById('goal-week');
const inputYear = document.getElementById('goal-year');
const inputDate = document.getElementById('goal-date');

const goalsGridContainer = document.getElementById('goals-grid-container');

// Elementos de Filtros
const filterCategory = document.getElementById('filter-category');
const filterYear = document.getElementById('filter-year');
const searchWeek = document.getElementById('search-week');

// Elementos de KPIs Consolidados
const kpiTasaCumplimiento = document.getElementById('kpi-tasa-cumplimiento');
const kpiDesviacionTotal = document.getElementById('kpi-desviacion-total');
const kpiDesviacionLabel = document.getElementById('kpi-desviacion-label');
const kpiCategoriaCritica = document.getElementById('kpi-categoria-critica');

// Almacenamiento local para evitar llamadas reiteradas y agilizar filtros
let allMetas = [];
let allGastos = [];

// Formateador de moneda
const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(val || 0);
};

// Obtener la semana actual del año y el día actual para proyecciones
const getActualWeekAndYear = () => {
    const today = new Date();
    const tempDate = new Date(today.valueOf());
    tempDate.setDate(tempDate.getDate() + 4 - (tempDate.getDay() || 7));
    const year = tempDate.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const week = Math.ceil((((tempDate - startOfYear) / 86400000) + 1) / 7);
    const day = Math.max(1, Math.min(7, today.getDay() || 7)); // Lunes = 1, Domingo = 7
    return { week, year, day };
};
const actualPeriod = getActualWeekAndYear();

// Set default values for modal inputs
const today = new Date();
if (inputYear) inputYear.value = today.getFullYear();
if (inputWeek) {
    inputWeek.value = actualPeriod.week;
}
if (inputDate) {
    inputDate.value = today.toLocaleDateString('en-CA');
}

const init = async () => {
    if (!supabase) {
        console.warn('Goals: Supabase client is not initialized.');
        return;
    }

    // Validar rol del usuario
    const userRole = localStorage.getItem('user_role');
    if (userRole !== 'administrador') {
        if (btnNuevaMeta) {
            btnNuevaMeta.classList.add('hidden');
        }
    }

    // Cargar y renderizar metas por primera vez
    await loadInitialData();

    // Eventos de los filtros
    if (filterCategory) filterCategory.addEventListener('change', applyFiltersAndRender);
    if (filterYear) filterYear.addEventListener('change', applyFiltersAndRender);
    if (searchWeek) searchWeek.addEventListener('input', applyFiltersAndRender);

    // Open Modal
    if (btnNuevaMeta && modal) {
        btnNuevaMeta.addEventListener('click', () => {
            modal.classList.remove('hidden');
        });
    }

    // Close Modal
    if (btnCloseModal && modal) {
        btnCloseModal.addEventListener('click', () => {
            modal.classList.add('hidden');
        });
    }

    // Close Modal on clicking outside the form card
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });
    }

    // Handle form submit (Insert or Upsert Goal)
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;

            submitBtn.innerHTML = 'GUARDANDO...';
            submitBtn.disabled = true;

            const category = selectCategory.value;
            const amount = parseFloat(inputAmount.value);
            const week = parseInt(inputWeek.value);
            const year = parseInt(inputYear.value);
            const dateVal = inputDate.value;

            try {
                // Upsert to handle updates seamlessly if category/week/year already exists
                const { error } = await supabase
                    .from('metas_semanales')
                    .upsert({
                        categoria: category,
                        monto_meta: amount,
                        semana: week,
                        anio: year,
                        fecha_inicio: dateVal
                    }, {
                        onConflict: 'categoria,semana,anio'
                    });

                if (error) throw error;

                submitBtn.innerHTML = '<span class="material-symbols-outlined">check_circle</span> GUARDADO';
                submitBtn.classList.replace('rojo-corazon', 'bg-emerald-600');

                // Reload metas
                await loadInitialData();

                // Clear input amount
                inputAmount.value = '';

                setTimeout(() => {
                    submitBtn.innerHTML = originalText;
                    submitBtn.classList.replace('bg-emerald-600', 'rojo-corazon');
                    submitBtn.disabled = false;
                    modal.classList.add('hidden');
                }, 1500);

            } catch (err) {
                console.error('Error al guardar la meta:', err);
                alert('Error al guardar la meta: ' + err.message);
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

/**
 * Carga metas y gastos desde Supabase
 */
async function loadInitialData() {
    try {
        const { data: metas, error: metasError } = await supabase
            .from('metas_semanales')
            .select('*');

        const { data: gastos, error: gastosError } = await supabase
            .from('gastos_semanales')
            .select('*');

        if (metasError) throw metasError;
        if (gastosError) throw gastosError;

        allMetas = metas || [];
        allGastos = gastos || [];

        // Calcular y renderizar indicadores de KPI en el dashboard de metas
        calculateAndRenderKPIs();

        // Aplicar filtros e iniciar renderizado del grid
        applyFiltersAndRender();

    } catch (err) {
        console.error('Error al cargar datos de metas:', err);
    }
}

/**
 * Calcula métricas generales de cumplimiento del presupuesto
 */
function calculateAndRenderKPIs() {
    if (allMetas.length === 0) {
        if (kpiTasaCumplimiento) kpiTasaCumplimiento.textContent = '0%';
        if (kpiDesviacionTotal) kpiDesviacionTotal.textContent = '$0';
        if (kpiCategoriaCritica) kpiCategoriaCritica.textContent = 'NINGUNA';
        return;
    }

    let metasCumplidas = 0;
    let desviacionTotalAcumulada = 0;
    const fallosPorCategoria = {};
    const desviacionNegativaPorCategoria = {};

    allMetas.forEach(meta => {
        // Encontrar gastos de esta meta
        const gastosFiltrados = allGastos.filter(g => 
            g.anio === meta.anio && 
            g.semana === meta.semana && 
            g.categoria === meta.categoria
        );

        const totalGasto = gastosFiltrados.reduce((sum, g) => sum + Number(g.monto_gasto), 0);
        const desviacion = Number(meta.monto_meta) - totalGasto;
        desviacionTotalAcumulada += desviacion;

        if (desviacion >= 0) {
            metasCumplidas++;
        } else {
            // Sobregasto
            const exceso = Math.abs(desviacion);
            fallosPorCategoria[meta.categoria] = (fallosPorCategoria[meta.categoria] || 0) + 1;
            desviacionNegativaPorCategoria[meta.categoria] = (desviacionNegativaPorCategoria[meta.categoria] || 0) + exceso;
        }
    });

    // Tasa de cumplimiento
    const tasa = Math.round((metasCumplidas / allMetas.length) * 100);
    if (kpiTasaCumplimiento) {
        kpiTasaCumplimiento.textContent = `${tasa}%`;
    }

    // Ahorro o sobregasto neto
    if (kpiDesviacionTotal) {
        kpiDesviacionTotal.textContent = formatCurrency(Math.abs(desviacionTotalAcumulada));
        if (desviacionTotalAcumulada >= 0) {
            kpiDesviacionTotal.className = 'font-data-mono text-display-lg text-emerald-400 mt-xs';
            if (kpiDesviacionLabel) kpiDesviacionLabel.textContent = 'Ahorro neto acumulado';
        } else {
            kpiDesviacionTotal.className = 'font-data-mono text-display-lg text-secondary mt-xs';
            if (kpiDesviacionLabel) kpiDesviacionLabel.textContent = 'Sobregasto neto acumulado';
        }
    }

    // Categoría crítica (la que tiene más dinero de sobregasto acumulado)
    let catCritica = 'NINGUNA';
    let maxSobregasto = 0;

    Object.keys(desviacionNegativaPorCategoria).forEach(cat => {
        if (desviacionNegativaPorCategoria[cat] > maxSobregasto) {
            maxSobregasto = desviacionNegativaPorCategoria[cat];
            catCritica = cat.toUpperCase();
        }
    });

    if (kpiCategoriaCritica) {
        kpiCategoriaCritica.textContent = catCritica;
    }
}

/**
 * Filtra las metas en memoria y las renderiza en el grid
 */
function applyFiltersAndRender() {
    if (!goalsGridContainer) return;

    const catSelected = filterCategory?.value || '';
    const yearSelected = filterYear?.value ? parseInt(filterYear.value) : '';
    const weekQuery = searchWeek?.value ? parseInt(searchWeek.value) : '';

    // Filtrar
    const filteredMetas = allMetas.filter(meta => {
        const matchCategory = !catSelected || meta.categoria === catSelected;
        const matchYear = !yearSelected || meta.anio === yearSelected;
        const matchWeek = !weekQuery || meta.semana === weekQuery;
        return matchCategory && matchYear && matchWeek;
    });

    // Limpiar grid
    goalsGridContainer.innerHTML = '';

    if (filteredMetas.length === 0) {
        goalsGridContainer.innerHTML = `
            <div class="col-span-2 text-center p-lg text-on-surface-variant font-body-md bg-surface-container-low rounded-xl c-frame border border-primary/10">
                No hay metas presupuestales que coincidan con los filtros seleccionados.
            </div>
        `;
        return;
    }

    // Ordenar metas por año y semana descendente
    const sorted = [...filteredMetas].sort((a, b) => {
        if (b.anio !== a.anio) return b.anio - a.anio;
        if (b.semana !== a.semana) return b.semana - a.semana;
        return a.categoria.localeCompare(b.categoria);
    });

    sorted.forEach(meta => {
        // Encontrar gastos reales
        const gastosFiltrados = allGastos.filter(g => 
            g.anio === meta.anio && 
            g.semana === meta.semana && 
            g.categoria === meta.categoria
        );

        const totalGasto = gastosFiltrados.reduce((sum, g) => sum + Number(g.monto_gasto), 0);
        const ratio = meta.monto_meta > 0 ? Math.round((totalGasto / meta.monto_meta) * 100) : 0;

        let icon = 'flag';
        let iconBgColor = 'bg-primary/10';
        let iconColor = 'text-primary';

        switch (meta.categoria) {
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

        // Semáforo dinámico de estado
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

        // Lógica Preventiva de Proyección para la semana actual
        const isCurrentWeek = (meta.anio === actualPeriod.year && meta.semana === actualPeriod.week);
        let projectionHtml = '';

        if (isCurrentWeek) {
            // Calcular gasto diario promedio y proyectar a 7 días
            const gastoProyectado = (totalGasto / actualPeriod.day) * 7;
            const ratioProyectado = meta.monto_meta > 0 ? Math.round((gastoProyectado / meta.monto_meta) * 100) : 0;
            
            if (ratioProyectado > 100 && ratio <= 100) {
                // Alerta preventiva prominente
                projectionHtml = `
                    <div class="mt-xs p-xs bg-amber-500/10 border border-amber-500/20 rounded text-[11px] text-amber-400 flex items-center gap-xs">
                        <span class="material-symbols-outlined text-[14px]">warning</span>
                        <span><strong>Alerta Preventiva:</strong> Ritmo actual proyecta $${Math.round(gastoProyectado).toLocaleString('es-CO')} (${ratioProyectado}%) al cierre.</span>
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
                        <span>Ritmo bajo control. Proyección final: $${Math.round(gastoProyectado).toLocaleString('es-CO')} (${ratioProyectado}%).</span>
                    </div>
                `;
            }
        }

        const card = document.createElement('div');
        // Agregamos la clase pulseClass si aplica
        card.className = `bg-surface-container-low p-md rounded-xl c-frame flex flex-col gap-md group hover:bg-surface-container transition-all ${pulseClass}`;
        card.innerHTML = `
            <div class="flex justify-between items-start">
                <div class="flex gap-sm items-center">
                    <div class="p-xs ${iconBgColor} rounded-lg">
                        <span class="material-symbols-outlined ${iconColor}" style="font-variation-settings: 'FILL' 1;">${icon}</span>
                    </div>
                    <div>
                        <h3 class="font-title-lg text-title-lg text-on-surface">${meta.categoria} - Semana ${meta.semana}</h3>
                        <p class="font-body-md text-body-md text-on-surface-variant">${meta.anio} • Límite Presupuestal ${isCurrentWeek ? '<span class="text-primary font-bold">(SEMANA ACTUAL)</span>' : ''}</p>
                    </div>
                </div>
                <span class="${statusClass} px-xs py-base text-label-sm rounded-sm font-label-sm uppercase tracking-wider">${statusText}</span>
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

    // Add interactive border transitions to new cards
    document.querySelectorAll('.c-frame').forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.borderColor = 'rgba(241, 212, 127, 0.4)';
        });
        card.addEventListener('mouseleave', () => {
            card.style.borderColor = 'rgba(241, 212, 127, 0.15)';
        });
    });
}
