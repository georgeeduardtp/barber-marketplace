// Funciones de utilidad para la interfaz de usuario

// Funciones para el loader
function showLoader() {
    document.querySelector('.loader-container').classList.add('active');
}

function hideLoader() {
    document.querySelector('.loader-container').classList.remove('active');
}

// Función para manejar el scroll del header
function handleHeaderScroll(header) {
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
}

// Función para mostrar mensajes de error
function showError(message, container) {
    container.innerHTML = `
        <div class="error-message">
            <h2>Error</h2>
            <p>${message}</p>
            <a href="index.html" class="back-button">Volver al inicio</a>
        </div>
    `;
}

// Función para generar estrellas de valoración
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

// Función para hacer scroll suave a un elemento
function smoothScrollTo(element) {
    element.scrollIntoView({ behavior: 'smooth' });
}

// Exportar funciones al objeto window
window.showLoader = showLoader;
window.hideLoader = hideLoader;
window.handleHeaderScroll = handleHeaderScroll;
window.showError = showError;
window.generateStars = generateStars;
window.smoothScrollTo = smoothScrollTo; 