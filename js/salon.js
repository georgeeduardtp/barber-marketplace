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

// Funciones para el loader
function showLoader() {
    document.querySelector('.loader-container').classList.add('active');
}

function hideLoader() {
    document.querySelector('.loader-container').classList.remove('active');
}

// Cargar datos de la peluquería
async function loadSalonDetails() {
    try {
        showLoader();
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
    } finally {
        hideLoader();
    }
}

// Función para manejar la subida de imágenes
async function handleImageUpload(event) {
    try {
        // Verificar si el usuario es administrador
        const user = auth.currentUser;
        if (!user) {
            alert('Debes iniciar sesión como administrador para subir imágenes');
            return;
        }

        const userDoc = await db.collection('users').doc(user.uid).get();
        const userData = userDoc.data();
        
        if (!userData || userData.role !== 'admin') {
            alert('Solo los administradores pueden subir imágenes');
            return;
        }

        const file = event.target.files[0];
        const base64Image = await convertImageToBase64(file);
        
        // Obtener las fotos actuales
        const salonDoc = await db.collection('peluquerias').doc(salonId).get();
        const salonData = salonDoc.data();
        const fotosActuales = salonData.fotos || [];
        
        // Agregar la nueva foto
        await db.collection('peluquerias').doc(salonId).update({
            fotos: [...fotosActuales, base64Image]
        });
        
        // Recargar las imágenes
        loadImages([...fotosActuales, base64Image]);
        
        alert('Imagen subida exitosamente');
    } catch (error) {
        console.error('Error al subir la imagen:', error);
        alert(error.toString());
    }
}

// Función para convertir imagen a Base64
function convertImageToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// Cargar imágenes de la peluquería
async function loadImages(fotos) {
    const carouselTrack = document.querySelector('.carousel-track');
    const carouselThumbnails = document.querySelector('.carousel-thumbnails');
    const imageUploadContainer = document.querySelector('.image-upload-container');
    
    // Verificar si el usuario es administrador
    const user = auth.currentUser;
    if (user) {
        const userDoc = await db.collection('users').doc(user.uid).get();
        const userData = userDoc.data();
        
        // Mostrar u ocultar el contenedor de subida según el rol
        if (userData && userData.role === 'admin') {
            imageUploadContainer.style.display = 'block';
        } else {
            imageUploadContainer.style.display = 'none';
        }
    } else {
        imageUploadContainer.style.display = 'none';
    }
    
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

function changeSlide(direction) {
    const slides = document.querySelectorAll('.carousel-track img');
    const thumbnails = document.querySelectorAll('.carousel-thumbnails img');
    
    if (slides.length <= 1) return;

    if (direction === 'prev') {
        window.currentSlide = (window.currentSlide - 1 + slides.length) % slides.length;
    } else if (direction === 'next') {
        window.currentSlide = (window.currentSlide + 1) % slides.length;
    } else if (typeof direction === 'number') {
        window.currentSlide = direction;
    }

    // Actualizar imágenes principales
    slides.forEach(slide => slide.classList.remove('active'));
    slides[window.currentSlide].classList.add('active');

    // Actualizar miniaturas
    thumbnails.forEach(thumb => thumb.classList.remove('active'));
    thumbnails[window.currentSlide].classList.add('active');
    
    // Scroll suave a la miniatura activa
    thumbnails[window.currentSlide].scrollIntoView({
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
        const dayOfWeek = getDayOfWeek(selectedDate);
        const horario = horarios[dayOfWeek];
        generateTimeSlots(horario);
    });

    // Event listener para cuando se cambia el servicio
    serviceSelect.addEventListener('change', () => {
        if (dateSelect.value) {
            const selectedDate = new Date(dateSelect.value);
            const dayOfWeek = getDayOfWeek(selectedDate);
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

// Configurar el formulario de reserva
function setupBookingFormHandlers() {
    if (!bookingForm) return;

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
            showLoader();
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
                const dayOfWeek = getDayOfWeek(selectedDateObj);
                
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

            // Crear la reserva
            const formData = {
                selectedTime,
                selectedDate,
                clientName,
                clientEmail,
                clientPhone,
                selectedService
            };

            await createBooking(formData);
            
            alert('¡Reserva realizada con éxito! Te contactaremos para confirmar tu cita.');
            bookingForm.reset();
            document.getElementById('selectedTime').value = '';
            
            // Regenerar los time slots
            const dayOfWeek = getDayOfWeek(new Date(selectedDate));
            const horario = salonData.horarios[dayOfWeek];
            await generateTimeSlots(horario);

        } catch (error) {
            console.error('Error al crear la reserva:', error);
            alert('Error al procesar la reserva. Por favor, intenta nuevamente.');
        } finally {
            hideLoader();
            const submitButton = e.target.querySelector('button[type="submit"]');
            submitButton.disabled = false;
            submitButton.textContent = 'Confirmar Reserva';
        }
    });
}

// Función para seleccionar un servicio
function selectService(servicioId) {
    serviceSelect.value = servicioId;
    smoothScrollTo(bookingForm);
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

// Función para inicializar el carrusel
function initCarousel() {
    const carouselTrack = document.querySelector('.carousel-track');
    const carouselThumbnails = document.querySelector('.carousel-thumbnails');
    
    if (!carouselTrack || !carouselThumbnails) return;

    // Configurar botones de navegación
    const prevButton = document.querySelector('.carousel-button.prev');
    const nextButton = document.querySelector('.carousel-button.next');
    
    if (prevButton) {
        prevButton.onclick = () => changeSlide('prev');
    }
    if (nextButton) {
        nextButton.onclick = () => changeSlide('next');
    }

    // Configurar gestos táctiles
    let touchStartX = 0;
    let touchEndX = 0;

    carouselTrack.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    }, false);

    carouselTrack.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        const diff = touchStartX - touchEndX;
        
        if (Math.abs(diff) > 50) { // umbral de 50px
            if (diff > 0) {
                changeSlide('next');
            } else {
                changeSlide('prev');
            }
        }
    }, false);
}

// Función para crear una reserva
async function createBooking(formData) {
    try {
        const {
            selectedTime,
            selectedDate,
            clientName,
            clientEmail,
            clientPhone,
            selectedService
        } = formData;

        // Crear objeto de fecha para la reserva
        const [hours, minutes] = selectedTime.split(':');
        const reservaDate = new Date(selectedDate);
        reservaDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        // Crear la reserva en Firestore
        const reservaData = {
            peluqueriaId: salonId,
            fecha: reservaDate,
            cliente: {
                nombre: clientName,
                email: clientEmail,
                telefono: clientPhone
            },
            servicio: {
                id: selectedService.id,
                nombre: selectedService.nombre,
                precio: selectedService.precio,
                duracion: selectedService.duracion
            },
            estado: 'pendiente',
            fechaCreacion: new Date()
        };

        console.log('Creando reserva con datos:', reservaData);
        const docRef = await db.collection('reservas').add(reservaData);
        console.log('Reserva creada con ID:', docRef.id);
        
        return docRef.id;
    } catch (error) {
        console.error('Error al crear la reserva:', error);
        throw new Error('No se pudo crear la reserva. Por favor, intenta nuevamente.');
    }
}

// Exportar funciones al objeto window
window.handleImageUpload = handleImageUpload;
window.deleteImage = deleteImage;
window.loadImages = loadImages;
window.convertImageToBase64 = convertImageToBase64;
window.initCarousel = initCarousel;
window.loadServices = loadServices;
window.addService = addService;
window.deleteService = deleteService;
window.populateServiceSelect = populateServiceSelect;
window.loadSchedule = loadSchedule;
window.populateTimeSelect = populateTimeSelect;
window.updateSchedule = updateSchedule;
window.loadReviews = loadReviews;
window.addReview = addReview;
window.deleteReview = deleteReview;
window.loadSalonDetails = loadSalonDetails;
window.setupBookingForm = setupBookingForm;
window.createBooking = createBooking;
window.setupBookingFormHandlers = setupBookingFormHandlers;

// Inicializar la página
document.addEventListener('DOMContentLoaded', () => {
    if (!salonId) {
        window.location.href = 'index.html';
        return;
    }
    loadSalonDetails();
    initCarousel();
    setupBookingFormHandlers();
}); 