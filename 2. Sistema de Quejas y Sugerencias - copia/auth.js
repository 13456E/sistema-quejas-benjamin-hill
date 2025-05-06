document.addEventListener('DOMContentLoaded', function() {
    // Inicializar la autenticación
    if (AuthUtils.initializeAuth()) {
        setupAuthEvents();
    }
});

function setupAuthEvents() {
    // Eventos para el formulario de inicio de sesión
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
        
        // Evento para mostrar/ocultar contraseña
        const togglePassword = loginForm.querySelector('.toggle-password');
        if (togglePassword) {
            togglePassword.addEventListener('click', togglePasswordVisibility);
        }

        // Evento para ir al registro
        const registerBtn = document.getElementById('registerBtn');
        if (registerBtn) {
            registerBtn.addEventListener('click', () => {
                window.location.href = 'register.html';
            });
        }
    }

    // Eventos para el formulario de registro
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
        
        // Eventos para mostrar/ocultar contraseña
        const togglePasswords = registerForm.querySelectorAll('.toggle-password');
        togglePasswords.forEach(btn => {
            btn.addEventListener('click', togglePasswordVisibility);
        });

        // Evento para ir al inicio de sesión
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                window.location.href = 'login.html';
            });
        }
    }
}

async function handleLogin(event) {
    event.preventDefault();
    
    const form = event.target;
    const email = form.email.value.trim();
    const password = form.password.value;
    const remember = form.remember?.checked || false;

    try {
        // Validar campos
        if (!email || !password) {
            showToast('Por favor, completa todos los campos', 'error');
            return;
        }

        // Mostrar indicador de carga
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando sesión...';
        submitBtn.disabled = true;

        // Intentar login usando AuthUtils
        const success = AuthUtils.login(email, password);

        if (success) {
            showToast('Inicio de sesión exitoso', 'success');
                setTimeout(() => {
                window.location.href = 'index.html';
                }, 1000);
            } else {
            showToast('Credenciales incorrectas', 'error');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            }
        } catch (error) {
        console.error('Error en login:', error);
        showToast('Error al iniciar sesión. Por favor, intenta nuevamente.', 'error');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

async function handleRegister(event) {
    event.preventDefault();
    
    const form = event.target;
    const nombre = form.nombre.value.trim();
    const email = form.email.value.trim();
    const telefono = form.telefono.value.trim();
    const password = form.password.value;
    const confirmPassword = form.confirmPassword.value;
    const terms = form.terms.checked;

    try {
        // Validar campos
        if (!nombre || !email || !telefono || !password || !confirmPassword) {
            showToast('Por favor, completa todos los campos', 'error');
            return;
        }

        if (password !== confirmPassword) {
            showToast('Las contraseñas no coinciden', 'error');
            return;
        }

        if (!terms) {
            showToast('Debes aceptar los términos y condiciones', 'error');
            return;
        }

        // Mostrar indicador de carga
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creando cuenta...';
        submitBtn.disabled = true;

        // Verificar si el email ya está registrado
        const users = JSON.parse(localStorage.getItem(AuthUtils.STORAGE_KEY) || '[]');
        if (users.some(u => u.email === email)) {
            showToast('El correo electrónico ya está registrado', 'error');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            return;
        }

        // Crear nuevo usuario
        const newUser = {
            id: generateUserId(),
                nombre,
                email,
                telefono,
            password,
            fechaRegistro: new Date().toISOString()
        };

        // Guardar usuario
        users.push(newUser);
        localStorage.setItem(AuthUtils.STORAGE_KEY, JSON.stringify(users));

        showToast('Cuenta creada exitosamente', 'success');
                setTimeout(() => {
            window.location.href = 'login.html';
        }, 1000);
    } catch (error) {
        console.error('Error al registrar usuario:', error);
        showToast('Error al crear la cuenta', 'error');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

function togglePasswordVisibility(event) {
    const button = event.currentTarget;
    const input = button.previousElementSibling;
    const icon = button.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

function generateAuthToken() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function generateUserId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
} 