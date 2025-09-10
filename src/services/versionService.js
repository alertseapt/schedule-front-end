// ===================================================
// SERVIÇO DE VERSIONAMENTO - DETECÇÃO DE ATUALIZAÇÕES
// ===================================================

import apiService from './api.js';

class VersionService {
  constructor() {
    // Valores padrão iniciais
    this.buildInfo = {
      version: '0.5.0',
      buildHash: 'loading',
      timestamp: new Date().toISOString(),
      environment: 'development'
    };
    this.currentVersion = this.buildInfo.version;
    this.currentBuildHash = this.buildInfo.buildHash;
    this.lastCheckedVersion = this.getStoredVersion();
    this.lastCheckedBuildHash = this.getStoredBuildHash();
    this.checkInterval = null;
    this.isCheckingVersion = false;
    this.buildInfoLoaded = false;
    
    // Carregar informações de build assincronamente
    this.initializeBuildInfo();
  }

  // Inicializar informações de build
  async initializeBuildInfo() {
    try {
      this.buildInfo = await this.loadBuildInfo();
      this.currentVersion = this.buildInfo.version;
      this.currentBuildHash = this.buildInfo.buildHash;
      this.buildInfoLoaded = true;
      
      console.log(`📋 Build info carregado: ${this.currentVersion} (${this.currentBuildHash})`);
    } catch (error) {
      console.error('❌ Erro ao carregar build info:', error);
      this.buildInfoLoaded = true; // Marcar como carregado mesmo com erro
    }
  }

  // Carregar informações de build
  async loadBuildInfo() {
    try {
      // Tentar buscar build-info.json dinamicamente
      const response = await fetch('/src/build-info.json');
      if (response.ok) {
        const buildInfo = await response.json();
        return buildInfo;
      } else {
        throw new Error('Arquivo não encontrado');
      }
    } catch (error) {
      console.warn('⚠️ build-info.json não encontrado, usando valores padrão');
      return {
        version: '0.5.0',
        buildHash: 'dev-' + Date.now().toString().substring(-6),
        timestamp: new Date().toISOString(),
        environment: 'development'
      };
    }
  }

  // Obter versão armazenada localmente
  getStoredVersion() {
    return localStorage.getItem('app_version') || null;
  }

  // Obter build hash armazenado localmente  
  getStoredBuildHash() {
    return localStorage.getItem('app_build_hash') || null;
  }

  // Armazenar versão localmente
  storeVersion(version) {
    localStorage.setItem('app_version', version);
    this.lastCheckedVersion = version;
  }

  // Armazenar build hash localmente
  storeBuildHash(buildHash) {
    localStorage.setItem('app_build_hash', buildHash);
    this.lastCheckedBuildHash = buildHash;
  }

  // Armazenar informações completas de versão
  storeVersionInfo(version, buildHash) {
    this.storeVersion(version);
    this.storeBuildHash(buildHash);
  }

  // Limpar cache do navegador
  clearBrowserCache() {
    console.log('🧹 Limpando cache do navegador...');
    
    try {
      // Limpar localStorage (exceto token de autenticação)
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      localStorage.clear();
      
      // Restaurar dados essenciais de autenticação
      if (token) localStorage.setItem('token', token);
      if (user) localStorage.setItem('user', user);
      
      // Remover dados de versionamento específicos para forçar nova verificação
      localStorage.removeItem('app_version');
      localStorage.removeItem('app_build_hash');
      
      // Limpar sessionStorage
      sessionStorage.clear();
      
      // Limpar cache do Service Worker se existir
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          registrations.forEach(registration => {
            registration.update();
          });
        });
      }
      
      // Forçar limpeza do cache do navegador via Cache API
      if ('caches' in window) {
        caches.keys().then(cacheNames => {
          cacheNames.forEach(cacheName => {
            caches.delete(cacheName);
          });
        });
      }
      
      console.log('✅ Cache limpo com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao limpar cache:', error);
      return false;
    }
  }

  // Verificar versão no servidor
  async checkServerVersion() {
    if (this.isCheckingVersion) return;
    
    this.isCheckingVersion = true;
    
    try {
      // Aguardar build info ser carregado se ainda não foi
      if (!this.buildInfoLoaded) {
        console.log('⏳ Aguardando build info ser carregado...');
        let attempts = 0;
        while (!this.buildInfoLoaded && attempts < 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
      }
      
      console.log('🔍 Verificando versão no servidor...');
      const response = await apiService.getVersion();
      const serverVersion = response.version;
      const serverBuildHash = response.buildHash;
      
      console.log(`📋 Versão local: ${this.currentVersion} (${this.currentBuildHash})`);
      console.log(`🌐 Versão servidor: ${serverVersion} (${serverBuildHash})`);
      
      // Verificar se as versões são diferentes
      if (this.hasVersionChanged(serverVersion, serverBuildHash)) {
        console.log('🚀 Nova versão detectada!');
        await this.handleVersionUpdate(serverVersion, serverBuildHash);
        return true;
      }
      
      // Sincronizar dados armazenados se necessário (sem forçar atualização)
      if (!this.lastCheckedVersion || !this.lastCheckedBuildHash) {
        console.log('📝 Sincronizando dados de versão pela primeira vez');
        this.storeVersionInfo(serverVersion, serverBuildHash);
      } else if (serverVersion === this.currentVersion && serverBuildHash !== this.lastCheckedBuildHash) {
        // Atualizar hash armazenado se versão é igual mas hash mudou (normal em dev)
        console.log('🔄 Atualizando hash armazenado para versão atual');
        this.storeBuildHash(serverBuildHash);
      }
      
      return false;
    } catch (error) {
      console.error('❌ Erro ao verificar versão do servidor:', error);
      return false;
    } finally {
      this.isCheckingVersion = false;
    }
  }

  // Verificar se a versão mudou
  hasVersionChanged(serverVersion, serverBuildHash) {
    // Se versões são iguais, não há mudança
    if (serverVersion === this.currentVersion && serverBuildHash === this.currentBuildHash) {
      return false;
    }
    
    // Se não há dados armazenados previamente, armazenar os atuais e não forçar atualização
    if (!this.lastCheckedVersion || !this.lastCheckedBuildHash) {
      console.log('📝 Primeira verificação de versão - armazenando dados atuais');
      this.storeVersionInfo(serverVersion, serverBuildHash);
      return false;
    }
    
    // Apenas considerar mudança se versão do servidor for MAIOR que a local
    // ou se build hash for realmente diferente E versão for igual ou superior
    const shouldUpdate = (
      this.isNewerVersion(serverVersion, this.currentVersion) ||
      (serverVersion === this.currentVersion && serverBuildHash !== this.currentBuildHash && serverBuildHash !== this.lastCheckedBuildHash)
    );
    
    if (shouldUpdate) {
      console.log(`🔄 Atualização necessária: ${this.currentVersion}(${this.currentBuildHash}) → ${serverVersion}(${serverBuildHash})`);
      return true;
    }
    
    return false;
  }

  // Verificar se uma versão é mais nova que outra
  isNewerVersion(newVersion, currentVersion) {
    const parseVersion = (version) => {
      return version.split('.').map(num => parseInt(num, 10));
    };
    
    try {
      const newParts = parseVersion(newVersion);
      const currentParts = parseVersion(currentVersion);
      
      for (let i = 0; i < Math.max(newParts.length, currentParts.length); i++) {
        const newPart = newParts[i] || 0;
        const currentPart = currentParts[i] || 0;
        
        if (newPart > currentPart) return true;
        if (newPart < currentPart) return false;
      }
      
      return false; // versões são iguais
    } catch (error) {
      console.error('Erro ao comparar versões:', error);
      return false;
    }
  }

  // Lidar com atualização de versão
  async handleVersionUpdate(newVersion, newBuildHash) {
    console.log(`🔄 Processando atualização da versão ${this.currentVersion} (${this.currentBuildHash}) para ${newVersion} (${newBuildHash})`);
    
    // Mostrar notificação para o usuário
    this.showUpdateNotification(newVersion, newBuildHash);
    
    // Aguardar um pouco antes de recarregar
    setTimeout(() => {
      this.performUpdate(newVersion, newBuildHash);
    }, 2000);
  }

  // Mostrar notificação de atualização
  showUpdateNotification(newVersion, newBuildHash) {
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.id = 'version-update-notification';
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        max-width: 350px;
        font-family: Arial, sans-serif;
        font-size: 14px;
        line-height: 1.4;
      ">
        <div style="font-weight: bold; margin-bottom: 8px;">
          🚀 Nova versão disponível!
        </div>
        <div style="margin-bottom: 8px;">
          Versão ${newVersion} detectada. Atualizando automaticamente...
        </div>
        <div style="font-size: 12px; opacity: 0.9;">
          A página será recarregada em instantes.
        </div>
      </div>
    `;
    
    // Remover notificação anterior se existir
    const existing = document.getElementById('version-update-notification');
    if (existing) {
      existing.remove();
    }
    
    // Adicionar notificação ao DOM
    document.body.appendChild(notification);
    
    console.log(`📢 Notificação de atualização exibida para versão ${newVersion}`);
  }

  // Executar atualização
  performUpdate(newVersion, newBuildHash) {
    console.log(`⚡ Executando atualização para versão ${newVersion} (${newBuildHash})`);
    
    // Limpar cache
    this.clearBrowserCache();
    
    // Armazenar nova versão e build hash
    this.storeVersionInfo(newVersion, newBuildHash);
    
    // Adicionar timestamp para forçar reload dos assets
    const timestamp = Date.now();
    const currentUrl = new URL(window.location);
    currentUrl.searchParams.set('v', timestamp);
    currentUrl.searchParams.set('build', newBuildHash);
    
    console.log('🔄 Recarregando página com cache limpo...');
    
    // Recarregar página forçando bypass do cache
    setTimeout(() => {
      window.location.href = currentUrl.toString();
    }, 500);
  }

  // Iniciar verificação periódica de versão
  startVersionCheck(intervalMinutes = 5) {
    // Desabilitar em desenvolvimento para evitar loops
    if (this.buildInfo.environment === 'development') {
      console.log('⚠️ Sistema de versionamento desabilitado em desenvolvimento');
      return;
    }
    
    console.log(`⏰ Iniciando verificação de versão a cada ${intervalMinutes} minutos`);
    
    // Verificação inicial após 30 segundos
    setTimeout(() => {
      this.checkServerVersion();
    }, 30000);
    
    // Verificação periódica
    this.checkInterval = setInterval(() => {
      this.checkServerVersion();
    }, intervalMinutes * 60 * 1000);
  }

  // Parar verificação periódica
  stopVersionCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('⏹️ Verificação de versão interrompida');
    }
  }

  // Verificação manual de versão
  async forceVersionCheck() {
    console.log('🔄 Verificação manual de versão solicitada');
    return await this.checkServerVersion();
  }

  // Habilitar versionamento (útil para testes)
  enableVersionCheck(intervalMinutes = 5) {
    console.log('🔄 Forçando habilitação do sistema de versionamento');
    
    // Parar verificação atual se existir
    this.stopVersionCheck();
    
    console.log(`⏰ Iniciando verificação de versão a cada ${intervalMinutes} minutos`);
    
    // Verificação inicial após 5 segundos
    setTimeout(() => {
      this.checkServerVersion();
    }, 5000);
    
    // Verificação periódica
    this.checkInterval = setInterval(() => {
      this.checkServerVersion();
    }, intervalMinutes * 60 * 1000);
  }

  // Obter informações de versão
  getVersionInfo() {
    return {
      current: this.currentVersion,
      stored: this.lastCheckedVersion,
      isChecking: this.isCheckingVersion
    };
  }

  // Reset completo do sistema de versionamento
  resetVersionSystem() {
    console.log('🔄 Resetando sistema de versionamento...');
    
    this.stopVersionCheck();
    localStorage.removeItem('app_version');
    localStorage.removeItem('app_build_hash');
    this.lastCheckedVersion = null;
    this.lastCheckedBuildHash = null;
    
    // Remover notificação se existir
    const notification = document.getElementById('version-update-notification');
    if (notification) {
      notification.remove();
    }
    
    console.log('✅ Sistema de versionamento resetado');
  }
}

// Criar instância singleton
const versionService = new VersionService();

// Exportar instância
export default versionService;

// Disponibilizar globalmente para debug
if (typeof window !== 'undefined') {
  window.versionService = versionService;
}