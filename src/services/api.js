// ===================================================
// SERVIÇO DE API - COMUNICAÇÃO COM O BACKEND
// ===================================================

// Obter URL da API do arquivo de configuração global
const getApiUrl = () => {
  // Verifica se a configuração global existe
  if (window.API_URL) {
    return window.API_URL;
  }
  
  // Fallback para proxy reverso se config.js não estiver carregado
  return '/api';
};

// Classe principal do serviço de API
class ApiService {
  constructor() {
    this.baseURL = getApiUrl();
    this.token = localStorage.getItem('token');
  }

  // Atualizar URL da API (útil para testes)
  updateApiUrl(newUrl) {
    this.baseURL = newUrl;
  }

  // Configurar token de autenticação
  setAuthToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  // Limpar completamente a autenticação
  clearAuth() {
    console.log('🧹 Limpando dados de autenticação...');
    
    // Limpar token
    this.setAuthToken(null);
    
    // Limpar outros dados relacionados ao usuário (se existirem)
    localStorage.removeItem('user');
    localStorage.removeItem('userPermissions');
    localStorage.removeItem('userLevel');
    
    // Limpar dados de sessão se existirem
    sessionStorage.clear();
    
    console.log('✅ Dados de autenticação limpos');
  }

  // Verificar se o usuário está autenticado
  isAuthenticated() {
    return !!this.token && !!localStorage.getItem('token');
  }

  // Método genérico para fazer requisições
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    // Atualizar token antes de fazer requisição
    this.token = localStorage.getItem('token');
    
    // Configurar headers padrão
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    // Adicionar token se existir
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    // Configurar timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 segundos

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Verificar se a resposta foi bem sucedida
      if (!response.ok) {
        // Tentar extrair mensagem de erro do corpo da resposta
        let errorMessage = `Erro ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          // Ignorar erro ao parsear JSON
        }

        // Tratar erro 401 (Não autorizado)
        if (response.status === 401) {
          console.warn('🔐 Token inválido ou expirado detectado');
          
          // Limpar completamente os dados de autenticação
          this.clearAuth();
          
          // Redirecionar para login apenas se não estivermos já na página de login
          if (!window.location.pathname.includes('/login.html') && !window.location.pathname.includes('/login')) {
            console.log('🔄 Redirecionando para página de login...');
            
            // Adicionar delay mínimo para garantir que os dados foram limpos
            setTimeout(() => {
              window.location.href = '/login.html';
            }, 100);
            
            return; // Evitar que o erro seja propagado após redirecionamento
          }
          
          throw new Error('Token inválido ou expirado');
        }

        throw new Error(errorMessage);
      }

      // Retornar resposta parseada
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return await response.text();

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Requisição expirou (timeout)');
      }
      
      throw error;
    }
  }

  // Métodos HTTP convenientes
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url, { method: 'GET' });
  }

  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async patch(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // Métodos específicos da aplicação
  
  // Autenticação
  async login(user, password) {
    const response = await this.post('/auth/login', { user, password });
    if (response.token) {
      this.setAuthToken(response.token);
    }
    return response;
  }

  async logout() {
    console.log('👋 Fazendo logout...');
    
    try {
      // Tentar notificar o backend sobre o logout
      await this.post('/auth/logout');
    } catch (error) {
      console.warn('⚠️ Erro ao notificar backend sobre logout:', error.message);
      // Continuar com logout local mesmo se o backend falhar
    } finally {
      // Sempre limpar dados locais
      this.clearAuth();
      
      console.log('🔄 Redirecionando para login...');
      window.location.href = '/login.html';
    }
  }

  async verifyToken() {
    return this.get('/auth/verify');
  }

  // Usuários
  async getUsers() {
    return this.get('/users');
  }

  async getUser(id) {
    return this.get(`/users/${id}`);
  }

  async createUser(userData) {
    return this.post('/users', userData);
  }

  async updateUser(id, userData) {
    return this.put(`/users/${id}`, userData);
  }

  async deleteUser(id) {
    return this.delete(`/users/${id}`);
  }

  // Agendamentos
  async getSchedules(params) {
    return this.get('/schedules', params);
  }

  async getSchedule(id) {
    return this.get(`/schedules/${id}`);
  }

  async createSchedule(scheduleData) {
    return this.post('/schedules', scheduleData);
  }

  async updateSchedule(id, scheduleData) {
    return this.put(`/schedules/${id}`, scheduleData);
  }

  async deleteSchedule(id) {
    return this.delete(`/schedules/${id}`);
  }

  // Produtos
  async getProducts(params) {
    return this.get('/products', params);
  }

  async getProduct(id) {
    return this.get(`/products/${id}`);
  }

  async createProduct(productData) {
    return this.post('/products', productData);
  }

  async updateProduct(id, productData) {
    return this.put(`/products/${id}`, productData);
  }

  // Clientes
  async getClients(params) {
    return this.get('/clients', params);
  }

  async getClient(cnpj) {
    return this.get(`/clients/${cnpj}`);
  }

  // Health Check
  async healthCheck() {
    return this.get('/health');
  }

  // Teste de conectividade
  async testConnectivity() {
    return this.get('/test-connectivity');
  }
}

// Criar instância singleton
const apiService = new ApiService();

// Exportar instância e classe
export default apiService;
export { ApiService };

// Também disponibilizar globalmente para debug
if (typeof window !== 'undefined') {
  window.apiService = apiService;
}


