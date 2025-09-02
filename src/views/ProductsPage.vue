<template>
  <div class="products-page">

    <!-- Barra de Busca Centralizada -->
    <div class="search-section">
      <div class="search-container">
        <i class="fas fa-search search-icon"></i>
        <input
          type="text"
          v-model="searchTerm"
          @input="handleSearch"
          placeholder="Buscar por código, descrição..."
          class="search-input"
        />
        <button v-if="searchTerm" @click="clearSearch" class="clear-search">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <button 
        @click="refreshProducts" 
        class="btn btn-outline-primary search-button"
        :disabled="loading"
      >
        <i class="fas fa-sync" :class="{ 'fa-spin': loading }"></i>
        Atualizar
      </button>
    </div>


    <!-- Loading -->
    <div v-if="loading && products.length === 0" class="loading-container">
      <div class="loading-content">
        <div class="spinner-container">
          <div class="spinner-circle"></div>
          <div class="spinner-circle"></div>
          <div class="spinner-circle"></div>
        </div>
        <p class="loading-text">Carregando produtos...</p>
        <p class="loading-subtext">Aguarde enquanto buscamos os dados</p>
      </div>
    </div>

    <!-- Lista de Produtos -->
    <div v-else-if="products.length > 0" class="products-container">
      <div class="products-table-container">
        <table class="products-table">
          <thead>
            <tr>
              <th>Cod. Venda</th>
              <th>Cod. Fornecedor</th>
              <th>Descrição</th>
              <th>Cliente</th>
              <th>Data</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in products" :key="`${product.cli_code}-${product.cli_cnpj}-${product.supp_code}`">
              <td>
                <span class="product-code">{{ product.cli_code || '-' }}</span>
              </td>
              <td>
                <span class="supplier-code">{{ product.supp_code || '-' }}</span>
              </td>
              <td>
                <span class="description" :title="product.cli_desc">
                  {{ product.cli_desc || '-' }}
                </span>
              </td>
              <td>
                <span class="cnpj">{{ formatCnpj(product.cli_cnpj) }}</span>
              </td>
              <td>
                <span class="date" v-html="formatDate(product.date)"></span>
              </td>
              <td>
                <button 
                  @click="showProductDetails(product)"
                  class="btn btn-sm btn-info"
                  title="Ver detalhes"
                >
                  <i class="fas fa-eye"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Paginação -->
      <div class="pagination-container">
        <div class="pagination-info">
          <span>
            Mostrando {{ ((pagination.page - 1) * pagination.limit) + 1 }} - 
            {{ Math.min(pagination.page * pagination.limit, pagination.total) }} 
            de {{ pagination.total }} produtos
          </span>
        </div>
        <div class="pagination-controls">
          <button 
            @click="changePage(pagination.page - 1)"
            :disabled="pagination.page <= 1 || loading"
            class="btn btn-outline-primary btn-sm"
          >
            <i class="fas fa-chevron-left"></i> Anterior
          </button>
          
          <span class="page-numbers">
            <button
              v-for="page in visiblePages"
              :key="page"
              @click="changePage(page)"
              :class="{ active: page === pagination.page }"
              :disabled="loading"
              class="btn btn-sm"
            >
              {{ page }}
            </button>
          </span>
          
          <button 
            @click="changePage(pagination.page + 1)"
            :disabled="pagination.page >= pagination.pages || loading"
            class="btn btn-outline-primary btn-sm"
          >
            Próxima <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!loading" class="empty-state">
      <div class="empty-icon">
        <i class="fas fa-boxes"></i>
      </div>
      <h3>Nenhum produto encontrado</h3>
      <p v-if="hasActiveFilters">
        Tente ajustar os filtros ou limpar a busca para ver mais produtos.
      </p>
      <p v-else>
        Não há produtos cadastrados no sistema ainda.
      </p>
    </div>

    <!-- Product Details Modal -->
    <ProductDetailsModal
      v-if="showModal"
      :show="showModal"
      :product="selectedProduct"
      @close="closeModal"
    />
  </div>
</template>

<script>
import ProductDetailsModal from '../components/ProductDetailsModal.vue'

export default {
  name: 'ProductsPage',
  components: {
    ProductDetailsModal
  },
  data() {
    return {
      products: [],
      loading: false, // App.vue controlará o loading
      searchTerm: '',
      searchTimeout: null,
      showModal: false,
      selectedProduct: null,
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        pages: 0
      }
    }
  },
  computed: {
    hasActiveFilters() {
      return this.searchTerm
    },
    visiblePages() {
      const current = this.pagination.page
      const total = this.pagination.pages
      const range = 2
      
      let start = Math.max(1, current - range)
      let end = Math.min(total, current + range)
      
      const pages = []
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
      
      return pages
    }
  },
  mounted() {
    // O carregamento é feito pelo App.vue quando a página é ativada
    // Não carregar automaticamente no mounted para evitar chamadas duplicadas
  },
  methods: {
    async loadProducts() {
      if (this.loading) return
      
      console.log('🔄 Iniciando carregamento de produtos...')
      this.loading = true
      
      try {
        const params = {
          page: this.pagination.page,
          limit: this.pagination.limit,
          search: this.searchTerm || ''
        }

        console.log('🔍 Carregando produtos com parâmetros:', params)

        // Verificar se apiClient está disponível
        if (!window.apiClient) {
          throw new Error('ApiClient não está disponível')
        }
        
        // Usar o apiClient global com cache (igual ao SchedulesList)
        const apiClient = window.apiClient
        console.log('Token presente:', !!localStorage.getItem('token'))
        console.log('ApiClient disponível:', !!apiClient)

        const response = await apiClient.request('/products', {
          method: 'GET',
          params: params
        })
        
        console.log('🔍 Resposta da API produtos:', response)
        
        // Verificar se response existe (seguindo padrão do SchedulesList)
        if (!response) {
          throw new Error('Resposta inválida da API')
        }
        
        this.products = response.products || []
        this.pagination = {
          ...this.pagination,
          ...response.pagination
        }
        
        console.log(`✅ Produtos carregados: ${this.products.length} itens`)
        
      } catch (error) {
        console.error('Erro ao carregar produtos:', error)
        
        if (error.response?.status === 401) {
          console.log('=== PRODUCTS PAGE: ERRO 401 ===');
          this.showError('Sessão expirada. Alguns dados podem não carregar.');
          return
        }
        
        // Sempre mostrar erro para que o usuário saiba o que aconteceu
        console.log('Erro ao carregar produtos:', error.message)
        this.showError('Erro ao carregar produtos: ' + (error.response?.data?.error || error.message))
      } finally {
        this.loading = false
      }
    },

    async refreshProducts() {
      this.pagination.page = 1
      await this.loadProducts()
    },

    handleSearch() {
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout)
      }
      
      this.searchTimeout = setTimeout(() => {
        this.pagination.page = 1
        this.loadProducts()
      }, 500)
    },

    clearSearch() {
      this.searchTerm = ''
      this.pagination.page = 1
      this.loadProducts()
    },


    changePage(page) {
      if (page < 1 || page > this.pagination.pages || page === this.pagination.page) {
        return
      }
      
      this.pagination.page = page
      this.loadProducts()
    },

    showProductDetails(product) {
      this.selectedProduct = product
      this.showModal = true
    },

    closeModal() {
      this.showModal = false
      this.selectedProduct = null
    },

    formatCnpj(cnpj) {
      if (!cnpj) return '-'
      return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
    },

    formatDate(date) {
      if (!date) return '-'
      const d = new Date(date)
      const dateStr = d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      })
      const timeStr = d.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      })
      return `${dateStr}<br>${timeStr}`
    },

    isConnectionError(error) {
      // Verificar se é erro de conexão/rede que deve ser tratado silenciosamente no primeiro carregamento
      return (
        error.code === 'NETWORK_ERROR' ||
        error.code === 'ECONNRESET' ||
        error.message.includes('ECONNRESET') ||
        error.message.includes('Network Error') ||
        error.message.includes('ApiClient não está disponível') ||
        !error.response // Sem resposta do servidor geralmente indica problema de conexão
      )
    },

    showError(message) {
      // TODO: Implementar sistema de notificação
      console.error(message)
      alert(message)
    }
  }
}
</script>

<style scoped>
/* Garantir que nada ultrapasse a viewport */
* {
  box-sizing: border-box;
  max-width: 100%;
}

.products-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  box-sizing: border-box;
}

.products-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  gap: 20px;
}

.header-left h2 {
  margin: 0;
  color: #333;
  font-size: 1.75rem;
}

.header-left .subtitle {
  margin: 5px 0 0 0;
  color: #666;
  font-size: 0.95rem;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.search-section {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-bottom: 25px;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.search-container {
  position: relative;
  max-width: 500px;
  width: 100%;
  box-sizing: border-box;
}

.search-button {
  white-space: nowrap;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
  z-index: 2;
}

.search-input {
  width: 100%;
  padding: 8px 40px 8px 35px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.875rem;
  background: white;
}

.search-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.1);
}

.clear-search {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 4px;
}


.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  padding: 60px 20px;
}

.loading-content {
  text-align: center;
  max-width: 300px;
}

.spinner-container {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 24px;
}

.spinner-circle {
  width: 12px;
  height: 12px;
  background-color: #007bff;
  border-radius: 50%;
  animation: loading-bounce 1.4s infinite ease-in-out;
}

.spinner-circle:nth-child(1) {
  animation-delay: -0.32s;
}

.spinner-circle:nth-child(2) {
  animation-delay: -0.16s;
}

.spinner-circle:nth-child(3) {
  animation-delay: 0s;
}

@keyframes loading-bounce {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1.2);
    opacity: 1;
  }
}

.loading-text {
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
}

.loading-subtext {
  font-size: 0.9rem;
  color: #666;
  margin: 0;
}

.products-container {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  margin: 0;
}

.products-table-container {
  overflow-x: hidden;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.products-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
  table-layout: fixed;
  max-width: 100%;
  overflow: hidden;
  margin: 0;
  min-width: 0;
}

.products-table th {
  background: #f8f9fa;
  padding: 12px 8px;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #dee2e6;
  white-space: nowrap;
  font-size: 0.875rem;
}

.products-table td {
  padding: 12px 8px;
  border-bottom: 1px solid #eee;
  vertical-align: middle;
  word-wrap: break-word;
  word-break: break-word;
  white-space: normal;
  max-width: 200px;
  font-size: 0.875rem;
}

.products-table tbody tr:hover {
  background-color: #f8f9fa;
}

/* Todas as células seguem a formatação padrão da descrição */
.products-table td span {
  /* Formatação unificada para todas as células */
}

/* Layout responsivo com distribuição equilibrada */
.products-table th,
.products-table td {
  padding: 12px 8px;
  white-space: normal;
  word-break: break-word;
  overflow-wrap: break-word;
  min-width: 0;
}

/* Código Venda */
.products-table th:nth-child(1),
.products-table td:nth-child(1) {
  width: 16%;
}

/* Código Fornecedor */
.products-table th:nth-child(2),
.products-table td:nth-child(2) {
  width: 16%;
}

/* Descrição - prioridade de espaço */
.products-table th:nth-child(3),
.products-table td:nth-child(3) {
  width: 39%;
}

/* Cliente */
.products-table th:nth-child(4),
.products-table td:nth-child(4) {
  width: 14%;
  text-align: center;
}

/* Data */
.products-table th:nth-child(5),
.products-table td:nth-child(5) {
  width: 10%;
  text-align: center;
}

/* Ações */
.products-table th:nth-child(6),
.products-table td:nth-child(6) {
  width: 5%;
  white-space: nowrap;
  text-align: center;
  min-width: 70px;
}

.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: #f8f9fa;
  border-top: 1px solid #dee2e6;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.page-numbers {
  display: flex;
  gap: 5px;
}

.page-numbers .btn {
  min-width: 35px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #dee2e6;
  background: white;
  color: #495057;
}

.page-numbers .btn.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 4rem;
  color: #ccc;
  margin-bottom: 20px;
}

.empty-state h3 {
  color: #666;
  margin-bottom: 10px;
}

.empty-state p {
  color: #888;
  max-width: 400px;
  margin: 0 auto;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-outline-primary {
  background: white;
  color: #007bff;
  border: 1px solid #007bff;
}

.btn-outline-primary:hover:not(:disabled) {
  background: #007bff;
  color: white;
}

.btn-outline-secondary {
  background: white;
  color: #6c757d;
  border: 1px solid #6c757d;
}

.btn-outline-secondary:hover:not(:disabled) {
  background: #6c757d;
  color: white;
}

.btn-info {
  background: #17a2b8;
  color: white;
}

.btn-info:hover:not(:disabled) {
  background: #138496;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
}

/* Responsividade */
@media (max-width: 1200px) {
  .products-page {
    max-width: 100%;
    padding: 15px;
    margin: 0 auto;
  }
  
  /* Tabela mais compacta em telas médias */
  .products-table th,
  .products-table td {
    padding: 10px 6px;
    font-size: 0.8rem;
  }
  
  .products-table th:nth-child(1),
  .products-table td:nth-child(1) {
    width: 15%;
  }
  
  .products-table th:nth-child(2),
  .products-table td:nth-child(2) {
    width: 15%;
  }
  
  .products-table th:nth-child(3),
  .products-table td:nth-child(3) {
    width: 36%;
  }
  
  .products-table th:nth-child(4),
  .products-table td:nth-child(4) {
    width: 16%;
  }
  
  .products-table th:nth-child(5),
  .products-table td:nth-child(5) {
    width: 12%;
  }
  
  .products-table th:nth-child(6),
  .products-table td:nth-child(6) {
    width: 6%;
    min-width: 60px;
  }
}

@media (max-width: 768px) {
  .products-page {
    padding: 10px;
    max-width: 100%;
    margin: 0 auto;
    box-sizing: border-box;
  }
  
  .search-section {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }
  
  .search-container {
    max-width: none;
  }
  
  .search-button {
    align-self: center;
  }
  
  /* Tabela responsiva sem scroll horizontal */
  .products-table-container {
    overflow-x: visible;
  }
  
  .products-table {
    width: 100%;
    table-layout: fixed;
  }
  
  .products-table th,
  .products-table td {
    padding: 8px 6px;
    font-size: 0.8rem;
  }
  
  /* Layout tablet otimizado */
  .products-table th,
  .products-table td {
    padding: 8px 4px;
    font-size: 0.8rem;
  }
  
  .products-table th:nth-child(1),
  .products-table td:nth-child(1) {
    width: 14%;
  }
  
  .products-table th:nth-child(2),
  .products-table td:nth-child(2) {
    width: 14%;
  }
  
  .products-table th:nth-child(3),
  .products-table td:nth-child(3) {
    width: 38%;
  }
  
  .products-table th:nth-child(4),
  .products-table td:nth-child(4) {
    width: 18%;
  }
  
  .products-table th:nth-child(5),
  .products-table td:nth-child(5) {
    width: 11%;
  }
  
  .products-table th:nth-child(6),
  .products-table td:nth-child(6) {
    width: 5%;
    min-width: 50px;
    text-align: center;
  }
  
  .btn-sm {
    padding: 4px 8px;
    font-size: 11px;
  }
  
  /* Paginação responsiva */
  .pagination-container {
    flex-direction: column;
    gap: 10px;
    padding: 10px;
  }
  
  .pagination-controls {
    gap: 8px;
  }
  
  .page-numbers {
    gap: 4px;
  }
  
  .page-numbers .btn {
    min-width: 30px;
    height: 28px;
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .products-page {
    padding: 10px;
    max-width: 100%;
    margin: 0 auto;
    box-sizing: border-box;
  }
  
  .search-input {
    font-size: 16px; /* Previne zoom no iOS */
    padding: 10px 40px 10px 35px;
  }
  
  .products-table {
    width: 100%;
    font-size: 0.8rem;
  }
  
  .products-table th,
  .products-table td {
    padding: 4px 2px;
    font-size: 0.75rem;
    word-break: break-word;
    overflow-wrap: break-word;
  }
  
  /* Layout mobile compacto */
  .products-table th,
  .products-table td {
    padding: 6px 3px;
    font-size: 0.75rem;
  }
  
  .products-table th:nth-child(1),
  .products-table td:nth-child(1) {
    width: 16%;
  }
  
  .products-table th:nth-child(2),
  .products-table td:nth-child(2) {
    width: 16%;
  }
  
  .products-table th:nth-child(3),
  .products-table td:nth-child(3) {
    width: 40%;
  }
  
  .products-table th:nth-child(4),
  .products-table td:nth-child(4) {
    width: 16%;
  }
  
  .products-table th:nth-child(5),
  .products-table td:nth-child(5) {
    width: 8%;
  }
  
  .products-table th:nth-child(6),
  .products-table td:nth-child(6) {
    width: 4%;
    min-width: 40px;
  }
  
  .btn-sm {
    padding: 2px 4px;
    font-size: 9px;
    line-height: 1.2;
  }
  
  .btn-sm i {
    font-size: 8px;
  }
  
  /* Esconder texto do botão em telas muito pequenas */
  .btn-sm .btn-text {
    display: none;
  }
  
  .empty-state {
    padding: 40px 15px;
  }
  
  .empty-icon {
    font-size: 3rem;
  }
}

/* Para telas muito pequenas onde a sidebar ocupa muito espaço */
@media (max-width: 600px) {
  .products-page {
    width: calc(100vw - 260px);
    max-width: calc(100vw - 260px);
    min-width: 300px; /* Largura mínima para funcionalidade */
    padding: 5px;
  }
  
  .products-table th,
  .products-table td {
    padding: 2px 1px;
    font-size: 0.7rem;
  }
}
</style>