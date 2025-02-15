// Referencias a elementos del DOM
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');

// Ocultar el botón de registro
registerBtn.style.display = 'none';

// Estado de autenticación
auth.onAuthStateChanged(async user => {
    if (user) {
        console.log('Usuario logueado:', user.email);
        
        try {
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                console.log('Rol del usuario:', userData.role);
                updateUILoggedIn(user, userData);
                
                if (userData.role === 'admin') {
                    showAdminPanel();
                } else if (userData.role === 'peluqueria') {
                    checkAndShowSalonPanel(user.uid);
                }
            } else {
                console.log('No se encontró información adicional del usuario');
                updateUILoggedIn(user, { role: 'client' });
            }
        } catch (error) {
            console.error('Error al obtener datos del usuario:', error);
            updateUILoggedIn(user, { role: 'client' });
        }
    } else {
        console.log('Usuario no logueado');
        updateUILoggedOut();
        const adminPanel = document.getElementById('adminPanel');
        if (adminPanel) adminPanel.remove();
        const salonPanel = document.getElementById('salonPanel');
        if (salonPanel) salonPanel.remove();
    }
});

// Función para mostrar el panel de admin
function showAdminPanel() {
    // Remover panel existente si hay uno
    const existingPanel = document.getElementById('adminPanel');
    if (existingPanel) existingPanel.remove();

    const adminPanel = `
        <div id="adminPanel" class="admin-panel">
            <h2>Panel de Administración</h2>
            <div class="admin-actions">
                <button onclick="showCreateSalonAccountModal()">Crear Cuenta de Peluquería</button>
                <div id="salonAccountsList" class="salon-accounts-list">
                    <h3>Peluquerías Registradas</h3>
                    <!-- Lista de peluquerías se cargará aquí -->
                </div>
            </div>
        </div>
    `;
    
    document.querySelector('main').insertAdjacentHTML('afterbegin', adminPanel);
    loadSalonAccounts();
}

// Función para mostrar el modal de creación de cuenta de peluquería (versión admin)
function showCreateSalonAccountModal() {
    const modal = `
        <div class="modal" id="createSalonModal">
            <div class="modal-content">
                <h2>Crear Cuenta de Peluquería</h2>
                <p class="modal-info">Solo se crearán las credenciales de acceso. La peluquería deberá completar su perfil al iniciar sesión.</p>
                <form id="createSalonForm">
                    <input type="text" id="salonName" placeholder="Nombre del Negocio" required>
                    <input type="email" id="salonEmail" placeholder="Email" required>
                    <input type="password" id="salonPassword" placeholder="Contraseña" required>
                    <button type="submit">Crear Cuenta</button>
                </form>
                <button class="close-modal" onclick="document.getElementById('createSalonModal').remove()">Cerrar</button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modal);
    
    // Event listener para el formulario
    document.getElementById('createSalonForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('salonEmail').value;
        const password = document.getElementById('salonPassword').value;
        const name = document.getElementById('salonName').value;
        
        try {
            // Crear usuario en Authentication
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            
            // Crear documento del usuario con rol de peluquería
            await db.collection('users').doc(userCredential.user.uid).set({
                name: name,
                email: email,
                role: 'peluqueria',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                profileCompleted: false
            });
            
            alert('Cuenta de peluquería creada exitosamente. La peluquería podrá completar su perfil al iniciar sesión.');
            document.getElementById('createSalonModal').remove();
            loadSalonAccounts();
        } catch (error) {
            alert('Error al crear cuenta: ' + error.message);
        }
    });
}

// Función para cargar la lista de peluquerías
async function loadSalonAccounts() {
    const salonsList = document.getElementById('salonAccountsList');
    if (!salonsList) return;

    try {
        const snapshot = await db.collection('users')
            .where('role', '==', 'peluqueria')
            .get();

        let html = '<h3>Peluquerías Registradas</h3><div class="salons-list">';
        
        for (const userDoc of snapshot.docs) {
            const userData = userDoc.data();
            const userId = userDoc.id;
            
            const peluqueriaSnapshot = await db.collection('peluquerias')
                .where('adminId', '==', userId)
                .get();

            const peluqueriaData = peluqueriaSnapshot.empty ? null : peluqueriaSnapshot.docs[0].data();
            const peluqueriaId = peluqueriaSnapshot.empty ? null : peluqueriaSnapshot.docs[0].id;

            html += `
                <div class="salon-item">
                    <p><strong>${userData.name}</strong></p>
                    <p>${userData.email}</p>
                    ${peluqueriaData ? 
                        `<p>Perfil completado</p>` : 
                        '<p>Perfil no completado</p>'
                    }
                    <button onclick="deleteSalonAndUser('${userId}', '${peluqueriaId || ''}')" 
                            class="delete-btn" style="background-color: #e74c3c; color: white; padding: 5px 10px; border: none; border-radius: 3px; cursor: pointer; margin-top: 10px;">
                        Eliminar Peluquería
                    </button>
                </div>
            `;
        }
        
        html += '</div>';
        salonsList.innerHTML = html;
    } catch (error) {
        console.error('Error al cargar peluquerías:', error);
        salonsList.innerHTML = '<p>Error al cargar las peluquerías</p>';
    }
}

// Función para eliminar peluquería y usuario
async function deleteSalonAndUser(userId, peluqueriaId) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta peluquería? Esta acción no se puede deshacer.')) {
        return;
    }

    try {
        // Eliminar documento de peluquería si existe
        if (peluqueriaId) {
            // Primero eliminar todas las reservas asociadas
            const reservasSnapshot = await db.collection('reservas')
                .where('peluqueriaId', '==', peluqueriaId)
                .get();
            
            const batch = db.batch();
            reservasSnapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            
            // Eliminar todas las reseñas asociadas
            const resenasSnapshot = await db.collection('resenas')
                .where('peluqueriaId', '==', peluqueriaId)
                .get();
            
            resenasSnapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            
            await batch.commit();
            
            // Eliminar el documento de la peluquería
            await db.collection('peluquerias').doc(peluqueriaId).delete();
        }

        // Eliminar el documento del usuario
        await db.collection('users').doc(userId).delete();

        alert('Peluquería eliminada correctamente. El usuario no podrá acceder al sistema.');
        loadSalonAccounts(); // Recargar la lista
    } catch (error) {
        console.error('Error al eliminar peluquería:', error);
        alert('Error al eliminar la peluquería: ' + error.message);
    }
}

// Función para mostrar el modal de login
function showLoginModal() {
    const modal = `
        <div class="modal" id="loginModal">
            <div class="modal-content">
                <h2>Iniciar Sesión</h2>
                <form id="loginForm">
                    <input type="email" id="loginEmail" placeholder="Email" required>
                    <input type="password" id="loginPassword" placeholder="Contraseña" required>
                    <button type="submit">Iniciar Sesión</button>
                </form>
                <button onclick="loginWithGoogle()">Iniciar Sesión con Google</button>
                <button class="close-modal" onclick="document.getElementById('loginModal').remove()">Cerrar</button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modal);
    
    // Agregar event listener al formulario
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        try {
            await auth.signInWithEmailAndPassword(email, password);
            document.getElementById('loginModal').remove();
        } catch (error) {
            alert('Error al iniciar sesión: ' + error.message);
        }
    });
}

// Función para mostrar el modal de registro
function showRegisterModal() {
    const modal = `
        <div class="modal" id="registerModal">
            <div class="modal-content">
                <h2>Registrarse</h2>
                <form id="registerForm">
                    <input type="text" id="registerName" placeholder="Nombre" required>
                    <input type="email" id="registerEmail" placeholder="Email" required>
                    <input type="password" id="registerPassword" placeholder="Contraseña" required>
                    <button type="submit">Registrarse</button>
                </form>
                <button class="close-modal" onclick="document.getElementById('registerModal').remove()">Cerrar</button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modal);
    
    // Agregar event listener al formulario
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const name = document.getElementById('registerName').value;
        
        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            await db.collection('users').doc(userCredential.user.uid).set({
                name: name,
                email: email,
                role: 'client',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            document.getElementById('registerModal').remove();
        } catch (error) {
            alert('Error al registrarse: ' + error.message);
        }
    });
}

// Función para iniciar sesión con Google
async function loginWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        const result = await auth.signInWithPopup(provider);
        // Crear o actualizar documento del usuario
        await db.collection('users').doc(result.user.uid).set({
            name: result.user.displayName,
            email: result.user.email,
            role: 'client',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        if (document.getElementById('loginModal')) {
            document.getElementById('loginModal').remove();
        }
    } catch (error) {
        console.error('Error en login con Google:', error);
        alert('Error al iniciar sesión con Google');
    }
}

// Función para actualizar la UI cuando el usuario está logueado
function updateUILoggedIn(user, userData) {
    loginBtn.textContent = userData.role === 'admin' ? 'Panel Admin' : 'Mi Cuenta';
    registerBtn.style.display = 'none';
    
    // Agregar menú desplegable
    const userMenu = document.createElement('div');
    userMenu.className = 'user-menu';
    userMenu.innerHTML = `
        <p>Usuario: ${user.email}</p>
        <p>Rol: ${userData.role}</p>
        <button onclick="auth.signOut()">Cerrar Sesión</button>
    `;
    
    // Reemplazar el botón de login con el menú
    loginBtn.parentNode.replaceChild(userMenu, loginBtn);
}

// Función para actualizar la UI cuando el usuario no está logueado
function updateUILoggedOut() {
    // Restaurar botones originales si existe el menú de usuario
    const userMenu = document.querySelector('.user-menu');
    if (userMenu) {
        userMenu.parentNode.replaceChild(loginBtn, userMenu);
    }
    
    loginBtn.textContent = 'Iniciar Sesión';
    registerBtn.style.display = 'block';
}

// Event Listeners
loginBtn.addEventListener('click', showLoginModal);
registerBtn.addEventListener('click', showRegisterModal);

// Función para verificar y mostrar el panel de peluquería
async function checkAndShowSalonPanel(userId) {
    try {
        console.log('Verificando panel de peluquería para userId:', userId);
        
        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.data();
        console.log('Datos del usuario:', userData);

        // Buscar si existe una peluquería asociada
        const salonSnapshot = await db.collection('peluquerias')
            .where('adminId', '==', userId)
            .get();
        
        console.log('¿Se encontró peluquería?', !salonSnapshot.empty);
        
        if (!salonSnapshot.empty) {
            // Si existe una peluquería, mostrar el panel de gestión
            const salonData = salonSnapshot.docs[0].data();
            const salonId = salonSnapshot.docs[0].id;
            console.log('Datos de la peluquería encontrada:', salonData);
            showSalonManagementPanel(salonData, salonId);
            
            // Actualizar el estado del usuario si es necesario
            if (!userData.profileCompleted) {
                await db.collection('users').doc(userId).update({
                    profileCompleted: true
                });
            }
        } else {
            // Si no existe peluquería, mostrar el panel inicial
            console.log('No se encontró peluquería, mostrando panel inicial');
            showInitialSalonPanel(userId, userData.name);
        }
    } catch (error) {
        console.error('Error al verificar peluquería:', error);
    }
}

// Función para mostrar el panel inicial de peluquería
function showInitialSalonPanel(userId, businessName) {
    const existingPanel = document.getElementById('salonPanel');
    if (existingPanel) existingPanel.remove();

    const initialPanel = `
        <div id="salonPanel" class="salon-panel">
            <h2>Panel de Peluquería - ${businessName}</h2>
            <div class="salon-welcome">
                <p>Bienvenido a tu panel de peluquería. Para comenzar a recibir reservas, necesitas configurar tu perfil.</p>
                <button onclick="showSalonRegistrationForm('${userId}', '${businessName}')" class="primary-button">
                    Configurar Perfil de Peluquería
                </button>
            </div>
        </div>
    `;

    document.querySelector('main').insertAdjacentHTML('afterbegin', initialPanel);
}

// Función para mostrar el formulario de registro de peluquería
function showSalonRegistrationForm(userId, businessName) {
    const existingPanel = document.getElementById('salonPanel');
    if (existingPanel) existingPanel.remove();

    const registrationForm = `
        <div id="salonPanel" class="salon-panel">
            <h2>Completar Perfil de ${businessName}</h2>
            <p class="registration-info">Para comenzar a recibir reservas, necesitamos información detallada de tu peluquería.</p>
            <form id="salonRegistrationForm" class="salon-registration-form">
                <div class="form-group">
                    <h3>Información Básica</h3>
                    <input type="text" id="salonName" value="${businessName}" placeholder="Nombre de la Peluquería" required>
                    <input type="text" id="salonAddress" placeholder="Dirección Completa" required>
                    <textarea id="salonDescription" placeholder="Descripción de la peluquería y servicios" required></textarea>
                    <input type="tel" id="salonPhone" placeholder="Teléfono de Contacto" required>
                </div>

                <div class="form-group">
                    <h3>Imágenes del Local</h3>
                    <p class="field-info" style="color: #e74c3c; padding: 1rem; background: #fdf2f0; border-radius: 5px; margin-bottom: 1rem;">
                        Las imágenes son gestionadas por el administrador. Por favor, envíale las fotos de tu local para su publicación.
                    </p>
                    <div id="salonImages" class="salon-images">
                        <!-- Las imágenes se mostrarán aquí cuando el administrador las suba -->
                        <p style="text-align: center; color: #666;">No hay imágenes disponibles</p>
                    </div>
                </div>

                <div class="form-group">
                    <h3>Ubicación</h3>
                    <input type="text" id="salonCity" placeholder="Ciudad" required>
                    <input type="text" id="salonZip" placeholder="Código Postal" required>
                    <!-- Aquí podríamos agregar un mapa para seleccionar ubicación exacta -->
                </div>

                <div class="form-group">
                    <h3>Horarios</h3>
                    <div id="scheduleInputs">
                        ${['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'].map(day => `
                            <div class="schedule-day">
                                <label>${day.charAt(0).toUpperCase() + day.slice(1)}</label>
                                <div class="time-inputs">
                                    <input type="time" id="${day}_start" placeholder="Apertura">
                                    <input type="time" id="${day}_end" placeholder="Cierre">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="${day}_closed" onchange="toggleDaySchedule(this)">
                                        Cerrado
                                    </label>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="form-group">
                    <h3>Servicios</h3>
                    <div id="servicesContainer">
                        <div class="service-input">
                            <input type="text" placeholder="Nombre del servicio" class="service-name">
                            <input type="number" placeholder="Precio €" class="service-price">
                            <input type="number" placeholder="Duración (min)" class="service-duration">
                        </div>
                    </div>
                    <button type="button" onclick="addServiceInput()" class="secondary-button">+ Agregar Servicio</button>
                </div>

                <button type="submit" class="submit-button">Completar Registro</button>
            </form>
        </div>
    `;

    document.querySelector('main').insertAdjacentHTML('afterbegin', registrationForm);

    // Event listener para el formulario
    document.getElementById('salonRegistrationForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
            // Mostrar indicador de carga
            const submitButton = e.target.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.textContent = 'Procesando...';

            // Recopilar todos los datos del formulario
            const peluqueriaData = {
                nombre: document.getElementById('salonName').value,
                direccion: document.getElementById('salonAddress').value,
                descripcion: document.getElementById('salonDescription').value,
                telefono: document.getElementById('salonPhone').value,
                ciudad: document.getElementById('salonCity').value,
                codigoPostal: document.getElementById('salonZip').value,
                adminId: userId,
                horarios: {},
                servicios: [],
                fotos: [], // Array vacío por defecto
                valoracion: 0,
                numValoraciones: 0,
                destacada: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            // Recopilar horarios
            const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
            dias.forEach(day => {
                const closedCheckbox = document.getElementById(`${day}_closed`);
                const startInput = document.getElementById(`${day}_start`);
                const endInput = document.getElementById(`${day}_end`);
                
                if (closedCheckbox && startInput && endInput) {
                    const isClosed = closedCheckbox.checked;
                    peluqueriaData.horarios[day] = isClosed ? 
                        { cerrado: true } : 
                        {
                            inicio: startInput.value || '',
                            fin: endInput.value || '',
                            cerrado: false
                        };
                } else {
                    peluqueriaData.horarios[day] = { cerrado: true };
                }
            });

            // Recopilar servicios
            document.querySelectorAll('.service-input').forEach((serviceDiv, index) => {
                const nombre = serviceDiv.querySelector('.service-name').value;
                const precio = serviceDiv.querySelector('.service-price').value;
                const duracion = serviceDiv.querySelector('.service-duration').value;
                
                if (nombre && precio && duracion) {
                    peluqueriaData.servicios.push({
                        id: index.toString(),
                        nombre,
                        precio: Number(precio),
                        duracion: Number(duracion)
                    });
                }
            });

            // Crear documento de peluquería
            const docRef = await db.collection('peluquerias').add(peluqueriaData);
            
            // Marcar el perfil como completo
            await db.collection('users').doc(userId).update({
                profileCompleted: true
            });

            alert('¡Perfil de peluquería completado exitosamente!');
            showSalonManagementPanel(peluqueriaData, docRef.id);
        } catch (error) {
            console.error('Error al registrar peluquería:', error);
            alert('Error al completar el perfil de la peluquería: ' + error.message);
        } finally {
            // Restaurar el botón
            const submitButton = document.querySelector('#salonRegistrationForm button[type="submit"]');
            submitButton.disabled = false;
            submitButton.textContent = 'Completar Registro';
        }
    });
}

// Función para toggle los inputs de horario
function toggleDaySchedule(checkbox) {
    const day = checkbox.id.replace('_closed', '');
    const startInput = document.getElementById(`${day}_start`);
    const endInput = document.getElementById(`${day}_end`);
    
    startInput.disabled = checkbox.checked;
    endInput.disabled = checkbox.checked;
    
    if (checkbox.checked) {
        startInput.value = '';
        endInput.value = '';
    }
}

// Función para agregar más campos de servicio
function addServiceInput() {
    const serviceInput = `
        <div class="service-input">
            <input type="text" placeholder="Nombre del servicio" class="service-name">
            <input type="number" placeholder="Precio" class="service-price">
            <input type="number" placeholder="Duración (min)" class="service-duration">
            <button type="button" onclick="this.parentElement.remove()">-</button>
        </div>
    `;
    document.getElementById('servicesContainer').insertAdjacentHTML('beforeend', serviceInput);
}

// Función para mostrar el panel de gestión de la peluquería
function showSalonManagementPanel(salonData, salonId) {
    const existingPanel = document.getElementById('salonPanel');
    if (existingPanel) existingPanel.remove();

    const managementPanel = `
        <div id="salonPanel" class="salon-panel ${localStorage.getItem('panelMinimized') === 'true' ? 'minimized' : ''}">
            <button class="minimize-btn" onclick="togglePanel()">${localStorage.getItem('panelMinimized') === 'true' ? '+' : '−'}</button>
            <h2>Panel de Gestión - ${salonData.nombre}</h2>
            <div class="management-sections">
                <div class="section">
                    <h3><i class="fas fa-calendar-check"></i>Gestión de Reservas</h3>
                    <div class="reservas-filtros">
                        <select id="filtroEstado" onchange="filtrarReservas('${salonId}')">
                            <option value="todas">Todas las reservas</option>
                            <option value="pendiente">Pendientes</option>
                            <option value="confirmada">Confirmadas</option>
                            <option value="cancelada">Canceladas</option>
                        </select>
                        <input type="date" id="filtroFecha" onchange="filtrarReservas('${salonId}')">
                    </div>
                    <div class="reservas-navegacion">
                        <button onclick="cambiarPaginaReservas(-1, '${salonId}')" class="nav-btn" id="prevPage">Anterior</button>
                        <span id="paginaActual">Página 1</span>
                        <button onclick="cambiarPaginaReservas(1, '${salonId}')" class="nav-btn" id="nextPage">Siguiente</button>
                    </div>
                    <div id="reservasList" class="bookings-list">
                        Cargando reservas...
                    </div>
                </div>
                <div class="section">
                    <h3><i class="fas fa-store"></i>Información de la Peluquería</h3>
                    <div class="salon-info-details">
                        <p><i class="fas fa-signature"></i><strong>Nombre:</strong> ${salonData.nombre}</p>
                        <p><i class="fas fa-map-marker-alt"></i><strong>Dirección:</strong> ${salonData.direccion}</p>
                        <p><i class="fas fa-city"></i><strong>Ciudad:</strong> ${salonData.ciudad}</p>
                        <p><i class="fas fa-mail-bulk"></i><strong>Código Postal:</strong> ${salonData.codigoPostal}</p>
                        <p><i class="fas fa-phone"></i><strong>Teléfono:</strong> ${salonData.telefono}</p>
                        <p><i class="fas fa-info-circle"></i><strong>Descripción:</strong> ${salonData.descripcion}</p>
                    </div>
                    <button onclick="editSalonInfo('${salonId}', ${JSON.stringify(salonData).replace(/"/g, '&quot;')})">Editar Información</button>
                </div>
                <div class="section">
                    <h3><i class="fas fa-cut"></i>Servicios</h3>
                    <div id="servicesList">
                        ${salonData.servicios.map(servicio => `
                            <div class="service-item">
                                <span>${servicio.nombre}</span>
                                <span>€${servicio.precio}</span>
                                <span>${servicio.duracion} min</span>
                            </div>
                        `).join('')}
                    </div>
                    <button onclick="editServices('${salonId}')">Gestionar Servicios</button>
                </div>
            </div>
        </div>
    `;

    document.querySelector('main').insertAdjacentHTML('afterbegin', managementPanel);
    
    // Inicializar fecha del filtro
    const filtroFecha = document.getElementById('filtroFecha');
    const today = new Date().toISOString().split('T')[0];
    filtroFecha.value = today;
    
    // Cargar reservas iniciales
    cargarReservas(salonId);
    
    // Recargar la lista de peluquerías en la página principal
    if (typeof loadFeaturedSalons === 'function') {
        loadFeaturedSalons();
    }
}

// Variables globales para la paginación
let paginaActual = 1;
const reservasPorPagina = 5;
let totalReservas = 0;

// Función para cargar reservas con filtros
async function cargarReservas(salonId, pagina = 1) {
    const reservasList = document.getElementById('reservasList');
    const filtroEstado = document.getElementById('filtroEstado').value;
    const filtroFecha = document.getElementById('filtroFecha').value;

    try {
        // Crear fechas para el inicio y fin del día seleccionado
        const startDate = new Date(filtroFecha);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(filtroFecha);
        endDate.setHours(23, 59, 59, 999);

        let reservas = [];

        try {
            // Intentar primero con la consulta completa
            let query = db.collection('reservas')
                .where('peluqueriaId', '==', salonId);

            // Aplicar filtros solo si no son los valores por defecto
            if (filtroEstado !== 'todas') {
                query = query.where('estado', '==', filtroEstado);
            }
            
            if (filtroFecha) {
                query = query.where('fecha', '>=', startDate)
                           .where('fecha', '<=', endDate);
            }

            const snapshot = await query.get();
            snapshot.forEach(doc => {
                reservas.push({ ...doc.data(), id: doc.id });
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
                if ((!filtroFecha || (fechaReserva >= startDate && fechaReserva <= endDate)) && 
                    (filtroEstado === 'todas' || reserva.estado === filtroEstado)) {
                    reservas.push({ ...reserva, id: doc.id });
                }
            });
        }

        // Ordenar por fecha (de más próxima a más lejana)
        reservas.sort((a, b) => {
            const fechaA = a.fecha.toDate();
            const fechaB = b.fecha.toDate();
            // Comparar con la fecha actual para ordenar primero las más próximas
            const ahora = new Date();
            // Si la fecha ya pasó, ponerla al final
            if (fechaA < ahora && fechaB < ahora) {
                return fechaB - fechaA; // Las fechas pasadas se ordenan de más reciente a más antigua
            } else if (fechaA < ahora) {
                return 1; // A es pasada, mover al final
            } else if (fechaB < ahora) {
                return -1; // B es pasada, mover al final
            }
            return fechaA - fechaB; // Ordenar fechas futuras de más próxima a más lejana
        });

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

// Función para filtrar reservas
function filtrarReservas(salonId) {
    paginaActual = 1; // Resetear a la primera página al filtrar
    cargarReservas(salonId, paginaActual);
}

// Función para cambiar de página
function cambiarPaginaReservas(direccion, salonId) {
    const nuevaPagina = paginaActual + direccion;
    const totalPaginas = Math.ceil(totalReservas / reservasPorPagina);
    
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
        paginaActual = nuevaPagina;
        cargarReservas(salonId, paginaActual);
    }
}

// Función para editar la información de la peluquería
function editSalonInfo(salonId, salonData) {
    const modal = `
        <div class="modal" id="editSalonModal">
            <div class="modal-content">
                <button class="close-modal" onclick="closeEditModal()">×</button>
                <h2>Editar Información de la Peluquería</h2>
                <form id="editSalonForm" class="salon-registration-form">
                    <div class="form-group">
                        <h3>Información Básica</h3>
                        <input type="text" id="salonName" value="${salonData.nombre}" placeholder="Nombre de la Peluquería" required>
                        <input type="text" id="salonAddress" value="${salonData.direccion}" placeholder="Dirección Completa" required>
                        <textarea id="salonDescription" placeholder="Descripción de la peluquería y servicios" required>${salonData.descripcion}</textarea>
                        <input type="tel" id="salonPhone" value="${salonData.telefono}" placeholder="Teléfono de Contacto" required>
                    </div>

                    <div class="form-group">
                        <h3>Ubicación</h3>
                        <input type="text" id="salonCity" value="${salonData.ciudad}" placeholder="Ciudad" required>
                        <input type="text" id="salonZip" value="${salonData.codigoPostal}" placeholder="Código Postal" required>
                    </div>

                    <div class="form-group">
                        <h3>Horarios</h3>
                        <div id="scheduleInputs">
                            ${['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'].map(day => `
                                <div class="schedule-day">
                                    <label>${day.charAt(0).toUpperCase() + day.slice(1)}</label>
                                    <div class="time-inputs">
                                        <input type="time" id="${day}_start" value="${salonData.horarios[day]?.inicio || ''}" 
                                               ${salonData.horarios[day]?.cerrado ? 'disabled' : ''}>
                                        <input type="time" id="${day}_end" value="${salonData.horarios[day]?.fin || ''}"
                                               ${salonData.horarios[day]?.cerrado ? 'disabled' : ''}>
                                        <label class="checkbox-label">
                                            <input type="checkbox" id="${day}_closed" 
                                                   onchange="toggleDaySchedule(this)"
                                                   ${salonData.horarios[day]?.cerrado ? 'checked' : ''}>
                                            Cerrado
                                        </label>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <button type="submit" class="submit-button">Guardar Cambios</button>
                </form>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modal);
    document.body.classList.add('modal-open');

    // Event listener para el formulario
    document.getElementById('editSalonForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
            const submitButton = e.target.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.textContent = 'Guardando...';

            const updatedData = {
                nombre: document.getElementById('salonName').value,
                direccion: document.getElementById('salonAddress').value,
                descripcion: document.getElementById('salonDescription').value,
                telefono: document.getElementById('salonPhone').value,
                ciudad: document.getElementById('salonCity').value,
                codigoPostal: document.getElementById('salonZip').value,
                horarios: {}
            };

            // Recopilar horarios
            const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
            dias.forEach(day => {
                const closedCheckbox = document.getElementById(`${day}_closed`);
                const startInput = document.getElementById(`${day}_start`);
                const endInput = document.getElementById(`${day}_end`);
                
                if (closedCheckbox && startInput && endInput) {
                    const isClosed = closedCheckbox.checked;
                    updatedData.horarios[day] = isClosed ? 
                        { cerrado: true } : 
                        {
                            inicio: startInput.value || '',
                            fin: endInput.value || '',
                            cerrado: false
                        };
                }
            });

            await db.collection('peluquerias').doc(salonId).update(updatedData);
            
            // Obtener los datos actualizados de la peluquería
            const updatedSalonDoc = await db.collection('peluquerias').doc(salonId).get();
            const updatedSalonData = updatedSalonDoc.data();
            
            // Actualizar el panel con la nueva información
            showSalonManagementPanel(updatedSalonData, salonId);
            
            closeEditModal();
            alert('Información actualizada correctamente');
        } catch (error) {
            console.error('Error al actualizar información:', error);
            alert('Error al actualizar la información: ' + error.message);
        } finally {
            const submitButton = e.target.querySelector('button[type="submit"]');
            submitButton.disabled = false;
            submitButton.textContent = 'Guardar Cambios';
        }
    });
}

// Función para cerrar el modal de edición
function closeEditModal() {
    document.getElementById('editSalonModal').remove();
    document.body.classList.remove('modal-open');
}

// Función para alternar el estado del panel
function togglePanel() {
    const panel = document.getElementById('salonPanel');
    const minimizeBtn = panel.querySelector('.minimize-btn');
    
    if (panel.classList.contains('minimized')) {
        panel.classList.remove('minimized');
        minimizeBtn.textContent = '−';
        localStorage.setItem('panelMinimized', 'false');
    } else {
        panel.classList.add('minimized');
        minimizeBtn.textContent = '+';
        localStorage.setItem('panelMinimized', 'true');
    }
}

// Función para confirmar una reserva
async function confirmarReserva(reservaId) {
    try {
        // Obtener la reserva antes de actualizarla para tener el peluqueriaId
        const reservaDoc = await db.collection('reservas').doc(reservaId).get();
        const peluqueriaId = reservaDoc.data().peluqueriaId;

        await db.collection('reservas').doc(reservaId).update({
            estado: 'confirmada'
        });
        
        // Recargar las reservas usando cargarReservas
        cargarReservas(peluqueriaId, paginaActual);
    } catch (error) {
        console.error('Error al confirmar reserva:', error);
        alert('Error al confirmar la reserva');
    }
}

// Función para cancelar una reserva
async function cancelarReserva(reservaId) {
    if (confirm('¿Estás seguro de que deseas cancelar esta reserva?')) {
        try {
            // Obtener la reserva antes de actualizarla para tener el peluqueriaId
            const reservaDoc = await db.collection('reservas').doc(reservaId).get();
            const peluqueriaId = reservaDoc.data().peluqueriaId;

            await db.collection('reservas').doc(reservaId).update({
                estado: 'cancelada'
            });
            
            // Recargar las reservas usando cargarReservas
            cargarReservas(peluqueriaId, paginaActual);
        } catch (error) {
            console.error('Error al cancelar reserva:', error);
            alert('Error al cancelar la reserva');
        }
    }
} 