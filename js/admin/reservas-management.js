// Funciones de gestión de reservas para el panel de administración

// Variables para la paginación
let totalReservas = 0;
let paginaActual = 1;
const reservasPorPagina = 10;

// Función para cargar reservas con filtros
async function cargarReservas(salonId, pagina = 1) {
    const reservasList = document.getElementById('reservasList');
    const filtroEstado = document.getElementById('filtroEstado').value;
    const filtroFecha = document.getElementById('filtroFecha').value;

    try {
        const { startOfDay, endOfDay } = getDayBoundaries(new Date(filtroFecha));
        let reservas = [];

        try {
            // Intentar primero con la consulta completa
            const snapshot = await db.collection('reservas')
                .where('peluqueriaId', '==', salonId)
                .where('fecha', '>=', startOfDay)
                .where('fecha', '<=', endOfDay)
                .get();

            snapshot.forEach(doc => {
                const reserva = doc.data();
                // Filtrar por estado si es necesario
                if (filtroEstado === 'todas' || reserva.estado === filtroEstado) {
                    reservas.push({ ...reserva, id: doc.id });
                }
            });
        } catch (indexError) {
            console.log('Error de índice, usando consulta alternativa:', indexError);
            
            // Si falla por el índice, hacer una consulta más simple
            const snapshot = await db.collection('reservas')
                .where('peluqueriaId', '==', salonId)
                .get();

            snapshot.forEach(doc => {
                const reserva = doc.data();
                const fechaReserva = reserva.fecha.toDate();
                
                // Filtrar manualmente por fecha y estado
                if (fechaReserva >= startOfDay && 
                    fechaReserva <= endOfDay && 
                    (filtroEstado === 'todas' || reserva.estado === filtroEstado)) {
                    reservas.push({ ...reserva, id: doc.id });
                }
            });
        }

        // Ordenar por fecha
        reservas.sort((a, b) => b.fecha.toDate() - a.fecha.toDate());

        totalReservas = reservas.length;
        const totalPaginas = Math.ceil(totalReservas / reservasPorPagina);
        paginaActual = Math.min(pagina, totalPaginas);

        // Calcular índices para la paginación
        const inicio = (paginaActual - 1) * reservasPorPagina;
        const fin = inicio + reservasPorPagina;
        const reservasPaginadas = reservas.slice(inicio, fin);

        let html = '';
        if (reservasPaginadas.length === 0) {
            html = '<p class="text-center">No hay reservas que coincidan con los filtros</p>';
        } else {
            reservasPaginadas.forEach(reserva => {
                const fecha = reserva.fecha.toDate();
                html += `
                    <div class="booking-item ${reserva.estado}">
                        <div class="booking-info">
                            <p><strong>Cliente:</strong> ${reserva.nombre}</p>
                            <p><strong>Teléfono:</strong> ${reserva.telefono}</p>
                            <p><strong>Email:</strong> ${reserva.email}</p>
                            <p><strong>Fecha:</strong> ${fecha.toLocaleDateString()}</p>
                            <p><strong>Hora:</strong> ${fecha.toLocaleTimeString()}</p>
                            <p><strong>Servicio:</strong> ${reserva.servicio.nombre} (${reserva.servicio.duracion} min - €${reserva.servicio.precio})</p>
                            <p><strong>Estado:</strong> <span class="estado-${reserva.estado}">${reserva.estado}</span></p>
                        </div>
                        <div class="booking-actions">
                            ${reserva.estado === 'pendiente' ? `
                                <button onclick="confirmarReserva('${reserva.id}')" class="confirm-btn">Confirmar</button>
                                <button onclick="cancelarReserva('${reserva.id}')" class="cancel-btn">Cancelar</button>
                            ` : ''}
                        </div>
                    </div>
                `;
            });
        }

        reservasList.innerHTML = html;

        // Actualizar navegación
        document.getElementById('paginaActual').textContent = `Página ${paginaActual} de ${totalPaginas}`;
        document.getElementById('prevPage').disabled = paginaActual === 1;
        document.getElementById('nextPage').disabled = paginaActual === totalPaginas;

    } catch (error) {
        console.error('Error al cargar reservas:', error);
        reservasList.innerHTML = '<p class="text-center">Error al cargar las reservas</p>';
    }
}

// Función para confirmar una reserva
async function confirmarReserva(reservaId) {
    try {
        await db.collection('reservas').doc(reservaId).update({
            estado: 'confirmada'
        });
        cargarReservas(salonId, paginaActual);
        alert('Reserva confirmada exitosamente');
    } catch (error) {
        console.error('Error al confirmar reserva:', error);
        alert('Error al confirmar la reserva');
    }
}

// Función para cancelar una reserva
async function cancelarReserva(reservaId) {
    if (!confirm('¿Estás seguro de que deseas cancelar esta reserva?')) {
        return;
    }

    try {
        await db.collection('reservas').doc(reservaId).update({
            estado: 'cancelada'
        });
        cargarReservas(salonId, paginaActual);
        alert('Reserva cancelada exitosamente');
    } catch (error) {
        console.error('Error al cancelar reserva:', error);
        alert('Error al cancelar la reserva');
    }
}

// Exportar funciones al objeto window
window.cargarReservas = cargarReservas;
window.confirmarReserva = confirmarReserva;
window.cancelarReserva = cancelarReserva; 