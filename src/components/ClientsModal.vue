<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-container">
      <!-- Header do modal -->
      <div class="modal-header">
        <div class="header-info">
          <h2>
            <i class="fas fa-building"></i>
            Gerenciar CNPJs
          </h2>
          <p class="user-info">
            <span class="user-email">{{ user.user }}</span>
            <span class="user-name" v-if="user.name">{{ user.name }}</span>
          </p>
        </div>
        <button @click="$emit('close')" class="close-btn">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Barra de pesquisa -->
      <div class="search-section">
        <div class="search-container">
          <div class="search-input-wrapper">
            <i class="fas fa-search"></i>
            <input
              v-model="searchTerm"
              @input="handleSearch"
              type="text"
              placeholder="Pesquisar por nome, CNPJ ou número..."
              class="search-input"
            >
            <button 
              v-if="searchTerm" 
              @click="clearSearch" 
              class="clear-search-btn"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="loading-section">
        <div class="loader-spinner"></div>
        <p>Carregando clientes...</p>
      </div>

      <!-- Conteúdo principal -->
      <div v-else class="modal-content">
        <div class="content-columns">
          <!-- Coluna da esquerda: Clientes selecionados -->
          <div class="selected-column">
            <div class="section-header">
              <h3>
                <i class="fas fa-check-circle"></i>
                Clientes Selecionados
                <span class="count">({{ selectedClients.length }})</span>
              </h3>
            </div>
            <div class="selected-clients">
              <div v-if="selectedClients.length === 0" class="no-selected">
                <i class="fas fa-info-circle"></i>
                <p>Nenhum cliente selecionado</p>
              </div>
              <div 
                v-else
                v-for="client in selectedClients" 
                :key="client.cnpj" 
                class="selected-client-item"
              >
                <div class="client-info">
                  <div class="client-name">{{ client.nome }}</div>
                </div>
                <div class="client-meta-horizontal">
                  <span class="client-number">№ {{ client.numero }}</span>
                  <span class="client-cnpj">{{ formatCNPJ(client.cnpj) }}</span>
                </div>
                <button 
                  @click="toggleClient(client)" 
                  class="remove-btn"
                  title="Remover cliente"
                >
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- Coluna da direita: Todos os clientes -->
          <div class="clients-column">
            <div class="section-header">
              <h3>
                <i class="fas fa-list"></i>
                Todos os Clientes
                <span class="count">({{ filteredClients.length }})</span>
              </h3>
            </div>

            <div class="clients-list">
              <div v-if="filteredClients.length === 0" class="no-clients">
                <i class="fas fa-search"></i>
                <p>Nenhum cliente encontrado</p>
              </div>
              
              <div 
                v-for="client in filteredClients" 
                :key="client.cnpj" 
                class="client-item"
                :class="{ 'selected': isSelected(client) }"
              >
                <div class="client-checkbox">
                  <input
                    type="checkbox"
                    :id="`client-${client.cnpj}`"
                    :checked="isSelected(client)"
                    @change="toggleClient(client)"
                  >
                  <label :for="`client-${client.cnpj}`" class="checkbox-custom"></label>
                </div>
                
                <div class="client-details">
                  <div class="client-name">{{ client.nome }}</div>
                </div>
                <div class="client-meta-horizontal">
                  <span class="client-number">№ {{ client.numero }}</span>
                  <span class="client-cnpj">{{ formatCNPJ(client.cnpj) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer com ações -->
      <div class="modal-footer">
        <div class="selected-count">
          {{ selectedClients.length }} cliente{{ selectedClients.length !== 1 ? 's' : '' }} selecionado{{ selectedClients.length !== 1 ? 's' : '' }}
        </div>
        <div class="footer-actions">
          <button @click="$emit('close')" class="btn btn-secondary">
            <i class="fas fa-times"></i>
            Cancelar
          </button>
          <button @click="handleSave" class="btn btn-primary" :disabled="saving">
            <i class="fas fa-spinner fa-spin" v-if="saving"></i>
            <i class="fas fa-save" v-else></i>
            {{ saving ? 'Salvando...' : 'Salvar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';

export default {
  name: 'ClientsModal',
  props: {
    user: {
      type: Object,
      required: true
    },
    clients: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close', 'save', 'search'],
  setup(props, { emit }) {
    // Estado reativo
    const searchTerm = ref('');
    const selectedClients = ref([]);
    const saving = ref(false);

    // Computed
    const filteredClients = computed(() => {
      return props.clients.filter(client => !isSelected(client));
    });

    // Métodos
    const isSelected = (client) => {
      return selectedClients.value.some(selected => selected.cnpj === client.cnpj);
    };

    const toggleClient = (client) => {
      const index = selectedClients.value.findIndex(selected => selected.cnpj === client.cnpj);
      
      if (index >= 0) {
        // Remover cliente
        selectedClients.value.splice(index, 1);
      } else {
        // Adicionar cliente
        selectedClients.value.push({ ...client });
      }
    };

    const handleSearch = () => {
      emit('search', searchTerm.value);
    };

    const clearSearch = () => {
      searchTerm.value = '';
      emit('search', '');
    };

    const formatCNPJ = (cnpj) => {
      if (!cnpj) return '';
      const digits = cnpj.replace(/\D/g, '');
      if (digits.length === 14) {
        return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
      }
      return cnpj;
    };

    const handleSave = async () => {
      saving.value = true;
      try {
        await emit('save', selectedClients.value);
      } finally {
        saving.value = false;
      }
    };

    const loadUserCurrentAccess = () => {
      // Carregar acessos atuais do usuário
      if (props.user.cli_access) {
        const currentAccess = Object.keys(props.user.cli_access).map(cnpj => ({
          cnpj,
          nome: props.user.cli_access[cnpj].nome,
          numero: props.user.cli_access[cnpj].numero
        }));
        selectedClients.value = [...currentAccess];
      }
    };

    // Lifecycle
    onMounted(() => {
      loadUserCurrentAccess();
    });

    // Watchers
    watch(() => props.user, () => {
      loadUserCurrentAccess();
    }, { deep: true });

    return {
      searchTerm,
      selectedClients,
      saving,
      filteredClients,
      isSelected,
      toggleClient,
      handleSearch,
      clearSearch,
      formatCNPJ,
      handleSave
    };
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
  backdrop-filter: blur(4px);
}

.modal-container {
  background: white;
  border-radius: 16px;
  width: 90vw;
  height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  box-sizing: border-box;
  max-width: none !important;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 24px;
  border-bottom: 2px solid #e2e8f0;
  background: #f7fafc;
}

.header-info h2 {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 0 8px 0;
  color: #2d3748;
  font-size: 1.5rem;
  font-weight: 600;
}

.header-info h2 i {
  color: #667eea;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  color: #718096;
}

.user-email {
  font-family: 'Courier New', monospace;
  font-weight: 600;
  color: #4a5568;
}

.user-name {
  font-style: italic;
}

.close-btn {
  background: #e53e3e;
  color: white;
  border: none;
  border-radius: 8px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #c53030;
  transform: scale(1.05);
}

.search-section {
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
  background: white;
  width: 100%;
  box-sizing: border-box;
  flex-shrink: 0;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input-wrapper i {
  position: absolute;
  left: 16px;
  color: #a0aec0;
  z-index: 1;
}

.search-input {
  width: 100%;
  padding: 16px 16px 16px 48px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.2s ease;
  outline: none;
}

.search-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.clear-search-btn {
  position: absolute;
  right: 12px;
  background: #e2e8f0;
  color: #718096;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.clear-search-btn:hover {
  background: #cbd5e0;
  color: #4a5568;
}

.loading-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 60px 20px;
}

.loader-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e2e8f0;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.modal-content {
  flex: 1 1 auto;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  width: 100% !important;
  min-width: 100% !important;
  max-width: 100% !important;
  box-sizing: border-box;
}

.content-columns {
  display: flex;
  flex: 1 1 auto;
  gap: 16px;
  overflow: hidden;
  padding: 16px;
  width: 100% !important;
  min-width: 100% !important;
  box-sizing: border-box;
}

.selected-column {
  flex: 1 1 50%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f0fff4;
  border: 2px solid #c6f6d5;
  border-radius: 12px;
  min-width: 0;
  max-width: 50%;
}

.section-header {
  padding: 16px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.8);
  flex-shrink: 0;
}

.section-header h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: #2d3748;
  font-size: 1.125rem;
  font-weight: 600;
}

.count {
  color: #718096;
  font-weight: 400;
  font-size: 0.9rem;
}

.selected-clients {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
  box-sizing: border-box;
}

.selected-client-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  margin-bottom: 6px;
  background: white;
  border: 1px solid #c6f6d5;
  border-radius: 8px;
  transition: all 0.2s ease;
  min-height: 50px;
  width: calc(100% - 2px);
  box-sizing: border-box;
}

.selected-client-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.selected-client-item .client-info {
  flex: 1;
  min-width: 0;
  margin-right: 16px;
}

.selected-client-item .client-name {
  font-weight: 600;
  color: #2d3748;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.remove-btn {
  background: #e53e3e;
  color: white;
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.8rem;
  flex-shrink: 0;
}

.remove-btn:hover {
  background: #c53030;
  transform: scale(1.1);
}

.clients-column {
  flex: 1 1 50%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f7fafc;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  min-width: 0;
  max-width: 50%;
}

.clients-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
  box-sizing: border-box;
}

.no-clients,
.no-selected {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #a0aec0;
  text-align: center;
}

.no-clients i,
.no-selected i {
  font-size: 2.5rem;
  margin-bottom: 12px;
}

.no-selected {
  color: #48bb78;
}

.no-selected i {
  color: #68d391;
}

.client-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  margin-bottom: 6px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 50px;
  width: calc(100% - 2px);
  box-sizing: border-box;
}

.client-item:hover {
  border-color: #667eea;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15);
}

.client-item.selected {
  border-color: #48bb78;
  background: #f0fff4;
}

.client-checkbox {
  position: relative;
}

.client-checkbox input[type="checkbox"] {
  opacity: 0;
  position: absolute;
  width: 20px;
  height: 20px;
}

.checkbox-custom {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid #e2e8f0;
  border-radius: 4px;
  position: relative;
  cursor: pointer;
  transition: all 0.2s ease;
}

.client-checkbox input:checked + .checkbox-custom {
  background: #48bb78;
  border-color: #48bb78;
}

.client-checkbox input:checked + .checkbox-custom::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-weight: bold;
  font-size: 14px;
}

.client-details {
  flex: 1;
  min-width: 0; /* Permite truncar texto se necessário */
  margin-right: 16px;
}

.client-name {
  font-weight: 600;
  color: #2d3748;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.client-meta-horizontal {
  display: flex;
  gap: 12px;
  align-items: center;
  font-size: 0.875rem;
  color: #718096;
  flex-shrink: 0;
  min-width: 250px;
  justify-content: flex-end;
}

.client-number {
  font-weight: 500;
  background: #f7fafc;
  padding: 4px 8px;
  border-radius: 4px;
  min-width: 70px;
  text-align: center;
  font-size: 0.8rem;
}

.client-cnpj {
  font-family: 'Courier New', monospace;
  font-weight: 500;
  background: #edf2f7;
  padding: 4px 8px;
  border-radius: 4px;
  min-width: 160px;
  text-align: center;
  font-size: 0.8rem;
}

.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-top: 2px solid #e2e8f0;
  background: #f7fafc;
  width: 100%;
  box-sizing: border-box;
  flex-shrink: 0;
}

.selected-count {
  font-weight: 600;
  color: #4a5568;
}

.footer-actions {
  display: flex;
  gap: 12px;
}

.btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.btn-secondary {
  background: #e2e8f0;
  color: #4a5568;
}

.btn-secondary:hover {
  background: #cbd5e0;
}

.btn-primary {
  background: #48bb78;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #38a169;
}

.btn-primary:disabled {
  background: #a0aec0;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .modal-container {
    width: 95vw;
    height: 95vh;
    margin: 20px;
  }
  
  .modal-header {
    padding: 16px;
  }
  
  .header-info h2 {
    font-size: 1.25rem;
  }
  
  .user-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .search-section {
    padding: 16px;
  }
  
  .selected-clients {
    max-height: 150px;
  }
  
  .client-meta-horizontal {
    flex-direction: column;
    gap: 8px;
    min-width: auto;
    align-items: flex-start;
  }
  
  .client-details {
    flex: 1;
  }
  
  .client-item {
    flex-wrap: wrap;
    min-height: auto;
  }
  
  .selected-client-item {
    flex-wrap: wrap;
    min-height: auto;
  }
  
  .client-number,
  .client-cnpj {
    min-width: auto;
    text-align: left;
  }
  
  .content-columns {
    flex-direction: column;
    gap: 12px;
    padding: 0 12px;
  }
  
  .selected-column,
  .clients-column {
    min-height: 200px;
  }
  
  .selected-clients {
    max-height: 150px;
  }
  
  .modal-footer {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .footer-actions {
    justify-content: center;
  }
}
</style>