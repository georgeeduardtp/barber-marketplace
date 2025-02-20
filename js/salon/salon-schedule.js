// Funciones de gestión de horarios
function loadSchedule(schedule) {
    if (!scheduleList) return;
    
    const days = {
        'lunes': 'Lunes',
        'martes': 'Martes',
        'miercoles': 'Miércoles',
        'jueves': 'Jueves',
        'viernes': 'Viernes',
        'sabado': 'Sábado',
        'domingo': 'Domingo'
    };
    
    let html = '';
    Object.entries(days).forEach(([key, day]) => {
        const daySchedule = schedule[key] || { abierto: false };
        html += `
            <div class="schedule-item">
                <span class="day">${day}</span>
                ${daySchedule.abierto ? 
                    `<span class="hours">${daySchedule.apertura} - ${daySchedule.cierre}</span>` : 
                    '<span class="closed">Cerrado</span>'
                }
            </div>
        `;
    });
    
    scheduleList.innerHTML = html;
}

function populateTimeSelect(schedule, selectedDate) {
    if (!timeSelect) return;
    
    const dayOfWeek = new Date(selectedDate).toLocaleDateString('es-ES', { weekday: 'long' });
    const daySchedule = schedule[dayOfWeek] || { abierto: false };
    
    if (!daySchedule.abierto) {
        timeSelect.innerHTML = '<option value="">No hay horarios disponibles</option>';
        return;
    }
    
    const apertura = daySchedule.apertura.split(':');
    const cierre = daySchedule.cierre.split(':');
    const startHour = parseInt(apertura[0]);
    const endHour = parseInt(cierre[0]);
    
    let html = '<option value="">Selecciona una hora</option>';
    for (let hour = startHour; hour < endHour; hour++) {
        for (let minute of ['00', '30']) {
            const time = `${hour.toString().padStart(2, '0')}:${minute}`;
            html += `<option value="${time}">${time}</option>`;
        }
    }
    
    timeSelect.innerHTML = html;
}

async function updateSchedule(newSchedule) {
    try {
        await db.collection('peluquerias').doc(salonId).update({
            horarios: newSchedule
        });
        
        loadSchedule(newSchedule);
        alert('Horario actualizado exitosamente');
    } catch (error) {
        console.error('Error al actualizar horario:', error);
        alert('Error al actualizar el horario');
    }
} 