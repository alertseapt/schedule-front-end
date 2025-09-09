<template>
  <div v-if="showModal" class="modal-overlay" @click="handleModalClick">
    <div class="modal-content large batch-products-modal">
      <!-- Header -->
      <div class="modal-header">
        <h3>
          <i class="fas fa-list-alt"></i>
          Configurar Produtos - Agendamento em Lote
        </h3>
        <button class="btn-close" @click="closeModal">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Progress Steps -->
      <div class="progress-steps">
        <div class="step-info">
          <span class="step-current">{{ currentFileIndex + 1 }}</span>
          <span class="step-separator">/</span>
          <span class="step-total">{{ parsedFiles.length }}</span>
          <span class="step-label">{{ currentFile?.fileName || 'Carregando...' }}</span>
        </div>
        <div class="progress-bar-container">
          <div 
            class="progress-bar-fill" 
            :style="{ width: progressPercentage + '%' }"
          ></div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading-container">
        <i class="fas fa-spinner fa-spin"></i>
        <p>{{ loadingText }}</p>
      </div>

      <!-- File Products Configuration -->
      <div v-if="!loading" class="modal-body products-modal-body">
        <div class="current-file-info">
          <h4>
            <i class="fas fa-file-alt"></i>
            {{ currentFile?.nfeData?.number ? `NFe ${currentFile.nfeData.number}` : currentFile?.fileName }}
          </h4>
          <div class="file-details">
            <span v-if="currentFile?.nfeData?.supplier_name" class="detail">
              <i class="fas fa-truck"></i>
              {{ currentFile.nfeData.supplier_name }}
            </span>
            <span class="detail">
              <i class="fas fa-box"></i>
              {{ currentFile?.products?.length || 0 }} produto(s)
            </span>
            <span v-if="selectedClient" class="detail">
              <i class="fas fa-warehouse"></i>
              {{ selectedClient.name }}
            </span>
          </div>
        </div>

        <div class="products-section">
          <div class="products-controls">
            <div class="checkbox-controls">
              <div class="left-controls">
                <label class="master-checkbox">
                  <input 
                    type="checkbox" 
                    v-model="selectAllProducts" 
                    @change="toggleAllProducts"
                  />
                  Marcar todos
                </label>
                <button 
                  type="button" 
                  class="btn btn-sm btn-outline-secondary invert-btn"
                  @click="invertProductSelection"
                >
                  <i class="fas fa-random"></i>
                  Inverter seleção
                </button>
              </div>
              <span class="products-hint">
                <i class="fas fa-info-circle"></i>
                Produtos marcados usarão código e descrição do fornecedor automaticamente
              </span>
            </div>
          </div>

          <div class="products-table-container">
            <table class="products-table">
              <thead>
                <tr>
                  <th width="50">
                    <i class="fas fa-check-square" title="Usar dados do fornecedor"></i>
                  </th>
                  <th>Cód. Forn.</th>
                  <th>
                    Cód. Venda
                    <i class="fas fa-edit" title="Editável"></i>
                  </th>
                  <th>Descrição Fornecedor</th>
                  <th>
                    Descrição Venda
                    <i class="fas fa-edit" title="Editável"></i>
                  </th>
                  <th>Quant.</th>
                  <th>
                    Fator
                    <i
                      class="fas fa-question-circle"
                      title="Fator de conversão"
                    ></i>
                  </th>
                  <th>Valor Un.</th>
                  <th>Valor Total</th>
                  <th>
                    Código EAN
                    <i class="fas fa-edit" title="Editável"></i>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="product in currentFileProducts"
                  :key="product.id"
                  :class="{ 
                    'product-locked': product.isLocked, 
                    'product-use-supplier': product.useSupplierData 
                  }"
                >
                  <td class="checkbox-cell">
                    <label class="product-checkbox">
                      <input 
                        type="checkbox" 
                        v-model="product.useSupplierData"
                        @change="toggleProductSupplierData(product)"
                        :disabled="product.isLocked"
                      />
                      <span class="checkmark-small"></span>
                    </label>
                  </td>
                  <td :title="product.supplier_code">
                    <strong>{{ product.supplier_code }}</strong>
                    <i v-if="product.isLocked" class="fas fa-lock product-lock-icon" title="Produto já cadastrado - campos bloqueados"></i>
                  </td>
                  <td>
                    <input
                      v-model="product.client_code"
                      :disabled="product.isLocked || product.useSupplierData"
                      @change="updateProduct(product)"
                      class="form-control form-control-sm"
                      :placeholder="product.useSupplierData ? product.supplier_code : ''"
                    />
                  </td>
                  <td :title="product.supplier_description" class="description-cell">
                    {{ product.supplier_description }}
                  </td>
                  <td>
                    <input
                      v-model="product.client_description"
                      :disabled="product.isLocked || product.useSupplierData"
                      @change="updateProduct(product)"
                      class="form-control form-control-sm"
                      :placeholder="product.useSupplierData ? product.supplier_description : ''"
                    />
                  </td>
                  <td>{{ product.quantity }} {{ product.unit }}</td>
                  <td>
                    <input
                      v-model="product.factor"
                      type="number"
                      step="0.01"
                      @change="updateProduct(product)"
                      class="form-control form-control-sm"
                    />
                  </td>
                  <td>{{ formatCurrency(product.unit_value) }}</td>
                  <td>{{ formatCurrency(product.total_value) }}</td>
                  <td>
                    <input
                      v-model="product.ean_code"
                      @change="updateProduct(product)"
                      class="form-control form-control-sm"
                      placeholder="Código EAN"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <button
          v-if="currentFileIndex > 0"
          @click="previousFile"
          :disabled="loading"
          class="btn btn-secondary"
        >
          <i class="fas fa-arrow-left"></i>
          Anterior
        </button>

        <div class="progress-summary">
          <span class="files-completed">{{ completedFiles }} de {{ parsedFiles.length }} concluídos</span>
        </div>

        <button
          v-if="hasNextFile"
          @click="nextFile"
          :disabled="!canProceed || loading"
          class="btn btn-primary"
        >
          <template v-if="loading">
            <i class="fas fa-spinner fa-spin"></i>
            Processando...
          </template>
          <template v-else>
            Próximo
            <i class="fas fa-arrow-right"></i>
          </template>
        </button>

        <button
          v-if="!hasNextFile"
          @click="finalizeBatch"
          :disabled="!canProceed || loading"
          class="btn btn-success"
        >
          <template v-if="loading">
            <i class="fas fa-spinner fa-spin"></i>
            Finalizando...
          </template>
          <template v-else>
            <i class="fas fa-check"></i>
            Finalizar Lote
          </template>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'BatchProductsModal',

  props: {
    showModal: {
      type: Boolean,
      default: false
    },
    parsedFiles: {
      type: Array,
      default: () => []
    },
    selectedClient: {
      type: Object,
      default: null
    },
    receiptDate: {
      type: String,
      default: ''
    }
  },

  data() {
    return {
      currentFileIndex: 0,
      loading: false,
      loadingText: '',
      selectAllProducts: false,
      completedFiles: 0,
      processedSchedules: [],
      sessionProductCache: new Map() // Cache de produtos configurados na sessão atual
    }
  },

  computed: {
    currentFile() {
      return this.parsedFiles[this.currentFileIndex] || null
    },

    currentFileProducts() {
      return this.currentFile?.products || []
    },

    hasNextFile() {
      return this.currentFileIndex < this.parsedFiles.length - 1
    },

    progressPercentage() {
      if (this.parsedFiles.length === 0) return 0
      return Math.round(((this.currentFileIndex + 1) / this.parsedFiles.length) * 100)
    },

    canProceed() {
      if (!this.currentFile || this.currentFileProducts.length === 0) return false
      
      // Verificar se todos os produtos não bloqueados têm os campos obrigatórios preenchidos
      const unlockedProducts = this.currentFileProducts.filter(p => !p.isLocked)
      
      for (const product of unlockedProducts) {
        // Se o produto usa dados do fornecedor, não precisa validar os campos editáveis
        if (product.useSupplierData) {
          continue
        }
        
        // Se não usa dados do fornecedor, os campos client_code e client_description são obrigatórios
        if (!product.client_code || !product.client_code.trim()) {
          return false
        }
        if (!product.client_description || !product.client_description.trim()) {
          return false
        }
      }
      
      return true
    }
  },

  watch: {
    showModal: {
      handler(newVal) {
        if (newVal && this.parsedFiles.length > 0) {
          this.currentFileIndex = 0
          this.completedFiles = 0
          this.processedSchedules = []
          this.sessionProductCache.clear() // Limpar cache ao iniciar nova sessão
          console.log('🆕 Nova sessão de agendamento em lote iniciada - cache limpo')
          this.loadProductsForCurrentFile()
        }
      },
      immediate: true
    },

    currentFileIndex: {
      handler() {
        if (this.showModal) {
          this.loadProductsForCurrentFile()
        }
      }
    }
  },

  methods: {
    async loadProductsForCurrentFile() {
      if (!this.currentFile || !this.selectedClient) return
      
      console.log(`📄 Carregando produtos para NFe ${this.currentFile.nfeData.number} (${this.currentFileIndex + 1}/${this.parsedFiles.length})`)
      console.log(`💾 Cache da sessão atual: ${this.sessionProductCache.size} produtos`)
      
      this.loading = true
      this.loadingText = 'Verificando produtos cadastrados...'
      
      try {
        // Aplicar pré-preenchimento para produtos já cadastrados
        await this.checkExistingProducts()
        
        this.updateSelectAllState()
      } catch (error) {
        console.error('Erro ao carregar produtos:', error)
      } finally {
        this.loading = false
        this.loadingText = ''
      }
    },

    async checkExistingProducts() {
      if (!this.currentFileProducts.length || !this.selectedClient) return

      try {
        console.log('🔍 Buscando pré-preenchimento para produtos da NFe:', this.currentFile.nfeData.number)
        
        const token = localStorage.getItem('token')

        // Preparar dados para a API de pré-preenchimento
        const productsToCheck = this.currentFileProducts.map(product => ({
          supp_code: product.supplier_code || product.code,
          supp_cnpj: this.currentFile.nfeData.supplier_cnpj
        }))

        // Chamar API de pré-preenchimento em lote
        const response = await this.$http.post('/products/batch-prefill', {
          products: productsToCheck,
          cliCnpj: this.selectedClient.cnpj.replace(/[^\d]/g, '')
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.data.success) {
          console.error('Erro ao buscar pré-preenchimento:', response.data.message)
          return
        }

        console.log(`📊 Pré-preenchimento: ${response.data.summary.found} de ${response.data.summary.total} produtos encontrados`)

        // Aplicar pré-preenchimento nos produtos
        response.data.data.forEach((prefillResult, index) => {
          const product = this.currentFileProducts[index]
          const productKey = `${product.supplier_code}_${this.currentFile.nfeData.supplier_cnpj}`
          
          // Primeiro, verificar se o produto foi configurado na sessão atual
          if (this.sessionProductCache.has(productKey)) {
            const sessionData = this.sessionProductCache.get(productKey)
            console.log(`🎯 Pré-preenchendo com dados da sessão: ${product.supplier_code}`)
            
            product.client_code = sessionData.client_code
            product.client_description = sessionData.client_description
            product.factor = sessionData.factor || 1
            product.ean_code = sessionData.ean_code || ''
            product.useSupplierData = sessionData.useSupplierData || false
            product.isLocked = false // Produtos da sessão não ficam bloqueados
            
          } else if (prefillResult.has_data && prefillResult.prefill_data) {
            const prefillData = prefillResult.prefill_data
            
            console.log(`✅ Pré-preenchendo com dados do banco: ${prefillData.supp_code}`)
            
            // Pré-preencher campos editáveis
            product.client_code = prefillData.cli_code
            product.client_description = prefillData.cli_desc
            
            // Marcar como bloqueado se for produto específico do mesmo estoque
            product.isLocked = prefillData.is_locked
            
            if (prefillData.is_locked) {
              console.log(`🔒 Produto ${prefillData.supp_code} bloqueado para alteração`)
            }
          } else {
            console.log(`❌ Produto não encontrado - definindo valores padrão`)
            
            // Produto não encontrado - definir valores padrão
            product.isLocked = false
            product.factor = 1
            product.client_code = ''
            product.client_description = ''
          }
        })

        // Forçar atualização da interface
        this.$forceUpdate()

      } catch (error) {
        console.error('❌ Erro ao aplicar pré-preenchimento:', error)
        
        // Em caso de erro, definir valores padrão para todos os produtos
        this.currentFileProducts.forEach(product => {
          product.isLocked = false
          product.factor = 1
          product.client_code = ''
          product.client_description = ''
        })
        
        this.$forceUpdate()
      }
    },

    toggleProductSupplierData(product) {
      if (product.useSupplierData) {
        // Quando marcado, limpar os campos editáveis e usar dados do fornecedor
        product.client_code = ''
        product.client_description = ''
        
        // Remover do cache da sessão se estava lá
        const productKey = `${product.supplier_code}_${this.currentFile.nfeData.supplier_cnpj}`
        if (this.sessionProductCache.has(productKey)) {
          this.sessionProductCache.delete(productKey)
          console.log(`🗑️ Produto removido do cache (usando dados do fornecedor): ${product.supplier_code}`)
        }
      }
      this.updateProduct(product)
      this.updateSelectAllState()
    },

    toggleAllProducts() {
      const newState = this.selectAllProducts
      this.currentFileProducts.forEach(product => {
        if (!product.isLocked) {
          product.useSupplierData = newState
          if (newState) {
            product.client_code = ''
            product.client_description = ''
          }
        }
      })
      this.$forceUpdate()
    },

    invertProductSelection() {
      this.currentFileProducts.forEach(product => {
        if (!product.isLocked) {
          product.useSupplierData = !product.useSupplierData
          if (product.useSupplierData) {
            product.client_code = ''
            product.client_description = ''
          }
        }
      })
      this.updateSelectAllState()
      this.$forceUpdate()
    },

    updateSelectAllState() {
      const unlockedProducts = this.currentFileProducts.filter(p => !p.isLocked)
      const selectedCount = unlockedProducts.filter(p => p.useSupplierData).length
      
      if (selectedCount === 0) {
        this.selectAllProducts = false
      } else if (selectedCount === unlockedProducts.length) {
        this.selectAllProducts = true
      } else {
        this.selectAllProducts = false
      }
    },

    updateProduct(product) {
      // Forçar reatividade do Vue
      this.$forceUpdate()
      
      // Salvar em tempo real no cache da sessão se o produto estiver configurado
      if (product.client_code && product.client_code.trim() && product.client_description && product.client_description.trim()) {
        const productKey = `${product.supplier_code}_${this.currentFile.nfeData.supplier_cnpj}`
        const productData = {
          client_code: product.client_code,
          client_description: product.client_description,
          factor: product.factor || 1,
          ean_code: product.ean_code || '',
          useSupplierData: product.useSupplierData || false,
          savedAt: new Date().toISOString()
        }
        
        this.sessionProductCache.set(productKey, productData)
        console.log(`🔄 Cache atualizado em tempo real: ${product.supplier_code} → ${product.client_code}`)
      }
    },

    async nextFile() {
      if (!this.canProceed) return
      
      // Salvar arquivo atual
      await this.saveCurrentFile()
      
      // Avançar para próximo arquivo
      this.currentFileIndex++
    },

    previousFile() {
      if (this.currentFileIndex > 0) {
        this.currentFileIndex--
      }
    },

    saveProductsToSessionCache() {
      // Salvar produtos configurados no cache da sessão para usar em próximas notas
      this.currentFileProducts.forEach(product => {
        const productKey = `${product.supplier_code}_${this.currentFile.nfeData.supplier_cnpj}`
        
        // Só salva se o produto foi efetivamente configurado (tem código do cliente)
        if (product.client_code && product.client_code.trim()) {
          const productData = {
            client_code: product.client_code,
            client_description: product.client_description,
            factor: product.factor || 1,
            ean_code: product.ean_code || '',
            useSupplierData: product.useSupplierData || false,
            savedAt: new Date().toISOString()
          }
          
          this.sessionProductCache.set(productKey, productData)
          console.log(`💾 Produto salvo no cache da sessão: ${product.supplier_code} → ${product.client_code}`)
        }
      })
    },

    async saveCurrentFile() {
      if (!this.canProceed) return
      
      // Salvar produtos no cache da sessão primeiro
      this.saveProductsToSessionCache()
      
      this.loading = true
      this.loadingText = `Salvando NFe ${this.currentFile.nfeData.number}...`
      
      try {
        const currentUser = this.getCurrentUser()
        const token = localStorage.getItem('token')
        
        if (!token) {
          throw new Error('Token de autenticação não encontrado')
        }

        const clientCnpj = this.selectedClient.cnpj.replace(/[^\d]/g, '')
        let supplier = this.currentFile.nfeData.supplier_name || this.currentFile.nfeData.supplier_cnpj || ''
        
        if (supplier.length > 50) {
          supplier = supplier.substring(0, 50)
        }

        const scheduleData = {
          number: String(this.currentFile.nfeData.number || '').trim(),
          nfe_key: this.currentFile.nfeData.nfe_key,
          client: clientCnpj,
          case_count: parseInt(this.currentFile.nfeData.case_count) || 0,
          date: this.receiptDate,
          status: 'Solicitado',
          supplier: supplier,
          qt_prod: parseInt(this.currentFile.nfeData.qt_prod) || this.currentFileProducts.length,
          info: this.buildInfoObject(),
          is_booking: false
        }

        console.log(`📦 Salvando agendamento NFe ${this.currentFile.nfeData.number}:`, scheduleData)

        const response = await this.$http.post('/schedules', scheduleData, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        })

        const newScheduleId = response.data.id || response.data.schedule?.id
        console.log(`✅ Agendamento salvo! ID: ${newScheduleId}`)

        // Salvar produtos no banco automaticamente
        await this.saveProductsToDatabase(newScheduleId)
        
        this.processedSchedules.push({
          fileName: this.currentFile.fileName,
          scheduleId: newScheduleId,
          nfeNumber: this.currentFile.nfeData.number,
          products: this.processProductsForSubmission()
        })
        
        this.completedFiles++

      } catch (error) {
        console.error('Erro ao salvar NFe:', error)
        
        // Se erro 409, significa que já foi criado (pode ter acontecido em tentativa anterior)
        if (error.response?.status === 409) {
          console.log('⚠️ NFe já foi processada anteriormente, continuando...')
          
          // Tentar extrair ID do agendamento da mensagem de erro se disponível
          const errorMsg = error.response?.data?.message || ''
          const idMatch = errorMsg.match(/ID:\s*(\d+)/)
          const existingId = idMatch ? parseInt(idMatch[1]) : null
          
          if (existingId) {
            console.log(`📝 Usando ID existente: ${existingId}`)
            
            // Salvar produtos no banco mesmo assim
            try {
              await this.saveProductsToDatabase(existingId)
            } catch (productError) {
              console.error('Erro ao salvar produtos:', productError)
            }
            
            this.processedSchedules.push({
              fileName: this.currentFile.fileName,
              scheduleId: existingId,
              nfeNumber: this.currentFile.nfeData.number,
              products: this.processProductsForSubmission()
            })
            
            this.completedFiles++
          } else {
            throw new Error('NFe duplicada mas não foi possível obter ID do agendamento existente')
          }
        } else {
          throw error
        }
      } finally {
        this.loading = false
        this.loadingText = ''
      }
    },

    async saveProductsToDatabase(scheduleId) {
      const startTime = Date.now()
      
      try {
        this.loadingText = 'Salvando produtos otimizado no banco...'
        
        const products = this.processProductsForSubmission()
        console.log(`⚡ Salvando ${products.length} produtos para NFe ${this.currentFile.nfeData.number}...`)
        
        const token = localStorage.getItem('token')
        
        // OTIMIZAÇÃO: Request otimizado com timeout reduzido
        const response = await this.$http.post('/products/batch-save', {
          scheduleId: scheduleId,
          products: products,
          clientCnpj: this.selectedClient.cnpj.replace(/[^\d]/g, ''),
          supplierCnpj: this.currentFile.nfeData.supplier_cnpj
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          timeout: 30000 // 30 segundos timeout (reduzido de default)
        })
        
        const endTime = Date.now()
        const duration = endTime - startTime
        
        if (response.data.success) {
          const stats = response.data.data.stats
          console.log(`🚀 Produtos salvos otimizados para NFe ${this.currentFile.nfeData.number}:`)
          console.log(`   ✨ ${stats.created} criados, 📝 ${stats.updated} atualizados`)
          console.log(`   ⚡ Tempo: ${duration}ms (Backend: ${response.data.data.stats.performance?.duration_ms || 'N/A'}ms)`)
          console.log(`   📈 Performance: ${response.data.data.stats.performance?.products_per_second || 'N/A'} produtos/seg`)
        }
        
      } catch (error) {
        const endTime = Date.now()
        const duration = endTime - startTime
        
        console.error(`❌ Erro ao salvar produtos no banco (${duration}ms):`, error)
        
        // Não re-throw - o agendamento já foi criado
        // Mas log detalhado do erro para debugging
        if (error.code === 'ECONNABORTED') {
          console.error('⏰ Timeout na operação de salvamento de produtos')
        } else if (error.response) {
          console.error('📡 Erro HTTP:', error.response.status, error.response.data?.error)
        }
      }
    },

    async finalizeBatch() {
      const startTime = Date.now()
      
      try {
        console.log('🏁 Iniciando finalização otimizada do lote...')
        
        // OTIMIZAÇÃO: Salvar último arquivo de forma mais rápida se ainda não foi salvo
        if (this.completedFiles < this.parsedFiles.length) {
          console.log('💾 Salvando último arquivo pendente...')
          await this.saveCurrentFile()
        }
        
        const endTime = Date.now()
        const totalDuration = endTime - startTime
        
        // Emitir resultado final otimizado
        const result = {
          success: true,
          message: `${this.processedSchedules.length} agendamento(s) processado(s) com sucesso em ${totalDuration}ms`,
          processedFiles: this.processedSchedules.map(schedule => ({
            name: schedule.fileName,
            status: 'success',
            message: `Agendamento ID ${schedule.scheduleId} processado`
          })),
          stats: {
            total: this.parsedFiles.length,
            success: this.processedSchedules.length,
            errors: this.parsedFiles.length - this.processedSchedules.length,
            created_schedules: this.processedSchedules.length,
            performance: {
              total_duration_ms: totalDuration,
              avg_per_schedule_ms: Math.round(totalDuration / this.processedSchedules.length),
              schedules_per_second: Math.round((this.processedSchedules.length / totalDuration) * 1000)
            }
          }
        }
        
        console.log('🚀 Lote finalizado com sucesso!')
        console.log(`   📊 ${this.processedSchedules.length} agendamentos processados`)
        console.log(`   ⚡ Tempo total: ${totalDuration}ms`)
        console.log(`   📈 Performance: ${result.stats.performance.schedules_per_second} agendamentos/seg`)
        
        this.$emit('completed', result)
        
      } catch (error) {
        console.error('Erro ao finalizar lote:', error)
        
        const result = {
          success: this.processedSchedules.length > 0,
          message: this.processedSchedules.length > 0 
            ? `${this.processedSchedules.length} agendamento(s) processado(s), mas houve erro no último`
            : 'Erro ao processar agendamentos em lote',
          processedFiles: this.processedSchedules.map(schedule => ({
            name: schedule.fileName,
            status: 'success',
            message: `Agendamento ID ${schedule.scheduleId} processado`
          })),
          stats: {
            total: this.parsedFiles.length,
            success: this.processedSchedules.length,
            errors: this.parsedFiles.length - this.processedSchedules.length
          }
        }
        
        this.$emit('completed', result)
      }
    },

    buildInfoObject() {
      const currentUser = this.getCurrentUser()
      
      return {
        ...this.currentFile.nfeData,
        products: this.processProductsForSubmission(),
        created_by: currentUser?.user || 'Sistema',
        created_at: new Date().toISOString(),
        type: 'nfe_schedule'
      }
    },

    processProductsForSubmission() {
      return this.currentFileProducts.map(product => {
        const processedProduct = { ...product }
        
        // Se o produto está marcado para usar dados do fornecedor
        if (product.useSupplierData) {
          processedProduct.client_code = product.supplier_code
          processedProduct.client_description = product.supplier_description
        }
        
        // Remover propriedades de controle que não devem ir para a API
        delete processedProduct.useSupplierData
        
        return processedProduct
      })
    },

    getCurrentUser() {
      const userData = localStorage.getItem('user')
      return userData ? JSON.parse(userData) : null
    },

    formatCurrency(value) {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(value)
    },

    closeModal() {
      this.$emit('close')
    },

    handleModalClick(event) {
      event.stopPropagation()
    }
  }
}
</script>

<style scoped>
/* Usar os mesmos estilos do ScheduleCreationModal com adaptações */

.modal-overlay {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  background-color: rgba(0, 0, 0, 0.7) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  z-index: 9999 !important;
  padding: 1rem !important;
}

.modal-content {
  background: white !important;
  border-radius: 12px !important;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
  position: relative !important;
  max-height: 95vh !important;
  overflow: hidden !important;
  display: flex !important;
  flex-direction: column !important;
}

.batch-products-modal {
  max-width: 95vw;
  width: 95vw;
  max-height: 95vh;
  z-index: 10000 !important;
}

.modal-header {
  padding: 1.5rem 2rem !important;
  border-bottom: 1px solid #e9ecef !important;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%) !important;
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
  flex-shrink: 0 !important;
}

.modal-header h3 {
  margin: 0 !important;
  color: #343a40 !important;
  font-size: 1.25rem !important;
  font-weight: 600 !important;
  display: flex !important;
  align-items: center !important;
  gap: 0.5rem !important;
}

.btn-close {
  background: none !important;
  border: none !important;
  font-size: 1.5rem !important;
  color: #6c757d !important;
  cursor: pointer !important;
  padding: 0.5rem !important;
  line-height: 1 !important;
  border-radius: 6px !important;
  transition: all 0.2s !important;
}

.btn-close:hover {
  background-color: #f8f9fa !important;
  color: #dc3545 !important;
}

.modal-body {
  flex: 1 !important;
  padding: 1.5rem 2rem !important;
  overflow-y: auto !important;
}

.modal-footer {
  padding: 1.5rem 2rem !important;
  border-top: 1px solid #e9ecef !important;
  background: #f8f9fa !important;
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
  flex-shrink: 0 !important;
  gap: 1rem !important;
}

.progress-steps {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-bottom: 1px solid #dee2e6;
}

.step-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: #495057;
}

.step-current {
  color: #007bff;
  font-size: 1.3rem;
}

.step-separator {
  color: #6c757d;
}

.step-total {
  color: #6c757d;
}

.step-label {
  margin-left: 1rem;
  color: #343a40;
  font-weight: 500;
}

.progress-bar-container {
  width: 100%;
  height: 8px;
  background-color: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #007bff 0%, #28a745 100%);
  transition: width 0.3s ease;
  border-radius: 4px;
}

.current-file-info {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #007bff;
}

.current-file-info h4 {
  margin: 0 0 0.75rem 0;
  color: #343a40;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.file-details {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.detail {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.9rem;
  color: #6c757d;
  background: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.detail i {
  color: #007bff;
}

.progress-summary {
  flex: 1;
  text-align: center;
  font-weight: 600;
  color: #495057;
}

.files-completed {
  font-size: 0.9rem;
}

/* Estilos da tabela de produtos copiados do ScheduleCreationModal */
.products-section {
  margin-top: 1rem;
}

.products-controls {
  margin-bottom: 1rem;
  padding: 0.75rem 1rem;
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  position: relative;
}

.checkbox-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.left-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.products-table-container {
  width: 100%;
  overflow-x: auto;
  overflow-y: auto;
  margin-top: 1rem;
  max-width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e0 #f7fafc;
  background: white;
  max-height: 400px;
}

.products-table-container::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.products-table-container::-webkit-scrollbar-track {
  background: #f7fafc;
  border-radius: 4px;
}

.products-table-container::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 4px;
}

.products-table {
  width: 100%;
  min-width: 1000px;
  border-collapse: collapse;
  font-size: 0.85rem;
  table-layout: fixed;
  border-spacing: 0;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.products-table th,
.products-table td {
  border: 1px solid #ddd;
  padding: 8px 6px;
  text-align: left;
  vertical-align: top;
}

.products-table th {
  background-color: #f5f5f5;
  font-weight: 600;
  font-size: 0.8rem;
  position: sticky;
  top: 0;
  z-index: 10;
}

.form-control-sm {
  font-size: 0.8rem;
  padding: 2px 4px;
  height: auto;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  border: 1px solid #ccc;
  border-radius: 3px;
}

.master-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: #333;
  cursor: pointer;
  user-select: none;
}

.master-checkbox input[type="checkbox"] {
  margin: 0;
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.invert-btn {
  background: white;
  border: 1px solid #6c757d;
  color: #6c757d;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.invert-btn:hover {
  background: #6c757d;
  color: white;
}

.product-checkbox {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.product-checkbox input[type="checkbox"] {
  display: none;
}

.checkmark-small {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: 2px solid #007bff;
  border-radius: 3px;
  background-color: #fff;
  transition: all 0.2s ease;
  margin: 0;
}

.product-checkbox input[type="checkbox"]:checked + .checkmark-small {
  background-color: #007bff;
  border-color: #007bff;
}

.product-checkbox input[type="checkbox"]:checked + .checkmark-small::after {
  content: '✓';
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.product-checkbox input[type="checkbox"]:disabled + .checkmark-small {
  opacity: 0.5;
  cursor: not-allowed;
}

.products-hint {
  font-size: 0.9rem;
  color: #dc3545;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.product-locked {
  background-color: #f0fff0 !important;
  border-left: 4px solid #28a745 !important;
}

.product-use-supplier {
  background-color: #e6f3ff !important;
  border-left: 4px solid #007bff !important;
}

.form-control-sm:disabled {
  background-color: #e8f5e8 !important;
  border: 2px solid #c3e6c3 !important;
  color: #2d5a2d !important;
  cursor: not-allowed !important;
}

.product-use-supplier .form-control-sm:disabled {
  background-color: #e6f3ff !important;
  border: 2px solid #b3d9ff !important;
  color: #004085 !important;
  cursor: not-allowed !important;
}

.checkbox-cell {
  text-align: center !important;
  width: 50px !important;
}

.description-cell {
  word-wrap: break-word;
  word-break: break-word;
  white-space: normal;
  max-width: 200px;
  line-height: 1.3;
}

/* Larguras das colunas */
.products-table th:nth-child(1), .products-table td:nth-child(1) { width: 5%; min-width: 50px; }
.products-table th:nth-child(2), .products-table td:nth-child(2) { width: 12%; min-width: 80px; }
.products-table th:nth-child(3), .products-table td:nth-child(3) { width: 12%; min-width: 80px; }
.products-table th:nth-child(4), .products-table td:nth-child(4) { width: 24%; min-width: 150px; }
.products-table th:nth-child(5), .products-table td:nth-child(5) { width: 19%; min-width: 120px; }
.products-table th:nth-child(6), .products-table td:nth-child(6) { width: 8%; min-width: 60px; }
.products-table th:nth-child(7), .products-table td:nth-child(7) { width: 7%; min-width: 50px; }
.products-table th:nth-child(8), .products-table td:nth-child(8) { width: 7%; min-width: 70px; }
.products-table th:nth-child(9), .products-table td:nth-child(9) { width: 7%; min-width: 70px; }
.products-table th:nth-child(10), .products-table td:nth-child(10) { width: 9%; min-width: 80px; }

.product-lock-icon {
  color: #28a745;
  font-size: 14px;
  margin-left: 4px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
}

.loading-container i {
  font-size: 2rem;
  color: #007bff;
  margin-bottom: 1rem;
}

.loading-container p {
  color: #495057;
  font-size: 1.1rem;
  margin: 0;
}

/* Responsividade */
@media (max-width: 1200px) {
  .batch-products-modal {
    max-width: 98vw;
    width: 98vw;
  }
}

@media (max-width: 768px) {
  .step-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
  
  .file-details {
    flex-direction: column;
    gap: 0.5rem;
  }
}

/* Estilos para botões */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  margin: 0;
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.5;
  color: #212529;
  text-align: center;
  text-decoration: none;
  vertical-align: middle;
  cursor: pointer;
  user-select: none;
  border: 1px solid transparent;
  border-radius: 0.375rem;
  transition: all 0.15s ease-in-out;
  gap: 0.5rem;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  color: #fff;
  background-color: #007bff;
  border-color: #007bff;
}

.btn-primary:hover:not(:disabled) {
  background-color: #0056b3;
  border-color: #004085;
}

.btn-secondary {
  color: #fff;
  background-color: #6c757d;
  border-color: #6c757d;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #545b62;
  border-color: #4e555b;
}

.btn-success {
  color: #fff;
  background-color: #28a745;
  border-color: #28a745;
}

.btn-success:hover:not(:disabled) {
  background-color: #1e7e34;
  border-color: #1c7430;
}

/* Estilos específicos para botões do modal */
.modal-footer .btn {
  min-width: 100px;
}

/* Forçar z-index máximo para garantir que fique acima da sidebar */
.batch-products-modal .modal-overlay {
  z-index: 99999 !important;
}

.batch-products-modal .modal-content {
  z-index: 99999 !important;
}
</style>