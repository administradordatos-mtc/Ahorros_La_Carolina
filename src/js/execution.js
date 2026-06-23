import { supabase } from './supabase.js';
import { checkSession } from './auth.js';

// Elementos del DOM - Contenedores y Controles
const tableBody = document.getElementById('execution-table-body');
const filterDept = document.getElementById('filter-dept');
const filterMonth = document.getElementById('filter-month');
const filterYear = document.getElementById('filter-year');
const loadingOverlay = document.getElementById('loading-overlay');

const tableViewContainer = document.getElementById('table-view-container');
const kanbanViewContainer = document.getElementById('kanban-view-container');
const btnViewTable = document.getElementById('view-table-btn');
const btnViewKanban = document.getElementById('view-kanban-btn');

// Estado local
let currentUser = null;
let currentUserRole = null;
let currentView = 'table'; // 'table' o 'kanban'

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

    // 4. Configurar escuchadores de Toggle de Vista
    if (btnViewTable && btnViewKanban) {
        btnViewTable.addEventListener('click', () => setView('table'));
        btnViewKanban.addEventListener('click', () => setView('kanban'));
    }

    // 5. Cargar datos iniciales
    await loadData();

    // 6. Escuchar cambios en los filtros para recargar los datos
    [filterDept, filterMonth, filterYear].forEach(el => {
        if (el) {
            el.addEventListener('change', async () => {
                await loadData();
            });
        }
    });
};

/**
 * Cambia la visualización activa entre Tabla y Kanban
 */
function setView(view) {
    currentView = view;
    if (view === 'table') {
        if (tableViewContainer) tableViewContainer.classList.remove('hidden');
        if (kanbanViewContainer) kanbanViewContainer.classList.add('hidden');

        btnViewTable.className = 'flex items-center gap-xs px-sm py-[5px] rounded-lg text-primary bg-surface-container font-body-md text-body-md active:scale-95 transition-all';
        btnViewKanban.className = 'flex items-center gap-xs px-sm py-[5px] rounded-lg text-on-surface-variant hover:text-white font-body-md text-body-md active:scale-95 transition-all';
    } else {
        if (tableViewContainer) tableViewContainer.classList.add('hidden');
        if (kanbanViewContainer) kanbanViewContainer.classList.remove('hidden');

        btnViewTable.className = 'flex items-center gap-xs px-sm py-[5px] rounded-lg text-on-surface-variant hover:text-white font-body-md text-body-md active:scale-95 transition-all';
        btnViewKanban.className = 'flex items-center gap-xs px-sm py-[5px] rounded-lg text-primary bg-surface-container font-body-md text-body-md active:scale-95 transition-all';
    }

    loadData();
}

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
    const isTable = currentView === 'table';

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

        // Contenedores del Kanban
        const columns = {
            'Pendiente': document.querySelector('.kanban-cards-area[data-status="Pendiente"]'),
            'En Revisión': document.querySelector('.kanban-cards-area[data-status="En Revisión"]'),
            'Validado': document.querySelector('.kanban-cards-area[data-status="Validado"]'),
            'Observado': document.querySelector('.kanban-cards-area[data-status="Observado"]')
        };

        const counts = {
            'Pendiente': document.getElementById('count-pendiente'),
            'En Revisión': document.getElementById('count-revision'),
            'Validado': document.getElementById('count-validado'),
            'Observado': document.getElementById('count-observado')
        };

        const countsVal = { 'Pendiente': 0, 'En Revisión': 0, 'Validado': 0, 'Observado': 0 };

        // Limpiar vistas
        if (isTable) {
            tableBody.innerHTML = '';
        } else {
            Object.values(columns).forEach(col => {
                if (col) col.innerHTML = '';
            });
        }

        if (!initiatives || initiatives.length === 0) {
            if (isTable) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="8" class="py-lg text-center text-on-surface-variant font-body-md">
                            No se encontraron iniciativas de ahorro para los filtros seleccionados.
                        </td>
                    </tr>
                `;
            } else {
                Object.values(columns).forEach(col => {
                    if (col) col.innerHTML = '<div class="text-center py-sm text-xs text-on-surface-variant/40 italic">Vacío</div>';
                });
                Object.keys(counts).forEach(k => { if (counts[k]) counts[k].textContent = '0'; });
            }
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

            if (isTable) {
                const tr = document.createElement('tr');
                tr.className = 'hover:bg-surface-container-high/40 transition-colors group border-b border-primary/5';

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
            } else {
                // Renderizado para Kanban
                const columnEl = columns[estado];
                if (columnEl) {
                    countsVal[estado]++;

                    const card = document.createElement('div');
                    card.className = `bg-surface-container-high p-sm rounded-xl border border-primary/5 hover:border-primary/20 transition-all flex flex-col gap-xs select-none relative ${isReadOnly ? 'opacity-85' : 'cursor-grab active:cursor-grabbing'}`;

                    if (!isReadOnly) {
                        card.setAttribute('draggable', 'true');
                        card.setAttribute('data-id', ini.id);
                    }

                    card.innerHTML = `
                        <div class="flex flex-col gap-[2px]">
                            <span class="font-semibold text-on-surface text-body-md truncate max-w-[220px]" title="${ini.nombre}">${ini.nombre}</span>
                            <span class="text-[9px] text-primary uppercase font-bold tracking-wider">${ini.categoria || 'General'} • ${ini.tipo}</span>
                            <span class="text-[10px] text-on-surface-variant truncate">Dept: ${ini.departamentos ? ini.departamentos.nombre : 'General'}</span>
                        </div>
                        
                        <div class="h-[1px] bg-primary/10 my-xs"></div>
                        
                        <div class="flex flex-col gap-xs">
                            <div class="flex justify-between items-center text-xs">
                                <span class="text-on-surface-variant">Esperado:</span>
                                <span class="font-data-mono text-primary font-semibold">${formatCurrency(ini.esperado_mes)}</span>
                            </div>
                            
                            <div class="flex justify-between items-center text-xs gap-xs">
                                <span class="text-on-surface-variant shrink-0">Real:</span>
                                ${!isStarted ? `
                                    <span class="text-[9px] text-secondary-fixed-dim bg-secondary-container/20 border border-secondary-container/30 px-1.5 py-0.5 rounded font-bold uppercase">No Iniciada</span>
                                ` : `
                                    <input type="number" step="0.01" value="${ahorroReal}" placeholder="0" ${disabledAttr} 
                                        class="w-24 text-right text-on-surface font-data-mono text-xs px-[6px] py-[2px] rounded outline-none transition-all ${inputClass} kanban-input-real"
                                        data-id="${ini.id}"/>
                                `}
                            </div>
                            
                            <div class="flex flex-col gap-[2px] mt-xs">
                                <span class="text-[10px] text-on-surface-variant">Observaciones:</span>
                                ${!isStarted ? `
                                    <span class="text-[10px] text-on-surface-variant/40 italic">Comienza: ${startFormatted}</span>
                                ` : `
                                    <input type="text" value="${observaciones}" ${disabledAttr} 
                                        class="w-full text-on-surface text-xs px-[6px] py-[2px] rounded outline-none transition-all ${inputClass} kanban-input-obs"
                                        placeholder="Nota de control..." data-id="${ini.id}"/>
                                `}
                            </div>
                        </div>
                        
                        ${!isReadOnly ? `
                            <div class="mt-sm flex justify-end">
                                <button class="bg-[#C52724] hover:bg-[#a0020e] text-white text-[10px] px-sm py-[2px] font-headline-md rounded active:scale-95 transition-all inline-flex items-center gap-[2px] btn-guardar-card" 
                                    data-id="${ini.id}">
                                    GUARDAR
                                </button>
                            </div>
                        ` : ''}
                    `;
                    columnEl.appendChild(card);
                }
            }
        });

        // Configurar escuchadores post-renderizado según la vista activa
        if (isTable) {
            document.querySelectorAll('.btn-guardar-fila').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = btn.getAttribute('data-id');
                    await saveRow(id, btn);
                });
            });
        } else {
            // Actualizar contadores del Kanban
            Object.keys(counts).forEach(status => {
                if (counts[status]) {
                    counts[status].textContent = countsVal[status];
                }
            });

            // Configurar Drag & Drop y botones de tarjetas
            setupKanbanDragAndDrop();

            document.querySelectorAll('.btn-guardar-card').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.getAttribute('data-id');
                    saveKanbanCard(id, btn);
                });
            });
        }

    } catch (err) {
        console.error('Error al cargar ejecuciones:', err);
        if (isTable) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="py-lg text-center text-error font-semibold">
                        Error al consultar ejecuciones de la base de datos: ${err.message}
                    </td>
                </tr>
            `;
        } else {
            alert('Error al consultar base de datos: ' + err.message);
        }
    } finally {
        if (loadingOverlay) loadingOverlay.classList.add('hidden');
    }
}

/**
 * Guarda o actualiza los datos de ejecución mensual en la vista de tabla
 */
async function saveRow(iniId, btn) {
    const originalText = btn.innerHTML;

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

        btn.innerHTML = '<span class="material-symbols-outlined text-[14px]">check_circle</span> GUARDADO';
        btn.style.backgroundColor = '#10B981';
        btn.style.borderColor = '#10B981';

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

/**
 * Guarda los datos de una tarjeta Kanban cuando se edita in-situ
 */
async function saveKanbanCard(iniId, btn) {
    const originalText = btn.innerHTML;

    const realInput = document.querySelector(`.kanban-input-real[data-id="${iniId}"]`);
    const obsInput = document.querySelector(`.kanban-input-obs[data-id="${iniId}"]`);

    if (!realInput) return;

    const realValue = parseFloat(realInput.value) || 0;
    const obsValue = obsInput ? obsInput.value.trim() : '';

    btn.innerHTML = 'GUARDANDO...';
    btn.disabled = true;

    try {
        const mes = parseInt(filterMonth ? filterMonth.value : new Date().getMonth() + 1);
        const anio = parseInt(filterYear ? filterYear.value : new Date().getFullYear());

        // Identificar el estado por la columna actual de la tarjeta
        const cardParent = realInput.closest('.kanban-cards-area');
        const estadoValue = cardParent ? cardParent.getAttribute('data-status') : 'Pendiente';

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

        btn.innerHTML = '<span class="material-symbols-outlined text-[10px]">check_circle</span> GUARDADO';
        btn.style.backgroundColor = '#10B981';

        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.backgroundColor = '';
            btn.disabled = false;
        }, 1500);

    } catch (err) {
        console.error('Error al guardar tarjeta Kanban:', err);
        alert('Error al guardar: ' + err.message);
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

/**
 * Inicializa y configura los eventos de Drag & Drop del Kanban
 */
function setupKanbanDragAndDrop() {
    const cards = document.querySelectorAll('#kanban-view-container [draggable="true"]');
    const dropzones = document.querySelectorAll('#kanban-view-container .kanban-cards-area');

    cards.forEach(card => {
        card.addEventListener('dragstart', (e) => {
            card.classList.add('opacity-40', 'border-primary/40');
            e.dataTransfer.setData('text/plain', card.getAttribute('data-id'));
            e.dataTransfer.effectAllowed = 'move';
        });

        card.addEventListener('dragend', () => {
            card.classList.remove('opacity-40', 'border-primary/40');
        });
    });

    dropzones.forEach(zone => {
        zone.addEventListener('dragover', (e) => {
            e.preventDefault(); // Necesario para permitir soltar la tarjeta
            zone.classList.add('drag-over');
        });

        zone.addEventListener('dragleave', () => {
            zone.classList.remove('drag-over');
        });

        zone.addEventListener('drop', async (e) => {
            e.preventDefault();
            zone.classList.remove('drag-over');

            const iniId = e.dataTransfer.getData('text/plain');
            const targetStatus = zone.getAttribute('data-status');

            if (!iniId) return;

            // Encontrar la tarjeta del DOM
            const cardEl = document.querySelector(`#kanban-view-container [data-id="${iniId}"]`);
            if (!cardEl) return;

            const currentZone = cardEl.closest('.kanban-cards-area');
            if (currentZone === zone) return; // Si se soltó en la misma columna, ignorar

            const realInput = cardEl.querySelector('.kanban-input-real');
            const obsInput = cardEl.querySelector('.kanban-input-obs');

            let realValue = realInput ? parseFloat(realInput.value) || 0 : 0;
            const obsValue = obsInput ? obsInput.value.trim() : '';

            const mes = parseInt(filterMonth ? filterMonth.value : new Date().getMonth() + 1);
            const anio = parseInt(filterYear ? filterYear.value : new Date().getFullYear());

            // Regla de UX premium: si se mueve a 'Validado' o 'En Revisión' y el valor real es 0,
            // pre-llenar con el valor esperado de la iniciativa de forma automática.
            if (realValue === 0 && (targetStatus === 'Validado' || targetStatus === 'En Revisión')) {
                const expectedTextEl = cardEl.querySelector('.font-data-mono.text-primary');
                if (expectedTextEl) {
                    const expectedText = expectedTextEl.textContent;
                    const parsedExpected = parseFloat(expectedText.replace(/[^0-9,-]/g, '').replace(',', '.')) || 0;
                    if (parsedExpected > 0) {
                        realValue = parsedExpected;
                        if (realInput) realInput.value = realValue;
                    }
                }
            }

            if (loadingOverlay) loadingOverlay.classList.remove('hidden');

            try {
                const payload = {
                    iniciativa_id: iniId,
                    mes: mes,
                    anio: anio,
                    ahorro_real_ejecutado: realValue,
                    estado_pipeline: targetStatus,
                    observaciones: obsValue,
                    validado_por: targetStatus === 'Validado' && currentUser ? currentUser.id : null,
                    fecha_validacion: targetStatus === 'Validado' ? new Date().toISOString() : null,
                    updated_at: new Date().toISOString()
                };

                const { error } = await supabase
                    .from('iniciativas_ejecucion')
                    .upsert(payload, {
                        onConflict: 'iniciativa_id,mes,anio'
                    });

                if (error) throw error;

                // Mover físicamente la tarjeta en el DOM
                zone.appendChild(cardEl);

                // Actualizar contadores locales de las columnas involucradas
                const oldStatus = currentZone.getAttribute('data-status');
                const oldStatusSuffix = getStatusIdSuffix(oldStatus);
                const newStatusSuffix = getStatusIdSuffix(targetStatus);

                const oldCounter = document.getElementById(`count-${oldStatusSuffix}`);
                const newCounter = document.getElementById(`count-${newStatusSuffix}`);

                if (oldCounter) oldCounter.textContent = parseInt(oldCounter.textContent) - 1;
                if (newCounter) newCounter.textContent = parseInt(newCounter.textContent) + 1;

                // Destello verde de feedback
                cardEl.style.borderColor = '#10B981';
                cardEl.style.boxShadow = '0 0 10px rgba(16, 185, 129, 0.3)';
                setTimeout(() => {
                    cardEl.style.borderColor = '';
                    cardEl.style.boxShadow = '';
                }, 1500);

            } catch (err) {
                console.error('Error al actualizar estado en Drag & Drop:', err);
                alert('Ocurrió un error al cambiar el estado: ' + err.message);
            } finally {
                if (loadingOverlay) loadingOverlay.classList.add('hidden');
            }
        });
    });
}

function getStatusIdSuffix(status) {
    if (status === 'Pendiente') return 'pendiente';
    if (status === 'En Revisión') return 'revision';
    if (status === 'Validado') return 'validado';
    if (status === 'Observado') return 'observado';
    return '';
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
