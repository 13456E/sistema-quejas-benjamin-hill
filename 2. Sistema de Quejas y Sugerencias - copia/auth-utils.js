// Utilidades de autenticación
class AuthUtils {
    static STORAGE_KEY = 'auth_users';
    static USER_KEY = 'current_user';
    static AUTH_TOKEN_KEY = 'auth_token';

    static login(email, password) {
        try {
            // Obtener usuarios registrados
            const usersStr = localStorage.getItem(this.STORAGE_KEY);
            console.log('Datos crudos de usuarios:', usersStr);
            
            let users = [];
            if (usersStr) {
                try {
                    users = JSON.parse(usersStr);
                    if (!Array.isArray(users)) {
                        console.error('Los datos de usuarios no son un array válido');
                        users = [];
                    }
                } catch (e) {
                    console.error('Error al parsear usuarios:', e);
                    users = [];
                }
            }
            
            console.log('Usuarios encontrados:', users);
            console.log('Intentando iniciar sesión con:', { email, password });
            
            // Buscar usuario por email (comparación exacta)
            const user = users.find(u => u.email.toLowerCase().trim() === email.toLowerCase().trim());
            console.log('Usuario encontrado:', user);
            
            if (!user) {
                console.log('Usuario no encontrado. Correo buscado:', email);
                return false;
            }

            // Verificar si la contraseña coincide
            if (user.password !== password) {
                console.log('Contraseña incorrecta para el usuario:', email);
                return false;
            }

            // Generar token de autenticación
            const authToken = this.generateAuthToken();
            
            // Guardar datos del usuario actual y token
            const userData = {
                id: user.id,
                name: user.nombre || user.name,
                email: user.email,
                telefono: user.telefono,
                role: user.role || 'user'
            };
            
            console.log('Datos del usuario a guardar:', userData);
            
            localStorage.setItem(this.USER_KEY, JSON.stringify(userData));
            localStorage.setItem(this.AUTH_TOKEN_KEY, authToken);
            
            return true;
        } catch (error) {
            console.error('Error en login:', error);
            return false;
        }
    }

    static generateAuthToken() {
        return 'token_' + Date.now() + '_' + Math.random().toString(36).substr(2);
    }

    static register(userData) {
        try {
            // Obtener usuarios existentes
            const usersStr = localStorage.getItem(this.STORAGE_KEY);
            console.log('Datos crudos de usuarios:', usersStr);
            
            let users = [];
            if (usersStr) {
                try {
                    users = JSON.parse(usersStr);
                    if (!Array.isArray(users)) {
                        console.error('Los datos de usuarios no son un array válido');
                        users = [];
                    }
                } catch (e) {
                    console.error('Error al parsear usuarios:', e);
                    users = [];
                }
            }
            
            console.log('Usuarios actuales:', users);
            
            // Verificar si el usuario ya existe (comparación exacta)
            if (users.some(u => u.email.toLowerCase().trim() === userData.email.toLowerCase().trim())) {
                throw new Error('El usuario ya existe');
            }
            
            // Generar ID único para el usuario
            const userId = 'user_' + Date.now();
            
            // Asegurar que los campos necesarios estén presentes
            const newUser = {
                id: userId,
                nombre: userData.nombre,
                email: userData.email.toLowerCase().trim(),
                telefono: userData.telefono,
                password: userData.password,
                role: 'user',
                fechaRegistro: new Date().toISOString()
            };
            
            // Agregar el nuevo usuario al array
            users.push(newUser);
            
            // Guardar el array actualizado en localStorage
            const usersStrToSave = JSON.stringify(users);
            console.log('Guardando usuarios:', usersStrToSave);
            localStorage.setItem(this.STORAGE_KEY, usersStrToSave);
            
            // Verificar que se guardó correctamente
            const savedUsers = JSON.parse(localStorage.getItem(this.STORAGE_KEY));
            console.log('Usuarios guardados (verificación):', savedUsers);
            
            console.log('Usuario registrado exitosamente:', newUser);
            console.log('Todos los usuarios después del registro:', users);
            
            // Iniciar sesión automáticamente después del registro
            return this.login(newUser.email, newUser.password);
        } catch (error) {
            console.error('Error en registro:', error);
            throw error;
        }
    }

    static logout() {
        try {
            localStorage.removeItem(this.USER_KEY);
            localStorage.removeItem(this.AUTH_TOKEN_KEY);
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    }

    static isAuthenticated() {
        const userData = localStorage.getItem(this.USER_KEY);
        const authToken = localStorage.getItem(this.AUTH_TOKEN_KEY);
        return !!userData && !!authToken;
    }

    static getUserData() {
        try {
            const userData = localStorage.getItem(this.USER_KEY);
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error('Error al obtener datos del usuario:', error);
            return null;
        }
    }

    // Obtener el token de autenticación
    static getAuthToken() {
        return localStorage.getItem(this.AUTH_TOKEN_KEY);
    }

    // Verificar autenticación y redirigir si es necesario
    static checkAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    }

    // Verificar autenticación en cada página
    static initializeAuth() {
        const currentPath = window.location.pathname.toLowerCase();
        const isAuthPage = currentPath.endsWith('login.html') || currentPath.endsWith('register.html');
        const isHistorialPage = currentPath.endsWith('historial.html');
        
        // No verificar autenticación en la página de historial
        if (isHistorialPage) {
            return true;
        }
        
        if (!isAuthPage && !this.isAuthenticated()) {
            window.location.href = 'login.html';
            return false;
        }
        
        if (isAuthPage && this.isAuthenticated()) {
            window.location.href = 'index.html';
            return false;
        }
        
        return true;
    }

    // Actualizar datos del usuario
    static updateUserData(newData) {
        try {
            const currentData = this.getUserData();
            if (!currentData) return false;

            const updatedData = { ...currentData, ...newData };
            localStorage.setItem(this.USER_KEY, JSON.stringify(updatedData));
            return true;
        } catch (error) {
            console.error('Error al actualizar datos del usuario:', error);
            return false;
        }
    }
}

// Exportar utilidades
window.AuthUtils = AuthUtils; 