import { supabase } from './supabase.js';

// Elementos del DOM
const container = document.getElementById('initiatives-table-body');
const selectDept = document.getElementById('filter-dept');
const btnNew = document.getElementById('btn-nueva-iniciativa');
const modal = document.getElementById('initiative-modal');
const btnClose = document.getElementById('btn-close-modal');
const btnCancel = document.getElementById('btn-cancel-modal');
const form = document.getElementById('new-initiative-form');

const btnGestionarDepts = document.getElementById('btn-gestionar-depts');
const deptModal = document.getElementById('dept-modal');
const btnCloseDeptModal = document.getElementById('btn-close-dept-modal');
const deptForm = document.getElementById('new-dept-form');
const deptListContainer = document.getElementById('dept-list-container');

// Cards
const cardAhorroMes = document.getElementById('card-ahorro-mes');
const cardAhorroAnio = document.getElementById('card-ahorro-anio');
const cardTotalIniciativas = document.getElementById('card-total-iniciativas');
const cardIniciativasCurso = document.getElementById('card-iniciativas-curso');
const cardPorcentajeCurso = document.getElementById('card-porcentaje-curso');

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

    // Validar rol del usuario para mostrar/ocultar el botón de creación
    const userRole = localStorage.getItem('user_role');
    if (userRole === 'administrador') {
        if (btnNew) btnNew.classList.remove('hidden');
        if (btnGestionarDepts) btnGestionarDepts.classList.remove('hidden');
    }

    // Lógica del modal de departamentos
    const hideDeptModal = () => {
        if (deptModal) deptModal.classList.add('hidden');
        if (deptForm) deptForm.reset();
    };

    if (btnGestionarDepts) {
        btnGestionarDepts.addEventListener('click', async () => {
            await refreshDeptModalList();
            if (deptModal) deptModal.classList.remove('hidden');
        });
    }

    if (btnCloseDeptModal) btnCloseDeptModal.addEventListener('click', hideDeptModal);

    if (deptForm) {
        deptForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const input = document.getElementById('dept-new-name');
            const nombre = input.value.trim();
            if (!nombre) return;

            const submitBtn = deptForm.querySelector('button[type="submit"]');
            const origText = submitBtn.textContent;
            submitBtn.textContent = '...';
            submitBtn.disabled = true;

            try {
                const { error: insertError } = await supabase
                    .from('departamentos')
                    .insert({ nombre: nombre });

                if (insertError) throw insertError;

                input.value = '';
                await loadDepartments();
                await refreshDeptModalList();

                // Preseleccionar el departamento recién creado
                const newDeptOption = Array.from(selectDept.options).find(opt => opt.text === nombre);
                if (newDeptOption) {
                    selectDept.value = newDeptOption.value;
                    await loadInitiatives(newDeptOption.value);
                }

            } catch (err) {
                console.error('Error al crear departamento:', err);
                alert('No se pudo crear el departamento (puede que ya exista): ' + err.message);
            } finally {
                submitBtn.textContent = origText;
                submitBtn.disabled = false;
            }
        });
    }

    // Cargar departamentos
    await loadDepartments();

    // Evento al cambiar departamento
    if (selectDept) {
        selectDept.addEventListener('change', async () => {
            const deptId = selectDept.value;
            if (deptId) {
                await loadInitiatives(deptId);
            } else {
                clearSummaries();
                container.innerHTML = `
                    <tr>
                        <td colspan="7" class="py-lg text-center text-on-surface-variant">
                            Selecciona un departamento para ver sus iniciativas de ahorro.
                        </td>
                    </tr>
                `;
            }
        });
    }

    // Lógica del modal
    const hideModal = () => {
        if (modal) modal.classList.add('hidden');
        if (form) form.reset();
    };

    if (btnNew) {
        btnNew.addEventListener('click', () => {
            const todayStr = new Date().toISOString().split('T')[0];
            const dateStartInput = document.getElementById('ini-date-start');
            if (dateStartInput) dateStartInput.value = todayStr;

            // Pre-select the department in the modal based on the active filter
            const filterDeptVal = selectDept ? selectDept.value : '';
            const selectIniDept = document.getElementById('ini-dept');
            if (selectIniDept && filterDeptVal) {
                selectIniDept.value = filterDeptVal;
            } else if (selectIniDept) {
                selectIniDept.value = ''; // Default to placeholder select option
            }

            if (modal) modal.classList.remove('hidden');
        });
    }

    if (btnClose) btnClose.addEventListener('click', hideModal);
    if (btnCancel) btnCancel.addEventListener('click', hideModal);

    // Guardar iniciativa
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;

            const name = document.getElementById('ini-name').value.trim();
            const type = document.getElementById('ini-type').value;
            const category = document.getElementById('ini-category').value.trim();
            const dateStart = document.getElementById('ini-date-start').value;
            const pesimista = parseFloat(document.getElementById('ini-pesimista').value) || 0;
            const base = parseFloat(document.getElementById('ini-base').value) || 0;
            const optimista = parseFloat(document.getElementById('ini-optimista').value) || 0;
            const esperado = parseFloat(document.getElementById('ini-esperado').value) || 0;
            const anual = parseFloat(document.getElementById('ini-anual').value) || 0;
            const capexVal = document.getElementById('ini-capex').value;
            const paybackVal = document.getElementById('ini-payback').value;
            const roiVal = document.getElementById('ini-roi').value;
            const status = 'Iniciativa';
            const notes = document.getElementById('ini-notes').value.trim();
            
            const selectIniDept = document.getElementById('ini-dept');
            const deptId = selectIniDept ? parseInt(selectIniDept.value) : null;

            if (!deptId) {
                alert('Por favor selecciona un departamento válido en el modal.');
                return;
            }

            submitBtn.innerHTML = 'GUARDANDO...';
            submitBtn.disabled = true;

            try {
                const capex = capexVal !== '' ? parseFloat(capexVal) : null;
                const payback_meses = paybackVal !== '' ? parseFloat(paybackVal) : null;
                const roi_12m = roiVal !== '' ? parseFloat(roiVal) : null;

                const { error } = await supabase
                    .from('iniciativas')
                    .insert({
                        departamento_id: deptId,
                        nombre: name,
                        tipo: type,
                        categoria: category,
                        fecha_inicio_ejecucion: dateStart,
                        pesimista_mes: pesimista,
                        base_mes: base,
                        optimista_mes: optimista,
                        esperado_mes: esperado,
                        anual_esperado: anual,
                        capex: capex,
                        payback_meses: payback_meses,
                        roi_12m: roi_12m,
                        estado: status,
                        notas: notes
                    });

                if (error) throw error;

                // Cargar listado de nuevo
                await loadInitiatives(deptId);

                // Feedback visual de éxito
                submitBtn.innerHTML = '<span class="material-symbols-outlined">check_circle</span> CREADO';
                submitBtn.style.backgroundColor = '#10B981';

                setTimeout(() => {
                    submitBtn.innerHTML = originalText;
                    submitBtn.style.backgroundColor = '';
                    submitBtn.disabled = false;
                    hideModal();
                }, 1500);

            } catch (err) {
                console.error('Error al insertar iniciativa:', err);
                alert('Ocurrió un error al guardar la iniciativa: ' + err.message);
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

        const selectIniDept = document.getElementById('ini-dept');
        if (selectIniDept) {
            selectIniDept.innerHTML = '<option value="" disabled selected>Seleccione un departamento</option>';
        }

        if (depts && depts.length > 0) {
            depts.forEach(d => {
                const opt = document.createElement('option');
                opt.value = d.id;
                opt.textContent = d.nombre;
                selectDept.appendChild(opt);

                if (selectIniDept) {
                    const optIni = document.createElement('option');
                    optIni.value = d.id;
                    optIni.textContent = d.nombre;
                    selectIniDept.appendChild(optIni);
                }
            });

            // Seleccionar por defecto Tecnología (TI) si está presente
            const tecOption = Array.from(selectDept.options).find(opt => opt.text === 'Tecnología (TI)');
            if (tecOption) {
                selectDept.value = tecOption.value;
                await loadInitiatives(tecOption.value);
            }
        }
    } catch (err) {
        console.error('Error al cargar departamentos:', err);
        selectDept.innerHTML = '<option value="">Error al cargar</option>';
    }
}

/**
 * Carga y renderiza las iniciativas del departamento seleccionado
 */
async function loadInitiatives(deptId) {
    if (!container) return;

    container.innerHTML = `
        <tr>
            <td colspan="7" class="py-lg text-center text-on-surface-variant">
                Cargando iniciativas de ahorro...
            </td>
        </tr>
    `;

    try {
        const { data: inis, error } = await supabase
            .from('iniciativas')
            .select('*')
            .eq('departamento_id', deptId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        container.innerHTML = '';

        if (!inis || inis.length === 0) {
            clearSummaries();
            container.innerHTML = `
                <tr>
                    <td colspan="7" class="py-lg text-center text-on-surface-variant">
                        No hay iniciativas de ahorro registradas para este departamento.
                    </td>
                </tr>
            `;
            return;
        }
          // Calcular KPIs de las tarjetas
        let totalMes = 0;
        let totalAnio = 0;
        let validadas = 0;

        inis.forEach(i => {
            totalMes += parseFloat(i.esperado_mes) || 0;
            totalAnio += parseFloat(i.anual_esperado) || 0;
            if (i.estado === 'Validada') {
                validadas++;
            }
        });

        const totalCount = inis.length;
        const pctValidadas = totalCount > 0 ? Math.round((validadas / totalCount) * 100) : 0;

        // Escribir KPIs en las tarjetas
        if (cardAhorroMes) cardAhorroMes.textContent = formatCurrency(totalMes);
        if (cardAhorroAnio) cardAhorroAnio.textContent = formatCurrency(totalAnio);
        if (cardTotalIniciativas) cardTotalIniciativas.textContent = totalCount;
        if (cardIniciativasCurso) cardIniciativasCurso.textContent = validadas;
        if (cardPorcentajeCurso) cardPorcentajeCurso.textContent = `${pctValidadas}% validadas`;

        // Renderizar tabla
        inis.forEach(i => {
            const row = document.createElement('tr');
            row.className = 'border-b border-primary/5 hover:bg-surface-variant/20 transition-colors';

            // Estilos del estado
            let badgeClass = 'bg-zinc-700/50 text-zinc-300 border-zinc-600/30';
            if (i.estado === 'Validada') badgeClass = 'bg-green-500/25 text-green-400 border-green-500/40';

            const userRole = localStorage.getItem('user_role');
            const deleteBtnHtml = userRole === 'administrador'
                ? `<button class="btn-delete-ini text-on-surface-variant hover:text-red-400 p-1 rounded" data-id="${i.id}" title="Eliminar iniciativa">
                       <span class="material-symbols-outlined text-[16px]">delete</span>
                   </button>`
                : `<span class="text-on-surface-variant text-[11px] italic">Solo lectura</span>`;

            // Selector de estado interactivo para Administrador y Control Interno
            let estadoHtml = '';
            if (userRole === 'administrador' || userRole === 'control_interno') {
                estadoHtml = `
                    <select class="status-select bg-[#121414] border border-primary/15 text-primary font-body-md text-xs py-[2px] px-xs rounded cursor-pointer outline-none focus:ring-1 focus:ring-primary/20" data-id="${i.id}">
                        <option value="Iniciativa" ${i.estado === 'Iniciativa' ? 'selected' : ''}>Iniciativa</option>
                        <option value="Validada" ${i.estado === 'Validada' ? 'selected' : ''}>Validada</option>
                    </select>
                `;
            } else {
                estadoHtml = `
                    <span class="px-xs py-[2px] rounded text-label-sm font-label-sm border uppercase ${badgeClass}">
                        ${i.estado}
                    </span>
                `;
            }

            const dateStartStr = i.fecha_inicio_ejecucion
                ? new Date(i.fecha_inicio_ejecucion + 'T12:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
                : '-';

            row.innerHTML = `
                <td class="py-4 px-6 font-body-md text-on-surface font-semibold">${i.nombre}</td>
                <td class="py-4 px-6 text-center">
                    <span class="px-xs py-[2px] rounded text-[10px] font-bold ${
                        i.tipo === 'AHORRO' ? 'bg-green-500/10 text-green-400' : i.tipo === 'INGRESO' ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-400'
                    }">
                        ${i.tipo}
                    </span>
                </td>
                <td class="py-4 px-6 text-on-surface-variant">${i.categoria}</td>
                <td class="py-4 px-6 text-center text-on-surface-variant">${dateStartStr}</td>
                <td class="py-4 px-6 text-right font-semibold text-primary">${formatCurrency(i.esperado_mes)}</td>
                <td class="py-4 px-6 text-right font-semibold text-primary">${formatCurrency(i.anual_esperado)}</td>
                <td class="py-4 px-6 text-center">${estadoHtml}</td>
                <td class="py-4 px-6 text-on-surface-variant max-w-xs truncate" title="${i.notes || ''}">${i.notes || '-'}</td>
                <td class="py-4 px-6 text-center">${deleteBtnHtml}</td>
            `;

            container.appendChild(row);
        });

        // Configurar listener para cambiar estado
        document.querySelectorAll('.status-select').forEach(select => {
            select.addEventListener('change', async (e) => {
                const iniId = e.target.getAttribute('data-id');
                const newStatus = e.target.value;
                try {
                    const { error } = await supabase
                        .from('iniciativas')
                        .update({ estado: newStatus })
                        .eq('id', iniId);

                    if (error) throw error;
                    await loadInitiatives(deptId);
                } catch (err) {
                    console.error('Error al actualizar estado:', err);
                    alert('Error al actualizar estado: ' + err.message);
                }
            });
        });

        // Configurar listener para eliminar
        document.querySelectorAll('.btn-delete-ini').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const iniId = e.currentTarget.getAttribute('data-id');
                if (confirm('¿Está seguro de que desea eliminar esta iniciativa de ahorro?')) {
                    try {
                        const { error } = await supabase
                            .from('iniciativas')
                            .delete()
                            .eq('id', iniId);

                        if (error) throw error;
                        await loadInitiatives(deptId);
                    } catch (err) {
                        console.error('Error al eliminar iniciativa:', err);
                        alert('Error al eliminar iniciativa: ' + err.message);
                    }
                }
            });
        });

    } catch (err) {
        console.error('Error al cargar iniciativas:', err);
        container.innerHTML = `
            <tr>
                <td colspan="7" class="py-lg text-center text-red-500 font-bold">
                    Error al cargar las iniciativas: ${err.message}
                </td>
            </tr>
        `;
    }
}

/**
 * Resetea las tarjetas de KPIs a cero
 */
function clearSummaries() {
    if (cardAhorroMes) cardAhorroMes.textContent = '$0';
    if (cardAhorroAnio) cardAhorroAnio.textContent = '$0';
    if (cardTotalIniciativas) cardTotalIniciativas.textContent = '0';
    if (cardIniciativasCurso) cardIniciativasCurso.textContent = '0';
    if (cardPorcentajeCurso) cardPorcentajeCurso.textContent = '0% validadas';
}

/**
 * Consulta y pinta la lista de departamentos dentro del modal de mantenimiento
 */
async function refreshDeptModalList() {
    if (!deptListContainer) return;
    deptListContainer.innerHTML = '<li class="py-sm text-center text-on-surface-variant">Cargando departamentos...</li>';

    try {
        const { data: depts, error } = await supabase
            .from('departamentos')
            .select('*')
            .order('nombre', { ascending: true });

        if (error) throw error;

        deptListContainer.innerHTML = '';

        if (!depts || depts.length === 0) {
            deptListContainer.innerHTML = '<li class="py-sm text-center text-on-surface-variant">No hay departamentos.</li>';
            return;
        }

        depts.forEach(d => {
            const li = document.createElement('li');
            li.className = "flex justify-between items-center py-2 border-b border-primary/5 last:border-b-0";
            li.innerHTML = `
                <span class="font-body-md text-on-surface">${d.nombre}</span>
                <button class="btn-delete-dept text-on-surface-variant hover:text-red-400 p-1 rounded transition-colors cursor-pointer" data-id="${d.id}" data-name="${d.nombre}">
                    <span class="material-symbols-outlined text-[18px]">delete</span>
                </button>
            `;
            deptListContainer.appendChild(li);
        });

        // Configurar listener para eliminar departamento
        deptListContainer.querySelectorAll('.btn-delete-dept').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const btnEl = e.currentTarget;
                const deptId = parseInt(btnEl.getAttribute('data-id'));
                const deptName = btnEl.getAttribute('data-name');
                
                if (confirm(`¿Estás seguro de eliminar el departamento "${deptName}"? Esto eliminará de forma irreversible todas sus iniciativas y ejecuciones mensuales en Supabase.`)) {
                    try {
                        const { error: deleteError } = await supabase
                            .from('departamentos')
                            .delete()
                            .eq('id', deptId);

                        if (deleteError) throw deleteError;

                        // Recargar catálogos principales y modal
                        await loadDepartments();
                        await refreshDeptModalList();

                        // Limpiar pantalla principal si el departamento eliminado estaba seleccionado
                        if (selectDept.value === String(deptId) || selectDept.value === '') {
                            selectDept.value = '';
                            container.innerHTML = `
                                <tr>
                                    <td colspan="7" class="py-lg text-center text-on-surface-variant">
                                        Selecciona un departamento para ver sus iniciativas de ahorro.
                                    </td>
                                </tr>
                            `;
                            clearSummaries();
                        }

                    } catch (err) {
                        console.error('Error al eliminar departamento:', err);
                        alert('No se pudo eliminar el departamento: ' + err.message);
                    }
                }
            });
        });

    } catch (err) {
        console.error('Error al cargar departamentos en modal:', err);
        deptListContainer.innerHTML = '<li class="py-sm text-center text-red-400">Error al cargar departamentos.</li>';
    }
}
