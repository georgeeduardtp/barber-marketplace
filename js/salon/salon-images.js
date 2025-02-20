// Funciones para el manejo de imágenes del salón

// Variables para el carrusel
window.currentSlide = 0;
let slides = [];

// Función para cargar las imágenes del salón
async function loadImages(salonId) {
    try {
        const doc = await db.collection('peluquerias').doc(salonId).get();
        if (!doc.exists) {
            throw new Error('Salón no encontrado');
        }

        const salon = doc.data();
        slides = salon.fotos || [];

        if (slides.length === 0) {
            slides = [APP_CONFIG.DEFAULT_SALON_IMAGE];
        }

        updateCarousel();
        setupCarouselControls();
    } catch (error) {
        console.error('Error al cargar las imágenes:', error);
        showError('Error al cargar las imágenes del salón');
    }
}

// Función para actualizar el carrusel
function updateCarousel() {
    const carousel = document.querySelector('.carousel');
    if (!carousel) return;

    const mainImage = carousel.querySelector('.main-image img');
    const thumbnails = carousel.querySelector('.thumbnails');

    // Actualizar imagen principal
    mainImage.src = slides[currentSlide];
    mainImage.alt = `Imagen ${currentSlide + 1} del salón`;

    // Actualizar miniaturas
    thumbnails.innerHTML = slides.map((slide, index) => `
        <div class="thumbnail ${index === currentSlide ? 'active' : ''}" 
             onclick="selectSlide(${index})">
            <img src="${slide}" alt="Miniatura ${index + 1}">
        </div>
    `).join('');

    // Actualizar botones de navegación
    updateNavigationButtons();
}

// Función para configurar los controles del carrusel
function setupCarouselControls() {
    const prevButton = document.querySelector('.carousel-control.prev');
    const nextButton = document.querySelector('.carousel-control.next');

    if (prevButton) {
        prevButton.onclick = () => changeSlide(-1);
    }
    if (nextButton) {
        nextButton.onclick = () => changeSlide(1);
    }

    // Habilitar gestos táctiles
    setupTouchControls();
}

// Función para cambiar de diapositiva
function changeSlide(direction) {
    currentSlide = (currentSlide + direction + slides.length) % slides.length;
    updateCarousel();
}

// Función para seleccionar una diapositiva específica
function selectSlide(index) {
    if (index >= 0 && index < slides.length) {
        currentSlide = index;
        updateCarousel();
    }
}

// Función para actualizar los botones de navegación
function updateNavigationButtons() {
    const prevButton = document.querySelector('.carousel-control.prev');
    const nextButton = document.querySelector('.carousel-control.next');

    if (prevButton) {
        prevButton.style.display = slides.length > 1 ? 'block' : 'none';
    }
    if (nextButton) {
        nextButton.style.display = slides.length > 1 ? 'block' : 'none';
    }
}

// Función para configurar controles táctiles
function setupTouchControls() {
    const carousel = document.querySelector('.carousel');
    let touchStartX = 0;
    let touchEndX = 0;

    carousel.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    }, false);

    carousel.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, false);

    function handleSwipe() {
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;

        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                // Swipe izquierda
                changeSlide(1);
            } else {
                // Swipe derecha
                changeSlide(-1);
            }
        }
    }
}

// Función para subir una nueva imagen
async function handleImageUpload(event, salonId) {
    const file = event.target.files[0];
    if (!file) return;

    // Validar el archivo
    if (!validateImage(file)) return;

    try {
        showLoader();
        
        // Subir imagen a Storage
        const imageUrl = await uploadImage(file, salonId);
        
        // Actualizar documento del salón
        await updateSalonImages(salonId, imageUrl);
        
        // Recargar imágenes
        await loadImages(salonId);
        
        hideLoader();
    } catch (error) {
        console.error('Error al subir la imagen:', error);
        hideLoader();
        alert(ERROR_MESSAGES.UPLOAD.UPLOAD_FAILED);
    }
}

// Función para validar una imagen
function validateImage(file) {
    // Validar tamaño
    if (file.size > APP_CONFIG.MAX_FILE_SIZE_MB * 1024 * 1024) {
        alert(ERROR_MESSAGES.UPLOAD.FILE_TOO_LARGE);
        return false;
    }

    // Validar tipo
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        alert(ERROR_MESSAGES.UPLOAD.INVALID_TYPE);
        return false;
    }

    return true;
}

// Función para subir una imagen a Storage
async function uploadImage(file, salonId) {
    const extension = file.name.split('.').pop();
    const fileName = `${salonId}_${Date.now()}.${extension}`;
    const storageRef = storage.ref(`salones/${salonId}/${fileName}`);
    
    await storageRef.put(file);
    return await storageRef.getDownloadURL();
}

// Función para actualizar las imágenes del salón
async function updateSalonImages(salonId, newImageUrl) {
    const doc = await db.collection('peluquerias').doc(salonId).get();
    const salon = doc.data();
    const fotos = salon.fotos || [];

    // Verificar límite de imágenes
    if (fotos.length >= APP_CONFIG.MAX_IMAGES_PER_SALON) {
        throw new Error('Se ha alcanzado el límite de imágenes');
    }

    // Añadir nueva imagen
    fotos.push(newImageUrl);
    
    await db.collection('peluquerias').doc(salonId).update({ fotos });
}

// Función para eliminar una imagen
async function deleteImage(salonId, imageUrl) {
    try {
        showLoader();

        // Eliminar de Storage
        const fileName = imageUrl.split('/').pop().split('?')[0];
        const storageRef = storage.ref(`salones/${salonId}/${fileName}`);
        await storageRef.delete();

        // Actualizar documento
        const doc = await db.collection('peluquerias').doc(salonId).get();
        const salon = doc.data();
        const fotos = salon.fotos.filter(foto => foto !== imageUrl);
        
        await db.collection('peluquerias').doc(salonId).update({ fotos });
        
        // Recargar imágenes
        await loadImages(salonId);
        
        hideLoader();
    } catch (error) {
        console.error('Error al eliminar la imagen:', error);
        hideLoader();
        alert('Error al eliminar la imagen');
    }
}

// Exportar funciones al objeto window
window.loadImages = loadImages;
window.changeSlide = changeSlide;
window.selectSlide = selectSlide;
window.handleImageUpload = handleImageUpload;
window.deleteImage = deleteImage; 