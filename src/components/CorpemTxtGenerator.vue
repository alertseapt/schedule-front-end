<template>
  <div v-if="canShowTxtActions" class="txt-actions">
    <button 
      class="btn btn-info action-btn" 
      @click="handleGenerateTXT" 
      :disabled="loading"
    >
      <i class="fas fa-download"></i>
      <span v-if="loading">Gerando...</span>
      <span v-else>Baixar TXT</span>
    </button>
  </div>
</template>

<script>
import { 
  validateTXTGeneration, 
  generateCorpemTXT 
} from '../services/txtGenerationService.js'

export default {
  name: 'CorpemTxtGenerator',
  
  props: {
    selectedSchedules: {
      type: Array,
      required: true
    },
    schedules: {
      type: Array,
      required: true
    },
    user: {
      type: Object,
      required: true
    },
    loading: {
      type: Boolean,
      default: false
    }
  },

  emits: ['loading-changed', 'notification'],

  computed: {
    /**
     * Verifica se deve mostrar as ações de TXT
     */
    canShowTxtActions() {
      return this.canGenerateTXT
    },

    /**
     * Verifica se pode gerar arquivo TXT
     */
    canGenerateTXT() {
      if (this.selectedSchedules.length < 1) return false
      
      const selected = this.schedules.filter(s => this.selectedSchedules.includes(s.id))
      if (selected.length === 0) return false
      
      const validation = validateTXTGeneration(this.user, selected)
      return validation.canGenerate
    },

    /**
     * Obtém os agendamentos selecionados completos
     */
    selectedScheduleObjects() {
      return this.schedules.filter(s => this.selectedSchedules.includes(s.id))
    }
  },

  methods: {
    /**
     * Manipula a geração do arquivo TXT
     */
    async handleGenerateTXT() {
      if (!this.canGenerateTXT) {
        this.$emit('notification', 'Selecione NFes do mesmo cliente para gerar o arquivo TXT. Funcionalidade disponível apenas para usuários com nível de acesso diferente de 1.', 'error')
        return
      }

      console.log('CorpemTxtGenerator - Iniciando geração TXT...')
      this.setLoading(true, 'Gerando TXT...', 'Preparando arquivo para download')

      try {
        const result = await generateCorpemTXT(this.user, this.selectedScheduleObjects)
        
        if (result.success) {
          this.$emit('notification', result.message, 'success')
        } else {
          this.$emit('notification', result.message, 'error')
        }

      } catch (error) {
        console.error('Erro ao gerar arquivo TXT:', error)
        this.$emit('notification', `Erro ao gerar arquivo TXT: ${error.message}`, 'error')
      }

      // Força a remoção do loading via acesso direto ao componente pai
      console.log('CorpemTxtGenerator - Forçando reset do bulkActionLoading no pai')
      this.$parent.bulkActionLoading = false
      this.$parent.loadingMessage = ''
      this.$parent.loadingSubtext = ''
      
      // Também emite o evento para garantir
      this.setLoading(false)
    },

    /**
     * Controla o estado de loading
     */
    setLoading(isLoading, message = '', detail = '') {
      console.log('CorpemTxtGenerator - setLoading called:', { isLoading, message, detail })
      console.log('CorpemTxtGenerator - Emitindo loading-changed event...')
      this.$emit('loading-changed', {
        loading: isLoading,
        message: message,
        detail: detail
      })
      console.log('CorpemTxtGenerator - loading-changed event emitido!')
    }
  }
}
</script>

<style scoped>
.txt-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  white-space: nowrap;
}

.action-btn {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .txt-actions {
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>