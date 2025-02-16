// Obtener el ID de la peluquería de la URL
const urlParams = new URLSearchParams(window.location.search);
const salonId = urlParams.get('id');

// Referencias a elementos del DOM
const header = document.querySelector('header');
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
    const carouselTrack = document.querySelector('.carousel-track');
    const carouselThumbnails = document.querySelector('.carousel-thumbnails');
    
    if (fotos.length === 0) {
        fotos = [
            'img/default-salon.jpg',
            'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?ixlib=rb-4.0.3',
            'https://images.unsplash.com/photo-1562322140-8baeececf3df?ixlib=rb-4.0.3',
            'https://images.unsplash.com/photo-1560066984-138dadb4c035?ixlib=rb-4.0.3'
        ];
    }

    // Cargar imágenes principales
    carouselTrack.innerHTML = fotos.map((foto, index) => `
        <img src="${foto}" 
             alt="Vista ${index + 1} de la peluquería"
             class="${index === 0 ? 'active' : ''}"
             loading="${index === 0 ? 'eager' : 'lazy'}"
        >
    `).join('');

    // Cargar miniaturas
    carouselThumbnails.innerHTML = fotos.map((foto, index) => `
        <img src="${foto}"
             alt="Miniatura ${index + 1}"
             class="${index === 0 ? 'active' : ''}"
             onclick="changeSlide(${index})"
             loading="lazy"
        >
    `).join('');

    // Configurar botones de navegación
    const prevButton = document.querySelector('.carousel-button.prev');
    const nextButton = document.querySelector('.carousel-button.next');
    
    if (fotos.length <= 1) {
        prevButton.style.display = 'none';
        nextButton.style.display = 'none';
    } else {
        prevButton.style.display = 'flex';
        nextButton.style.display = 'flex';
        
        prevButton.onclick = () => changeSlide('prev');
        nextButton.onclick = () => changeSlide('next');
    }
}

let currentSlide = 0;

function changeSlide(direction) {
    const slides = document.querySelectorAll('.carousel-track img');
    const thumbnails = document.querySelectorAll('.carousel-thumbnails img');
    
    if (slides.length <= 1) return;

    if (direction === 'prev') {
        currentSlide = (currentSlide - 1 + slides.length) % slides.length;
    } else if (direction === 'next') {
        currentSlide = (currentSlide + 1) % slides.length;
    } else if (typeof direction === 'number') {
        currentSlide = direction;
    }

    // Actualizar imágenes principales
    slides.forEach(slide => slide.classList.remove('active'));
    slides[currentSlide].classList.add('active');

    // Actualizar miniaturas
    thumbnails.forEach(thumb => thumb.classList.remove('active'));
    thumbnails[currentSlide].classList.add('active');
    
    // Scroll suave a la miniatura activa
    thumbnails[currentSlide].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
    });
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
            <button onclick="selectService('${servicio.id}')" class="salon-action-button select-service">
                <i class="fas fa-calendar-check"></i>
                Seleccionar Servicio
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

// Función para verificar las reservas existentes
async function getReservasDelDia(peluqueriaId, fecha) {
    try {
        // Crear fechas para el inicio y fin del día
        const startOfDay = new Date(fecha);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(fecha);
        endOfDay.setHours(23, 59, 59, 999);

        console.log('Consultando reservas para:', {
            peluqueriaId,
            fecha: fecha.toISOString(),
            startOfDay: startOfDay.toISOString(),
            endOfDay: endOfDay.toISOString()
        });

        // Primero intentamos con la consulta completa
        try {
            const snapshot = await db.collection('reservas')
                .where('peluqueriaId', '==', peluqueriaId)
                .where('fecha', '>=', startOfDay)
                .where('fecha', '<=', endOfDay)
                .where('estado', 'in', ['pendiente', 'confirmada'])
                .get();

            const reservas = [];
            snapshot.forEach(doc => {
                const reserva = doc.data();
                const fecha = reserva.fecha.toDate();
                reservas.push({
                    hora: `${fecha.getHours().toString().padStart(2, '0')}:${fecha.getMinutes().toString().padStart(2, '0')}`,
                    duracion: reserva.servicio.duracion
                });
            });
            return reservas;
        } catch (indexError) {
            console.log('Error de índice, usando consulta alternativa:', indexError);
            
            // Si falla por el índice, hacemos una consulta más simple y filtramos manualmente
            const snapshot = await db.collection('reservas')
                .where('peluqueriaId', '==', peluqueriaId)
                .get();

            const reservas = [];
            snapshot.forEach(doc => {
                const reserva = doc.data();
                const fecha = reserva.fecha.toDate();
                
                // Verificar si la fecha está en el rango del día y el estado es válido
                if (fecha >= startOfDay && 
                    fecha <= endOfDay && 
                    ['pendiente', 'confirmada'].includes(reserva.estado)) {
                    
                    reservas.push({
                        hora: `${fecha.getHours().toString().padStart(2, '0')}:${fecha.getMinutes().toString().padStart(2, '0')}`,
                        duracion: reserva.servicio.duracion
                    });
                }
            });
            return reservas;
        }
    } catch (error) {
        console.error('Error al obtener reservas:', error);
        return [];
    }
}

// Función para verificar si un horario está disponible
function isHorarioDisponible(hora, reservas, duracionServicio) {
    if (!duracionServicio) return true;

    const [horaSlot, minutosSlot] = hora.split(':').map(Number);
    const tiempoSlot = horaSlot * 60 + minutosSlot;
    
    for (const reserva of reservas) {
        const [horaRes, minutosRes] = reserva.hora.split(':').map(Number);
        const tiempoReserva = horaRes * 60 + minutosRes;
        
        // Verificar si hay solapamiento
        if (
            (tiempoSlot >= tiempoReserva && tiempoSlot < tiempoReserva + reserva.duracion) ||
            (tiempoSlot + duracionServicio > tiempoReserva && tiempoSlot < tiempoReserva)
        ) {
            return false;
        }
    }
    return true;
}

// Generar slots de tiempo
async function generateTimeSlots(horario) {
    const timeSlotsContainer = document.getElementById('timeSlots');
    const selectedTimeInput = document.getElementById('selectedTime');
    const selectedServiceId = document.getElementById('serviceSelect').value;
    
    // Limpiar contenedor y selección
    timeSlotsContainer.innerHTML = '';
    selectedTimeInput.value = '';

    if (!horario || horario.cerrado) {
        timeSlotsContainer.innerHTML = '<p class="text-center">Cerrado este día</p>';
        return;
    }

    if (!selectedServiceId) {
        timeSlotsContainer.innerHTML = '<p class="text-center">Por favor, selecciona un servicio primero</p>';
        return;
    }

    try {
        // Obtener la duración del servicio
        const servicioDoc = await db.collection('peluquerias').doc(salonId).get();
        const salon = servicioDoc.data();
        const servicio = salon.servicios.find(s => s.id === selectedServiceId);
        
        if (!servicio) {
            throw new Error('Servicio no encontrado');
        }

        const duracionServicio = servicio.duracion;
        const [startHour, startMinute] = horario.inicio.split(':').map(Number);
        const [endHour, endMinute] = horario.fin.split(':').map(Number);
        
        // Obtener la fecha seleccionada
        const selectedDate = new Date(dateSelect.value);
        
        // Obtener las reservas del día
        const reservasDelDia = await getReservasDelDia(salonId, selectedDate);
        console.log('Reservas del día:', reservasDelDia);

        let currentHour = startHour;
        let currentMinute = startMinute;
        const timeSlots = [];

        // Crear slots de tiempo cada 30 minutos
        while (currentHour < endHour || (currentHour === endHour && currentMinute <= endMinute)) {
            const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
            const isDisponible = isHorarioDisponible(timeString, reservasDelDia, duracionServicio);
            
            console.log(`Slot ${timeString} - Disponible: ${isDisponible}`);
            
            timeSlots.push({
                time: timeString,
                disponible: isDisponible
            });

            currentMinute += 30;
            if (currentMinute >= 60) {
                currentHour++;
                currentMinute = 0;
            }
        }

        // Crear elementos HTML para cada slot
        timeSlots.forEach(slot => {
            const slotElement = document.createElement('div');
            slotElement.className = `time-slot${slot.disponible ? '' : ' disabled'}`;
            slotElement.textContent = slot.time;
            
            if (slot.disponible) {
                slotElement.addEventListener('click', () => {
                    document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
                    slotElement.classList.add('selected');
                    selectedTimeInput.value = slot.time;
                });
            } else {
                slotElement.title = 'Horario no disponible';
                slotElement.addEventListener('click', () => {
                    alert('Este horario no está disponible. Por favor, selecciona otro horario.');
                });
            }
            
            timeSlotsContainer.appendChild(slotElement);
        });

    } catch (error) {
        console.error('Error al generar slots de tiempo:', error);
        timeSlotsContainer.innerHTML = '<p class="text-center">Error al cargar los horarios disponibles</p>';
    }
}

// Modificar el setupBookingForm para actualizar slots cuando cambie el servicio
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
        const days = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
        const dayOfWeek = days[selectedDate.getDay()];
        const horario = horarios[dayOfWeek];
        generateTimeSlots(horario);
    });

    // Event listener para cuando se cambia el servicio
    serviceSelect.addEventListener('change', () => {
        if (dateSelect.value) {
            const selectedDate = new Date(dateSelect.value);
            const days = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
            const dayOfWeek = days[selectedDate.getDay()];
            const horario = horarios[dayOfWeek];
            generateTimeSlots(horario);
        }
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

// Función para verificar si ya existe una reserva exacta
async function existeReservaExacta(peluqueriaId, fecha, hora) {
    try {
        const [hours, minutes] = hora.split(':');
        const reservaDate = new Date(fecha);
        reservaDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        // Crear un rango de tiempo para la búsqueda
        const startDate = new Date(reservaDate);
        const endDate = new Date(reservaDate);
        endDate.setMinutes(endDate.getMinutes() + 30); // Aumentamos a 30 minutos para cubrir la duración mínima

        console.log('Buscando reservas entre:', startDate, 'y', endDate);

        const snapshot = await db.collection('reservas')
            .where('peluqueriaId', '==', peluqueriaId)
            .where('fecha', '>=', startDate)
            .where('fecha', '<', endDate)
            .where('estado', 'in', ['pendiente', 'confirmada'])
            .get();

        return !snapshot.empty;
    } catch (error) {
        console.error('Error al verificar reserva existente:', error);
        throw error;
    }
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
    const selectedDate = dateSelect.value;

    try {
        const submitButton = e.target.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Verificando disponibilidad...';

        // Verificar si ya existe una reserva para esta hora
        const reservaExistente = await existeReservaExacta(salonId, selectedDate, selectedTime);
        
        if (reservaExistente) {
            alert('Este horario ya está reservado. Por favor, selecciona otro horario.');
            submitButton.disabled = false;
            submitButton.textContent = 'Confirmar Reserva';
            
            // Regenerar los slots de tiempo
            const selectedDateObj = new Date(selectedDate);
            const days = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
            const dayOfWeek = days[selectedDateObj.getDay()];
            
            const salonDoc = await db.collection('peluquerias').doc(salonId).get();
            const salonData = salonDoc.data();
            const horario = salonData.horarios[dayOfWeek];
            
            await generateTimeSlots(horario);
            return;
        }

        // Obtener los datos del servicio
        const salonDoc = await db.collection('peluquerias').doc(salonId).get();
        const salonData = salonDoc.data();
        const selectedService = salonData.servicios.find(s => s.id === selectedServiceId);

        if (!selectedService) {
            throw new Error('Servicio no encontrado');
        }

        // Crear la fecha de la reserva
        const [hours, minutes] = selectedTime.split(':');
        const reservaDate = new Date(selectedDate);
        reservaDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        // Crear la reserva
        const reserva = {
            peluqueriaId: salonId,
            nombre: clientName,
            email: clientEmail,
            telefono: clientPhone,
            servicio: selectedService,
            fecha: reservaDate,
            estado: 'pendiente',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Guardar la reserva
        await db.collection('reservas').add(reserva);
        
        alert('¡Reserva realizada con éxito! Te contactaremos para confirmar tu cita.');
        bookingForm.reset();
        document.getElementById('selectedTime').value = '';
        
        // Regenerar los time slots
        const days = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
        const dayOfWeek = days[reservaDate.getDay()];
        const horario = salonData.horarios[dayOfWeek];
        await generateTimeSlots(horario);

    } catch (error) {
        console.error('Error al crear la reserva:', error);
        alert('Error al procesar la reserva. Por favor, intenta nuevamente.');
    } finally {
        const submitButton = e.target.querySelector('button[type="submit"]');
        submitButton.disabled = false;
        submitButton.textContent = 'Confirmar Reserva';
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
            const snapshot = await db.collection('reservas')
                .where('peluqueriaId', '==', salonId)
                .where('fecha', '>=', startDate)
                .where('fecha', '<=', endDate)
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
                if (fechaReserva >= startDate && 
                    fechaReserva <= endDate && 
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