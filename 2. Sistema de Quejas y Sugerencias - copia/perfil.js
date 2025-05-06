// Clase principal para manejar el perfil
class ProfileManager {
    constructor() {
        this.initialize();
    }

    initialize() {
        // Verificar autenticación
        if (!AuthUtils.checkAuth()) {
            window.location.href = 'login.html';
            return;
        }

        // Configurar menú y navegación
        this.setupSideMenu();
        this.setupBottomNav();

    // Cargar datos del usuario
        this.loadUserData();
        this.loadUserStats();

        // Configurar eventos
        this.setupEventListeners();
    }

    setupSideMenu() {
        const menuIcon = document.querySelector('.menu-icon');
        const sideMenu = document.querySelector('.side-menu');
        const menuOverlay = document.querySelector('.menu-overlay');
        const closeMenu = document.querySelector('.close-menu');

        if (menuIcon && sideMenu && menuOverlay) {
            menuIcon.addEventListener('click', () => {
                sideMenu.classList.add('active');
                menuOverlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            });

            closeMenu.addEventListener('click', () => {
                this.closeSideMenu();
            });

            menuOverlay.addEventListener('click', () => {
                this.closeSideMenu();
            });
        }
    }

    closeSideMenu() {
        const sideMenu = document.querySelector('.side-menu');
        const menuOverlay = document.querySelector('.menu-overlay');
        
        if (sideMenu && menuOverlay) {
            sideMenu.classList.remove('active');
            menuOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    setupBottomNav() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const page = item.getAttribute('data-page');
                this.navigateToPage(page);
            });
        });
    }

    navigateToPage(page) {
        const pages = {
            'inicio': 'index.html',
            'historial': 'historial.html',
            'perfil': 'perfil.html'
        };

        if (pages[page]) {
            window.location.href = pages[page];
        }
    }

    loadUserData() {
        const user = AuthUtils.getUserData();
        if (user) {
            // Actualizar información básica
            document.getElementById('userName').textContent = user.nombre || 'Usuario';
            document.getElementById('userEmail').textContent = user.email || 'No especificado';
            document.getElementById('userPhone').textContent = user.telefono || 'No especificado';
            
            // Actualizar avatar
            this.updateAvatar(user);
        }
    }

    updateAvatar(user) {
        const avatar = document.getElementById('userAvatar');
        if (user.avatar) {
            avatar.innerHTML = `<img src="${user.avatar}" alt="Avatar">`;
        } else {
            const initials = (user.nombre || 'U').charAt(0).toUpperCase();
            avatar.innerHTML = `<span>${initials}</span>`;
        }
    }

    loadUserStats() {
        const user = AuthUtils.getUserData();
        if (!user) return;

        // Obtener todos los registros
        const records = RecordsManager.getRecords();
        if (!records) return;

        // Filtrar registros del usuario actual
        const userRecords = records.filter(record => record.userId === user.id);

        // Contar quejas
        const quejas = userRecords.filter(record => record.type === 'queja').length;
        
        // Contar sugerencias
        const sugerencias = userRecords.filter(record => record.type === 'sugerencia').length;
        
        // Contar casos resueltos
        const resueltos = userRecords.filter(record => record.status === 'completado').length;

        // Actualizar números en la interfaz
        document.getElementById('complaintsCount').textContent = quejas;
        document.getElementById('suggestionsCount').textContent = sugerencias;
        document.getElementById('resolvedCount').textContent = resueltos;
        
        // Actualizar barras de progreso
        this.updateProgressBars({
            quejas,
            sugerencias,
            resueltos
        });
    }

    updateProgressBars(stats) {
        const total = stats.quejas + stats.sugerencias;
        if (total > 0) {
            // Calcular porcentajes
            const quejasPorcentaje = (stats.quejas / total) * 100;
            const sugerenciasPorcentaje = (stats.sugerencias / total) * 100;
            const resueltosPorcentaje = (stats.resueltos / total) * 100;

            // Actualizar barras de progreso
            document.getElementById('complaintsProgress').style.width = `${quejasPorcentaje}%`;
            document.getElementById('suggestionsProgress').style.width = `${sugerenciasPorcentaje}%`;
            document.getElementById('resolvedProgress').style.width = `${resueltosPorcentaje}%`;
        }
    }

    setupEventListeners() {
        // Botón de editar perfil
        const editProfileBtn = document.getElementById('editProfileBtn');
        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', () => this.showEditProfileModal());
        }

        // Botón de cambiar contraseña
        const changePasswordBtn = document.getElementById('changePasswordBtn');
        if (changePasswordBtn) {
            changePasswordBtn.addEventListener('click', () => this.showChangePasswordModal());
        }

        // Botón de cerrar sesión
        const logoutBtn = document.querySelector('.logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                AuthUtils.logout();
                window.location.href = 'login.html';
            });
        }
    }

    showEditProfileModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>Editar Perfil</h2>
                <form id="editProfileForm">
                    <div class="form-group">
                        <label for="editName">Nombre</label>
                        <input type="text" id="editName" required>
                    </div>
                    <div class="form-group">
                        <label for="editPhone">Teléfono</label>
                        <input type="tel" id="editPhone">
                    </div>
                    <div class="form-group">
                        <label for="editAvatar">URL de la Foto</label>
                        <input type="url" id="editAvatar">
                    </div>
                    <div class="modal-actions">
                        <button type="submit" class="btn-primary">Guardar Cambios</button>
                        <button type="button" class="btn-secondary" onclick="this.closest('.modal').remove()">Cancelar</button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Cargar datos actuales
        const user = AuthUtils.getUserData();
        if (user) {
            document.getElementById('editName').value = user.nombre || '';
            document.getElementById('editPhone').value = user.telefono || '';
            document.getElementById('editAvatar').value = user.avatar || '';
        }
        
        // Manejar envío del formulario
        modal.querySelector('form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleEditProfileSubmit(modal);
        });
    }

    handleEditProfileSubmit(modal) {
        const newData = {
            nombre: document.getElementById('editName').value,
            telefono: document.getElementById('editPhone').value,
            avatar: document.getElementById('editAvatar').value
        };
        
        if (AuthUtils.updateUserData(newData)) {
            this.loadUserData();
            modal.remove();
            this.showToast('Perfil actualizado correctamente', 'success');
        } else {
            this.showToast('Error al actualizar el perfil', 'error');
        }
    }

    showChangePasswordModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>Cambiar Contraseña</h2>
                <form id="changePasswordForm">
                    <div class="form-group">
                        <label for="currentPassword">Contraseña Actual</label>
                        <input type="password" id="currentPassword" required>
                    </div>
                    <div class="form-group">
                        <label for="newPassword">Nueva Contraseña</label>
                        <input type="password" id="newPassword" required>
                    </div>
                    <div class="form-group">
                        <label for="confirmPassword">Confirmar Nueva Contraseña</label>
                        <input type="password" id="confirmPassword" required>
                    </div>
                    <div class="modal-actions">
                        <button type="submit" class="btn-primary">Cambiar Contraseña</button>
                        <button type="button" class="btn-secondary" onclick="this.closest('.modal').remove()">Cancelar</button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Manejar envío del formulario
        modal.querySelector('form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleChangePasswordSubmit(modal);
        });
    }

    handleChangePasswordSubmit(modal) {
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (newPassword !== confirmPassword) {
            this.showToast('Las contraseñas no coinciden', 'error');
            return;
        }
        
        if (AuthUtils.updatePassword(currentPassword, newPassword)) {
            modal.remove();
            this.showToast('Contraseña actualizada correctamente', 'success');
            } else {
            this.showToast('Error al cambiar la contraseña', 'error');
        }
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }, 100);
    }
}

// Inicializar la página cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new ProfileManager();
}); 