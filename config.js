// ===================================================
// CONFIGURAÇÃO DINÂMICA DA API - NÃO MINIFICAR
// ===================================================
// Este arquivo pode ser editado após o deploy sem recompilar
// Coloque este arquivo na mesma pasta do index.html no IIS

window.API_CONFIG = {
  // ===== CONFIGURAÇÃO AUTOMÁTICA =====
  // Detecta automaticamente o servidor baseado na URL atual
  getApiUrl: function() {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    
    // Desenvolvimento local
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      if (window.location.port === '8000') {
        // Rodando no servidor de desenvolvimento (frontend na porta 8000, backend na 4000)
        return 'http://localhost:4000/api';
      }
      // Rodando no IIS com proxy reverso
      return '/api';
    }
    
    // Produção - usa o mesmo hostname do frontend com proxy reverso
    return '/api';
  },
  
  // ===== CONFIGURAÇÃO MANUAL (OPCIONAL) =====
  // Descomente UMA das linhas abaixo e configure com seu servidor
  // Isso sobrescreve a detecção automática
  
  // Opção 1: IP fixo da rede local
  // API_URL: 'http://192.168.1.100:4000/api',
  
  // Opção 2: Nome do servidor na rede
  // API_URL: 'http://servidor-app:4000/api',
  
  // Opção 3: Domínio completo
  // API_URL: 'http://app.empresa.local:4000/api',
  
  // ===== CONFIGURAÇÕES ADICIONAIS =====
  TIMEOUT: 10000,        // Timeout das requisições (10 segundos)
  RETRY_ATTEMPTS: 3,     // Tentativas em caso de erro
  
  // ===== FLAGS DE DESENVOLVIMENTO =====
  ENABLE_DEBUG: false,   // Ativa logs detalhados no console
  ENABLE_MOCK: false,    // Usa dados mockados (desenvolvimento)
  
  // ===== IDENTIFICAÇÃO DO AMBIENTE =====
  ENVIRONMENT: 'production', // 'development', 'staging', 'production'
  VERSION: '1.0.0'
};

// ===== NÃO EDITE ABAIXO DESTA LINHA =====

// Determinar URL final da API
window.API_URL = window.API_CONFIG.API_URL || window.API_CONFIG.getApiUrl();

// Log da configuração (apenas em debug)
if (window.API_CONFIG.ENABLE_DEBUG) {
  console.log('========================================');
  console.log('Configuração da API carregada:');
  console.log('URL da API:', window.API_URL);
  console.log('Ambiente:', window.API_CONFIG.ENVIRONMENT);
  console.log('Versão:', window.API_CONFIG.VERSION);
  console.log('========================================');
}

// Função helper para fazer requisições
window.apiRequest = function(endpoint, options = {}) {
  const url = `${window.API_URL}${endpoint}`;
  
  // Adicionar timeout padrão
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), window.API_CONFIG.TIMEOUT);
  
  // Configurações padrão
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    signal: controller.signal,
    ...options
  };
  
  return fetch(url, defaultOptions)
    .finally(() => clearTimeout(timeoutId))
    .catch(error => {
      if (error.name === 'AbortError') {
        throw new Error('Requisição expirou (timeout)');
      }
      throw error;
    });
};
