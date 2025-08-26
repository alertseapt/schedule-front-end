<template>
  <div class="nfe-search-bar">
    <div class="search-container">
      <div class="search-input-group">
        <i class="fas fa-search search-icon"></i>
        <input
          type="text"
          v-model="searchInput"
          @keyup.enter="handleSearch"
          :disabled="loading"
          placeholder="Digite o número da NF-e ou chave de acesso (44 dígitos)"
          class="search-input"
        />
        <button
          @click="handleSearch"
          :disabled="loading || !searchInput.trim()"
          class="search-button"
        >
          <i v-if="loading" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-search"></i>
          Buscar
        </button>
      </div>
      
      <!-- Filter Inputs -->
      <div class="filter-row">
        <div class="filter-group">
          <label for="status">Status:</label>
          <select
            id="status"
            v-model="localFilters.status"
            @change="handleFilterChange"
            class="form-control"
          >
            <option value="">Todos</option>
            <option
              v-for="option in statusOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label for="client">Cliente/Estoque:</label>
          <select
            id="client"
            v-model="localFilters.client"
            @change="handleFilterChange"
            class="form-control"
          >
            <option value="">Todos</option>
            <option
              v-for="client in availableClients"
              :key="client.cnpj"
              :value="client.cnpj"
            >
              {{ client.name }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label for="date-from">Data de:</label>
          <input
            id="date-from"
            type="date"
            v-model="localFilters.date_from"
            @change="handleFilterChange"
            class="form-control"
          />
        </div>

        <div class="filter-group">
          <label for="date-to">Data até:</label>
          <input
            id="date-to"
            type="date"
            v-model="localFilters.date_to"
            @change="handleFilterChange"
            class="form-control"
          />
        </div>

        <div class="filter-group filter-actions-buttons">
          <button
            v-if="hasActiveFilters"
            class="btn btn-sm btn-outline-danger"
            @click="resetFilters"
            title="Limpar filtros"
          >
            <i class="fas fa-times"></i>
            Limpar
          </button>
        </div>
      </div>
      
    </div>
  </div>
</template>

<script>
import apiService from '../services/api.js'

export default {
  name: 'NfeSearchBar',
  
  props: {
    showHelp: {
      type: Boolean,
      default: true
    },
    filters: {
      type: Object,
      default: () => ({})
    },
    statusOptions: {
      type: Array,
      default: () => []
    },
    availableClients: {
      type: Array,
      default: () => []
    }
  },
  
  emits: ['search-results', 'search-error', 'search-start', 'filters-changed', 'reset-filters'],
  
  data() {
    return {
      searchInput: '',
      loading: false,
      searchHelp: this.showHelp,
      localFilters: { 
        status: '',
        client: '',
        date_from: '',
        date_to: '',
        ...this.filters 
      }
    }
  },

  watch: {
    filters: {
      handler(newFilters) {
        this.localFilters = { ...this.localFilters, ...newFilters }
      },
      deep: true
    }
  },

  computed: {
    hasActiveFilters() {
      return Object.values(this.localFilters).some(
        value => value && value.toString().trim() !== ''
      )
    }
  },
  
  methods: {
    async handleSearch() {
      const input = this.searchInput.trim()
      
      if (!input) {
        return
      }
      
      this.loading = true
      this.$emit('search-start')
      
      try {
        console.log('🔍 Iniciando busca por NFe/chave:', input)
        
        const response = await apiService.post('/schedule-verification/search', {
          input: input
        })
        
        console.log('✅ Resultados da busca:', response)
        
        if (response && response.success) {
          this.$emit('search-results', {
            results: response.results,
            searchType: response.searchType,
            searchValue: response.searchValue
          })
          
          // Limpar campo após busca bem-sucedida
          this.searchInput = ''
        } else {
          const errorMsg = response?.message || 'Erro na busca'
          this.$emit('search-error', errorMsg)
        }
        
      } catch (error) {
        console.error('❌ Erro na busca por NFe/chave:', error)
        
        let errorMessage = 'Erro ao buscar agendamento'
        if (error.response?.error) {
          errorMessage = error.response.error
        } else if (error.message) {
          errorMessage = error.message
        }
        
        this.$emit('search-error', errorMessage)
      } finally {
        this.loading = false
      }
    },

    resetFilters() {
      this.localFilters = {
        status: '',
        client: '',
        date_from: '',
        date_to: ''
      }
      this.$emit('reset-filters')
    },

    handleFilterChange() {
      this.$emit('filters-changed', { ...this.localFilters })
    }
  }
}
</script>

<style scoped>
.nfe-search-bar {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.search-container {
  max-width: 800px;
  margin: 0 auto;
}

.search-input-group {
  display: flex;
  align-items: center;
  position: relative;
  margin-bottom: 0.5rem;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: #6c757d;
  z-index: 2;
}

.search-input {
  flex: 1;
  padding: 0.75rem 0.75rem 0.75rem 2.5rem;
  border: 2px solid #e0e0e0;
  border-radius: 6px 0 0 6px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #007bff;
}

.search-input:disabled {
  background-color: #f8f9fa;
  cursor: not-allowed;
}

.search-button {
  padding: 0.75rem 1.5rem;
  background: #007bff;
  color: white;
  border: 2px solid #007bff;
  border-left: none;
  border-radius: 0 6px 6px 0;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.search-button:hover:not(:disabled) {
  background: #0056b3;
  border-color: #0056b3;
}

.search-button:disabled {
  background: #6c757d;
  border-color: #6c757d;
  cursor: not-allowed;
}

.search-help {
  text-align: center;
  margin-top: 0.5rem;
}

.search-help .text-muted {
  color: #6c757d !important;
}

/* Filter Styles */
.filter-row {
  display: flex;
  gap: 1rem;
  align-items: end;
  flex-wrap: wrap;
  justify-content: center;
  width: 100%;
  margin-top: 1rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  min-width: 120px;
  flex: 1;
  max-width: 200px;
}

.filter-group label {
  font-size: 0.85rem;
  font-weight: 500;
  color: #555;
  margin-bottom: 0.3rem;
}

.filter-group .form-control {
  padding: 0.3rem 0.5rem;
  font-size: 0.85rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  height: 32px;
}

.filter-group .form-control:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.filter-actions-buttons {
  display: flex;
  gap: 0.5rem;
  align-items: end;
  min-width: auto;
  flex: 0 0 auto;
}

.filter-actions-buttons .btn {
  padding: 0.3rem 0.6rem;
  font-size: 0.8rem;
  height: 32px;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

/* Responsivo */
@media (max-width: 1200px) {
  .filter-row {
    flex-wrap: wrap;
  }
  
  .filter-group {
    min-width: 120px;
    flex: 1 1 auto;
  }
}

@media (max-width: 768px) {
  .search-input-group {
    flex-direction: column;
  }
  
  .search-input {
    border-radius: 6px;
    border-right: 2px solid #e0e0e0;
    margin-bottom: 0.5rem;
  }
  
  .search-button {
    border-radius: 6px;
    border: 2px solid #007bff;
    width: 100%;
    justify-content: center;
  }
  
  .filter-row {
    flex-direction: column;
    width: 100%;
  }
  
  .filter-group {
    min-width: 100%;
    flex: 1;
  }
  
  .filter-actions-buttons {
    flex-direction: row;
    justify-content: center;
    min-width: 100%;
  }
}
</style>