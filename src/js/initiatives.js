import { supabase } from './supabase.js';

// Elementos del DOM
const container = document.getElementById('initiatives-table-body');
const selectDept = document.getElementById('filter-dept');
const btnNew = document.getElementById('btn-nueva-iniciativa');
const modal = document.getElementById('initiative-modal');
const btnClose = document.getElementById('btn-close-modal');
const btnCancel = document.getElementById('btn-cancel-modal');
const form = document.getElementById('new-initiative-form');

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
            const pesimista = parseFloat(document.getElementById('ini-pesimista').value) || 0;
            const base = parseFloat(document.getElementById('ini-base').value) || 0;
            const optimista = parseFloat(document.getElementById('ini-optimista').value) || 0;
            const esperado = parseFloat(document.getElementById('ini-esperado').value) || 0;
            const anual = parseFloat(document.getElementById('ini-anual').value) || 0;
            const capexVal = document.getElementById('ini-capex').value;
            const paybackVal = document.getElementById('ini-payback').value;
            const roiVal = document.getElementById('ini-roi').value;
            const status = document.getElementById('ini-status').value;
            const notes = document.getElementById('ini-notes').value.trim();
            const deptId = parseInt(selectDept.value);

            if (!deptId) {
                alert('Por favor selecciona un departamento válido.');
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
        let enCurso = 0;

        inis.forEach(i => {
            totalMes += parseFloat(i.esperado_mes) || 0;
            totalAnio += parseFloat(i.anual_esperado) || 0;
            if (i.estado === 'En curso' || i.estado === 'Completado') {
                enCurso++;
            }
        });

        const totalCount = inis.length;
        const pctCurso = totalCount > 0 ? Math.round((enCurso / totalCount) * 100) : 0;

        // Escribir KPIs en las tarjetas
        if (cardAhorroMes) cardAhorroMes.textContent = formatCurrency(totalMes);
        if (cardAhorroAnio) cardAhorroAnio.textContent = formatCurrency(totalAnio);
        if (cardTotalIniciativas) cardTotalIniciativas.textContent = totalCount;
        if (cardIniciativasCurso) cardIniciativasCurso.textContent = enCurso;
        if (cardPorcentajeCurso) cardPorcentajeCurso.textContent = `${pctCurso}% en ejecución`;

        // Renderizar tabla
        inis.forEach(i => {
            const row = document.createElement('tr');
            row.className = 'border-b border-primary/5 hover:bg-surface-variant/20 transition-colors';

            // Estilos del estado
            let badgeClass = 'bg-zinc-700/50 text-zinc-300 border-zinc-600/30';
            if (i.estado === 'En curso') badgeClass = 'bg-green-500/25 text-green-400 border-green-500/40';
            else if (i.estado === 'Completado') badgeClass = 'bg-cyan-500/25 text-cyan-400 border-cyan-500/40';
            else if (i.estado === 'Piloto') badgeClass = 'bg-amber-500/25 text-amber-400 border-amber-500/40';
            else if (i.estado === 'Negociación') badgeClass = 'bg-purple-500/25 text-purple-400 border-purple-500/40';
            else if (i.estado === 'Por desarrollar') badgeClass = 'bg-blue-500/25 text-blue-400 border-blue-500/40';

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
                <td class="py-4 px-6 text-right font-semibold text-primary">${formatCurrency(i.esperado_mes)}</td>
                <td class="py-4 px-6 text-right font-semibold text-primary">${formatCurrency(i.anual_esperado)}</td>
                <td class="py-4 px-6 text-center">
                    <span class="px-xs py-[2px] rounded text-label-sm font-label-sm border uppercase ${badgeClass}">
                        ${i.estado}
                    </span>
                </td>
                <td class="py-4 px-6 text-on-surface-variant max-w-xs truncate" title="${i.notas || ''}">${i.notas || '-'}</td>
            `;

            container.appendChild(row);
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
    if (cardPorcentajeCurso) cardPorcentajeCurso.textContent = '0% en ejecución';
}
