// Funciones de utilidad para notificaciones

// Tipos de notificación
const NOTIFICATION_TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info'
};

// Función para mostrar una notificación
function showNotification(message, type = NOTIFICATION_TYPES.INFO) {
    // Crear el contenedor si no existe
    let container = document.querySelector('.notification-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'notification-container';
        document.body.appendChild(container);
    }

    // Crear la notificación
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // Añadir icono según el tipo
    const icon = getNotificationIcon(type);
    
    // Construir el HTML de la notificación
    notification.innerHTML = `
        <div class="notification-content">
            <i class="${icon}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;

    // Añadir la notificación al contenedor
    container.appendChild(notification);

    // Configurar el botón de cerrar
    const closeButton = notification.querySelector('.notification-close');
    closeButton.addEventListener('click', () => {
        hideNotification(notification);
    });

    // Auto-ocultar después del tiempo configurado
    setTimeout(() => {
        hideNotification(notification);
    }, NOTIFICATION_CONFIG.timeOut);

    // Animar entrada
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
}

// Función para ocultar una notificación
function hideNotification(notification) {
    notification.classList.remove('show');
    notification.classList.add('hide');
    
    setTimeout(() => {
        notification.remove();
        
        // Eliminar el contenedor si no hay más notificaciones
        const container = document.querySelector('.notification-container');
        if (container && !container.hasChildNodes()) {
            container.remove();
        }
    }, NOTIFICATION_CONFIG.hideDuration);
}

// Función para obtener el icono según el tipo
function getNotificationIcon(type) {
    switch (type) {
        case NOTIFICATION_TYPES.SUCCESS:
            return 'fas fa-check-circle';
        case NOTIFICATION_TYPES.ERROR:
            return 'fas fa-exclamation-circle';
        case NOTIFICATION_TYPES.WARNING:
            return 'fas fa-exclamation-triangle';
        case NOTIFICATION_TYPES.INFO:
        default:
            return 'fas fa-info-circle';
    }
}

// Funciones específicas para cada tipo de notificación
function showSuccess(message) {
    showNotification(message, NOTIFICATION_TYPES.SUCCESS);
}

function showError(message) {
    showNotification(message, NOTIFICATION_TYPES.ERROR);
}

function showWarning(message) {
    showNotification(message, NOTIFICATION_TYPES.WARNING);
}

function showInfo(message) {
    showNotification(message, NOTIFICATION_TYPES.INFO);
}

// Exportar funciones al objeto window
window.showNotification = showNotification;
window.showSuccess = showSuccess;
window.showError = showError;
window.showWarning = showWarning;
window.showInfo = showInfo; 