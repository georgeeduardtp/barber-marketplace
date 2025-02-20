// Funciones de gestión de reservas

// Función para verificar las reservas existentes
async function getReservasDelDia(peluqueriaId, fecha) {
    try {
        const { startOfDay, endOfDay } = getDayBoundaries(fecha);

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
                    hora: formatTime(fecha.getHours(), fecha.getMinutes()),
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
                        hora: formatTime(fecha.getHours(), fecha.getMinutes()),
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

        let currentHour = startHour;
        let currentMinute = startMinute;
        const timeSlots = [];

        // Crear slots de tiempo cada 30 minutos
        while (currentHour < endHour || (currentHour === endHour && currentMinute <= endMinute)) {
            const timeString = formatTime(currentHour, currentMinute);
            const isDisponible = isHorarioDisponible(timeString, reservasDelDia, duracionServicio);
            
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

// Función para verificar si ya existe una reserva exacta
async function existeReservaExacta(peluqueriaId, fecha, hora) {
    try {
        const reservaDate = createDateWithTime(fecha, hora);
        const endDate = new Date(reservaDate);
        endDate.setMinutes(endDate.getMinutes() + 30);

        console.log('Buscando reservas entre:', reservaDate, 'y', endDate);

        const snapshot = await db.collection('reservas')
            .where('peluqueriaId', '==', peluqueriaId)
            .where('fecha', '>=', reservaDate)
            .where('fecha', '<', endDate)
            .where('estado', 'in', ['pendiente', 'confirmada'])
            .get();

        return !snapshot.empty;
    } catch (error) {
        console.error('Error al verificar reserva existente:', error);
        throw error;
    }
}

// Función para crear una reserva
async function createBooking(formData) {
    try {
        // Crear la fecha de la reserva
        const reservaDate = createDateWithTime(formData.selectedDate, formData.selectedTime);

        // Crear la reserva
        const reserva = {
            peluqueriaId: salonId,
            nombre: formData.clientName,
            email: formData.clientEmail,
            telefono: formData.clientPhone,
            servicio: formData.selectedService,
            fecha: reservaDate,
            estado: 'pendiente',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Guardar la reserva
        await db.collection('reservas').add(reserva);
        return true;
    } catch (error) {
        console.error('Error al crear la reserva:', error);
        throw error;
    }
}

// Configurar el formulario de reserva
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

    // Configurar el manejador del formulario
    setupBookingFormHandlers();
}

// Configurar los manejadores del formulario
function setupBookingFormHandlers() {
    if (!bookingForm) return;

    bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            selectedTime: document.getElementById('selectedTime').value,
            selectedDate: dateSelect.value,
            clientName: document.getElementById('clientName').value,
            clientEmail: document.getElementById('clientEmail').value,
            clientPhone: document.getElementById('clientPhone').value,
            selectedServiceId: document.getElementById('serviceSelect').value
        };

        // Validar el formulario
        const validation = validateBookingForm(formData);
        if (!validation.isValid) {
            alert(validation.errors.join('\n'));
            return;
        }

        try {
            showLoader();
            const submitButton = e.target.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.textContent = 'Verificando disponibilidad...';

            // Verificar si ya existe una reserva para esta hora
            const reservaExistente = await existeReservaExacta(salonId, formData.selectedDate, formData.selectedTime);
            
            if (reservaExistente) {
                alert('Este horario ya está reservado. Por favor, selecciona otro horario.');
                submitButton.disabled = false;
                submitButton.textContent = 'Confirmar Reserva';
                
                // Regenerar los slots de tiempo
                const selectedDate = new Date(formData.selectedDate);
                const dayOfWeek = getDayOfWeek(selectedDate);
                
                const salonDoc = await db.collection('peluquerias').doc(salonId).get();
                const salonData = salonDoc.data();
                const horario = salonData.horarios[dayOfWeek];
                
                await generateTimeSlots(horario);
                return;
            }

            // Obtener los datos del servicio
            const salonDoc = await db.collection('peluquerias').doc(salonId).get();
            const salonData = salonDoc.data();
            const selectedService = salonData.servicios.find(s => s.id === formData.selectedServiceId);

            if (!selectedService) {
                throw new Error('Servicio no encontrado');
            }

            // Crear la reserva con el servicio
            const bookingData = {
                ...formData,
                selectedService
            };

            await createBooking(bookingData);
            
            alert('¡Reserva realizada con éxito! Te contactaremos para confirmar tu cita.');
            bookingForm.reset();
            document.getElementById('selectedTime').value = '';
            
            // Regenerar los time slots
            const dayOfWeek = getDayOfWeek(new Date(formData.selectedDate));
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

// Exportar funciones al objeto window
window.getReservasDelDia = getReservasDelDia;
window.isHorarioDisponible = isHorarioDisponible;
window.generateTimeSlots = generateTimeSlots;
window.existeReservaExacta = existeReservaExacta;
window.createBooking = createBooking;
window.setupBookingForm = setupBookingForm; 