<template>
  <div v-if="show" class="modal-overlay" @click="handleModalClick">
    <div class="modal-content product-details-modal" ref="modal" tabindex="-1">
      <!-- Header -->
      <div class="modal-header">
        <h3>
          <i class="fas fa-box"></i>
          Detalhes do Produto
        </h3>
        <button class="btn-close" @click="closeModal">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Content -->
      <div class="modal-body">
        <div class="product-info-grid">
          <!-- Seção de Códigos -->
          <div class="info-section">
            <h4>
              <i class="fas fa-barcode"></i>
              Códigos
            </h4>
            <div class="info-grid">
              <div class="info-item">
                <label>Código Mercadoria Interno:</label>
                <span class="value code">{{ product.cli_code || 'Não informado' }}</span>
              </div>
              <div class="info-item">
                <label>Código do Fornecedor:</label>
                <span class="value code">{{ product.supp_code || 'Não informado' }}</span>
              </div>
            </div>
          </div>

          <!-- Seção de Descrições -->
          <div class="info-section">
            <h4>
              <i class="fas fa-align-left"></i>
              Descrições
            </h4>
            <div class="info-grid">
              <div class="info-item">
                <label>Descrição Interna (Venda):</label>
                <span class="value">{{ product.cli_desc || 'Não informado' }}</span>
              </div>
              <div class="info-item">
                <label>Descrição do Fornecedor:</label>
                <span class="value">{{ product.supp_desc || 'Não informado' }}</span>
              </div>
            </div>
          </div>

          <!-- Seção de Relacionamentos -->
          <div class="info-section">
            <h4>
              <i class="fas fa-building"></i>
              Relacionamentos
            </h4>
            <div class="info-grid">
              <div class="info-item">
                <label>CNPJ Cliente:</label>
                <span class="value cnpj">{{ formatCnpj(product.cli_cnpj) }}</span>
              </div>
              <div class="info-item">
                <label>CNPJ Fornecedor:</label>
                <span class="value cnpj">{{ formatCnpj(product.supp_cnpj) }}</span>
              </div>
            </div>
          </div>

          <!-- Seção de Metadados -->
          <div class="info-section">
            <h4>
              <i class="fas fa-info-circle"></i>
              Informações do Sistema
            </h4>
            <div class="info-grid">
              <div class="info-item">
                <label>Usuário Responsável:</label>
                <span class="value">{{ product.user || 'Não informado' }}</span>
              </div>
              <div class="info-item">
                <label>Data de Cadastro:</label>
                <span class="value">{{ formatDateTime(product.date) }}</span>
              </div>
            </div>
          </div>

          <!-- Seção de Histórico -->
          <div v-if="hasHistory" class="info-section full-width">
            <h4>
              <i class="fas fa-history"></i>
              Histórico de Alterações
            </h4>
            <div class="history-container">
              <div 
                v-for="(entry, key) in historyEntries" 
                :key="key" 
                class="history-entry"
              >
                <div class="history-header">
                  <span class="history-action">{{ entry.action }}</span>
                  <span class="history-date">{{ formatDateTime(entry.timestamp) }}</span>
                </div>
                <div class="history-details">
                  <div v-if="entry.user" class="history-user">
                    <i class="fas fa-user"></i>
                    {{ entry.user }}
                  </div>
                  <div v-if="entry.comment" class="history-comment">
                    {{ entry.comment }}
                  </div>
                  <div v-if="entry.changes && Object.keys(entry.changes).length > 0" class="history-changes">
                    <h5>Alterações:</h5>
                    <div 
                      v-for="(change, field) in entry.changes" 
                      :key="field"
                      class="change-item"
                    >
                      <span class="field-name">{{ field }}:</span>
                      <span class="change-from">{{ change.from }}</span>
                      <i class="fas fa-arrow-right"></i>
                      <span class="change-to">{{ change.to }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Seção vazia se não há histórico -->
          <div v-else class="info-section full-width">
            <h4>
              <i class="fas fa-history"></i>
              Histórico de Alterações
            </h4>
            <div class="empty-history">
              <i class="fas fa-clock"></i>
              <p>Nenhum histórico de alterações disponível</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <button @click="closeModal" class="btn btn-secondary">
          <i class="fas fa-times"></i>
          Fechar
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProductDetailsModal',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    product: {
      type: Object,
      default: () => ({})
    }
  },
  computed: {
    hasHistory() {
      return this.product.hist && 
             typeof this.product.hist === 'object' && 
             Object.keys(this.product.hist).length > 0
    },
    historyEntries() {
      if (!this.hasHistory) return []
      
      // Converter o histórico em array ordenado por data
      return Object.entries(this.product.hist)
        .map(([key, entry]) => ({
          key,
          ...entry
        }))
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    }
  },
  watch: {
    show(newVal) {
      if (newVal) {
        this.$nextTick(() => {
          if (this.$refs.modal) {
            this.$refs.modal.focus()
          }
        })
      }
    }
  },
  mounted() {
    // Listener para ESC
    document.addEventListener('keydown', this.handleEscKey)
  },
  beforeUnmount() {
    document.removeEventListener('keydown', this.handleEscKey)
  },
  methods: {
    handleModalClick(event) {
      // Fechar apenas se clicou no overlay (fora do modal)
      if (event.target === event.currentTarget) {
        this.closeModal()
      }
    },
    
    handleEscKey(event) {
      if (event.key === 'Escape' && this.show) {
        this.closeModal()
      }
    },
    
    closeModal() {
      this.$emit('close')
    },

    formatCnpj(cnpj) {
      if (!cnpj) return 'Não informado'
      return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
    },

    formatDateTime(date) {
      if (!date) return 'Não informado'
      return new Date(date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  position: relative;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 25px;
  border-bottom: 1px solid #eee;
  background: #f8f9fa;
  border-radius: 8px 8px 0 0;
}

.modal-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.2rem;
  color: #666;
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
  transition: all 0.2s;
}

.btn-close:hover {
  background: rgba(0, 0, 0, 0.1);
  color: #333;
}

.modal-body {
  padding: 25px;
  overflow-y: auto;
  flex: 1;
}

.product-info-grid {
  display: grid;
  gap: 25px;
}

.info-section {
  background: #f8f9fa;
  border-radius: 6px;
  padding: 20px;
}

.info-section.full-width {
  grid-column: 1 / -1;
}

.info-section h4 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid #dee2e6;
  padding-bottom: 10px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.info-item label {
  font-weight: 600;
  color: #555;
  font-size: 0.9rem;
}

.info-item .value {
  color: #333;
  padding: 8px 12px;
  background: white;
  border-radius: 4px;
  border: 1px solid #ddd;
  min-height: 20px;
  display: flex;
  align-items: center;
}

.value.code {
  /* Mesma formatação do texto de descrição com fonte maior */
  font-size: 1.05em;
}

.value.cnpj {
  font-family: 'Courier New', monospace;
  color: #28a745;
}

.history-container {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
}

.history-entry {
  border-bottom: 1px solid #eee;
  padding: 15px;
}

.history-entry:last-child {
  border-bottom: none;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.history-action {
  font-weight: 600;
  color: #333;
}

.history-date {
  font-size: 0.85rem;
  color: #666;
  font-family: monospace;
}

.history-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-user {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #555;
  font-size: 0.9rem;
}

.history-comment {
  color: #666;
  font-style: italic;
}

.history-changes h5 {
  margin: 0 0 8px 0;
  font-size: 0.9rem;
  color: #555;
}

.change-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  padding: 4px 0;
}

.field-name {
  font-weight: 600;
  color: #333;
}

.change-from {
  background: #f8d7da;
  color: #721c24;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: monospace;
}

.change-to {
  background: #d4edda;
  color: #155724;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: monospace;
}

.empty-history {
  text-align: center;
  padding: 30px;
  color: #666;
}

.empty-history i {
  font-size: 2rem;
  margin-bottom: 10px;
  opacity: 0.5;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px 25px;
  border-top: 1px solid #eee;
  background: #f8f9fa;
  border-radius: 0 0 8px 8px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #545b62;
}

/* Responsividade */
@media (max-width: 768px) {
  .modal-overlay {
    padding: 10px;
  }
  
  .modal-content {
    max-width: none;
    width: 100%;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .change-item {
    flex-wrap: wrap;
    gap: 4px;
  }
}
</style>