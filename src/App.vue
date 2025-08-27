<template>
  <div id="app">
    <!-- Universal Loading Overlay -->
    <div v-if="loading || bulkActionLoading" class="universal-loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <h3>{{ loadingMessage }}</h3>
        <p>{{ loadingSubtext }}</p>
      </div>
    </div>

    <!-- Main App -->
    <div v-else class="container">
      <!-- Sidebar Component -->
      <SidebarComponent
        :user="user"
        :active-menu="activeMenu"
        @menu-click="handleMenuClick"
        @logout="handleLogout"
      >
      </SidebarComponent>


      <!-- Main Content -->
      <main class="main-content">
        <!-- Top Bar -->
        <div class="top-bar">
          <!-- User Profile (right) -->
          <div class="user-profile" @click="toggleUserDropdown" ref="userProfile">
            <div class="user-avatar">
              {{ getUserInitial() }}
            </div>
            <span class="user-name">{{ user?.name || 'Usuário' }}</span>
            <i class="fas fa-chevron-down dropdown-arrow" :class="{ 'rotate': showUserDropdown }"></i>
            
            <!-- Dropdown Menu -->
            <div v-if="showUserDropdown" class="user-dropdown">
              <div class="dropdown-item" @click="handleLogout">
                <i class="fas fa-sign-out-alt"></i>
                Sair
              </div>
            </div>
          </div>
        </div>

        <!-- Dashboard Content -->
        <div v-show="!showSchedulesList && !showSettingsPage && !showXmlUploadPage" class="content-area">
          <!-- Tabela de Agendamentos (transferida de SchedulesList.vue) -->
          <div class="schedules-list">
            <!-- Header -->
            <div class="page-header">
              <h2>Lista de Agendamentos</h2>
              <div class="header-actions">
                <button
                  v-if="hasCreatePermission"
                  class="btn btn-primary"
                  @click="openScheduleCreationModal"
                  :disabled="loading"
                  title="Criar novo agendamento"
                >
                  <i class="fas fa-plus"></i>
                  Criar Agendamento
                </button>
                <button
                  v-if="canCreateBooking"
                  class="btn btn-outline-primary"
                  @click="openBookingModal"
                  :disabled="loading"
                  title="Criar agendamento de marcação"
                >
                  <i class="fas fa-calendar-plus"></i>
                  Marcação
                </button>
                <button
                  class="btn btn-outline-primary"
                  @click="refresh"
                  :disabled="loading"
                  title="Atualizar dados"
                >
                  <i :class="loading ? 'fas fa-spinner fa-spin' : 'fas fa-sync-alt'"></i>
                  Atualizar
                </button>
              </div>
            </div>

            <!-- Filtros e Busca -->
            <div class="filters-container">
              <!-- Search Bar -->
              <div class="search-row">
                <div class="search-input-group">
                  <input
                    type="text"
                    v-model="mainSearchInput"
                    @keyup.enter="handleMainSearch"
                    :disabled="loading"
                    placeholder="Digite o número da NF-e ou chave de acesso (44 dígitos)"
                    class="search-input"
                  />
                  <button
                    @click="handleMainSearch"
                    :disabled="loading || !mainSearchInput.trim()"
                    class="search-button"
                  >
                    <i v-if="loading" class="fas fa-spinner fa-spin"></i>
                    <i v-else class="fas fa-search"></i>
                    Buscar
                  </button>
                </div>
              </div>

              <div class="filter-row">
                <div class="filters-header">
                  <i class="fas fa-filter"></i>
                  <span>Filtros</span>
                </div>
                <div class="filter-group">
                  <label for="status">Status:</label>
                  <select
                    id="status"
                    v-model="currentFilters.status"
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
                    v-model="currentFilters.client"
                    @change="handleFilterChange"
                    class="form-control"
                  >
                    <option value="">Todos</option>
                    <option
                      v-for="client in filteredAvailableClients"
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
                    v-model="currentFilters.date_from"
                    @change="handleFilterChange"
                    class="form-control"
                  />
                </div>

                <div class="filter-group">
                  <label for="date-to">Data até:</label>
                  <input
                    id="date-to"
                    type="date"
                    v-model="currentFilters.date_to"
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

            <!-- Bulk Actions Bar -->
            <div v-if="canBulkManage" class="bulk-actions-bar">
              <div class="selected-info">
                <button class="btn btn-outline-secondary action-btn selection-btn" @click="toggleSelection">
                  <i :class="selectedSchedules.length === 0 ? 'fas fa-check-square' : 'fas fa-times'"></i> 
                  {{ selectedSchedules.length === 0 ? 'Selecionar Tudo' : 'Limpar seleção' }}
                  <span v-if="selectedSchedules.length > 0" class="selection-badge">{{ selectedSchedules.length }}</span>
                </button>
              </div>
              
              <div class="bulk-actions">
                <!-- Actions for Contestado status -->
                <div v-if="selectedScheduleStatuses[0] === 'Contestado'" class="contestado-actions">
                  <div v-if="userLevel === 1" class="level-1-actions">
                    <button class="btn btn-success action-btn" @click="acceptNewDate" :disabled="bulkActionLoading">
                      <i class="fas fa-check"></i> Aceitar Nova Data
                    </button>
                    <span class="contact-text">Ou entre em contato com nossa equipe</span>
                  </div>
                  <div v-else class="non-level-1-actions">
                    <button class="btn btn-success action-btn" @click="confirmContestado" :disabled="bulkActionLoading">
                      <i class="fas fa-check"></i> Confirmar
                    </button>
                    <div class="date-change-group">
                      <input type="date" v-model="newDate" class="form-control" :min="today" />
                      <button class="btn btn-success action-btn" @click="changeContestadoToAgendado" :disabled="!newDate || bulkActionLoading">
                        <i class="fas fa-calendar-alt"></i> Agendar
                      </button>
                    </div>
                  </div>
                </div>
                
                <!-- Actions for Solicitado status -->
                <div v-if="selectedScheduleStatuses[0] === 'Solicitado' && userLevel !== 1" class="solicitado-actions">
                  <button class="btn btn-success action-btn" @click="acceptSchedules" :disabled="bulkActionLoading">
                    <i class="fas fa-check"></i> Aceitar Agendamento
                  </button>
                  <div class="date-change-group">
                    <input type="date" v-model="newDate" class="form-control" :min="today" />
                    <button class="btn btn-warning action-btn" @click="changeDateToContestado" :disabled="!newDate || bulkActionLoading">
                      <i class="fas fa-calendar-alt"></i> Alterar Data
                    </button>
                  </div>
                </div>
                
                <!-- Actions for Agendado status (non-level 1 users can mark as received) -->
                <div v-if="selectedScheduleStatuses[0] === 'Agendado' && userLevel !== 1" class="agendado-actions">
                  <button class="btn btn-success action-btn" @click="markAsReceived" :disabled="bulkActionLoading">
                    <i class="fas fa-check-circle"></i> Marcar como Em conferência
                  </button>
                </div>
                
                <!-- Actions for Conferência status (non-level 1 users can mark as Em estoque) -->
                <div v-if="(selectedScheduleStatuses[0] === 'Conferência' || selectedScheduleStatuses[0] === 'Recebido') && userLevel !== 1" class="conferencia-actions">
                  <button class="btn btn-info action-btn" @click="markAsEmEstoque" :disabled="bulkActionLoading">
                    <i class="fas fa-warehouse"></i> Marcar como Em estoque
                  </button>
                </div>
                
                <!-- Actions for Cancelar status (non-level 1 users can accept cancellation requests from level 1) -->
                <div v-if="selectedScheduleStatuses[0] === 'Cancelar' && userLevel !== 1" class="cancelar-actions">
                  <button class="btn btn-danger action-btn btn-accept-cancel" @click="acceptCancellation" :disabled="bulkActionLoading">
                    <i class="fas fa-times-circle"></i> Aceitar Cancelamento
                  </button>
                  <span class="text-muted" style="font-size: 0.85em;">Solicitado por {{ cancelRequestedBy }}</span>
                </div>
                
                <!-- Effectivate Booking Button (single booking selected) -->
                <div v-if="canEffectivateBooking" class="effectivate-actions">
                  <button class="btn btn-success action-btn" @click="effectivateBooking" :disabled="bulkActionLoading">
                    <i class="fas fa-check-circle"></i>
                    Efetivar Marcação
                  </button>
                </div>
                
                <!-- Generate TXT Button (Corpem integration) -->
                <CorpemTxtGenerator
                  :selected-schedules="selectedSchedules"
                  :schedules="schedules"
                  :user="user"
                  :loading="bulkActionLoading"
                  @loading-changed="handleTxtLoadingChange"
                  @notification="addNotification"
                />
                
                <!-- Universal Cancel Button (all users can cancel) -->
                <div v-if="selectedSchedules.length > 0 && !['Cancelar', 'Cancelado', 'Recusado', 'Em estoque', 'Estoque'].includes(selectedScheduleStatuses[0])" class="universal-actions">
                  <button class="btn btn-outline-danger action-btn" @click="cancelSchedules" :disabled="bulkActionLoading">
                    <i class="fas fa-ban"></i> 
                    Cancelar
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
              <div v-else class="table-wrapper" ref="tableWrapper">
                <table class="schedules-table">
                  <thead>
                    <tr>
                      <th style="width: 50px;">
                        
                      </th>
                      <th>N° NF-e</th>
                      <th>Cliente</th>
                      <th>Data de Entrega</th>
                      <th>Volumes</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="schedule in displayedSchedules" :key="schedule.id" :class="{ 'booking-row': schedule.is_booking === true || schedule.is_booking === 1 }">
                      <td>
                        <input type="checkbox" :value="schedule.id" v-model="selectedSchedules" @change="onScheduleSelect" :disabled="!canSelectSchedule(schedule)" />
                      </td>
                      <td>{{ schedule.number }}</td>
                      <td>{{ schedule.client }}</td>
                      <td>{{ formatDate(schedule.date) }}</td>
                      <td>{{ schedule.case_count }}</td>
                      <td>
                        <span :class="'status-badge ' + getStatusBadge(schedule.status).class" class="status-badge">
                          {{ getStatusBadge(schedule.status).label }}
                        </span>
                      </td>
                      <td>
                        <div class="action-buttons">
                          <button class="btn btn-sm btn-outline-primary" @click="openInfoModal(schedule)" title="Mais informações">
                            <i class="fas fa-info-circle"></i>
                            Detalhes
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
                
                <!-- Loading indicator for infinite scroll -->
                <div v-if="loadingMore" class="loading-more">
                  <i class="fas fa-spinner fa-spin"></i>
                  <p>Carregando mais agendamentos...</p>
                </div>
              </div>
            </div>

            <!-- Modals -->
            <div v-if="showEditModal" style="color: red; font-weight: bold;">DEBUG: Modal de edição deveria estar visível</div>
            <NfeInfoModal 
              v-if="showInfoModal" 
              :nfe-data="selectedSchedule" 
              :show-modal="showInfoModal" 
              :user="user" 
              @close="closeInfoModal" 
              @edit="openEditModal" 
              @mark-tratativa="handleMarkSingleAsTratativa" 
              @change-status="handleChangeStatusFromTratativa"
              @reprocess-success="handleReprocessSuccess"
              @reprocess-toast="handleReprocessToast"
            />
            <ScheduleEditModal v-if="showEditModal" :schedule-data="scheduleToEdit" :show-modal="showEditModal" @close="closeEditModal" @updated="handleScheduleUpdated" @notification="addNotification" />
            <ScheduleCreationModal v-if="showScheduleCreationModal" :show-modal="showScheduleCreationModal" @close="closeScheduleCreationModal" @created="handleScheduleCreated" />
            <ScheduleBookingModal v-if="showBookingModal" :show-modal="showBookingModal" @close="closeBookingModal" @created="handleBookingCreated" />
            <ScheduleCreationModal v-if="showEffectivateModal" :show-modal="showEffectivateModal" :booking-to-effectivate="bookingToEffectivate" @close="closeEffectivateModal" @created="handleBookingEffectivated" />
            
          </div>
        </div>

        <!-- Schedules List -->
        <div v-show="showSchedulesList" class="content-area">
          <SchedulesList 
            ref="schedulesListRef"
            @notification="addNotification"
          > </SchedulesList>
        </div>

        <!-- Settings Page -->
        <div v-show="showSettingsPage" class="content-area">
          <SettingsPage 
            ref="settingsPageRef"
            @notification="addNotification"
          > </SettingsPage>
        </div>

        <!-- XML Upload Page -->
        <div v-show="showXmlUploadPage" class="content-area">
          <XmlUploadPage 
            ref="xmlUploadPageRef"
            @notification="addNotification"
          > </XmlUploadPage>
        </div>
      </main>
    </div>

    <!-- Preloading Indicator -->
    <div v-if="preloadingProgress > 0 && preloadingProgress < 100" class="preloading-indicator">
      <div class="preload-content">
        <div class="preload-icon">
          <i class="fas fa-rocket"></i>
        </div>
        <div class="preload-text">Preparando páginas...</div>
        <div class="preload-progress">
          <div class="progress-bar" :style="{ width: preloadingProgress + '%' }"></div>
        </div>
        <div class="preload-percentage">{{ preloadingProgress }}%</div>
      </div>
    </div>

    <!-- Global Notifications -->
    <NotificationsComponent
      :notifications="notifications"
      @close="removeNotification"
    >
    </NotificationsComponent>
  </div>
</template>

<script>
import SidebarComponent from './components/SidebarComponent.vue'
import RecentActivities from './components/RecentActivities.vue'
import PendingDeliveries from './components/PendingDeliveries.vue'
import NotificationsComponent from './components/NotificationsComponent.vue'
import SchedulesList from './components/SchedulesList.vue'
import NfeInfoModal from './components/NfeInfoModal.vue'
import ScheduleEditModal from './components/ScheduleEditModal.vue'
import ScheduleCreationModal from './components/ScheduleCreationModal.vue'
import ScheduleBookingModal from './components/ScheduleBookingModal.vue'
import CorpemTxtGenerator from './components/CorpemTxtGenerator.vue'
import SettingsPage from './views/SettingsPage.vue'
import XmlUploadPage from './views/XmlUploadPage.vue'
import { checkPermission, checkUserLevel } from './utils/permissions.js'
import { BASE_URL } from './config/api.js'
import apiService from './services/api.js'
import axios from 'axios'

// Função que inicializa o sistema de permissões
function initializePermissions() {
  // Sistema de permissões inicializado silenciosamente
}

// Usar o apiClient global já otimizado com cache (importado de main.js)
const apiClient = window.apiClient || new (class VueApiClientFallback {
  constructor() {
    this.baseURL = BASE_URL
    this.token = localStorage.getItem('token')
  }

  async request(endpoint, options = {}) {
    const token = localStorage.getItem('token')

    const config = {
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }

    try {
      const response = await axios({
        ...config,
        url: endpoint,
      })
      return response.data
    } catch (error) {
      if (error.response?.status === 401) {
        console.warn('🔐 [APICLIENT] Token inválido ou expirado detectado - Status 401');
        
        // Limpar completamente os dados de autenticação
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userPermissions');
        localStorage.removeItem('userLevel');
        localStorage.removeItem('rememberedUser');
        sessionStorage.clear();
        
        console.log('🧹 [APICLIENT] Dados de autenticação limpos');
        
        // Redirecionar para login apenas se não estivermos já na página de login
        if (!window.location.pathname.includes('/login.html') && !window.location.pathname.includes('/login')) {
          console.log('🔄 [APICLIENT] Redirecionando para página de login...');
          
          // Adicionar delay mínimo para garantir que os dados foram limpos
          setTimeout(() => {
            window.location.href = '/login.html';
          }, 100);
          
          return; // Evitar que o erro seja propagado após redirecionamento
        }
        
        throw new Error('Token inválido ou expirado - Redirecionando para login');
      }
      throw error
    }
  }

  async getDashboardStats() {
    return {
      pendingDeliveries: 7,
      processing: 23,
      completedToday: 156,
      divergences: 2,
    }
  }

  async getRecentActivities() {
    return [
      {
        id: 1,
        type: 'received',
        title: 'Produto em Conferência',
        description: 'Smartphone Samsung Galaxy - Código: 4587956321',
        time: '15 minutos atrás',
        status: 'success',
      },
      {
        id: 2,
        type: 'pending',
        title: 'Aguardando Conferência',
        description: 'Lote de Notebooks Dell - Pedido: PED-789654',
        time: '1 hora atrás',
        status: 'warning',
      },
      {
        id: 3,
        type: 'divergence',
        title: 'Divergência Detectada',
        description: 'Diferença na quantidade - Produto: MON-4578123',
        time: '2 horas atrás',
        status: 'danger',
      },
    ]
  }

  async getPendingDeliveries() {
    return [
      {
        id: 1,
        nfe: '35240414200166000182550010000134151123456789',
        supplier: 'TechCorp Ltda',
        volumes: '15 volumes',
        scheduledDate: '14/07/2025',
        warehouse: 'Estoque Principal',
        status: 'scheduled',
      },
      {
        id: 2,
        nfe: '35240414200166000182550010000134152234567890',
        supplier: 'SmartPhone Inc',
        volumes: '8 volumes',
        scheduledDate: '14/07/2025',
        warehouse: 'Estoque Eletrônicos',
        status: 'on_way',
      },
      {
        id: 3,
        nfe: '35240414200166000182550010000134153345678901',
        supplier: 'Office Solutions',
        volumes: '20 volumes',
        scheduledDate: '15/07/2025',
        warehouse: 'Estoque Periféricos',
        status: 'scheduled',
      },
      {
        id: 4,
        nfe: '35240414200166000182550010000134154456789012',
        supplier: 'Industrial Corp',
        volumes: '5 volumes',
        scheduledDate: '15/07/2025',
        warehouse: 'Estoque Industrial',
        status: 'processing',
      },
    ]
  }

  async getSchedules(params = {}) {
    return this.request('/schedules', { params })
  }

  async createSchedule(data) {
    return this.request('/schedules', {
      method: 'POST',
      data,
    })
  }

  async updateScheduleStatus(id, status, comment) {
    return this.request(`/schedules/${id}/status`, {
      method: 'PATCH',
      data: {
        status,
        historic_entry: {
          user: this.getCurrentUser()?.user || 'system',
          action: `Status alterado para ${status}`,
          comment,
        },
      },
    })
  }

  async createScheduleWithProducts(nfe_data) {
    return this.request('/schedules/create-with-products', {
      method: 'POST',
      data: { nfe_data },
    })
  }

  // User Settings endpoints
  async getUserSettings() {
    return this.request('/user-settings')
  }

  async updateUserSettings(settings) {
    return this.request('/user-settings', {
      method: 'PUT',
      data: settings,
    })
  }

  async updateEmailSettings(emailSettings) {
    return this.request('/user-settings/email', {
      method: 'PATCH',
      data: { emailSettings },
    })
  }

  async updateUISettings(uiSettings) {
    return this.request('/user-settings/ui', {
      method: 'PATCH',
      data: { uiSettings },
    })
  }

  async testEmailSettings() {
    return this.request('/user-settings/test-email', {
      method: 'POST',
    })
  }

  async resetUserSettings() {
    return this.request('/user-settings', {
      method: 'DELETE',
    })
  }

  // User Profile endpoints
  async updateProfile(profileData) {
    return this.request('/user/profile', {
      method: 'PUT',
      data: profileData,
    })
  }

  async changePassword(passwordData) {
    console.log('🔐 Tentando alterar senha:', passwordData)
    const token = localStorage.getItem('token') || localStorage.getItem('authToken')
    
    return this.request('/users/profile/me', {
      method: 'PUT',
      data: passwordData,
    })
  }

  getCurrentUser() {
    const userData = localStorage.getItem('user')
    return userData ? JSON.parse(userData) : null
  }
})()

// Manter compatibilidade para componentes filhos
if (!window.apiClient) {
  window.apiClient = apiClient
}

export default {
  name: 'App',
  components: {
    SidebarComponent,
    RecentActivities,
    PendingDeliveries,
    NotificationsComponent,
    SchedulesList,
    NfeInfoModal,
    ScheduleEditModal,
    ScheduleCreationModal,
    ScheduleBookingModal,
    CorpemTxtGenerator,
    SettingsPage,
    XmlUploadPage,
  },

  data() {
    return {
      loading: true,
      loadingMessage: 'Carregando...',
      loadingSubtext: 'Por favor, aguarde um momento',
      user: null,
      activeMenu: 'dashboard',
      showSchedulesList: false,
      showSettingsPage: false,
      showXmlUploadPage: false,
      
      // Pre-loading control
      pagesPreloaded: false,
      preloadingProgress: 0,

      dashboardStats: {
        pendingDeliveries: 0,
        processing: 0,
        completedToday: 0,
        divergences: 0,
      },
      statsLoading: false,

      recentActivities: [],
      activitiesLoading: false,

      pendingDeliveries: [],
      deliveriesLoading: false,

      notifications: [],
      schedules: [],
      selectedSchedules: [],
      newDate: '',
      bulkActionLoading: false,
      
      // Top bar properties
      showUserDropdown: false,
      
      // Search
      mainSearchInput: '',
      
      // Filtros
      currentFilters: {
        status: '',
        client: '',
        date_from: '',
        date_to: ''
      },
      availableClients: [],
      showInfoModal: false,
      showEditModal: false,
      showScheduleCreationModal: false,
      showBookingModal: false,
      showEffectivateModal: false,
      bookingToEffectivate: null,
      scheduleToEdit: null,
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        pages: 1,
        hasMore: true,
      },
      loadingMore: false,
      selectedSchedule: null,
      
      // Dados de clientes carregados globalmente
      availableClientsGlobal: [],
      clientsLoadingGlobal: false,
      
      // Controle de busca
      isSearchActive: false,
      currentSearchInfo: null,
      originalSchedules: []
    }
  },
  computed: {
    displayedSchedules() {
      if (!Array.isArray(this.schedules)) return []
      
      // Se estivermos em modo de busca ativa, mostrar todos os resultados
      if (this.isSearchActive) {
        return this.schedules
      }
      
      // Filtrar status que não devem aparecer na página inicial (apenas quando não há busca ativa)
      const hiddenStatuses = ['Em estoque', 'Estoque', 'Recusado', 'Cancelado']
      return this.schedules.filter(schedule => 
        !hiddenStatuses.includes(schedule.status)
      )
    },
    selectedScheduleStatuses() {
      const selected = (this.schedules || []).filter(s => (this.selectedSchedules || []).includes(s.id))
      return [...new Set(selected.map(s => s.status))]
    },
    cancelRequestedBy() {
      if (this.selectedSchedules.length === 0) return 'administrador'
      
      const selected = (this.schedules || []).filter(s => (this.selectedSchedules || []).includes(s.id))
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
      return (this.selectedSchedules || []).length > 0 && this.selectedScheduleStatuses.length === 1
    },
    
    userLevel() {
      try {
        const userData = localStorage.getItem('user')
        if (!userData) return null
        const user = JSON.parse(userData)
        return user.level_access
      } catch (error) {
        return null
      }
    },
    today() {
      return new Date().toISOString().split('T')[0]
    },
    
    statusOptions() {
      return [
        { value: '', label: 'Todos os status' },
        { value: 'Solicitado', label: 'Solicitado' },
        { value: 'Contestado', label: 'Contestado' },
        { value: 'Agendado', label: 'Agendado' },
        { value: 'Conferência', label: 'Em conferência' },
        { value: 'Tratativa', label: 'Em tratativa' },
        { value: 'Em estoque', label: 'Em estoque' },
        { value: 'Cancelar', label: 'Cancelar' },
        { value: 'Cancelado', label: 'Cancelado' },
        { value: 'Recusado', label: 'Recusado' },
        { value: 'Marcação', label: 'Marcação' },
      ]
    },

    filteredAvailableClients() {
      return this.availableClients || []
    },

    hasActiveFilters() {
      return Object.values(this.currentFilters).some(
        value => value && value.toString().trim() !== ''
      )
    },
    
    hasCreatePermission() {
      const currentUser = this.user
      return currentUser && currentUser.level_access !== undefined && currentUser.level_access >= 0
    },

    canCreateBooking() {
      const currentUser = this.user
      return currentUser && currentUser.level_access !== undefined && currentUser.level_access >= 0
    },
    
    // Verificar se pode efetivar marcação (fazer upgrade)
    canEffectivateBooking() {
      // Só mostrar quando exatamente 1 agendamento está selecionado
      if (this.selectedSchedules.length !== 1) {
        return false
      }
      
      // Buscar o agendamento selecionado
      const selectedId = this.selectedSchedules[0]
      const schedule = this.schedules.find(s => s.id === selectedId)
      
      if (!schedule) {
        return false
      }
      
      // Só para agendamentos de marcação (identificados pela propriedade is_booking)
      if (!schedule.is_booking && schedule.is_booking !== 1) {
        return false
      }
      
      // Todos os usuários autenticados podem efetivar marcações
      if (!this.user) {
        return false
      }
      
      return true
    },
  },
  async mounted() {
    // App.vue inicializado
    
    // Adicionar event listener para scroll da página (infinite scroll)
    window.addEventListener('scroll', this.handleScroll)
    
    // Event listener para fechar dropdown do usuário ao clicar fora
    document.addEventListener('click', this.handleClickOutside)
    
    try {
      // Carregamento simples - sem verificações complexas
      this.setLoading(true, 'Carregando Sistema...', 'Aguarde um momento')
      
      // Carregar dados do localStorage (já verificado no main.js)
      this.loadUserFromStorage();
      
      // Carregar dados iniciais sem verificações de token
      await this.loadInitialDataSimple();
      
      // Inicializar permissões
      initializePermissions();
      
      // Iniciar pré-carregamento em background após carregamento inicial
      setTimeout(() => {
        this.preloadPages();
      }, 1000);
      
      console.log('App.vue carregado com sucesso');
      
    } catch (error) {
      console.error('Erro na inicialização do App.vue:', error)
      this.setLoading(false)
      this.addNotification('Erro ao inicializar sistema', 'error')
    }
  },
  beforeUnmount() {
    // Remover event listener para scroll da página
    window.removeEventListener('scroll', this.handleScroll)
    // Remover event listener para clique fora do dropdown
    document.removeEventListener('click', this.handleClickOutside)
  },
  methods: {
    // Pre-loading methods
    async preloadPages() {
      if (this.pagesPreloaded) return
      
      console.log('🚀 Iniciando pré-carregamento das páginas...')
      this.preloadingProgress = 10
      
      try {
        // Aguardar um frame para garantir que os componentes foram montados
        await this.$nextTick()
        this.preloadingProgress = 30
        
        // Simular carregamento inicial das páginas
        await new Promise(resolve => setTimeout(resolve, 500))
        this.preloadingProgress = 60
        
        // Pré-carregar dados se necessário
        await new Promise(resolve => setTimeout(resolve, 300))
        this.preloadingProgress = 80
        
        await new Promise(resolve => setTimeout(resolve, 200))
        this.preloadingProgress = 100
        this.pagesPreloaded = true
        
        console.log('✅ Pré-carregamento concluído!')
        
        // Limpar progress após 1 segundo
        setTimeout(() => {
          this.preloadingProgress = 0
        }, 1000)
        
      } catch (error) {
        console.error('❌ Erro no pré-carregamento:', error)
        this.preloadingProgress = 0
      }
    },

    // Métodos de Loading Unificado
    setLoading(isLoading, message = 'Carregando...', subtext = 'Por favor, aguarde um momento') {
      this.loading = isLoading
      this.loadingMessage = message
      this.loadingSubtext = subtext
    },

    setBulkActionLoading(isLoading, message = 'Processando...', subtext = 'Aguarde enquanto processamos sua solicitação') {
      console.log('App.vue - setBulkActionLoading called:', { isLoading, message, subtext })
      console.log('App.vue - Stack trace:', new Error().stack)
      this.bulkActionLoading = isLoading
      this.loadingMessage = message
      this.loadingSubtext = subtext
    },

    // Método para lidar com loading do componente TXT
    handleTxtLoadingChange(loadingData) {
      console.log('App.vue - handleTxtLoadingChange called:', loadingData)
      this.setBulkActionLoading(loadingData.loading, loadingData.message, loadingData.detail)
    },

    // Top Bar Methods
    async handleMainSearch() {
      const input = this.mainSearchInput.trim()
      
      if (!input) {
        return
      }
      
      this.setLoading(true, 'Buscando...', 'Procurando agendamento')
      
      try {
        console.log('🔍 Iniciando busca na página principal por NFe/chave:', input)
        
        const response = await apiService.post('/schedule-verification/search', {
          input: input
        })
        
        console.log('✅ Resultados da busca:', response)
        
        if (response && response.success) {
          this.handleSearchResults({
            results: response.results,
            searchType: response.searchType,
            searchValue: response.searchValue
          })
          
          // Limpar campo após busca bem-sucedida
          this.mainSearchInput = ''
          this.addNotification(`Encontrados ${response.results.length} agendamento(s)`, 'success')
        } else {
          const errorMsg = response?.message || 'Erro na busca'
          this.addNotification(errorMsg, 'error')
        }
        
      } catch (error) {
        console.error('❌ Erro na busca por NFe/chave:', error)
        
        let errorMessage = 'Erro ao buscar agendamento'
        if (error.response?.error) {
          errorMessage = error.response.error
        } else if (error.message) {
          errorMessage = error.message
        }
        
        this.addNotification(errorMessage, 'error')
      } finally {
        this.setLoading(false)
      }
    },

    toggleUserDropdown() {
      this.showUserDropdown = !this.showUserDropdown
    },

    handleClickOutside(event) {
      if (this.showUserDropdown && this.$refs.userProfile && !this.$refs.userProfile.contains(event.target)) {
        this.showUserDropdown = false
      }
    },

    getUserInitial() {
      if (!this.user?.name) {
        return 'U'
      }
      return this.user.name.charAt(0).toUpperCase()
    },

    // Filter methods
    handleFilterChange() {
      console.log('Filtros alterados:', this.currentFilters)
      // Recarregar agendamentos com novos filtros
      this.loadSchedules()
    },

    resetFilters() {
      this.currentFilters = {
        status: '',
        client: '',
        date_from: '',
        date_to: ''
      }
      console.log('Filtros resetados')
      // Recarregar agendamentos sem filtros
      this.loadSchedules()
    },
    // FUNÇÃO SIMPLES - APENAS CARREGA DO LOCALSTORAGE
    loadUserFromStorage() {
      // Carregando dados do usuário
      
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          this.user = JSON.parse(userData);
          // Usuário carregado com sucesso
        } catch (error) {
          console.error('Erro ao parsear dados do usuário:', error);
          // Se não conseguir parsear, não faz nada - main.js já validou
        }
      }
    },

    async loadDashboardData() {
      const promises = [
        this.loadStats(),
        this.loadRecentActivities(),
        this.loadPendingDeliveries(),
      ]
      try {
      await Promise.all(promises)
        console.log('Dashboard carregado com sucesso!')
      } catch (error) {
        console.error('Erro ao carregar dashboard:', error)
        this.addNotification('Erro ao carregar dashboard', 'error')
      }
    },

    async loadStats() {
      this.statsLoading = true
      try {
        console.log('Buscando estatísticas...')
        // Usar os agendamentos já carregados em vez de fazer nova requisição
        const schedules = this.schedules || []
        
        
        this.dashboardStats = {
          solicitacoes: schedules.filter(s => s.status === 'Solicitado').length,
          agendamentos: schedules.filter(s => s.status === 'Agendado').length,
          conferencia: schedules.filter(s => s.status === 'Conferência' || s.status === 'Recebido').length,
          tratativa: schedules.filter(s => s.status === 'Tratativa').length,
        }
        console.log('Estatísticas carregadas:', this.dashboardStats)
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error)
        this.addNotification('Erro ao carregar estatísticas', 'error')
      } finally {
        this.statsLoading = false
      }
    },

    async loadRecentActivities() {
      this.activitiesLoading = true
      try {
        console.log('Buscando atividades recentes...')
        this.recentActivities = await apiClient.getRecentActivities()
        console.log('Atividades recentes carregadas:', this.recentActivities)
      } catch (error) {
        console.error('Erro ao carregar atividades:', error)
        this.addNotification('Erro ao carregar atividades recentes', 'error')
      } finally {
        this.activitiesLoading = false
      }
    },

    async loadPendingDeliveries() {
      this.deliveriesLoading = true
      try {
        console.log('Buscando entregas pendentes...')
        this.pendingDeliveries = await apiClient.getPendingDeliveries()
        console.log('Entregas pendentes carregadas:', this.pendingDeliveries)
      } catch (error) {
        console.error('Erro ao carregar entregas:', error)
        this.addNotification('Erro ao carregar entregas agendadas', 'error')
      } finally {
        this.deliveriesLoading = false
      }
    },

    handleMenuClick(menuId) {
      this.activeMenu = menuId
      console.log('Menu clicado:', menuId)

      this.showSchedulesList = false
      this.showSettingsPage = false
      this.showXmlUploadPage = false

      switch (menuId) {
        case 'dashboard':
          this.loadDashboardData()
          break
        case 'agendamento':
          this.showSchedulesList = true
          // Se ainda não pré-carregou, mostrar indicação
          if (!this.pagesPreloaded) {
            this.addNotification('🚀 Primeira vez acessando - preparando página...', 'info')
          }
          break
        case 'agendamento-lote':
          this.showXmlUploadPage = true
          if (!this.pagesPreloaded) {
            this.addNotification('🚀 Primeira vez acessando - preparando página...', 'info')
          }
          break
        case 'configuracoes':
          this.showSettingsPage = true
          if (!this.pagesPreloaded) {
            this.addNotification('🚀 Primeira vez acessando - preparando página...', 'info')
          }
          break
        default:
          console.log('Menu não implementado:', menuId)
      }
    },

    handleLogout() {
      const confirmed = confirm('Tem certeza que deseja sair?')
      if (confirmed) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        const loginUrl = '/login.html';
        // Redirecionando para login
        window.location.href = loginUrl
      }
    },

    async handleDeliveryAction(action, deliveryId) {
      console.log('Ação na entrega:', action, deliveryId)

      switch (action) {
        case 'start':
          try {
            await apiClient.updateScheduleStatus(
              deliveryId,
              'processing',
              'Recebimento iniciado'
            )
            this.addNotification('Recebimento iniciado', 'success')
            await this.loadPendingDeliveries()
          } catch (error) {
            this.addNotification('Erro ao iniciar recebimento', 'error')
          }
          break
        case 'track':
          this.addNotification('Abrindo rastreamento...', 'info')
          break
        case 'view':
          this.addNotification('Abrindo detalhes...', 'info')
          break
        default:
          this.addNotification('Ação não reconhecida', 'warning')
      }
    },

    addNotification(message, type = 'info') {
      const notification = {
        id: Date.now(),
        message,
        type,
        timestamp: new Date(),
      }

      this.notifications.push(notification)

      setTimeout(() => {
        this.removeNotification(notification.id)
      }, 5000)
    },

    removeNotification(id) {
      const index = this.notifications.findIndex(n => n.id === id)
      if (index > -1) {
        this.notifications.splice(index, 1)
      }
    },

    async refresh() {
      await this.refreshPageAfterAction('Dados atualizados com sucesso')
    },
    async loadSchedules() {
      if (this.pagination.page === 1) {
        this.setLoading(true, 'Carregando agendamentos...', 'Buscando dados atualizados')
      }
      
      try {
        console.log('Buscando agendamentos...')
        // Usar o apiClient global com cache
        const requestParams = {
          page: this.pagination.page,
          limit: this.pagination.limit,
          ...this.currentFilters
        }
        
        console.log('🔍 Parâmetros da requisição:', requestParams)
        
        const response = await apiClient.request('/schedules', {
          method: 'GET',
          params: requestParams
        })
        
        const newSchedules = response.schedules || []
        
        if (this.pagination.page === 1) {
          this.schedules = newSchedules
        } else {
          this.schedules = [...this.schedules, ...newSchedules]
        }
        
        this.pagination.total = response.pagination?.total || 0
        this.pagination.hasMore = newSchedules.length === this.pagination.limit && newSchedules.length > 0
        console.log('Agendamentos carregados:', this.schedules.length)
      } catch (error) {
        if (this.pagination.page === 1) {
          this.schedules = []
        }
        console.error('Erro ao carregar agendamentos:', error)
        this.addNotification('Erro ao carregar agendamentos', 'error')
      } finally {
        if (this.pagination.page === 1) {
          this.setLoading(false)
        }
        console.log('Finalizou loading dos agendamentos')
      }
    },

    async loadSchedulesInBackground() {
      try {
        console.log('Carregando agendamentos em background...')
        // Usar o apiClient global com cache
        const response = await apiClient.getSchedules()
        this.schedules = response.schedules || []
        this.pagination.total = response.pagination?.total || this.schedules.length
        this.pagination.pages = response.pagination?.pages || Math.ceil(this.schedules.length / this.pagination.limit)
        console.log('Agendamentos carregados em background:', this.schedules.length)
      } catch (error) {
        this.schedules = []
        console.error('Erro ao carregar agendamentos em background:', error)
        this.addNotification('Erro ao carregar agendamentos', 'error')
      }
    },

    async loadDashboardDataInBackground() {
      try {
        console.log('Carregando dados do dashboard em background...')
        // Executar todas as requisições em paralelo
        const promises = [
          this.loadStatsInBackground(),
          this.loadRecentActivitiesInBackground(),
          this.loadPendingDeliveriesInBackground()
        ]
        
        await Promise.allSettled(promises)
        console.log('Dashboard carregado em background!')
      } catch (error) {
        console.error('Erro ao carregar dashboard em background:', error)
      }
    },

    async loadStatsInBackground() {
      try {
        // Aguardar os agendamentos serem carregados ou usar dados existentes
        await new Promise(resolve => {
          const checkSchedules = () => {
            if (this.schedules && this.schedules.length >= 0) {
              resolve()
            } else {
              setTimeout(checkSchedules, 100)
            }
          }
          checkSchedules()
        })
        
        console.log('Calculando estatísticas...')
        const schedules = this.schedules || []
        
        
        this.dashboardStats = {
          solicitacoes: schedules.filter(s => s.status === 'Solicitado').length,
          agendamentos: schedules.filter(s => s.status === 'Agendado').length,
          conferencia: schedules.filter(s => s.status === 'Conferência' || s.status === 'Recebido').length,
          tratativa: schedules.filter(s => s.status === 'Tratativa').length,
        }
        
        console.log('Estatísticas calculadas:', this.dashboardStats)
      } catch (error) {
        console.error('Erro ao calcular estatísticas:', error)
      }
    },

    // MÉTODO OTIMIZADO: Carrega apenas dados essenciais
    async loadEssentialDataOptimized() {
      this.statsLoading = true
      try {
        // Verificar token mais uma vez antes da requisição crítica
        const token = localStorage.getItem('token');
        // Carregando dados essenciais
        
        if (!token) {
          console.log('Token não disponível - cancelando requisição');
          throw new Error('Token não disponível para requisição');
        }
        
        // UMA ÚNICA REQUISIÇÃO para obter todos os dados necessários COM TIMEOUT
        // Fazendo requisição para obter dados
        const response = await Promise.race([
          apiClient.request('/schedules', {
            method: 'GET',
            params: {
              page: this.pagination.page,
              limit: this.pagination.limit,
              ...this.currentFilters // Aplicar filtros
            }
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout na consulta de agendamentos')), 45000) // 45 segundos
          )
        ])
        
        if (response && response.schedules) {
          // Usar os dados para multiple propósitos
          this.schedules = response.schedules
          this.pagination = response.pagination || {}
          
          // Definir hasMore corretamente baseado na quantidade retornada
          this.pagination.hasMore = response.schedules.length === this.pagination.limit && response.schedules.length > 0
          
          // Calcular estatísticas a partir dos dados já carregados
          this.calculateStatsFromData(response.schedules)
          
          console.log(`💡 Dados carregados: ${response.schedules.length} agendamentos, stats calculados! hasMore: ${this.pagination.hasMore}`)
        } else {
          console.warn('⚠️ Resposta vazia ou inválida da API')
          // Definir dados padrão para evitar interface quebrada
          this.schedules = []
          this.pagination = { page: 1, limit: 50, total: 0, hasMore: false }
        }
      } catch (error) {
        console.error('❌ Erro ao carregar dados essenciais:', error)
        
        // Definir dados padrão para manter interface funcional
        this.schedules = []
        this.pagination = { page: 1, limit: 50, total: 0, hasMore: false }
        
        if (error.message === 'Timeout na consulta de agendamentos') {
          console.warn('⏱️ Timeout detectado - requisição muito lenta')
          this.addNotification('Sistema carregado - dados podem demorar para aparecer devido à lentidão da conexão', 'warning')
        } else {
          this.addNotification(`Erro ao carregar dados: ${error.message}`, 'error')
        }
      } finally {
        this.statsLoading = false
      }
    },

    // Calcular stats a partir dos dados já carregados (sem nova requisição)
    calculateStatsFromData(schedules) {
      const stats = {
        solicitacoes: 0,
        agendamentos: 0,
        conferencia: 0,
        tratativa: 0
      }


      schedules.forEach(schedule => {
        const status = schedule.status?.toLowerCase()
        switch (status) {
          case 'solicitado':
            stats.solicitacoes++
            break
          case 'agendado':
            stats.agendamentos++
            break
          case 'conferência': // COM acento
          case 'conferencia': // SEM acento (compatibilidade)
          case 'recebido': // Compatibilidade com dados antigos
          case 'estoque':
            stats.conferencia++
            break
          case 'tratativa':
            stats.tratativa++
            break
        }
      })

      this.dashboardStats = stats
    },

    // Carregar dados secundários apenas quando necessário
    async loadSecondaryDataLazy() {
      console.log('⏳ Carregando dados secundários...')
      
      // Carregar apenas se os componentes estiverem visíveis/sendo usados
      const promises = []
      
      // Se não temos todos os agendamentos, carregar mais
      if (this.schedules.length < (this.pagination.total || 0)) {
        promises.push(this.loadRemainingSchedules())
      }
      
      // Carregar outras atividades se necessário
      promises.push(this.loadRecentActivitiesIfNeeded())
      
      if (promises.length > 0) {
        await Promise.allSettled(promises)
        console.log('🎉 Dados secundários carregados!')
      }
    },

    async loadRemainingSchedules() {
      if (!this.pagination.total || this.schedules.length >= this.pagination.total) {
        return // Já temos todos os dados
      }
      
      try {
        // Usar o apiClient global com cache
        const response = await apiClient.request('/schedules', {
          method: 'GET',
          params: {
            page: 2, // Carregar páginas seguintes
            limit: this.pagination.total - this.schedules.length
          }
        })
        
        if (response && response.schedules) {
          this.schedules.push(...response.schedules)
        }
      } catch (error) {
        console.error('Erro ao carregar agendamentos restantes:', error)
      }
    },

    async loadRecentActivitiesIfNeeded() {
      // Carregar apenas se o usuário estiver visualizando essa seção
      // Implementação futura conforme necessidade
    },

    async loadStatsImmediately() {
      try {
        console.log('Carregando estatísticas imediatamente...')
        // Usar o apiClient global com cache
        const response = await apiClient.getSchedules()
        const schedules = response.schedules || []
        
        
        this.dashboardStats = {
          solicitacoes: schedules.filter(s => s.status === 'Solicitado').length,
          agendamentos: schedules.filter(s => s.status === 'Agendado').length,
          conferencia: schedules.filter(s => s.status === 'Conferência' || s.status === 'Recebido').length,
          tratativa: schedules.filter(s => s.status === 'Tratativa').length,
        }
        
        console.log('Estatísticas carregadas imediatamente:', this.dashboardStats)
      } catch (error) {
        console.error('Erro ao carregar estatísticas imediatamente:', error)
        // Fallback para estatísticas zeradas
        this.dashboardStats = {
          solicitacoes: 0,
          agendamentos: 0,
          conferencia: 0,
          tratativa: 0,
        }
      }
    },

    async loadRecentActivitiesInBackground() {
      try {
        console.log('Carregando atividades recentes...')
        // Usar o apiClient global com cache
        this.recentActivities = await apiClient.getRecentActivities()
        console.log('Atividades recentes carregadas:', this.recentActivities.length)
      } catch (error) {
        console.error('Erro ao carregar atividades:', error)
        this.recentActivities = []
      }
    },

    async loadPendingDeliveriesInBackground() {
      try {
        console.log('Carregando entregas pendentes...')
        // Usar o apiClient global com cache
        this.pendingDeliveries = await apiClient.getPendingDeliveries()
        console.log('Entregas pendentes carregadas:', this.pendingDeliveries.length)
      } catch (error) {
        console.error('Erro ao carregar entregas:', error)
        this.pendingDeliveries = []
      }
    },
    canSelectSchedule(schedule) {
      // Verificar se pode selecionar baseado no status e permissões do usuário
      const allowedStatuses = ['Solicitado', 'Contestado', 'Cancelar', 'Agendado', 'Conferência', 'Recebido', 'Tratativa', 'Em estoque', 'Estoque', 'Marcação']
      if (!allowedStatuses.includes(schedule.status)) return false
      
      // Usuários nível 1 agora podem selecionar marcações para efetivação
      // Removida a restrição anterior para permitir efetivação por todos os usuários
      
      // Se já tem agendamentos selecionados, só pode selecionar do mesmo status
      if ((this.selectedSchedules || []).length > 0) {
        const selectedStatuses = this.selectedScheduleStatuses
        if (selectedStatuses.length === 1 && !selectedStatuses.includes(schedule.status)) {
          return false
        }
      }
      return true
    },
    getStatusBadge(status) {
      const statusConfig = {
        Solicitado: { class: 'warning', label: 'Solicitado' },
        Contestado: { class: 'contestado', label: 'Contestado' },
        Agendado: { class: 'primary', label: 'Agendado' },
        Conferência: { class: 'success', label: 'Em conferência' },
        Recebido: { class: 'success', label: 'Em conferência' }, // Compatibilidade com dados antigos
        Tratativa: { class: 'danger', label: 'Em tratativa' },
        'Em estoque': { class: 'success', label: 'Em estoque' },
        'Estoque': { class: 'success', label: 'Em estoque' }, // Compatibilidade com dados antigos
        Recusar: { class: 'danger', label: 'Recusar' },
        Cancelar: { class: 'warning', label: 'Cancelar' },
        Recusado: { class: 'dark', label: 'Recusado' },
        Cancelado: { class: 'secondary', label: 'Cancelado' },
        Marcação: { class: 'booking', label: 'Marcação' },
      }
      return statusConfig[status] || { class: 'secondary', label: 'Desconhecido' }
    },
    onScheduleSelect() {
      // Verificar se todos os agendamentos selecionáveis estão selecionados
      const selectableSchedules = (this.displayedSchedules || []).filter(schedule => 
        this.canSelectSchedule(schedule)
      )
      // Checkbox select all removido - apenas seleção individual
      // Verificar se os agendamentos selecionados têm o mesmo status
      const selectedStatuses = this.selectedScheduleStatuses
      if (selectedStatuses.length > 1) {
        // Se tiver status diferentes, manter apenas o último selecionado
        const lastSelected = this.selectedSchedules[this.selectedSchedules.length - 1]
        const lastSelectedSchedule = (this.schedules || []).find(s => s.id === lastSelected)
        if (lastSelectedSchedule) {
          this.selectedSchedules = this.selectedSchedules.filter(id => {
            const schedule = (this.schedules || []).find(s => s.id === id)
            return schedule && schedule.status === lastSelectedSchedule.status
          })
        }
      }
    },
    formatDate(date) {
      if (!date) return ''
      
      // Evitar problemas de timezone para datas no formato YYYY-MM-DD
      if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
        const [year, month, day] = date.split('-')
        return `${day}/${month}/${year}`
      }
      
      // Fallback para outros formatos
      try {
        const d = new Date(date)
        if (isNaN(d)) return date
        return d.toLocaleDateString('pt-BR')
      } catch (error) {
        return date
      }
    },
    
    formatDateForDisplay(dateString) {
      if (!dateString) return ''
      
      // Se já está no formato YYYY-MM-DD, converter para DD/MM/YYYY
      if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateString.split('-')
        return `${day}/${month}/${year}`
      }
      
      try {
        const date = new Date(dateString)
        if (isNaN(date.getTime())) {
          return dateString
        }
        return date.toLocaleDateString('pt-BR')
      } catch (error) {
        return dateString
      }
    },
    openInfoModal(schedule) {
      this.selectedSchedule = schedule
      this.showInfoModal = true
    },
    closeInfoModal() {
      this.showInfoModal = false
      this.selectedSchedule = null
    },
    openEditModal(schedule) {
      console.log('openEditModal chamado com:', schedule)
      this.scheduleToEdit = schedule || this.selectedSchedule
      this.showEditModal = true
      setTimeout(() => {
        console.log('showEditModal:', this.showEditModal, 'scheduleToEdit:', this.scheduleToEdit)
      }, 100)
    },
    closeEditModal() {
      this.showEditModal = false
      this.scheduleToEdit = null
      // Fechar também o modal de informações da NF-e se estiver aberto
      this.closeInfoModal()
    },
    
    openScheduleCreationModal() {
      this.showScheduleCreationModal = true
    },
    
    closeScheduleCreationModal() {
      this.showScheduleCreationModal = false
    },
    
    async handleScheduleCreated(createdSchedule) {
      console.log('Agendamento criado:', createdSchedule)
      this.addNotification('Agendamento criado com sucesso!', 'success')
      this.closeScheduleCreationModal()
      
      // Recarregar a lista de agendamentos
      await this.refreshPageAfterAction('Lista atualizada com novo agendamento')
    },

    // Métodos para agendamento de marcação
    openBookingModal() {
      this.showBookingModal = true
    },

    closeBookingModal() {
      this.showBookingModal = false
    },

    async handleBookingCreated(createdBooking) {
      console.log('Agendamento de marcação criado:', createdBooking)
      this.addNotification('Agendamento de marcação criado com sucesso!', 'success')
      this.closeBookingModal()
      
      // Recarregar a lista de agendamentos
      await this.refreshPageAfterAction('Lista atualizada com novo agendamento de marcação')
    },
    
    // Métodos para upgrade de marcação
    effectivateBooking() {
      if (!this.canEffectivateBooking) return
      
      const selectedId = this.selectedSchedules[0]
      const schedule = this.schedules.find(s => s.id === selectedId)
      
      if (!schedule) {
        this.addNotification('Agendamento não encontrado', 'error')
        return
      }
      
      console.log('⬆️ Iniciando efetivação para:', schedule)
      this.bookingToEffectivate = schedule
      this.showEffectivateModal = true
    },
    
    closeEffectivateModal() {
      this.showEffectivateModal = false
      this.bookingToEffectivate = null
    },
    
    async handleBookingEffectivated(response) {
      console.log('✅ Efetivação de marcação concluída:', response)
      this.addNotification('Marcação efetivada com sucesso!', 'success')
      this.closeEffectivateModal()
      
      // Limpar seleção atual antes de recarregar
      this.clearSelection()
      
      // Recarregar a lista de agendamentos
      await this.refreshPageAfterAction('Lista atualizada após efetivação da marcação')
    },
    async handleScheduleUpdated(updatedSchedule) {
      console.log('✅ Agendamento atualizado:', updatedSchedule)
      
      // Limpar o cache para forçar atualização completa
      if (window.apiClient && window.apiClient.clearCache) {
        window.apiClient.clearCache('/schedules')
        console.log('🗑️ Cache de agendamentos limpo')
      }
      
      // Atualização completa da página
      this.setLoading(true, 'Salvando Alterações...', 'Aplicando modificações no agendamento')
      this.statsLoading = true
      
      try {
        // Recarregar dados essenciais completamente
        await this.loadEssentialDataOptimized()
        
        // Adicionar notificação de sucesso
        this.addNotification('Agendamento atualizado com sucesso', 'success')
        
        console.log('🔄 Página atualizada completamente após edição')
      } catch (error) {
        console.error('Erro ao atualizar página:', error)
        this.addNotification('Erro ao atualizar dados', 'error')
      } finally {
        this.setLoading(false)
        this.statsLoading = false
      }
      
      // Fechar modal de edição (que automaticamente fecha o de informações)
      this.closeEditModal()
    },

    // Método auxiliar para atualização completa após ações
    async refreshPageAfterAction(successMessage) {
      // Limpar o cache para forçar atualização completa
      if (window.apiClient && window.apiClient.clearCache) {
        window.apiClient.clearCache('/schedules')
        console.log('🗑️ Cache de agendamentos limpo após ação')
      }
      
      // Resetar paginação para carregar desde o início
      this.pagination.page = 1
      this.pagination.hasMore = true
      
      // Limpar filtros para carregar todos os agendamentos permitidos
      this.currentFilters = {
        status: '',
        client: '',
        date_from: '',
        date_to: '',
        nfe_number: ''
      }
      
      // Atualização completa
      this.setLoading(true, 'Atualizando Dados...', 'Aplicando alterações e recarregando informações')
      this.statsLoading = true
      
      try {
        await this.loadEssentialDataOptimized()
        if (successMessage) {
          this.addNotification(successMessage, 'success')
        }
        console.log('🔄 Página atualizada completamente após ação')
      } catch (error) {
        console.error('Erro ao atualizar página:', error)
        this.addNotification('Erro ao atualizar dados', 'error')
      } finally {
        this.setLoading(false)
        this.statsLoading = false
      }
    },

    clearSelection() {
      this.selectedSchedules = []
      this.newDate = ''
    },

    selectAll() {
      // Seleciona todos os agendamentos visíveis que podem ser selecionados
      const selectableSchedules = (this.displayedSchedules || []).filter(schedule => this.canSelectSchedule(schedule))
      this.selectedSchedules = selectableSchedules.map(schedule => schedule.id)
    },

    toggleSelection() {
      if (this.selectedSchedules.length === 0) {
        this.selectAll()
      } else {
        this.clearSelection()
      }
    },
    async loadMoreSchedules() {
      if (this.loadingMore || !this.pagination.hasMore) return
      
      this.loadingMore = true
      this.pagination.page += 1
      
      try {
        await this.loadSchedules()
      } catch (error) {
        // Se der erro, volta a página anterior
        this.pagination.page -= 1
      } finally {
        this.loadingMore = false
      }
    },

    handleScroll() {
      // Usar o scroll da página em vez do scroll do container
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const scrollHeight = document.documentElement.scrollHeight
      const clientHeight = window.innerHeight
      const threshold = 100 // pixels do fim para começar a carregar
      
      if (scrollTop + clientHeight >= scrollHeight - threshold) {
        this.loadMoreSchedules()
      }
    },
    async acceptSchedules() {
      if (this.selectedSchedules.length === 0) return
      this.setBulkActionLoading(true, 'Aceitando Agendamentos...', 'Processando solicitações selecionadas')
      try {
        await this.bulkUpdateStatus('Agendado', 'Agendamento aceito')
        this.clearSelection()
        await this.refreshPageAfterAction(`${this.selectedSchedules.length} agendamento(s) aceito(s) com sucesso`)
      } catch (error) {
        console.error('Erro ao aceitar agendamentos:', error)
        this.addNotification('Erro ao aceitar agendamentos', 'error')
      } finally {
        this.setBulkActionLoading(false)
      }
    },
    async changeDateToContestado() {
      if (this.selectedSchedules.length === 0 || !this.newDate) return
      this.setBulkActionLoading(true, 'Alterando Data...', 'Contestando agendamentos com nova data')
      try {
        await this.bulkUpdateStatusWithDateAndComment('Contestado', this.newDate)
        this.clearSelection()
        await this.refreshPageAfterAction(`Data alterada para ${this.selectedSchedules.length} agendamento(s)`)
      } catch (error) {
        console.error('Erro ao alterar data:', error)
        this.addNotification('Erro ao alterar data dos agendamentos', 'error')
      } finally {
        this.setBulkActionLoading(false)
      }
    },
    async acceptNewDate() {
      if (this.selectedSchedules.length === 0) return
      this.setBulkActionLoading(true, 'Aceitando Nova Data...', 'Confirmando data contestada')
      try {
        await this.bulkUpdateStatus('Agendado', 'Nova data aceita')
        this.clearSelection()
        await this.refreshPageAfterAction(`Nova data aceita para ${this.selectedSchedules.length} agendamento(s)`)
      } catch (error) {
        console.error('Erro ao aceitar nova data:', error)
        this.addNotification('Erro ao aceitar nova data', 'error')
      } finally {
        this.setBulkActionLoading(false)
      }
    },
    async confirmContestado() {
      if (this.selectedSchedules.length === 0) return
      this.setBulkActionLoading(true, 'Confirmando Status...', 'Alterando status para contestado')
      try {
        await this.bulkUpdateStatus('Agendado', 'Data contestada confirmada')
        this.clearSelection()
        await this.refreshPageAfterAction(`${this.selectedSchedules.length} agendamento(s) confirmado(s)`)
      } catch (error) {
        console.error('Erro ao confirmar agendamentos:', error)
        this.addNotification('Erro ao confirmar agendamentos', 'error')
      } finally {
        this.setBulkActionLoading(false)
      }
    },
    async changeContestadoToAgendado() {
      if (this.selectedSchedules.length === 0 || !this.newDate) return
      this.setBulkActionLoading(true, 'Reagendando...', 'Alterando status contestado para agendado')
      try {
        await this.bulkUpdateStatusWithDate('Agendado', this.newDate, 'Data contestada reagendada')
        this.clearSelection()
        await this.refreshPageAfterAction(`${this.selectedSchedules.length} agendamento(s) reagendado(s)`)
      } catch (error) {
        console.error('Erro ao reagendar:', error)
        this.addNotification('Erro ao reagendar agendamentos', 'error')
      } finally {
        this.setBulkActionLoading(false)
      }
    },
    
    async cancelSchedules() {
      if (this.selectedSchedules.length === 0) return
      
      if (!confirm(`Tem certeza que deseja cancelar ${this.selectedSchedules.length} agendamento(s)?`)) {
        return
      }
      
      this.setBulkActionLoading(true, 'Cancelando Agendamentos...', 'Processando solicitações de cancelamento')
      try {
        // Usuário nível 1 (admin) -> status "Cancelar" (precisa aprovação)
        // Outros usuários -> status "Cancelado" (cancelamento direto)
        const newStatus = this.userLevel === 1 ? 'Cancelar' : 'Cancelado'
        const comment = this.userLevel === 1 ? 'Agendamento solicitado para cancelamento' : 'Agendamento cancelado diretamente'
        
        await this.bulkUpdateStatus(newStatus, comment)
        
        const message = this.userLevel === 1 
          ? `${this.selectedSchedules.length} agendamento(s) marcado(s) para cancelamento` 
          : `${this.selectedSchedules.length} agendamento(s) cancelado(s) com sucesso`
          
        this.clearSelection()
        await this.refreshPageAfterAction(message)
      } catch (error) {
        console.error('Erro ao cancelar agendamentos:', error)
        this.addNotification('Erro ao cancelar agendamentos', 'error')
      } finally {
        this.setBulkActionLoading(false)
      }
    },

    
    async markAsReceived() {
      if (this.selectedSchedules.length === 0) return
      
      if (!confirm(`Tem certeza que deseja marcar ${this.selectedSchedules.length} agendamento(s) como em conferência?`)) {
        return
      }
      
      this.setBulkActionLoading(true, 'Marcando como Em Conferência...', 'Atualizando status para conferência')
      try {
        await this.bulkUpdateStatus('Conferência', 'Agendamento marcado como em conferência')
        this.clearSelection()
        await this.refreshPageAfterAction(`${this.selectedSchedules.length} agendamento(s) marcado(s) como em conferência`)
      } catch (error) {
        console.error('Erro ao marcar como em conferência:', error)
        this.addNotification('Erro ao marcar agendamentos como em conferência', 'error')
      } finally {
        this.setBulkActionLoading(false)
      }
    },

    async markAsEmEstoque() {
      if (this.selectedSchedules.length === 0) return
      
      if (!confirm(`Tem certeza que deseja marcar ${this.selectedSchedules.length} agendamento(s) como em estoque?`)) {
        return
      }
      
      this.setBulkActionLoading(true, 'Marcando como Em Estoque...', 'Atualizando status para estoque')
      try {
        await this.bulkUpdateStatus('Em estoque', 'Agendamento marcado como em estoque')
        this.clearSelection()
        await this.refreshPageAfterAction(`${this.selectedSchedules.length} agendamento(s) marcado(s) como em estoque`)
      } catch (error) {
        console.error('Erro ao marcar como em estoque:', error)
        this.addNotification('Erro ao marcar agendamentos como em estoque', 'error')
      } finally {
        this.setBulkActionLoading(false)
      }
    },

    async markAsTratativa() {
      if (this.selectedSchedules.length === 0) return
      
      if (!confirm(`Tem certeza que deseja marcar ${this.selectedSchedules.length} agendamento(s) como em tratativa?`)) {
        return
      }
      
      this.setBulkActionLoading(true, 'Marcando como Em Tratativa...', 'Atualizando para status de tratativa')
      try {
        await this.bulkUpdateStatus('Tratativa', 'Agendamento marcado como em tratativa devido a problemas identificados')
        this.clearSelection()
        await this.refreshPageAfterAction(`${this.selectedSchedules.length} agendamento(s) marcado(s) como em tratativa`)
      } catch (error) {
        console.error('Erro ao marcar como tratativa:', error)
        this.addNotification('Erro ao marcar agendamentos como em tratativa', 'error')
      } finally {
        this.setBulkActionLoading(false)
      }
    },

    async handleMarkSingleAsTratativa(scheduleData) {
      console.log('🔄 Marcando agendamento individual como tratativa:', scheduleData)
      
      if (!scheduleData || !scheduleData.id) {
        this.addNotification('Erro: dados do agendamento não encontrados', 'error')
        return
      }
      
      if (!confirm(`Tem certeza que deseja marcar o agendamento "${scheduleData.number || scheduleData.id}" como em tratativa?`)) {
        return
      }
      
      this.loading = true
      try {
        // Usar o apiClient para atualizar status individual
        const apiClient = window.apiClient
        
        await apiClient.updateScheduleStatus(
          scheduleData.id,
          'Tratativa',
          'Agendamento marcado como em tratativa devido a problemas identificados'
        )
        
        this.addNotification('Agendamento marcado como em tratativa com sucesso!', 'success')
        
        // Fechar modal de informações
        this.closeInfoModal()
        
        // Recarregar lista
        await this.refreshPageAfterAction('Status atualizado para tratativa')
        
      } catch (error) {
        console.error('Erro ao marcar agendamento como tratativa:', error)
        this.addNotification('Erro ao marcar agendamento como em tratativa', 'error')
      } finally {
        this.loading = false
      }
    },

    async handleChangeStatusFromTratativa({ scheduleData, newStatus }) {
      console.log('🔄 Alterando status de tratativa para:', newStatus, 'agendamento:', scheduleData)
      
      if (!scheduleData || !scheduleData.id) {
        this.addNotification('Erro: dados do agendamento não encontrados', 'error')
        return
      }
      
      if (!newStatus) {
        this.addNotification('Erro: novo status não informado', 'error')
        return
      }
      
      const statusLabels = {
        'Solicitado': 'Solicitado',
        'Contestado': 'Contestado', 
        'Agendado': 'Agendado',
        'Conferência': 'Em conferência',
        'Recebido': 'Em conferência',
        'Em estoque': 'Em estoque',
        'Estoque': 'Em estoque', // Compatibilidade com dados antigos
        'Tratativa': 'Em tratativa',
        'Cancelar': 'Cancelar',
        'Cancelado': 'Cancelado',
        'Recusado': 'Recusado'
      }
      
      const statusLabel = statusLabels[newStatus] || newStatus
      
      if (!confirm(`Tem certeza que deseja alterar o agendamento "${scheduleData.number || scheduleData.id}" de "Em tratativa" para "${statusLabel}"?`)) {
        return
      }
      
      this.loading = true
      try {
        // Usar o apiClient para atualizar status individual
        const apiClient = window.apiClient
        
        await apiClient.updateScheduleStatus(
          scheduleData.id,
          newStatus,
          `Status alterado de "Em tratativa" para "${statusLabel}" pelo usuário`
        )
        
        this.addNotification(`Status alterado para "${statusLabel}" com sucesso!`, 'success')
        
        // Fechar modal de informações
        this.closeInfoModal()
        
        // Recarregar lista
        await this.refreshPageAfterAction(`Status atualizado para ${statusLabel}`)
        
      } catch (error) {
        console.error('Erro ao alterar status do agendamento:', error)
        this.addNotification(`Erro ao alterar status para "${statusLabel}"`, 'error')
      } finally {
        this.loading = false
      }
    },

    async acceptCancellation() {
      if (this.selectedSchedules.length === 0) return
      
      if (!confirm(`Tem certeza que deseja aceitar o cancelamento de ${this.selectedSchedules.length} agendamento(s)?`)) {
        return
      }
      
      this.setBulkActionLoading(true, 'Aceitando Cancelamento...', 'Processando solicitações de cancelamento')
      try {
        await this.bulkUpdateStatus('Cancelado', 'Cancelamento aceito')
        this.clearSelection()
        await this.refreshPageAfterAction(`${this.selectedSchedules.length} cancelamento(s) aceito(s)`)
      } catch (error) {
        console.error('Erro ao aceitar cancelamento:', error)
        this.addNotification('Erro ao aceitar cancelamento', 'error')
      } finally {
        this.setBulkActionLoading(false)
      }
    },
    async bulkUpdateStatus(newStatus, comment) {
      // Usar o apiClient global com cache
      for (const scheduleId of this.selectedSchedules) {
        const currentUser = this.getCurrentUser()
        const payload = {
          status: newStatus,
          historic_entry: {
            user: currentUser.user || currentUser.name || 'Usuário',
            action: `Status alterado para ${newStatus}`,
            comment: comment
          }
        }
        await apiClient.request(`/schedules/${scheduleId}/status`, {
          method: 'PATCH',
          data: payload
        })
      }
    },
    async bulkUpdateStatusWithDate(newStatus, newDate, comment) {
      // Usar o apiClient global com cache
      const formattedDate = this.formatDateForBackend(newDate)
      for (const scheduleId of this.selectedSchedules) {
        const scheduleResponse = await apiClient.request(`/schedules/${scheduleId}`, {
          method: 'GET'
        })
        const currentSchedule = scheduleResponse.schedule
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
        await apiClient.request(`/schedules/${scheduleId}`, {
          method: 'PUT',
          data: updatePayload
        })
        const statusPayload = {
          status: newStatus,
          historic_entry: {
            user: this.getCurrentUser().user || this.getCurrentUser().name || 'Usuário',
            action: `Status alterado para ${newStatus} com nova data ${this.formatDateForDisplay(formattedDate)}`,
            comment: comment
          }
        }
        await apiClient.request(`/schedules/${scheduleId}/status`, {
          method: 'PATCH',
          data: statusPayload
        })
      }
    },

    async bulkUpdateStatusWithDateAndComment(newStatus, newDate) {
      // Usar o apiClient global com cache
      const formattedDate = this.formatDateForBackend(newDate)
      for (const scheduleId of this.selectedSchedules) {
        const scheduleResponse = await apiClient.request(`/schedules/${scheduleId}`, {
          method: 'GET'
        })
        const currentSchedule = scheduleResponse.schedule
        
        // Gerar comentário personalizado para contestação
        const oldDateFormatted = this.formatDateForDisplay(currentSchedule.date)
        const newDateFormatted = this.formatDateForDisplay(formattedDate)
        const customComment = `A data escolhida (${oldDateFormatted}) está indisponível, a data escolhida pela nossa equipe é ${newDateFormatted}. Por gentileza confirmar em nossa plataforma.`
        
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
        await apiClient.request(`/schedules/${scheduleId}`, {
          method: 'PUT',
          data: updatePayload
        })
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
    formatDateForBackend(dateString) {
      if (!dateString) return null
      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateString
      }
      const date = new Date(dateString)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
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
      }
      this.pagination.page = 1
      this.pagination.hasMore = true
      this.schedules = [] // Limpar lista atual
      this.loadSchedules()
    },

    // Carregar clientes disponíveis baseado no cli_access do usuário
    loadAvailableClients() {
      try {
        const userData = localStorage.getItem('user')
        
        if (!userData) {
          return
        }
        
        const user = JSON.parse(userData)
        
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
          // Para usuários com acesso total, carregar todos os clientes disponíveis
          this.loadAllClientsForFilter()
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
        } else {
          this.availableClients = []
        }
      } catch (error) {
        console.error('❌ Erro ao carregar clientes disponíveis:', error)
        this.availableClients = []
      }
    },

    async loadAllClientsForFilter() {
      try {
        console.log('🏢 Carregando todos os clientes para filtro (usuário com acesso total)...')
        
        // Usar cache global se disponível e recente (menos de 5 minutos)
        if (window.globalClientsCache && window.globalClientsCache.clients) {
          const cacheAge = Date.now() - window.globalClientsCache.loadedAt
          if (cacheAge < 5 * 60 * 1000) { // 5 minutos
            console.log('📋 Usando cache de clientes para filtro')
            this.availableClients = window.globalClientsCache.clients.map(client => ({
              cnpj: client.cnpj,
              name: client.name || `Cliente ${client.cnpj}`,
              number: client.number || client.cnpj
            }))
            return
          }
        }

        // Se não tem cache, carregar da API
        const response = await apiClient.request('/clients', {
          method: 'GET'
        })
        
        if (response && response.data) {
          const allClients = response.data || []
          
          this.availableClients = allClients.map(client => ({
            cnpj: client.cnpj,
            name: client.name || `Cliente ${client.cnpj}`,
            number: client.number || client.cnpj
          }))
          
          // Atualizar cache global
          window.globalClientsCache = {
            clients: this.availableClients,
            loadedAt: Date.now()
          }
          
          console.log(`✅ ${this.availableClients.length} clientes carregados para filtro`)
        } else {
          console.warn('⚠️ Resposta da API de clientes não contém dados')
          this.availableClients = []
        }
        
      } catch (error) {
        console.error('❌ Erro ao carregar todos os clientes para filtro:', error)
        this.availableClients = []
      }
    },

    handleReprocessSuccess(scheduleData) {
      console.log('✅ Reprocessamento bem-sucedido para agendamento:', scheduleData.id);
      // Recarregar dados do dashboard se necessário
      this.loadEssentialDataOptimized();
    },

    handleReprocessToast(message) {
      this.addNotification(message, 'info');
    },

    async loadInitialData() {
      try {
        console.log('📊 Carregando dados iniciais...')
        
        // Definir mensagem de carregamento inicial
        this.setLoading(true, 'Carregando Dashboard...', 'Iniciando sistema e carregando dados')
        
        // Carregar clientes disponíveis
        this.loadAvailableClients()
        
        // Carregar dados essenciais
        await this.loadEssentialDataOptimized()
        
        // Liberar interface
        this.setLoading(false)
        console.log('✅ Dados iniciais carregados!')
        
      } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error)
        this.addNotification('Erro ao carregar dados iniciais', 'error')
        this.setLoading(false)
      }
    },

    // CARREGAMENTO SIMPLES DE DADOS INICIAIS
    async loadInitialDataSimple() {
      console.log('=== CARREGANDO DADOS INICIAIS ===');
      
      try {
        this.statsLoading = true;
        
        // Carregar dados mockados primeiro para interface responder
        this.loadMockData();
        
        // Atualizar mensagem de loading
        this.setLoading(true, 'Carregando Agendamentos...', 'Buscando dados mais recentes');
        
        // Carregar dados reais (aguardar conclusão)
        await this.loadRealDataInBackground();
        
      } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error);
        this.addNotification('Interface carregada - dados sendo obtidos...', 'info');
      } finally {
        this.statsLoading = false;
        // Finalizar loading principal após carregar dados reais
        this.setLoading(false);
      }
    },
    
    // CARREGAR DADOS MOCKADOS PARA INTERFACE RESPONDER
    loadMockData() {
      console.log('Carregando dados mockados...');
      
      this.dashboardStats = {
        solicitacoes: 0,
        agendamentos: 0,
        conferencia: 0,
        tratativa: 0
      };
      
      this.schedules = [];
      this.availableClients = [];
      
      console.log('Dados mockados carregados');
    },
    
    // CARREGAR DADOS REAIS EM BACKGROUND (SEM BLOQUEAR)
    async loadRealDataInBackground() {
      console.log('=== CARREGANDO DADOS REAIS ===');
      
      try {
        // Tentar carregar agendamentos
        console.log('📊 Buscando agendamentos da API...');
        const response = await apiClient.request('/schedules', {
          method: 'GET',
          params: {
            page: 1,
            limit: 50
          }
        });
        
        if (response && response.schedules) {
          console.log('✅ Dados reais carregados:', response.schedules.length, 'agendamentos');
          this.schedules = response.schedules;
          this.calculateStatsFromData(response.schedules);
          
          // Atualizar mensagem de loading para próxima etapa
          this.setLoading(true, 'Finalizando...', 'Carregando lista de clientes');
          
          // Carregar clientes disponíveis também
          await this.loadClientsFromAPI();
          
          console.log('🎉 Carregamento completo!');
        } else {
          console.warn('⚠️ Resposta da API sem dados de agendamentos');
          this.addNotification('Nenhum agendamento encontrado', 'info');
        }
        
      } catch (error) {
        console.error('❌ Erro ao carregar dados reais:', error);
        this.addNotification('Erro ao carregar dados - usando dados locais', 'warning');
        // Manter dados mockados em caso de erro
      }
    },

    async loadClientsFromAPI() {
      if (this.clientsLoadingGlobal || this.availableClientsGlobal.length > 0) {
        console.log('🔄 Clientes já carregados ou carregamento em andamento')
        return
      }
      
      console.log('📋 Carregando lista de clientes...');

      this.clientsLoadingGlobal = true
      
      try {
        console.log('🏢 Carregando clientes da API...')
        
        const apiClient = window.apiClient
        const response = await Promise.race([
          apiClient.request('/clients', {
            method: 'GET',
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout ao carregar clientes')), 20000)
          )
        ])

        let allClients = response.data || []
        allClients = allClients.filter(client => client.cnpj)

        const currentUser = this.getCurrentUser()
        
        if (currentUser && currentUser.level_access !== 0) {
          // Usuário com acesso restrito - filtrar por cli_access
          if (currentUser.cli_access) {
            let cliAccess = currentUser.cli_access
            
            // Tratar cli_access se estiver como string
            if (typeof cliAccess === 'string' && cliAccess) {
              try {
                cliAccess = JSON.parse(cliAccess)
              } catch (e) {
                console.warn('Erro ao parsear cli_access:', e)
                cliAccess = null
              }
            }
            
            if (cliAccess && typeof cliAccess === 'object') {
              const allowedCNPJs = Object.keys(cliAccess).map(cnpj => cnpj.replace(/[^\d]/g, ''))
              allClients = allClients.filter(client => {
                const clientCnpj = (client.cnpj || '').replace(/[^\d]/g, '')
                return allowedCNPJs.includes(clientCnpj)
              })
            } else {
              allClients = []
            }
          } else {
            allClients = []
          }
        }
        // Se level_access === 0, mantém todos os clientes (acesso total)

        this.availableClientsGlobal = allClients
        console.log(`✅ ${allClients.length} clientes carregados e armazenados globalmente`)

        // Disponibilizar globalmente para os modais
        window.globalClientsCache = {
          clients: allClients,
          loadedAt: Date.now()
        }

      } catch (error) {
        console.error('❌ Erro ao carregar clientes da API:', error)
        
        if (error.message === 'Timeout ao carregar clientes') {
          console.warn('⏱️ Timeout no carregamento de clientes')
        }
        
        // Não mostrar notificação para não poluir a interface
        // Os modais terão fallback para carregar individualmente se necessário
        
      } finally {
        this.clientsLoadingGlobal = false
      }
    },

    getCurrentUser() {
      const userData = localStorage.getItem('user')
      return userData ? JSON.parse(userData) : null
    },
    
    // Métodos para busca por NFe/Chave
    handleSearchResults(searchData) {
      console.log('🔍 Resultados recebidos:', searchData)
      
      const results = searchData.results || []
      
      // Salvar agendamentos originais se ainda não estão salvos
      if (!this.isSearchActive) {
        this.originalSchedules = [...this.schedules]
      }
      
      if (results.length > 0) {
        // Substituir a lista de agendamentos pelos resultados da busca
        this.schedules = results
        this.isSearchActive = true
        this.currentSearchInfo = {
          type: searchData.searchType,
          value: searchData.searchValue,
          count: results.length
        }
        
        this.addNotification(
          `${results.length} agendamento(s) encontrado(s) - Lista filtrada`,
          'success'
        )
      } else {
        // Se não há resultados, limpar a lista
        this.schedules = []
        this.isSearchActive = true
        this.currentSearchInfo = {
          type: searchData.searchType,
          value: searchData.searchValue,
          count: 0
        }
        
        this.addNotification(
          'Nenhum agendamento encontrado',
          'info'
        )
      }
    },
    
    handleSearchError(errorMessage) {
      this.addNotification(errorMessage, 'error')
    },
    
    handleSearchStart() {
      console.log('🔍 Iniciando busca por NFe/chave...')
    },
    
    clearSearch() {
      if (this.isSearchActive) {
        // Restaurar agendamentos originais
        this.schedules = [...this.originalSchedules]
        this.isSearchActive = false
        this.currentSearchInfo = null
        this.originalSchedules = []
        
        this.addNotification('Busca limpa - Lista restaurada', 'info')
      }
    },
  },
}

// Disponibilizar globalmente para compatibilidade
window.apiClient = apiClient
</script>

<style scoped>
/* Table wrapper - using page scroll instead of container scroll */
.table-wrapper {
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
}

.schedules-table {
  width: 100%;
  margin-bottom: 0;
}

/* Loading more indicator */
.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  color: #6c757d;
  border-top: 1px solid #dee2e6;
  background-color: #f8f9fa;
}

.loading-more i {
  margin-right: 0.5rem;
}

.loading-more p {
  margin: 0;
  font-size: 0.875rem;
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

/* Universal Loading Overlay */
.universal-loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
  animation: fadeIn 0.3s ease-out;
}

.loading-content {
  background: white;
  border-radius: 16px;
  padding: 40px;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  max-width: 400px;
  width: 90%;
  animation: scaleIn 0.4s ease-out;
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #2563eb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 24px auto;
}

.loading-content h3 {
  margin: 0 0 12px 0;
  color: #1f2937;
  font-size: 1.5rem;
  font-weight: 600;
}

.loading-content p {
  margin: 0;
  color: #6b7280;
  font-size: 1rem;
  line-height: 1.5;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scaleIn {
  from { 
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  to { 
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
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

/* Status badge personalizado para Marcação */
.status-badge.booking {
  background-color: #f3e5f5 !important; /* Roxo claro */
  color: #7b1fa2 !important; /* Roxo escuro */
  border-color: #ba68c8 !important; /* Roxo médio */
  font-weight: 500 !important;
}

/* Bulk Actions Styles */
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

.contestado-actions,
.solicitado-actions,
.agendado-actions,
.cancelar-actions,
.universal-actions,
.effectivate-actions {
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

.level-1-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.bulk-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
}

.action-btn {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
}

/* Estilos de input de data movidos para .date-change-group */

@media (max-width: 768px) {
  .bulk-actions-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }
  
  .bulk-actions {
    justify-content: center;
  }
  
  .contestado-actions,
  .solicitado-actions,
  .agendado-actions,
  .txt-actions {
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .non-level-1-actions {
    flex-wrap: wrap;
    justify-content: center;
  }
}

/* Header actions */
.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-actions .btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.header-actions .btn-primary {
  margin-right: 0.75rem;
  font-weight: 600;
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

/* Action buttons styling */
.action-buttons {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Botão Efetivar Marcação */
.effectivate-actions .btn-success {
  background-color: #059669 !important;
  border-color: #059669 !important;
  color: white !important;
  font-weight: 600;
}

.effectivate-actions .btn-success:hover {
  background-color: #047857 !important;
  border-color: #047857 !important;
  color: white !important;
}

.effectivate-actions .btn-success:focus,
.effectivate-actions .btn-success:active {
  background-color: #065f46 !important;
  border-color: #065f46 !important;
  color: white !important;
  box-shadow: 0 0 0 0.2rem rgba(5, 150, 105, 0.25) !important;
}

/* TXT Generation Actions */
.txt-actions {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Estilos do txt-indicator removidos - não mais necessários */

.txt-actions .btn {
  font-size: 0.875rem;
  padding: 0.375rem 0.75rem;
  font-weight: 500;
}

.txt-actions .btn-info {
  background-color: #17a2b8 !important;
  border-color: #17a2b8 !important;
  color: white !important;
}

.txt-actions .btn-info:hover {
  background-color: #138496 !important;
  border-color: #117a8b !important;
  color: white !important;
}

.txt-actions .btn-info:focus,
.txt-actions .btn-info:active {
  background-color: #117a8b !important;
  border-color: #10707f !important;
  color: white !important;
  box-shadow: 0 0 0 0.2rem rgba(23, 162, 184, 0.25) !important;
}

/* Caixa visual para agrupar input de data e botão alterar data */
.date-change-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f8fafc;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.5rem;
  transition: all 0.2s ease;
}

.date-change-group:hover {
  border-color: #d1d5db;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.date-change-group:focus-within {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.date-change-group .form-control {
  border: 1px solid #d1d5db;
  background: white;
  margin: 0;
  width: 140px;
  transition: border-color 0.2s ease;
}

.date-change-group .form-control:focus {
  border-color: #3b82f6;
  box-shadow: none;
}

.date-change-group .action-btn {
  margin: 0;
  white-space: nowrap;
  flex-shrink: 0;
}

/* Responsividade para a caixa de data */
@media (max-width: 768px) {
  .date-change-group {
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.75rem;
  }
  
  .date-change-group .form-control {
    width: 100%;
  }
  
  .date-change-group .action-btn {
    width: 100%;
    justify-content: center;
  }
}

/* Visual highlighting for booking schedules */
.booking-row {
  background-color: rgba(254, 226, 226, 0.5) !important; /* Light red background */
  border-left: 3px solid #ef4444; /* Red left border for emphasis */
}

.booking-row:hover {
  background-color: rgba(254, 226, 226, 0.7) !important;
}

/* Estilos para o indicador de busca ativa */
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

/* Content Area Override - Reduzir padding superior */
.content-area {
  padding-top: 0px !important;
}

/* Page Header Override */
.page-header {
  margin-bottom: 20px !important;
}

/* Top Bar Styles */
.top-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0.75rem 2rem;
  background: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  border-radius: 8px;
  position: relative;
  border: 1px solid #e9ecef;
}


/* Search Row inside Filters Container */
.search-row {
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e9ecef;
}

.search-input-group {
  display: flex;
  align-items: center;
  max-width: 500px;
  width: 100%;
}

.search-input-group .search-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px 0 0 4px;
  font-size: 0.9rem;
  background: white;
  transition: all 0.3s ease;
  outline: none;
}

.search-input-group .search-input:focus {
  border-color: #28a745;
  box-shadow: 0 0 0 2px rgba(40, 167, 69, 0.1);
}

.search-input-group .search-input:disabled {
  background-color: #f8f9fa;
  cursor: not-allowed;
}

.search-input-group .search-button {
  padding: 8px 16px;
  background: #28a745;
  color: white;
  border: 1px solid #28a745;
  border-left: none;
  border-radius: 0 4px 4px 0;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
}

.search-input-group .search-button:hover:not(:disabled) {
  background: #218838;
  border-color: #218838;
}

.search-input-group .search-button:disabled {
  background: #6c757d;
  border-color: #6c757d;
  cursor: not-allowed;
}

/* Preloading Indicator */
.preloading-indicator {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
  background: linear-gradient(135deg, #007bff, #0056b3);
  color: white;
  padding: 15px 20px;
  border-radius: 12px;
  box-shadow: 0 8px 25px rgba(0, 123, 255, 0.3);
  min-width: 250px;
  animation: slideInUp 0.3s ease-out;
}

.preload-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
}

.preload-icon {
  font-size: 1.5rem;
  animation: bounce 2s infinite;
}

.preload-text {
  font-weight: 500;
  font-size: 0.9rem;
  text-align: center;
}

.preload-progress {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #28a745, #20c997);
  transition: width 0.3s ease;
  border-radius: 3px;
}

.preload-percentage {
  font-size: 0.8rem;
  font-weight: 600;
}

@keyframes slideInUp {
  from {
    transform: translateY(100px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

/* User Profile */
.user-profile {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.user-profile:hover {
  transform: translateY(-1px);
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #007bff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  font-weight: 600;
  color: white;
  text-transform: uppercase;
}

.user-name {
  color: #495057;
  font-weight: 500;
  font-size: 0.9rem;
}

.dropdown-arrow {
  color: #6c757d;
  font-size: 0.8rem;
  transition: transform 0.3s ease;
}

.dropdown-arrow.rotate {
  transform: rotate(180deg);
}

/* User Dropdown */
.user-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  border: 1px solid #e9ecef;
  min-width: 150px;
  z-index: 1000;
  margin-top: 8px;
  overflow: hidden;
}

.dropdown-item {
  padding: 12px 16px;
  color: #495057;
  cursor: pointer;
  transition: background-color 0.2s ease;
  display: flex;
  align-items: center;
  gap: 10px;
}

.dropdown-item:hover {
  background-color: #f8f9fa;
}

.dropdown-item i {
  font-size: 0.9rem;
  color: #dc3545;
}

/* Responsive */
@media (max-width: 768px) {
  .top-bar {
    flex-direction: column;
    gap: 1rem;
    padding: 0.75rem 1rem;
  }
  
  
  .user-profile {
    align-self: flex-end;
  }

  /* Responsivo para busca */
  .search-row {
    justify-content: stretch;
  }

  .search-input-group {
    max-width: none;
  }

  .search-input-group .search-input,
  .search-input-group .search-button {
    border-radius: 4px;
  }

  .search-input-group .search-input {
    margin-bottom: 0.5rem;
    border-right: 1px solid #ddd;
  }

  .search-input-group .search-button {
    width: 100%;
    justify-content: center;
    border: 1px solid #28a745;
  }
}

/* Filtros Styles */
.filters-container {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 0.75rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.filters-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #495057;
  font-weight: 500;
  margin-right: 2rem;
  white-space: nowrap;
}

.filters-header i {
  color: #007bff;
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
