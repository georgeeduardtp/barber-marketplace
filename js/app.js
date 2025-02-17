// Referencias a elementos del DOM
const featuredSalonsContainer = document.getElementById('featuredSalons');
const searchInput = document.querySelector('.search-bar input');
const searchButton = document.querySelector('.search-bar button');
const header = document.querySelector('header');

// Función para manejar el scroll
function handleScroll() {
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
}

// Event listener para el scroll
window.addEventListener('scroll', handleScroll);

// Funciones para el loader
function showLoader() {
    document.querySelector('.loader-container').classList.add('active');
}

function hideLoader() {
    document.querySelector('.loader-container').classList.remove('active');
}

// Cargar peluquerías destacadas
async function loadFeaturedSalons() {
    try {
        showLoader();
        const snapshot = await db.collection('peluquerias')
            .limit(6)
            .get();

        if (snapshot.empty) {
            featuredSalonsContainer.innerHTML = '<p>No hay peluquerías disponibles</p>';
            return;
        }

        let salonHTML = '';
        snapshot.forEach(doc => {
            const salon = doc.data();
            const imagenUrl = salon.fotos && salon.fotos.length > 0 ? 
                salon.fotos[0] : 'img/default-salon.jpg';
                
            salonHTML += `
                <div class="salon-card" data-id="${doc.id}">
                    <div class="salon-image" style="background-image: url('${imagenUrl}')"></div>
                    <div class="salon-info">
                        <h3>${salon.nombre}</h3>
                        <p>${salon.direccion}</p>
                        <div class="rating">
                            ${generateStars(salon.valoracion || 0)}
                            <span>(${salon.numValoraciones || 0} reseñas)</span>
                        </div>
                        <button onclick="verDetalles('${doc.id}')">Ver Detalles</button>
                    </div>
                </div>
            `;
        });

        featuredSalonsContainer.innerHTML = salonHTML;
    } catch (error) {
        console.error('Error al cargar peluquerías:', error);
        featuredSalonsContainer.innerHTML = '<p>Error al cargar peluquerías</p>';
    } finally {
        hideLoader();
    }
}

// Generar estrellas para la valoración
function generateStars(rating) {
    const fullStar = '★';
    const emptyStar = '☆';
    const stars = Math.round(rating);
    return `
        <div class="stars">
            ${fullStar.repeat(stars)}${emptyStar.repeat(5-stars)}
        </div>
    `;
}

// Función para ver detalles de una peluquería
function verDetalles(salonId) {
    window.location.href = `salon.html?id=${salonId}`;
}

// Función de búsqueda
async function buscarPeluquerias(query) {
    try {
        const snapshot = await db.collection('peluquerias')
            .where('nombre', '>=', query)
            .where('nombre', '<=', query + '\uf8ff')
            .limit(10)
            .get();

        // Aquí implementaremos la visualización de resultados
        console.log('Resultados de búsqueda:', snapshot.size);
    } catch (error) {
        console.error('Error en la búsqueda:', error);
    }
}

// Event Listeners
searchButton.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query) {
        buscarPeluquerias(query);
    }
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        if (query) {
            buscarPeluquerias(query);
        }
    }
});

// Cargar datos iniciales
document.addEventListener('DOMContentLoaded', () => {
    loadFeaturedSalons();
});

// Función para buscar peluquerías
async function searchSalons() {
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    const query = searchInput.value.trim().toLowerCase();

    if (query.length < 2) {
        searchResults.classList.remove('active');
        return;
    }

    try {
        showLoader();
        const snapshot = await db.collection('peluquerias').get();
        const results = [];

        snapshot.forEach(doc => {
            const salon = doc.data();
            if (salon.nombre.toLowerCase().includes(query) || 
                salon.ciudad.toLowerCase().includes(query) ||
                salon.direccion.toLowerCase().includes(query)) {
                results.push({
                    id: doc.id,
                    ...salon
                });
            }
        });

        if (results.length > 0) {
            let html = '';
            results.forEach(salon => {
                html += `
                    <div class="search-result-item" onclick="window.location.href='salon.html?id=${salon.id}'">
                        <div class="search-result-info">
                            <h4>${salon.nombre}</h4>
                            <p>${salon.direccion}, ${salon.ciudad}</p>
                        </div>
                    </div>
                `;
            });
            searchResults.innerHTML = html;
        } else {
            searchResults.innerHTML = '<div class="no-results">No se encontraron peluquerías</div>';
        }
        
        searchResults.classList.add('active');
    } catch (error) {
        console.error('Error al buscar peluquerías:', error);
        searchResults.innerHTML = '<div class="no-results">Error al realizar la búsqueda</div>';
        searchResults.classList.add('active');
    } finally {
        hideLoader();
    }
}

// Event listener para el input de búsqueda
document.getElementById('searchInput').addEventListener('input', debounce(searchSalons, 300));

// Event listener para cerrar los resultados cuando se hace clic fuera
document.addEventListener('click', (e) => {
    const searchResults = document.getElementById('searchResults');
    const searchBar = document.querySelector('.search-bar');
    
    if (!searchBar.contains(e.target)) {
        searchResults.classList.remove('active');
    }
});

// Función debounce para evitar muchas llamadas seguidas
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Event listener para la tecla Enter en el buscador
document.getElementById('searchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchSalons();
    }
});

// Función para crear cuenta de peluquería desde el panel de admin
async function crearCuentaPeluqueria() {
    try {
        showLoader();
        
        // Generar email y contraseña temporal
        const randomNum = Math.floor(Math.random() * 10000);
        const email = `peluqueria${randomNum}@gmail.com`;
        const password = `Peluqueria${randomNum}`;
        
        // Crear cuenta en Firebase Auth
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
        const uid = userCredential.user.uid;
        
        // Cerrar la sesión creada automáticamente
        await firebase.auth().signOut();
        
        // Restaurar la sesión del admin
        const adminAuth = JSON.parse(localStorage.getItem('adminAuth'));
        if (adminAuth) {
            await firebase.auth().signInWithEmailAndPassword(adminAuth.email, adminAuth.password);
        }
        
        // Crear documento en Firestore
        await db.collection('peluquerias').doc(uid).set({
            nombre: `Peluquería Prueba ${randomNum}`,
            email: email,
            perfilCompletado: false,
            fechaCreacion: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Mostrar mensaje de éxito con las credenciales
        alert(`Cuenta creada con éxito:\nEmail: ${email}\nContraseña: ${password}\n\nGuarda estas credenciales para compartirlas con la peluquería.`);
        
        // Recargar la lista de peluquerías
        cargarPeluquerias();
        
    } catch (error) {
        console.error('Error al crear cuenta:', error);
        alert('Error al crear la cuenta de peluquería');
    } finally {
        hideLoader();
    }
}

// Función para cargar la lista de peluquerías
async function cargarPeluquerias() {
    try {
        const snapshot = await db.collection('peluquerias').get();
        const salonsList = document.getElementById('salonsList');
        
        if (snapshot.empty) {
            salonsList.innerHTML = '<p>No hay peluquerías registradas</p>';
            return;
        }

        let html = '';
        snapshot.forEach(doc => {
            const salon = doc.data();
            html += `
                <div class="salon-item">
                    <strong>${salon.nombre}</strong>
                    <p>${salon.email}</p>
                    <p>Perfil ${salon.perfilCompletado ? 'completado' : 'no completado'}</p>
                    <div class="action-buttons">
                        <button onclick="gestionarImagenes('${doc.id}')">
                            <i class="fas fa-images"></i> Gestionar Imágenes
                        </button>
                        <button onclick="eliminarPeluqueria('${doc.id}')" style="background-color: var(--accent-color)">
                            <i class="fas fa-trash"></i> Eliminar Peluquería
                        </button>
                    </div>
                </div>
            `;
        });
        
        salonsList.innerHTML = html;
    } catch (error) {
        console.error('Error al cargar peluquerías:', error);
        document.getElementById('salonsList').innerHTML = '<p>Error al cargar las peluquerías</p>';
    }
} 