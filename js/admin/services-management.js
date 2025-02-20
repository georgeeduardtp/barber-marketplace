// Funciones de gestión de servicios para el panel de administración

// Cargar servicios
async function loadServices(salonId) {
    const servicesList = document.getElementById('servicesList');
    
    try {
        showLoader();
        const doc = await db.collection('peluquerias').doc(salonId).get();
        const salon = doc.data();
        const servicios = salon.servicios || [];

        if (servicios.length === 0) {
            servicesList.innerHTML = '<p class="text-center">No hay servicios registrados</p>';
            return;
        }

        let html = '';
        servicios.forEach((servicio, index) => {
            html += `
                <div class="service-card">
                    <div class="service-info">
                        <h3>${servicio.nombre}</h3>
                        <p>${servicio.descripcion || ''}</p>
                        <div class="service-details">
                            <span class="price">€${servicio.precio}</span>
                            <span class="duration">${servicio.duracion} min</span>
                        </div>
                    </div>
                    <div class="service-actions">
                        <button onclick="editService(${index})" class="edit-btn">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button onclick="deleteService(${index})" class="delete-btn">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    </div>
                </div>
            `;
        });

        servicesList.innerHTML = html;
    } catch (error) {
        console.error('Error al cargar servicios:', error);
        showError('Error al cargar los servicios');
    } finally {
        hideLoader();
    }
}

// Añadir servicio
async function addService(salonId, serviceData) {
    try {
        showLoader();
        
        // Validar datos
        if (!validateServiceData(serviceData)) {
            throw new Error('Datos del servicio inválidos');
        }

        const doc = await db.collection('peluquerias').doc(salonId).get();
        const salon = doc.data();
        const servicios = salon.servicios || [];

        // Generar ID único para el servicio
        serviceData.id = Date.now().toString();
        
        // Añadir servicio
        servicios.push(serviceData);
        
        await db.collection('peluquerias').doc(salonId).update({
            servicios: servicios
        });

        showSuccess('Servicio añadido correctamente');
        loadServices(salonId);
    } catch (error) {
        console.error('Error al añadir servicio:', error);
        showError('Error al añadir el servicio');
    } finally {
        hideLoader();
    }
}

// Editar servicio
async function editService(salonId, index, serviceData) {
    try {
        showLoader();
        
        // Validar datos
        if (!validateServiceData(serviceData)) {
            throw new Error('Datos del servicio inválidos');
        }

        const doc = await db.collection('peluquerias').doc(salonId).get();
        const salon = doc.data();
        const servicios = salon.servicios || [];

        // Actualizar servicio
        servicios[index] = {
            ...servicios[index],
            ...serviceData
        };
        
        await db.collection('peluquerias').doc(salonId).update({
            servicios: servicios
        });

        showSuccess('Servicio actualizado correctamente');
        loadServices(salonId);
    } catch (error) {
        console.error('Error al editar servicio:', error);
        showError('Error al editar el servicio');
    } finally {
        hideLoader();
    }
}

// Eliminar servicio
async function deleteService(salonId, index) {
    if (!confirm('¿Estás seguro de que deseas eliminar este servicio?')) {
        return;
    }

    try {
        showLoader();
        
        const doc = await db.collection('peluquerias').doc(salonId).get();
        const salon = doc.data();
        const servicios = salon.servicios || [];

        // Eliminar servicio
        servicios.splice(index, 1);
        
        await db.collection('peluquerias').doc(salonId).update({
            servicios: servicios
        });

        showSuccess('Servicio eliminado correctamente');
        loadServices(salonId);
    } catch (error) {
        console.error('Error al eliminar servicio:', error);
        showError('Error al eliminar el servicio');
    } finally {
        hideLoader();
    }
}

// Validar datos del servicio
function validateServiceData(serviceData) {
    if (!serviceData.nombre || serviceData.nombre.trim().length < 3) {
        showError('El nombre debe tener al menos 3 caracteres');
        return false;
    }

    if (!serviceData.precio || isNaN(serviceData.precio) || serviceData.precio <= 0) {
        showError('El precio debe ser un número mayor que 0');
        return false;
    }

    if (!serviceData.duracion || isNaN(serviceData.duracion) || serviceData.duracion <= 0) {
        showError('La duración debe ser un número mayor que 0');
        return false;
    }

    return true;
}

// Mostrar modal de servicio
function showServiceModal(service = null) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>${service ? 'Editar' : 'Nuevo'} Servicio</h2>
                <button class="modal-close">&times;</button>
            </div>
            <form id="serviceForm" class="service-form">
                <div class="form-group">
                    <label for="serviceName">
                        <i class="fas fa-tag"></i> Nombre del Servicio
                    </label>
                    <input type="text" id="serviceName" value="${service?.nombre || ''}" required>
                </div>
                <div class="form-group">
                    <label for="serviceDescription">
                        <i class="fas fa-align-left"></i> Descripción
                    </label>
                    <textarea id="serviceDescription">${service?.descripcion || ''}</textarea>
                </div>
                <div class="form-group">
                    <label for="servicePrice">
                        <i class="fas fa-euro-sign"></i> Precio
                    </label>
                    <input type="number" id="servicePrice" value="${service?.precio || ''}" min="0" step="0.01" required>
                </div>
                <div class="form-group">
                    <label for="serviceDuration">
                        <i class="fas fa-clock"></i> Duración (minutos)
                    </label>
                    <input type="number" id="serviceDuration" value="${service?.duracion || ''}" min="0" required>
                </div>
                <button type="submit" class="primary-button">
                    <i class="fas fa-save"></i> Guardar
                </button>
            </form>
        </div>
    `;

    document.body.appendChild(modal);
    setupModalEvents(modal);
    setupServiceForm(modal, service);
}

// Configurar formulario de servicio
function setupServiceForm(modal, service) {
    const form = modal.querySelector('#serviceForm');
    form.onsubmit = async (e) => {
        e.preventDefault();
        
        const serviceData = {
            nombre: form.querySelector('#serviceName').value,
            descripcion: form.querySelector('#serviceDescription').value,
            precio: parseFloat(form.querySelector('#servicePrice').value),
            duracion: parseInt(form.querySelector('#serviceDuration').value)
        };

        try {
            if (service) {
                await editService(salonId, service.index, serviceData);
            } else {
                await addService(salonId, serviceData);
            }
            modal.remove();
        } catch (error) {
            console.error('Error al guardar servicio:', error);
        }
    };
}

// Exportar funciones al objeto window
window.loadServices = loadServices;
window.addService = addService;
window.editService = editService;
window.deleteService = deleteService;
window.showServiceModal = showServiceModal; 