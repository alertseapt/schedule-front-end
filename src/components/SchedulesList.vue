<template>
  <div class="schedules-list">
    <!-- Busca por NFe/Chave e Filtros -->
    <NfeSearchBar
      :filters="currentFilters"
      :status-options="statusOptions"
      :available-clients="availableClients"
      @search-results="handleSearchResults"
      @search-error="handleSearchError"
      @search-start="handleSearchStart"
      @filters-changed="handleFiltersChanged"
      @reset-filters="handleResetFilters"
    />

    <!-- Indicador de Busca Ativa -->
    <div v-if="isSearchActive" class="search-indicator mb-3">
      <div class="search-active-card">
        <div class="search-content">
          <div class="search-header">
            <div class="search-icon">
              <i class="fas fa-search"></i>
            </div>
            <div class="search-details">
              <div class="search-type">
                {{ currentSearchInfo.type === 'nfe_key' ? 'Chave de Acesso' : 'Número da NF-e' }}
              </div>
              <div class="search-value">
                {{ currentSearchInfo.value }}
              </div>
            </div>
          </div>
          <div class="search-results">
            <div class="results-count">
              <span class="count-number">{{ currentSearchInfo.count }}</span>
              <span class="count-label">{{ currentSearchInfo.count === 1 ? 'resultado' : 'resultados' }}</span>
            </div>
          </div>
        </div>
        <div class="search-actions">
          <button class="clear-search-btn" @click="clearSearch" title="Limpar busca">
            <i class="fas fa-times"></i>
            <span>Limpar</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="table-container">
      <div v-if="loading" class="loading-container">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Carregando agendamentos...</p>
      </div>

      <div v-else-if="schedules.length === 0" class="empty-state">
        <i class="fas fa-inbox"></i>
        <h3>Nenhum agendamento encontrado</h3>
        <p>Não há agendamentos que correspondam aos filtros aplicados.</p>
      </div>


      <div class="table-wrapper" ref="tableWrapper">
        <table class="schedules-table">
        <thead>
          <tr>
            <th>N° NF-e</th>
            <th>Cliente</th>
            <th>Data de Entrega</th>
            <th>Volumes</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="schedule in schedules" :key="schedule.id">
            <td>{{ schedule.number }}</td>
            <td>{{ schedule.client }}</td>
            <td>{{ formatDate(schedule.date) }}</td>
            <td>{{ schedule.case_count }}</td>
            <td>
              <span
                :class="'status-badge ' + getStatusBadge(schedule.status).class"
                class="status-badge"
              >
                {{ getStatusBadge(schedule.status).label }}
              </span>
            </td>
            <td>
              <div class="schedule-actions">
                <!-- Botão de detalhes (apenas para agendamentos normais) -->
                <button
                  v-if="!isBookingSchedule(schedule)"
                  class="btn btn-sm btn-outline-primary"
                  @click="openInfoModal(schedule)"
                  title="Mais informações"
                >
                  <i class="fas fa-info-circle"></i>
                  Detalhes
                </button>
                
                <!-- Indicador de agendamento de marcação -->
                <span
                  v-if="isBookingSchedule(schedule)"
                  class="booking-badge"
                  title="Agendamento de Marcação"
                >
                  <i class="fas fa-calendar-plus"></i>
                  Marcação
                </span>
                
              </div>
            </td>
          </tr>
        </tbody>
        </table>
      </div>

      <!-- Loading indicator for infinite scroll - fora da tabela -->
      <div v-if="loadingMore" class="loading-more">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Carregando mais agendamentos...</p>
      </div>

      <!-- Indicador de fim da lista -->
      <div v-else-if="schedules.length > 0 && !pagination.hasMore" class="end-of-list">
        <i class="fas fa-check-circle"></i>
        <p>Todos os agendamentos foram carregados ({{ schedules.length }} total)</p>
      </div>

    </div>

    <!-- Modals -->
    <nfe-info-modal
      v-if="showInfoModal"
      :nfe-data="selectedSchedule"
      :show-modal="showInfoModal"
      @close="closeInfoModal"
      @edit="openEditModal"
    >
    </nfe-info-modal>


    <schedule-edit-modal
      v-if="showEditModal"
      :schedule-data="scheduleToEdit"
      :show-modal="showEditModal"
      @close="closeEditModal"
      @updated="handleScheduleUpdated"
      @notification="$emit('notification', $event)"
    >
    </schedule-edit-modal>

    <schedule-booking-modal
      v-if="showBookingModal"
      :show-modal="showBookingModal"
      @close="closeBookingModal"
      @created="handleBookingCreated"
    >
    </schedule-booking-modal>
  </div>
</template>

<script>
import NfeInfoModal from './NfeInfoModal.vue'
import ScheduleEditModal from './ScheduleEditModal.vue'
import NfeSearchBar from './NfeSearchBar.vue'
import ScheduleBookingModal from './ScheduleBookingModal.vue'

export default {
  name: 'SchedulesList',

  components: {
    NfeInfoModal,
    ScheduleEditModal,
    NfeSearchBar,
    ScheduleBookingModal,
  },

  data() {
    return {
      schedules: [],
      loading: false,
      selectedSchedule: null,
      selectedSchedules: [],
      newDate: '',
      bulkActionLoading: false,
      showInfoModal: false,
      showEditModal: false,
      scheduleToEdit: null,
      showBookingModal: false,
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        hasMore: true,
      },
      loadingMore: false,
      scrollTimeout: null, // Para throttling do scroll
      
      // Filtros
      currentFilters: {
        status: '',
        client: '',
        date_from: '',
        date_to: '',
        nfe_number: '',
      },
      availableClients: [],
      
      // Variáveis para controle de pesquisa
      isSearchActive: false,
      originalSchedules: [],
      currentSearchInfo: null,
    }
  },

  computed: {
    statusConfig() {
      return {
        Solicitado: { class: 'warning', label: 'Solicitado' },
        Contestado: { class: 'contestado', label: 'Contestado' },
        Agendado: { class: 'primary', label: 'Agendado' },
        Conferência: { class: 'success', label: 'Conferência' },
        Recebido: { class: 'success', label: 'Conferência' }, // Compatibilidade com dados antigos
        Tratativa: { class: 'danger', label: 'Tratativa' },
        'Em estoque': { class: 'success', label: 'Em estoque' },
        'Estoque': { class: 'success', label: 'Em estoque' }, // Compatibilidade com dados antigos
        Recusar: { class: 'danger', label: 'Recusar' },
        Cancelar: { class: 'warning', label: 'Cancelar' },
        Recusado: { class: 'dark', label: 'Recusado' },
        Cancelado: { class: 'secondary', label: 'Cancelado' },
        Marcação: { class: 'booking', label: 'Marcação' },
      }
    },

    selectedScheduleStatuses() {
      const selected = this.schedules.filter(s => this.selectedSchedules.includes(s.id))
      return [...new Set(selected.map(s => s.status))]
    },
    cancelRequestedBy() {
      if (this.selectedSchedules.length === 0) return 'administrador'
      
      const selected = this.schedules.filter(s => this.selectedSchedules.includes(s.id))
      if (selected.length === 0) return 'administrador'
      
      const schedule = selected[0]
      if (!schedule.historic) return 'administrador'
      
      // Procurar no histórico por uma entrada de cancelamento
      const historicEntries = Object.values(schedule.historic)
      const cancelEntry = historicEntries.find(entry => 
        entry.action && entry.action.includes('Cancelar') || 
        entry.action && entry.action.includes('cancelamento')
      )
      
      return cancelEntry && cancelEntry.user ? cancelEntry.user : 'administrador'
    },

    canBulkManage() {
      return this.selectedSchedules.length > 0 && this.selectedScheduleStatuses.length === 1
    },

    userLevel() {
      try {
        const userData = localStorage.getItem('user')
        if (!userData) return null
        const user = JSON.parse(userData)
        return user.level_access
      } catch (error) {
        console.error('Erro ao obter nível do usuário:', error)
        return null
      }
    },

    today() {
      return new Date().toISOString().split('T')[0]
    },

    canCreateBooking() {
      return this.userLevel !== 1
    },
    
    statusOptions() {
      return [
        { value: '', label: 'Todos os status' },
        { value: 'Solicitado', label: 'Solicitado' },
        { value: 'Contestado', label: 'Contestado' },
        { value: 'Agendado', label: 'Agendado' },
        { value: 'Conferência', label: 'Conferência' },
        { value: 'Tratativa', label: 'Tratativa' },
        { value: 'Em estoque', label: 'Em estoque' },
        { value: 'Cancelar', label: 'Cancelar' },
        { value: 'Cancelado', label: 'Cancelado' },
        { value: 'Recusado', label: 'Recusado' },
        { value: 'Marcação', label: 'Marcação' },
      ]
    },
  },

  methods: {
    async loadSchedules() {
      if (this.pagination.page === 1) {
        this.loading = true
        this.clearSelection() // Clear selection when reloading
      }
      try {
        // Usar o apiClient global com cache
        const apiClient = window.apiClient
        console.log('Fazendo requisição para /schedules')
        console.log('Token presente:', !!localStorage.getItem('token'))

        const response = await apiClient.request('/schedules', {
          method: 'GET',
          params: {
            page: this.pagination.page,
            limit: this.pagination.limit,
            ...this.currentFilters // Aplicar filtros
          },
        })

        console.log('Resposta recebida:', response)
        const newSchedules = response.schedules || []
        
        if (this.pagination.page === 1) {
          this.schedules = newSchedules
        } else {
          this.schedules = [...this.schedules, ...newSchedules]
        }
        
        this.pagination.total = response.pagination?.total || 0
        // Se recebeu menos agendamentos que o limite, não há mais dados
        this.pagination.hasMore = newSchedules.length === this.pagination.limit && newSchedules.length > 0
        
        if (!this.pagination.hasMore && this.pagination.page > 1) {
          console.log(`📄 Fim da lista: carregados ${newSchedules.length} de ${this.pagination.limit} agendamentos na página ${this.pagination.page}`)
        }
      } catch (error) {
        console.error('Erro ao carregar agendamentos:', error)
        console.error('URL da requisição:', error.config?.url)
        console.error('Status do erro:', error.response?.status)
        console.error('Dados do erro:', error.response?.data)
        console.error('Headers da requisição:', error.config?.headers)

        // Verificar se é erro de autenticação
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.log('=== SCHEDULES LIST: ERRO 401/403 ===');
          console.log('REMOVENDO REDIRECIONAMENTO AUTOMÁTICO');
          console.log('Deixando que o usuário continue usando a interface');
          
          this.$emit('notification', {
            type: 'warning',
            message: 'Sessão expirada. Alguns dados podem não carregar.',
          })
          
          // NÃO remover token nem redirecionar automaticamente
          // Apenas logar o erro
          return
        }

        // Verificar se é erro de servidor
        if (error.response?.status === 500) {
          this.$emit('notification', {
            type: 'error',
            message:
              'Erro interno do servidor. Verifique se o backend está funcionando corretamente.',
          })
        } else {
          this.$emit('notification', {
            type: 'error',
            message: `Erro ao carregar agendamentos: ${error.response?.status || 'Erro desconhecido'}`,
          })
        }

        this.schedules = []
        // Em caso de erro, parar de tentar carregar mais
        this.pagination.hasMore = false
      } finally {
        if (this.pagination.page === 1) {
          this.loading = false
        }
      }
    },

    openInfoModal(schedule) {
      console.log('📋 Abrindo modal NFe:', schedule)
      this.selectedSchedule = schedule
      this.showInfoModal = true
      console.log('📋 Modal state:', {
        showInfoModal: this.showInfoModal,
        selectedSchedule: this.selectedSchedule,
      })
    },

    closeInfoModal() {
      this.showInfoModal = false
      this.selectedSchedule = null
    },


    openEditModal(schedule) {
      console.log('🔧 Abrindo modal de edição:', schedule)
      this.scheduleToEdit = schedule
      this.showEditModal = true
      // Fechar o modal de informações NFe se estiver aberto
      this.showInfoModal = false
    },

    closeEditModal() {
      this.showEditModal = false
      this.scheduleToEdit = null
    },

    handleScheduleUpdated(updatedSchedule) {
      console.log('✅ Agendamento atualizado:', updatedSchedule)
      // Recarregar a lista para mostrar as alterações
      this.loadSchedules()
      this.closeEditModal()
    },

    async loadMoreSchedules() {
      if (this.loadingMore || !this.pagination.hasMore) {
        console.log('🛑 loadMoreSchedules: bloqueado', { 
          loadingMore: this.loadingMore, 
          hasMore: this.pagination.hasMore 
        })
        return
      }
      
      console.log(`📖 Carregando página ${this.pagination.page + 1}...`)
      this.loadingMore = true
      this.pagination.page += 1
      
      try {
        await this.loadSchedules()
      } catch (error) {
        console.error('❌ Erro ao carregar mais agendamentos:', error)
        // Se der erro, volta a página anterior e para de tentar
        this.pagination.page -= 1
        this.pagination.hasMore = false
      } finally {
        this.loadingMore = false
        console.log(`✅ loadingMore finalizado. hasMore: ${this.pagination.hasMore}`)
      }
    },

    handleScroll() {
      // Throttle para melhorar performance
      if (this.scrollTimeout) return
      
      this.scrollTimeout = setTimeout(() => {
        // Detectar scroll da página inteira em vez do container
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop
        const windowHeight = window.innerHeight
        const documentHeight = document.documentElement.scrollHeight
        const threshold = 200 // pixels do fim para começar a carregar
        
        // Verificar se chegou próximo ao fim da página E ainda há mais dados para carregar
        if (scrollTop + windowHeight >= documentHeight - threshold && this.pagination.hasMore && !this.loadingMore) {
          this.loadMoreSchedules()
        }
        
        this.scrollTimeout = null
      }, 100) // 100ms de throttle
    },

    getStatusBadge(status) {
      return (
        this.statusConfig[status] || {
          class: 'secondary',
          label: 'Desconhecido',
        }
      )
    },

    formatDate(dateString) {
      if (!dateString) return '-'
      
      // Evitar problemas de timezone para datas no formato YYYY-MM-DD
      if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const [year, month, day] = dateString.split('-')
        return `${day}/${month}/${year}`
      }
      
      // Fallback para outros formatos
      try {
        const date = new Date(dateString)
        return date.toLocaleDateString('pt-BR')
      } catch (error) {
        return dateString
      }
    },

    formatCurrency(value) {
      if (!value) return 'R$ 0,00'
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(value)
    },
    
    formatDateForDisplay(dateString) {
      if (!dateString) return ''
      
      // Para datas no formato YYYY-MM-DD, evitar conversão de timezone
      if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const [year, month, day] = dateString.split('-')
        return `${day}/${month}/${year}`
      }
      
      try {
        const date = new Date(dateString)
        return date.toLocaleDateString('pt-BR')
      } catch (error) {
        return dateString
      }
    },


    onScheduleSelect() {
      // Verificar se todos os agendamentos selecionáveis estão selecionados
      const selectableSchedules = this.schedules.filter(schedule => 
        this.canSelectSchedule(schedule)
      )
      // Checkbox select all removido - apenas seleção individual
      
      // Verificar se os agendamentos selecionados têm o mesmo status
      const selectedStatuses = this.selectedScheduleStatuses
      if (selectedStatuses.length > 1) {
        // Se tiver status diferentes, manter apenas o último selecionado
        const lastSelected = this.selectedSchedules[this.selectedSchedules.length - 1]
        const lastSelectedSchedule = this.schedules.find(s => s.id === lastSelected)
        if (lastSelectedSchedule) {
          this.selectedSchedules = this.selectedSchedules.filter(id => {
            const schedule = this.schedules.find(s => s.id === id)
            return schedule && schedule.status === lastSelectedSchedule.status
          })
        }
      }
    },

    canSelectSchedule(schedule) {
      // Verificar se pode selecionar baseado no status e permissões do usuário
      const allowedStatuses = ['Solicitado', 'Contestado', 'Cancelar', 'Agendado', 'Conferência', 'Recebido', 'Tratativa', 'Em estoque', 'Estoque', 'Marcação']
      if (!allowedStatuses.includes(schedule.status)) return false

      // Para agendamentos de marcação, verificar se usuário tem permissão
      if (schedule.status === 'Marcação') {
        // Apenas usuários com nível diferente de 1 podem selecionar marcações
        if (this.userLevel === 1 || this.userLevel === '1') {
          return false
        }
      }

      // Se já tem agendamentos selecionados, só pode selecionar do mesmo status
      if (this.selectedSchedules.length > 0) {
        const selectedStatuses = this.selectedScheduleStatuses
        if (selectedStatuses.length === 1 && !selectedStatuses.includes(schedule.status)) {
          return false
        }
      }

      return true
    },

    clearSelection() {
      this.selectedSchedules = []
      this.newDate = ''
    },

    async acceptSchedules() {
      if (this.selectedSchedules.length === 0) return

      this.bulkActionLoading = true
      try {
        await this.bulkUpdateStatus('Agendado', 'Agendamento aceito')
        this.$emit('notification', {
          type: 'success',
          message: `${this.selectedSchedules.length} agendamento(s) aceito(s) com sucesso`
        })
        this.clearSelection()
        await this.loadSchedules()
      } catch (error) {
        console.error('Erro ao aceitar agendamentos:', error)
        this.$emit('notification', {
          type: 'error',
          message: 'Erro ao aceitar agendamentos'
        })
      } finally {
        this.bulkActionLoading = false
      }
    },

    async changeDateToContestado() {
      if (this.selectedSchedules.length === 0 || !this.newDate) return

      this.bulkActionLoading = true
      try {
        await this.bulkUpdateStatusWithDateAndComment('Contestado', this.newDate)
        this.$emit('notification', {
          type: 'success',
          message: `Data alterada para ${this.selectedSchedules.length} agendamento(s)`
        })
        this.clearSelection()
        await this.loadSchedules()
      } catch (error) {
        console.error('Erro ao alterar data:', error)
        this.$emit('notification', {
          type: 'error',
          message: 'Erro ao alterar data dos agendamentos'
        })
      } finally {
        this.bulkActionLoading = false
      }
    },

    async acceptNewDate() {
      if (this.selectedSchedules.length === 0) return

      this.bulkActionLoading = true
      try {
        await this.bulkUpdateStatus('Agendado', 'Nova data aceita')
        this.$emit('notification', {
          type: 'success',
          message: `Nova data aceita para ${this.selectedSchedules.length} agendamento(s)`
        })
        this.clearSelection()
        await this.loadSchedules()
      } catch (error) {
        console.error('Erro ao aceitar nova data:', error)
        this.$emit('notification', {
          type: 'error',
          message: 'Erro ao aceitar nova data'
        })
      } finally {
        this.bulkActionLoading = false
      }
    },

    async confirmContestado() {
      if (this.selectedSchedules.length === 0) return

      this.bulkActionLoading = true
      try {
        await this.bulkUpdateStatus('Agendado', 'Data contestada confirmada')
        this.$emit('notification', {
          type: 'success',
          message: `${this.selectedSchedules.length} agendamento(s) confirmado(s)`
        })
        this.clearSelection()
        await this.loadSchedules()
      } catch (error) {
        console.error('Erro ao confirmar agendamentos:', error)
        this.$emit('notification', {
          type: 'error',
          message: 'Erro ao confirmar agendamentos'
        })
      } finally {
        this.bulkActionLoading = false
      }
    },

    async changeContestadoToAgendado() {
      if (this.selectedSchedules.length === 0 || !this.newDate) return

      this.bulkActionLoading = true
      try {
        await this.bulkUpdateStatusWithDate('Agendado', this.newDate, 'Data contestada reagendada')
        this.$emit('notification', {
          type: 'success',
          message: `${this.selectedSchedules.length} agendamento(s) reagendado(s)`
        })
        this.clearSelection()
        await this.loadSchedules()
      } catch (error) {
        console.error('Erro ao reagendar:', error)
        this.$emit('notification', {
          type: 'error',
          message: 'Erro ao reagendar agendamentos'
        })
      } finally {
        this.bulkActionLoading = false
      }
    },
    
    async cancelSchedules() {
      if (this.selectedSchedules.length === 0) return
      
      if (!confirm(`Tem certeza que deseja cancelar ${this.selectedSchedules.length} agendamento(s)?`)) {
        return
      }
      
      this.bulkActionLoading = true
      try {
        // Usuário nível 1 (admin) -> status "Cancelar" (precisa aprovação)
        // Outros usuários -> status "Cancelado" (cancelamento direto)
        const newStatus = this.userLevel === 1 ? 'Cancelar' : 'Cancelado'
        const comment = this.userLevel === 1 ? 'Agendamento solicitado para cancelamento' : 'Agendamento cancelado diretamente'
        
        await this.bulkUpdateStatus(newStatus, comment)
        
        const message = this.userLevel === 1 
          ? `${this.selectedSchedules.length} agendamento(s) marcado(s) para cancelamento` 
          : `${this.selectedSchedules.length} agendamento(s) cancelado(s) com sucesso`
          
        this.$emit('notification', {
          type: 'success',
          message: message
        })
        this.clearSelection()
        await this.loadSchedules()
      } catch (error) {
        console.error('Erro ao cancelar agendamentos:', error)
        this.$emit('notification', {
          type: 'error',
          message: 'Erro ao cancelar agendamentos'
        })
      } finally {
        this.bulkActionLoading = false
      }
    },

    async deleteMarcacoes() {
      if (this.selectedSchedules.length === 0) return
      
      if (!confirm(`Tem certeza que deseja excluir ${this.selectedSchedules.length} marcação(ões)? Esta ação não pode ser desfeita.`)) {
        return
      }
      
      this.bulkActionLoading = true
      try {
        const apiClient = window.apiClient
        
        // Deletar cada marcação selecionada
        for (const scheduleId of this.selectedSchedules) {
          await apiClient.request(`/schedules/${scheduleId}`, {
            method: 'DELETE'
          })
        }
        
        this.$emit('notification', {
          type: 'success',
          message: `${this.selectedSchedules.length} marcação(ões) excluída(s) com sucesso`
        })
        this.clearSelection()
        await this.loadSchedules()
      } catch (error) {
        console.error('Erro ao excluir marcações:', error)
        this.$emit('notification', {
          type: 'error',
          message: 'Erro ao excluir marcações'
        })
      } finally {
        this.bulkActionLoading = false
      }
    },
    
    async markAsReceived() {
      if (this.selectedSchedules.length === 0) return
      
      if (!confirm(`Tem certeza que deseja marcar ${this.selectedSchedules.length} agendamento(s) como em conferência?`)) {
        return
      }
      
      this.bulkActionLoading = true
      try {
        await this.bulkUpdateStatus('Conferência', 'Agendamento marcado como em conferência')
        this.$emit('notification', {
          type: 'success',
          message: `${this.selectedSchedules.length} agendamento(s) marcado(s) como em conferência`
        })
        this.clearSelection()
        await this.loadSchedules()
      } catch (error) {
        console.error('Erro ao marcar como em conferência:', error)
        this.$emit('notification', {
          type: 'error',
          message: 'Erro ao marcar agendamentos como em conferência'
        })
      } finally {
        this.bulkActionLoading = false
      }
    },

    async markAsEstoque() {
      if (this.selectedSchedules.length === 0) return
      
      if (!confirm(`Tem certeza que deseja marcar ${this.selectedSchedules.length} agendamento(s) como estoque?`)) {
        return
      }
      
      this.bulkActionLoading = true
      try {
        await this.bulkUpdateStatus('Em estoque', 'Agendamento marcado como estoque')
        this.$emit('notification', {
          type: 'success',
          message: `${this.selectedSchedules.length} agendamento(s) marcado(s) como estoque`
        })
        this.clearSelection()
        await this.loadSchedules()
      } catch (error) {
        console.error('Erro ao marcar como estoque:', error)
        this.$emit('notification', {
          type: 'error',
          message: 'Erro ao marcar agendamentos como estoque'
        })
      } finally {
        this.bulkActionLoading = false
      }
    },

    async acceptCancellation() {
      if (this.selectedSchedules.length === 0) return
      
      if (!confirm(`Tem certeza que deseja aceitar o cancelamento de ${this.selectedSchedules.length} agendamento(s)?`)) {
        return
      }
      
      this.bulkActionLoading = true
      try {
        await this.bulkUpdateStatus('Cancelado', 'Cancelamento aceito')
        this.$emit('notification', {
          type: 'success',
          message: `${this.selectedSchedules.length} cancelamento(s) aceito(s)`
        })
        this.clearSelection()
        await this.loadSchedules()
      } catch (error) {
        console.error('Erro ao aceitar cancelamento:', error)
        this.$emit('notification', {
          type: 'error',
          message: 'Erro ao aceitar cancelamento'
        })
      } finally {
        this.bulkActionLoading = false
      }
    },

    async bulkUpdateStatus(newStatus, comment) {
      // Usar o apiClient global com cache
      const apiClient = window.apiClient
      
      for (const scheduleId of this.selectedSchedules) {
        const payload = {
          status: newStatus,
          historic_entry: {
            user: this.getCurrentUser().user || this.getCurrentUser().name || 'Usuário',
            action: `Status alterado para ${newStatus}`,
            comment: comment
          }
        }
        
        console.log('📤 Enviando payload para status update:', payload)
        console.log('📍 URL:', `/schedules/${scheduleId}/status`)
        
        await apiClient.request(`/schedules/${scheduleId}/status`, {
          method: 'PATCH',
          data: payload
        })
      }
    },

    async bulkUpdateStatusWithDate(newStatus, newDate, comment) {
      // Usar o apiClient global com cache
      const apiClient = window.apiClient
      
      // Garantir que a data seja formatada corretamente
      const formattedDate = this.formatDateForBackend(newDate)
      console.log(`📤 Data escolhida: ${newDate}`)
      console.log(`📤 Data formatada para backend: ${formattedDate}`)
      
      for (const scheduleId of this.selectedSchedules) {
        console.log(`📤 Atualizando agendamento ${scheduleId} com nova data ${formattedDate} e status ${newStatus}`)
        
        // Buscar o agendamento atual para ter todos os dados
        const scheduleResponse = await apiClient.request(`/schedules/${scheduleId}`, {
          method: 'GET'
        })
        
        const currentSchedule = scheduleResponse.schedule
        
        // Atualizar com todos os campos necessários incluindo a nova data
        const updatePayload = {
          number: currentSchedule.number,
          nfe_key: currentSchedule.nfe_key,
          client: currentSchedule.client_cnpj || currentSchedule.client,
          case_count: currentSchedule.case_count,
          date: formattedDate,
          qt_prod: currentSchedule.qt_prod,
          historic: {
            ...currentSchedule.historic,
            [`date_change_${Date.now()}`]: {
              timestamp: new Date().toISOString(),
              user: this.getCurrentUser().user || this.getCurrentUser().name || 'Usuário',
              action: `Data alterada de ${this.formatDateForDisplay(currentSchedule.date)} para ${this.formatDateForDisplay(formattedDate)}`,
              comment: 'Data alterada via bulk action',
              previous_date: currentSchedule.date,
              new_date: formattedDate
            }
          }
        }
        
        console.log('📤 Payload para atualização:', updatePayload)
        
        // Primeiro atualiza a data e dados
        await apiClient.request(`/schedules/${scheduleId}`, {
          method: 'PUT',
          data: updatePayload
        })
        
        // Depois atualiza o status
        const statusPayload = {
          status: newStatus,
          historic_entry: {
            user: this.getCurrentUser().user || this.getCurrentUser().name || 'Usuário',
            action: `Status alterado para ${newStatus} com nova data ${this.formatDateForDisplay(formattedDate)}`,
            comment: comment
          }
        }
        
        console.log('📤 Payload para status:', statusPayload)
        
        await apiClient.request(`/schedules/${scheduleId}/status`, {
          method: 'PATCH',
          data: statusPayload
        })
      }
    },

    async bulkUpdateStatusWithDateAndComment(newStatus, newDate) {
      // Usar o apiClient global com cache
      const apiClient = window.apiClient
      const formattedDate = this.formatDateForBackend(newDate)
      
      for (const scheduleId of this.selectedSchedules) {
        // Buscar o agendamento atual para ter todos os dados
        const scheduleResponse = await apiClient.request(`/schedules/${scheduleId}`, {
          method: 'GET'
        })
        
        const currentSchedule = scheduleResponse.schedule
        
        // Gerar comentário personalizado para contestação
        const oldDateFormatted = this.formatDateForDisplay(currentSchedule.date)
        const newDateFormatted = this.formatDateForDisplay(formattedDate)
        const customComment = `A data escolhida (${oldDateFormatted}) está indisponível, a data escolhida pela nossa equipe é ${newDateFormatted}. Por gentileza confirmar em nossa plataforma.`
        
        // Atualizar com todos os campos necessários incluindo a nova data
        const updatePayload = {
          number: currentSchedule.number,
          nfe_key: currentSchedule.nfe_key,
          client: currentSchedule.client_cnpj || currentSchedule.client,
          case_count: currentSchedule.case_count,
          date: formattedDate,
          qt_prod: currentSchedule.qt_prod,
          historic: {
            ...currentSchedule.historic,
            [`date_change_${Date.now()}`]: {
              timestamp: new Date().toISOString(),
              user: this.getCurrentUser().user || this.getCurrentUser().name || 'Usuário',
              action: `Data alterada de ${oldDateFormatted} para ${newDateFormatted}`,
              comment: customComment,
              previous_date: currentSchedule.date,
              new_date: formattedDate
            }
          }
        }
        
        // Primeiro atualiza a data e dados
        await apiClient.request(`/schedules/${scheduleId}`, {
          method: 'PUT',
          data: updatePayload
        })
        
        // Depois atualiza o status
        const statusPayload = {
          status: newStatus,
          historic_entry: {
            user: this.getCurrentUser().user || this.getCurrentUser().name || 'Usuário',
            action: `Status alterado para ${newStatus} com nova data ${newDateFormatted}`,
            comment: customComment
          }
        }
        
        await apiClient.request(`/schedules/${scheduleId}/status`, {
          method: 'PATCH',
          data: statusPayload
        })
      }
    },

    getCurrentUser() {
      try {
        const userData = localStorage.getItem('user')
        if (!userData) return 'Usuário desconhecido'
        const user = JSON.parse(userData)
        return user.user || 'Usuário desconhecido'
      } catch (error) {
        return 'Usuário desconhecido'
      }
    },

    // Função para garantir que a data seja processada corretamente sem problemas de timezone
    formatDateForBackend(dateString) {
      if (!dateString) return null
      
      // Se já está no formato YYYY-MM-DD, manter como está
      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        console.log('📅 Data original:', dateString)
        return dateString
      }
      
      // Se for um objeto Date, formatar corretamente
      const date = new Date(dateString)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      
      const formattedDate = `${year}-${month}-${day}`
      console.log('📅 Data formatada:', formattedDate)
      return formattedDate
    },

    // Métodos de filtros
    handleFiltersChanged(newFilters) {
      this.currentFilters = { ...newFilters }
      this.pagination.page = 1
      this.pagination.hasMore = true
      this.schedules = [] // Limpar lista atual
      this.loadSchedules()
    },

    handleResetFilters() {
      console.log('🔄 Resetando filtros')
      this.currentFilters = {
        status: '',
        client: '',
        date_from: '',
        date_to: '',
        nfe_number: '',
      }
      this.pagination.page = 1
      this.pagination.hasMore = true
      this.schedules = [] // Limpar lista atual
      this.loadSchedules()
    },

    // Carregar clientes disponíveis baseado no cli_access do usuário
    async loadAvailableClients() {
      try {
        const userData = localStorage.getItem('user')
        
        if (!userData) {
          return
        }
        
        const user = JSON.parse(userData)
        
        console.log('👤 [CLIENTS] Carregando clientes para usuário:', {
          user: user.user,
          level: user.level_access,
          hasCliAccess: !!user.cli_access
        })
        
        // Tratar cli_access se estiver como string
        let cliAccess = user.cli_access
        if (typeof cliAccess === 'string' && cliAccess) {
          try {
            cliAccess = JSON.parse(cliAccess)
          } catch (e) {
            cliAccess = null
          }
        }
        
        // Se o usuário tem level_access = 0, tem acesso total
        if (user.level_access === 0) {
          console.log('🔓 [CLIENTS] Usuário nível 0 - acesso total')
          // Para desenvolvedores, carregar clientes dinamicamente dos agendamentos existentes
          try {
            const apiClient = window.apiClient
            const response = await apiClient.request('/schedules', {
              method: 'GET',
              params: { page: 1, limit: 100 }
            })
            
            if (response.schedules) {
              // Extrair clientes únicos dos agendamentos
              const uniqueClients = new Map()
              
              response.schedules.forEach(schedule => {
                if (schedule.client_cnpj_original && schedule.client) {
                  uniqueClients.set(schedule.client_cnpj_original, {
                    cnpj: schedule.client_cnpj_original,
                    name: schedule.client,
                    number: schedule.client_cnpj_original
                  })
                }
              })
              
              this.availableClients = Array.from(uniqueClients.values())
              console.log(`✅ [CLIENTS] Carregados ${this.availableClients.length} clientes dinamicamente`)
            }
          } catch (error) {
            console.error('❌ [CLIENTS] Erro ao carregar clientes dinamicamente:', error)
            this.availableClients = []
          }
          return
        }
        
        // Para outros usuários, usar cli_access
        if (cliAccess && typeof cliAccess === 'object') {
          const cliAccessEntries = Object.entries(cliAccess)
          
          const clients = cliAccessEntries.map(([cnpj, data]) => {
            return {
              cnpj: cnpj,
              name: data.nome || `Cliente ${cnpj}`,
              number: data.numero || cnpj
            }
          })
          
          this.availableClients = clients
          console.log(`✅ [CLIENTS] Carregados ${clients.length} clientes do cli_access`)
        } else {
          this.availableClients = []
          console.log('⚠️ [CLIENTS] Nenhum cli_access encontrado')
        }
      } catch (error) {
        console.error('❌ Erro ao carregar clientes disponíveis:', error)
        this.availableClients = []
      }
    },

    // Métodos para agendamentos de marcação
    isBookingSchedule(schedule) {
      // Agendamento de marcação é identificado pela ausência de nfe_key
      return !schedule.nfe_key && schedule.status === 'Marcação'
    },


    openBookingModal() {
      this.showBookingModal = true
    },

    closeBookingModal() {
      this.showBookingModal = false
    },

    async handleBookingCreated(response) {
      this.$emit('notification', {
        type: 'success',
        message: 'Agendamento de marcação criado com sucesso!'
      })
      
      // Recarregar a lista de agendamentos
      this.pagination.page = 1
      await this.loadSchedules()
      
      this.closeBookingModal()
    },

    async confirmDeleteBooking(schedule) {
      if (!confirm(`Tem certeza que deseja excluir o agendamento de marcação para ${schedule.client}?`)) {
        return
      }

      try {
        const apiClient = window.apiClient
        await apiClient.request(`/schedules/${schedule.id}`, {
          method: 'DELETE'
        })

        this.$emit('notification', {
          type: 'success',
          message: 'Agendamento de marcação excluído com sucesso!'
        })

        // Recarregar a lista
        this.pagination.page = 1
        await this.loadSchedules()

      } catch (error) {
        console.error('Erro ao excluir agendamento de marcação:', error)
        this.$emit('notification', {
          type: 'error',
          message: 'Erro ao excluir agendamento de marcação'
        })
      }
    },

    // Métodos para busca por NFe
    handleSearchResults(data) {
      console.log('🔍 Resultados recebidos no SchedulesList:', data)
      
      const results = data.results || []
      
      // Salvar agendamentos originais se ainda não estão salvos
      if (!this.isSearchActive) {
        this.originalSchedules = [...this.schedules]
      }
      
      if (results.length > 0) {
        // Substituir a lista de agendamentos pelos resultados da busca
        this.schedules = results
        this.isSearchActive = true
        this.currentSearchInfo = {
          type: data.searchType,
          value: data.searchValue,
          count: results.length
        }
        
        this.$emit('notification', `${results.length} agendamento(s) encontrado(s) - Lista filtrada`, 'success')
      } else {
        // Se não há resultados, limpar a lista
        this.schedules = []
        this.isSearchActive = true
        this.currentSearchInfo = {
          type: data.searchType,
          value: data.searchValue,
          count: 0
        }
        
        this.$emit('notification', 'Nenhum agendamento encontrado', 'info')
      }
    },

    handleSearchError(error) {
      this.$emit('notification', error, 'error')
    },

    handleSearchStart() {
      console.log('🔍 Iniciando busca por NFe/chave no SchedulesList...')
    },

    clearSearch() {
      if (this.isSearchActive) {
        // Restaurar agendamentos originais
        this.schedules = [...this.originalSchedules]
        this.isSearchActive = false
        this.currentSearchInfo = null
        this.originalSchedules = []
        
        this.$emit('notification', 'Busca limpa - Lista restaurada', 'info')
      }
    }
  },

  async mounted() {
    await this.loadAvailableClients()
    this.loadSchedules()
    
    // Adicionar listener para scroll da página
    window.addEventListener('scroll', this.handleScroll, { passive: true })
  },

  beforeUnmount() {
    // Remover listener para evitar memory leaks
    window.removeEventListener('scroll', this.handleScroll)
    
    // Limpar timeout se existir
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout)
      this.scrollTimeout = null
    }
  },
}
</script>

<style scoped>

.bulk-actions-bar {
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  padding: 1rem;
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  min-height: 50px;
}

.selected-info {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  gap: 1rem;
  font-weight: 500;
  color: #495057;
  flex-wrap: wrap;
}

/* Bulk actions removido - agora os elementos estão na selected-info */

.contestado-actions,
.solicitado-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.non-level-1-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.date-change-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.date-change-group input[type="date"] {
  width: 150px;
}

.level-1-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.non-level-1-actions input[type="date"],
.solicitado-actions input[type="date"] {
  width: 150px;
}

.non-level-1-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.contact-text {
  color: #6c757d;
  font-style: italic;
  font-size: 0.875rem;
}

/* Status badge styles */
.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  border: 1px solid;
  display: inline-block;
}

.status-badge.warning {
  background-color: #fff3cd;
  color: #856404;
  border-color: #ffeaa7;
}

.status-badge.primary {
  background-color: #cce5ff;
  color: #004085;
  border-color: #007bff;
}

.status-badge.success {
  background-color: #d4edda;
  color: #155724;
  border-color: #28a745;
}

.status-badge.danger {
  background-color: #f8d7da;
  color: #721c24;
  border-color: #dc3545;
}

.status-badge.dark {
  background-color: #d6d6d6;
  color: #1b1e21;
  border-color: #343a40;
}

.status-badge.secondary {
  background-color: #e2e3e5;
  color: #383d41;
  border-color: #6c757d;
}

/* Status badge personalizado para Contestado */
.status-badge.contestado {
  background-color: #8B1538 !important; /* Cor vinho */
  color: white !important;
  border-color: #8B1538 !important;
}

/* Checkboxes maiores */
.schedules-table input[type="checkbox"] {
  transform: scale(1.5);
  margin: 0;
  cursor: pointer;
}

/* Botão Aceitar Cancelamento com cor vinho */
.btn-accept-cancel {
  background-color: #8B1538 !important;
  border-color: #8B1538 !important;
  color: white !important;
}

.btn-accept-cancel:hover {
  background-color: #6B1028 !important;
  border-color: #6B1028 !important;
  color: white !important;
}

.btn-accept-cancel:focus,
.btn-accept-cancel:active {
  background-color: #5B0E20 !important;
  border-color: #5B0E20 !important;
  color: white !important;
  box-shadow: 0 0 0 0.2rem rgba(139, 21, 56, 0.25) !important;
}

/* Selection badge styles */
.selection-btn {
  position: relative;
}

.selection-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #dc3545;
  color: white;
  border-radius: 50%;
  min-width: 20px;
  height: 20px;
  font-size: 0.75rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.bulk-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
}

.contestado-actions,
.solicitado-actions,
.agendado-actions,
.cancelar-actions,
.universal-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  white-space: nowrap;
}

.non-level-1-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  white-space: nowrap;
}

/* Actions alignment corrigido */

/* Table wrapper - sem scroll interno, deixa a página controlar */
.table-wrapper {
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  width: 100%;
}

.schedules-table {
  width: 100%;
  margin-bottom: 0;
}

/* Loading more indicator - agora fora da tabela */
.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  color: #6c757d;
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  margin-top: 1rem;
}

.loading-more i {
  margin-right: 0.5rem;
}

.loading-more p {
  margin: 0;
  font-size: 0.875rem;
}

/* End of list indicator */
.end-of-list {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  color: #28a745;
  background-color: #f8fff9;
  border: 1px solid #d4edda;
  border-radius: 0.375rem;
  margin-top: 1rem;
}

.end-of-list i {
  margin-right: 0.5rem;
  color: #28a745;
}

.end-of-list p {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 500;
}

@media (max-width: 768px) {
  .bulk-actions-bar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .bulk-actions {
    justify-content: center;
  }
  
  .contestado-actions,
  .solicitado-actions,
  .agendado-actions {
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .non-level-1-actions {
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .table-wrapper {
    /* Sem altura máxima - deixa a tabela crescer naturalmente */
  }
}

/* Estilos para agendamentos de marcação */
.schedule-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.booking-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background: #e3f2fd;
  color: #1565c0;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid #90caf9;
}


/* Status badge para marcação */
.status-badge.booking {
  background-color: #f3e5f5;
  color: #7b1fa2;
  border: 1px solid #ba68c8;
  font-weight: 500;
}

/* Search Indicator Styles */
.search-indicator {
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.search-active-card {
  background: linear-gradient(135deg, #e3f2fd 0%, #f8f9fa 100%);
  border: 2px solid #2196f3;
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(33, 150, 243, 0.15);
  transition: all 0.2s ease;
}

.search-active-card:hover {
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.2);
  transform: translateY(-1px);
}

.search-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.search-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.search-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #2196f3, #1976d2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.1rem;
  box-shadow: 0 2px 6px rgba(33, 150, 243, 0.3);
}

.search-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.search-type {
  font-size: 0.85rem;
  color: #666;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.search-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1976d2;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.search-results {
  margin-left: auto;
  margin-right: 1rem;
}

.results-count {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.count-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1976d2;
  line-height: 1;
}

.count-label {
  font-size: 0.75rem;
  color: #666;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.search-actions {
  margin-left: auto;
}

.clear-search-btn {
  background: linear-gradient(135deg, #f44336, #d32f2f);
  border: none;
  border-radius: 8px;
  color: white;
  padding: 0.6rem 1rem;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  box-shadow: 0 2px 6px rgba(244, 67, 54, 0.3);
}

.clear-search-btn:hover {
  background: linear-gradient(135deg, #d32f2f, #b71c1c);
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(244, 67, 54, 0.4);
}

.clear-search-btn:active {
  transform: translateY(0);
}

/* Responsividade para o indicador de busca */
@media (max-width: 768px) {
  .search-active-card {
    flex-direction: column;
    gap: 1rem;
    padding: 1.25rem;
  }
  
  .search-content {
    width: 100%;
    justify-content: center;
  }
  
  .search-results {
    margin: 0;
  }
  
  .search-actions {
    margin: 0;
    width: 100%;
  }
  
  .clear-search-btn {
    width: 100%;
    justify-content: center;
  }
  
  .search-header {
    flex-direction: column;
    text-align: center;
    gap: 0.5rem;
  }
  
  .search-details {
    align-items: center;
  }
}

@media (max-width: 480px) {
  .search-value {
    font-size: 0.95rem;
    word-break: break-all;
  }
  
  .search-icon {
    width: 35px;
    height: 35px;
    font-size: 1rem;
  }
}

</style>
