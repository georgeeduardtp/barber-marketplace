// Funciones de autenticación

// Función para iniciar sesión
async function login(email, password) {
    try {
        showLoader();
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Obtener datos adicionales del usuario
        const userDoc = await db.collection('users').doc(user.uid).get();
        const userData = userDoc.data();
        
        showSuccess('Inicio de sesión exitoso');
        updateUILoggedIn(user, userData);
        
        // Redirigir según el rol
        if (userData.role === APP_CONFIG.USER_ROLES.ADMIN) {
            window.location.href = 'admin/dashboard.html';
        } else if (userData.role === APP_CONFIG.USER_ROLES.SALON) {
            window.location.href = 'salon/dashboard.html';
        }
        
        hideLoader();
    } catch (error) {
        console.error('Error en login:', error);
        hideLoader();
        showError(getAuthErrorMessage(error.code));
    }
}

// Función para registrar un nuevo usuario
async function register(userData) {
    try {
        showLoader();
        
        // Crear usuario en Authentication
        const userCredential = await auth.createUserWithEmailAndPassword(
            userData.email, 
            userData.password
        );
        const user = userCredential.user;

        // Crear documento en la colección users
        await db.collection('users').doc(user.uid).set({
            name: userData.name,
            email: userData.email,
            role: userData.role || APP_CONFIG.USER_ROLES.CLIENT,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        showSuccess('Registro exitoso');
        
        // Si es una peluquería, crear documento adicional
        if (userData.role === APP_CONFIG.USER_ROLES.SALON) {
            await db.collection('peluquerias').add({
                userId: user.uid,
                nombre: userData.salonName,
                direccion: userData.address,
                ciudad: userData.city,
                telefono: userData.phone,
                email: userData.email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                servicios: [],
                horarios: {},
                fotos: []
            });
        }

        hideLoader();
        return user;
    } catch (error) {
        console.error('Error en registro:', error);
        hideLoader();
        showError(getAuthErrorMessage(error.code));
        throw error;
    }
}

// Función para cerrar sesión
async function logout() {
    try {
        showLoader();
        await auth.signOut();
        updateUILoggedOut();
        showSuccess('Sesión cerrada correctamente');
        hideLoader();
        
        // Redirigir a la página principal
        if (!window.location.pathname.includes('index.html')) {
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('Error en logout:', error);
        hideLoader();
        showError('Error al cerrar sesión');
    }
}

// Función para recuperar contraseña
async function resetPassword(email) {
    try {
        showLoader();
        await auth.sendPasswordResetEmail(email);
        showSuccess('Se ha enviado un correo para restablecer tu contraseña');
        hideLoader();
    } catch (error) {
        console.error('Error en reset password:', error);
        hideLoader();
        showError(getAuthErrorMessage(error.code));
    }
}

// Función para actualizar perfil
async function updateProfile(userId, userData) {
    try {
        showLoader();
        
        // Actualizar documento del usuario
        await db.collection('users').doc(userId).update({
            name: userData.name,
            phone: userData.phone,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Si es una peluquería, actualizar ese documento también
        if (userData.role === APP_CONFIG.USER_ROLES.SALON) {
            const salonDoc = await db.collection('peluquerias')
                .where('userId', '==', userId)
                .get();
            
            if (!salonDoc.empty) {
                await salonDoc.docs[0].ref.update({
                    nombre: userData.salonName,
                    direccion: userData.address,
                    ciudad: userData.city,
                    telefono: userData.phone,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        }

        showSuccess('Perfil actualizado correctamente');
        hideLoader();
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        hideLoader();
        showError('Error al actualizar el perfil');
    }
}

// Función para obtener mensaje de error
function getAuthErrorMessage(errorCode) {
    switch (errorCode) {
        case 'auth/invalid-email':
            return ERROR_MESSAGES.AUTH.INVALID_EMAIL;
        case 'auth/user-disabled':
            return ERROR_MESSAGES.AUTH.USER_DISABLED;
        case 'auth/user-not-found':
            return ERROR_MESSAGES.AUTH.USER_NOT_FOUND;
        case 'auth/wrong-password':
            return ERROR_MESSAGES.AUTH.WRONG_PASSWORD;
        case 'auth/email-already-in-use':
            return ERROR_MESSAGES.AUTH.EMAIL_IN_USE;
        case 'auth/weak-password':
            return ERROR_MESSAGES.AUTH.WEAK_PASSWORD;
        default:
            return 'Error de autenticación';
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const registerBtn = document.getElementById('registerBtn');
    
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            // Mostrar modal de login
            showLoginModal();
        });
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    if (registerBtn) {
        registerBtn.addEventListener('click', () => {
            // Mostrar modal de registro
            showRegisterModal();
        });
    }
});

// Exportar funciones al objeto window
window.login = login;
window.register = register;
window.logout = logout;
window.resetPassword = resetPassword;
window.updateProfile = updateProfile; 