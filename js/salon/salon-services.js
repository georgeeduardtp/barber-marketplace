// Funciones de gestión de servicios
function loadServices(services) {
    if (!servicesList) return;
    
    if (services.length === 0) {
        servicesList.innerHTML = '<p>No hay servicios disponibles</p>';
        return;
    }
    
    let html = '';
    services.forEach(service => {
        html += `
            <div class="service-item">
                <div class="service-info">
                    <h3>${service.nombre}</h3>
                    <p>${service.descripcion || ''}</p>
                </div>
                <div class="service-price">
                    <span>${service.precio}€</span>
                    <span class="service-duration">${service.duracion} min</span>
                </div>
            </div>
        `;
    });
    
    servicesList.innerHTML = html;
}

async function addService(serviceData) {
    try {
        const salonDoc = await db.collection('peluquerias').doc(salonId).get();
        const salon = salonDoc.data();
        const servicios = salon.servicios || [];
        
        servicios.push(serviceData);
        
        await db.collection('peluquerias').doc(salonId).update({
            servicios: servicios
        });
        
        loadServices(servicios);
        alert('Servicio añadido exitosamente');
    } catch (error) {
        console.error('Error al añadir servicio:', error);
        alert('Error al añadir el servicio');
    }
}

async function deleteService(index) {
    try {
        const salonDoc = await db.collection('peluquerias').doc(salonId).get();
        const salon = salonDoc.data();
        const servicios = salon.servicios || [];
        
        servicios.splice(index, 1);
        
        await db.collection('peluquerias').doc(salonId).update({
            servicios: servicios
        });
        
        loadServices(servicios);
        alert('Servicio eliminado exitosamente');
    } catch (error) {
        console.error('Error al eliminar servicio:', error);
        alert('Error al eliminar el servicio');
    }
}

function populateServiceSelect(services) {
    if (!serviceSelect) return;
    
    let html = '<option value="">Selecciona un servicio</option>';
    services.forEach((service, index) => {
        html += `<option value="${index}">${service.nombre} - ${service.precio}€</option>`;
    });
    
    serviceSelect.innerHTML = html;
} 