<template>
  <aside :class="sidebarClasses">
    <div class="sidebar-logo expanded">
      <div class="logo-shine logo-box">
        <img :src="logoUrl" alt="Logo" class="sidebar-logo-img" />
      </div>
      <div class="logo-texts">
        <div class="logo-title">Recebimento</div>
      </div>
    </div>

    <nav class="sidebar-menu">
      <div
        v-for="item in filteredMainMenuItems"
        :key="item.id"
        :class="['menu-item', { active: isMenuActive(item.id) }]"
      >
        <!-- Menu principal -->
        <div @click="handleMenuClick(item.id)" class="menu-main">
          <div class="icon-container">
            <i :class="item.icon"></i>
          </div>
          <span class="menu-label">{{ item.label }}</span>
        </div>
      </div>
    </nav>

    <!-- Settings Menu (moved to bottom) -->
    <div
      v-for="item in filteredSettingsItems"
      :key="item.id"
      :class="['menu-item', { active: isMenuActive(item.id) }]"
      style="margin: 8px 12px;"
    >
      <div @click="handleMenuClick(item.id)" class="menu-main">
        <div class="icon-container">
          <i :class="item.icon"></i>
        </div>
        <span class="menu-label">{{ item.label }}</span>
      </div>
    </div>

    <!-- User Info -->
    <div class="user-info">
      <div class="user-avatar">
        <i class="fa fa-user"></i>
      </div>
      <div class="user-details">
        <div class="user-name">{{ user.name || user.user || 'Usuário' }}</div>
        <div class="user-role">{{ userRole }}</div>
      </div>
      <button class="logout-btn" @click="handleLogout" title="Sair">
        <i class="fa fa-sign-out"></i>
      </button>
    </div>
  </aside>
</template>

<script>
import logoImg from '@/assets/images/logo.png'

export default {
  name: 'SidebarComponent',
  props: {
    user: {
      type: Object,
      default: () => ({}),
    },
    activeMenu: {
      type: String,
      default: 'dashboard',
    },
  },

  data() {
    return {
      expanded: true,
      menuItems: [
        {
          id: 'dashboard',
          icon: 'fa fa-home',
          label: 'Principal',
          submenu: [],
        },
        {
          id: 'agendamento',
          icon: 'fa fa-calendar',
          label: 'Agendamentos',
          submenu: [],
        },
        {
          id: 'agendamento-lote',
          icon: 'fa fa-tasks',
          label: 'Agendamento em Lote',
          submenu: [],
          requiresLevel: 0, // Apenas usuários nível 0
        },
        {
          id: 'configuracoes',
          icon: 'fa fa-cog',
          label: 'Configurações',
          submenu: [],
        },
      ],
    }
  },

  mounted() {
    // Componente montado
  },

  computed: {
    sidebarClasses() {
      return {
        sidebar: true,
        'sidebar-expanded': this.expanded,
      }
    },

    logoUrl() {
      return logoImg
    },

    userRole() {
      if (!this.user) return 'Usuário'

      switch (this.user.level_access) {
        case 0:
          return 'Desenvolvedor'
        case 1:
          return 'Usuário'
        case 2:
          return 'Administrador'
        case 3:
          return 'Gerente'
        default:
          return 'Usuário'
      }
    },

    filteredMainMenuItems() {
      if (!this.user || this.user.level_access === undefined) {
        return this.menuItems.filter(item => !item.requiresLevel && item.id !== 'configuracoes')
      }

      return this.menuItems.filter(item => {
        if (item.id === 'configuracoes') return false // Excluir configurações dos itens principais
        if (item.requiresLevel !== undefined) {
          return this.user.level_access === item.requiresLevel
        }
        return true
      })
    },

    filteredSettingsItems() {
      if (!this.user || this.user.level_access === undefined) {
        return this.menuItems.filter(item => item.id === 'configuracoes')
      }

      return this.menuItems.filter(item => {
        if (item.id !== 'configuracoes') return false // Apenas configurações
        if (item.requiresLevel !== undefined) {
          return this.user.level_access === item.requiresLevel
        }
        return true
      })
    },
  },

  methods: {
    handleMenuClick(menuId) {
      this.$emit('menu-click', menuId)
    },

    handleLogout() {
      this.$emit('logout')
    },

    isMenuActive(menuId) {
      return this.activeMenu === menuId
    },
  },
}
</script>

<style scoped>
/* Estilos com maior especificidade para sobrescrever CSS global */
#app .sidebar,
.sidebar {
  background: linear-gradient(135deg, #1c44f5 0%, #0077ff 100%) !important;
  min-height: 100vh !important;
  height: 100vh !important;
  position: fixed !important;
  left: 0 !important;
  top: 0 !important;
  z-index: 1050 !important;
  box-shadow: 0 0 30px rgba(0,0,0,0.15) !important;
  transition: width 0.3s !important;
  display: flex !important;
  flex-direction: column !important;
  width: 260px !important;
  font-family: 'Poppins', sans-serif !important;
}

#app .sidebar-logo,
.sidebar-logo {
  display: flex !important;
  align-items: center !important;
  border-bottom: 1px solid #3b82f6 !important;
  padding: 24px 18px 18px 18px !important;
  transition: all 0.3s !important;
}

#app .logo-box,
.logo-box {
  background: rgba(255,255,255,0.08) !important;
  border-radius: 16px !important;
  width: 48px !important; 
  height: 48px !important;
  display: flex !important; 
  align-items: center !important; 
  justify-content: center !important;
  border: 1.5px solid rgba(255,255,255,0.18) !important;
  margin-right: 0 !important;
}

#app .logo-texts,
.logo-texts { 
  margin-left: 18px !important; 
}

#app .logo-title,
.logo-title { 
  font-weight: 600 !important; 
  font-size: 1.2rem !important; 
  color: #fff !important;
  font-family: 'Poppins', sans-serif !important;
}

#app .sidebar-menu,
.sidebar-menu {
  flex: 1 !important;
  padding: 18px 0 0 0 !important;
  overflow-y: auto !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 2px !important;
}

#app .menu-item,
.menu-item {
  display: flex !important;
  flex-direction: column !important;
  position: relative !important;
  margin: 0 8px 6px 8px !important;
  border-radius: 12px !important;
  transition: background 0.2s, box-shadow 0.2s !important;
}

#app .menu-main,
.menu-main {
  display: flex !important;
  align-items: center !important;
  cursor: pointer !important;
  padding: 13px 14px !important;
  border-radius: 12px !important;
  transition: background 0.2s !important;
}

#app .menu-item.active > .menu-main,
.menu-item.active > .menu-main {
  background: rgba(255,255,255,0.18) !important;
  box-shadow: 0 2px 8px 0 rgba(59,130,246,0.08) !important;
}

#app .menu-item:hover > .menu-main,
.menu-item:hover > .menu-main {
  background: rgba(255,255,255,0.12) !important;
}

#app .icon-container,
.icon-container {
  width: 36px !important; 
  height: 36px !important;
  background: rgba(255,255,255,0.10) !important;
  border-radius: 8px !important;
  display: flex !important; 
  align-items: center !important; 
  justify-content: center !important;
  margin-right: 14px !important;
  font-size: 1.2rem !important;
  color: #fff !important;
  position: relative !important;
}

#app .icon-container i,
.icon-container i {
  font-size: 1.2rem !important;
  color: #fff !important;
  display: inline-block !important;
  font-style: normal !important;
  font-variant: normal !important;
  text-rendering: auto !important;
  -webkit-font-smoothing: antialiased !important;
}

#app .menu-label,
.menu-label {
  font-weight: 500 !important;
  color: #fff !important;
  font-size: 1rem !important;
  letter-spacing: 0.01em !important;
  font-family: 'Poppins', sans-serif !important;
}

#app .user-info,
.user-info {
  display: flex !important;
  align-items: center !important;
  padding: 16px 18px !important;
  border-top: 1px solid rgba(255,255,255,0.1) !important;
  margin-top: auto !important;
}

#app .user-avatar,
.user-avatar {
  width: 40px !important;
  height: 40px !important;
  background: rgba(255,255,255,0.1) !important;
  border-radius: 50% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  margin-right: 12px !important;
  color: #fff !important;
  font-size: 1.1rem !important;
}

#app .user-details,
.user-details {
  flex: 1 !important;
}

#app .user-name,
.user-name {
  color: #fff !important;
  font-weight: 500 !important;
  font-size: 0.95rem !important;
  margin-bottom: 2px !important;
  font-family: 'Poppins', sans-serif !important;
}

#app .user-role,
.user-role {
  color: rgba(255,255,255,0.7) !important;
  font-size: 0.8rem !important;
  font-family: 'Poppins', sans-serif !important;
}

#app .logout-btn,
.logout-btn {
  background: rgba(239, 68, 68, 0.2) !important;
  border: 1px solid rgba(239, 68, 68, 0.3) !important;
  color: #fca5a5 !important;
  width: 36px !important;
  height: 36px !important;
  border-radius: 8px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  cursor: pointer !important;
  transition: all 0.2s !important;
}

#app .logout-btn:hover,
.logout-btn:hover {
  background: rgba(239, 68, 68, 0.3) !important;
  border-color: rgba(239, 68, 68, 0.5) !important;
  color: #fecaca !important;
}

#app .logo-shine,
.logo-shine {
  position: relative !important;
  overflow: hidden !important;
}

#app .logo-shine::after,
.logo-shine::after {
  content: '' !important;
  position: absolute !important;
  top: -50% !important; 
  left: -50% !important;
  width: 200% !important; 
  height: 200% !important;
  background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 100%) !important;
  transform: rotate(45deg) !important;
  animation: shine 3s infinite !important;
}

@keyframes shine {
  0% { transform: translateX(-100%) rotate(45deg); }
  20%, 100% { transform: translateX(100%) rotate(45deg); }
}

#app .sidebar-logo-img,
.sidebar-logo-img {
  width: 44px !important;
  height: 44px !important;
  object-fit: contain !important;
  border-radius: 12px !important;
  background: transparent !important;
  display: block !important;
}

/* Garantir que todos os ícones sejam visíveis */
#app .fa,
.fa {
  font-family: "Font Awesome 5 Free" !important;
  font-weight: 900 !important;
  display: inline-block !important;
  font-style: normal !important;
  font-variant: normal !important;
  text-rendering: auto !important;
  -webkit-font-smoothing: antialiased !important;
}

/* Regra específica para ícones do sidebar */
#app .sidebar .fa,
.sidebar .fa {
  font-family: "Font Awesome 5 Free" !important;
  font-weight: 900 !important;
  display: inline-block !important;
  font-style: normal !important;
  font-variant: normal !important;
  text-rendering: auto !important;
  -webkit-font-smoothing: antialiased !important;
  color: #fff !important;
}

/* Regra específica para ícones dentro dos containers */
#app .sidebar .icon-container .fa,
.sidebar .icon-container .fa {
  font-family: "Font Awesome 5 Free" !important;
  font-weight: 900 !important;
  display: inline-block !important;
  font-style: normal !important;
  font-variant: normal !important;
  text-rendering: auto !important;
  -webkit-font-smoothing: antialiased !important;
  color: #fff !important;
  font-size: 1.2rem !important;
}
</style>
