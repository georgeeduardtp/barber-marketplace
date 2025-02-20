// Funciones de gestión del dashboard

// Cargar estadísticas generales
async function loadDashboardStats(salonId) {
    try {
        showLoader();
        const stats = await Promise.all([
            getReservationsStats(salonId),
            getRevenueStats(salonId),
            getPopularServices(salonId),
            getCustomerStats(salonId)
        ]);

        updateDashboardUI(...stats);
        hideLoader();
    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
        showError('Error al cargar las estadísticas del dashboard');
        hideLoader();
    }
}

// Obtener estadísticas de reservas
async function getReservationsStats(salonId) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    try {
        const snapshot = await db.collection('reservas')
            .where('peluqueriaId', '==', salonId)
            .where('fecha', '>=', startOfMonth)
            .where('fecha', '<=', endOfMonth)
            .get();

        const reservas = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
        }));

        return {
            total: reservas.length,
            pendientes: reservas.filter(r => r.estado === 'pendiente').length,
            confirmadas: reservas.filter(r => r.estado === 'confirmada').length,
            canceladas: reservas.filter(r => r.estado === 'cancelada').length
        };
    } catch (error) {
        console.error('Error al obtener estadísticas de reservas:', error);
        throw error;
    }
}

// Obtener estadísticas de ingresos
async function getRevenueStats(salonId) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    try {
        const snapshot = await db.collection('reservas')
            .where('peluqueriaId', '==', salonId)
            .where('fecha', '>=', startOfMonth)
            .where('fecha', '<=', endOfMonth)
            .where('estado', '==', 'confirmada')
            .get();

        const reservas = snapshot.docs.map(doc => doc.data());
        const ingresoTotal = reservas.reduce((sum, r) => sum + r.servicio.precio, 0);
        const promedioReserva = reservas.length > 0 ? ingresoTotal / reservas.length : 0;

        return {
            ingresoTotal,
            promedioReserva,
            numReservas: reservas.length
        };
    } catch (error) {
        console.error('Error al obtener estadísticas de ingresos:', error);
        throw error;
    }
}

// Obtener servicios más populares
async function getPopularServices(salonId) {
    try {
        const snapshot = await db.collection('reservas')
            .where('peluqueriaId', '==', salonId)
            .where('estado', '==', 'confirmada')
            .orderBy('fecha', 'desc')
            .limit(100)
            .get();

        const reservas = snapshot.docs.map(doc => doc.data());
        const serviciosCount = {};

        reservas.forEach(reserva => {
            const servicioId = reserva.servicio.id;
            serviciosCount[servicioId] = (serviciosCount[servicioId] || 0) + 1;
        });

        const popularServices = Object.entries(serviciosCount)
            .map(([id, count]) => ({
                id,
                count,
                nombre: reservas.find(r => r.servicio.id === id).servicio.nombre
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        return popularServices;
    } catch (error) {
        console.error('Error al obtener servicios populares:', error);
        throw error;
    }
}

// Obtener estadísticas de clientes
async function getCustomerStats(salonId) {
    try {
        const snapshot = await db.collection('reservas')
            .where('peluqueriaId', '==', salonId)
            .where('estado', '==', 'confirmada')
            .get();

        const reservas = snapshot.docs.map(doc => doc.data());
        const clientesUnicos = new Set(reservas.map(r => r.clienteId)).size;
        const clientesFrecuentes = Object.entries(
            reservas.reduce((acc, r) => {
                acc[r.clienteId] = (acc[r.clienteId] || 0) + 1;
                return acc;
            }, {})
        )
            .filter(([_, count]) => count > 1)
            .length;

        return {
            clientesUnicos,
            clientesFrecuentes,
            tasaRetorno: clientesUnicos > 0 ? (clientesFrecuentes / clientesUnicos) * 100 : 0
        };
    } catch (error) {
        console.error('Error al obtener estadísticas de clientes:', error);
        throw error;
    }
}

// Obtener ingresos de los últimos 7 días
async function getLastWeekRevenue(salonId) {
    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 6);

        const snapshot = await db.collection('reservas')
            .where('peluqueriaId', '==', salonId)
            .where('fecha', '>=', startDate)
            .where('fecha', '<=', endDate)
            .where('estado', '==', 'confirmada')
            .get();

        const reservas = snapshot.docs.map(doc => doc.data());
        const ingresosPorDia = {};

        // Inicializar todos los días con 0
        for (let i = 0; i < 7; i++) {
            const fecha = new Date(startDate);
            fecha.setDate(fecha.getDate() + i);
            ingresosPorDia[fecha.toISOString().split('T')[0]] = 0;
        }

        // Sumar ingresos por día
        reservas.forEach(reserva => {
            const fecha = reserva.fecha.toDate().toISOString().split('T')[0];
            ingresosPorDia[fecha] = (ingresosPorDia[fecha] || 0) + reserva.servicio.precio;
        });

        return Object.entries(ingresosPorDia).map(([fecha, ingreso]) => ({
            fecha,
            ingreso
        }));
    } catch (error) {
        console.error('Error al obtener ingresos de la semana:', error);
        throw error;
    }
}

// Actualizar UI del dashboard
async function updateDashboardUI(reservasStats, revenueStats, popularServices, customerStats) {
    // Actualizar widgets de reservas
    document.getElementById('totalReservas').textContent = reservasStats.total;
    document.getElementById('reservasPendientes').textContent = reservasStats.pendientes;
    document.getElementById('reservasConfirmadas').textContent = reservasStats.confirmadas;
    document.getElementById('reservasCanceladas').textContent = reservasStats.canceladas;

    // Actualizar widgets de ingresos
    document.getElementById('ingresoTotal').textContent = `€${revenueStats.ingresoTotal.toFixed(2)}`;
    document.getElementById('promedioReserva').textContent = `€${revenueStats.promedioReserva.toFixed(2)}`;

    // Actualizar servicios populares
    const popularServicesList = document.getElementById('popularServices');
    popularServicesList.innerHTML = popularServices.map(service => `
        <div class="popular-service">
            <span class="service-name">${service.nombre}</span>
            <span class="service-count">${service.count} reservas</span>
        </div>
    `).join('');

    // Actualizar estadísticas de clientes
    document.getElementById('clientesUnicos').textContent = customerStats.clientesUnicos;
    document.getElementById('clientesFrecuentes').textContent = customerStats.clientesFrecuentes;
    document.getElementById('tasaRetorno').textContent = `${customerStats.tasaRetorno.toFixed(1)}%`;

    // Crear gráficos
    createReservasChart(reservasStats);
    
    // Obtener y crear gráfico de ingresos
    try {
        const weekRevenue = await getLastWeekRevenue(window.salonId);
        createIngresosChart(weekRevenue);
    } catch (error) {
        console.error('Error al crear gráfico de ingresos:', error);
    }
}

// Exportar funciones al objeto window
window.loadDashboardStats = loadDashboardStats; 