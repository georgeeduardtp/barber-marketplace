// Funciones de gestión de gráficos

// Crear gráfico de reservas
function createReservasChart(stats) {
    const ctx = document.getElementById('reservasChart').getContext('2d');
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Pendientes', 'Confirmadas', 'Canceladas'],
            datasets: [{
                data: [
                    stats.pendientes,
                    stats.confirmadas,
                    stats.canceladas
                ],
                backgroundColor: [
                    '#ffd700',
                    '#4CAF50',
                    '#f44336'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Crear gráfico de ingresos
function createIngresosChart(data) {
    const ctx = document.getElementById('ingresosChart').getContext('2d');
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(item => {
                const fecha = new Date(item.fecha);
                return fecha.toLocaleDateString('es-ES', { weekday: 'short' });
            }),
            datasets: [{
                label: 'Ingresos',
                data: data.map(item => item.ingreso),
                borderColor: '#2196F3',
                backgroundColor: 'rgba(33, 150, 243, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: value => `€${value}`
                    }
                }
            }
        }
    });
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

// Exportar funciones al objeto window
window.createReservasChart = createReservasChart;
window.createIngresosChart = createIngresosChart;
window.getLastWeekRevenue = getLastWeekRevenue; 