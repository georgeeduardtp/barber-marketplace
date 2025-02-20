// Variables globales
let currentChart = null;
let monthlyPrice = 50; // Valor por defecto

// Verificar autenticación y rol de administrador
auth.onAuthStateChanged(async user => {
    if (!user) {
        window.location.href = '../index.html';
        return;
    }

    try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (!userDoc.exists) {
            window.location.href = '../index.html';
            return;
        }

        const userData = userDoc.data();
        
        // Permitir acceso tanto a admin como a peluquerías
        if (userData.role === 'admin') {
            // Cargar el precio actual y las estadísticas
            await loadMonthlyPrice();
            await loadStatistics();
            
            // Verificar y guardar estadísticas mensuales si es necesario
            await checkAndSaveMonthlyStats();
        } else if (userData.role === 'peluqueria') {
            // Las peluquerías ya tienen su propio panel gestionado en el HTML principal
            return;
        } else {
            window.location.href = '../index.html';
        }
    } catch (error) {
        console.error('Error al verificar usuario:', error);
        window.location.href = '../index.html';
    }
});

// Función para verificar y guardar estadísticas mensuales
async function checkAndSaveMonthlyStats() {
    try {
        const today = new Date();
        const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        
        // Verificar si ya existe un registro para este mes
        const statsDoc = await db.collection('monthlyStats').doc(currentMonth).get();
        
        if (!statsDoc.exists) {
            // Obtener datos actuales
            const usersSnapshot = await db.collection('users')
                .where('role', '==', 'peluqueria')
                .where('profileCompleted', '==', true)
                .get();
            
            const totalActiveSalons = usersSnapshot.size;
            const monthlyIncome = totalActiveSalons * monthlyPrice;
            
            // Guardar estadísticas del mes
            await db.collection('monthlyStats').doc(currentMonth).set({
                date: firebase.firestore.Timestamp.fromDate(today),
                activeSalons: totalActiveSalons,
                monthlyPrice: monthlyPrice,
                totalIncome: monthlyIncome,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log(`Estadísticas guardadas para ${currentMonth}`);
        }
    } catch (error) {
        console.error('Error al guardar estadísticas mensuales:', error);
    }
}

// Función para cargar el precio mensual desde Firestore
async function loadMonthlyPrice() {
    try {
        const configDoc = await db.collection('config').doc('pricing').get();
        if (configDoc.exists) {
            monthlyPrice = configDoc.data().monthlyPrice;
        } else {
            // Si no existe el documento, crearlo con el valor por defecto
            await db.collection('config').doc('pricing').set({
                monthlyPrice: monthlyPrice
            });
        }
        
        // Actualizar el input con el valor actual
        document.getElementById('monthlyPrice').value = monthlyPrice;
        
        // Configurar el event listener para guardar cambios
        document.getElementById('savePrice').addEventListener('click', saveMonthlyPrice);
    } catch (error) {
        console.error('Error al cargar el precio mensual:', error);
        showErrorMessage('Error al cargar el precio mensual');
    }
}

// Función para guardar el nuevo precio mensual
async function saveMonthlyPrice() {
    const newPrice = parseInt(document.getElementById('monthlyPrice').value);
    if (isNaN(newPrice) || newPrice < 0) {
        showErrorMessage('Por favor, introduce un precio válido');
        return;
    }

    try {
        await db.collection('config').doc('pricing').set({
            monthlyPrice: newPrice
        });
        
        monthlyPrice = newPrice;
        await loadStatistics(); // Recargar estadísticas con el nuevo precio
        showSuccessMessage('Precio actualizado correctamente');
    } catch (error) {
        console.error('Error al guardar el precio:', error);
        showErrorMessage('Error al guardar el precio');
    }
}

// Función para mostrar mensaje de éxito
function showSuccessMessage(message) {
    const alert = `
        <div class="alert success" style="position: fixed; top: 20px; right: 20px; padding: 1rem; background: #2ecc71; color: white; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
            <i class="fas fa-check-circle"></i>
            <span class="message">${message}</span>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', alert);
    setTimeout(() => {
        const alertElement = document.querySelector('.alert');
        if (alertElement) alertElement.remove();
    }, 3000);
}

// Función para mostrar mensaje de error
function showErrorMessage(message) {
    const alert = `
        <div class="alert error" style="position: fixed; top: 20px; right: 20px; padding: 1rem; background: #e74c3c; color: white; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
            <i class="fas fa-exclamation-circle"></i>
            <span class="message">${message}</span>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', alert);
    setTimeout(() => {
        const alertElement = document.querySelector('.alert');
        if (alertElement) alertElement.remove();
    }, 3000);
}

// Función para cargar las estadísticas
async function loadStatistics() {
    try {
        // Obtener usuarios que son peluquerías y tienen el perfil completado
        const usersSnapshot = await db.collection('users')
            .where('role', '==', 'peluqueria')
            .where('profileCompleted', '==', true)
            .get();

        // El total es simplemente el número de documentos que cumplen los criterios
        const totalActiveSalons = usersSnapshot.size;
        
        // Calcular ingresos mensuales usando el precio actual
        const monthlyIncome = totalActiveSalons * monthlyPrice;
        
        // Actualizar los contadores en la UI
        document.getElementById('totalSalons').textContent = totalActiveSalons;
        document.getElementById('monthlyIncome').textContent = monthlyIncome + '€';

        // Generar datos para el gráfico inicial (diario por defecto)
        await generateIncomeChart(totalActiveSalons, 'daily');

        // Cargar datos históricos
        await loadHistoricalStats();

        // Añadir event listener para el selector de vista
        const viewSelector = document.getElementById('viewSelector');
        if (!viewSelector.getAttribute('data-initialized')) {
            viewSelector.addEventListener('change', async (e) => {
                await generateIncomeChart(totalActiveSalons, e.target.value);
            });
            viewSelector.setAttribute('data-initialized', 'true');
        }
    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
        document.getElementById('totalSalons').textContent = 'Error';
        document.getElementById('monthlyIncome').textContent = 'Error';
    }
}

// Función para cargar los datos históricos en la tabla
async function loadHistoricalStats() {
    const tableBody = document.getElementById('statsTableBody');
    
    try {
        // Obtener todos los registros ordenados por fecha descendente
        const snapshot = await db.collection('monthlyStats')
            .orderBy('date', 'desc')
            .get();

        let html = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            const fecha = data.date.toDate();
            
            html += `
                <tr>
                    <td>${fecha.toLocaleDateString('es-ES', { 
                        year: 'numeric',
                        month: 'long'
                    })}</td>
                    <td>${data.activeSalons}</td>
                    <td>${data.monthlyPrice}€</td>
                    <td>${data.totalIncome}€</td>
                </tr>
            `;
        });

        if (html === '') {
            html = `
                <tr>
                    <td colspan="4" style="text-align: center;">No hay registros históricos disponibles</td>
                </tr>
            `;
        }

        tableBody.innerHTML = html;
    } catch (error) {
        console.error('Error al cargar datos históricos:', error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; color: #e74c3c;">
                    Error al cargar los datos históricos
                </td>
            </tr>
        `;
    }
}

// Función para generar el gráfico de ingresos
async function generateIncomeChart(currentActiveSalons, viewType) {
    const ctx = document.getElementById('incomeChart').getContext('2d');
    
    // Si ya existe un gráfico, destruirlo
    if (currentChart) {
        currentChart.destroy();
    }

    const labels = [];
    const incomeData = [];
    
    if (viewType === 'daily') {
        // Generar datos para los últimos 30 días
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('es-ES', { 
                day: '2-digit',
                month: 'short'
            }));
            
            // Simular una ligera variación diaria en el número de peluquerías
            const dailyVariation = Math.floor(Math.random() * 2);
            const historicalSalons = Math.max(0, currentActiveSalons - Math.floor(i/7) - dailyVariation);
            incomeData.push((historicalSalons * monthlyPrice) / 30); // Usar el precio actual
        }
    } else {
        try {
            // Obtener los últimos 6 meses de estadísticas reales
            const statsSnapshot = await db.collection('monthlyStats')
                .orderBy('date', 'desc')
                .limit(6)
                .get();

            const stats = [];
            statsSnapshot.forEach(doc => {
                stats.push({
                    date: doc.data().date.toDate(),
                    income: doc.data().totalIncome
                });
            });

            // Ordenar por fecha ascendente
            stats.sort((a, b) => a.date - b.date);

            stats.forEach(stat => {
                labels.push(stat.date.toLocaleDateString('es-ES', { 
                    month: 'short',
                    year: 'numeric'
                }));
                incomeData.push(stat.income);
            });

            // Si hay menos de 6 meses de datos, rellenar con estimaciones
            if (stats.length < 6) {
                const monthsToAdd = 6 - stats.length;
                for (let i = 0; i < monthsToAdd; i++) {
                    const date = new Date();
                    date.setMonth(date.getMonth() - (monthsToAdd - i));
                    labels.unshift(date.toLocaleDateString('es-ES', { 
                        month: 'short',
                        year: 'numeric'
                    }));
                    
                    const historicalSalons = Math.max(0, currentActiveSalons - Math.floor(Math.random() * (monthsToAdd - i)));
                    incomeData.unshift(historicalSalons * monthlyPrice);
                }
            }
        } catch (error) {
            console.error('Error al cargar estadísticas mensuales:', error);
            // Fallback a datos simulados si hay error
            for (let i = 5; i >= 0; i--) {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                labels.push(date.toLocaleDateString('es-ES', { 
                    month: 'short',
                    year: 'numeric'
                }));
                
                const historicalSalons = Math.max(0, currentActiveSalons - Math.floor(Math.random() * i));
                incomeData.push(historicalSalons * monthlyPrice);
            }
        }
    }

    // Configurar y crear el gráfico
    currentChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: viewType === 'daily' ? 'Ingresos Diarios (€)' : 'Ingresos Mensuales (€)',
                data: incomeData,
                borderColor: '#2ecc71',
                backgroundColor: 'rgba(46, 204, 113, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: viewType === 'daily' ? 
                        'Evolución de Ingresos Diarios (últimos 30 días)' : 
                        'Evolución de Ingresos Mensuales (últimos 6 meses)'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let value = context.raw;
                            return `${value.toFixed(2)}€`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value.toFixed(2) + '€';
                        }
                    }
                }
            }
        }
    });
}

// Función para alternar la visibilidad del panel expandible
function toggleExpandedInfo() {
    const expandedInfo = document.getElementById('expandedInfo');
    const expandButton = document.querySelector('.expand-button');
    expandedInfo.classList.toggle('active');
    expandButton.classList.toggle('active');
    
    // Cambiar el texto del botón
    const buttonText = expandButton.querySelector('i').nextSibling;
    buttonText.textContent = expandedInfo.classList.contains('active') ? ' Ver menos' : ' Ver más información';
}

// Función para actualizar la información de la peluquería
async function updateSalonInfo(salonId) {
    try {
        const salonData = {
            nombre: document.getElementById('salonName').value,
            direccion: document.getElementById('salonAddress').value,
            telefono: document.getElementById('salonPhone').value,
            ciudad: document.getElementById('salonCity').value,
            codigoPostal: document.getElementById('salonPostalCode').value,
            descripcion: document.getElementById('salonDescription').value
        };

        await db.collection('peluquerias').doc(salonId).update(salonData);
        showSuccessMessage('Información actualizada correctamente');
    } catch (error) {
        console.error('Error al actualizar información:', error);
        showErrorMessage('Error al actualizar la información');
    }
} 