import { supabase } from './supabase.js';

// Elementos del DOM
const form = document.getElementById('expense-form');
const selectCategory = document.getElementById('expense-category');
const inputAmount = document.getElementById('expense-amount');
const inputDate = document.getElementById('expense-date');
const textareaDescription = document.getElementById('expense-description');

const txtResumenTitulo = document.getElementById('exp-resumen-titulo');
const txtPresupuestoSemanales = document.getElementById('exp-presupuesto-semanal');
const txtGastosSemanales = document.getElementById('exp-gastos-semanales');
const progressBar = document.getElementById('exp-progress-bar');
const recentExpensesContainer = document.getElementById('recent-expenses-container');

// Estado local para evitar llamadas repetitivas
let allMetas = [];
let allGastos = [];

// Establecer fecha de hoy por defecto en el formulario
const today = new Date();
const localDateString = today.toLocaleDateString('en-CA'); // YYYY-MM-DD local format
if (inputDate) {
    inputDate.value = localDateString;
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadInitialData();

    // Actualizar resumen al cargar la página
    if (inputDate && inputDate.value) {
        updateWeeklySummary(inputDate.value);
    }

    // Escuchar cambios en la fecha para actualizar el resumen de esa semana
    if (inputDate) {
        inputDate.addEventListener('change', (e) => {
            updateWeeklySummary(e.target.value);
        });
    }

    // Manejar envío de formulario
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;

            // Bloquear botón y mostrar feedback
            submitBtn.innerHTML = 'REGISTRANDO...';
            submitBtn.disabled = true;

            const category = selectCategory.value;
            const amount = parseFloat(inputAmount.value);
            const dateVal = inputDate.value;
            const description = textareaDescription.value.trim();

            const parsedDate = new Date(dateVal + 'T12:00:00'); // Evitar problemas de zona horaria
            const { week, year } = getWeekAndYear(parsedDate);

            try {
                // Insertar en la tabla gastos_semanales
                const { error } = await supabase
                    .from('gastos_semanales')
                    .insert([
                        {
                            categoria: category,
                            monto_gasto: amount,
                            semana: week,
                            anio: year,
                            fecha: dateVal,
                            descripcion: description
                        }
                    ]);

                if (error) throw error;

                // Feedback visual de éxito
                submitBtn.innerHTML = '<span class="material-symbols-outlined">check_circle</span> GUARDADO';
                submitBtn.classList.replace('rojo-corazon', 'bg-emerald-600');

                // Recargar datos
                await loadInitialData();
                updateWeeklySummary(dateVal);

                // Resetear campos del formulario (excepto fecha y categoría para agilizar cargas consecutivas)
                inputAmount.value = '';
                textareaDescription.value = '';

                setTimeout(() => {
                    submitBtn.innerHTML = originalText;
                    submitBtn.classList.replace('bg-emerald-600', 'rojo-corazon');
                    submitBtn.disabled = false;
                }, 2000);

            } catch (err) {
                console.error('Error al guardar el gasto:', err);
                alert('Ocurrió un error al guardar el gasto: ' + err.message);
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }
});

/**
 * Carga metas y gastos desde Supabase y renderiza los componentes.
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

        allMetas = metas;
        allGastos = gastos;

        // Renderizar últimos movimientos
        renderRecentExpenses(gastos);

    } catch (err) {
        console.error('Error al inicializar datos:', err);
    }
}

/**
 * Calcula la semana ISO y el año para una fecha dada.
 */
function getWeekAndYear(date) {
    const tempDate = new Date(date.valueOf());
    tempDate.setDate(tempDate.getDate() + 4 - (tempDate.getDay() || 7));
    const year = tempDate.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const week = Math.ceil((((tempDate - startOfYear) / 86400000) + 1) / 7);
    return { week, year };
}

/**
 * Actualiza el panel de "Resumen Semanal" basado en una fecha seleccionada.
 */
function updateWeeklySummary(dateString) {
    if (!dateString) return;

    const parsedDate = new Date(dateString + 'T12:00:00');
    const { week, year } = getWeekAndYear(parsedDate);

    if (txtResumenTitulo) {
        txtResumenTitulo.textContent = `RESUMEN SEMANA ${week} (${year})`;
    }

    // Filtrar metas y gastos para esta semana
    const metasSemana = allMetas.filter(m => m.semana === week && m.anio === year);
    const gastosSemana = allGastos.filter(g => g.semana === week && g.anio === year);

    const totalMeta = metasSemana.reduce((sum, m) => sum + Number(m.monto_meta), 0);
    const totalGasto = gastosSemana.reduce((sum, g) => sum + Number(g.monto_gasto), 0);

    // Actualizar textos
    if (txtPresupuestoSemanales) {
        txtPresupuestoSemanales.textContent = `$${totalMeta.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    if (txtGastosSemanales) {
        txtGastosSemanales.textContent = `$${totalGasto.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        
        // Si excede el presupuesto, cambiar a color rojo, de lo contrario a color de texto estándar
        if (totalMeta > 0 && totalGasto > totalMeta) {
            txtGastosSemanales.parentElement.className = 'flex justify-between items-center text-red-500 font-bold';
        } else {
            txtGastosSemanales.parentElement.className = 'flex justify-between items-center text-on-error';
        }
    }

    // Actualizar barra de progreso
    if (progressBar) {
        const pct = totalMeta > 0 ? Math.round((totalGasto / totalMeta) * 100) : 0;
        progressBar.style.width = `${Math.min(100, pct)}%`;

        // Modificar colores según nivel de gasto
        if (pct > 100) {
            progressBar.className = 'h-full bg-red-600 flex items-center justify-end';
        } else if (pct > 85) {
            progressBar.className = 'h-full bg-amber-500 flex items-center justify-end';
        } else {
            progressBar.className = 'h-full bg-primary/40 flex items-center justify-end';
        }
    }
}

/**
 * Renderiza los últimos movimientos en el panel lateral.
 */
function renderRecentExpenses(gastos) {
    if (!recentExpensesContainer) return;

    recentExpensesContainer.innerHTML = '';

    // Ordenar gastos por fecha/hora de creación descendente
    const sorted = [...gastos].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);

    if (sorted.length === 0) {
        recentExpensesContainer.innerHTML = `
            <div class="p-sm text-center text-on-surface-variant font-body-md">
                No hay gastos registrados recientemente.
            </div>
        `;
        return;
    }

    sorted.forEach(g => {
        let icon = 'receipt_long';
        switch (g.categoria) {
            case 'Combustible':
                icon = 'local_gas_station';
                break;
            case 'Mantenimiento':
                icon = 'build';
                break;
            case 'Personal':
                icon = 'badge';
                break;
            case 'Peajes':
                icon = 'local_shipping';
                break;
            case 'Administrativo':
                icon = 'description';
                break;
        }

        const dateObj = new Date(g.fecha + 'T12:00:00');
        const formattedDate = dateObj.toLocaleDateString('es-CO', {
            day: '2-digit',
            month: 'short'
        });

        const row = document.createElement('div');
        row.className = 'p-sm flex justify-between items-center hover:bg-surface-variant transition-colors';
        row.innerHTML = `
            <div class="flex items-center gap-sm">
                <div class="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center">
                    <span class="material-symbols-outlined text-primary">${icon}</span>
                </div>
                <div>
                    <p class="font-body-md text-body-md font-bold">${g.categoria} - ${g.descripcion || 'Gasto'}</p>
                    <p class="font-label-sm text-label-sm text-on-surface-variant">${formattedDate} • Semana ${g.semana}</p>
                </div>
            </div>
            <span class="font-data-mono text-data-mono text-on-surface">$${Number(g.monto_gasto).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        `;

        recentExpensesContainer.appendChild(row);
    });
}
