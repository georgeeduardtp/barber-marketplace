// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyB9Ppy7xeryBGhkkiN8G5ltiDf05b_9en8",
    authDomain: "marketplace-peluquerias.firebaseapp.com",
    projectId: "marketplace-peluquerias",
    storageBucket: "marketplace-peluquerias.appspot.com",
    messagingSenderId: "188335836610",
    appId: "1:188335836610:web:0e5bcb308b67c5d4ba9a5b",
    measurementId: "G-W0EMJ3PS8F"
};

// Inicializar Firebase
let app;
try {
    if (!firebase.apps.length) {
        app = firebase.initializeApp(firebaseConfig);
        console.log('Firebase inicializado correctamente');
    } else {
        app = firebase.app();
        console.log('Firebase ya estaba inicializado');
    }
} catch (error) {
    console.error('Error al inicializar Firebase:', error);
}

// Referencias a servicios de Firebase
const auth = firebase.auth();
const db = firebase.firestore();
let storage;
try {
    storage = firebase.storage();
    console.log('Firebase Storage inicializado correctamente');
} catch (error) {
    console.error('Error al inicializar Firebase Storage:', error);
}

// Configuración de Firestore
db.settings({
    merge: true
});

// Función para convertir imagen a Base64
function convertImageToBase64(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject('No se proporcionó ningún archivo');
            return;
        }

        // Verificar que sea una imagen
        if (!file.type.match('image.*')) {
            reject('El archivo seleccionado no es una imagen');
            return;
        }

        // Verificar tamaño (máximo 1MB)
        if (file.size > 1024 * 1024) {
            reject('La imagen es demasiado grande. El tamaño máximo es 1MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject('Error al leer el archivo');
        reader.readAsDataURL(file);
    });
}

// Verificar estado de autenticación
auth.onAuthStateChanged((user) => {
    if (user) {
        console.log('Usuario autenticado:', user.email);
    } else {
        console.log('Usuario no autenticado');
    }
}); 