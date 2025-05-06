document.addEventListener('DOMContentLoaded', () => {
    // Verificar autenticación
    if (!AuthUtils.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    const form = document.getElementById('sugerenciaForm');
    const submitBtn = form.querySelector('button[type="submit"]');
    const loadingSpinner = document.createElement('div');
    loadingSpinner.className = 'loading-spinner';
    loadingSpinner.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    // Event listeners
    form.addEventListener('submit', handleSubmit);

    async function handleSubmit(event) {
        event.preventDefault();
        
        try {
            // Mostrar indicador de carga
            submitBtn.disabled = true;
            submitBtn.appendChild(loadingSpinner);

            // Obtener datos del usuario
            const userData = AuthUtils.getUserData();
            console.log('Datos del usuario:', userData);
            
            if (!userData) {
                throw new Error('No hay usuario autenticado');
            }

            // Preparar datos de la sugerencia
            const suggestionData = {
                type: 'sugerencia',
                title: document.getElementById('titulo').value,
                description: document.getElementById('descripcion').value,
                category: document.getElementById('categoria').value,
                status: 'pendiente',
                date: new Date().toISOString(),
                userId: userData.id,
                userName: userData.name,
                userEmail: userData.email,
                userPhone: userData.telefono
            };

            console.log('Datos de la sugerencia:', suggestionData);

            // Guardar en localStorage usando RecordsManager
            const record = RecordsManager.saveRecord(suggestionData);
            console.log('Registro guardado:', record);

            if (record) {
                // Mostrar mensaje de éxito
                showToast('Sugerencia registrada exitosamente', 'success');
                
                // Limpiar el formulario
                form.reset();
                
                // Redirigir al historial después de 2 segundos
                setTimeout(() => {
                    window.location.href = 'historial.html';
                }, 2000);
            } else {
                throw new Error('Error al guardar la sugerencia');
            }

        } catch (error) {
            console.error('Error al registrar sugerencia:', error);
            showToast('Error al registrar la sugerencia: ' + error.message, 'error');
        } finally {
            // Restaurar botón
            submitBtn.disabled = false;
            submitBtn.removeChild(loadingSpinner);
        }
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
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}); 