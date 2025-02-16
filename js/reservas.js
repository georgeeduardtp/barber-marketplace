// Actualizar estadísticas
async function actualizarEstadisticas() {
    try {
        const filtroFecha = document.getElementById('modalFiltroFecha').value;
        
        // Si no hay fecha seleccionada, usar la fecha actual
        const fecha = filtroFecha ? new Date(filtroFecha) : new Date();
        
        // Crear fechas para el inicio y fin del día
        const startDate = new Date(fecha);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(fecha);
        endDate.setHours(23, 59, 59, 999);

        // Obtener las reservas del día
        const snapshot = await db.collection('reservas')
            .where('peluqueriaId', '==', salonId)
            .where('fecha', '>=', startDate)
            .where('fecha', '<=', endDate)
            .get();

        let pendientes = 0;
        let completadas = 0;
        let canceladas = 0;

        snapshot.forEach(doc => {
            const reserva = doc.data();
            switch (reserva.estado) {
                case 'pendiente':
                    pendientes++;
                    break;
                case 'completada':
                    completadas++;
                    break;
                case 'cancelada':
                    canceladas++;
                    break;
            }
        });

        // Actualizar los contadores en el modal
        document.getElementById('modalPendientesCount').textContent = pendientes;
        document.getElementById('modalCompletadasCount').textContent = completadas;
        document.getElementById('modalCanceladasCount').textContent = canceladas;
    } catch (error) {
        console.error('Error al actualizar estadísticas:', error);
    }
}

// Modificar la función filtrarReservasModal para que actualice las estadísticas
function filtrarReservasModal(salonId) {
    modalPaginaActual = 1;
    cargarReservasModal(salonId);
    actualizarEstadisticas(); // Añadir esta línea
}

// Modificar la función resetFiltrosModal
function resetFiltrosModal(salonId) {
    document.getElementById('modalFiltroEstado').value = 'todas';
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('modalFiltroFecha').value = today;
    filtrarReservasModal(salonId);
    actualizarEstadisticas(); // Añadir esta línea
} 