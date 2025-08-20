// ===================================================
// CONFIGURAÇÃO PARA PRODUÇÃO - recebimento.mercocamptech.com.br
// ===================================================
// Use este arquivo no servidor de produção

window.API_CONFIG = {
  // URL fixa do backend em produção
  // AJUSTE CONFORME SEU SERVIDOR:
  
  // Opção 1: Backend no mesmo servidor (porta 4000)
  API_URL: 'http://recebimento.mercocamptech.com.br:4000/api',
  
  // Opção 2: Backend em servidor separado
  // API_URL: 'http://api.mercocamptech.com.br/api',
  
  // Opção 3: Backend em IP específico
  // API_URL: 'http://192.168.1.100:4000/api',
  
  // Configurações adicionais
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  ENVIRONMENT: 'production',
  ENABLE_DEBUG: false,
  VERSION: '1.0.0'
};

// Exportar URL final
window.API_URL = window.API_CONFIG.API_URL;
console.log('API configurada para produção:', window.API_URL);
