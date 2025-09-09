<template>
  <div class="schedules-list">
    <!-- Busca por NFe/Chave e Filtros -->
    <NfeSearchBar
      :filters="currentFilters"
      :status-options="statusOptions"
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
                :class="'status-badge ' + getStatusBadge(schedule.status).class + (isEstoqueSemDP(schedule) ? ' missing-dp' : '')"
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
      :user="currentUser"
      @close="closeInfoModal"
      @edit="openEditModal"
      @mark-tratativa="handleMarkTratativa"
      @change-status="handleChangeStatus"
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
      newDate: '',
      bulkActionLoading: false,
      showInfoModal: false,
      showEditModal: false,
      scheduleToEdit: null,
      showBookingModal: false,
      pagination: {
        page: 1,
        limit: 50, // Aumentado de 20 para 50 para carregar mais agendamentos por vez
        total: 0,
        hasMore: true,
      },
      loadingMore: false,
      scrollTimeout: null, // Para throttling do scroll
      
      // Filtros
      currentFilters: {
        status: '',
        date_from: '',
        date_to: '',
      },
      
      // Variáveis para controle de pesquisa
      isSearchActive: false,
      originalSchedules: [],
      currentSearchInfo: null,
    }
  },

  computed: {
    currentUser() {
      return this.getCurrentUser()
    },

    statusConfig() {
      return {
        Solicitado: { class: 'warning', label: 'Solicitado' },
        Contestado: { class: 'contestado', label: 'Contestado' },
        Agendado: { class: 'primary', label: 'Agendado' },
        'Em conferência': { class: 'success', label: 'Em conferência' },
        Conferência: { class: 'success', label: 'Em conferência' }, // Compatibilidade com dados antigos
        Recebido: { class: 'success', label: 'Em conferência' }, // Compatibilidade com dados antigos
        Tratativa: { class: 'danger', label: 'Tratativa' },
        'Em estoque': { class: 'estoque', label: 'Em estoque' },
        'Estoque': { class: 'estoque', label: 'Em estoque' }, // Compatibilidade com dados antigos
        Recusar: { class: 'danger', label: 'Recusar' },
        Cancelar: { class: 'warning', label: 'Cancelar' },
        Recusado: { class: 'dark', label: 'Recusado' },
        Cancelado: { class: 'secondary', label: 'Cancelado' },
        Marcação: { class: 'booking', label: 'Marcação' },
      }
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
        { value: 'Em conferência', label: 'Em conferência' },
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
      }
      try {
        // Usar o apiClient global com cache
        const apiClient = window.apiClient
        console.log('Fazendo requisição para /schedules')
        console.log('Token presente:', !!localStorage.getItem('token'))

        // Filtrar apenas parâmetros com valores não vazios
        const filteredParams = {}
        Object.keys(this.currentFilters).forEach(key => {
          const value = this.currentFilters[key]
          if (value && value.toString().trim() !== '') {
            filteredParams[key] = value
          }
        })
        
        const requestParams = {
          page: this.pagination.page,
          limit: this.pagination.limit,
          ...filteredParams // Aplicar apenas filtros com valores
        }
        
        const response = await apiClient.request('/schedules', {
          method: 'GET',
          params: requestParams,
        })

        console.log('Resposta recebida:', response)
        const newSchedules = response.schedules || []
        let uniqueNewSchedules = [] // CORREÇÃO: Declarar no escopo mais amplo
        
        if (this.pagination.page === 1) {
          this.schedules = newSchedules
          uniqueNewSchedules = newSchedules // Para primeira página, todos são únicos
          console.log(`📄 Primeira página carregada: ${newSchedules.length} agendamentos`)
          
          // CORREÇÃO: Emitir dados para sincronizar com App.vue
          this.$emit('schedules-loaded', {
            schedules: newSchedules,
            pagination: {
              page: this.pagination.page,
              total: this.pagination.total,
              hasMore: this.pagination.hasMore
            }
          })
        } else {
          // CORREÇÃO: Filtrar duplicatas antes de adicionar
          const existingIds = new Set(this.schedules.map(s => s.id))
          uniqueNewSchedules = newSchedules.filter(schedule => !existingIds.has(schedule.id))
          
          console.log(`📄 Página ${this.pagination.page}: ${newSchedules.length} recebidos, ${uniqueNewSchedules.length} únicos`)
          
          if (uniqueNewSchedules.length > 0) {
            this.schedules = [...this.schedules, ...uniqueNewSchedules]
            console.log(`📄 Total de agendamentos após filtro: ${this.schedules.length}`)
            
            // CORREÇÃO: Emitir dados atualizados para sincronizar com App.vue
            this.$emit('schedules-loaded', {
              schedules: this.schedules,
              pagination: {
                page: this.pagination.page,
                total: this.pagination.total,
                hasMore: this.pagination.hasMore
              }
            })
          } else {
            console.log('⚠️ Todos os agendamentos recebidos já existiam - possível fim da lista')
            // Se não há agendamentos únicos, parar de tentar carregar mais
            this.pagination.hasMore = false
          }
        }
        
        this.pagination.total = response.pagination?.total || 0
        
        // CORREÇÃO: Lógica melhorada para hasMore
        if (this.pagination.page === 1) {
          // Na primeira página, há mais se recebeu exatamente o limite
          this.pagination.hasMore = newSchedules.length === this.pagination.limit
        } else {
          // Nas próximas páginas, há mais se recebeu agendamentos únicos igual ao limite
          const uniqueCount = uniqueNewSchedules.length
          this.pagination.hasMore = uniqueCount === this.pagination.limit && uniqueCount > 0
        }
        
        if (!this.pagination.hasMore && this.pagination.page > 1) {
          console.log(`📄 Fim da lista: carregados ${newSchedules.length} agendamentos na página ${this.pagination.page}`)
          console.log(`📊 Total de agendamentos únicos: ${this.schedules.length}`)
        }
        
        // CORREÇÃO: Garantir que sempre emite dados na primeira página, mesmo se vazia
        if (this.pagination.page === 1 && newSchedules.length === 0) {
          console.log('📄 Primeira página vazia - emitindo dados vazios para sincronização')
          this.$emit('schedules-loaded', {
            schedules: [],
            pagination: {
              page: 1,
              total: 0,
              hasMore: false
            }
          })
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
        
        // CORREÇÃO: Emitir dados vazios mesmo em caso de erro para sincronizar App.vue
        if (this.pagination.page === 1) {
          this.$emit('schedules-loaded', {
            schedules: [],
            pagination: {
              page: 1,
              total: 0,
              hasMore: false
            }
          })
        }
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
      
      // Fechar modal primeiro para evitar problemas visuais
      this.closeEditModal()
      
      // Refresh completo da página após salvamento
      console.log('🔄 Realizando refresh da página após atualização do agendamento')
      setTimeout(() => {
        window.location.reload()
      }, 500) // Pequeno delay para permitir que o modal feche suavemente
    },

    async handleMarkTratativa(scheduleData) {
      try {
        console.log('⚠️ Marcando agendamento como Em Tratativa:', scheduleData)
        
        const apiClient = window.apiClient
        const currentUser = this.getCurrentUser()

        // Preparar dados para atualização - apenas alterar o status
        const updateData = {
          ...scheduleData,
          status: 'Tratativa',
          historic: {
            ...scheduleData.historic,
            [`tratativa_${Date.now()}`]: {
              timestamp: new Date().toISOString(),
              user: currentUser,
              action: 'Status alterado para Em Tratativa',
              changes: [`Status: "${scheduleData.status}" → "Tratativa"`],
              comment: `Status alterado de "${scheduleData.status}" para "Tratativa"`
            }
          }
        }

        const response = await apiClient.request(`/schedules/${scheduleData.id}`, {
          method: 'PUT',
          data: updateData,
        })

        console.log('✅ Agendamento marcado como Em Tratativa:', response)

        // Fechar modal primeiro
        this.closeInfoModal()

        // Notificar sucesso
        this.$emit('notification', {
          type: 'success',
          message: 'Agendamento marcado como Em Tratativa!',
        })

        // Refresh completo da página após alteração de status
        console.log('🔄 Realizando refresh da página após marcar como Em Tratativa')
        setTimeout(() => {
          window.location.reload()
        }, 1000) // Delay maior para mostrar a notificação

      } catch (error) {
        console.error('❌ Erro ao marcar como Em Tratativa:', error)
        
        this.$emit('notification', {
          type: 'error',
          message: 'Erro ao marcar agendamento como Em Tratativa.',
        })
      }
    },

    async handleChangeStatus(data) {
      try {
        console.log('🔄 Alterando status do agendamento:', data)
        
        const { scheduleData, newStatus } = data
        const apiClient = window.apiClient
        const currentUser = this.getCurrentUser()

        // Preparar dados para atualização
        const updateData = {
          ...scheduleData,
          status: newStatus,
          historic: {
            ...scheduleData.historic,
            [`status_change_${Date.now()}`]: {
              timestamp: new Date().toISOString(),
              user: currentUser,
              action: `Status alterado para ${newStatus}`,
              changes: [`Status: "${scheduleData.status}" → "${newStatus}"`],
              comment: `Status alterado de "${scheduleData.status}" para "${newStatus}"`
            }
          }
        }

        const response = await apiClient.request(`/schedules/${scheduleData.id}`, {
          method: 'PUT',
          data: updateData,
        })

        console.log('✅ Status do agendamento alterado:', response)

        // Fechar modal primeiro
        this.closeInfoModal()

        // Notificar sucesso
        this.$emit('notification', {
          type: 'success',
          message: `Status alterado para ${newStatus}!`,
        })

        // Refresh completo da página após alteração de status
        console.log('🔄 Realizando refresh da página após alteração de status')
        setTimeout(() => {
          window.location.reload()
        }, 1000) // Delay maior para mostrar a notificação

      } catch (error) {
        console.error('❌ Erro ao alterar status:', error)
        
        this.$emit('notification', {
          type: 'error',
          message: 'Erro ao alterar status do agendamento.',
        })
      }
    },

    async loadMoreSchedules() {
      // CORREÇÃO: Verificações mais rigorosas para evitar duplicatas
      if (this.loadingMore || !this.pagination.hasMore || this.loading) {
        console.log('🛑 loadMoreSchedules: bloqueado', { 
          loadingMore: this.loadingMore, 
          hasMore: this.pagination.hasMore,
          loading: this.loading,
          currentPage: this.pagination.page
        })
        return
      }
      
      // CORREÇÃO: Evitar requisições simultâneas marcando imediatamente como loading
      this.loadingMore = true
      this.pagination.page += 1
      
      console.log(`📖 Carregando página ${this.pagination.page}...`)
      
      try {
        await this.loadSchedules()
        console.log(`✅ Página ${this.pagination.page} carregada com sucesso`)
      } catch (error) {
        console.error('❌ Erro ao carregar mais agendamentos:', error)
        // Se der erro, volta a página anterior e para de tentar
        this.pagination.page -= 1
        this.pagination.hasMore = false
        console.log(`🔙 Página voltou para ${this.pagination.page} devido ao erro`)
      } finally {
        this.loadingMore = false
        console.log(`✅ loadingMore finalizado. Página atual: ${this.pagination.page}, hasMore: ${this.pagination.hasMore}`)
      }
    },

    handleScroll() {
      // CORREÇÃO: Throttle aprimorado para evitar chamadas duplas
      if (this.scrollTimeout) return
      
      this.scrollTimeout = setTimeout(() => {
        // Detectar scroll da página inteira em vez do container
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop
        const windowHeight = window.innerHeight
        const documentHeight = document.documentElement.scrollHeight
        const threshold = 500 // pixels do fim para começar a carregar (aumentado para carregar antes)
        
        // CORREÇÃO: Verificações mais rigorosas antes de carregar
        const nearEnd = scrollTop + windowHeight >= documentHeight - threshold
        const canLoad = this.pagination.hasMore && !this.loadingMore && !this.loading
        
        if (nearEnd && canLoad && this.schedules.length > 0) {
          console.log('🔄 Scroll trigger: carregando mais agendamentos...', {
            scrollTop,
            windowHeight,
            documentHeight,
            threshold,
            currentPage: this.pagination.page,
            totalSchedules: this.schedules.length
          })
          this.loadMoreSchedules()
        }
        
        this.scrollTimeout = null
      }, 100) // Reduzido para 100ms de throttle para resposta mais rápida
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

    isEstoqueSemDP(schedule) {
      // Retorna true se o status for "Em estoque" e no_dp for '0' ou null/undefined
      return (schedule.status === 'Em estoque' || schedule.status === 'Estoque') && 
             (!schedule.no_dp || schedule.no_dp === '0' || schedule.no_dp === 0)
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

    // Função auxiliar para resetar paginação
    resetPagination() {
      this.pagination.page = 1
      this.pagination.hasMore = true
      this.pagination.total = 0
      this.schedules = []
      this.loadingMore = false
      console.log('🔄 Paginação resetada')
    },

    // Métodos de filtros
    handleFiltersChanged(newFilters) {
      console.log('🔍 Filtros alterados:', newFilters)
      this.currentFilters = { ...newFilters }
      this.resetPagination()
      this.loadSchedules()
    },

    // NOVA FUNCIONALIDADE: Limpar filtros sem recarregar dados
    clearFilters() {
      console.log('🧹 [SCHEDULESLIST] Limpando filtros silenciosamente...')
      this.currentFilters = {
        status: '',
        date_from: '',
        date_to: '',
      }
      console.log('✅ [SCHEDULESLIST] Filtros limpos:', this.currentFilters)
    },

    handleResetFilters() {
      console.log('🔍 Resetando filtros')
      this.currentFilters = {
        status: '',
        date_from: '',
        date_to: '',
      }
      this.resetPagination()
      this.loadSchedules()
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
      this.resetPagination()
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
        this.resetPagination()
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
    },
  },

  async mounted() {
    console.log('📄 SchedulesList montado - iniciando carregamento...')
    console.log('🔄 CORREÇÃO: SchedulesList vai emitir dados para App.vue via @schedules-loaded')
    
    // CORREÇÃO: Garantir que sempre emite dados na inicialização
    try {
      await this.loadSchedules()
      console.log('✅ SchedulesList.mounted(): loadSchedules() concluído')
    } catch (error) {
      console.error('❌ SchedulesList.mounted(): erro em loadSchedules():', error)
      // Mesmo em caso de erro, emitir dados vazios para sincronizar
      this.$emit('schedules-loaded', {
        schedules: [],
        pagination: { page: 1, total: 0, hasMore: false }
      })
    }
    
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

.status-badge.estoque {
  background-color: #c8e6c9;
  color: #1b5e20;
  border-color: #2e7d32;
}

.status-badge.missing-dp {
  border: 2px solid #dc3545 !important;
  box-shadow: 0 0 5px rgba(220, 53, 69, 0.3);
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
