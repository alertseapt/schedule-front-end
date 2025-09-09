<template>
  <div class="admin-page">
    <!-- Header da página -->
    <div class="admin-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">
            <i class="fas fa-users-cog"></i>
            Administração
          </h1>
        </div>
      </div>
    </div>

    <!-- Conteúdo principal -->
    <div class="admin-content">
      <!-- Loading state -->
      <div v-if="loading" class="loading-container">
        <div class="loader-spinner"></div>
        <p>Carregando usuários...</p>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="error-container">
        <div class="error-message">
          <i class="fas fa-exclamation-triangle"></i>
          <p>{{ error }}</p>
          <button @click="loadUsers" class="retry-btn">
            <i class="fas fa-redo"></i>
            Tentar novamente
          </button>
        </div>
      </div>

      <!-- Tabela de usuários -->
      <div v-else class="users-table-container">
        <div class="table-header">
          <div class="header-left">
            <h2>Lista de Usuários</h2>
            <p class="users-count">Total: {{ users.length }} usuários</p>
          </div>
          <div class="header-actions">
            <button @click="openCreateUserModal" class="create-user-btn">
              <i class="fas fa-user-plus"></i>
              Criar Usuário
            </button>
          </div>
        </div>

        <div class="table-wrapper">
          <table class="users-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Nível de Acesso</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in users" :key="user.id" class="user-row">
                <td class="user-name">{{ user.name || 'Não informado' }}</td>
                <td class="user-email">{{ user.user }}</td>
                <td class="user-level">
                  <span :class="getLevelClass(user.level_access)">
                    {{ getLevelText(user.level_access) }}
                  </span>
                </td>
                <td class="user-actions">
                  <button 
                    @click="openClientsModal(user)" 
                    class="action-btn clients-btn"
                    :disabled="loadingUser === user.id"
                  >
                    <i class="fas fa-building" v-if="loadingUser !== user.id"></i>
                    <i class="fas fa-spinner fa-spin" v-else></i>
                    CNPJs
                  </button>
                  <button 
                    @click="openEditUserModal(user)" 
                    class="action-btn settings-btn"
                    :disabled="loadingUser === user.id"
                    :title="'Editar usuário ' + user.name"
                  >
                    <i class="fas fa-cog"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal de gerenciamento de CNPJs -->
    <ClientsModal 
      v-if="showClientsModal"
      :user="selectedUser"
      :clients="availableClients"
      :loading="clientsLoading"
      @close="closeClientsModal"
      @save="saveUserClients"
      @search="searchClients"
    />

    <!-- Modal de criação de usuário -->
    <CreateUserModal
      v-if="showCreateUserModal"
      :current-user="currentUser"
      :available-clients="availableClients"
      :loading="createUserLoading"
      :clients-loading="createUserClientsLoading"
      @close="closeCreateUserModal"
      @save="createUser"
      @load-clients="loadClientsForUser"
    />

    <!-- Modal de edição de usuário -->
    <EditUserModal
      v-if="showEditUserModal"
      :user="selectedEditUser"
      :current-user="currentUser"
      :loading="editUserLoading"
      @close="closeEditUserModal"
      @save="saveUserChanges"
      @delete="confirmDeleteUser"
    />
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import ClientsModal from '../components/ClientsModal.vue';
import CreateUserModal from '../components/CreateUserModal.vue';
import EditUserModal from '../components/EditUserModal.vue';
import { BASE_URL } from '../config/api.js';

// Debug: verificar se BASE_URL está definido
console.log('🔧 [AdminPage] BASE_URL carregado:', BASE_URL, typeof BASE_URL);

export default {
  name: 'AdminPage',
  components: {
    ClientsModal,
    CreateUserModal,
    EditUserModal
  },
  setup() {
    // Estado reativo
    const users = ref([]);
    const loading = ref(true);
    const error = ref(null);
    const loadingUser = ref(null);
    
    // Modal de clientes
    const showClientsModal = ref(false);
    const selectedUser = ref(null);
    const availableClients = ref([]);
    const clientsLoading = ref(false);

    // Modal de criação de usuário
    const showCreateUserModal = ref(false);
    const createUserLoading = ref(false);
    const createUserClientsLoading = ref(true);

    // Modal de edição de usuário
    const showEditUserModal = ref(false);
    const selectedEditUser = ref(null);
    const editUserLoading = ref(false);

    // Computed - obter dados do localStorage
    const currentUser = computed(() => {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    });
    
    const token = computed(() => localStorage.getItem('token'));

    // Verificar se é usuário nível 0
    const checkAccess = () => {
      if (!currentUser.value || currentUser.value.level_access !== 0) {
        error.value = 'Acesso negado. Apenas usuários de nível 0 podem acessar esta página.';
        return false;
      }
      return true;
    };

    // Carregar usuários
    const loadUsers = async () => {
      if (!checkAccess()) return;
      
      try {
        loading.value = true;
        error.value = null;

        const response = await fetch(`${BASE_URL}/users/admin/all`, {
          headers: {
            'Authorization': `Bearer ${token.value}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Erro ao carregar usuários');
        }

        const data = await response.json();
        // Ordenar usuários alfabeticamente por nome
        users.value = data.users.sort((a, b) => {
          const nameA = (a.name || 'Não informado').toLowerCase();
          const nameB = (b.name || 'Não informado').toLowerCase();
          return nameA.localeCompare(nameB);
        });

      } catch (err) {
        console.error('Erro ao carregar usuários:', err);
        error.value = 'Erro ao carregar usuários. Tente novamente.';
      } finally {
        loading.value = false;
      }
    };

    // Abrir modal de clientes
    const openClientsModal = async (user) => {
      selectedUser.value = user;
      loadingUser.value = user.id;
      
      try {
        await loadClients();
        showClientsModal.value = true;
      } catch (err) {
        console.error('Erro ao carregar clientes:', err);
        error.value = 'Erro ao carregar lista de clientes.';
      } finally {
        loadingUser.value = null;
      }
    };

    // Fechar modal de clientes
    const closeClientsModal = () => {
      showClientsModal.value = false;
      selectedUser.value = null;
      availableClients.value = [];
    };

    // Carregar clientes
    const loadClients = async (search = '') => {
      clientsLoading.value = true;
      
      try {
        // Usar endpoint correto baseado no nível do usuário
        // Para nível 0: /users/admin/clients (busca na tabela clients)
        // Para outros níveis: usar endpoint alternativo ou método diferente
        let urlString;
        
        if (currentUser.value?.level_access === 0) {
          // Super admin: buscar todos os clientes na tabela clients
          urlString = `${BASE_URL}/users/admin/clients`;
          if (search && search.trim()) {
            const searchParam = encodeURIComponent(search.trim());
            urlString += `?search=${searchParam}`;
          }
        } else {
          // Outros usuários: usar endpoint de clientes acessíveis (sem busca por enquanto)
          urlString = `${BASE_URL}/users/clients/accessible`;
        }

        console.log('🔍 Carregando clientes...', {
          urlString: urlString,
          token: token.value ? 'TOKEN_PRESENTE' : 'TOKEN_AUSENTE',
          user: currentUser.value,
          searchTerm: search
        });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos
        
        const response = await fetch(urlString, {
          headers: {
            'Authorization': `Bearer ${token.value}`,
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        console.log('📡 Resposta da API:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries())
        });

        if (!response.ok) {
          const errorData = await response.text();
          console.error('❌ Erro na resposta:', {
            status: response.status,
            statusText: response.statusText,
            body: errorData
          });
          throw new Error(`Erro ${response.status}: ${response.statusText} - ${errorData}`);
        }

        const data = await response.json();
        console.log('✅ Dados recebidos:', data);
        
        // Normalizar estrutura de dados dos diferentes endpoints
        if (data.clients) {
          availableClients.value = data.clients.map(client => ({
            nome: client.nome || client.name,      // admin/clients usa 'nome', accessible usa 'name'
            numero: client.numero || client.number, // admin/clients usa 'numero', accessible usa 'number'
            cnpj: client.cnpj
          }));
        } else {
          availableClients.value = [];
        }

      } catch (err) {
        console.error('❌ Erro ao carregar clientes:', {
          message: err.message,
          stack: err.stack,
          type: err.constructor.name,
          name: err.name
        });
        
        if (err.name === 'AbortError') {
          throw new Error('Timeout: A requisição demorou mais de 30 segundos para responder');
        }
        throw err;
      } finally {
        clientsLoading.value = false;
      }
    };

    // Pesquisar clientes
    const searchClients = (searchTerm) => {
      loadClients(searchTerm);
    };

    // Modal de criação de usuário
    const openCreateUserModal = async () => {
      // Abrir o modal imediatamente
      showCreateUserModal.value = true;
      createUserClientsLoading.value = true;
      
      try {
        await loadClientsForCreateUser(); // Carregar clientes disponíveis
      } catch (err) {
        console.error('Erro ao carregar clientes:', err);
        showNotification('Erro ao carregar lista de clientes.', 'error');
      }
    };

    const closeCreateUserModal = () => {
      showCreateUserModal.value = false;
      availableClients.value = []; // Limpar clientes ao fechar
      createUserClientsLoading.value = true; // Resetar estado de loading
    };

    // Carregar clientes para criação de usuário (com estado separado)
    const loadClientsForCreateUser = async (search = '') => {
      createUserClientsLoading.value = true;
      
      try {
        // Usar endpoint correto baseado no nível do usuário
        // Para nível 0: /users/admin/clients (busca na tabela clients)
        // Para outros níveis: usar endpoint alternativo ou método diferente
        let urlString;
        
        if (currentUser.value?.level_access === 0) {
          // Super admin: buscar todos os clientes na tabela clients
          urlString = `${BASE_URL}/users/admin/clients`;
          if (search && search.trim()) {
            const searchParam = encodeURIComponent(search.trim());
            urlString += `?search=${searchParam}`;
          }
        } else {
          // Outros usuários: usar endpoint de clientes acessíveis (sem busca por enquanto)
          urlString = `${BASE_URL}/users/clients/accessible`;
        }

        console.log('🔍 Carregando clientes (CreateUser)...', {
          urlString: urlString,
          token: token.value ? 'TOKEN_PRESENTE' : 'TOKEN_AUSENTE',
          user: currentUser.value,
          searchTerm: search
        });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos
        
        const response = await fetch(urlString, {
          headers: {
            'Authorization': `Bearer ${token.value}`,
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        console.log('📡 Resposta da API (CreateUser):', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        });

        if (!response.ok) {
          const errorData = await response.text();
          console.error('❌ Erro na resposta (CreateUser):', {
            status: response.status,
            statusText: response.statusText,
            body: errorData
          });
          throw new Error(`Erro ${response.status}: ${response.statusText} - ${errorData}`);
        }

        const data = await response.json();
        console.log('✅ Dados recebidos (CreateUser):', data);
        
        // Normalizar estrutura de dados dos diferentes endpoints
        if (data.clients) {
          availableClients.value = data.clients.map(client => ({
            nome: client.nome || client.name,      // admin/clients usa 'nome', accessible usa 'name'
            numero: client.numero || client.number, // admin/clients usa 'numero', accessible usa 'number'
            cnpj: client.cnpj
          }));
        } else {
          availableClients.value = [];
        }

      } catch (err) {
        console.error('❌ Erro ao carregar clientes (CreateUser):', {
          message: err.message,
          stack: err.stack,
          type: err.constructor.name,
          name: err.name
        });
        
        if (err.name === 'AbortError') {
          throw new Error('Timeout: A requisição demorou mais de 30 segundos para responder');
        }
        throw err;
      } finally {
        createUserClientsLoading.value = false;
      }
    };

    const loadClientsForUser = (searchTerm) => {
      loadClientsForCreateUser(searchTerm);
    };

    // Criar usuário
    const createUser = async (userData) => {
      createUserLoading.value = true;
      
      try {
        const response = await fetch(`${BASE_URL}/users`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token.value}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            user: userData.email,
            password: 'mercocamp', // Senha padrão
            name: userData.name,
            level_access: userData.level_access,
            cli_access: userData.cli_access
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao criar usuário');
        }

        const result = await response.json();
        
        // Recarregar lista de usuários
        await loadUsers();
        
        closeCreateUserModal();
        showNotification('Usuário criado com sucesso!', 'success');

      } catch (err) {
        console.error('Erro ao criar usuário:', err);
        showNotification(err.message || 'Erro ao criar usuário.', 'error');
      } finally {
        createUserLoading.value = false;
      }
    };

    // Modal de edição de usuário
    const openEditUserModal = (user) => {
      selectedEditUser.value = { ...user }; // Clonar o objeto para não modificar o original
      showEditUserModal.value = true;
    };

    const closeEditUserModal = () => {
      showEditUserModal.value = false;
      selectedEditUser.value = null;
    };

    // Salvar alterações do usuário
    const saveUserChanges = async (userData) => {
      editUserLoading.value = true;
      
      try {
        const response = await fetch(`${BASE_URL}/users/${selectedEditUser.value.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token.value}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: userData.name,
            level_access: userData.level_access
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao atualizar usuário');
        }

        // Atualizar usuário na lista local
        const userIndex = users.value.findIndex(u => u.id === selectedEditUser.value.id);
        if (userIndex !== -1) {
          users.value[userIndex] = { ...users.value[userIndex], ...userData };
        }

        closeEditUserModal();
        showNotification('Usuário atualizado com sucesso!', 'success');

      } catch (err) {
        console.error('Erro ao atualizar usuário:', err);
        showNotification(err.message || 'Erro ao atualizar usuário.', 'error');
      } finally {
        editUserLoading.value = false;
      }
    };

    // Confirmar exclusão de usuário (chamado do modal)
    const confirmDeleteUser = (user) => {
      // Verificar se é tentativa de auto-exclusão
      if (user.id === currentUser.value?.id) {
        showNotification('Você não pode excluir sua própria conta.', 'error');
        return;
      }

      // Apenas desenvolvedores podem excluir outros desenvolvedores
      if (user.level_access === 0 && currentUser.value?.level_access !== 0) {
        showNotification('Apenas desenvolvedores podem excluir outros desenvolvedores.', 'error');
        return;
      }

      const confirmation = confirm(
        `Tem certeza que deseja excluir o usuário "${user.name || user.user}"?\n\n` +
        `Esta ação não pode ser desfeita e o usuário perderá acesso ao sistema.`
      );

      if (confirmation) {
        deleteUser(user);
      }
    };

    // Excluir usuário
    const deleteUser = async (user) => {
      editUserLoading.value = true;

      try {
        const response = await fetch(`${BASE_URL}/users/${user.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token.value}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao excluir usuário');
        }

        // Remover usuário da lista local
        users.value = users.value.filter(u => u.id !== user.id);
        
        closeEditUserModal();
        showNotification(`Usuário "${user.name || user.user}" excluído com sucesso.`, 'success');

      } catch (err) {
        console.error('Erro ao excluir usuário:', err);
        showNotification(err.message || 'Erro ao excluir usuário.', 'error');
      } finally {
        editUserLoading.value = false;
      }
    };

    // Salvar acessos do usuário
    const saveUserClients = async (selectedClients) => {
      try {
        // Formar JSON no formato especificado
        const cliAccess = {};
        selectedClients.forEach(client => {
          cliAccess[client.cnpj] = {
            nome: client.nome,
            numero: client.numero
          };
        });

        const response = await fetch(`${BASE_URL}/users/${selectedUser.value.id}/client-access`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token.value}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ cli_access: cliAccess })
        });

        if (!response.ok) {
          throw new Error('Erro ao salvar acessos do usuário');
        }

        // Atualizar o usuário local
        const userIndex = users.value.findIndex(u => u.id === selectedUser.value.id);
        if (userIndex !== -1) {
          users.value[userIndex].cli_access = cliAccess;
        }

        closeClientsModal();
        
        // Mostrar sucesso
        showNotification('Acessos do usuário salvos com sucesso!', 'success');

      } catch (err) {
        console.error('Erro ao salvar acessos:', err);
        showNotification('Erro ao salvar acessos do usuário.', 'error');
      }
    };

    // Utilitários
    const getLevelText = (level) => {
      const levels = {
        0: 'Desenvolvedor',
        1: 'Cliente',
        2: 'Administrador',
        3: 'Gerente',
        9: 'Conferente'
      };
      return levels[level] || 'Desconhecido';
    };

    const getLevelClass = (level) => {
      const classes = {
        0: 'level-developer',
        1: 'level-cliente',
        2: 'level-admin',
        3: 'level-manager',
        9: 'level-conferente'
      };
      return classes[level] || 'level-unknown';
    };

    const showNotification = (message, type = 'info') => {
      // Implementar notificação simples usando alert por enquanto
      // Em uma implementação mais robusta, usar uma biblioteca de toast/notification
      if (type === 'success') {
        alert(`✅ ${message}`);
      } else if (type === 'error') {
        alert(`❌ ${message}`);
      } else {
        alert(`ℹ️ ${message}`);
      }
      console.log(`${type.toUpperCase()}: ${message}`);
    };

    // Lifecycle
    onMounted(() => {
      loadUsers();
    });

    return {
      users,
      loading,
      error,
      loadingUser,
      showClientsModal,
      selectedUser,
      availableClients,
      clientsLoading,
      showCreateUserModal,
      createUserLoading,
      createUserClientsLoading,
      showEditUserModal,
      selectedEditUser,
      editUserLoading,
      loadUsers,
      openClientsModal,
      closeClientsModal,
      searchClients,
      saveUserClients,
      openCreateUserModal,
      closeCreateUserModal,
      loadClientsForUser,
      createUser,
      openEditUserModal,
      closeEditUserModal,
      saveUserChanges,
      confirmDeleteUser,
      deleteUser,
      getLevelText,
      getLevelClass
    };
  }
};
</script>

<style scoped>
.admin-page {
  min-height: 100vh;
  background: #f7fafc;
  padding: 20px;
}

.admin-header {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 2rem;
  font-weight: 700;
  color: #2d3748;
  margin: 0 0 8px 0;
}

.page-title i {
  color: #3182ce;
  font-size: 1.8rem;
}

.page-description {
  color: #718096;
  margin: 0;
  font-size: 1.1rem;
}

.admin-content {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.loader-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e2e8f0;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.error-message i {
  color: #e53e3e;
  font-size: 2rem;
}

.retry-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: #3182ce;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.retry-btn:hover {
  background: #2c5aa0;
  transform: translateY(-1px);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e2e8f0;
}

.header-left h2 {
  margin: 0;
  color: #2d3748;
  font-size: 1.5rem;
  font-weight: 600;
}

.users-count {
  margin: 0;
  color: #718096;
  font-weight: 500;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.create-user-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: #48bb78;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.create-user-btn:hover {
  background: #38a169;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(72, 187, 120, 0.3);
}

.create-user-btn i {
  font-size: 1rem;
}

.table-wrapper {
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

.users-table th {
  background: #f7fafc;
  padding: 16px;
  text-align: left;
  font-weight: 600;
  color: #2d3748;
  border-bottom: 2px solid #e2e8f0;
}

.users-table td {
  padding: 16px;
  border-bottom: 1px solid #e2e8f0;
  color: #4a5568;
}

.user-row:hover {
  background: #f7fafc;
}

.user-email {
  font-family: 'Courier New', monospace;
  font-weight: 500;
}

.user-name {
  font-weight: 500;
}

.user-level span {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.level-developer {
  background: #2d3748;
  color: #ffffff;
}

.level-cliente {
  background: #e2e8f0;
  color: #4a5568;
}

.level-admin {
  background: #3182ce;
  color: #ffffff;
}

.level-manager {
  background: #c6f6d5;
  color: #2f855a;
}

.level-conferente {
  background: #bee3f8;
  color: #2c5282;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  font-size: 0.875rem;
}

.clients-btn {
  background: #3182ce;
  color: white;
}

.clients-btn:hover:not(:disabled) {
  background: #2c5aa0;
  transform: translateY(-1px);
}

.clients-btn:disabled {
  background: #a0aec0;
  cursor: not-allowed;
}

.settings-btn {
  background: #718096;
  color: white;
  margin-left: 8px;
}

.settings-btn:hover:not(:disabled) {
  background: #4a5568;
  transform: translateY(-1px);
}

.settings-btn:disabled {
  background: #a0aec0;
  cursor: not-allowed;
}

.user-actions {
  display: flex;
  align-items: center;
}

@media (max-width: 768px) {
  .admin-page {
    padding: 12px;
  }
  
  .page-title {
    font-size: 1.5rem;
  }
  
  .table-wrapper {
    font-size: 0.875rem;
  }
  
  .users-table th,
  .users-table td {
    padding: 12px 8px;
  }
  
  .header-content {
    flex-direction: column;
    gap: 16px;
  }
}
</style>