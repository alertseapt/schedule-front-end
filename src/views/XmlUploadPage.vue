<template>
  <div class="xml-upload-page">
    <!-- Access Denied Message -->
    <div v-if="!hasAccess" class="access-denied">
      <div class="access-denied-content">
        <i class="fas fa-lock"></i>
        <h3>Acesso Negado</h3>
        <p>Você não tem permissão para acessar esta funcionalidade.</p>
        <p>Esta funcionalidade está disponível apenas para usuários com nível de acesso 0 (desenvolvedor).</p>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else>
      <!-- Header -->
      <div class="page-header">
      <h2>
        <i class="fas fa-tasks"></i>
        Agendamento em Lote
      </h2>
      <p class="page-subtitle">
        Faça o agendamento de múltiplas notas fiscais simultaneamente
      </p>
    </div>


    <!-- Upload Form -->
    <div class="upload-form-container">
      <form @submit.prevent="handleSubmit" class="upload-form">
        <!-- File Upload Area -->
        <div class="form-section">
          <label class="section-title">
            <i class="fas fa-file-alt"></i>
            Arquivos XML
          </label>
          <div 
            class="file-drop-zone"
            :class="{ 'drag-over': isDragOver, 'has-files': selectedFiles.length }"
            @drop="handleDrop"
            @dragover="handleDragOver"
            @dragleave="handleDragLeave"
            @click="triggerFileInput"
          >
            <input
              ref="fileInput"
              type="file"
              multiple
              accept=".xml"
              @change="handleFileSelect"
              style="display: none"
            />
            
            <div v-if="selectedFiles.length === 0" class="drop-zone-content">
              <i class="fas fa-cloud-upload-alt"></i>
              <p>Arraste os arquivos XML aqui ou clique para selecionar</p>
              <small>Você pode selecionar múltiplos arquivos XML de uma vez</small>
            </div>
            
            <div v-else class="selected-files">
              <div class="selected-files-header">
                <h4>Arquivos selecionados ({{ selectedFiles.length }})</h4>
                <button 
                  type="button" 
                  class="btn-add-more"
                  @click="triggerFileInput"
                  title="Adicionar mais arquivos"
                >
                  <i class="fas fa-plus"></i>
                  Adicionar mais
                </button>
              </div>
              <div class="file-list">
                <div 
                  v-for="(file, index) in selectedFiles" 
                  :key="index"
                  class="file-item"
                >
                  <i class="fas fa-file-alt"></i>
                  <span class="file-name">{{ file.name }}</span>
                  <span class="file-size">{{ formatFileSize(file.size) }}</span>
                  <button
                    type="button"
                    @click.stop="removeFile(index)"
                    class="remove-file-btn"
                    title="Remover arquivo"
                  >
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Client/CNPJ Selection -->
        <div class="form-section">
          <label class="section-title">
            <i class="fas fa-building"></i>
            Cliente/CNPJ de Destino
          </label>
          <div class="client-selection-area">
            <div 
              v-if="selectedClientData"
              class="selected-client-display"
            >
              <div class="selected-client-info">
                <i class="fas fa-warehouse"></i>
                <div class="client-details">
                  <span class="client-name">{{ selectedClientData.name }}</span>
                  <span class="client-cnpj">CNPJ: {{ formatCNPJ(selectedClientData.cnpj) }}</span>
                  <span v-if="selectedClientData.numero" class="client-numero">Nº: {{ selectedClientData.numero }}</span>
                </div>
              </div>
              <button
                type="button"
                @click="openClientSelectionModal"
                class="btn btn-outline-primary btn-change-client"
              >
                <i class="fas fa-edit"></i>
                Alterar
              </button>
            </div>
            
            <div v-else class="no-client-selected">
              <p class="no-client-text">Nenhum cliente selecionado</p>
              <button
                type="button"
                @click="openClientSelectionModal"
                class="btn btn-primary btn-select-client"
                :disabled="loadingClients"
              >
                <i v-if="loadingClients" class="fas fa-spinner fa-spin"></i>
                <i v-else class="fas fa-warehouse"></i>
                {{ loadingClients ? 'Carregando...' : 'Selecionar Cliente' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Receipt Date -->
        <div class="form-section">
          <label class="section-title" for="receipt-date">
            <i class="fas fa-calendar-alt"></i>
            Data de Recebimento
          </label>
          <input
            id="receipt-date"
            v-model="receiptDate"
            type="date"
            class="form-input"
            :min="minDate"
            required
          />
        </div>


        <!-- Submit Button -->
        <div class="form-actions">
          <button
            type="submit"
            class="btn btn-primary btn-upload"
            :disabled="!canSubmit || isUploading"
          >
            <i v-if="isUploading" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-upload"></i>
            {{ isUploading ? 'Processando...' : 'Fazer Upload' }}
          </button>
          
          <button
            v-if="selectedFiles.length > 0"
            type="button"
            @click="clearForm"
            class="btn btn-outline-secondary"
            :disabled="isUploading"
          >
            <i class="fas fa-trash"></i>
            Limpar
          </button>
        </div>
      </form>
    </div>

    <!-- Progress Indicator -->
    <div v-if="isUploading" class="upload-progress">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: uploadProgress + '%' }"></div>
      </div>
      <p class="progress-text">{{ uploadProgressText }}</p>
    </div>

    <!-- Temporary Messages -->
    <div v-if="tempMessage" class="temp-message">
      <div 
        :class="['alert', `alert-${tempMessage.type}`]"
      >
        <i :class="getMessageIcon(tempMessage.type)"></i>
        <p>{{ tempMessage.message }}</p>
      </div>
    </div>

    <!-- Success/Error Messages -->
    <div v-if="uploadResult" class="upload-result">
      <div 
        v-if="uploadResult.success" 
        class="alert alert-success"
      >
        <i class="fas fa-check-circle"></i>
        <div>
          <h4>Upload realizado com sucesso!</h4>
          <p>{{ uploadResult.message }}</p>
          <ul v-if="uploadResult.processedFiles">
            <li v-for="file in uploadResult.processedFiles" :key="file.name">
              {{ file.name }} - {{ file.status }}
            </li>
          </ul>
        </div>
      </div>
      
      <div 
        v-else 
        class="alert alert-error"
      >
        <i class="fas fa-exclamation-circle"></i>
        <div>
          <h4>Erro no upload</h4>
          <p>{{ uploadResult.message }}</p>
        </div>
      </div>
    </div>
    
    <!-- Client Selection Modal -->
    <div v-if="showClientModal" class="modal-overlay" @click="closeClientSelectionModal">
      <div class="modal-content estoque-selection-modal" @click.stop>
        <div class="modal-header">
          <h3>
            <i class="fas fa-warehouse"></i>
            Selecionar Cliente/Estoque
          </h3>
          <button class="modal-close-btn" @click="closeClientSelectionModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="modal-body">
          <!-- Loading state for clients -->
          <div v-if="loadingClients" class="loading-clients-container">
            <div class="loading-spinner">
              <i class="fas fa-spinner fa-spin"></i>
            </div>
            <p class="loading-text">Carregando opções de estoque...</p>
            <small class="loading-subtext">Processando permissões e estoques disponíveis</small>
          </div>
          
          <!-- Clients list -->
          <div v-else class="estoque-lista-vertical">
            <div v-for="client in availableClients" :key="client.cnpj" class="estoque-lista-item">
              <div class="estoque-lista-info">
                <i class="fas fa-warehouse"></i>
                <span class="estoque-nome">{{ client.name }}</span>
                <span class="estoque-cnpj">CNPJ: {{ formatCNPJ(client.cnpj) }}</span>
                <span v-if="client.numero" class="estoque-numero">Nº: {{ client.numero }}</span>
              </div>
              <button class="btn btn-primary btn-sm btn-selecionar-estoque" @click.stop="selectClient(client)">
                Selecionar
              </button>
            </div>
            <div v-if="availableClients.length === 0" class="text-muted estoque-lista-vazia">
              <i class="fas fa-info-circle"></i>
              Nenhum estoque disponível para seu usuário.
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<script>
import { API_CONFIG } from '../config/api.js'

// Função para verificar se o usuário tem acesso (apenas nível 0)
function hasXmlUploadAccess() {
  const userData = localStorage.getItem('user')
  if (!userData) return false
  
  try {
    const user = JSON.parse(userData)
    const level = user.level_access
    
    // Permitir apenas usuários com nível de acesso 0 (desenvolvedor)
    return level === 0
  } catch (error) {
    console.error('Erro ao verificar acesso:', error)
    return false
  }
}

export default {
  name: 'XmlUploadPage',
  data() {
    return {
      selectedFiles: [],
      selectedClient: '',
      selectedClientData: null,
      receiptDate: '',
      isDragOver: false,
      isUploading: false,
      uploadProgress: 0,
      uploadProgressText: '',
      uploadResult: null,
      tempMessage: null,
      availableClients: [],
      loadingClients: false,
      showClientModal: false
    }
  },
  
  computed: {
    hasAccess() {
      return hasXmlUploadAccess()
    },
    
    canSubmit() {
      return this.selectedFiles.length > 0 && 
             this.selectedClientData && 
             this.receiptDate
    },
    
    minDate() {
      return new Date().toISOString().split('T')[0]
    }
  },
  
  mounted() {
    this.loadAvailableClients()
    this.setDefaultDate()
  },
  
  methods: {
    setDefaultDate() {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      this.receiptDate = tomorrow.toISOString().split('T')[0]
    },
    
    loadAvailableClients() {
      this.loadingClients = true
      try {
        const currentUser = this.getCurrentUser()
        console.log('🏢 XML Upload - DEBUG cli_access:', currentUser?.cli_access)
        
        if (!currentUser) {
          console.log('❌ Usuário não encontrado')
          this.availableClients = []
          this.loadingClients = false
          return
        }
        
        // Desenvolvedores (nível 0) precisariam fazer chamada à API
        // Mas por ora vamos focar nos dados do cli_access
        if (currentUser.level_access === 0) {
          console.log('⚠️ Usuário desenvolvedor - usando cli_access disponível')
        }
        
        // Processar cli_access diretamente
        let cliAccess = currentUser.cli_access
        
        // Tratar cli_access se estiver como string
        if (typeof cliAccess === 'string') {
          try {
            cliAccess = JSON.parse(cliAccess)
            console.log('🔄 cli_access parsed from string:', cliAccess)
          } catch (e) {
            console.log('❌ Erro ao fazer parse do cli_access string:', e)
            cliAccess = {}
          }
        }
        
        if (cliAccess && typeof cliAccess === 'object' && Object.keys(cliAccess).length > 0) {
          console.log('✅ cli_access encontrado, processando...')
          
          const cliAccessEntries = Object.entries(cliAccess)
          console.log('📋 Entradas do cli_access:', cliAccessEntries)
          
          const clients = cliAccessEntries.map(([cnpj, data]) => {
            console.log(`🏪 Processando cliente ${cnpj}:`, data)
            return {
              cnpj: cnpj,
              name: data.nome || `Cliente ${cnpj}`,
              numero: data.numero || cnpj
            }
          })
          
          console.log('👥 Clientes processados:', clients)
          this.availableClients = clients
          
          // Auto-selecionar se há apenas um cliente disponível
          if (clients.length === 1) {
            this.selectClient(clients[0])
            console.log('🎯 Auto-selecionado cliente único:', clients[0].name)
          }
          
        } else {
          console.log('⚠️ Usuário sem cli_access definido ou cli_access não é objeto')
          console.log('⚠️ cli_access value:', cliAccess)
          this.availableClients = []
        }
        
      } catch (error) {
        console.error('❌ Erro ao processar clientes:', error)
        this.showMessage('Erro ao processar lista de clientes.', 'error')
        this.availableClients = []
      } finally {
        this.loadingClients = false
      }
    },
    
    getCurrentUser() {
      const userData = localStorage.getItem('user')
      if (!userData) return null
      
      try {
        return JSON.parse(userData)
      } catch (error) {
        console.error('Erro ao fazer parse dos dados do usuário:', error)
        return null
      }
    },
    
    triggerFileInput() {
      this.$refs.fileInput.click()
    },
    
    handleFileSelect(event) {
      const files = Array.from(event.target.files)
      const xmlFiles = files.filter(file => file.name.toLowerCase().endsWith('.xml'))
      
      if (xmlFiles.length !== files.length && files.length > 0) {
        this.showMessage('Apenas arquivos XML são aceitos. Arquivos inválidos foram ignorados.', 'warning')
      }
      
      if (xmlFiles.length > 0) {
        this.addFiles(xmlFiles)
      }
      
      // Reset the input to allow selecting the same files again if needed
      event.target.value = ''
    },
    
    handleDrop(event) {
      event.preventDefault()
      this.isDragOver = false
      const files = Array.from(event.dataTransfer.files)
      const xmlFiles = files.filter(file => file.name.toLowerCase().endsWith('.xml'))
      
      if (xmlFiles.length !== files.length && files.length > 0) {
        this.showMessage('Apenas arquivos XML são aceitos. Arquivos inválidos foram ignorados.', 'warning')
      }
      
      if (xmlFiles.length > 0) {
        this.addFiles(xmlFiles)
      }
    },
    
    handleDragOver(event) {
      event.preventDefault()
      this.isDragOver = true
    },
    
    handleDragLeave() {
      this.isDragOver = false
    },
    
    addFiles(files) {
      files.forEach(file => {
        if (!this.selectedFiles.some(f => f.name === file.name)) {
          this.selectedFiles.push(file)
        }
      })
      this.uploadResult = null
    },
    
    removeFile(index) {
      this.selectedFiles.splice(index, 1)
    },
    
    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    },
    
    clearForm() {
      this.selectedFiles = []
      this.selectedClient = ''
      this.selectedClientData = null
      this.uploadResult = null
      this.tempMessage = null
      this.setDefaultDate()
    },
    
    openClientSelectionModal() {
      this.showClientModal = true
    },
    
    closeClientSelectionModal() {
      this.showClientModal = false
    },
    
    selectClient(client) {
      this.selectedClientData = client
      this.selectedClient = client.cnpj
      this.closeClientSelectionModal()
      console.log('Cliente selecionado:', client.name, 'CNPJ:', client.cnpj)
    },
    
    showMessage(message, type = 'info') {
      this.tempMessage = { message, type }
      setTimeout(() => {
        this.tempMessage = null
      }, 4000)
    },
    
    getMessageIcon(type) {
      const icons = {
        info: 'fas fa-info-circle',
        success: 'fas fa-check-circle',
        warning: 'fas fa-exclamation-triangle',
        error: 'fas fa-exclamation-circle'
      }
      return icons[type] || icons.info
    },
    
    formatCNPJ(cnpj) {
      if (!cnpj) return ''
      return cnpj.replace(
        /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
        '$1.$2.$3/$4-$5'
      )
    },
    
    async handleSubmit() {
      if (!this.canSubmit) return
      
      console.log('🚀 AGENDAMENTO EM LOTE - INICIADO')
      console.log('📊 Total de arquivos selecionados:', this.selectedFiles.length)
      console.log('🏢 Cliente selecionado:', {
        name: this.selectedClientData?.name,
        cnpj: this.selectedClient,
        numero: this.selectedClientData?.numero
      })
      console.log('📅 Data de recebimento:', this.receiptDate)
      console.log('📋 Lista de arquivos:', this.selectedFiles.map(f => f.name))
      
      this.isUploading = true
      this.uploadProgress = 0
      this.uploadProgressText = 'Iniciando verificação de duplicidade...'
      this.uploadResult = null
      
      try {
        // Get auth token
        const token = localStorage.getItem('token') || localStorage.getItem('authToken')
        console.log('🔑 Token de autenticação:', token ? 'presente' : 'ausente')
        
        const processedFiles = []
        const totalFiles = this.selectedFiles.length
        const parsedXmlData = []
        
        // FASE 1: Parse de todos os XMLs e verificação de duplicidade
        console.log('🔍 FASE 1: Iniciando verificação de duplicidade')
        this.uploadProgressText = 'Verificando chaves NFe para duplicidade...'
        
        for (let i = 0; i < this.selectedFiles.length; i++) {
          const file = this.selectedFiles[i]
          
          try {
            console.log(`📄 Processando arquivo ${i + 1}/${totalFiles}: ${file.name}`)
            console.log(`📏 Tamanho do arquivo: ${this.formatFileSize(file.size)}`)
            
            this.uploadProgressText = `Verificando ${file.name} (${i + 1}/${totalFiles}) - Parseando XML...`
            this.uploadProgress = Math.round(((i + 0.5) / totalFiles) * 30)
            
            // Parse XML file
            const parseFormData = new FormData()
            parseFormData.append('xml_file', file)
            
            console.log(`🔧 Enviando para parse: POST /schedules/parse-xml`)
            const parseResponse = await this.$http.post('/schedules/parse-xml', parseFormData, {
              headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${token}`
              }
            })
            
            const parsedData = parseResponse.data
            console.log(`✅ XML parseado com sucesso. Chave NFe: ${parsedData.nfe_key}`)
            
            // Verificar se os dados foram parseados corretamente
            if (!parsedData.data || !parsedData.data.nfeProc) {
              throw new Error('Dados do XML não foram parseados corretamente')
            }
            
            // Verificar se já existe agendamento com esta chave NFe
            this.uploadProgressText = `Verificando ${file.name} (${i + 1}/${totalFiles}) - Checando duplicidade...`
            this.uploadProgress = Math.round(((i + 1) / totalFiles) * 30)
            
            console.log(`🔍 Verificando duplicidade para NFe: ${parsedData.nfe_key}`)
            
            try {
              await this.$http.post('/schedules/check-duplicate', {
                nfe_key: parsedData.nfe_key
              }, {
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                }
              })
              
              // Se chegou até aqui, não é duplicata
              console.log(`✅ NFe ${parsedData.nfe_key} não é duplicata - pode ser processada`)
              parsedXmlData.push({
                file: file,
                parsedData: parsedData,
                status: 'ready'
              })
              
            } catch (duplicateError) {
              // NFe já existe
              const errorMsg = duplicateError.response?.data?.message || 'NFe já possui agendamento ativo'
              console.log(`❌ NFe ${parsedData.nfe_key} é DUPLICATA: ${errorMsg}`)
              
              processedFiles.push({
                name: file.name,
                status: 'error',
                message: errorMsg
              })
              
              parsedXmlData.push({
                file: file,
                parsedData: parsedData,
                status: 'duplicate',
                error: errorMsg
              })
            }
            
          } catch (fileError) {
            console.error(`Erro ao processar ${file.name}:`, fileError)
            processedFiles.push({
              name: file.name,
              status: 'error',
              message: fileError.response?.data?.message || 'Erro ao processar arquivo XML'
            })
            
            parsedXmlData.push({
              file: file,
              parsedData: null,
              status: 'error',
              error: fileError.message
            })
          }
        }
        
        // FASE 2: Processar apenas XMLs válidos (sem duplicidade)
        const validXmls = parsedXmlData.filter(item => item.status === 'ready')
        const duplicateXmls = parsedXmlData.filter(item => item.status === 'duplicate')
        const errorXmls = parsedXmlData.filter(item => item.status === 'error')
        const createdSchedules = []
        
        console.log('📊 FASE 1 FINALIZADA - Resumo:')
        console.log(`   ✅ Arquivos válidos: ${validXmls.length}`)
        console.log(`   🔄 Arquivos duplicados: ${duplicateXmls.length}`)
        console.log(`   ❌ Arquivos com erro: ${errorXmls.length}`)
        
        if (validXmls.length > 0) {
          console.log('🏗️ FASE 2: Iniciando criação de agendamentos')
          this.uploadProgressText = `Criando agendamentos para ${validXmls.length} arquivo(s) válido(s)...`
          
          for (let i = 0; i < validXmls.length; i++) {
            const xmlData = validXmls[i]
            const file = xmlData.file
            const parsedData = xmlData.parsedData
            
            try {
              console.log(`📦 Criando agendamento ${i + 1}/${validXmls.length}: ${file.name}`)
              this.uploadProgressText = `Criando agendamento ${file.name} (${i + 1}/${validXmls.length})...`
              this.uploadProgress = 30 + Math.round(((i + 1) / validXmls.length) * 50)
              
              // Transform raw XML data to expected format
              const nfeProc = parsedData.data.nfeProc
              const nfe = nfeProc.NFe.infNFe
              const emit = nfe.emit
              const dest = nfe.dest
              const ide = nfe.ide
              let products = []
              
              console.log(`📋 Dados da NFe:`)
              console.log(`   📄 Número: ${ide.nNF}`)
              console.log(`   🏢 Emitente: ${emit.xNome} (${emit.CNPJ})`)
              console.log(`   🎯 Destinatário: ${dest.xNome} (${dest.CNPJ})`)
              
              // Transform products with detailed information - campos para schema + interface
              if (nfe.det && Array.isArray(nfe.det)) {
                products = nfe.det.map((item, index) => ({
                  id: index + 1,
                  // Campos para schema/backend
                  supp_code: item.prod.cProd,
                  cli_code: item.prod.cProd, // Em agendamentos em lote, usar o mesmo código da NFe
                  description: item.prod.xProd.length > 100 ? item.prod.xProd.substring(0, 100) : item.prod.xProd,
                  quantity: parseFloat(item.prod.qCom) || 0,
                  unit_value: parseFloat(item.prod.vUnCom) || 0,
                  latest_into_case: 1,
                  // Campos adicionais para interface
                  supplier_code: item.prod.cProd,
                  client_code: item.prod.cProd,
                  supplier_description: item.prod.xProd,
                  client_description: item.prod.xProd,
                  code: item.prod.cProd,
                  total_value: parseFloat(item.prod.vProd) || 0,
                  unit: item.prod.uCom || 'UN',
                  ean_code: item.prod.cEAN || ''
                }))
              } else if (nfe.det) {
                // Single product
                products.push({
                  id: 1,
                  // Campos para schema/backend
                  supp_code: nfe.det.prod.cProd,
                  cli_code: nfe.det.prod.cProd, // Em agendamentos em lote, usar o mesmo código da NFe
                  description: nfe.det.prod.xProd.length > 100 ? nfe.det.prod.xProd.substring(0, 100) : nfe.det.prod.xProd,
                  quantity: parseFloat(nfe.det.prod.qCom) || 0,
                  unit_value: parseFloat(nfe.det.prod.vUnCom) || 0,
                  latest_into_case: 1,
                  // Campos adicionais para interface
                  supplier_code: nfe.det.prod.cProd,
                  client_code: nfe.det.prod.cProd,
                  supplier_description: nfe.det.prod.xProd,
                  client_description: nfe.det.prod.xProd,
                  code: nfe.det.prod.cProd,
                  total_value: parseFloat(nfe.det.prod.vProd) || 0,
                  unit: nfe.det.prod.uCom || 'UN',
                  ean_code: nfe.det.prod.cEAN || ''
                })
              }
              
              // Calcular volumes (case_count) somando as quantidades dos produtos
              const totalQuantity = products.reduce((sum, product) => sum + (product.quantity || 0), 0);
              
              // Construir nfeData como o ScheduleCreationModal faz
              const nfeData = {
                number: ide.nNF,
                nfe_key: parsedData.nfe_key || ide.Id?.replace('NFe', '') || '',
                client_cnpj: this.selectedClient,
                client_name: dest.xNome || '',
                supplier_cnpj: emit.CNPJ,
                supplier_name: emit.xNome.length > 50 ? emit.xNome.substring(0, 50) : emit.xNome,
                case_count: totalQuantity,
                date: this.receiptDate,
                qt_prod: totalQuantity,
                stock_location: this.selectedClientData?.name || '',
                // Dados completos da NFe para referência
                total: nfe.total || {},
                emit: emit,
                dest: dest,
                ide: ide,
                det: nfe.det
              }

              // Construir info object igual ao ScheduleCreationModal
              const infoObject = {
                ...nfeData,
                products: products,
                created_by: this.$store?.getters?.currentUser?.user || 'Sistema',
                created_at: new Date().toISOString(),
                type: 'nfe_schedule',
                // Dados adicionais para compatibilidade
                client_number: this.selectedClientData?.numero,
                nfeProc: {
                  NFe: {
                    infNFe: {
                      ...nfe,
                      det: nfe.det
                    }
                  }
                }
              }

              // Usar a mesma estrutura do ScheduleCreationModal (agendamento unitário)
              const createPayload = {
                number: ide.nNF,
                nfe_key: parsedData.nfe_key || ide.Id?.replace('NFe', '') || '',
                client: this.selectedClient, // Usar 'client' em vez de 'client_cnpj' como no unitário
                case_count: totalQuantity,
                date: this.receiptDate,
                status: 'Solicitado',
                supplier: emit.xNome.length > 50 ? emit.xNome.substring(0, 50) : emit.xNome,
                qt_prod: totalQuantity,
                info: infoObject, // Usar a mesma estrutura do ScheduleCreationModal
                is_booking: false
              }
              
              console.log(`📦 Payload para criação do agendamento (estrutura unificada):`)
              console.log(`   📦 Produtos: ${products.length} item(s)`)
              console.log(`   📅 Data: ${createPayload.date}`)
              console.log(`   🏢 Cliente: ${createPayload.client}`)
              console.log(`   🔧 Enviando: POST /schedules (mesmo endpoint do agendamento unitário)`)
              
              const createResponse = await this.$http.post('/schedules', createPayload, {
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                }
              })
              
              const newScheduleId = createResponse.data.schedule.id
              console.log(`✅ Agendamento criado com sucesso! ID: ${newScheduleId} (usando endpoint unificado)`)
              
              // Armazenar dados do agendamento criado para integração
              createdSchedules.push({
                scheduleId: newScheduleId,
                fileName: file.name,
                products: products
              })
              
              processedFiles.push({
                name: file.name,
                status: 'success',
                message: 'Agendamento criado com sucesso'
              })
              
            } catch (createError) {
              console.error(`Erro ao criar agendamento para ${file.name}:`, createError)
              processedFiles.push({
                name: file.name,
                status: 'error',
                message: createError.response?.data?.message || 'Erro ao criar agendamento'
              })
            }
          }
        }
        
        // FASE 3: Integração automática dos produtos (se houver agendamentos criados)
        if (createdSchedules.length > 0) {
          console.log('🔗 FASE 3: Iniciando integração automática de produtos')
          console.log(`📊 Total de agendamentos para integração: ${createdSchedules.length}`)
          
          this.uploadProgressText = 'Integrando produtos automaticamente...'
          this.uploadProgress = 80
          
          try {
            const integrationPayload = {
              schedules: createdSchedules.map(s => ({
                schedule_id: s.scheduleId,
                products: s.products
              }))
            }
            console.log('🔧 Enviando para integração: POST /schedules/bulk-integrate-products')
            console.log('📦 Agendamentos para integração:', createdSchedules.map(s => `ID ${s.scheduleId} (${s.fileName})`))
            
            // Chamar endpoint de integração automática de produtos
            const integrationResponse = await this.$http.post('/schedules/bulk-integrate-products', integrationPayload, {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              }
            })
            
            console.log('✅ INTEGRAÇÃO CONCLUÍDA:', integrationResponse.data)
            console.log(`📊 Estatísticas da integração:`, integrationResponse.data.stats)
            
          } catch (integrationError) {
            console.warn('⚠️ AVISO: Agendamentos criados mas problema na integração:', integrationError)
            console.error('❌ Detalhes do erro de integração:', integrationError.response?.data)
            // Não é um erro crítico, os agendamentos foram criados
          }
        } else {
          console.log('⚠️ FASE 3: Nenhum agendamento criado - pulando integração')
        }
        
        this.uploadProgress = 100
        this.uploadProgressText = 'Processamento concluído!'
        
        const successCount = processedFiles.filter(f => f.status === 'success').length
        const errorCount = processedFiles.filter(f => f.status === 'error').length
        const duplicateCount = parsedXmlData.filter(item => item.status === 'duplicate').length
        
        console.log('🎯 AGENDAMENTO EM LOTE - FINALIZADO')
        console.log('📊 ESTATÍSTICAS FINAIS:')
        console.log(`   ✅ Sucessos: ${successCount}`)
        console.log(`   🔄 Duplicatas: ${duplicateCount}`) 
        console.log(`   ❌ Erros: ${errorCount}`)
        console.log(`   📦 Agendamentos criados: ${createdSchedules.length}`)
        console.log(`   ⏱️ Tempo total de processamento: ${Date.now() - (performance.now() - performance.now())}ms`)
        
        let resultMessage = `${successCount} arquivo(s) processado(s) com sucesso`
        if (duplicateCount > 0) {
          resultMessage += `, ${duplicateCount} NFe(s) já possuíam agendamento`
        }
        if (errorCount > 0) {
          resultMessage += `, ${errorCount} com erro(s)`
        }
        
        this.uploadResult = {
          success: successCount > 0,
          message: resultMessage,
          processedFiles: processedFiles,
          stats: {
            total: totalFiles,
            success: successCount,
            duplicates: duplicateCount,
            errors: errorCount,
            created_schedules: createdSchedules.length
          }
        }
        
        // Clear form after successful upload (only if all files were successful)
        if (successCount > 0 && errorCount === 0 && duplicateCount === 0) {
          setTimeout(() => {
            this.clearForm()
          }, 3000)
        }
        
      } catch (error) {
        console.error('Erro no processamento em lote:', error)
        this.uploadResult = {
          success: false,
          message: 'Erro geral ao processar arquivos XML'
        }
      } finally {
        this.isUploading = false
        setTimeout(() => {
          this.uploadProgress = 0
          this.uploadProgressText = ''
        }, 2000)
      }
    }
  }
}
</script>

<style scoped>
.xml-upload-page {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.page-header h2 {
  color: #2c3e50;
  margin-bottom: 1rem;
  margin-top: 0;
  display: block;
  width: 100%;
}

.page-header h2 i {
  margin-right: 0.5rem;
  color: #3498db;
}

.page-subtitle {
  color: #7f8c8d;
  font-size: 1.1rem;
  margin: 0;
  line-height: 1.5;
  max-width: 600px;
  display: block;
}

.upload-form-container {
  background: white;
  border-radius: 10px;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.form-section {
  margin-bottom: 2rem;
}

.section-title {
  display: block;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

.section-title i {
  margin-right: 0.5rem;
  color: #3498db;
}

.file-drop-zone {
  border: 2px dashed #bdc3c7;
  border-radius: 10px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #f8f9fa;
}

.file-drop-zone:hover,
.file-drop-zone.drag-over {
  border-color: #3498db;
  background: #e3f2fd;
}

.file-drop-zone.has-files {
  border-color: #27ae60;
  background: #e8f5e8;
}

.drop-zone-content i {
  font-size: 3rem;
  color: #bdc3c7;
  margin-bottom: 1rem;
}

.drop-zone-content p {
  font-size: 1.1rem;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.drop-zone-content small {
  color: #7f8c8d;
}

.selected-files-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.selected-files h4 {
  color: #27ae60;
  margin: 0;
}

.btn-add-more {
  background: #3498db;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background 0.3s ease;
}

.btn-add-more:hover {
  background: #2980b9;
}

.file-list {
  text-align: left;
}

.file-item {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 5px;
  margin-bottom: 0.5rem;
}

.file-item i {
  color: #3498db;
  margin-right: 1rem;
}

.file-name {
  flex: 1;
  font-weight: 500;
}

.file-size {
  color: #7f8c8d;
  margin-right: 1rem;
}

.remove-file-btn {
  background: none;
  color: #e74c3c;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.3s ease;
  flex-shrink: 0;
  padding: 0.25rem;
}

.remove-file-btn i {
  font-size: 16px;
  line-height: 1;
}

.remove-file-btn:hover {
  color: #c0392b;
}

.form-select,
.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 1rem;
}

.form-select:focus,
.form-input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.checkbox-container {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
}

.form-checkbox {
  margin-right: 0.75rem;
  transform: scale(1.2);
}

.checkbox-label {
  font-weight: 500;
  color: #2c3e50;
  cursor: pointer;
}

.checkbox-label i {
  margin-right: 0.5rem;
  color: #3498db;
}

.help-text {
  color: #7f8c8d;
  font-size: 0.9rem;
  line-height: 1.4;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
}

.btn {
  padding: 0.75rem 2rem;
  border-radius: 5px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.btn-primary {
  background: #3498db;
  color: white;
  border-color: #3498db;
}

.btn-primary:hover:not(:disabled) {
  background: #2980b9;
  border-color: #2980b9;
}

.btn-primary:disabled {
  background: #bdc3c7;
  border-color: #bdc3c7;
  cursor: not-allowed;
}

.btn-outline-secondary {
  background: transparent;
  color: #6c757d;
  border-color: #6c757d;
}

.btn-outline-secondary:hover:not(:disabled) {
  background: #6c757d;
  color: white;
}

.upload-progress {
  background: white;
  padding: 1.5rem;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.progress-bar {
  width: 100%;
  height: 20px;
  background: #ecf0f1;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 1rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3498db, #2ecc71);
  transition: width 0.3s ease;
}

.progress-text {
  text-align: center;
  color: #2c3e50;
  font-weight: 500;
}

.temp-message,
.upload-result {
  margin-top: 2rem;
}

.temp-message .alert {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.alert {
  padding: 1.5rem;
  border-radius: 10px;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.alert i {
  font-size: 1.5rem;
  flex-shrink: 0;
  margin-top: 0.25rem;
}

.alert h4 {
  margin: 0 0 0.5rem 0;
}

.alert p {
  margin: 0 0 1rem 0;
}

.alert ul {
  margin: 0;
  padding-left: 1.5rem;
}

.alert-success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.alert-success i {
  color: #28a745;
}

.alert-error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.alert-error i {
  color: #dc3545;
}

.alert-warning {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.alert-warning i {
  color: #f39c12;
}

.alert-info {
  background: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}

.alert-info i {
  color: #17a2b8;
}


/* Client Selection Styles */
.client-selection-area {
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #f9f9f9;
  overflow: hidden;
}

.selected-client-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: white;
  border: 2px solid #27ae60;
}

.selected-client-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.selected-client-info i {
  color: #27ae60;
  font-size: 1.2rem;
}

.client-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.client-name {
  font-weight: 600;
  color: #2c3e50;
  font-size: 1.1rem;
}

.client-cnpj {
  color: #7f8c8d;
  font-size: 0.9rem;
}

.client-numero {
  color: #7f8c8d;
  font-size: 0.85rem;
}

.btn-change-client {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
}

.no-client-selected {
  padding: 2rem;
  text-align: center;
}

.no-client-text {
  color: #7f8c8d;
  margin-bottom: 1rem;
}

.btn-select-client {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
  background: #f8f9fa;
}

.modal-header h3 {
  margin: 0;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.modal-close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #6c757d;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close-btn:hover {
  background: #e9ecef;
  color: #495057;
}

.modal-body {
  padding: 0;
  flex: 1;
  overflow-y: auto;
}

.loading-clients-container {
  padding: 3rem;
  text-align: center;
}

.loading-spinner i {
  font-size: 2rem;
  color: #3498db;
  margin-bottom: 1rem;
}

.loading-text {
  font-size: 1.1rem;
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
}

.loading-subtext {
  color: #7f8c8d;
}

.estoque-lista-vertical {
  padding: 1rem;
}

.estoque-lista-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  margin-bottom: 0.75rem;
  background: white;
  transition: all 0.3s ease;
}

.estoque-lista-item:hover {
  border-color: #3498db;
  box-shadow: 0 2px 8px rgba(52, 152, 219, 0.1);
}

.estoque-lista-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.estoque-lista-info i {
  color: #3498db;
  font-size: 1.2rem;
}

.estoque-nome {
  font-weight: 600;
  color: #2c3e50;
  font-size: 1.1rem;
}

.estoque-cnpj {
  color: #7f8c8d;
  font-size: 0.9rem;
  margin-left: 1rem;
}

.estoque-numero {
  color: #7f8c8d;
  font-size: 0.85rem;
  margin-left: 0.5rem;
}

.btn-selecionar-estoque {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  white-space: nowrap;
}

.estoque-lista-vazia {
  text-align: center;
  padding: 3rem;
  color: #7f8c8d;
}

.estoque-lista-vazia i {
  font-size: 2rem;
  margin-bottom: 1rem;
  display: block;
}

.access-denied {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}

.access-denied-content {
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  max-width: 500px;
}

.access-denied-content i {
  font-size: 4rem;
  color: #e74c3c;
  margin-bottom: 2rem;
}

.access-denied-content h3 {
  color: #2c3e50;
  margin-bottom: 1rem;
  font-size: 2rem;
}

.access-denied-content p {
  color: #7f8c8d;
  line-height: 1.6;
  margin-bottom: 1rem;
}

@media (max-width: 768px) {
  .xml-upload-page {
    padding: 1rem;
  }
  
  .upload-form-container {
    padding: 1.5rem;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>