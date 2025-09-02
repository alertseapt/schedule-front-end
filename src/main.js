import { createApp } from 'vue'
import App from './App.vue'
import axios from 'axios'
import { BASE_URL } from './config/api.js'

// Importar estilos
import './assets/css/main.css'
import './assets/css/vue-components.css'

// Configurar axios defaults usando configuração centralizada
axios.defaults.baseURL = BASE_URL
console.log('=== CONFIGURAÇÃO DO AXIOS ===');
console.log('BASE_URL usada:', BASE_URL);
console.log('axios.defaults.baseURL configurado para:', axios.defaults.baseURL);

// Interceptor para logar todas as requisições do axios
axios.interceptors.request.use(
  config => {
    console.log('=== REQUISIÇÃO AXIOS ===');
    console.log('URL completa:', config.url);
    console.log('BaseURL:', config.baseURL);
    console.log('Método:', config.method);
    console.log('Headers:', config.headers);
    return config;
  },
  error => {
    console.error('Erro na requisição axios:', error);
    return Promise.reject(error);
  }
);

// Interceptor para logar todas as respostas do axios
axios.interceptors.response.use(
  response => {
    console.log('=== RESPOSTA AXIOS ===');
    console.log('Status:', response.status);
    console.log('URL:', response.config.url);
    return response;
  },
  error => {
    console.error('=== ERRO AXIOS ===');
    console.error('Erro na verificação de acesso:', error);
    console.error('URL que falhou:', error.config?.url);
    console.error('BaseURL usado:', error.config?.baseURL);
    return Promise.reject(error);
  }
);

// SISTEMA SIMPLES - APENAS VERIFICAÇÃO BÁSICA DE TOKEN
console.log('=== MAIN.JS INICIADO ===');
console.log('URL atual:', window.location.href);
console.log('Timestamp:', new Date().toISOString());

// Aguardar um pouco para garantir que localStorage está atualizado após login
setTimeout(() => {
  console.log('=== VERIFICANDO AUTENTICAÇÃO APÓS DELAY ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('URL atual durante verificação:', window.location.href);
  
  const token = localStorage.getItem('token');
  const userData = localStorage.getItem('user');

  console.log('=== ESTADO ATUAL DO LOCALSTORAGE ===');
  console.log('Token encontrado:', !!token);
  console.log('User data encontrado:', !!userData);
  
  // Log de todos os itens do localStorage para debug
  console.log('=== CONTEÚDO COMPLETO DO LOCALSTORAGE ===');
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = localStorage.getItem(key);
    console.log(`${key}: ${value ? (key.includes('token') ? 'TOKEN_' + value.slice(-20) : value) : 'null'}`);
  }

  if (token) {
      console.log('Token (primeiros 20 chars):', token.substring(0, 20) + '...');
  }
  if (userData) {
      console.log('User data raw:', userData);
      try {
          const user = JSON.parse(userData);
          console.log('User parsed successfully:', user);
          console.log('User level_access:', user.level_access);
      } catch (e) {
          console.error('Erro ao parsear user data:', e);
      }
  }

  // VERIFICAÇÃO SIMPLES - SEM CHAMADAS DE API
  if (!token || !userData) {
    console.log('=== SEM TOKEN/USER - VERIFICANDO SE JÁ ESTÁ NA PÁGINA DE LOGIN ===');
    const currentPath = window.location.pathname;
    console.log('Página atual:', currentPath);
    
    // Se já estiver na página de login, não redirecionar
    if (currentPath === '/login.html' || currentPath.includes('login.html')) {
      console.log('Já está na página de login - não redirecionando');
      return;
    }
    
    console.log('=== REDIRECIONANDO PARA LOGIN ===');
    const loginUrl = '/login.html';
    console.log('Redirecionando para:', loginUrl);
    window.location.href = loginUrl;
  } else {
    console.log('=== TOKEN ENCONTRADO - CARREGANDO APP ===');
    
    try {
      const user = JSON.parse(userData);
      console.log('User data:', user);
      console.log('Level access:', user.level_access);
      
      // VERIFICAR SE USUÁRIO ESTÁ NA PÁGINA CORRETA
      const currentPath = window.location.pathname;
      console.log('Página atual:', currentPath);
      
      if (user.level_access === 9) {
        // Usuário nível 9 deve estar na página de verificação
        if (currentPath === '/' || currentPath.includes('index.html')) {
          console.log('Usuário nível 9 na página errada - redirecionando');
          const verificationUrl = '/schedule-verification.html';
          window.location.href = verificationUrl;
        } else {
          console.log('Usuário nível 9 na página correta');
        }
      } else {
        // Usuário normal deve estar no dashboard
        if (currentPath.includes('schedule-verification.html')) {
          console.log('Usuário normal na página de verificação - redirecionando para dashboard');
          const dashboardUrl = '/';
          window.location.href = dashboardUrl;
        } else {
          console.log('Usuário normal - carregando dashboard');
          // Carregar aplicação Vue
          const app = createApp(App);
          app.config.globalProperties.$http = axios;
          app.mount('#app');
        }
      }
    } catch (error) {
      console.error('Erro ao processar dados do usuário:', error);
      const loginUrl = '/login.html';
      window.location.href = loginUrl;
    }
  }
}, 500); // Delay de 500ms para aguardar o localStorage ser atualizado
