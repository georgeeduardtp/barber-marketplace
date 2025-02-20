// Funciones de gestión de usuarios
async function updateUILoggedIn(user, userData) {
    const authButtons = document.querySelector('.auth-buttons');
    const userMenu = document.querySelector('.user-menu');
    const userName = userMenu.querySelector('.user-name');
    const userRole = userMenu.querySelector('.user-role');
    
    authButtons.style.display = 'none';
    userMenu.style.display = 'flex';
    
    userName.textContent = userData.name || user.email;
    userRole.textContent = userData.role === 'admin' ? 'Administrador' : 
                          userData.role === 'peluqueria' ? 'Peluquería' : 'Cliente';
}

function updateUILoggedOut() {
    const authButtons = document.querySelector('.auth-buttons');
    const userMenu = document.querySelector('.user-menu');
    
    authButtons.style.display = 'block';
    userMenu.style.display = 'none';
}

async function createSalonAccount() {
    const name = document.getElementById('salonName').value;
    const email = document.getElementById('salonEmail').value;
    const password = document.getElementById('salonPassword').value;

    try {
        // Crear usuario en Authentication
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Crear documento en la colección users
        await db.collection('users').doc(user.uid).set({
            name: name,
            email: email,
            role: 'peluqueria',
            createdAt: new Date()
        });

        closeModal('createSalonModal');
        alert('Cuenta de peluquería creada exitosamente');
        filterSalons(); // Actualizar lista de peluquerías
    } catch (error) {
        console.error('Error al crear cuenta:', error);
        alert('Error al crear la cuenta: ' + error.message);
    }
}

async function deleteSalonAndUser(userId, peluqueriaId) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta peluquería? Esta acción no se puede deshacer.')) {
        return;
    }

    try {
        // Eliminar documento de peluquería si existe
        if (peluqueriaId) {
            await db.collection('peluquerias').doc(peluqueriaId).delete();
        }

        // Eliminar documento de usuario
        await db.collection('users').doc(userId).delete();

        // Actualizar la lista
        filterSalons();
        alert('Peluquería eliminada exitosamente');
    } catch (error) {
        console.error('Error al eliminar peluquería:', error);
        alert('Error al eliminar la peluquería: ' + error.message);
    }
} 