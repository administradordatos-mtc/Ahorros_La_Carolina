import { supabase } from './supabase.js';
import { checkSession } from './auth.js';

// Elementos del DOM
const tableBody = document.getElementById('execution-table-body');
const filterDept = document.getElementById('filter-dept');
const filterMonth = document.getElementById('filter-month');
const filterYear = document.getElementById('filter-year');
const loadingOverlay = document.getElementById('loading-overlay');

// Estado local
let currentUser = null;
let currentUserRole = null;

// Formateador de moneda en pesos colombianos (COP)
const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(val || 0);
};

const init = async () => {
    if (!supabase) {
        console.error('Supabase client not initialized.');
        return;
    }

    // 1. Validar sesión y rol del usuario
    const session = await checkSession();
    if (!session) return; // Redirigido por auth.js

    currentUser = session.user;
    currentUserRole = session.rol;

    // 2. Establecer mes actual en el selector por defecto
    const currentMonth = new Date().getMonth() + 1;
    if (filterMonth) {
        filterMonth.value = currentMonth.toString();
    }

    // 3. Cargar departamentos
    await loadDepartments();

    // 4. Cargar datos iniciales
    await loadData();

    // 5. Escuchar cambios en los filtros para recargar los datos
    [filterDept, filterMonth, filterYear].forEach(el => {
        if (el) {
            el.addEventListener('change', async () => {
                await loadData();
            });
        }
    });
};

/**
 * Carga los departamentos en el filtro select
 */
async function loadDepartments() {
    if (!filterDept) return;

    try {
        const { data: depts, error } = await supabase
            .from('departamentos')
            .select('*')
            .order('nombre', { ascending: true });

        if (error) throw error;

        filterDept.innerHTML = '<option value="">Todos los departamentos</option>';
        depts.forEach(d => {
            const opt = document.createElement('option');
            opt.value = d.id;
            opt.textContent = d.nombre;
            filterDept.appendChild(opt);
        });

    } catch (err) {
        console.error('Error al cargar departamentos:', err);
    }
}

/**
 * Carga las iniciativas y sus ejecuciones según los filtros aplicados
 */
async function loadData() {
    if (!tableBody) return;

    // Mostrar overlay de carga
    if (loadingOverlay) loadingOverlay.classList.remove('hidden');

    try {
        const deptId = filterDept ? filterDept.value : '';
        const mes = parseInt(filterMonth ? filterMonth.value : new Date().getMonth() + 1);
        const anio = parseInt(filterYear ? filterYear.value : new Date().getFullYear());

        // 1. Obtener iniciativas (filtradas por departamento si aplica)
        let query = supabase.from('iniciativas').select('*, departamentos(nombre)');
        if (deptId) {
            query = query.eq('departamento_id', parseInt(deptId));
        }
        const { data: initiatives, error: iniError } = await query;
        if (iniError) throw iniError;

        // 2. Obtener ejecuciones para el mes y año seleccionados
        const { data: ejecuciones, error: ejecError } = await supabase
            .from('iniciativas_ejecucion')
            .select('*')
            .eq('mes', mes)
            .eq('anio', anio);
        if (ejecError) throw ejecError;

        // Mapear ejecuciones por iniciativa_id para cruce eficiente
        const ejecMap = new Map();
        (ejecuciones || []).forEach(e => {
            ejecMap.set(e.iniciativa_id, e);
        });

        tableBody.innerHTML = '';

        if (!initiatives || initiatives.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="py-lg text-center text-on-surface-variant font-body-md">
                        No se encontraron iniciativas de ahorro para los filtros seleccionados.
                    </td>
                </tr>
            `;
            return;
        }

        initiatives.forEach(ini => {
            const ejec = ejecMap.get(ini.id) || {};
            const ahorroReal = ejec.ahorro_real_ejecutado !== undefined ? ejec.ahorro_real_ejecutado : '';
            const estado = ejec.estado_pipeline || 'Pendiente';
            const observaciones = ejec.observaciones || '';

            // Verificar si la iniciativa ya empezó a ejecutarse según su fecha de inicio
            const startDate = ini.fecha_inicio_ejecucion ? new Date(ini.fecha_inicio_ejecucion + 'T12:00:00') : null;
            let isStarted = true;
            if (startDate) {
                const startYear = startDate.getFullYear();
                const startMonth = startDate.getMonth() + 1;
                if (anio < startYear || (anio === startYear && mes < startMonth)) {
                    isStarted = false;
                }
            }

            const tr = document.createElement('tr');
            tr.className = 'hover:bg-surface-container-high/40 transition-colors group border-b border-primary/5';

            // El rol directivo tiene acceso de solo lectura. Si no ha empezado la iniciativa, también se bloquea.
            const isReadOnly = (currentUserRole === 'directivo') || !isStarted;
            const disabledAttr = isReadOnly ? 'disabled' : '';
            const inputClass = isReadOnly 
                ? 'opacity-60 cursor-not-allowed bg-transparent border-transparent' 
                : 'bg-[#0B0D0F] border-[#1E2226] focus:border-primary focus:ring-1 focus:ring-primary/20';

            // Formatear la fecha de inicio para mostrarla limpia
            let startFormatted = 'N/D';
            if (ini.fecha_inicio_ejecucion) {
                const dateParts = ini.fecha_inicio_ejecucion.split('-');
                if (dateParts.length === 3) {
                    startFormatted = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
                }
            }

            tr.innerHTML = `
                <td class="py-4 px-6">
                    <div class="flex flex-col">
                        <span class="font-semibold text-on-surface text-body-lg">${ini.nombre}</span>
                        <span class="text-[10px] text-primary uppercase font-bold tracking-wider mt-0.5">${ini.categoria || 'General'} • ${ini.tipo}</span>
                    </div>
                </td>
                <td class="py-4 px-6 text-on-surface-variant font-body-md">
                    ${ini.departamentos ? ini.departamentos.nombre : 'General'}
                </td>
                <td class="py-4 px-6 text-center font-data-mono text-xs text-on-surface-variant">
                    ${startFormatted}
                </td>
                <td class="py-4 px-6 text-right font-data-mono font-semibold text-primary">
                    ${formatCurrency(ini.esperado_mes)}
                </td>
                <td class="py-4 px-6 text-center">
                    <div class="flex justify-center">
                        ${!isStarted ? `
                            <span class="text-[11px] text-secondary-fixed-dim bg-secondary-container/20 border border-secondary-container/30 px-2 py-0.5 rounded font-bold uppercase">No Iniciada</span>
                        ` : `
                            <input type="number" step="0.01" value="${ahorroReal}" placeholder="0" ${disabledAttr} 
                                class="w-full max-w-[140px] text-right text-on-surface font-data-mono text-body-md px-sm py-[4px] rounded-lg outline-none transition-all ${inputClass}"
                                data-field="real" data-id="${ini.id}"/>
                        `}
                    </div>
                </td>
                <td class="py-4 px-6 text-center">
                    <div class="flex justify-center">
                        ${!isStarted ? `
                            <span class="text-xs text-on-surface-variant/40">—</span>
                        ` : `
                            <select ${disabledAttr} 
                                class="w-full max-w-[130px] text-center text-on-surface font-body-md text-body-md px-sm py-[4px] rounded-lg outline-none transition-all cursor-pointer ${inputClass}"
                                data-field="estado" data-id="${ini.id}">
                                <option value="Pendiente" ${estado === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                                <option value="En Revisión" ${estado === 'En Revisión' ? 'selected' : ''}>En Revisión</option>
                                <option value="Validado" ${estado === 'Validado' ? 'selected' : ''}>Validado</option>
                                <option value="Observado" ${estado === 'Observado' ? 'selected' : ''}>Observado</option>
                            </select>
                        `}
                    </div>
                </td>
                <td class="py-4 px-6">
                    ${!isStarted ? `
                        <span class="text-xs text-on-surface-variant/40 italic">La iniciativa comienza el ${startFormatted}</span>
                    ` : `
                        <input type="text" value="${observaciones}" ${disabledAttr} 
                            class="w-full text-on-surface font-body-md text-body-md px-sm py-[4px] rounded-lg outline-none transition-all ${inputClass}"
                            placeholder="Agregar nota de control..." data-field="observaciones" data-id="${ini.id}"/>
                    `}
                </td>
                <td class="py-4 px-6 text-center">
                    ${isReadOnly ? `
                        <span class="material-symbols-outlined text-on-surface-variant/40" title="${!isStarted ? 'No iniciada en este período' : 'Solo lectura'}">lock</span>
                    ` : `
                        <button class="bg-[#C52724] hover:bg-[#a0020e] text-white px-md py-[6px] font-headline-md text-headline-md rounded-lg active:scale-95 transition-all inline-flex items-center gap-xs btn-guardar-fila shadow-lg shadow-black/25" 
                            data-id="${ini.id}">
                            GUARDAR
                        </button>
                    `}
                </td>
            `;

            tableBody.appendChild(tr);
        });

        // Vincular los eventos de los botones de guardar por fila
        document.querySelectorAll('.btn-guardar-fila').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                await saveRow(id, btn);
            });
        });

    } catch (err) {
        console.error('Error al cargar ejecuciones:', err);
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="py-lg text-center text-error font-semibold">
                    Error al consultar ejecuciones de la base de datos: ${err.message}
                </td>
            </tr>
        `;
    } finally {
        if (loadingOverlay) loadingOverlay.classList.add('hidden');
    }
}

/**
 * Guarda o actualiza los datos de ejecución mensual para una iniciativa
 */
async function saveRow(iniId, btn) {
    const originalText = btn.innerHTML;

    // Obtener campos de entrada correspondientes
    const realInput = document.querySelector(`input[data-field="real"][data-id="${iniId}"]`);
    const estadoSelect = document.querySelector(`select[data-field="estado"][data-id="${iniId}"]`);
    const obsInput = document.querySelector(`input[data-field="observaciones"][data-id="${iniId}"]`);

    if (!realInput || !estadoSelect) return;

    const realValue = parseFloat(realInput.value) || 0;
    const estadoValue = estadoSelect.value;
    const obsValue = obsInput ? obsInput.value.trim() : '';

    const mes = parseInt(filterMonth ? filterMonth.value : new Date().getMonth() + 1);
    const anio = parseInt(filterYear ? filterYear.value : new Date().getFullYear());

    btn.innerHTML = 'GUARDANDO...';
    btn.disabled = true;

    try {
        const payload = {
            iniciativa_id: iniId,
            mes: mes,
            anio: anio,
            ahorro_real_ejecutado: realValue,
            estado_pipeline: estadoValue,
            observaciones: obsValue,
            validado_por: estadoValue === 'Validado' && currentUser ? currentUser.id : null,
            fecha_validacion: estadoValue === 'Validado' ? new Date().toISOString() : null,
            updated_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('iniciativas_ejecucion')
            .upsert(payload, {
                onConflict: 'iniciativa_id,mes,anio'
            });

        if (error) throw error;

        // Feedback visual de éxito
        btn.innerHTML = '<span class="material-symbols-outlined text-[14px]">check_circle</span> GUARDADO';
        btn.style.backgroundColor = '#10B981'; // Verde esmeralda de éxito
        btn.style.borderColor = '#10B981';

        // Reestablecer botón después de un momento
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.backgroundColor = '';
            btn.style.borderColor = '';
            btn.disabled = false;
        }, 1500);

    } catch (err) {
        console.error('Error al actualizar registro de ejecución:', err);
        alert('Ocurrió un error al guardar la ejecución mensual: ' + err.message);
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
