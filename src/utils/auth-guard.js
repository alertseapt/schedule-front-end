import { BASE_URL } from '../config/api.js'

/**
 * ========================================
 * SISTEMA DE PROTEÇÃO DE AUTENTICAÇÃO
 * ========================================
 *
 * Este arquivo implementa um sistema completo de proteção
 * de rotas e autenticação para o dashboard do sistema.
 *
 * Funcionalidades principais:
 * - Verificação automática de tokens JWT
 * - Proteção de rotas baseada em permissões
 * - Gerenciamento de sessão do usuário
 * - Refresh automático de tokens
 * - Sistema de permissões por nível de acesso
 * - Interface de logout e informações do usuário
 *
 * @author Sistema de Agendamento
 * @version 1.0.0
 */

/**
 * ========================================
 * GUARDIÃO DE AUTENTICAÇÃO
 * ========================================
 *
 * Classe principal responsável por proteger o dashboard
 * e gerenciar toda a autenticação do sistema.
 */
class AuthGuard {
  /**
   * Construtor da classe
   * Inicializa URL da API e chama inicialização
   */
  constructor() {
    // URL base da API de autenticação
    this.apiBaseUrl = BASE_URL
    // Inicializa o sistema de proteção
    this.init()
  }

  /**
   * Inicializa o sistema de proteção
   * Executa verificação de autenticação
   */
  init() {
    // Executa verificação quando a página carrega
    this.checkAuthentication()
  }

  /**
   * Verifica se o usuário está autenticado
   * Valida token JWT e redireciona se necessário
   */
  async checkAuthentication() {
    // Recupera token do localStorage
    const token = localStorage.getItem('token')

    // Se não há token, redireciona para login
    if (!token) {
      this.redirectToLogin()
      return
    }

    try {
      // ========================================
      // VERIFICAÇÃO DO TOKEN NA API
      // ========================================
      const response = await fetch(`${this.apiBaseUrl}/auth/verify`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        // Token válido, usuário pode acessar o dashboard
        this.initializeDashboard()
      } else {
        // Token inválido
        this.handleInvalidToken()
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error)
      this.handleInvalidToken()
    }
  }

  /**
   * Trata token inválido
   * Remove dados de sessão e redireciona para login
   */
  handleInvalidToken() {
    console.warn('🔐 [AUTH-GUARD] Token inválido detectado - limpando dados de autenticação');
    
    // Limpar completamente os dados de autenticação
    this.clearAuthData();

    // Redireciona para página de login
    this.redirectToLogin()
  }

  /**
   * Limpa completamente os dados de autenticação
   * Remove todos os dados relacionados ao usuário
   */
  clearAuthData() {
    console.log('🧹 [AUTH-GUARD] Limpando dados de autenticação...');
    
    // Remover dados do localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userPermissions');
    localStorage.removeItem('userLevel');
    localStorage.removeItem('rememberedUser');
    
    // Limpar dados de sessão se existirem
    sessionStorage.clear();
    
    console.log('✅ [AUTH-GUARD] Dados de autenticação limpos');
  }

  /**
   * Redireciona para página de login
   * Salva página atual para redirecionamento após login
   */
  redirectToLogin() {
    // Salva a página atual para redirecionamento após login
    sessionStorage.setItem('redirectAfterLogin', window.location.href)

    // Redireciona para página de login
    const loginUrl = '/login.html'; window.location.href = loginUrl
  }

  /**
   * Inicializa o dashboard após autenticação bem-sucedida
   * Configura interface e funcionalidades do usuário
   */
  initializeDashboard() {
    // Carrega informações do usuário na interface
    this.loadUserInfo()

    // Configura funcionalidade de logout
    this.setupLogout()

    // Configura atualização automática de token
    this.setupTokenRefresh()
  }

  /**
   * Carrega informações do usuário do localStorage
   * E exibe na interface do dashboard
   */
  loadUserInfo() {
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        const user = JSON.parse(userData)
        this.displayUserInfo(user)
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error)
      }
    }
  }

  /**
   * Exibe informações do usuário na interface
   * Atualiza nome e cargo do usuário
   *
   * @param {object} user - Dados do usuário
   */
  displayUserInfo(user) {
    // Atualiza informações do usuário na interface
    const userNameElements = document.querySelectorAll('.user-name')
    const userRoleElements = document.querySelectorAll('.user-role')

    // Atualiza nome do usuário
    userNameElements.forEach(element => {
      element.textContent = user.name || user.user
    })

    // Atualiza cargo/função do usuário
    userRoleElements.forEach(element => {
      element.textContent = this.getUserRole(user.level_access)
    })
  }

  /**
   * Converte nível de acesso em cargo/função
   *
   * @param {number} levelAccess - Nível de acesso do usuário
   * @returns {string} - Cargo/função do usuário
   */
  getUserRole(levelAccess) {
    switch (levelAccess) {
      case 0:
        return 'Desenvolvedor' // Acesso total
      case 1:
        return 'Usuário' // Acesso básico
      case 2:
        return 'Administrador' // Acesso administrativo
      case 3:
        return 'Gerente' // Acesso gerencial
      default:
        return 'Usuário'
    }
  }

  /**
   * Verifica se usuário tem nível de acesso necessário
   *
   * @param {number} requiredLevel - Nível mínimo necessário
   * @returns {boolean} - True se tem acesso, false caso contrário
   */
  checkUserPermission(requiredLevel) {
    const userData = localStorage.getItem('user')
    if (!userData) {
      return false
    }

    try {
      const user = JSON.parse(userData)
      const userLevel = user.level_access

      // Nível 0 (Desenvolvedor) tem acesso a tudo
      if (userLevel === 0) {
        return true
      }

      // Para outros níveis, verifica se tem o nível necessário ou superior
      return userLevel <= requiredLevel
    } catch (error) {
      console.error('Erro ao verificar permissões:', error)
      return false
    }
  }

  /**
   * Verifica se usuário tem permissão específica
   *
   * @param {string} permission - Permissão a ser verificada
   * @returns {boolean} - True se tem permissão, false caso contrário
   */
  hasPermission(permission) {
    const userData = localStorage.getItem('user')
    if (!userData) {
      return false
    }

    try {
      const user = JSON.parse(userData)
      const userLevel = user.level_access

      // Nível 0 (Desenvolvedor) tem todas as permissões
      if (userLevel === 0) {
        return true
      }

      // ========================================
      // DEFINIÇÃO DE PERMISSÕES POR NÍVEL
      // ========================================
      const permissions = {
        // Nível 1 - Usuário (acesso básico - apenas visualização)
        1: ['view_schedules'],

        // Nível 2 - Administrador (acesso administrativo)
        2: [
          'view_schedules',
          'create_schedule',
          'edit_schedule',
          'delete_schedule',
          'manage_users',
        ],

        // Nível 3 - Gerente (acesso gerencial)
        3: [
          'view_schedules',
          'create_schedule',
          'edit_schedule',
          'manage_products',
          'view_reports',
        ],
      }

      return (
        permissions[userLevel] && permissions[userLevel].includes(permission)
      )
    } catch (error) {
      console.error('Erro ao verificar permissões:', error)
      return false
    }
  }

  /**
   * Configura funcionalidade de logout
   * Cria botão de logout e adiciona eventos
   */
  setupLogout() {
    // Adiciona botão de logout se não existir
    this.createLogoutButton()

    // Configura evento de logout
    document.addEventListener('click', e => {
      if (
        e.target.classList.contains('logout-btn') ||
        e.target.closest('.logout-btn')
      ) {
        this.handleLogout()
      }
    })
  }

  /**
   * Cria botão de logout na interface
   * Adiciona informações do usuário na sidebar
   */
  createLogoutButton() {
    // Verifica se já existe um botão de logout
    if (document.querySelector('.logout-btn')) {
      return
    }

    // Cria informações do usuário na sidebar
    const sidebar = document.querySelector('.sidebar')
    if (sidebar) {
      const userInfo = document.createElement('div')
      userInfo.className = 'user-info'
      userInfo.innerHTML = `
                <div class="user-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="user-details">
                    <div class="user-name">Carregando...</div>
                    <div class="user-role">Usuário</div>
                </div>
                <button class="logout-btn" title="Sair">
                    <i class="fas fa-sign-out-alt"></i>
                </button>
            `

      // Adiciona ao sidebar
      sidebar.appendChild(userInfo)
    }
  }

  /**
   * Manipula o processo de logout
   * Limpa dados de sessão e redireciona
   */
  async handleLogout() {
    const confirmed = confirm('Tem certeza que deseja sair?')
    if (!confirmed) {
      return
    }

    try {
      // ========================================
      // LOGOUT NA API (OPCIONAL)
      // ========================================
      const token = localStorage.getItem('token')
      if (token) {
        await fetch(`${this.apiBaseUrl}/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }).catch(error => {
          console.error('Erro ao fazer logout na API:', error)
        })
      }
    } catch (error) {
      console.error('Erro durante logout:', error)
    } finally {
      // ========================================
      // LIMPEZA DOS DADOS DE SESSÃO
      // ========================================
      console.log('👋 [AUTH-GUARD] Fazendo logout - limpando dados...');
      this.clearAuthData();

      // Redireciona para login
      console.log('🔄 [AUTH-GUARD] Redirecionando para login...');
      const loginUrl = '/login.html'; window.location.href = loginUrl
    }
  }

  /**
   * Configura refresh automático de token
   * Renova token antes de expirar
   */
  setupTokenRefresh() {
    // Renova token a cada 15 minutos
    setInterval(
      () => {
        this.refreshToken()
      },
      15 * 60 * 1000
    )
  }

  /**
   * Renova o token JWT
   * Mantém sessão ativa automaticamente
   */
  async refreshToken() {
    const token = localStorage.getItem('token')
    if (!token) {
      return
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        // Atualiza token no localStorage
        localStorage.setItem('token', data.token)
      } else {
        // Token não pode ser renovado, faz logout
        this.handleInvalidToken()
      }
    } catch (error) {
      console.error('Erro ao renovar token:', error)
      // Em caso de erro, faz logout
      this.handleInvalidToken()
    }
  }
}

/**
 * ========================================
 * CLIENTE API AUTENTICADO
 * ========================================
 *
 * Classe para fazer requisições autenticadas
 * Gerencia tokens automaticamente
 */
class AuthenticatedApiClient {
  /**
   * Construtor da classe
   * Inicializa URL base da API
   */
  constructor() {
    this.baseURL = BASE_URL
  }

  /**
   * Método genérico para requisições autenticadas
   * Adiciona token automaticamente e trata erros
   *
   * @param {string} endpoint - Endpoint da API
   * @param {object} options - Opções da requisição
   * @returns {Promise<object>} - Resposta da API
   */
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('token')

    // Configuração da requisição
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    // Adiciona token de autorização
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }

    // Faz a requisição
    const response = await fetch(`${this.baseURL}${endpoint}`, config)

    // Trata erro 401 (não autorizado)
    if (response.status === 401) {
      console.warn('🔐 [AUTH-CLIENT] Token inválido detectado - limpando autenticação');
      
      // Limpar completamente os dados de autenticação
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userPermissions');
      localStorage.removeItem('userLevel');
      localStorage.removeItem('rememberedUser');
      sessionStorage.clear();
      
      console.log('🔄 [AUTH-CLIENT] Redirecionando para login...');
      const loginUrl = '/login.html'; window.location.href = loginUrl
      return
    }

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Erro na requisição')
    }

    return data
  }

  /**
   * Obtém lista de usuários
   *
   * @param {object} params - Parâmetros de filtro
   * @returns {Promise<Array>} - Lista de usuários
   */
  async getUsers(params = {}) {
    return this.request('/users', { params })
  }

  /**
   * Obtém lista de produtos
   *
   * @param {object} params - Parâmetros de filtro
   * @returns {Promise<Array>} - Lista de produtos
   */
  async getProducts(params = {}) {
    return this.request('/products', { params })
  }

  /**
   * Obtém lista de agendamentos
   *
   * @param {object} params - Parâmetros de filtro
   * @returns {Promise<Array>} - Lista de agendamentos
   */
  async getSchedules(params = {}) {
    return this.request('/schedules', { params })
  }

  /**
   * Cria novo agendamento
   *
   * @param {object} scheduleData - Dados do agendamento
   * @returns {Promise<object>} - Agendamento criado
   */
  async createSchedule(scheduleData) {
    return this.request('/schedules', {
      method: 'POST',
      data: scheduleData,
    })
  }

  /**
   * Atualiza status de agendamento
   *
   * @param {number} scheduleId - ID do agendamento
   * @param {string} status - Novo status
   * @param {string} comment - Comentário sobre a mudança
   * @returns {Promise<object>} - Agendamento atualizado
   */
  async updateScheduleStatus(scheduleId, status, comment) {
    return this.request(`/schedules/${scheduleId}/status`, {
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

  /**
   * Obtém dados do usuário atual
   *
   * @returns {object|null} - Dados do usuário ou null
   */
  getCurrentUser() {
    const userData = localStorage.getItem('user')
    return userData ? JSON.parse(userData) : null
  }
}

/**
 * ========================================
 * FUNÇÕES UTILITÁRIAS
 * ========================================
 */

/**
 * Formata data para exibição
 *
 * @param {string} dateString - Data em formato string
 * @returns {string} - Data formatada
 */
function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('pt-BR')
}

/**
 * Formata data e hora para exibição
 *
 * @param {string} dateString - Data em formato string
 * @returns {string} - Data e hora formatadas
 */
function formatDateTime(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('pt-BR')
}

/**
 * Exibe notificação na interface
 *
 * @param {string} message - Mensagem da notificação
 * @param {string} type - Tipo da notificação (info, success, warning, error)
 */
function showNotification(message, type = 'info') {
  // Implementar sistema de notificações
  console.log(`${type.toUpperCase()}: ${message}`)
}

/**
 * ========================================
 * FUNÇÕES DE PERMISSÃO GLOBAIS
 * ========================================
 *
 * Funções disponíveis globalmente para verificação
 * de permissões em qualquer parte da aplicação
 */

/**
 * Verifica se usuário tem permissão específica
 *
 * @param {string} permission - Permissão a ser verificada
 * @returns {boolean} - True se tem permissão, false caso contrário
 */
function checkPermission(permission) {
  const userData = localStorage.getItem('user')
  if (!userData) {
    return false
  }

  try {
    const user = JSON.parse(userData)
    const userLevel = user.level_access

    // Nível 0 (Desenvolvedor) tem todas as permissões
    if (userLevel === 0) {
      return true
    }

    // ========================================
    // MAPEAMENTO DE PERMISSÕES POR NÍVEL
    // ========================================
    const permissions = {
      // Nível 1 - Usuário (acesso básico)
      1: [
        'view_schedules', // Visualizar agendamentos
        'create_schedule', // Criar agendamentos
      ],

      // Nível 2 - Administrador (acesso administrativo)
      2: [
        'view_schedules', // Visualizar agendamentos
        'create_schedule', // Criar agendamentos
        'edit_schedule', // Editar agendamentos
        'delete_schedule', // Excluir agendamentos
        'manage_users', // Gerenciar usuários
      ],

      // Nível 3 - Gerente (acesso gerencial)
      3: [
        'view_schedules', // Visualizar agendamentos
        'create_schedule', // Criar agendamentos
        'edit_schedule', // Editar agendamentos
        'manage_products', // Gerenciar produtos
        'view_reports', // Visualizar relatórios
      ],
    }

    return permissions[userLevel] && permissions[userLevel].includes(permission)
  } catch (error) {
    console.error('Erro ao verificar permissões:', error)
    return false
  }
}

/**
 * Verifica se usuário tem nível de acesso necessário
 *
 * @param {number} requiredLevel - Nível mínimo necessário
 * @returns {boolean} - True se tem acesso, false caso contrário
 */
function checkUserLevel(requiredLevel) {
  const userData = localStorage.getItem('user')
  if (!userData) {
    return false
  }

  try {
    const user = JSON.parse(userData)
    const userLevel = user.level_access

    // Nível 0 (Desenvolvedor) tem acesso a tudo
    if (userLevel === 0) {
      return true
    }

    // Para outros níveis, verifica se tem o nível necessário ou superior
    return userLevel <= requiredLevel
  } catch (error) {
    console.error('Erro ao verificar nível de acesso:', error)
    return false
  }
}

/**
 * ========================================
 * INICIALIZAÇÃO DESABILITADA
 * ========================================
 *
 * DESABILITADO para evitar conflito com main.js
 * O main.js já controla a autenticação
 */
// document.addEventListener('DOMContentLoaded', () => {
//   new AuthGuard()
// })

/**
 * ========================================
 * EXPORTAÇÃO GLOBAL
 * ========================================
 *
 * Disponibiliza classes e funções globalmente
 * para uso em outros arquivos
 */
window.AuthGuard = AuthGuard
window.AuthenticatedApiClient = AuthenticatedApiClient
window.checkPermission = checkPermission
window.checkUserLevel = checkUserLevel
window.formatDate = formatDate
window.formatDateTime = formatDateTime
window.showNotification = showNotification
