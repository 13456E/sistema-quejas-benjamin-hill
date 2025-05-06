// Variables globales
let currentPage = 1;
let totalPages = 1;
let complaints = [];
let filteredComplaints = [];
let currentFilters = {
    status: 'all',
    date: 'all',
    sort: 'newest',
    search: ''
};

// Elementos del DOM
const quejasContainer = document.getElementById('quejasContainer');
const loadingSpinner = document.getElementById('loadingSpinner');
const noResults = document.getElementById('noResults');
const searchInput = document.getElementById('searchInput');
const filtersPanel = document.getElementById('filtersPanel');
const openFiltersBtn = document.getElementById('openFilters');
const closeFiltersBtn = document.getElementById('closeFilters');
const applyFiltersBtn = document.getElementById('applyFilters');
const resetFiltersBtn = document.getElementById('resetFilters');
const statusFilter = document.getElementById('statusFilter');
const dateFilter = document.getElementById('dateFilter');
const sortFilter = document.getElementById('sortFilter');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const pageInfo = document.getElementById('pageInfo');

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Verificar autenticación
    if (!AuthUtils.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    const complaintsList = document.getElementById('complaintsList');
    const userData = AuthUtils.getUserData();

    // Cargar quejas del usuario
    loadComplaints();

    function loadComplaints() {
        const complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
        const userComplaints = complaints.filter(c => c.usuario_id === userData.id);

        if (userComplaints.length === 0) {
            complaintsList.innerHTML = `
                <div class="no-complaints">
                    <i class="fas fa-info-circle"></i>
                    <p>No tienes quejas o sugerencias registradas</p>
                </div>
            `;
            return;
        }

        complaintsList.innerHTML = userComplaints.map(complaint => `
            <div class="complaint-card">
                <div class="complaint-header">
                    <span class="complaint-id">#${complaint.id}</span>
                    <span class="complaint-type ${complaint.tipo}">${complaint.tipo}</span>
                    <span class="complaint-status ${complaint.estado}">${complaint.estado}</span>
                </div>
                <div class="complaint-body">
                    <p class="complaint-description">${complaint.descripcion}</p>
                    <div class="complaint-details">
                        <span class="complaint-date">
                            <i class="fas fa-calendar"></i>
                            ${new Date(complaint.fecha_creacion).toLocaleDateString()}
                        </span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    loadComplaints();
    setupEventListeners();
});

function setupEventListeners() {
    // Búsqueda
    searchInput.addEventListener('input', debounce(handleSearch, 300));

    // Filtros
    openFiltersBtn.addEventListener('click', () => {
        filtersPanel.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    closeFiltersBtn.addEventListener('click', () => {
        filtersPanel.classList.remove('active');
        document.body.style.overflow = '';
    });

    applyFiltersBtn.addEventListener('click', applyFilters);
    resetFiltersBtn.addEventListener('click', resetFilters);

    // Paginación
    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            updatePagination();
            displayComplaints();
        }
    });

    nextPageBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            updatePagination();
            displayComplaints();
        }
    });
}

// Funciones principales
async function loadComplaints() {
    try {
        loadingSpinner.style.display = 'flex';
        noResults.style.display = 'none';

        // Simulación de carga de datos desde una API
        const response = await fetch('/api/complaints');
        complaints = await response.json();
        
        applyFilters();
    } catch (error) {
        console.error('Error al cargar las quejas:', error);
        showError('No se pudieron cargar las quejas. Por favor, intenta de nuevo más tarde.');
    } finally {
        loadingSpinner.style.display = 'none';
    }
}

function applyFilters() {
    currentFilters.status = statusFilter.value;
    currentFilters.date = dateFilter.value;
    currentFilters.sort = sortFilter.value;
    currentFilters.search = searchInput.value.toLowerCase();

    filteredComplaints = complaints.filter(complaint => {
        const matchesStatus = currentFilters.status === 'all' || complaint.status === currentFilters.status;
        const matchesSearch = complaint.folio.toLowerCase().includes(currentFilters.search) ||
                            complaint.title.toLowerCase().includes(currentFilters.search) ||
                            complaint.description.toLowerCase().includes(currentFilters.search);
        
        let matchesDate = true;
        if (currentFilters.date !== 'all') {
            const complaintDate = new Date(complaint.date);
            const today = new Date();
            
            switch (currentFilters.date) {
                case 'today':
                    matchesDate = complaintDate.toDateString() === today.toDateString();
                    break;
                case 'week':
                    const weekAgo = new Date(today);
                    weekAgo.setDate(today.getDate() - 7);
                    matchesDate = complaintDate >= weekAgo;
                    break;
                case 'month':
                    const monthAgo = new Date(today);
                    monthAgo.setMonth(today.getMonth() - 1);
                    matchesDate = complaintDate >= monthAgo;
                    break;
            }
        }

        return matchesStatus && matchesSearch && matchesDate;
    });

    // Ordenar quejas
    filteredComplaints.sort((a, b) => {
        switch (currentFilters.sort) {
            case 'newest':
                return new Date(b.date) - new Date(a.date);
            case 'oldest':
                return new Date(a.date) - new Date(b.date);
            case 'most_viewed':
                return b.views - a.views;
            default:
                return 0;
        }
    });

    currentPage = 1;
    updatePagination();
    displayComplaints();
    closeFiltersPanel();
}

function resetFilters() {
    statusFilter.value = 'all';
    dateFilter.value = 'all';
    sortFilter.value = 'newest';
    searchInput.value = '';
    applyFilters();
}

function displayComplaints() {
    const itemsPerPage = 5;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentComplaints = filteredComplaints.slice(startIndex, endIndex);

    quejasContainer.innerHTML = '';

    if (currentComplaints.length === 0) {
        noResults.style.display = 'flex';
        return;
    }

    currentComplaints.forEach(complaint => {
        const complaintCard = createComplaintCard(complaint);
        quejasContainer.appendChild(complaintCard);
    });
}

function createComplaintCard(complaint) {
    const card = document.createElement('div');
    card.className = 'queja-card';
    card.innerHTML = `
        <div class="queja-header">
            <div class="queja-info">
                <span class="folio">Folio: #${complaint.folio}</span>
                <span class="fecha">${formatDate(complaint.date)}</span>
            </div>
            <div class="status-badge status-${complaint.status}">
                <i class="fas ${getStatusIcon(complaint.status)}"></i>
                ${getStatusText(complaint.status)}
            </div>
        </div>
        <div class="queja-content">
            <h3>${complaint.title}</h3>
            <p>${complaint.description}</p>
        </div>
        <div class="queja-footer">
            <div class="queja-stats">
                <span class="stat">
                    <i class="fas fa-eye"></i>
                    ${complaint.views} vistas
                </span>
                <span class="stat">
                    <i class="fas fa-comment"></i>
                    ${complaint.comments} comentarios
                </span>
            </div>
            <button class="view-details-btn" onclick="viewComplaintDetails('${complaint.id}')">
                Ver Detalles
                <i class="fas fa-chevron-right"></i>
            </button>
        </div>
    `;
    return card;
}

function updatePagination() {
    const itemsPerPage = 5;
    totalPages = Math.ceil(filteredComplaints.length / itemsPerPage);

    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;
    pageInfo.textContent = `Página ${currentPage} de ${totalPages || 1}`;
}

// Funciones auxiliares
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function formatDate(dateString) {
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-MX', options);
}

function getStatusIcon(status) {
    switch (status) {
        case 'pending':
            return 'fa-clock';
        case 'completed':
            return 'fa-check-circle';
        case 'cancelled':
            return 'fa-times-circle';
        default:
            return 'fa-question-circle';
    }
}

function getStatusText(status) {
    switch (status) {
        case 'pending':
            return 'En Proceso';
        case 'completed':
            return 'Resuelto';
        case 'cancelled':
            return 'Cancelado';
        default:
            return 'Desconocido';
    }
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
    `;
    quejasContainer.appendChild(errorDiv);
}

function viewComplaintDetails(complaintId) {
    // Redirigir a la página de detalles de la queja
    window.location.href = `/queja-detalle.html?id=${complaintId}`;
}

function closeFiltersPanel() {
    filtersPanel.classList.remove('active');
    document.body.style.overflow = '';
} 