<template>
  <div class="schedule-filters">
    <!-- Filter Content -->
    <div class="filter-content">
      <!-- First Row -->
      <div class="filter-row">
        <div class="filter-group">
          <label for="status">Status:</label>
          <select
            id="status"
            v-model="localFilters.status"
            @change="handleSelectChange"
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
            @change="handleSelectChange"
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
            @change="handleSelectChange"
            class="form-control"
          />
        </div>

        <div class="filter-group">
          <label for="date-to">Data até:</label>
          <input
            id="date-to"
            type="date"
            v-model="localFilters.date_to"
            @change="handleSelectChange"
            class="form-control"
          />
        </div>

        <div class="filter-group filter-actions-buttons">
          <button
            class="btn btn-primary"
            @click="applyFilters"
            title="Aplicar filtros"
          >
            <i class="fas fa-search"></i>
            Filtrar
          </button>
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
export default {
  name: 'ScheduleFilters',

  props: {
    filters: {
      type: Object,
      required: true,
    },
    statusOptions: {
      type: Array,
      default: () => [],
    },
    availableClients: {
      type: Array,
      default: () => [],
    },
  },

  data() {
    return {
      localFilters: { ...this.filters },
    }
  },

  watch: {
    filters: {
      handler(newFilters) {
        this.localFilters = { ...newFilters }
      },
      deep: true,
    },
  },

  computed: {
    hasActiveFilters() {
      return Object.values(this.localFilters).some(
        value => value && value.toString().trim() !== ''
      )
    },

    filterCount() {
      return Object.values(this.localFilters).filter(
        value => value && value.toString().trim() !== ''
      ).length
    },
  },

  methods: {
    applyFilters() {
      this.$emit('filters-changed', { ...this.localFilters })
    },

    resetFilters() {
      this.localFilters = {
        status: '',
        client: '',
        date_from: '',
        date_to: '',
      }
      this.$emit('reset-filters')
    },

    handleInputChange() {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = setTimeout(() => {
        this.applyFilters()
      }, 500)
    },

    handleSelectChange() {
      this.applyFilters()
    },

    formatDate(dateString) {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toISOString().split('T')[0]
    },

  },


  beforeUnmount() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }
  },
}
</script>

<style scoped>
.schedule-filters {
  background: #fff;
  border: none;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.filter-header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 0;
}

.filter-title h4 {
  margin: 0;
  color: #333;
  font-size: 1.1rem;
}

.filter-count {
  background: #007bff;
  color: white;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  margin-left: 0.5rem;
}

.filter-actions {
  display: flex;
  gap: 0.5rem;
}

.filter-content {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: end;
  justify-content: center;
}

.filter-row {
  display: flex;
  gap: 1rem;
  align-items: end;
  flex-wrap: wrap;
  justify-content: center;
  width: 100%;
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
  .filter-content {
    flex-direction: column;
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
