// Configuração global da API
// IMPORTANTE: Para alterar o endpoint, modifique o arquivo src/config/api.js
// Esta configuração será sincronizada automaticamente

// Função para obter configuração centralizada
const getApiConfig = () => {
  // Valor padrão para compatibilidade com arquivos que não usam módulos ES6
  const DEFAULT_BASE_URL = 'https://schedule-mercocamp-back-end.onrender.com/api'
  
  // Tentar obter da configuração centralizada se disponível
  try {
    if (window.API_CENTRALIZED_CONFIG) {
      return window.API_CENTRALIZED_CONFIG
    }
  } catch (e) {
    console.warn('Configuração centralizada não disponível, usando padrão')
  }
  
  return {
    BASE_URL: DEFAULT_BASE_URL
  }
}

window.API_CONFIG = getApiConfig()