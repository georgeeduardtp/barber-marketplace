// Configuraciones globales

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyB9Ppy7xeryBGhkkiN8G5ltiDf05b_9en8",
    authDomain: "marketplace-peluquerias.firebaseapp.com",
    projectId: "marketplace-peluquerias",
    storageBucket: "marketplace-peluquerias.firebasestorage.app",
    messagingSenderId: "188335836610",
    appId: "1:188335836610:web:0e5bcb308b67c5d4ba9a5b",
    measurementId: "G-W0EMJ3PS8F"
  };

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();

// Constantes de la aplicación
const APP_CONFIG = {
    // Límites y paginación
    ITEMS_PER_PAGE: 10,
    MAX_IMAGES_PER_SALON: 5,
    MAX_FILE_SIZE_MB: 5,
    
    // Formatos de fecha y hora
    DATE_FORMAT: 'DD/MM/YYYY',
    TIME_FORMAT: 'HH:mm',
    
    // Rutas de imágenes
    DEFAULT_SALON_IMAGE: 'img/default-salon.jpg',
    DEFAULT_PROFILE_IMAGE: 'img/default-profile.jpg',
    
    // Estados de reserva
    BOOKING_STATUS: {
        PENDING: 'pendiente',
        CONFIRMED: 'confirmada',
        CANCELLED: 'cancelada',
        COMPLETED: 'completada'
    },
    
    // Roles de usuario
    USER_ROLES: {
        ADMIN: 'admin',
        SALON: 'salon',
        CLIENT: 'client'
    }
};

// Mensajes de error
const ERROR_MESSAGES = {
    AUTH: {
        INVALID_EMAIL: 'El correo electrónico no es válido',
        WEAK_PASSWORD: 'La contraseña debe tener al menos 6 caracteres',
        EMAIL_IN_USE: 'Este correo electrónico ya está registrado',
        WRONG_PASSWORD: 'Contraseña incorrecta',
        USER_NOT_FOUND: 'Usuario no encontrado'
    },
    BOOKING: {
        TIME_NOT_AVAILABLE: 'Este horario no está disponible',
        PAST_DATE: 'No se pueden hacer reservas en fechas pasadas',
        INVALID_SERVICE: 'El servicio seleccionado no es válido'
    },
    UPLOAD: {
        FILE_TOO_LARGE: 'El archivo es demasiado grande',
        INVALID_TYPE: 'Tipo de archivo no válido',
        UPLOAD_FAILED: 'Error al subir el archivo'
    }
};

// Configuración de notificaciones
const NOTIFICATION_CONFIG = {
    position: 'top-right',
    showDuration: 3000,
    hideDuration: 1000,
    timeOut: 5000
};

// Exportar configuraciones al objeto window
window.APP_CONFIG = APP_CONFIG;
window.ERROR_MESSAGES = ERROR_MESSAGES;
window.NOTIFICATION_CONFIG = NOTIFICATION_CONFIG;
window.db = db;
window.auth = auth;
window.storage = storage; 