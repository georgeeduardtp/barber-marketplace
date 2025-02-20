// Verificar autenticación y mostrar el panel correspondiente
auth.onAuthStateChanged(async user => {
    if (!user) {
        window.location.href = '../index.html';
        return;
    }

    try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            
            // Ocultar ambas secciones inicialmente
            document.getElementById('adminSection').style.display = 'none';
            document.getElementById('salonSection').style.display = 'none';

            // Mostrar la sección correspondiente según el rol
            if (userData.role === 'admin') {
                document.getElementById('adminSection').style.display = 'block';
                loadSalonAccounts(); // Cargar lista de peluquerías
            } else if (userData.role === 'peluqueria') {
                document.getElementById('salonSection').style.display = 'block';
                checkAndShowSalonInfo(user.uid); // Cargar información de la peluquería
            } else {
                window.location.href = '../index.html';
            }
        } else {
            window.location.href = '../index.html';
        }
    } catch (error) {
        console.error('Error al verificar usuario:', error);
        window.location.href = '../index.html';
    }
});

// Función para cargar la información de la peluquería
async function checkAndShowSalonInfo(userId) {
    try {
        const salonSnapshot = await db.collection('peluquerias')
            .where('adminId', '==', userId)
            .get();

        if (!salonSnapshot.empty) {
            const salonData = salonSnapshot.docs[0].data();
            const salonId = salonSnapshot.docs[0].id;

            // Mostrar información del salón
            document.getElementById('salonInfo').innerHTML = `
                <p><i class="fas fa-signature"></i><strong>Nombre:</strong> ${salonData.nombre}</p>
                <p><i class="fas fa-map-marker-alt"></i><strong>Dirección:</strong> ${salonData.direccion}</p>
                <p><i class="fas fa-city"></i><strong>Ciudad:</strong> ${salonData.ciudad}</p>
                <p><i class="fas fa-mail-bulk"></i><strong>Código Postal:</strong> ${salonData.codigoPostal}</p>
                <p><i class="fas fa-phone"></i><strong>Teléfono:</strong> ${salonData.telefono}</p>
                <p><i class="fas fa-info-circle"></i><strong>Descripción:</strong> ${salonData.descripcion}</p>
            `;

            // Mostrar servicios
            const servicesList = document.getElementById('servicesList');
            if (salonData.servicios && salonData.servicios.length > 0) {
                servicesList.innerHTML = salonData.servicios.map(servicio => `
                    <div class="service-item">
                        <span>${servicio.nombre}</span>
                        <span>€${servicio.precio}</span>
                        <span>${servicio.duracion} min</span>
                    </div>
                `).join('');
            } else {
                servicesList.innerHTML = '<p>No hay servicios registrados</p>';
            }

            // Configurar filtros de reservas
            const filtroFecha = document.getElementById('filtroFecha');
            const today = new Date().toISOString().split('T')[0];
            filtroFecha.value = today;

            // Cargar reservas iniciales
            cargarReservas(salonId);

            // Añadir event listeners para los filtros
            document.getElementById('filtroEstado').addEventListener('change', () => filtrarReservas(salonId));
            document.getElementById('filtroFecha').addEventListener('change', () => filtrarReservas(salonId));
        } else {
            // Si no existe peluquería, mostrar mensaje
            document.getElementById('salonSection').innerHTML = `
                <div class="no-salon-message">
                    <h2>No se encontró información de peluquería</h2>
                    <p>Por favor, contacta con el administrador para configurar tu perfil.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error al cargar información de la peluquería:', error);
        showErrorMessage('Error al cargar la información');
    }
} 