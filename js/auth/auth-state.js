// Estado de autenticación y manejo de sesión
document.addEventListener('DOMContentLoaded', () => {
    // Verificar autenticación
    auth.onAuthStateChanged(async user => {
        // Determinar si estamos en una página de administración
        const isAdminPage = window.location.pathname.includes('/admin/');
        const baseUrl = isAdminPage ? '../' : '';

        if (user) {
            console.log('Usuario logueado:', user.email);
            
            try {
                const userDoc = await db.collection('users').doc(user.uid).get();
                if (!userDoc.exists) {
                    console.log('No se encontró información del usuario');
                    auth.signOut();
                    window.location.href = baseUrl + 'index.html';
                    return;
                }

                const userData = userDoc.data();
                console.log('Rol del usuario:', userData.role);
                
                // Verificar si el usuario es admin o una peluquería activa
                if (userData.role === 'admin' || userData.role === 'peluqueria') {
                    if (userData.role === 'peluqueria' && userData.isActive === false) {
                        // Si la peluquería está inactiva, cerrar sesión y mostrar mensaje
                        await auth.signOut();
                        showErrorMessage('Tu cuenta está inactiva por falta de pago. Por favor, contacta con el administrador.');
                        window.location.href = baseUrl + 'index.html';
                        return;
                    }

                    // Si estamos en una página de administración, verificar acceso
                    if (isAdminPage) {
                        updateUILoggedIn(user, userData);
                    } else {
                        // Si no estamos en una página de administración, actualizar la UI normalmente
                        updateUILoggedIn(user, userData);
                    }
                } else {
                    // Si es un cliente normal, redirigir al index solo si está en una página de administración
                    if (isAdminPage) {
                        window.location.href = baseUrl + 'index.html';
                    } else {
                        updateUILoggedIn(user, userData);
                    }
                }
            } catch (error) {
                console.error('Error al obtener datos del usuario:', error);
                auth.signOut();
                window.location.href = baseUrl + 'index.html';
            }
        } else {
            console.log('Usuario no logueado');
            if (isAdminPage) {
                window.location.href = baseUrl + 'index.html';
            } else {
                updateUILoggedOut();
            }
        }
    });
}); 