// Variables globales
let currentPage = 1;
let totalPages = 1;
let currentFilters = {
    tipo: 'todos',
    estado: 'todos'
};

// Prueba simple de carga
alert('historial.js se está cargando');

// Elementos del DOM
const recordsList = document.getElementById('recordsList');
const loadingSpinner = document.getElementById('loadingSpinner');
const noResults = document.getElementById('noResults');
const pageInfo = document.getElementById('pageInfo');
const pageNumbers = document.getElementById('pageNumbers');
const prevPage = document.getElementById('prevPage');
const nextPage = document.getElementById('nextPage');
const totalRecordsBtn = document.getElementById('totalRecords');
const completedRecordsBtn = document.getElementById('completedRecords');
const quejasCountBtn = document.getElementById('quejasCount');
const sugerenciasCountBtn = document.getElementById('sugerenciasCount');
const contactosCountBtn = document.getElementById('contactosCount');
const clearHistoryBtn = document.getElementById('clearHistory');

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    alert('DOMContentLoaded se ejecutó');
    try {
        // Verificar datos en localStorage
        const currentUser = localStorage.getItem('current_user');
        const authToken = localStorage.getItem('auth_token');
        
        alert('Datos en localStorage:\n' + 
              'current_user: ' + (currentUser ? 'EXISTE' : 'NO EXISTE') + '\n' +
              'auth_token: ' + (authToken ? 'EXISTE' : 'NO EXISTE'));
        
        // Verificar AuthUtils
        if (typeof AuthUtils === 'undefined') {
            alert('ERROR: AuthUtils no está definido');
            return;
        }
        
        if (typeof AuthUtils.isAuthenticated !== 'function') {
            alert('ERROR: isAuthenticated no es una función');
            return;
        }
        
        // Verificar autenticación
        const isAuth = AuthUtils.isAuthenticated();
        alert('Resultado de isAuthenticated(): ' + isAuth);
        
        if (!isAuth) {
            alert('Redirigiendo a login.html porque no está autenticado');
            // Prevenir la redirección temporalmente para diagnóstico
            alert('NOTA: La redirección ha sido prevenida para diagnóstico');
            // window.location.href = 'login.html';
            return;
        }
        
        alert('Autenticación exitosa, cargando datos...');
        
        // Verificar si hay otros scripts que puedan estar causando la redirección
        const scripts = document.getElementsByTagName('script');
        alert('Scripts cargados:\n' + Array.from(scripts).map(s => s.src).join('\n'));
        
        loadComplaints();
        setupEventListeners();
    } catch (error) {
        alert('Error en el proceso de autenticación: ' + error.message);
    }
});

function setupEventListeners() {
    // Paginación
    prevPage.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            loadComplaints();
        }
    });

    nextPage.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            loadComplaints();
        }
    });

    // Botones de estadísticas
    totalRecordsBtn.addEventListener('click', () => {
        currentFilters.tipo = 'todos';
        currentFilters.estado = 'todos';
        updateActiveButton(totalRecordsBtn);
        loadComplaints();
    });

    completedRecordsBtn.addEventListener('click', () => {
        currentFilters.tipo = 'todos';
        currentFilters.estado = 'completado';
        updateActiveButton(completedRecordsBtn);
        loadComplaints();
    });

    quejasCountBtn.addEventListener('click', () => {
        currentFilters.tipo = 'queja';
        currentFilters.estado = 'todos';
        updateActiveButton(quejasCountBtn);
        loadComplaints();
    });

    sugerenciasCountBtn.addEventListener('click', () => {
        currentFilters.tipo = 'sugerencia';
        currentFilters.estado = 'todos';
        updateActiveButton(sugerenciasCountBtn);
        loadComplaints();
    });

    contactosCountBtn.addEventListener('click', () => {
        currentFilters.tipo = 'contacto';
        currentFilters.estado = 'todos';
        updateActiveButton(contactosCountBtn);
        loadComplaints();
    });

    // Botón de limpiar historial
    clearHistoryBtn.addEventListener('click', () => {
        if (confirm('¿Estás seguro de que deseas eliminar todo el historial? Esta acción no se puede deshacer.')) {
            clearHistory();
        }
    });
}

function clearHistory() {
    try {
        // Verificar que RecordsManager esté disponible
        if (!window.RecordsManager) {
            throw new Error('RecordsManager no está disponible');
        }

        // Limpiar el historial usando RecordsManager
        const success = window.RecordsManager.clearRecords();
        
        if (!success) {
            throw new Error('No se pudo limpiar el historial');
        }
        
        // Actualizar la interfaz
        showNoResults();
        updateStats([]);
        
        // Mostrar mensaje de éxito
        alert('El historial ha sido limpiado exitosamente.');
    } catch (error) {
        console.error('Error al limpiar el historial:', error);
        alert('Hubo un error al limpiar el historial. Por favor, intente nuevamente.');
    }
}

async function loadComplaints() {
    showLoading();
    try {
        // Obtener registros de localStorage usando RecordsManager
        const records = RecordsManager.getRecords();
        console.log('Registros cargados:', records);
        
        if (!records || records.length === 0) {
            showNoResults();
            updateStats([]);
            return;
        }

        // Aplicar filtros
        let filteredRecords = records.filter(record => {
            // Filtro por tipo
            if (currentFilters.tipo !== 'todos' && record.type !== currentFilters.tipo) {
                return false;
            }
            // Filtro por estado
            if (currentFilters.estado !== 'todos' && record.status !== currentFilters.estado) {
                return false;
            }
            return true;
        });

        // Ordenar por fecha (más recientes primero)
        filteredRecords.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Actualizar estadísticas con todos los registros
        updateStats(records);

        // Si no hay registros después de filtrar
        if (filteredRecords.length === 0) {
            showNoResults();
            return;
        }

        // Renderizar registros
        renderComplaints(filteredRecords);
        
        hideLoading();
    } catch (error) {
        console.error('Error al cargar registros:', error);
        showError('Error al cargar los registros');
        hideLoading();
    }
}

function renderComplaints(records) {
    if (!records || records.length === 0) {
        showNoResults();
        return;
    }

    recordsList.innerHTML = records.map(record => `
        <div class="record-card" data-id="${record.id}">
            <div class="record-header">
                <div class="record-type">
                    <i class="fas fa-${getTypeIcon(record.type)}"></i>
                    <span>${getTypeText(record.type)}</span>
                </div>
                <div class="record-date">
                    <i class="far fa-calendar-alt"></i>
                    <span>${formatDate(record.date)}</span>
                </div>
            </div>
            <div class="record-status">
                <div class="status-badge ${record.status}">
                    <i class="fas fa-${getStatusIcon(record.status)}"></i>
                    <span>${capitalizeFirst(record.status)}</span>
                </div>
            </div>
            <div class="record-content">
                <h3>
                    <i class="fas fa-${getTitleIcon(record.type)}"></i>
                    ${record.title}
                </h3>
                <p>${record.description}</p>
            </div>
            <div class="record-meta">
                ${record.location ? `
                    <div class="meta-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${record.location}</span>
                    </div>
                ` : ''}
                ${record.department ? `
                    <div class="meta-item">
                        <i class="fas fa-building"></i>
                        <span>${record.department}</span>
                    </div>
                ` : ''}
            </div>
            ${record.comments && record.comments.length > 0 ? `
                <div class="comments-section">
                    <h4>
                        <i class="fas fa-comments"></i>
                        Comentarios
                    </h4>
                    ${record.comments.map(comment => `
                        <div class="comment-item">
                            <div class="comment-header">
                                <div class="comment-author">
                                    <i class="fas fa-user"></i>
                                    <span>${comment.author}</span>
                                </div>
                                <div class="comment-date">
                                    <i class="far fa-clock"></i>
                                    <span>${comment.date}</span>
                                </div>
                            </div>
                            <div class="comment-content">
                                ${comment.content}
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        </div>
    `).join('');
}

function updateStats(records) {
    if (!records) return;

    // Contar total de registros
    const total = records.length;
    totalRecordsBtn.querySelector('.stat-number').textContent = `Total: ${total}`;

    // Contar registros completados
    const completed = records.filter(r => r.status === 'completado').length;
    completedRecordsBtn.querySelector('.stat-number').textContent = `Completados: ${completed}`;

    // Contar quejas
    const quejas = records.filter(r => r.type === 'queja').length;
    quejasCountBtn.querySelector('.stat-number').textContent = `Quejas: ${quejas}`;

    // Contar sugerencias
    const sugerencias = records.filter(r => r.type === 'sugerencia').length;
    sugerenciasCountBtn.querySelector('.stat-number').textContent = `Sugerencias: ${sugerencias}`;

    // Contar contactos
    const contactos = records.filter(r => r.type === 'contacto').length;
    contactosCountBtn.querySelector('.stat-number').textContent = `Contactos: ${contactos}`;
}

function updateActiveButton(activeButton) {
    // Remover la clase active de todos los botones
    const allButtons = document.querySelectorAll('.stat-item');
    allButtons.forEach(button => {
        button.classList.remove('active');
    });
    
    // Agregar la clase active al botón seleccionado
    if (activeButton) {
        activeButton.classList.add('active');
    }
}

function showLoading() {
    if (loadingSpinner) loadingSpinner.style.display = 'flex';
    if (recordsList) recordsList.style.display = 'none';
    if (noResults) noResults.style.display = 'none';
}

function hideLoading() {
    if (loadingSpinner) loadingSpinner.style.display = 'none';
    if (recordsList) recordsList.style.display = 'grid';
}

function showNoResults() {
    if (recordsList) recordsList.style.display = 'none';
    if (noResults) noResults.style.display = 'flex';
}

function showError(message) {
    console.error(message);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getTypeIcon(type) {
    switch(type) {
        case 'queja': return 'file-alt';
        case 'sugerencia': return 'lightbulb';
        case 'contacto': return 'phone';
        default: return 'file';
    }
}

function getStatusIcon(status) {
    switch(status) {
        case 'pendiente': return 'clock';
        case 'en-proceso': return 'spinner';
        case 'completado': return 'check-circle';
        case 'cancelado': return 'times-circle';
        default: return 'circle';
    }
}

function getTitleIcon(type) {
    switch(type) {
        case 'queja': return 'exclamation-circle';
        case 'sugerencia': return 'lightbulb';
        case 'contacto': return 'phone';
        default: return 'file';
    }
}

function getTypeText(type) {
    switch(type) {
        case 'queja': return 'Queja';
        case 'sugerencia': return 'Sugerencia';
        case 'contacto': return 'Contacto';
        default: return type;
    }
}

function capitalizeFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function updatePagination() {
    pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
    prevPage.disabled = currentPage === 1;
    nextPage.disabled = currentPage === totalPages;

    let pageNumbersHtml = '';
    const maxPages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(totalPages, startPage + maxPages - 1);

    if (endPage - startPage + 1 < maxPages) {
        startPage = Math.max(1, endPage - maxPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        pageNumbersHtml += `
            <button class="pagination-btn ${i === currentPage ? 'active' : ''}" 
                    onclick="goToPage(${i})">
                ${i}
            </button>
        `;
    }

    pageNumbers.innerHTML = pageNumbersHtml;
}

function goToPage(page) {
    currentPage = page;
    loadComplaints();
}

function showComplaintDetails(id) {
    const complaint = simulateGetComplaintDetails(id);
    
    // Actualizar detalles principales
    document.getElementById('modalFolio').textContent = complaint.folio;
    document.getElementById('modalDate').textContent = complaint.fecha;
    document.getElementById('modalTitle').textContent = complaint.titulo;
    document.getElementById('modalDescription').textContent = complaint.descripcion;

    // Actualizar estado con clase correspondiente
    const statusBadge = document.getElementById('modalStatus');
    statusBadge.textContent = complaint.estado;
    statusBadge.className = `modal-status-badge status-${complaint.estado.toLowerCase()}`;

    // Actualizar contador de comentarios
    document.getElementById('commentsCount').textContent = 
        `${complaint.comentarios.length} ${complaint.comentarios.length === 1 ? 'comentario' : 'comentarios'}`;

    // Cargar comentarios
    renderComments(complaint.comentarios);

    // Limpiar y enfocar el campo de comentario
    const commentInput = document.getElementById('commentInput');
    commentInput.value = '';
    commentInput.focus();

    // Mostrar modal con animación
    const modal = document.getElementById('complaintModal');
    modal.classList.add('active');
    setTimeout(() => {
        modal.querySelector('.modal-content').classList.add('active');
    }, 10);
}

function renderComments(comments) {
    const commentsList = document.getElementById('commentsList');
    commentsList.innerHTML = comments.map(comment => `
        <div class="comment">
            <div class="comment-header">
                <div class="comment-author">
                    <i class="fas fa-user-circle"></i>
                    <span>${comment.autor}</span>
                </div>
                <span class="comment-date">
                    <i class="fas fa-clock"></i>
                    ${comment.fecha}
                </span>
            </div>
            <div class="comment-content">
                <p>${comment.texto}</p>
            </div>
        </div>
    `).join('');
}

function handleCommentSubmit() {
    const commentInput = document.getElementById('commentInput');
    const commentText = commentInput.value.trim();
    
    if (!commentText) {
        // Mostrar mensaje de error
        commentInput.classList.add('error');
        setTimeout(() => {
            commentInput.classList.remove('error');
        }, 2000);
        return;
    }

    // Crear nuevo comentario
    const newComment = {
        autor: 'Usuario Actual',
        fecha: new Date().toLocaleDateString(),
        texto: commentText
    };

    // Agregar comentario a la lista
    const commentsList = document.getElementById('commentsList');
    const commentElement = document.createElement('div');
    commentElement.className = 'comment';
    commentElement.innerHTML = `
        <div class="comment-header">
            <div class="comment-author">
                <i class="fas fa-user-circle"></i>
                <span>${newComment.autor}</span>
            </div>
            <span class="comment-date">
                <i class="fas fa-clock"></i>
                ${newComment.fecha}
            </span>
        </div>
        <div class="comment-content">
            <p>${newComment.texto}</p>
        </div>
    `;

    // Agregar con animación
    commentElement.style.opacity = '0';
    commentsList.appendChild(commentElement);
    setTimeout(() => {
        commentElement.style.opacity = '1';
    }, 10);

    // Actualizar contador de comentarios
    const commentsCount = document.getElementById('commentsCount');
    const currentCount = parseInt(commentsCount.textContent);
    commentsCount.textContent = `${currentCount + 1} ${currentCount + 1 === 1 ? 'comentario' : 'comentarios'}`;

    // Limpiar y enfocar el campo de comentario
    commentInput.value = '';
    commentInput.focus();
}

function toggleNotifications() {
    notificationsPanel.classList.toggle('active');
    if (notificationsPanel.classList.contains('active')) {
        loadNotifications();
    }
}

function toggleMenu() {
    sideMenu.classList.add('active');
    menuOverlay.classList.add('active');
}

function closeSideMenu() {
    sideMenu.classList.remove('active');
    menuOverlay.classList.remove('active');
}

// Simulación de API (reemplazar con llamadas reales)
async function simulateApiCall() {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve({
                complaints: [
                    {
                        id: 1,
                        folio: '#QJ-2024-001',
                        fecha: '15/03/2024',
                        estado: 'Pendiente',
                        titulo: 'Reporte de Bache en Calle Principal',
                        descripcion: 'Se reportó un bache de considerables dimensiones en la calle principal del centro, causando problemas de tránsito.',
                        vistas: 120,
                        comentarios: 5
                    },
                    {
                        id: 2,
                        folio: '#SG-2024-002',
                        fecha: '10/03/2024',
                        estado: 'Completado',
                        titulo: 'Sugerencia para Mejora de Alumbrado',
                        descripcion: 'Propuesta para instalar luminarias LED en el parque central para mejorar la seguridad y reducir el consumo energético.',
                        vistas: 85,
                        comentarios: 3
                    }
                ],
                total: 2,
                completed: 1
            });
        }, 1000);
    });
}

function simulateGetComplaintDetails(id) {
    return {
        id: id,
        folio: '#QJ-2024-001',
        fecha: '15/03/2024',
        estado: 'Pendiente',
        titulo: 'Reporte de Bache en Calle Principal',
        descripcion: 'Se reportó un bache de considerables dimensiones en la calle principal del centro, causando problemas de tránsito.',
        comentarios: [
            {
                autor: 'Juan Pérez',
                fecha: '15/03/2024',
                texto: 'Gracias por reportar este problema. Ya lo hemos registrado y lo atenderemos pronto.'
            },
            {
                autor: 'María García',
                fecha: '16/03/2024',
                texto: 'También he notado este bache. Es peligroso para los conductores.'
            }
        ]
    };
}

// Función para inicializar el historial
function initHistorial() {
    // Verificar si el usuario está logueado
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    // Cargar registros iniciales
    loadRecords();

    // Configurar eventos de filtros
    setupFilters();

    // Configurar eventos de búsqueda
    setupSearch();

    // Configurar eventos de paginación
    setupPagination();
}

// Función para cargar y mostrar los registros
function loadRecords() {
    showLoading();
    try {
        // Simular llamada a API
        const records = sampleRecords.filter(record => {
            // Aplicar filtro de tipo
            if (currentFilters.tipo !== 'todos' && record.type !== currentFilters.tipo) {
                return false;
            }
            // Aplicar filtro de estado
            if (currentFilters.estado !== 'todos' && record.status !== currentFilters.estado) {
                return false;
            }
            return true;
        });

        displayFilteredRecords(records);
        updateStats(records);
    } catch (error) {
        console.error('Error al cargar registros:', error);
        showError('Error al cargar los registros. Por favor, intente nuevamente.');
    } finally {
        hideLoading();
    }
}

// Función para configurar los filtros
function setupFilters() {
    const tipoSelect = document.getElementById('tipo');
    const estadoSelect = document.getElementById('estado');
    const fechaSelect = document.getElementById('fecha');
    const applyFiltersBtn = document.querySelector('.apply-filters-btn');
    const resetFiltersBtn = document.querySelector('.reset-filters-btn');

    applyFiltersBtn.addEventListener('click', () => {
        const tipo = tipoSelect.value;
        const estado = estadoSelect.value;
        const fecha = fechaSelect.value;
        filterRecords(tipo, estado, fecha);
    });

    resetFiltersBtn.addEventListener('click', () => {
        tipoSelect.value = 'todos';
        estadoSelect.value = 'todos';
        fechaSelect.value = 'recientes';
        loadRecords();
    });
}

// Función para mostrar registros filtrados
function displayFilteredRecords(records) {
    const recordsList = document.getElementById('recordsList');
    
    if (records.length === 0) {
        recordsList.innerHTML = `
            <div class="no-records">
                <i class="fas fa-search"></i>
                <p>No se encontraron registros con los filtros seleccionados</p>
            </div>
        `;
        return;
    }

    recordsList.innerHTML = records.map(record => `
        <div class="record-card" style="border-left: 4px solid ${getTypeColor(record.type)}">
            <div class="record-header">
                <div class="record-type">
                    <i class="fas ${getTypeIcon(record.type)}"></i>
                    <span>${getTypeText(record.type)}</span>
                </div>
                <div class="record-date">${formatDate(record.date)}</div>
            </div>
            <div class="record-content">
                <h3>${record.title}</h3>
                <p>${record.description}</p>
                <div class="record-meta">
                    ${record.category ? `<span class="meta-item"><i class="fas fa-tag"></i> ${record.category}</span>` : ''}
                    ${record.department ? `<span class="meta-item"><i class="fas fa-building"></i> ${record.department}</span>` : ''}
                    ${record.location ? `<span class="meta-item"><i class="fas fa-map-pin"></i> ${record.location}</span>` : ''}
                </div>
                ${record.comments && record.comments.length > 0 ? `
                    <div class="comments-section">
                        <h4><i class="fas fa-comments"></i> Comentarios</h4>
                        ${record.comments.map(comment => `
                            <div class="comment-item">
                                <div class="comment-header">
                                    <span class="comment-author">${comment.author}</span>
                                    <span class="comment-date">${formatDate(comment.date)}</span>
                                </div>
                                <p class="comment-content">${comment.content}</p>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
            <div class="record-status">
                <span class="status-badge ${record.status}">${record.status}</span>
            </div>
        </div>
    `).join('');

    updateStats(records);
}

// Función para configurar la búsqueda
function setupSearch() {
    const searchInput = document.querySelector('.search-input');
    const searchButton = document.querySelector('.search-button');

    searchButton.addEventListener('click', () => {
        const searchTerm = searchInput.value.toLowerCase();
        searchRecords(searchTerm);
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const searchTerm = searchInput.value.toLowerCase();
            searchRecords(searchTerm);
        }
    });
}

// Función para buscar registros
function searchRecords(searchTerm) {
    const records = RecordsManager.getUserRecords();
    const filteredRecords = records.filter(record => 
        (record.title && record.title.toLowerCase().includes(searchTerm)) ||
        (record.description && record.description.toLowerCase().includes(searchTerm)) ||
        (record.subject && record.subject.toLowerCase().includes(searchTerm)) ||
        (record.message && record.message.toLowerCase().includes(searchTerm))
    );

    displayFilteredRecords(filteredRecords);
}

// Función para obtener el color según el tipo
function getTypeColor(type) {
    switch(type) {
        case 'queja':
            return '#ff6b6b';
        case 'sugerencia':
            return '#4ecdc4';
        case 'contacto':
            return '#45b7d1';
        default:
            return '#666';
    }
}

// Inicializar el historial cuando se carga la página
document.addEventListener('DOMContentLoaded', initHistorial); 