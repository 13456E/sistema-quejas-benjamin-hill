// Funciones para manejar registros
const RecordsManager = {
    // Obtener todos los registros
    getRecords: () => {
        const records = JSON.parse(localStorage.getItem('records')) || [];
        console.log('Registros obtenidos de localStorage:', records);
        return records;
    },

    // Guardar un nuevo registro
    saveRecord: (record) => {
        try {
            console.log('Intentando guardar registro:', record);
            
            // Verificar si hay usuario logueado
            const userData = AuthUtils.getUserData();
            if (!userData) {
                console.error('No hay usuario logueado');
                return false;
            }
            console.log('Usuario logueado:', userData);

            // Obtener registros existentes
            const records = RecordsManager.getRecords();
            console.log('Registros existentes:', records);

            // Crear nuevo registro
            const newRecord = {
                id: Date.now(),
                type: record.type,
                title: record.title || record.subject || 'Sin título',
                description: record.description || record.message || '',
                category: record.category || '',
                area: record.area || '',
                department: record.department || '',
                location: record.location || '',
                status: 'pendiente',
                date: new Date().toISOString(),
                userId: userData.id,
                userName: userData.name,
                userEmail: userData.email,
                userPhone: userData.telefono,
                comments: []
            };

            console.log('Nuevo registro creado:', newRecord);

            // Agregar el nuevo registro
            records.push(newRecord);

            // Guardar en localStorage
            localStorage.setItem('records', JSON.stringify(records));
            console.log('Registros guardados en localStorage:', records);

            // Actualizar estadísticas del usuario
            RecordsManager.updateUserStats(record.type);

            return newRecord;
        } catch (error) {
            console.error('Error al guardar el registro:', error);
            return false;
        }
    },

    // Actualizar estadísticas del usuario
    updateUserStats: (type) => {
        try {
            const users = JSON.parse(localStorage.getItem('users')) || [];
            const userData = AuthUtils.getUserData();
            
            if (!userData) return;
            
            const userIndex = users.findIndex(u => u.id === userData.id);
            if (userIndex === -1) return;
            
            if (type === 'queja') {
                users[userIndex].quejasCount = (users[userIndex].quejasCount || 0) + 1;
            } else if (type === 'sugerencia') {
                users[userIndex].sugerenciasCount = (users[userIndex].sugerenciasCount || 0) + 1;
            }
            
            localStorage.setItem('users', JSON.stringify(users));
            AuthUtils.updateUserData(users[userIndex]);
        } catch (error) {
            console.error('Error al actualizar estadísticas:', error);
        }
    },

    // Verificar si hay registros
    hasRecords: () => {
        const records = RecordsManager.getRecords();
        return records.length > 0;
    },

    // Obtener registros por tipo
    getRecordsByType: (type) => {
        const records = RecordsManager.getRecords();
        return records.filter(record => record.type === type);
    },

    // Obtener registros del usuario actual
    getUserRecords: () => {
        const records = RecordsManager.getRecords();
        const userData = AuthUtils.getUserData();
        
        if (!userData) return [];
        
        return records.filter(record => record.userId === userData.id);
    },

    // Agregar comentario a un registro
    addComment: (recordId, comment) => {
        try {
            const records = RecordsManager.getRecords();
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            
            if (!currentUser) return false;
            
            const recordIndex = records.findIndex(r => r.id === recordId);
            if (recordIndex === -1) return false;
            
            const newComment = {
                id: Date.now(),
                author: currentUser.name,
                content: comment,
                date: new Date().toISOString()
            };
            
            if (!records[recordIndex].comments) {
                records[recordIndex].comments = [];
            }
            
            records[recordIndex].comments.push(newComment);
            localStorage.setItem('records', JSON.stringify(records));
            
            return newComment;
        } catch (error) {
            console.error('Error al agregar comentario:', error);
            return false;
        }
    },

    // Actualizar estado de un registro
    updateRecordStatus: (recordId, newStatus) => {
        try {
            const records = RecordsManager.getRecords();
            const recordIndex = records.findIndex(r => r.id === recordId);
            
            if (recordIndex === -1) return false;
            
            records[recordIndex].status = newStatus;
            localStorage.setItem('records', JSON.stringify(records));
            
            return true;
        } catch (error) {
            console.error('Error al actualizar estado:', error);
            return false;
        }
    }
};

// Funciones de navegación
function navigateTo(page) {
    window.location.href = `${page}.html`;
}

// Manejo del menú inferior
document.addEventListener('DOMContentLoaded', function() {
    // Navegación inferior
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            navigateTo(page);
        });
    });

    // Menú superior
    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            const menu = document.getElementById('menu');
            if (menu) {
                menu.classList.toggle('active');
            }
        });
    }

    // Botón de retroceso
    const backButton = document.querySelector('.back-button');
    if (backButton) {
        backButton.addEventListener('click', function() {
            window.history.back();
        });
    }
});

// Función para mostrar notificaciones
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Función para validar formularios
function validateForm(formData) {
    const errors = [];
    
    if (!formData.title || formData.title.trim() === '') {
        errors.push('El título es requerido');
    }
    
    if (!formData.description || formData.description.trim() === '') {
        errors.push('La descripción es requerida');
    }
    
    if (!formData.location || formData.location.trim() === '') {
        errors.push('La ubicación es requerida');
    }
    
    if (!formData.department || formData.department.trim() === '') {
        errors.push('El departamento es requerido');
    }
    
    return errors;
}

// Función para manejar el envío de formularios
function handleFormSubmit(formId, successMessage) {
    const form = document.getElementById(formId);
    if (!form) return;

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = {
            title: form.querySelector('[name="title"]').value,
            description: form.querySelector('[name="description"]').value,
            location: form.querySelector('[name="location"]').value,
            department: form.querySelector('[name="department"]').value
        };

        const errors = validateForm(formData);
        
        if (errors.length > 0) {
            errors.forEach(error => {
                showNotification(error, 'error');
            });
            return;
        }

        // Aquí iría la lógica para enviar los datos al servidor
        // Por ahora solo mostramos un mensaje de éxito
        showNotification(successMessage, 'success');
        
        // Redirigir al historial después de 2 segundos
        setTimeout(() => {
            navigateTo('historial');
        }, 2000);
    });
} 