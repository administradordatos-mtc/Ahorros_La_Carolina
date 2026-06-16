import { supabase } from './supabase.js';

// Elementos del DOM
const container = document.getElementById('kpis-table-body');
const selectDept = document.getElementById('kpi-filter-dept');
const selectMonth = document.getElementById('kpi-filter-month');
const selectYear = document.getElementById('kpi-filter-year');
const form = document.getElementById('kpi-tracking-form');
const saveContainer = document.getElementById('save-button-container');

let isAdmin = false;

const init = async () => {
    if (!supabase) {
        console.error('Supabase client not initialized.');
        return;
    }

    // Validar rol del usuario
    const userRole = localStorage.getItem('user_role');
    isAdmin = userRole === 'administrador';
    if (isAdmin && saveContainer) {
        saveContainer.classList.remove('hidden');
    }

    // Cargar departamentos
    await loadDepartments();

    // Eventos de filtros
    const handleFilterChange = async () => {
        const deptId = selectDept.value;
        const month = parseInt(selectMonth.value);
        const year = parseInt(selectYear.value);

        if (deptId && month && year) {
            await loadKPIs(deptId, month, year);
        } else {
            container.innerHTML = `
                <tr>
                    <td colspan="5" class="py-lg text-center text-on-surface-variant">
                        Selecciona un departamento, mes y año para visualizar sus indicadores.
                    </td>
                </tr>
            `;
        }
    };

    if (selectDept) selectDept.addEventListener('change', handleFilterChange);
    if (selectMonth) selectMonth.addEventListener('change', handleFilterChange);
    if (selectYear) selectYear.addEventListener('change', handleFilterChange);

    // Formulario de Envío (Guardar valores reales)
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;

            const deptId = selectDept.value;
            const month = parseInt(selectMonth.value);
            const year = parseInt(selectYear.value);

            if (!deptId || !month || !year) {
                alert('Filtros inválidos.');
                return;
            }

            // Recopilar valores de los inputs
            const inputs = form.querySelectorAll('input[name^="kpi-"]');
            const upsertData = [];

            inputs.forEach(input => {
                const kpiId = input.name.replace('kpi-', '');
                const value = input.value.trim();
                if (value !== '') {
                    upsertData.push({
                        kpi_id: kpiId,
                        mes: month,
                        anio: year,
                        valor_real: value
                    });
                }
            });

            if (upsertData.length === 0) {
                alert('No hay valores reales para guardar.');
                return;
            }

            submitBtn.innerHTML = 'GUARDANDO...';
            submitBtn.disabled = true;

            try {
                // Realizar upsert masivo en Supabase
                const { error } = await supabase
                    .from('kpi_seguimiento')
                    .upsert(upsertData, { onConflict: 'kpi_id,mes,anio' });

                if (error) throw error;

                // Feedback visual de éxito
                submitBtn.innerHTML = '<span class="material-symbols-outlined">check_circle</span> GUARDADO';
                submitBtn.style.backgroundColor = '#10B981';

                // Recargar datos
                await loadKPIs(deptId, month, year);

                setTimeout(() => {
                    submitBtn.innerHTML = originalText;
                    submitBtn.style.backgroundColor = '';
                    submitBtn.disabled = false;
                }, 1500);

            } catch (err) {
                console.error('Error al guardar valores reales de KPIs:', err);
                alert('Ocurrió un error al guardar los indicadores: ' + err.message);
                submitBtn.innerHTML = originalText;
                submitBtn.style.backgroundColor = '';
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
 * Carga los departamentos en el elemento <select>
 */
async function loadDepartments() {
    if (!selectDept) return;

    try {
        const { data: depts, error } = await supabase
            .from('departamentos')
            .select('*')
            .order('nombre', { ascending: true });

        if (error) throw error;

        selectDept.innerHTML = '<option value="">-- Seleccionar --</option>';

        if (depts && depts.length > 0) {
            depts.forEach(d => {
                const opt = document.createElement('option');
                opt.value = d.id;
                opt.textContent = d.nombre;
                selectDept.appendChild(opt);
            });

            // Seleccionar por defecto Tecnología (TI) si está presente
            const tecOption = Array.from(selectDept.options).find(opt => opt.text === 'Tecnología (TI)');
            if (tecOption) {
                selectDept.value = tecOption.value;
                const month = parseInt(selectMonth.value);
                const year = parseInt(selectYear.value);
                await loadKPIs(tecOption.value, month, year);
            }
        }
    } catch (err) {
        console.error('Error al cargar departamentos en KPIs:', err);
        selectDept.innerHTML = '<option value="">Error al cargar</option>';
    }
}

/**
 * Carga y renderiza los KPIs y sus valores reales para el mes/año seleccionado
 */
async function loadKPIs(deptId, month, year) {
    if (!container) return;

    container.innerHTML = `
        <tr>
            <td colspan="5" class="py-lg text-center text-on-surface-variant">
                Cargando indicadores (KPIs)...
            </td>
        </tr>
    `;

    try {
        // 1. Obtener la lista de KPIs del departamento
        const { data: kpiList, error: kpiError } = await supabase
            .from('kpis')
            .select('*')
            .eq('departamento_id', deptId)
            .order('created_at', { ascending: true });

        if (kpiError) throw kpiError;

        if (!kpiList || kpiList.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="5" class="py-lg text-center text-on-surface-variant">
                        No hay KPIs definidos para este departamento.
                    </td>
                </tr>
            `;
            return;
        }

        // 2. Obtener los valores reales reportados de esos KPIs en el mes y año seleccionados
        const kpiIds = kpiList.map(k => k.id);
        const { data: trackingList, error: trackingError } = await supabase
            .from('kpi_seguimiento')
            .select('*')
            .in('kpi_id', kpiIds)
            .eq('mes', month)
            .eq('anio', year);

        if (trackingError) throw trackingError;

        // Crear mapa para búsquedas rápidas kpi_id -> valor_real
        const trackingMap = {};
        if (trackingList && trackingList.length > 0) {
            trackingList.forEach(t => {
                trackingMap[t.kpi_id] = t.valor_real;
            });
        }

        // 3. Renderizar tabla
        container.innerHTML = '';
        kpiList.forEach(k => {
            const row = document.createElement('tr');
            row.className = 'border-b border-primary/5 hover:bg-surface-variant/20 transition-colors';

            const currentValue = trackingMap[k.id] || '';

            // Definir qué renderizar en la celda de Valor Real según el rol del usuario
            let realValueHtml = '';
            if (isAdmin) {
                realValueHtml = `
                    <input type="text" 
                           name="kpi-${k.id}" 
                           value="${currentValue}" 
                           placeholder="Ingresar valor..." 
                           class="w-full max-w-[200px] bg-[#0B0D0F] border border-[#1E2226] text-on-surface font-body-md text-body-md px-sm py-[4px] rounded-lg focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all" />
                `;
            } else {
                realValueHtml = `
                    <span class="font-semibold text-primary">${currentValue !== '' ? currentValue : '-'}</span>
                `;
            }

            row.innerHTML = `
                <td class="py-4 px-6 font-body-md text-on-surface font-semibold">${k.nombre_kpi}</td>
                <td class="py-4 px-6 text-on-surface-variant">${k.linea_base || '-'}</td>
                <td class="py-4 px-6 text-on-surface-variant">${k.meta_mensual || '-'}</td>
                <td class="py-4 px-6 text-on-surface-variant">
                    <span class="px-xs py-[2px] rounded text-[10px] font-bold bg-zinc-700/50 text-zinc-300">
                        ${k.frecuencia}
                    </span>
                </td>
                <td class="py-4 px-6">${realValueHtml}</td>
            `;

            container.appendChild(row);
        });

    } catch (err) {
        console.error('Error al cargar KPIs:', err);
        container.innerHTML = `
            <tr>
                <td colspan="5" class="py-lg text-center text-red-500 font-bold">
                    Error al cargar los indicadores: ${err.message}
                </td>
            </tr>
        `;
    }
}
