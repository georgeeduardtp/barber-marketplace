// Funciones de validación

// Validar email
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Validar teléfono (formato español)
function validatePhone(phone) {
    const re = /^(\+34|0034|34)?[6789]\d{8}$/;
    return re.test(phone.replace(/\s/g, ''));
}

// Validar nombre
function validateName(name) {
    return name.trim().length >= 3;
}

// Validar formulario de reserva
function validateBookingForm(formData) {
    const errors = [];

    if (!validateName(formData.clientName)) {
        errors.push('El nombre debe tener al menos 3 caracteres');
    }

    if (!validateEmail(formData.clientEmail)) {
        errors.push('El email no es válido');
    }

    if (!validatePhone(formData.clientPhone)) {
        errors.push('El teléfono no es válido');
    }

    if (!formData.selectedServiceId) {
        errors.push('Debes seleccionar un servicio');
    }

    if (!formData.selectedDate) {
        errors.push('Debes seleccionar una fecha');
    }

    if (!formData.selectedTime) {
        errors.push('Debes seleccionar una hora');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

// Exportar funciones al objeto window
window.validateEmail = validateEmail;
window.validatePhone = validatePhone;
window.validateName = validateName;
window.validateBookingForm = validateBookingForm; 