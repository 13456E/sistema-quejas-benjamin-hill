document.addEventListener('DOMContentLoaded', () => {
    // Verificar autenticación
    if (!AuthUtils.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    const form = document.getElementById('quejaForm');
    if (!form) {
        console.error('No se encontró el formulario de quejas');
        return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    if (!submitBtn) {
        console.error('No se encontró el botón de envío');
        return;
    }

    const loadingSpinner = document.createElement('div');
    loadingSpinner.className = 'loading-spinner';
    loadingSpinner.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    // Event listeners
    form.addEventListener('submit', handleSubmit);

    async function handleSubmit(event) {
        event.preventDefault();
        
        try {
            // Obtener elementos del formulario
            const titulo = document.getElementById('titulo');
            const descripcion = document.getElementById('descripcion');
            const ubicacion = document.getElementById('ubicacion');
            const departamento = document.getElementById('departamento');

            // Validar que existan los elementos
            if (!titulo || !descripcion || !ubicacion || !departamento) {
                throw new Error('No se encontraron todos los campos del formulario');
            }

            // Validar que tengan valores
            if (!titulo.value || !descripcion.value || !ubicacion.value || !departamento.value) {
                throw new Error('Por favor complete todos los campos');
            }

            // Mostrar indicador de carga
            submitBtn.disabled = true;
            submitBtn.appendChild(loadingSpinner);

            // Obtener datos del usuario
            const userData = AuthUtils.getUserData();
            console.log('Datos del usuario:', userData);
            
            if (!userData) {
                throw new Error('No hay usuario autenticado');
            }

            // Preparar datos de la queja
            const complaintData = {
                type: 'queja',
                title: titulo.value.trim(),
                description: descripcion.value.trim(),
                location: ubicacion.value.trim(),
                department: departamento.value.trim(),
                status: 'pendiente',
                date: new Date().toISOString(),
                comments: [],
                userId: userData.id,
                userName: userData.name,
                userEmail: userData.email,
                userPhone: userData.telefono
            };

            console.log('Datos de la queja a guardar:', complaintData);

            // Guardar usando RecordsManager
            const savedRecord = RecordsManager.saveRecord(complaintData);
            
            if (savedRecord) {
                console.log('Registro guardado exitosamente:', savedRecord);
                
                // Mostrar mensaje de éxito
                showToast('Queja registrada exitosamente', 'success');
                
                // Limpiar el formulario
                form.reset();
                
                // Redirigir al historial después de 2 segundos
                setTimeout(() => {
                    window.location.href = 'historial.html';
                }, 2000);
            } else {
                throw new Error('Error al guardar la queja');
            }

        } catch (error) {
            console.error('Error al registrar queja:', error);
            showToast(error.message, 'error');
        } finally {
            // Restaurar botón
            submitBtn.disabled = false;
            if (submitBtn.contains(loadingSpinner)) {
                submitBtn.removeChild(loadingSpinner);
            }
        }
    }

    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        // Agregar la clase show después de un pequeño delay para activar la transición
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        // Remover el toast después de 3 segundos
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}); 