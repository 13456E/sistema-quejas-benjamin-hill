// Definir RecordsManager como una variable global
window.RecordsManager = {
    STORAGE_KEY: 'records',

    getRecords: function() {
        try {
            const records = localStorage.getItem(this.STORAGE_KEY);
            return records ? JSON.parse(records) : [];
        } catch (error) {
            console.error('Error al obtener registros:', error);
            return [];
        }
    },

    saveRecord: function(record) {
        try {
            const records = this.getRecords();
            record.id = Date.now().toString(); // ID único basado en timestamp
            records.push(record);
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(records));
            return record;
        } catch (error) {
            console.error('Error al guardar registro:', error);
            return null;
        }
    },

    updateRecord: function(recordId, updates) {
        try {
            const records = this.getRecords();
            const index = records.findIndex(r => r.id === recordId);
            if (index !== -1) {
                records[index] = { ...records[index], ...updates };
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(records));
                return records[index];
            }
            return null;
        } catch (error) {
            console.error('Error al actualizar registro:', error);
            return null;
        }
    },

    deleteRecord: function(recordId) {
        try {
            const records = this.getRecords();
            const filteredRecords = records.filter(r => r.id !== recordId);
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredRecords));
            return true;
        } catch (error) {
            console.error('Error al eliminar registro:', error);
            return false;
        }
    },

    clearRecords: function() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            return true;
        } catch (error) {
            console.error('Error al limpiar registros:', error);
            return false;
        }
    }
}; 