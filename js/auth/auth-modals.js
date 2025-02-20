// Funciones para manejar los modales de autenticación

// Función para mostrar el modal de login
function showLoginModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Iniciar Sesión</h2>
                <button class="modal-close">&times;</button>
            </div>
            <form id="loginForm" class="auth-form">
                <div class="form-group">
                    <label for="loginEmail">
                        <i class="fas fa-envelope"></i> Correo Electrónico
                    </label>
                    <input type="email" id="loginEmail" required>
                </div>
                <div class="form-group">
                    <label for="loginPassword">
                        <i class="fas fa-lock"></i> Contraseña
                    </label>
                    <div class="password-input">
                        <input type="password" id="loginPassword" required>
                        <button type="button" class="toggle-password">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="primary-button">
                        <i class="fas fa-sign-in-alt"></i> Iniciar Sesión
                    </button>
                    <button type="button" class="secondary-button" onclick="showForgotPasswordModal()">
                        ¿Olvidaste tu contraseña?
                    </button>
                </div>
            </form>
            <div class="modal-footer">
                <p>¿No tienes cuenta? 
                    <button onclick="showRegisterModal()" class="link-button">
                        Regístrate aquí
                    </button>
                </p>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    setupModalEvents(modal);
    setupLoginForm(modal);
}

// Función para mostrar el modal de registro
function showRegisterModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Registro</h2>
                <button class="modal-close">&times;</button>
            </div>
            <form id="registerForm" class="auth-form">
                <div class="form-group">
                    <label for="registerName">
                        <i class="fas fa-user"></i> Nombre Completo
                    </label>
                    <input type="text" id="registerName" required>
                </div>
                <div class="form-group">
                    <label for="registerEmail">
                        <i class="fas fa-envelope"></i> Correo Electrónico
                    </label>
                    <input type="email" id="registerEmail" required>
                </div>
                <div class="form-group">
                    <label for="registerPassword">
                        <i class="fas fa-lock"></i> Contraseña
                    </label>
                    <div class="password-input">
                        <input type="password" id="registerPassword" required>
                        <button type="button" class="toggle-password">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
                <div class="form-group">
                    <label for="registerRole">
                        <i class="fas fa-user-tag"></i> Tipo de Cuenta
                    </label>
                    <select id="registerRole" required>
                        <option value="client">Cliente</option>
                        <option value="salon">Peluquería</option>
                    </select>
                </div>
                <div id="salonFields" style="display: none;">
                    <div class="form-group">
                        <label for="salonName">
                            <i class="fas fa-store"></i> Nombre de la Peluquería
                        </label>
                        <input type="text" id="salonName">
                    </div>
                    <div class="form-group">
                        <label for="salonAddress">
                            <i class="fas fa-map-marker-alt"></i> Dirección
                        </label>
                        <input type="text" id="salonAddress">
                    </div>
                    <div class="form-group">
                        <label for="salonCity">
                            <i class="fas fa-city"></i> Ciudad
                        </label>
                        <input type="text" id="salonCity">
                    </div>
                    <div class="form-group">
                        <label for="salonPhone">
                            <i class="fas fa-phone"></i> Teléfono
                        </label>
                        <input type="tel" id="salonPhone">
                    </div>
                </div>
                <button type="submit" class="primary-button">
                    <i class="fas fa-user-plus"></i> Registrarse
                </button>
            </form>
            <div class="modal-footer">
                <p>¿Ya tienes cuenta? 
                    <button onclick="showLoginModal()" class="link-button">
                        Inicia sesión aquí
                    </button>
                </p>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    setupModalEvents(modal);
    setupRegisterForm(modal);
}

// Función para mostrar el modal de recuperación de contraseña
function showForgotPasswordModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Recuperar Contraseña</h2>
                <button class="modal-close">&times;</button>
            </div>
            <form id="resetPasswordForm" class="auth-form">
                <div class="form-group">
                    <label for="resetEmail">
                        <i class="fas fa-envelope"></i> Correo Electrónico
                    </label>
                    <input type="email" id="resetEmail" required>
                </div>
                <button type="submit" class="primary-button">
                    <i class="fas fa-paper-plane"></i> Enviar Correo
                </button>
            </form>
            <div class="modal-footer">
                <button onclick="showLoginModal()" class="link-button">
                    Volver al inicio de sesión
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    setupModalEvents(modal);
    setupResetPasswordForm(modal);
}

// Función para configurar eventos del modal
function setupModalEvents(modal) {
    // Cerrar al hacer clic en X o fuera del modal
    const closeBtn = modal.querySelector('.modal-close');
    closeBtn.onclick = () => modal.remove();
    
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };

    // Mostrar/ocultar contraseña
    const toggleBtns = modal.querySelectorAll('.toggle-password');
    toggleBtns.forEach(btn => {
        btn.onclick = () => {
            const input = btn.previousElementSibling;
            const icon = btn.querySelector('i');
            if (input.type === 'password') {
                input.type = 'text';
                icon.className = 'fas fa-eye-slash';
            } else {
                input.type = 'password';
                icon.className = 'fas fa-eye';
            }
        };
    });
}

// Función para configurar el formulario de login
function setupLoginForm(modal) {
    const form = modal.querySelector('#loginForm');
    form.onsubmit = async (e) => {
        e.preventDefault();
        
        const email = form.querySelector('#loginEmail').value;
        const password = form.querySelector('#loginPassword').value;

        try {
            await login(email, password);
            modal.remove();
        } catch (error) {
            console.error('Error en login:', error);
        }
    };
}

// Función para configurar el formulario de registro
function setupRegisterForm(modal) {
    const form = modal.querySelector('#registerForm');
    const roleSelect = form.querySelector('#registerRole');
    const salonFields = form.querySelector('#salonFields');

    // Mostrar/ocultar campos de peluquería
    roleSelect.onchange = () => {
        salonFields.style.display = 
            roleSelect.value === 'salon' ? 'block' : 'none';
    };

    form.onsubmit = async (e) => {
        e.preventDefault();

        const userData = {
            name: form.querySelector('#registerName').value,
            email: form.querySelector('#registerEmail').value,
            password: form.querySelector('#registerPassword').value,
            role: roleSelect.value
        };

        if (userData.role === 'salon') {
            userData.salonName = form.querySelector('#salonName').value;
            userData.address = form.querySelector('#salonAddress').value;
            userData.city = form.querySelector('#salonCity').value;
            userData.phone = form.querySelector('#salonPhone').value;
        }

        try {
            await register(userData);
            modal.remove();
        } catch (error) {
            console.error('Error en registro:', error);
        }
    };
}

// Función para configurar el formulario de recuperación de contraseña
function setupResetPasswordForm(modal) {
    const form = modal.querySelector('#resetPasswordForm');
    form.onsubmit = async (e) => {
        e.preventDefault();
        
        const email = form.querySelector('#resetEmail').value;

        try {
            await resetPassword(email);
            modal.remove();
        } catch (error) {
            console.error('Error en reset password:', error);
        }
    };
}

// Exportar funciones al objeto window
window.showLoginModal = showLoginModal;
window.showRegisterModal = showRegisterModal;
window.showForgotPasswordModal = showForgotPasswordModal; 