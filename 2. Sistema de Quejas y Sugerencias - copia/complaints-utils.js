class ComplaintsUtils {
    static STORAGE_KEY = 'complaints_data';
    static STATUS = {
        PENDING: 'Pendiente',
        IN_PROGRESS: 'En Proceso',
        COMPLETED: 'Completada',
        CANCELLED: 'Cancelada'
    };

    static generateFolio() {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        return `Q-${timestamp}-${random}`;
    }

    static saveComplaint(complaint) {
        try {
            const complaints = this.getAllComplaints();
            complaint.folio = this.generateFolio();
            complaint.createdAt = new Date().toISOString();
            complaint.status = this.STATUS.PENDING;
            complaint.updatedAt = new Date().toISOString();
            complaint.comments = complaint.comments || [];
            complaints.push(complaint);
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(complaints));
            return complaint;
        } catch (error) {
            console.error('Error al guardar la queja:', error);
            throw error;
        }
    }

    static getAllComplaints() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error al obtener las quejas:', error);
            return [];
        }
    }

    static getComplaintByFolio(folio) {
        const complaints = this.getAllComplaints();
        return complaints.find(c => c.folio === folio);
    }

    static updateComplaintStatus(folio, status) {
        try {
            const complaints = this.getAllComplaints();
            const index = complaints.findIndex(c => c.folio === folio);
            if (index !== -1) {
                complaints[index].status = status;
                complaints[index].updatedAt = new Date().toISOString();
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(complaints));
                return complaints[index];
            }
            return null;
        } catch (error) {
            console.error('Error al actualizar el estado:', error);
            throw error;
        }
    }

    static addComment(folio, comment) {
        try {
            const complaints = this.getAllComplaints();
            const index = complaints.findIndex(c => c.folio === folio);
            if (index !== -1) {
                if (!complaints[index].comments) {
                    complaints[index].comments = [];
                }
                complaints[index].comments.push({
                    text: comment,
                    createdAt: new Date().toISOString()
                });
                complaints[index].updatedAt = new Date().toISOString();
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(complaints));
                return complaints[index];
            }
            return null;
        } catch (error) {
            console.error('Error al agregar comentario:', error);
            throw error;
        }
    }

    static filterComplaints(filters = {}) {
        let complaints = this.getAllComplaints();
        
        if (filters.status) {
            complaints = complaints.filter(c => c.status === filters.status);
        }
        
        if (filters.type) {
            complaints = complaints.filter(c => c.type === filters.type);
        }
        
        if (filters.startDate && filters.endDate) {
            const start = new Date(filters.startDate);
            const end = new Date(filters.endDate);
            complaints = complaints.filter(c => {
                const date = new Date(c.createdAt);
                return date >= start && date <= end;
            });
        }
        
        return complaints;
    }
} 