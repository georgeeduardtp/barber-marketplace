// Funciones de gestión de horarios

// Cargar horarios
async function loadSchedule(salonId) {
    const scheduleContainer = document.getElementById('scheduleContainer');
    
    try {
        showLoader();
        const doc = await db.collection('peluquerias').doc(salonId).get();
        const salon = doc.data();
        const horarios = salon.horarios || {};

        const dias = {
            'lunes': 'Lunes',
            'martes': 'Martes',
            'miercoles': 'Miércoles',
            'jueves': 'Jueves',
            'viernes': 'Viernes',
            'sabado': 'Sábado',
            'domingo': 'Domingo'
        };

        let html = '';
        Object.entries(dias).forEach(([key, label]) => {
            const horario = horarios[key] || { abierto: false };
            html += `
                <div class="schedule-card">
                    <div class="schedule-day">
                        <h3>${label}</h3>
                        <label class="switch">
                            <input type="checkbox" 
                                   onchange="toggleDay('${key}', this.checked)"
                                   ${horario.abierto ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                    </div>
                    <div class="schedule-hours ${horario.abierto ? '' : 'disabled'}">
                        <div class="time-input">
                            <label>Apertura</label>
                            <input type="time" 
                                   value="${horario.inicio || '09:00'}"
                                   onchange="updateHours('${key}', 'inicio', this.value)"
                                   ${!horario.abierto ? 'disabled' : ''}>
                        </div>
                        <div class="time-input">
                            <label>Cierre</label>
                            <input type="time" 
                                   value="${horario.fin || '18:00'}"
                                   onchange="updateHours('${key}', 'fin', this.value)"
                                   ${!horario.abierto ? 'disabled' : ''}>
                        </div>
                        <div class="break-time">
                            <label>
                                <input type="checkbox"
                                       onchange="toggleBreak('${key}', this.checked)"
                                       ${horario.descanso ? 'checked' : ''}
                                       ${!horario.abierto ? 'disabled' : ''}>
                                Descanso
                            </label>
                            <div class="break-hours ${horario.descanso ? '' : 'hidden'}">
                                <input type="time" 
                                       value="${horario.descansoInicio || '14:00'}"
                                       onchange="updateBreak('${key}', 'inicio', this.value)"
                                       ${!horario.abierto || !horario.descanso ? 'disabled' : ''}>
                                <span>a</span>
                                <input type="time" 
                                       value="${horario.descansoFin || '15:00'}"
                                       onchange="updateBreak('${key}', 'fin', this.value)"
                                       ${!horario.abierto || !horario.descanso ? 'disabled' : ''}>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        scheduleContainer.innerHTML = html;
    } catch (error) {
        console.error('Error al cargar horarios:', error);
        showError('Error al cargar los horarios');
    } finally {
        hideLoader();
    }
}

// Activar/desactivar día
async function toggleDay(day, isOpen) {
    try {
        const doc = await db.collection('peluquerias').doc(salonId).get();
        const salon = doc.data();
        const horarios = salon.horarios || {};

        horarios[day] = {
            ...horarios[day],
            abierto: isOpen,
            inicio: horarios[day]?.inicio || '09:00',
            fin: horarios[day]?.fin || '18:00'
        };

        await db.collection('peluquerias').doc(salonId).update({ horarios });
        loadSchedule(salonId);
        showSuccess('Horario actualizado correctamente');
    } catch (error) {
        console.error('Error al actualizar horario:', error);
        showError('Error al actualizar el horario');
    }
}

// Actualizar horas
async function updateHours(day, type, value) {
    try {
        const doc = await db.collection('peluquerias').doc(salonId).get();
        const salon = doc.data();
        const horarios = salon.horarios || {};

        horarios[day] = {
            ...horarios[day],
            [type]: value
        };

        // Validar que la hora de cierre sea posterior a la de apertura
        if (type === 'fin' && value <= horarios[day].inicio) {
            showError('La hora de cierre debe ser posterior a la de apertura');
            loadSchedule(salonId);
            return;
        }

        await db.collection('peluquerias').doc(salonId).update({ horarios });
        showSuccess('Horario actualizado correctamente');
    } catch (error) {
        console.error('Error al actualizar horario:', error);
        showError('Error al actualizar el horario');
    }
}

// Activar/desactivar descanso
async function toggleBreak(day, hasBreak) {
    try {
        const doc = await db.collection('peluquerias').doc(salonId).get();
        const salon = doc.data();
        const horarios = salon.horarios || {};

        horarios[day] = {
            ...horarios[day],
            descanso: hasBreak,
            descansoInicio: horarios[day]?.descansoInicio || '14:00',
            descansoFin: horarios[day]?.descansoFin || '15:00'
        };

        await db.collection('peluquerias').doc(salonId).update({ horarios });
        loadSchedule(salonId);
        showSuccess('Horario actualizado correctamente');
    } catch (error) {
        console.error('Error al actualizar horario:', error);
        showError('Error al actualizar el horario');
    }
}

// Actualizar horas de descanso
async function updateBreak(day, type, value) {
    try {
        const doc = await db.collection('peluquerias').doc(salonId).get();
        const salon = doc.data();
        const horarios = salon.horarios || {};

        const fieldName = `descanso${type.charAt(0).toUpperCase() + type.slice(1)}`;
        horarios[day] = {
            ...horarios[day],
            [fieldName]: value
        };

        // Validar que el fin del descanso sea posterior al inicio
        if (type === 'fin' && value <= horarios[day].descansoInicio) {
            showError('La hora de fin del descanso debe ser posterior a la de inicio');
            loadSchedule(salonId);
            return;
        }

        // Validar que el descanso esté dentro del horario de apertura
        if (horarios[day].descansoInicio < horarios[day].inicio || 
            horarios[day].descansoFin > horarios[day].fin) {
            showError('El descanso debe estar dentro del horario de apertura');
            loadSchedule(salonId);
            return;
        }

        await db.collection('peluquerias').doc(salonId).update({ horarios });
        showSuccess('Horario actualizado correctamente');
    } catch (error) {
        console.error('Error al actualizar horario:', error);
        showError('Error al actualizar el horario');
    }
}

// Exportar funciones al objeto window
window.loadSchedule = loadSchedule;
window.toggleDay = toggleDay;
window.updateHours = updateHours;
window.toggleBreak = toggleBreak;
window.updateBreak = updateBreak; 