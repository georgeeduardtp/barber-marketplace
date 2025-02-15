// Obtener el ID de la peluquería de la URL
const urlParams = new URLSearchParams(window.location.search);
const salonId = urlParams.get('id');

// Referencias a elementos del DOM
const salonName = document.getElementById('salonName');
const salonAddress = document.getElementById('salonAddress');
const salonRating = document.getElementById('salonRating');
const salonImages = document.getElementById('salonImages');
const servicesList = document.getElementById('servicesList');
const scheduleList = document.getElementById('scheduleList');
const serviceSelect = document.getElementById('serviceSelect');
const dateSelect = document.getElementById('dateSelect');
const timeSelect = document.getElementById('timeSelect');
const bookingForm = document.getElementById('bookingForm');
const reviewsList = document.getElementById('reviewsList');
const salonDescription = document.getElementById('salonDescription');
const salonPhone = document.getElementById('salonPhone');
const salonLocation = document.getElementById('salonLocation');

// Cargar datos de la peluquería
async function loadSalonDetails() {
    try {
        const doc = await db.collection('peluquerias').doc(salonId).get();
        
        if (doc.exists) {
            const salon = doc.data();
            
            // Actualizar información básica
            document.title = `${salon.nombre} - Detalles`;
            salonName.textContent = salon.nombre;
            salonAddress.textContent = salon.direccion;
            salonDescription.textContent = salon.descripcion;
            salonPhone.textContent = salon.telefono;
            salonLocation.textContent = `${salon.ciudad}, ${salon.codigoPostal}`;
            
            salonRating.innerHTML = `
                ${generateStars(salon.valoracion || 0)}
                <span>(${salon.numValoraciones || 0} reseñas)</span>
            `;

            // Cargar imágenes
            loadImages(salon.fotos || []);

            // Cargar servicios
            loadServices(salon.servicios || []);

            // Cargar horarios
            loadSchedule(salon.horarios || {});

            // Cargar reseñas
            loadReviews(salonId);

            // Configurar el formulario de reserva
            setupBookingForm(salon.servicios || [], salon.horarios || {});
        } else {
            console.error('No se encontró la peluquería');
            showError('No se encontró la peluquería especificada');
        }
    } catch (error) {
        console.error('Error al cargar detalles:', error);
        showError('Error al cargar los detalles de la peluquería');
    }
}

// Cargar imágenes de la peluquería
function loadImages(fotos) {
    if (fotos.length === 0) {
        salonImages.innerHTML = '<img src="img/default-salon.jpg" alt="Imagen por defecto">';
        return;
    }

    salonImages.innerHTML = `
        <div class="main-image">
            <img src="${fotos[0]}" alt="Imagen principal">
        </div>
        <div class="thumbnail-images">
            ${fotos.map((foto, index) => `
                <img src="${foto}" alt="Imagen ${index + 1}" 
                     onclick="changeMainImage(this.src)">
            `).join('')}
        </div>
    `;
}

// Cambiar imagen principal
function changeMainImage(src) {
    const mainImage = document.querySelector('.main-image img');
    if (mainImage) {
        mainImage.src = src;
    }
}

// Cargar servicios
function loadServices(servicios) {
    servicesList.innerHTML = servicios.map(servicio => `
        <div class="service-card">
            <h3>${servicio.nombre}</h3>
            <div class="service-details">
                <span class="price">€${servicio.precio}</span>
                <span class="duration">${servicio.duracion} min</span>
            </div>
            <button onclick="selectService('${servicio.id}')" class="book-service-btn">
                Reservar
            </button>
        </div>
    `).join('');

    // Actualizar select de servicios
    serviceSelect.innerHTML = `
        <option value="">Seleccionar servicio</option>
        ${servicios.map(servicio => `
            <option value="${servicio.id}">${servicio.nombre} - €${servicio.precio}</option>
        `).join('')}
    `;
}

// Cargar horarios
function loadSchedule(horarios) {
    const dias = {
        'lunes': 'Lunes',
        'martes': 'Martes',
        'miercoles': 'Miércoles',
        'jueves': 'Jueves',
        'viernes': 'Viernes',
        'sabado': 'Sábado',
        'domingo': 'Domingo'
    };

    scheduleList.innerHTML = Object.entries(dias).map(([key, label]) => {
        const horario = horarios[key] || { cerrado: true };
        return `
            <div class="schedule-day">
                <strong>${label}:</strong>
                <span>${horario.cerrado ? 'Cerrado' : 
                    `${horario.inicio} - ${horario.fin}`}</span>
            </div>
        `;
    }).join('');
}

// Configurar formulario de reserva
function setupBookingForm(servicios, horarios) {
    // Configurar fecha mínima (mañana)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dateSelect.min = tomorrow.toISOString().split('T')[0];

    // Configurar fecha máxima (30 días desde hoy)
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    dateSelect.max = maxDate.toISOString().split('T')[0];

    // Event listener para cuando se selecciona una fecha
    dateSelect.addEventListener('change', () => {
        const selectedDate = new Date(dateSelect.value);
        // Obtener el día de la semana en español
        const days = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
        const dayOfWeek = days[selectedDate.getDay()];
        console.log('Día seleccionado:', dayOfWeek);
        console.log('Horarios disponibles:', horarios);
        const horario = horarios[dayOfWeek];
        console.log('Horario para este día:', horario);
        generateTimeSlots(horario);
    });
}

// Generar slots de tiempo
function generateTimeSlots(horario) {
    const timeSlotsContainer = document.getElementById('timeSlots');
    const selectedTimeInput = document.getElementById('selectedTime');
    timeSlotsContainer.innerHTML = '';

    console.log('Generando slots para horario:', horario);

    if (!horario || horario.cerrado) {
        timeSlotsContainer.innerHTML = '<p class="text-center">Cerrado este día</p>';
        selectedTimeInput.value = '';
        return;
    }

    const [startHour, startMinute] = horario.inicio.split(':').map(Number);
    const [endHour, endMinute] = horario.fin.split(':').map(Number);

    console.log('Horario de inicio:', startHour, ':', startMinute);
    console.log('Horario de fin:', endHour, ':', endMinute);

    let currentHour = startHour;
    let currentMinute = startMinute;
    const timeSlots = [];

    // Crear slots de tiempo cada 30 minutos
    while (currentHour < endHour || (currentHour === endHour && currentMinute <= endMinute)) {
        const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
        timeSlots.push(timeString);

        currentMinute += 30;
        if (currentMinute >= 60) {
            currentHour++;
            currentMinute = 0;
        }
    }

    console.log('Slots generados:', timeSlots);

    // Crear elementos HTML para cada slot
    timeSlots.forEach(time => {
        const slot = document.createElement('div');
        slot.className = 'time-slot';
        slot.textContent = time;
        slot.onclick = () => {
            // Remover selección previa
            document.querySelectorAll('.time-slot').forEach(s => {
                s.classList.remove('selected');
            });
            // Seleccionar nuevo slot
            slot.classList.add('selected');
            selectedTimeInput.value = time;
        };
        timeSlotsContainer.appendChild(slot);
    });
}

// Cargar reseñas
async function loadReviews(salonId) {
    try {
        // Primero obtenemos todas las reseñas sin ordenar
        const snapshot = await db.collection('resenas')
            .where('peluqueriaId', '==', salonId)
            .get();

        const reviews = [];
        snapshot.forEach(doc => {
            reviews.push({
                ...doc.data(),
                id: doc.id
            });
        });

        // Ordenamos manualmente por fecha
        reviews.sort((a, b) => b.fecha.toDate() - a.fecha.toDate());

        // Tomamos solo las primeras 5 reseñas
        const recentReviews = reviews.slice(0, 5);

        reviewsList.innerHTML = '';
        recentReviews.forEach(review => {
            reviewsList.innerHTML += `
                <div class="review-card">
                    <div class="review-header">
                        <strong>${review.nombreUsuario}</strong>
                        <div class="stars">${generateStars(review.valoracion)}</div>
                    </div>
                    <p>${review.comentario}</p>
                    <small>${new Date(review.fecha.toDate()).toLocaleDateString()}</small>
                </div>
            `;
        });

        if (reviews.length === 0) {
            reviewsList.innerHTML = '<p>No hay reseñas disponibles</p>';
        }
    } catch (error) {
        console.error('Error al cargar reseñas:', error);
        reviewsList.innerHTML = '<p>Error al cargar las reseñas</p>';
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

// Manejar reserva
bookingForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const selectedTime = document.getElementById('selectedTime').value;
    if (!selectedTime) {
        alert('Por favor, selecciona una hora para tu cita');
        return;
    }

    const clientName = document.getElementById('clientName').value;
    const clientEmail = document.getElementById('clientEmail').value;
    const clientPhone = document.getElementById('clientPhone').value;
    const selectedServiceId = document.getElementById('serviceSelect').value;

    if (!selectedServiceId) {
        alert('Por favor, selecciona un servicio');
        return;
    }

    try {
        // Obtener los datos actualizados de la peluquería
        const salonDoc = await db.collection('peluquerias').doc(salonId).get();
        const salonData = salonDoc.data();
        
        // Encontrar el servicio seleccionado
        const selectedService = salonData.servicios.find(s => s.id === selectedServiceId);
        
        if (!selectedService) {
            alert('El servicio seleccionado no está disponible');
            return;
        }

        const [hours, minutes] = selectedTime.split(':');
        const reservaDate = new Date(dateSelect.value);
        reservaDate.setHours(parseInt(hours), parseInt(minutes), 0);

        // Crear objeto de reserva simplificado
        const reserva = {
            peluqueriaId: salonId,
            nombre: clientName,
            email: clientEmail,
            telefono: clientPhone,
            servicio: {
                id: selectedService.id,
                nombre: selectedService.nombre,
                precio: selectedService.precio,
                duracion: selectedService.duracion
            },
            fecha: new Date(reservaDate.getTime()),
            estado: 'pendiente'
        };

        const submitButton = e.target.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Procesando...';

        console.log('Intentando crear reserva:', reserva); // Para debug

        try {
            const docRef = await db.collection('reservas').add(reserva);
            console.log('Reserva creada con ID:', docRef.id); // Para debug
            alert('¡Reserva realizada con éxito! Te contactaremos para confirmar tu cita.');
            bookingForm.reset();
            document.querySelectorAll('.time-slot').forEach(s => {
                s.classList.remove('selected');
            });
            document.getElementById('selectedTime').value = '';
        } catch (error) {
            console.error('Error detallado al crear reserva:', error); // Para debug
            alert('Error al crear la reserva. Por favor, intenta nuevamente.');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Confirmar Reserva';
        }
    } catch (error) {
        console.error('Error general:', error);
        alert('Error al procesar la reserva. Por favor, intenta nuevamente.');
    }
});

// Función para seleccionar un servicio
function selectService(servicioId) {
    serviceSelect.value = servicioId;
    bookingForm.scrollIntoView({ behavior: 'smooth' });
}

// Mostrar error
function showError(message) {
    const mainContent = document.querySelector('.salon-details');
    mainContent.innerHTML = `
        <div class="error-message">
            <h2>Error</h2>
            <p>${message}</p>
            <a href="index.html" class="back-button">Volver al inicio</a>
        </div>
    `;
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    if (!salonId) {
        window.location.href = 'index.html';
        return;
    }
    loadSalonDetails();
}); 