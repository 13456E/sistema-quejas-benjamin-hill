class HistorialManager {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 5;
        this.totalItems = 0;
        this.filteredItems = [];
        this.initializeElements();
        this.initializeEventListeners();
        this.loadHistorial();
    }

    initializeElements() {
        // Elementos de filtrado y búsqueda
        this.searchInput = document.getElementById('searchInput');
        this.typeFilter = document.getElementById('typeFilter');
        this.statusFilter = document.getElementById('statusFilter');
        this.dateFilter = document.getElementById('dateFilter');
        
        // Elementos de la lista y paginación
        this.historialList = document.getElementById('historialList');
        this.prevPage = document.getElementById('prevPage');
        this.nextPage = document.getElementById('nextPage');
        this.currentPageSpan = document.getElementById('currentPage');
        this.totalPagesSpan = document.getElementById('totalPages');

        // Elementos del menú y notificaciones
        this.menuToggle = document.getElementById('menuToggle');
        this.sideMenu = document.getElementById('sideMenu');
        this.menuOverlay = document.getElementById('menuOverlay');
        this.notificationsToggle = document.getElementById('notificationsToggle');
        this.notificationsPanel = document.getElementById('notificationsPanel');
        this.notificationBadge = document.getElementById('notificationBadge');
    }

    initializeEventListeners() {
        // Eventos de filtrado
        this.searchInput.addEventListener('input', () => this.filterAndLoad());
        this.typeFilter.addEventListener('change', () => this.filterAndLoad());
        this.statusFilter.addEventListener('change', () => this.filterAndLoad());
        this.dateFilter.addEventListener('change', () => this.filterAndLoad());

        // Eventos de paginación
        this.prevPage.addEventListener('click', () => this.changePage(-1));
        this.nextPage.addEventListener('click', () => this.changePage(1));

        // Eventos del menú
        this.menuToggle.addEventListener('click', () => this.toggleMenu());
        this.menuOverlay.addEventListener('click', () => this.closeMenu());

        // Eventos de notificaciones
        this.notificationsToggle.addEventListener('click', () => this.toggleNotifications());
    }

    toggleMenu() {
        this.sideMenu.classList.toggle('active');
        this.menuOverlay.classList.toggle('active');
    }

    closeMenu() {
        this.sideMenu.classList.remove('active');
        this.menuOverlay.classList.remove('active');
    }

    toggleNotifications() {
        this.notificationsPanel.classList.toggle('active');
    }

    async loadHistorial() {
        try {
            // Obtener historial del localStorage
            let historial = JSON.parse(localStorage.getItem('historial'));
            
            // Si no hay datos, crear datos de ejemplo
            if (!historial || historial.length === 0) {
                historial = [
                    {
                        id: '1',
                        titulo: 'Reporte de Bache en Calle Principal',
                        descripcion: 'Se reportó un bache de considerables dimensiones en la calle principal del centro, causando problemas de tránsito.',
                        tipo: 'quejas',
                        estado: 'completado',
                        fecha: '2024-03-15'
                    },
                    {
                        id: '2',
                        titulo: 'Sugerencia para Mejora de Alumbrado',
                        descripcion: 'Propuesta para instalar luminarias LED en el parque central para mejorar la seguridad y reducir el consumo energético.',
                        tipo: 'sugerencias',
                        estado: 'pendiente',
                        fecha: '2024-03-10'
                    },
                    {
                        id: '3',
                        titulo: 'Reporte de Ruido Excesivo',
                        descripcion: 'Queja sobre niveles de ruido excesivos durante la noche en la zona residencial.',
                        tipo: 'quejas',
                        estado: 'cancelado',
                        fecha: '2024-03-05'
                    }
                ];
                localStorage.setItem('historial', JSON.stringify(historial));
            }
            
            this.totalItems = historial.length;
            this.filteredItems = [...historial];
            
            this.applyFilters();
            this.updatePagination();
            this.renderHistorial();
            this.updateNotificationBadge();
        } catch (error) {
            console.error('Error al cargar el historial:', error);
            this.showError('Error al cargar el historial');
        }
    }

    updateNotificationBadge() {
        const pendientes = this.filteredItems.filter(item => item.estado === 'pendiente').length;
        this.notificationBadge.textContent = pendientes;
        this.notificationBadge.style.display = pendientes > 0 ? 'block' : 'none';
    }

    applyFilters() {
        const searchTerm = this.searchInput.value.toLowerCase();
        const typeFilter = this.typeFilter.value;
        const statusFilter = this.statusFilter.value;
        const dateFilter = this.dateFilter.value;

        this.filteredItems = this.filteredItems.filter(item => {
            const matchesSearch = item.titulo.toLowerCase().includes(searchTerm) ||
                                item.descripcion.toLowerCase().includes(searchTerm);
            const matchesType = typeFilter === 'todos' || item.tipo === typeFilter;
            const matchesStatus = statusFilter === 'todos' || item.estado === statusFilter;
            
            return matchesSearch && matchesType && matchesStatus;
        });

        if (dateFilter === 'recientes') {
            this.filteredItems.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        } else {
            this.filteredItems.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
        }
    }

    filterAndLoad() {
        this.currentPage = 1;
        this.applyFilters();
        this.updatePagination();
        this.renderHistorial();
        this.updateNotificationBadge();
    }

    changePage(delta) {
        const newPage = this.currentPage + delta;
        if (newPage >= 1 && newPage <= Math.ceil(this.filteredItems.length / this.itemsPerPage)) {
            this.currentPage = newPage;
            this.updatePagination();
            this.renderHistorial();
        }
    }

    updatePagination() {
        const totalPages = Math.ceil(this.filteredItems.length / this.itemsPerPage);
        this.currentPageSpan.textContent = this.currentPage;
        this.totalPagesSpan.textContent = totalPages;
        
        this.prevPage.disabled = this.currentPage === 1;
        this.nextPage.disabled = this.currentPage === totalPages || totalPages === 0;
    }

    renderHistorial() {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const itemsToShow = this.filteredItems.slice(startIndex, endIndex);

        if (itemsToShow.length === 0) {
            this.historialList.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <p>No se encontraron resultados</p>
                </div>
            `;
            return;
        }

        this.historialList.innerHTML = itemsToShow.map(item => `
            <div class="historial-item">
                <div class="historial-item-header">
                    <h3 class="historial-item-title">${item.titulo}</h3>
                    <span class="historial-item-date">${this.formatDate(item.fecha)}</span>
                </div>
                <div class="historial-item-content">
                    <p>${item.descripcion}</p>
                </div>
                <div class="historial-item-footer">
                    <span class="historial-item-status status-${item.estado.toLowerCase()}">
                        ${this.getStatusText(item.estado)}
                    </span>
                    <button class="historial-item-button" onclick="historialManager.viewDetails('${item.id}')">
                        Ver detalles
                    </button>
                </div>
            </div>
        `).join('');
    }

    formatDate(dateString) {
        const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('es-MX', options);
    }

    getStatusText(status) {
        const statusMap = {
            'completado': 'Completado',
            'pendiente': 'En revisión',
            'cancelado': 'Cancelado'
        };
        return statusMap[status.toLowerCase()] || status;
    }

    viewDetails(itemId) {
        // Redirigir a la página de historial
        window.location.href = 'historial.html';
    }

    showError(message) {
        // Implementar lógica para mostrar errores
        console.error(message);
        // Aquí puedes mostrar un toast o un modal de error
    }
}

// Inicializar el gestor de historial cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.historialManager = new HistorialManager();
}); 