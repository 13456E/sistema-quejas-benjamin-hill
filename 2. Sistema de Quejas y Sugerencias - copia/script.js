document.addEventListener('DOMContentLoaded', function() {
    // Solo inicializar la app si no estamos en la página de login
    const currentPath = window.location.pathname.toLowerCase();
    const isLoginPage = currentPath.endsWith('login.html');
    const isHistorialPage = currentPath.endsWith('historial.html');
    
    // Cargar modo oscuro al inicio
    const preferences = JSON.parse(localStorage.getItem('userPreferences') || '{}');
    if (preferences.darkMode) {
        document.body.classList.add('dark-mode');
    }
    
    if (!isLoginPage && !isHistorialPage) {
        initializeApp();
    }

    const cards = document.querySelectorAll('.fun-fact-card');
    const container = document.querySelector('.fun-facts-container');
    let activeCard = null;

    cards.forEach(card => {
        card.addEventListener('click', function() {
            if (activeCard === this) {
                // Si se hace clic en la tarjeta activa, cerrarla
                this.classList.remove('active');
                container.classList.remove('has-active-card');
                activeCard = null;
            } else {
                // Si hay una tarjeta activa, cerrarla primero
                if (activeCard) {
                    activeCard.classList.remove('active');
                }
                
                // Activar la nueva tarjeta
                this.classList.add('active');
                container.classList.add('has-active-card');
                activeCard = this;
            }
        });
    });

    // Cerrar la tarjeta activa al hacer clic fuera de ella
    document.addEventListener('click', function(event) {
        if (activeCard && !activeCard.contains(event.target) && !event.target.classList.contains('fun-fact-card')) {
            activeCard.classList.remove('active');
            container.classList.remove('has-active-card');
            activeCard = null;
        }
    });
});

// Función principal de inicialización
function initializeApp() {
    // Verificar si estamos en la página de historial
    const currentPath = window.location.pathname.toLowerCase();
    const isHistorialPage = currentPath.endsWith('historial.html');
    
    // Solo verificar autenticación si NO estamos en la página de historial
    if (!isHistorialPage) {
        if (!AuthUtils.isAuthenticated()) {
            window.location.href = 'login.html';
            return;
        }
    }

    // Variables para el menú lateral
    const menuIcon = document.querySelector('.menu-icon');
    const sideMenu = document.querySelector('.side-menu');
    const closeMenu = document.querySelector('.close-menu');
    const menuOverlay = document.querySelector('.menu-overlay');
    const menuLinks = document.querySelectorAll('.menu-link');

    // Variables para notificaciones
    const notificationIcon = document.querySelector('.notification-icon');
    const notificationsPanel = document.querySelector('.notifications-panel');

    // Cargar datos del usuario
    const userData = AuthUtils.getUserData();
    updateUserInfo(userData);

    // Función para actualizar la información del usuario en la interfaz
    function updateUserInfo(user) {
        const profileName = document.querySelector('.profile-info h3');
        if (profileName) {
            profileName.textContent = user?.name || 'Usuario';
        }
    }

    // Función para cerrar sesión
    window.logout = function() {
        AuthUtils.logout();
    }

    // Agregar botón de cerrar sesión al menú si no existe
    if (!document.querySelector('.menu-link.logout-btn')) {
        const logoutButton = document.createElement('a');
        logoutButton.href = '#';
        logoutButton.className = 'menu-link logout-btn';
        logoutButton.innerHTML = '<i class="fas fa-sign-out-alt"></i><span>Cerrar Sesión</span>';
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
        const menuItems = document.querySelector('.menu-items');
        if (menuItems) {
            menuItems.appendChild(logoutButton);
        }
    }

    // Event listeners para el menú
    if (menuIcon) menuIcon.addEventListener('click', openMenu);
    if (closeMenu) closeMenu.addEventListener('click', closeMenuHandler);
    if (menuOverlay) menuOverlay.addEventListener('click', closeMenuHandler);

    // Función para abrir el menú lateral
    function openMenu() {
        if (sideMenu && menuOverlay) {
            sideMenu.classList.add('active');
            menuOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    // Función para cerrar el menú lateral
    function closeMenuHandler() {
        if (sideMenu && menuOverlay) {
            sideMenu.classList.remove('active');
            menuOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    // Manejar clicks en los enlaces del menú
    menuLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const href = this.getAttribute('href');
            closeMenuHandler();
            setTimeout(() => {
                window.location.href = href;
            }, 300);
        });
    });

    // Toggle del panel de notificaciones
    if (notificationIcon && notificationsPanel) {
        notificationIcon.addEventListener('click', function(e) {
            e.stopPropagation();
            notificationsPanel.classList.toggle('active');
        });

        // Cerrar panel de notificaciones al hacer click fuera
        document.addEventListener('click', function(e) {
            if (!notificationsPanel.contains(e.target) && e.target !== notificationIcon) {
                notificationsPanel.classList.remove('active');
            }
        });
    }

    // Marcar el enlace activo en el menú
    const currentPage = window.location.pathname;
    menuLinks.forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        }
    });

    // Cerrar menú con la tecla Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeMenuHandler();
            if (notificationsPanel) notificationsPanel.classList.remove('active');
        }
    });

    // Manejo de navegación para menú principal y barra inferior
    const menuItems = document.querySelectorAll('.menu-item');
    const navItems = document.querySelectorAll('.nav-item');

    // Función para manejar la navegación
    function handleNavigation(page) {
        let targetPage = '';
        switch(page) {
            case 'inicio':
                targetPage = 'index.html';
                break;
            case 'estado-quejas':
            case 'historial':
            case 'estado':
                targetPage = 'historial.html';
                break;
            case 'perfil':
            case 'ajustes':
                targetPage = 'perfil.html';
                break;
            case 'registrar-queja':
                targetPage = 'registrar-queja.html';
                break;
            case 'sugerencias':
                targetPage = 'sugerencias.html';
                break;
            case 'datos-curiosos':
                targetPage = 'datos-curiosos.html';
                break;
            case 'contacto':
                targetPage = 'contacto.html';
                break;
        }
        if (targetPage) {
            window.location.href = targetPage;
        }
    }

    // Event listeners para elementos del menú principal
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            handleNavigation(page);
        });
    });

    // Event listeners para elementos de la barra de navegación inferior
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            
            // Actualizar clase activa
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            
            handleNavigation(page);
        });
    });

    // Marcar el botón activo en la barra inferior según la página actual
    function updateActiveNavItem() {
        const currentPath = window.location.pathname.toLowerCase();
        navItems.forEach(item => {
            const page = item.getAttribute('data-page');
            if ((page === 'inicio' && (currentPath.endsWith('/') || currentPath.includes('index'))) ||
                (page === 'historial' && currentPath.includes('estado-quejas')) ||
                (page === 'ajustes' && currentPath.includes('perfil'))) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    // Actualizar el botón activo al cargar la página
    updateActiveNavItem();
}

// Función para crear páginas dinámicamente
function createPage(id) {
    const page = document.createElement('div');
    page.id = id;
    page.className = 'page';
    
    let content = '';
    switch(id) {
        case 'registrar-queja':
            content = `
                <div class="page-header">
                    <h2>Registrar Queja</h2>
                </div>
                <form class="complaint-form" id="quejaForm">
                    <div class="form-group">
                        <label for="nombre">Nombre Completo:</label>
                        <input type="text" id="nombre" required>
                    </div>
                    <div class="form-group">
                        <label for="email">Correo Electrónico:</label>
                        <input type="email" id="email" required>
                    </div>
                    <div class="form-group">
                        <label for="telefono">Teléfono:</label>
                        <input type="tel" id="telefono" required>
                    </div>
                    <div class="form-group">
                        <label for="tipo">Tipo:</label>
                        <select id="tipo" required>
                            <option value="">Seleccione un tipo</option>
                            <option value="queja">Queja</option>
                            <option value="sugerencia">Sugerencia</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="descripcion">Descripción:</label>
                        <textarea id="descripcion" rows="5" required></textarea>
                    </div>
                    <button type="submit" class="submit-btn">Enviar</button>
                </form>`;
            break;
        case 'estado-quejas':
            content = `
                <div class="page-header">
                    <h2>Estado de Quejas</h2>
                </div>
                <div class="search-bar">
                    <input type="text" placeholder="Buscar por folio..." id="searchQueja">
                    <button class="search-btn"><i class="fas fa-search"></i></button>
                </div>
                <div class="quejas-list">
                    <div class="queja-item">
                        <div class="queja-header">
                            <span class="folio">Folio: #123</span>
                            <span class="status pending">Pendiente</span>
                        </div>
                        <p class="queja-desc">Descripción de la queja...</p>
                        <div class="queja-footer">
                            <span class="fecha">Fecha: 01/03/2024</span>
                            <button class="details-btn">Ver Detalles</button>
                        </div>
                    </div>
                </div>`;
            break;
        case 'sugerencias':
            content = `
                <div class="page-header">
                    <h2>Sugerencias</h2>
                </div>
                <div class="sugerencias-container">
                    <form class="suggestion-form">
                        <div class="form-group">
                            <label for="titulo">Título de la Sugerencia:</label>
                            <input type="text" id="titulo" required>
                        </div>
                        <div class="form-group">
                            <label for="categoria">Categoría:</label>
                            <select id="categoria" required>
                                <option value="">Seleccione una categoría</option>
                                <option value="servicios">Servicios Públicos</option>
                                <option value="infraestructura">Infraestructura</option>
                                <option value="transporte">Transporte</option>
                                <option value="otros">Otros</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="sugerencia">Su Sugerencia:</label>
                            <textarea id="sugerencia" rows="5" required></textarea>
                        </div>
                        <button type="submit" class="submit-btn">Enviar Sugerencia</button>
                    </form>
                </div>`;
            break;
        case 'informacion':
            content = `
                <div class="page-header">
                    <h2>Información</h2>
                </div>
                <div class="info-container">
                    <div class="info-section">
                        <h3>Sobre Benjamín Hill</h3>
                        <p>Municipio ubicado en el estado de Sonora, México.</p>
                    </div>
                    <div class="info-section">
                        <h3>Horarios de Atención</h3>
                        <p>Lunes a Viernes: 8:00 AM - 3:00 PM</p>
                    </div>
                    <div class="info-section">
                        <h3>Contacto</h3>
                        <p>Teléfono: (123) 456-7890</p>
                        <p>Email: contacto@benjaminhill.gob.mx</p>
                    </div>
                </div>`;
            break;
        case 'contacto':
            content = `
                <div class="page-header">
                    <h2>Contacto Directo</h2>
                </div>
                <div class="contact-container">
                    <div class="contact-info">
                        <div class="contact-item">
                            <i class="fas fa-phone"></i>
                            <div class="contact-details">
                                <h3>Teléfono</h3>
                                <p>(123) 456-7890</p>
                            </div>
                        </div>
                        <div class="contact-item">
                            <i class="fas fa-envelope"></i>
                            <div class="contact-details">
                                <h3>Correo Electrónico</h3>
                                <p>contacto@benjaminhill.gob.mx</p>
                            </div>
                        </div>
                        <div class="contact-item">
                            <i class="fas fa-map-marker-alt"></i>
                            <div class="contact-details">
                                <h3>Dirección</h3>
                                <p>Palacio Municipal, Benjamín Hill, Sonora</p>
                            </div>
                        </div>
                    </div>
                </div>`;
            break;
        case 'perfil':
            content = `
                <div class="page-header">
                    <h2>Mi Perfil</h2>
                </div>
                <div class="profile-container">
                    <div class="profile-header">
                        <div class="profile-avatar">
                            <i class="fas fa-user-circle"></i>
                        </div>
                        <div class="profile-info">
                            <h3>Usuario</h3>
                            <p>Ciudadano de Benjamín Hill</p>
                        </div>
                    </div>
                    <div class="profile-content">
                        <div class="profile-section">
                            <h4>Mis Quejas y Sugerencias</h4>
                            <div class="profile-stats">
                                <div class="stat-item">
                                    <span class="stat-number">0</span>
                                    <span class="stat-label">Quejas Activas</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-number">0</span>
                                    <span class="stat-label">Sugerencias</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`;
            break;
    }
    
    page.innerHTML = content;
    document.querySelector('.app-container').appendChild(page);
    return page;
}

// Función para mostrar mensajes de estado
function showStatusMessage(message, type = 'info') {
    const statusDiv = document.createElement('div');
    statusDiv.className = `status-message ${type}`;
    statusDiv.textContent = message;
    document.body.appendChild(statusDiv);

    setTimeout(() => {
        statusDiv.classList.add('fade-out');
        setTimeout(() => statusDiv.remove(), 300);
    }, 3000);
}

// Función para manejar transiciones de página
function navigateTo(pageId) {
    const pages = document.querySelectorAll('.page, .main-menu');
    pages.forEach(page => {
        page.style.display = 'none';
    });
    
    const targetPage = document.getElementById(pageId) || document.querySelector('.main-menu');
    if (targetPage) {
        targetPage.style.display = 'block';
    }
}

// Manejo del formulario de quejas
const quejaForm = document.getElementById('quejaForm');
if (quejaForm) {
    quejaForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!AuthUtils.isAuthenticated()) {
            showStatusMessage('Debe iniciar sesión para registrar una queja', 'error');
            return;
        }

        const userData = AuthUtils.getUserData();
        const formData = {
            usuario_id: userData.id,
            tipo: document.getElementById('tipo').value,
            descripcion: document.getElementById('descripcion').value
        };

        try {
            const response = await fetch('database/quejas_handler.php?action=registrar_queja', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();
            
            if (result.success) {
                showStatusMessage('Queja registrada exitosamente', 'success');
                quejaForm.reset();
                
                // Actualizar contador de notificaciones
                updateNotificationCount();
            } else {
                showStatusMessage(result.message || 'Error al registrar la queja', 'error');
            }
        } catch (error) {
            showStatusMessage('Error al conectar con el servidor', 'error');
        }
    });
}

// Función para actualizar el contador de notificaciones
function updateNotificationCount() {
    const badge = document.querySelector('.notification-badge');
    if (badge) {
        let count = parseInt(badge.textContent || '0');
        badge.textContent = count + 1;
    }
}

// Función para cargar el historial de quejas
async function loadQuejas() {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    if (!userData.id) return;

    try {
        const response = await fetch('database/quejas_handler.php?action=obtener_quejas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ usuario_id: userData.id })
        });

        const result = await response.json();
        
        if (result.success) {
            const quejasList = document.querySelector('.quejas-list');
            if (quejasList) {
                quejasList.innerHTML = result.quejas.map(queja => `
                    <div class="queja-item">
                        <div class="queja-header">
                            <span class="folio">Folio: #${queja.id}</span>
                            <span class="status ${queja.estado}">${queja.estado}</span>
                        </div>
                        <p class="queja-desc">${queja.descripcion}</p>
                        <div class="queja-footer">
                            <span class="fecha">Fecha: ${new Date(queja.fecha_creacion).toLocaleDateString()}</span>
                            <button class="details-btn" onclick="showQuejaDetails(${queja.id})">Ver Detalles</button>
                        </div>
                    </div>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error al cargar quejas:', error);
    }
}

// Función para mostrar detalles de una queja
function showQuejaDetails(id) {
    // Implementar modal o navegación a página de detalles
    window.location.href = 'historial.html';
}

// Cargar quejas al iniciar la página de estado-quejas
if (window.location.pathname.includes('estado-quejas')) {
    loadQuejas();
}

// Función para scroll suave a la sección de servicios
function scrollToServices() {
    const serviciosSection = document.getElementById('servicios-municipales');
    serviciosSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
    });
}

// Función para cambiar el idioma
function changeLanguage(lang) {
    // Guardar la preferencia de idioma
    localStorage.setItem('language', lang);
    
    // Actualizar todos los elementos con data-translate
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[lang] && translations[lang][key]) {
            element.textContent = translations[lang][key];
        }
    });

    // Actualizar placeholders
    document.querySelectorAll('[data-translate-placeholder]').forEach(element => {
        const key = element.getAttribute('data-translate-placeholder');
        if (translations[lang] && translations[lang][key]) {
            element.placeholder = translations[lang][key];
        }
    });

    // Actualizar el selector de idioma si existe
    const langSelector = document.querySelector('.language-selector');
    if (langSelector) {
        langSelector.value = lang;
    }
}

// Función para inicializar el idioma
function initializeLanguage() {
    const savedLanguage = localStorage.getItem('language') || 'es';
    changeLanguage(savedLanguage);
}

// Inicializar el idioma cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    initializeLanguage();
    
    // Agregar evento al selector de idioma si existe
    const langSelector = document.querySelector('.language-selector');
    if (langSelector) {
        langSelector.addEventListener('change', (e) => {
            changeLanguage(e.target.value);
        });
    }
});

// Función para manejar las notificaciones
function toggleNotifications() {
    const notificationsPanel = document.getElementById('notificationsPanel');
    const notificationsToggle = document.getElementById('notificationsToggle');
    const badge = document.getElementById('notificationBadge');
    
    if (notificationsPanel && notificationsToggle) {
        // Cerrar otros paneles activos primero
        const activePanels = document.querySelectorAll('.notifications-panel.active');
        activePanels.forEach(panel => {
            if (panel !== notificationsPanel) {
                panel.classList.remove('active');
            }
        });
        
        notificationsPanel.classList.toggle('active');
        
        // Si el panel está activo, marcar las notificaciones como leídas
        if (notificationsPanel.classList.contains('active')) {
            // Actualizar el contador de notificaciones
            if (badge) {
                badge.textContent = '0';
                badge.style.display = 'none';
            }
            
            // Marcar todas las notificaciones como leídas
            const notifications = document.querySelectorAll('.notification-item.unread');
            notifications.forEach(notification => {
                notification.classList.remove('unread');
            });
            
            // Actualizar el estado de lectura en localStorage
            const storedNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
            storedNotifications.forEach(notification => {
                notification.read = true;
            });
            localStorage.setItem('notifications', JSON.stringify(storedNotifications));
            
            // Mostrar el mensaje de no hay notificaciones si corresponde
            const noNotifications = document.getElementById('noNotifications');
            const notificationsList = document.getElementById('notificationsList');
            if (notificationsList && notificationsList.children.length === 0 && noNotifications) {
                noNotifications.style.display = 'flex';
            }
        }
    }
}

// Función para agregar una nueva notificación
function addNotification(title, message, type = 'info') {
    const notificationsList = document.getElementById('notificationsList');
    const noNotifications = document.getElementById('noNotifications');
    const badge = document.getElementById('notificationBadge');
    
    if (notificationsList && badge) {
        // Ocultar el mensaje de no hay notificaciones
        if (noNotifications) {
            noNotifications.style.display = 'none';
        }
        
        // Crear la nueva notificación
        const notification = document.createElement('div');
        notification.className = `notification-item unread ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-title">${title}</div>
                <div class="notification-message">${message}</div>
                <div class="notification-time">${new Date().toLocaleTimeString()}</div>
            </div>
        `;
        
        // Agregar la notificación al inicio de la lista
        notificationsList.insertBefore(notification, notificationsList.firstChild);
        
        // Actualizar el contador de notificaciones
        let count = parseInt(badge.textContent || '0');
        badge.textContent = count + 1;
        badge.style.display = 'flex';
        
        // Agregar animación de entrada
        notification.style.animation = 'slideIn 0.3s ease-out';
        
        // Guardar la notificación en localStorage
        saveNotification(title, message, type);
        
        // Reproducir sonido de notificación
        const notificationSound = new Audio('notification.mp3');
        notificationSound.play().catch(() => {
            // Ignorar errores de reproducción de audio
        });
    }
}

// Función para guardar notificaciones en localStorage
function saveNotification(title, message, type) {
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    notifications.unshift({
        title,
        message,
        type,
        timestamp: new Date().toISOString(),
        read: false
    });
    localStorage.setItem('notifications', JSON.stringify(notifications));
}

// Función para cargar notificaciones desde localStorage
function loadNotifications() {
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    const notificationsList = document.getElementById('notificationsList');
    const noNotifications = document.getElementById('noNotifications');
    const badge = document.getElementById('notificationBadge');
    
    if (notificationsList && badge) {
        notificationsList.innerHTML = '';
        
        if (notifications.length === 0) {
            if (noNotifications) {
                noNotifications.style.display = 'flex';
            }
            badge.style.display = 'none';
            return;
        }
        
        // Contar notificaciones no leídas
        const unreadCount = notifications.filter(n => !n.read).length;
        badge.textContent = unreadCount;
        badge.style.display = unreadCount > 0 ? 'flex' : 'none';
        
        // Mostrar notificaciones
        notifications.forEach(notification => {
            const notificationElement = document.createElement('div');
            notificationElement.className = `notification-item ${notification.read ? '' : 'unread'} ${notification.type}`;
            notificationElement.innerHTML = `
                <div class="notification-content">
                    <div class="notification-title">${notification.title}</div>
                    <div class="notification-message">${notification.message}</div>
                    <div class="notification-time">${new Date(notification.timestamp).toLocaleTimeString()}</div>
                </div>
            `;
            notificationsList.appendChild(notificationElement);
        });
    }
}

// Función para limpiar todas las notificaciones
function clearNotifications() {
    const notificationsList = document.getElementById('notificationsList');
    const noNotifications = document.getElementById('noNotifications');
    const badge = document.getElementById('notificationBadge');
    
    if (notificationsList && noNotifications && badge) {
        notificationsList.innerHTML = '';
        noNotifications.style.display = 'flex';
        badge.textContent = '0';
        badge.style.display = 'none';
        
        // Limpiar notificaciones en localStorage
        localStorage.removeItem('notifications');
    }
}

// Inicializar eventos de notificaciones
document.addEventListener('DOMContentLoaded', function() {
    // Cargar notificaciones al iniciar
    loadNotifications();
    
    // Inicializar el icono de notificaciones
    const notificationsToggle = document.getElementById('notificationsToggle');
    const notificationsPanel = document.getElementById('notificationsPanel');
    const clearNotificationsBtn = document.getElementById('clearNotifications');
    
    if (notificationsToggle && notificationsPanel) {
        // Asegurar que el panel esté cerrado inicialmente
        notificationsPanel.classList.remove('active');
        
        // Evento para limpiar notificaciones
        if (clearNotificationsBtn) {
            clearNotificationsBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                clearNotifications();
            });
        }
        
        // Cerrar panel al hacer click fuera
        document.addEventListener('click', function(e) {
            if (!notificationsPanel.contains(e.target) && !notificationsToggle.contains(e.target)) {
                notificationsPanel.classList.remove('active');
            }
        });
        
        // Cerrar panel con la tecla Escape
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && notificationsPanel.classList.contains('active')) {
                notificationsPanel.classList.remove('active');
            }
        });
    }
    
    // Agregar notificación de prueba si no hay ninguna
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    if (notifications.length === 0) {
        addNotification(
            'Bienvenido al Sistema',
            'Gracias por usar nuestro sistema de quejas y sugerencias.',
            'info'
        );
    }
}); 