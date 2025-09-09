<template>
  <div class="version-page">
    <!-- Header da Página -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">
          <i class="fas fa-code-branch"></i>
          Versão {{ selectedVersion }}
        </h1>
        <p class="page-subtitle">Notas de atualização e histórico de versões</p>
      </div>
      <div class="header-right">
        <div class="version-selector">
          <label for="version-select">Selecionar versão:</label>
          <select 
            id="version-select"
            v-model="selectedVersion" 
            @change="onVersionChange"
            class="version-dropdown"
          >
            <option 
              v-for="version in versions" 
              :key="version.number" 
              :value="version.number"
            >
              v{{ version.number }} - {{ version.name }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Carregando informações da versão...</p>
    </div>

    <!-- Content -->
    <div v-else class="version-content">
      <!-- Version Info -->
      <div class="version-info">
        <div class="version-badge" :class="`badge-${currentVersionData.type}`">
          <i :class="getVersionIcon(currentVersionData.type)"></i>
          v{{ currentVersionData.number }}
        </div>
        <div class="version-details">
          <h2 class="version-title">{{ currentVersionData.name }}</h2>
          <div class="version-meta">
            <span class="version-date">
              <i class="fas fa-calendar-alt"></i>
              Atualizada em {{ formatDate(currentVersionData.date) }}
            </span>
            <span class="version-type">
              {{ getVersionTypeLabel(currentVersionData.type) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Release Notes -->
      <div class="release-notes">
        <!-- Novas Funcionalidades -->
        <div v-if="currentVersionData.features?.length" class="notes-section">
          <h3 class="section-title">
            <i class="fas fa-star text-success"></i>
            Novas Funcionalidades
          </h3>
          <div class="notes-list">
            <div 
              v-for="(feature, index) in currentVersionData.features" 
              :key="index" 
              class="note-item feature-item"
            >
              <div class="note-icon">
                <i class="fas fa-plus-circle text-success"></i>
              </div>
              <div class="note-content">
                <h4 class="note-title">{{ feature.title }}</h4>
                <p class="note-description">{{ feature.description }}</p>
                <div v-if="feature.details" class="note-details">
                  <ul>
                    <li v-for="detail in feature.details" :key="detail">{{ detail }}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Melhorias -->
        <div v-if="currentVersionData.improvements?.length" class="notes-section">
          <h3 class="section-title">
            <i class="fas fa-arrow-up text-primary"></i>
            Melhorias
          </h3>
          <div class="notes-list">
            <div 
              v-for="(improvement, index) in currentVersionData.improvements" 
              :key="index" 
              class="note-item improvement-item"
            >
              <div class="note-icon">
                <i class="fas fa-arrow-up text-primary"></i>
              </div>
              <div class="note-content">
                <h4 class="note-title">{{ improvement.title }}</h4>
                <p class="note-description">{{ improvement.description }}</p>
                <div v-if="improvement.details" class="note-details">
                  <ul>
                    <li v-for="detail in improvement.details" :key="detail">{{ detail }}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Correções de Bugs -->
        <div v-if="currentVersionData.bugfixes?.length" class="notes-section">
          <h3 class="section-title">
            <i class="fas fa-bug text-warning"></i>
            Correções de Bugs
          </h3>
          <div class="notes-list">
            <div 
              v-for="(bugfix, index) in currentVersionData.bugfixes" 
              :key="index" 
              class="note-item bugfix-item"
            >
              <div class="note-icon">
                <i class="fas fa-wrench text-warning"></i>
              </div>
              <div class="note-content">
                <h4 class="note-title">{{ bugfix.title }}</h4>
                <p class="note-description">{{ bugfix.description }}</p>
                <div v-if="bugfix.details" class="note-details">
                  <ul>
                    <li v-for="detail in bugfix.details" :key="detail">{{ detail }}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Alterações Técnicas -->
        <div v-if="currentVersionData.technical?.length" class="notes-section">
          <h3 class="section-title">
            <i class="fas fa-cog text-secondary"></i>
            Alterações Técnicas
          </h3>
          <div class="notes-list">
            <div 
              v-for="(tech, index) in currentVersionData.technical" 
              :key="index" 
              class="note-item technical-item"
            >
              <div class="note-icon">
                <i class="fas fa-cog text-secondary"></i>
              </div>
              <div class="note-content">
                <h4 class="note-title">{{ tech.title }}</h4>
                <p class="note-description">{{ tech.description }}</p>
                <div v-if="tech.details" class="note-details">
                  <ul>
                    <li v-for="detail in tech.details" :key="detail">{{ detail }}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Breaking Changes -->
        <div v-if="currentVersionData.breaking?.length" class="notes-section">
          <h3 class="section-title">
            <i class="fas fa-exclamation-triangle text-danger"></i>
            Alterações Incompatíveis
          </h3>
          <div class="alert-warning">
            <i class="fas fa-exclamation-triangle"></i>
            <strong>Atenção:</strong> Esta versão contém alterações que podem afetar a compatibilidade.
          </div>
          <div class="notes-list">
            <div 
              v-for="(breaking, index) in currentVersionData.breaking" 
              :key="index" 
              class="note-item breaking-item"
            >
              <div class="note-icon">
                <i class="fas fa-exclamation-triangle text-danger"></i>
              </div>
              <div class="note-content">
                <h4 class="note-title">{{ breaking.title }}</h4>
                <p class="note-description">{{ breaking.description }}</p>
                <div v-if="breaking.migration" class="migration-guide">
                  <h5>Guia de Migração:</h5>
                  <p>{{ breaking.migration }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { versionData, getLatestVersion } from '../data/version-data.js'

export default {
  name: 'VersionPage',

  data() {
    return {
      selectedVersion: getLatestVersion().number, // Sempre a versão mais recente
      versions: versionData,
      loading: false
    }
  },

  computed: {
    currentVersionData() {
      return this.versions.find(v => v.number === this.selectedVersion) || this.versions[0]
    }
  },

  methods: {
    onVersionChange() {
      this.loading = true
      // Scroll para o topo da página
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
      setTimeout(() => {
        this.loading = false
      }, 300) // Simular carregamento
    },

    selectVersion(version) {
      if (version !== this.selectedVersion) {
        this.selectedVersion = version
        this.onVersionChange()
      }
    },

    getVersionIcon(type) {
      const icons = {
        'major': 'fas fa-rocket',
        'minor': 'fas fa-star',
        'patch': 'fas fa-wrench',
        'beta': 'fas fa-flask',
        'alpha': 'fas fa-code'
      }
      return icons[type] || 'fas fa-tag'
    },

    getVersionTypeLabel(type) {
      const labels = {
        'major': 'Versão Principal',
        'minor': 'Nova Funcionalidade',
        'patch': 'Correções',
        'beta': 'Versão Beta',
        'alpha': 'Versão Alpha'
      }
      return labels[type] || 'Atualização'
    },

    formatDate(dateString) {
      if (!dateString) return '-'
      const [year, month, day] = dateString.split('-')
      const date = new Date(year, month - 1, day)
      return date.toLocaleDateString('pt-BR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    },

    formatDateShort(dateString) {
      if (!dateString) return '-'
      const [year, month, day] = dateString.split('-')
      const date = new Date(year, month - 1, day)
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    },

  }
}
</script>

<style scoped>
.version-page {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

/* Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e9ecef;
}

.header-left .page-title {
  margin: 0 0 0.5rem 0;
  color: #495057;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 2.5rem;
  font-weight: 700;
}

.header-left .page-subtitle {
  margin: 0;
  color: #6c757d;
  font-size: 1.1rem;
}

.version-selector {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.version-selector label {
  font-weight: 600;
  color: #495057;
  font-size: 0.9rem;
}

.version-dropdown {
  padding: 0.75rem 1rem;
  border: 2px solid #dee2e6;
  border-radius: 8px;
  background: white;
  font-size: 1rem;
  min-width: 250px;
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.version-dropdown:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

/* Loading */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: #6c757d;
}

.loading-container i {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #007bff;
}

/* Content */
.version-content {
  width: 100%;
}

/* Version Info */
.version-info {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 2rem;
}

.version-badge {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  font-weight: 700;
  font-size: 1.25rem;
  color: white;
  min-width: 120px;
  justify-content: center;
}

.badge-major {
  background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
}

.badge-minor {
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
}

.badge-patch {
  background: linear-gradient(135deg, #28a745 0%, #1e7e34 100%);
}

.badge-beta {
  background: linear-gradient(135deg, #ffc107 0%, #e0a800 100%);
  color: #856404;
}

.badge-alpha {
  background: linear-gradient(135deg, #6c757d 0%, #545b62 100%);
}

.version-details {
  flex: 1;
}

.version-title {
  margin: 0 0 0.75rem 0;
  color: #495057;
  font-size: 2rem;
  font-weight: 700;
}

.version-meta {
  display: flex;
  align-items: center;
  gap: 2rem;
  flex-wrap: wrap;
}

.version-date {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6c757d;
  font-size: 1rem;
}

.version-date i {
  color: #007bff;
}

.version-type {
  background: #f8f9fa;
  color: #495057;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
  border: 1px solid #e9ecef;
}

/* Release Notes */
.release-notes {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  width: 100%;
}

.notes-section {
  padding: 2rem;
  border-bottom: 1px solid #e9ecef;
}

.notes-section:last-child {
  border-bottom: none;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0 0 1.5rem 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #495057;
}

.notes-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.note-item {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 12px;
  border-left: 4px solid;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.note-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.feature-item { border-left-color: #28a745; }
.improvement-item { border-left-color: #007bff; }
.bugfix-item { border-left-color: #ffc107; }
.technical-item { border-left-color: #6c757d; }
.breaking-item { border-left-color: #dc3545; }

.note-icon {
  flex-shrink: 0;
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 50%;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.note-content {
  flex: 1;
}

.note-title {
  margin: 0 0 0.75rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #495057;
}

.note-description {
  margin: 0 0 1rem 0;
  color: #6c757d;
  line-height: 1.6;
}

.note-details ul {
  margin: 0;
  padding-left: 1.5rem;
  color: #6c757d;
}

.note-details li {
  margin-bottom: 0.5rem;
  line-height: 1.5;
}

/* Alerts */
.alert-warning {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  color: #856404;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.migration-guide {
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(0, 123, 255, 0.05);
  border-left: 3px solid #007bff;
  border-radius: 6px;
}

.migration-guide h5 {
  margin: 0 0 0.5rem 0;
  color: #007bff;
  font-weight: 600;
}


/* Utility Colors */
.text-success { color: #28a745 !important; }
.text-primary { color: #007bff !important; }
.text-warning { color: #ffc107 !important; }
.text-danger { color: #dc3545 !important; }
.text-secondary { color: #6c757d !important; }

/* Responsive */
@media (max-width: 1200px) {
  .version-page {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .version-history {
    position: static;
  }
}

@media (max-width: 768px) {
  .version-page {
    padding: 1rem;
    gap: 1rem;
  }
  
  .page-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  
  .note-item {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }
}
</style>