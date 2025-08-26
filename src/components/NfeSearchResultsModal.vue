<template>
  <div v-if="show" class="modal fade show d-block" @click="handleBackdropClick">
    <div class="modal-dialog modal-lg" @click.stop>
      <div class="modal-content">
        <div class="modal-header border-0 pb-2">
          <h5 class="modal-title w-100 text-center">
            Agendamentos Encontrados
          </h5>
          <button type="button" class="btn-close" @click="close" aria-label="Fechar"></button>
        </div>
        
        <div class="modal-body px-4 py-3">
          <!-- Informações da Busca -->
          <div class="search-info mb-4">
            <div class="row align-items-center">
              <div class="col">
                <p class="mb-1 text-dark">
                  <strong>{{ searchType === 'nfe_key' ? 'Chave de Acesso:' : 'Número da NF-e:' }}</strong>
                  <span class="ms-2 text-monospace text-primary fw-bold">{{ searchValue }}</span>
                </p>
              </div>
              <div class="col-auto">
                <span class="badge bg-primary fs-6 px-3 py-2">
                  {{ results.length }} resultado{{ results.length !== 1 ? 's' : '' }}
                </span>
              </div>
            </div>
          </div>
          
          <!-- Lista de Resultados -->
          <div v-if="results.length === 0" class="empty-state text-center py-5">
            <h6 class="text-muted">Nenhum agendamento encontrado</h6>
            <p class="text-muted small mb-0">Tente uma busca diferente</p>
          </div>
          
          <div v-else class="results-list">
            <div 
              v-for="(schedule, index) in results" 
              :key="schedule.id"
              class="result-item"
              :class="{ 'border-bottom': index < results.length - 1 }"
            >
              <div class="d-flex justify-content-between align-items-center">
                <div class="result-info flex-grow-1">
                  <div class="mb-2">
                    <h6 class="mb-0 fw-bold">NF-e {{ schedule.number || 'N/A' }}</h6>
                  </div>
                  
                  <div class="row text-sm">
                    <div class="col-md-6 mb-2">
                      <div class="info-item">
                        <strong>Cliente:</strong>
                        <span class="ms-2">{{ schedule.client_info?.name || schedule.client }}</span>
                      </div>
                    </div>
                    <div class="col-md-6 mb-2">
                      <div class="info-item">
                        <strong>Data:</strong>
                        <span class="ms-2">{{ formatDate(schedule.date) }}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div class="info-item">
                    <strong>Volumes:</strong>
                    <span class="ms-2">{{ schedule.case_count || 0 }}</span>
                  </div>
                </div>
                
                <div class="status-container ms-3">
                  <span class="badge status-badge" :class="getStatusClass(schedule.status)">
                    {{ schedule.status }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer border-0 pt-3 pb-4">
          <div class="w-100 text-center">
            <button type="button" class="btn btn-outline-secondary px-4" @click="close">
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NfeSearchResultsModal',
  
  props: {
    show: {
      type: Boolean,
      default: false
    },
    results: {
      type: Array,
      default: () => []
    },
    searchType: {
      type: String,
      default: ''
    },
    searchValue: {
      type: String,
      default: ''
    }
  },
  
  emits: ['close'],
  
  methods: {
    close() {
      this.$emit('close')
    },
    
    handleBackdropClick() {
      this.close()
    },
    
    getStatusClass(status) {
      const statusClasses = {
        'Solicitado': 'badge-warning',
        'Agendado': 'badge-success',
        'Conferência': 'badge-info',
        'Em conferência': 'badge-info',
        'Em estoque': 'badge-success',
        'Estoque': 'badge-success',
        'Cancelado': 'badge-danger',
        'Recusado': 'badge-danger',
        'Contestado': 'badge-warning',
        'Tratativa': 'badge-secondary'
      }
      return statusClasses[status] || 'badge-secondary'
    },
    
    formatDate(dateString) {
      if (!dateString) return 'N/A'
      try {
        const date = new Date(dateString)
        return date.toLocaleDateString('pt-BR')
      } catch (error) {
        return dateString
      }
    },
    
  }
}
</script>

<style scoped>
.modal {
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6));
  backdrop-filter: blur(8px);
  z-index: 9999;
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  margin: 0 !important;
  padding: 0 !important;
}

.modal-dialog {
  max-width: 800px;
  width: 90%;
  margin: 0 !important;
  position: relative;
  z-index: 10000;
  transform: none !important;
}

.modal-content {
  border: none;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.modal-header {
  background: linear-gradient(135deg, #007bff, #0056b3);
  color: white;
  padding: 1.5rem;
}

.modal-header .modal-title {
  font-weight: 600;
  font-size: 1.25rem;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  font-weight: bold;
  color: white;
  opacity: 0.8;
  cursor: pointer;
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
}

.btn-close:hover {
  opacity: 1;
  transform: translateY(-50%) scale(1.1);
  transition: all 0.2s ease;
}

.btn-close:before {
  content: "×";
}

.search-info {
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border: 1px solid #dee2e6;
  border-radius: 12px;
  padding: 1.25rem;
  border-left: 4px solid #007bff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.results-list {
  max-height: 450px;
  overflow-y: auto;
  padding-right: 8px;
}

.results-list::-webkit-scrollbar {
  width: 6px;
}

.results-list::-webkit-scrollbar-track {
  background: #f1f3f4;
  border-radius: 10px;
}

.results-list::-webkit-scrollbar-thumb {
  background: #007bff;
  border-radius: 10px;
}

.result-item {
  padding: 1.25rem;
  margin-bottom: 0.75rem;
  background: white;
  border-radius: 12px;
  border: 1px solid #e9ecef;
  transition: all 0.2s ease;
}

.result-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.15);
  border-color: #007bff;
}

.result-item.border-bottom {
  border-bottom: 1px solid #e9ecef;
  margin-bottom: 0.75rem;
}

.info-item {
  font-size: 0.9rem;
  color: #495057;
  margin-bottom: 0.5rem;
}

.info-item:last-child {
  margin-bottom: 0;
}

.status-badge {
  font-size: 0.85rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.empty-state {
  padding: 3rem 1rem;
}

/* Badge Colors */
.badge-warning {
  background-color: #ffc107;
  color: #212529;
}

.badge-success {
  background-color: #28a745;
  color: #fff;
}

.badge-info {
  background-color: #17a2b8;
  color: #fff;
}

.badge-danger {
  background-color: #dc3545;
  color: #fff;
}

.badge-secondary {
  background-color: #6c757d;
  color: #fff;
}

.search-info {
  padding: 0.75rem;
  background-color: #f8f9fa;
  border-radius: 0.375rem;
  border-left: 4px solid #007bff;
}

/* Garantir que o modal fique por cima de tudo e centralizado */
.modal.show {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

/* Sobrescrever estilos do Bootstrap que possam interferir */
.modal.fade.show.d-block {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  margin: 0 !important;
  padding: 0 !important;
}

.modal.fade.show.d-block .modal-dialog {
  margin: 0 !important;
  transform: none !important;
  position: relative;
  width: 90%;
  max-width: 800px;
}

.modal-content {
  background-color: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}
</style>