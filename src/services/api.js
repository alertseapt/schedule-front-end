// ===================================================
// SERVIÇO DE API - COMUNICAÇÃO COM O BACKEND
// ===================================================

// Obter URL da API do arquivo de configuração global
const getApiUrl = () => {
  // Verifica se a configuração global existe
  if (window.API_URL) {
    console.log('Usando configuração global da API:', window.API_URL);
    return window.API_URL;
  }
  
  // Fallback para proxy reverso se config.js não estiver carregado
  console.warn('config.js não encontrado, usando proxy reverso /api');
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

  // Método genérico para fazer requisições
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    // ATUALIZAR TOKEN SEMPRE antes de fazer requisição (pode ter mudado)
    this.token = localStorage.getItem('token');
    
    console.log('=== API SERVICE REQUEST ===');
    console.log('Endpoint:', endpoint);
    console.log('URL completa:', url);
    console.log('Token disponível:', !!this.token);
    
    // Configurar headers padrão
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    // Adicionar token se existir
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
      console.log('Token adicionado aos headers');
    } else {
      console.log('Nenhum token encontrado - requisição sem autenticação');
    }

    // Configurar timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos

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

        // Tratar erros específicos - SEM REDIRECIONAMENTO AUTOMÁTICO
        if (response.status === 401) {
          console.log('=== API SERVICE: ERRO 401 ===');
          console.log('Endpoint que causou 401:', endpoint);
          console.log('Token usado:', this.token ? 'presente' : 'ausente');
          console.log('APENAS LOGANDO - SEM REDIRECIONAMENTO AUTOMÁTICO');
          
          // Apenas lançar erro - deixar que quem chama decida o que fazer
          throw new Error('Token inválido ou expirado (401)');
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
    try {
      await this.post('/auth/logout');
    } finally {
      this.setAuthToken(null);
      const loginUrl = `http://${window.location.host}/login.html`;
      console.log('Logout API - URL de login (HTTP forçado):', loginUrl);
      window.location.href = loginUrl;
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
