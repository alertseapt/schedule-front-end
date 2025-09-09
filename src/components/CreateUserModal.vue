<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-container">
      <!-- Header do modal -->
      <div class="modal-header">
        <div class="header-info">
          <h2>
            <i class="fas fa-user-plus"></i>
            Criar Novo Usuário
          </h2>
          <p class="header-description">Preencha os dados do novo usuário</p>
        </div>
        <button @click="$emit('close')" class="close-btn">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Formulário -->
      <div class="modal-content">
        <form @submit.prevent="handleSubmit" class="user-form">
          <!-- Dados básicos -->
          <div class="form-section">
            <h3 class="section-title">
              <i class="fas fa-user"></i>
              Dados Básicos
            </h3>
            
            <div class="form-row">
              <div class="form-group">
                <label for="name" class="form-label">
                  <i class="fas fa-id-card"></i>
                  Nome Completo
                </label>
                <input
                  type="text"
                  id="name"
                  v-model="formData.name"
                  placeholder="Digite o nome completo"
                  class="form-input"
                  required
                  :disabled="loading"
                >
              </div>

              <div class="form-group">
                <label for="email" class="form-label">
                  <i class="fas fa-envelope"></i>
                  E-mail
                </label>
                <input
                  type="email"
                  id="email"
                  v-model="formData.email"
                  placeholder="Digite o e-mail"
                  class="form-input"
                  required
                  :disabled="loading"
                >
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="level" class="form-label">
                  <i class="fas fa-shield-alt"></i>
                  Nível de Acesso
                </label>
                <select
                  id="level"
                  v-model="formData.level_access"
                  class="form-select"
                  required
                  :disabled="loading"
                >
                  <option value="">Selecione o nível</option>
                  <option value="0">Desenvolvedor</option>
                  <option value="1">Cliente</option>
                  <option value="2">Administrador</option>
                  <option value="3">Gerente</option>
                  <option value="9">Conferente</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">
                  <i class="fas fa-key"></i>
                  Senha Padrão
                </label>
                <div class="password-info">
                  <i class="fas fa-info-circle"></i>
                  A senha padrão será: <strong>mercocamp</strong>
                </div>
              </div>
            </div>
          </div>

          <!-- Seleção de clientes -->
          <div class="form-section">
            <div class="section-header">
              <h3 class="section-title">
                <i class="fas fa-building"></i>
                Acesso a Clientes
              </h3>
              <div class="search-container">
                <input
                  type="text"
                  v-model="searchTerm"
                  @input="handleSearch"
                  placeholder="Pesquisar clientes..."
                  class="search-input"
                  :disabled="loading"
                >
                <i class="fas fa-search search-icon"></i>
              </div>
            </div>

            <div class="clients-container">
              <!-- Estado de carregamento -->
              <div v-if="clientsLoading" class="clients-loading">
                <div class="loading-animation">
                  <div class="loading-spinner"></div>
                  <h4>Carregando clientes...</h4>
                  <p>Aguarde enquanto buscamos os dados</p>
                </div>
              </div>

              <!-- Container de clientes (quando não está carregando) -->
              <template v-else>
                <!-- Clientes selecionados -->
                <div v-if="selectedClients.length > 0" class="selected-clients-section">
                  <h4 class="clients-subtitle">
                    <i class="fas fa-check-circle"></i>
                    Clientes Selecionados ({{ selectedClients.length }})
                  </h4>
                  <div class="selected-clients-list">
                    <div 
                      v-for="client in selectedClients"
                      :key="client.cnpj"
                      class="selected-client-item"
                    >
                      <div class="client-info">
                        <div class="client-name">{{ client.nome }}</div>
                        <div class="client-meta">
                          <span class="client-number">№ {{ client.numero }}</span>
                          <span class="client-cnpj">{{ formatCNPJ(client.cnpj) }}</span>
                        </div>
                      </div>
                      <button 
                        type="button"
                        @click="removeClient(client)" 
                        class="remove-client-btn"
                        title="Remover cliente"
                        :disabled="loading"
                      >
                        <i class="fas fa-times"></i>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Lista de clientes disponíveis -->
                <div class="available-clients-section">
                  <h4 class="clients-subtitle">
                    <i class="fas fa-list"></i>
                    Clientes Disponíveis ({{ filteredAvailableClients.length }})
                  </h4>
                  
                  <div class="available-clients-list">
                    <div v-if="filteredAvailableClients.length === 0" class="no-clients">
                      <i class="fas fa-search"></i>
                      <p>Nenhum cliente encontrado</p>
                    </div>

                    <div 
                      v-for="client in filteredAvailableClients"
                      :key="client.cnpj"
                      class="client-item"
                      @click="addClient(client)"
                    >
                      <div class="client-info">
                        <div class="client-name">{{ client.nome }}</div>
                        <div class="client-meta">
                          <span class="client-number">№ {{ client.numero }}</span>
                          <span class="client-cnpj">{{ formatCNPJ(client.cnpj) }}</span>
                        </div>
                      </div>
                      <button 
                        type="button"
                        class="add-client-btn"
                        title="Adicionar cliente"
                        :disabled="loading"
                      >
                        <i class="fas fa-plus"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </form>
      </div>

      <!-- Footer com ações -->
      <div class="modal-footer">
        <div class="selected-count">
          <i class="fas fa-info-circle"></i>
          {{ selectedClients.length }} cliente{{ selectedClients.length !== 1 ? 's' : '' }} selecionado{{ selectedClients.length !== 1 ? 's' : '' }}
        </div>
        <div class="footer-actions">
          <button type="button" @click="$emit('close')" class="btn btn-secondary" :disabled="loading">
            <i class="fas fa-times"></i>
            Cancelar
          </button>
          <button type="button" @click="handleSubmit" class="btn btn-primary" :disabled="loading || !isFormValid">
            <i class="fas fa-spinner fa-spin" v-if="loading"></i>
            <i class="fas fa-user-plus" v-else></i>
            {{ loading ? 'Criando...' : 'Criar Usuário' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';

export default {
  name: 'CreateUserModal',
  props: {
    currentUser: {
      type: Object,
      required: true
    },
    availableClients: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    },
    clientsLoading: {
      type: Boolean,
      default: true
    }
  },
  emits: ['close', 'save', 'load-clients'],
  setup(props, { emit }) {
    // Estado reativo
    const formData = ref({
      name: '',
      email: '',
      level_access: ''
    });

    const selectedClients = ref([]);
    const searchTerm = ref('');

    // Computed
    const filteredAvailableClients = computed(() => {
      const selected = selectedClients.value.map(c => c.cnpj);
      const available = props.availableClients.filter(client => !selected.includes(client.cnpj));
      
      if (!searchTerm.value) {
        return available;
      }
      
      const term = searchTerm.value.toLowerCase();
      return available.filter(client => 
        client.nome.toLowerCase().includes(term) ||
        client.numero.toString().includes(term) ||
        client.cnpj.includes(term)
      );
    });

    const isFormValid = computed(() => {
      return formData.value.name.trim() && 
             formData.value.email.trim() && 
             formData.value.level_access !== '';
    });

    // Métodos
    const formatCNPJ = (cnpj) => {
      if (!cnpj) return '';
      const digits = cnpj.replace(/\D/g, '');
      if (digits.length === 14) {
        return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
      }
      return cnpj;
    };

    const addClient = (client) => {
      if (!selectedClients.value.find(c => c.cnpj === client.cnpj)) {
        selectedClients.value.push({ ...client });
      }
    };

    const removeClient = (client) => {
      const index = selectedClients.value.findIndex(c => c.cnpj === client.cnpj);
      if (index >= 0) {
        selectedClients.value.splice(index, 1);
      }
    };

    const handleSearch = () => {
      if (searchTerm.value.length >= 3) {
        emit('load-clients', searchTerm.value);
      } else if (searchTerm.value.length === 0) {
        emit('load-clients', '');
      }
    };

    const handleSubmit = () => {
      if (!isFormValid.value) return;

      // Formar JSON de acessos
      const cli_access = {};
      selectedClients.value.forEach(client => {
        cli_access[client.cnpj] = {
          nome: client.nome,
          numero: client.numero
        };
      });

      const userData = {
        ...formData.value,
        level_access: parseInt(formData.value.level_access),
        cli_access
      };

      emit('save', userData);
    };

    // Lifecycle
    onMounted(() => {
      emit('load-clients', '');
    });

    return {
      formData,
      selectedClients,
      searchTerm,
      filteredAvailableClients,
      isFormValid,
      formatCNPJ,
      addClient,
      removeClient,
      handleSearch,
      handleSubmit
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
  width: 95vw;
  height: 95vh;
  max-width: none;
  max-height: none;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  box-sizing: border-box;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 24px;
  border-bottom: 2px solid #e2e8f0;
  background: #f7fafc;
  flex-shrink: 0;
  width: 100%;
  box-sizing: border-box;
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
  color: #48bb78;
}

.header-description {
  margin: 0;
  color: #718096;
  font-size: 0.9rem;
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
  flex-shrink: 0;
}

.close-btn:hover {
  background: #c53030;
  transform: scale(1.05);
}

.modal-content {
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 24px;
  width: 100%;
  min-width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.user-form {
  display: flex;
  flex-direction: column;
  gap: 32px;
  width: 100%;
  flex: 1;
  box-sizing: border-box;
}

.form-section {
  background: #f9fafb;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid #e2e8f0;
  width: 100%;
  box-sizing: border-box;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 20px 0;
  color: #2d3748;
  font-size: 1.2rem;
  font-weight: 600;
}

.section-title i {
  color: #3182ce;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #4a5568;
  font-size: 0.9rem;
}

.form-label i {
  color: #718096;
  width: 16px;
}

.form-input,
.form-select {
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s ease;
  background: white;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #3182ce;
  box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
}

.form-input:disabled,
.form-select:disabled {
  background: #f7fafc;
  cursor: not-allowed;
}

.password-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #ebf8ff;
  border: 1px solid #bee3f8;
  border-radius: 8px;
  color: #2c5aa0;
  font-size: 0.9rem;
}

.password-info i {
  color: #3182ce;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.search-container {
  position: relative;
  width: 300px;
}

.search-input {
  width: 100%;
  padding: 10px 16px 10px 40px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: #3182ce;
  box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #a0aec0;
}

.clients-container {
  display: flex;
  gap: 20px;
  max-height: 400px;
  width: 100%;
  box-sizing: border-box;
}

.clients-loading {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
}

.loading-animation {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 16px;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e2e8f0;
  border-top: 4px solid #3182ce;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-animation h4 {
  margin: 0;
  color: #2d3748;
  font-size: 1.1rem;
  font-weight: 600;
}

.loading-animation p {
  margin: 0;
  color: #718096;
  font-size: 0.9rem;
}

.selected-clients-section,
.available-clients-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.clients-subtitle {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: #4a5568;
  font-size: 1rem;
  font-weight: 600;
}

.selected-clients-list,
.available-clients-list {
  flex: 1;
  overflow-y: auto;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  max-height: 300px;
}

.selected-client-item,
.client-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #f1f5f9;
  transition: all 0.2s ease;
}

.client-item {
  cursor: pointer;
}

.client-item:hover {
  background: #f8fafc;
}

.selected-client-item {
  background: #f0fff4;
  border-left: 4px solid #48bb78;
}

.client-info {
  flex: 1;
  min-width: 0;
}

.client-name {
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.client-meta {
  display: flex;
  gap: 12px;
  font-size: 0.8rem;
  color: #718096;
}

.client-number {
  background: #f7fafc;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
}

.client-cnpj {
  font-family: 'Courier New', monospace;
  background: #edf2f7;
  padding: 2px 6px;
  border-radius: 4px;
}

.add-client-btn,
.remove-client-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.8rem;
  flex-shrink: 0;
}

.add-client-btn {
  background: #48bb78;
  color: white;
}

.add-client-btn:hover {
  background: #38a169;
  transform: scale(1.1);
}

.remove-client-btn {
  background: #e53e3e;
  color: white;
}

.remove-client-btn:hover {
  background: #c53030;
  transform: scale(1.1);
}

.no-clients {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #a0aec0;
  text-align: center;
}

.no-clients i {
  font-size: 2rem;
  margin-bottom: 12px;
}

.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-top: 2px solid #e2e8f0;
  background: #f7fafc;
  flex-shrink: 0;
  width: 100%;
  box-sizing: border-box;
}

.selected-count {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #4a5568;
}

.selected-count i {
  color: #3182ce;
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
  font-size: 0.9rem;
}

.btn-secondary {
  background: #e2e8f0;
  color: #4a5568;
}

.btn-secondary:hover:not(:disabled) {
  background: #cbd5e0;
}

.btn-primary {
  background: #48bb78;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #38a169;
}

.btn:disabled {
  background: #a0aec0;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .modal-container {
    width: 98vw;
    height: 95vh;
  }
  
  .form-row {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .section-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .search-container {
    width: 100%;
  }
  
  .clients-container {
    flex-direction: column;
    gap: 16px;
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