// Funciones para mostrar y editar los detalles del salón

// Función para cargar los detalles del salón
async function loadSalonDetails() {
    try {
        showLoader();
        
        const doc = await db.collection('peluquerias').doc(salonId).get();
        if (!doc.exists) {
            throw new Error('Salón no encontrado');
        }

        const salon = doc.data();
        
        // Actualizar información básica
        updateBasicInfo(salon);
        
        // Cargar imágenes
        await loadImages(salonId);
        
        // Cargar servicios
        await loadServices(salonId);
        
        // Cargar horarios
        await loadSchedule(salonId);
        
        // Cargar reseñas
        await loadReviews(salonId);
        
        // Configurar formulario de reserva
        setupBookingForm(salon.servicios, salon.horarios);
        
        hideLoader();
    } catch (error) {
        console.error('Error al cargar los detalles del salón:', error);
        hideLoader();
        showError('Error al cargar los detalles del salón');
    }
}

// Función para actualizar la información básica
function updateBasicInfo(salon) {
    // Actualizar título y meta tags
    document.title = `${salon.nombre} - Marketplace Peluquerías`;
    updateMetaTags(salon);
    
    // Actualizar header
    const header = document.querySelector('.salon-header');
    if (header) {
        header.innerHTML = `
            <h1>${salon.nombre}</h1>
            <div class="salon-rating">
                ${generateStars(salon.valoracion || 0)}
                <span>(${salon.numValoraciones || 0} valoraciones)</span>
            </div>
            <div class="salon-location">
                <i class="fas fa-map-marker-alt"></i>
                <span>${salon.direccion}, ${salon.ciudad}</span>
            </div>
        `;
    }

    // Actualizar descripción
    const description = document.querySelector('.salon-description');
    if (description) {
        description.innerHTML = `
            <h2>Sobre Nosotros</h2>
            <p>${salon.descripcion || 'Sin descripción disponible'}</p>
        `;
    }

    // Actualizar información de contacto
    const contact = document.querySelector('.salon-contact');
    if (contact) {
        contact.innerHTML = `
            <h2>Contacto</h2>
            <div class="contact-info">
                <p><i class="fas fa-phone"></i> ${salon.telefono}</p>
                <p><i class="fas fa-envelope"></i> ${salon.email}</p>
                ${salon.whatsapp ? `
                    <a href="https://wa.me/${salon.whatsapp}" class="whatsapp-button" target="_blank">
                        <i class="fab fa-whatsapp"></i> Contactar por WhatsApp
                    </a>
                ` : ''}
            </div>
        `;
    }
}

// Función para actualizar meta tags
function updateMetaTags(salon) {
    // Meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.name = 'description';
        document.head.appendChild(metaDescription);
    }
    metaDescription.content = `${salon.nombre} - ${salon.descripcion || 'Peluquería en ' + salon.ciudad}`;

    // Open Graph
    updateOpenGraphTags({
        title: salon.nombre,
        description: salon.descripcion || `Peluquería en ${salon.ciudad}`,
        image: salon.fotos?.[0] || APP_CONFIG.DEFAULT_SALON_IMAGE,
        url: window.location.href
    });
}

// Función para actualizar Open Graph tags
function updateOpenGraphTags({ title, description, image, url }) {
    const tags = {
        'og:title': title,
        'og:description': description,
        'og:image': image,
        'og:url': url,
        'og:type': 'website'
    };

    Object.entries(tags).forEach(([property, content]) => {
        let meta = document.querySelector(`meta[property="${property}"]`);
        if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute('property', property);
            document.head.appendChild(meta);
        }
        meta.content = content;
    });
}

// Función para editar los detalles del salón
async function editSalonDetails(formData) {
    try {
        showLoader();

        // Validar datos
        if (!validateSalonDetails(formData)) {
            throw new Error('Datos inválidos');
        }

        // Actualizar documento
        await db.collection('peluquerias').doc(salonId).update({
            nombre: formData.nombre,
            descripcion: formData.descripcion,
            direccion: formData.direccion,
            ciudad: formData.ciudad,
            telefono: formData.telefono,
            email: formData.email,
            whatsapp: formData.whatsapp,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Recargar detalles
        await loadSalonDetails();
        
        hideLoader();
        alert('Detalles actualizados correctamente');
    } catch (error) {
        console.error('Error al actualizar los detalles:', error);
        hideLoader();
        alert('Error al actualizar los detalles');
    }
}

// Función para validar los detalles del salón
function validateSalonDetails(formData) {
    // Validar nombre
    if (!formData.nombre || formData.nombre.trim().length < 3) {
        alert('El nombre debe tener al menos 3 caracteres');
        return false;
    }

    // Validar email
    if (!validateEmail(formData.email)) {
        alert('El email no es válido');
        return false;
    }

    // Validar teléfono
    if (!validatePhone(formData.telefono)) {
        alert('El teléfono no es válido');
        return false;
    }

    // Validar dirección
    if (!formData.direccion || formData.direccion.trim().length < 5) {
        alert('La dirección debe tener al menos 5 caracteres');
        return false;
    }

    // Validar ciudad
    if (!formData.ciudad || formData.ciudad.trim().length < 3) {
        alert('La ciudad debe tener al menos 3 caracteres');
        return false;
    }

    return true;
}

// Función para habilitar la edición de detalles
function enableEditing() {
    const fields = document.querySelectorAll('.salon-details [data-editable]');
    fields.forEach(field => {
        const currentValue = field.textContent;
        const input = document.createElement('input');
        input.type = field.dataset.type || 'text';
        input.value = currentValue;
        input.className = 'edit-input';
        field.parentNode.replaceChild(input, field);
    });

    // Mostrar botones de guardar y cancelar
    const actionButtons = document.createElement('div');
    actionButtons.className = 'edit-actions';
    actionButtons.innerHTML = `
        <button onclick="saveSalonDetails()" class="save-button">
            <i class="fas fa-save"></i> Guardar
        </button>
        <button onclick="cancelEditing()" class="cancel-button">
            <i class="fas fa-times"></i> Cancelar
        </button>
    `;
    document.querySelector('.salon-details').appendChild(actionButtons);
}

// Función para guardar los cambios
async function saveSalonDetails() {
    const formData = {
        nombre: document.querySelector('[data-editable="nombre"] input').value,
        descripcion: document.querySelector('[data-editable="descripcion"] input').value,
        direccion: document.querySelector('[data-editable="direccion"] input').value,
        ciudad: document.querySelector('[data-editable="ciudad"] input').value,
        telefono: document.querySelector('[data-editable="telefono"] input').value,
        email: document.querySelector('[data-editable="email"] input').value,
        whatsapp: document.querySelector('[data-editable="whatsapp"] input')?.value
    };

    await editSalonDetails(formData);
    disableEditing();
}

// Función para cancelar la edición
function cancelEditing() {
    loadSalonDetails();
    disableEditing();
}

// Función para deshabilitar la edición
function disableEditing() {
    document.querySelector('.edit-actions')?.remove();
    loadSalonDetails();
}

// Exportar funciones al objeto window
window.loadSalonDetails = loadSalonDetails;
window.editSalonDetails = editSalonDetails;
window.enableEditing = enableEditing;
window.saveSalonDetails = saveSalonDetails;
window.cancelEditing = cancelEditing; 