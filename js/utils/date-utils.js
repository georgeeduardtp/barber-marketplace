// Funciones de utilidad para manejo de fechas

// Array de días de la semana
const DAYS_OF_WEEK = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

// Obtener el día de la semana de una fecha
function getDayOfWeek(date) {
    return DAYS_OF_WEEK[date.getDay()];
}

// Crear fecha con hora específica
function createDateWithTime(date, time) {
    const [hours, minutes] = time.split(':');
    const newDate = new Date(date);
    newDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return newDate;
}

// Obtener inicio y fin del día
function getDayBoundaries(date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return { startOfDay, endOfDay };
}

// Formatear hora
function formatTime(hours, minutes) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

// Exportar funciones al objeto window
window.DAYS_OF_WEEK = DAYS_OF_WEEK;
window.getDayOfWeek = getDayOfWeek;
window.createDateWithTime = createDateWithTime;
window.getDayBoundaries = getDayBoundaries;
window.formatTime = formatTime; 