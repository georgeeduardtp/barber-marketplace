// Variables globales
let currentSalonId = null;
const paymentModal = document.getElementById('paymentModal');
const historyModal = document.getElementById('historyModal');

// Verificar si el pago del mes está pendiente
async function checkPaymentStatus(salonId) {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalizar la hora a medianoche
        
        const paymentsSnapshot = await db.collection('pagos')
            .where('salonId', '==', salonId)
            .orderBy('date', 'desc')
            .limit(1)
            .get();

        if (paymentsSnapshot.empty) {
            return { status: 'pending', daysLeft: 0 };
        }

        const lastPayment = paymentsSnapshot.docs[0].data();
        const lastPaymentDate = lastPayment.date.toDate();
        lastPaymentDate.setHours(0, 0, 0, 0); // Normalizar la hora a medianoche

        // Calcular días transcurridos desde el último pago
        const daysSinceLastPayment = Math.floor((today - lastPaymentDate) / (1000 * 60 * 60 * 24));
        
        // Calcular días restantes hasta el próximo pago (30 días desde el último pago)
        const daysUntilNextPayment = 30 - daysSinceLastPayment;

        return {
            status: daysUntilNextPayment <= 0 ? 'pending' : 'paid',
            daysLeft: Math.max(0, daysUntilNextPayment)
        };
    } catch (error) {
        console.error('Error al verificar el estado del pago:', error);
        return { status: 'pending', daysLeft: 0 };
    }
}

// Cargar las tarjetas de peluquerías
async function loadSalonCards() {
    try {
        const salonsSnapshot = await db.collection('users')
            .where('role', '==', 'peluqueria')
            .where('profileCompleted', '==', true)
            .get();

        const salonsGrid = document.getElementById('salonsPaymentGrid');
        let html = '';

        for (const userDoc of salonsSnapshot.docs) {
            const userData = userDoc.data();
            
            // Obtener los datos de la peluquería
            const peluqueriaSnapshot = await db.collection('peluquerias')
                .where('adminId', '==', userDoc.id)
                .get();

            const peluqueriaData = peluqueriaSnapshot.empty ? null : peluqueriaSnapshot.docs[0].data();
            
            // Verificar si isActive existe, si no existe se considera activa por defecto
            const isActive = userData.isActive !== false;

            // Verificar el estado del pago
            const paymentInfo = await checkPaymentStatus(userDoc.id);
            let paymentStatusHtml = '';

            if (paymentInfo.status === 'pending') {
                paymentStatusHtml = `
                    <div class="payment-status pending">
                        Pago Pendiente
                    </div>
                `;
            } else {
                paymentStatusHtml = `
                    <div class="payment-status paid">
                        <div class="status-text">Pago al Día</div>
                        <div class="days-counter">${paymentInfo.daysLeft} días para siguiente pago</div>
                    </div>
                `;
            }

            html += `
                <div class="salon-payment-card">
                    <div class="salon-info">
                        <div class="salon-name">${peluqueriaData ? peluqueriaData.nombre : 'Sin nombre comercial'}</div>
                        <div class="salon-email">${userData.email}</div>
                        <div class="salon-status ${isActive ? 'active' : 'inactive'}">
                            ${isActive ? 'Activa' : 'Inactiva'}
                        </div>
                        ${paymentStatusHtml}
                    </div>
                    <div class="card-actions">
                        <button class="register-payment-btn" onclick="openPaymentModal('${userDoc.id}')">
                            <i class="fas fa-plus"></i> Registrar Pago
                        </button>
                        <button class="view-history-btn" onclick="openHistoryModal('${userDoc.id}')">
                            <i class="fas fa-history"></i> Ver Historial
                        </button>
                    </div>
                </div>
            `;
        }

        if (html === '') {
            html = '<p style="text-align: center; grid-column: 1/-1;">No hay peluquerías registradas</p>';
        }

        salonsGrid.innerHTML = html;
    } catch (error) {
        console.error('Error al cargar las peluquerías:', error);
        showErrorMessage('Error al cargar las peluquerías');
    }
}

// Abrir modal de pago
function openPaymentModal(salonId) {
    currentSalonId = salonId;
    
    // Establecer la fecha actual como valor predeterminado
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('paymentDate').value = today;
    
    // Limpiar otros campos
    document.getElementById('paymentAmount').value = '';
    document.getElementById('paymentMethod').value = 'transferencia';
    
    paymentModal.style.display = 'flex';
}

// Abrir modal de historial
async function openHistoryModal(salonId) {
    currentSalonId = salonId;
    
    // Establecer el mes actual en el filtro
    const currentMonth = new Date().toISOString().slice(0, 7);
    document.getElementById('monthFilter').value = currentMonth;
    
    // Cargar el historial
    await loadPaymentHistory(salonId);
    
    historyModal.style.display = 'flex';
}

// Cerrar modales
function closeModals() {
    paymentModal.style.display = 'none';
    historyModal.style.display = 'none';
    currentSalonId = null;
}

// Registrar un nuevo pago
async function registerPayment(event) {
    event.preventDefault();

    if (!currentSalonId) {
        showErrorMessage('Error: No se ha seleccionado una peluquería');
        return;
    }

    const paymentDate = document.getElementById('paymentDate').value;
    const amount = parseFloat(document.getElementById('paymentAmount').value);
    const method = document.getElementById('paymentMethod').value;

    if (!paymentDate || !amount || !method) {
        showErrorMessage('Por favor, completa todos los campos');
        return;
    }

    try {
        // Obtener los datos de la peluquería
        const peluqueriaSnapshot = await db.collection('peluquerias')
            .where('adminId', '==', currentSalonId)
            .limit(1)
            .get();

        if (peluqueriaSnapshot.empty) {
            throw new Error('No se encontró la peluquería');
        }

        const peluqueriaDoc = peluqueriaSnapshot.docs[0];
        const peluqueriaData = peluqueriaDoc.data();

        // Crear el registro de pago
        await db.collection('pagos')
            .add({
                peluqueriaId: peluqueriaDoc.id,
                salonId: currentSalonId,
                salonName: peluqueriaData.nombre || 'Sin nombre',
                date: new Date(paymentDate),
                amount,
                method,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

        showSuccessMessage('Pago registrado correctamente');
        closeModals();
        // Recargar las tarjetas para actualizar la información
        loadSalonCards();
    } catch (error) {
        console.error('Error al registrar el pago:', error);
        showErrorMessage('Error al registrar el pago');
    }
}

// Cargar el historial de pagos
async function loadPaymentHistory() {
    if (!currentSalonId) return;

    const tableBody = document.getElementById('paymentTableBody');
    const monthFilter = document.getElementById('monthFilter').value;

    try {
        // Obtener los datos de la peluquería
        const peluqueriaSnapshot = await db.collection('peluquerias')
            .where('adminId', '==', currentSalonId)
            .limit(1)
            .get();

        if (peluqueriaSnapshot.empty) {
            throw new Error('No se encontró la peluquería');
        }

        const peluqueriaDoc = peluqueriaSnapshot.docs[0];
        const peluqueriaData = peluqueriaDoc.data();
        
        // Mostrar el nombre de la peluquería en el modal
        document.querySelector('.salon-name-display').textContent = peluqueriaData.nombre || 'Sin nombre';

        let query = db.collection('pagos')
            .where('peluqueriaId', '==', peluqueriaDoc.id)
            .orderBy('date', 'desc');

        const snapshot = await query.get();
        let html = '';
        let totalAmount = 0;
        let totalPayments = 0;
        let filteredHtml = '';

        // Calcular totales históricos
        snapshot.forEach(doc => {
            const payment = doc.data();
            totalAmount += payment.amount;
            totalPayments++;
        });

        // Actualizar los totales en el resumen (históricos)
        document.getElementById('totalAmount').textContent = totalAmount.toFixed(2) + '€';
        document.getElementById('totalPayments').textContent = totalPayments;

        // Filtrar pagos por mes para la tabla
        snapshot.forEach(doc => {
            const payment = doc.data();
            const paymentDate = payment.date.toDate();

            // Aplicar filtro de mes si está seleccionado
            if (monthFilter) {
                const [filterYear, filterMonth] = monthFilter.split('-');
                const paymentYear = paymentDate.getFullYear();
                const paymentMonth = paymentDate.getMonth() + 1;
                
                if (paymentYear !== parseInt(filterYear) || 
                    paymentMonth !== parseInt(filterMonth)) {
                    return;
                }
            }

            filteredHtml += `
                <tr>
                    <td>${paymentDate.toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}</td>
                    <td>${payment.amount.toFixed(2)}€</td>
                    <td>
                        <span class="payment-method ${payment.method.toLowerCase()}">
                            ${payment.method}
                        </span>
                    </td>
                </tr>
            `;
        });

        if (filteredHtml === '') {
            filteredHtml = `
                <tr>
                    <td colspan="3" style="text-align: center;">
                        No hay pagos registrados en este período
                    </td>
                </tr>
            `;
        }

        tableBody.innerHTML = filteredHtml;
    } catch (error) {
        console.error('Error al cargar el historial:', error);
        showErrorMessage('Error al cargar el historial de pagos');
    }
}

// Inicializar la funcionalidad de pagos
function initializePayments() {
    // Cargar las tarjetas de peluquerías
    loadSalonCards();
    
    // Actualizar las tarjetas cada día a medianoche
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilMidnight = tomorrow - now;
    
    // Programar la primera actualización para la próxima medianoche
    setTimeout(() => {
        loadSalonCards(); // Actualizar las tarjetas
        // Después de la primera actualización, programar actualizaciones diarias
        setInterval(loadSalonCards, 24 * 60 * 60 * 1000);
    }, msUntilMidnight);
    
    // Event listeners para los modales
    document.getElementById('addPaymentBtn').addEventListener('click', registerPayment);
    document.getElementById('monthFilter').addEventListener('change', loadPaymentHistory);
    
    // Event listeners para cerrar modales
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', closeModals);
    });
    
    // Cerrar modales al hacer clic fuera
    window.addEventListener('click', (event) => {
        if (event.target === paymentModal || event.target === historyModal) {
            closeModals();
        }
    });
}

// Inicializar cuando el documento esté listo
document.addEventListener('DOMContentLoaded', initializePayments); 