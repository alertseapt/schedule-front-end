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
        <i class="fas fa-user"></i>
      </div>
      <div class="user-details">
        <div class="user-name">{{ user.name || user.user || 'Usuário' }}</div>
        <div class="user-role">{{ userRole }}</div>
      </div>
      <button class="logout-btn" @click="handleLogout" title="Sair">
        <i class="fas fa-sign-out-alt"></i>
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
          icon: 'fas fa-home',
          label: 'Principal',
          submenu: [],
        },
        {
          id: 'agendamento',
          icon: 'fas fa-calendar-alt',
          label: 'Agendamentos',
          submenu: [],
        },
        {
          id: 'agendamento-lote',
          icon: 'fas fa-tasks',
          label: 'Agendamento em Lote',
          submenu: [],
          requiresLevel: 0, // Apenas usuários nível 0
        },
        {
          id: 'configuracoes',
          icon: 'fas fa-cog',
          label: 'Configurações',
          submenu: [],
        },
      ],
    }
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
