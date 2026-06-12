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

// Set default values for modal inputs
const today = new Date();
if (inputYear) inputYear.value = today.getFullYear();
if (inputWeek) {
    const tempDate = new Date(today.valueOf());
    tempDate.setDate(tempDate.getDate() + 4 - (tempDate.getDay() || 7));
    const year = tempDate.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const week = Math.ceil((((tempDate - startOfYear) / 86400000) + 1) / 7);
    inputWeek.value = week;
}
if (inputDate) {
    // Default date is today
    inputDate.value = today.toLocaleDateString('en-CA');
}

document.addEventListener('DOMContentLoaded', async () => {
    // Load and render goals
    await loadAndRenderGoals();

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
                await loadAndRenderGoals();

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
});

/**
 * Loads metas and actual gastos from Supabase, aggregates, and renders them.
 */
async function loadAndRenderGoals() {
    if (!goalsGridContainer) return;

    try {
        const { data: metas, error: metasError } = await supabase
            .from('metas_semanales')
            .select('*');

        const { data: gastos, error: gastosError } = await supabase
            .from('gastos_semanales')
            .select('*');

        if (metasError) throw metasError;
        if (gastosError) throw gastosError;

        // Clear grid container
        goalsGridContainer.innerHTML = '';

        if (metas.length === 0) {
            goalsGridContainer.innerHTML = `
                <div class="col-span-2 text-center p-lg text-on-surface-variant font-body-md bg-surface-container-low rounded-xl c-frame border border-primary/10">
                    No hay metas presupuestales creadas. Haga clic en "NUEVA META" para crear una.
                </div>
            `;
            return;
        }

        // Sort metas by year and week descending, then by category
        const sortedMetas = [...metas].sort((a, b) => {
            if (b.anio !== a.anio) return b.anio - a.anio;
            if (b.semana !== a.semana) return b.semana - a.semana;
            return a.categoria.localeCompare(b.categoria);
        });

        sortedMetas.forEach(meta => {
            // Find corresponding gastos for this meta (same year, week, and category)
            const gastosFiltrados = gastos.filter(g => 
                g.anio === meta.anio && 
                g.semana === meta.semana && 
                g.categoria === meta.categoria
            );

            const totalGasto = gastosFiltrados.reduce((sum, g) => sum + Number(g.monto_gasto), 0);
            const ratio = meta.monto_meta > 0 ? Math.round((totalGasto / meta.monto_meta) * 100) : 0;
            const metaRestante = meta.monto_meta - totalGasto;

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

            // Status tag
            let statusText = 'BAJO LÍMITE';
            let statusClass = 'bg-emerald-500/10 text-emerald-400';

            if (ratio > 100) {
                statusText = 'EXCEDIDO';
                statusClass = 'bg-red-500/10 text-red-400';
            } else if (ratio > 85) {
                statusText = 'CRÍTICO';
                statusClass = 'bg-amber-500/10 text-amber-400';
            }

            const card = document.createElement('div');
            card.className = 'bg-surface-container-low p-md rounded-xl c-frame flex flex-col gap-md group hover:bg-surface-container transition-all';
            card.innerHTML = `
                <div class="flex justify-between items-start">
                    <div class="flex gap-sm items-center">
                        <div class="p-xs ${iconBgColor} rounded-lg">
                            <span class="material-symbols-outlined ${iconColor}" style="font-variation-settings: 'FILL' 1;">${icon}</span>
                        </div>
                        <div>
                            <h3 class="font-title-lg text-title-lg text-on-surface">${meta.categoria} - Semana ${meta.semana}</h3>
                            <p class="font-body-md text-body-md text-on-surface-variant">${meta.anio} • Límite Presupuestal</p>
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
                        <div class="h-1 ${ratio > 100 ? 'bg-red-500' : 'bg-primary'} relative transition-all duration-1000 ease-out flex items-center justify-end" style="width: ${Math.min(100, ratio)}%;">
                            <span class="${ratio > 100 ? 'text-red-500' : 'text-primary'} translate-x-1/2 font-bold select-none text-xl">»»</span>
                        </div>
                    </div>
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

    } catch (err) {
        console.error('Error al cargar metas:', err);
    }
}
