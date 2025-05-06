// Clase para manejar las notificaciones
class NotificationSystem {
    constructor() {
        this.notifications = [];
        this.notificationIcon = document.getElementById('notificationsToggle');
        this.notificationsPanel = document.getElementById('notificationsPanel');
        this.notificationsList = document.getElementById('notificationsList');
        this.notificationBadge = document.getElementById('notificationBadge');
        this.noNotifications = document.getElementById('noNotifications');
        this.clearNotifications = document.getElementById('clearNotifications');
        this.filterButtons = document.querySelectorAll('.filter-btn');
        this.currentFilter = 'all';
        
        this.initializeEventListeners();
        this.loadNotifications();
        this.initializeAnimations();
        this.initializeWebSocket();
    }

    initializeEventListeners() {
        // Mostrar/ocultar panel de notificaciones
        this.notificationIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleNotificationsPanel();
        });

        // Cerrar panel al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (!this.notificationIcon.contains(e.target) && 
                !this.notificationsPanel.contains(e.target)) {
                this.notificationsPanel.classList.remove('active');
            }
        });

        // Limpiar todas las notificaciones
        this.clearNotifications.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm('¿Estás seguro de que deseas eliminar todas las notificaciones?')) {
                this.clearAllNotifications();
                this.showToast('Todas las notificaciones han sido eliminadas', 'success');
            }
        });

        // Filtros de notificaciones
        this.filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                const filter = button.dataset.filter;
                this.setFilter(filter);
            });
        });

        // Eventos de teclado
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.notificationsPanel.classList.contains('active')) {
                this.notificationsPanel.classList.remove('active');
            }
        });
    }

    initializeWebSocket() {
        // Simulación de WebSocket para notificaciones en tiempo real
        setInterval(() => {
            if (Math.random() > 0.7) { // 30% de probabilidad de nueva notificación
                this.addNotification({
                    type: ['queja', 'sugerencia', 'contacto', 'sistema'][Math.floor(Math.random() * 4)],
                    message: 'Nueva notificación de prueba',
                    status: ['pendiente', 'completado', 'cancelado'][Math.floor(Math.random() * 3)]
                });
            }
        }, 30000); // Cada 30 segundos
    }

    setFilter(filter) {
        this.currentFilter = filter;
        this.filterButtons.forEach(button => {
            button.classList.toggle('active', button.dataset.filter === filter);
        });
        this.updateNotificationsList();
    }

    addNotification(notification) {
        const newNotification = {
            id: Date.now().toString(),
            type: notification.type,
            message: notification.message,
            status: notification.status,
            date: new Date().toISOString(),
            read: false
        };

        this.notifications.unshift(newNotification);
        this.saveNotifications();
        this.updateNotificationsList();
        this.updateBadge();
        
        // Mostrar notificación push si el panel está cerrado
        if (!this.notificationsPanel.classList.contains('active')) {
            this.showPushNotification(newNotification);
        }
    }

    showPushNotification(notification) {
        if (Notification.permission === "granted") {
            new Notification(this.getNotificationTitle(notification.type), {
                body: notification.message,
                icon: '/path/to/icon.png'
            });
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    this.showPushNotification(notification);
                }
            });
        }
    }

    updateNotificationsList() {
        if (this.notifications.length === 0) {
            this.noNotifications.style.display = 'flex';
            this.notificationsList.innerHTML = '';
            return;
        }

        this.noNotifications.style.display = 'none';
        
        // Filtrar notificaciones según el filtro actual
        const filteredNotifications = this.notifications.filter(notification => {
            if (this.currentFilter === 'all') return true;
            if (this.currentFilter === 'unread') return !notification.read;
            if (this.currentFilter === 'read') return notification.read;
            return notification.type === this.currentFilter;
        });

        this.notificationsList.innerHTML = filteredNotifications
            .map(notification => this.createNotificationCard(notification))
            .join('');

        // Agregar eventos a las tarjetas
        this.notificationsList.querySelectorAll('.notification-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = card.dataset.id;
                this.markAsRead(id);
                card.classList.remove('unread');
                this.updateBadge();
            });
        });
    }

    createNotificationCard(notification) {
        return `
            <div class="notification-card ${notification.read ? '' : 'unread'}" data-id="${notification.id}">
                <div class="notification-icon">
                    <i class="fas ${this.getNotificationIcon(notification.type)}"></i>
                </div>
                <div class="notification-content">
                    <h3>${this.getNotificationTitle(notification.type)}</h3>
                    <p>${notification.message}</p>
                    <div class="notification-footer">
                        <span>${this.formatDate(notification.date)}</span>
                        <span class="notification-status ${notification.status}">${this.getStatusText(notification.status)}</span>
                    </div>
                </div>
                <div class="notification-actions">
                    <button class="notification-action-btn mark-read" title="Marcar como leído">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="notification-action-btn delete" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;

        // Si es menos de 1 minuto
        if (diff < 60000) {
            return 'Ahora mismo';
        }
        // Si es menos de 1 hora
        if (diff < 3600000) {
            const minutes = Math.floor(diff / 60000);
            return `Hace ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
        }
        // Si es menos de 24 horas
        if (diff < 86400000) {
            const hours = Math.floor(diff / 3600000);
            return `Hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
        }
        // Si es más de 24 horas
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }

    updateBadge() {
        const unreadCount = this.notifications.filter(n => !n.read).length;
        this.notificationBadge.textContent = unreadCount;
        this.notificationBadge.style.display = unreadCount > 0 ? 'flex' : 'none';
        
        // Animar el badge si hay notificaciones no leídas
        if (unreadCount > 0) {
            this.notificationIcon.classList.add('has-notifications');
            document.title = `(${unreadCount}) Sistema de Quejas y Sugerencias`;
        } else {
            this.notificationIcon.classList.remove('has-notifications');
            document.title = 'Sistema de Quejas y Sugerencias';
        }
    }

    markAsRead(id) {
        const notification = this.notifications.find(n => n.id === id);
        if (notification && !notification.read) {
            notification.read = true;
            this.saveNotifications();
            this.updateNotificationsList();
            this.updateBadge();
            this.showToast('Notificación marcada como leída', 'info');
        }
    }

    deleteNotification(id) {
        this.notifications = this.notifications.filter(n => n.id !== id);
        this.saveNotifications();
        this.updateNotificationsList();
        this.updateBadge();
        this.showToast('Notificación eliminada', 'success');
    }

    markAllAsRead() {
        let updated = false;
        this.notifications.forEach(notification => {
            if (!notification.read) {
                notification.read = true;
                updated = true;
            }
        });

        if (updated) {
            this.saveNotifications();
            this.updateNotificationsList();
            this.updateBadge();
            this.showToast('Todas las notificaciones marcadas como leídas', 'success');
        }
    }

    clearAllNotifications() {
        this.notifications = [];
        this.saveNotifications();
        this.updateNotificationsList();
        this.updateBadge();
    }

    saveNotifications() {
        localStorage.setItem('notifications', JSON.stringify(this.notifications));
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <i class="fas ${this.getToastIcon(type)}"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(toast);

        // Animar entrada
        setTimeout(() => toast.classList.add('show'), 100);

        // Remover después de 3 segundos
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    getToastIcon(type) {
        const icons = {
            'success': 'fa-check-circle',
            'error': 'fa-exclamation-circle',
            'info': 'fa-info-circle',
            'warning': 'fa-exclamation-triangle'
        };
        return icons[type] || 'fa-info-circle';
    }

    getNotificationIcon(type) {
        const icons = {
            'queja': 'fa-file-alt',
            'sugerencia': 'fa-lightbulb',
            'contacto': 'fa-phone',
            'sistema': 'fa-cog'
        };
        return icons[type] || 'fa-bell';
    }

    getNotificationTitle(type) {
        const titles = {
            'queja': 'Nueva Queja',
            'sugerencia': 'Nueva Sugerencia',
            'contacto': 'Nuevo Contacto',
            'sistema': 'Notificación del Sistema'
        };
        return titles[type] || 'Notificación';
    }

    getStatusText(status) {
        const statusTexts = {
            'pendiente': 'Pendiente',
            'completado': 'Completado',
            'cancelado': 'Cancelado'
        };
        return statusTexts[status] || status;
    }

    toggleNotificationsPanel() {
        this.notificationsPanel.classList.toggle('active');
    }
}

// Inicializar el sistema de notificaciones
document.addEventListener('DOMContentLoaded', () => {
    const notificationSystem = new NotificationSystem();
}); 