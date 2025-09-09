<template>
  <div class="help-page">

    <!-- Conteúdo principal -->
    <div class="help-content">
      <div class="help-container">

        <!-- Área de conteúdo -->
        <main class="help-main">
          <!-- Seção: Criação de Agendamentos -->
          <section id="schedule-creation" class="help-section">
            <div class="section-header">
              <h2>
                <i class="fas fa-plus-circle"></i>
                Como Criar Agendamentos
              </h2>
              <div class="section-badge">
                <i class="fas fa-video"></i>
                Vídeo Tutorial
              </div>
            </div>

            <div class="section-content">
              <!-- Vídeo tutorial -->
              <div class="video-container">
                <video 
                  ref="scheduleVideo"
                  class="help-video"
                  controls
                  preload="metadata"
                >
                  <source src="/src/assets/videos/schedule_creation.mp4" type="video/mp4">
                  Seu navegador não suporta o elemento de vídeo.
                </video>
                <div class="video-info">
                  <h4>
                    <i class="fas fa-play-circle"></i>
                    Tutorial: Criação de Agendamentos
                  </h4>
                  <p>Assista ao vídeo acima para ver passo a passo como criar novos agendamentos no sistema.</p>
                </div>
              </div>

              <!-- Guia escrito -->
              <div class="text-guide">
                <h3>
                  <i class="fas fa-list-ol"></i>
                  Passo a Passo
                </h3>

                <div class="step-list">
                  <div class="step-item">
                    <div class="step-number">1</div>
                    <div class="step-content">
                      <h4><i class="fas fa-home"></i> Acesse a página principal</h4>
                      <p>No menu lateral, clique em <strong>"Principal"</strong> para acessar a tela inicial do sistema.</p>
                    </div>
                  </div>

                  <div class="step-item">
                    <div class="step-number">2</div>
                    <div class="step-content">
                      <h4><i class="fas fa-plus"></i> Clique no botão "Criar Agendamento"</h4>
                      <p>Localizado no canto superior direito da tela, clique no botão azul <strong>"Criar Agendamento"</strong> para abrir o modal de criação.</p>
                    </div>
                  </div>

                  <div class="step-item">
                    <div class="step-number">3</div>
                    <div class="step-content">
                      <h4><i class="fas fa-upload"></i> Faça upload do arquivo XML</h4>
                      <p>Arraste o arquivo XML da NFe para a área de upload ou clique em <strong>"Selecionar Arquivo"</strong> para escolher o arquivo do seu computador.</p>
                    </div>
                  </div>

                  <div class="step-item">
                    <div class="step-number">4</div>
                    <div class="step-content">
                      <h4><i class="fas fa-info-circle"></i> Verifique as informações da NFe</h4>
                      <p>O sistema exibirá automaticamente as informações extraídas do XML: número da NFe, fornecedor, destinatário, volumes e valor total.</p>
                      
                      <div class="info-highlight">
                        <p><strong><i class="fas fa-warehouse"></i> Estoque:</strong> Selecione o estoque de destino clicando em "Selecionar Estoque".</p>
                        <p><strong><i class="fas fa-calendar-alt"></i> Data:</strong> Escolha a data desejada para entrega física das mercadorias.</p>
                      </div>
                    </div>
                  </div>

                  <div class="step-item">
                    <div class="step-number">5</div>
                    <div class="step-content">
                      <h4><i class="fas fa-boxes"></i> Configure os produtos</h4>
                      <p>Na terceira etapa, configure os produtos do agendamento:</p>
                      
                      <div class="product-info">
                        <p><strong><i class="fas fa-lock"></i> Produtos já cadastrados:</strong> Aparecem com ícone de cadeado e são pré-preenchidos automaticamente.</p>
                        <p><strong><i class="fas fa-edit"></i> Produtos novos:</strong> Você pode marcar a checkbox para usar dados do fornecedor ou preencher manualmente.</p>
                        <p><strong><i class="fas fa-check-square"></i> Seleção em massa:</strong> Use os botões "Marcar todos" e "Inverter seleção" para agilizar.</p>
                      </div>
                    </div>
                  </div>

                  <div class="step-item">
                    <div class="step-number">6</div>
                    <div class="step-content">
                      <h4><i class="fas fa-check"></i> Confirme a criação</h4>
                      <p>Clique no botão verde <strong>"Solicitar Agendamento"</strong> para finalizar. O agendamento será criado com status "Solicitado" e aguardará aprovação da equipe.</p>
                    </div>
                  </div>
                </div>

                <div class="tip-box">
                  <div class="tip-icon">
                    <i class="fas fa-lightbulb"></i>
                  </div>
                  <div class="tip-content">
                    <h4>Dica importante!</h4>
                    <p>Agendamentos criados iniciam com o status <strong>"Solicitado"</strong> e precisam ser aprovados pela equipe de conferência.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>


          <!-- Seção: Gerenciamento de Status -->
          <section id="status-management" class="help-section">
            <div class="section-header">
              <h2>
                <i class="fas fa-traffic-light"></i>
                Gerenciamento de Status
              </h2>
            </div>

            <div class="section-content">
              <div class="text-guide">
                <h3>
                  <i class="fas fa-route"></i>
                  Fluxo de Status do Agendamento
                </h3>

                <div class="timeline-container">
                  <div class="timeline">
                    <div class="timeline-item">
                      <div class="timeline-marker warning">
                        <i class="fas fa-clock"></i>
                      </div>
                      <div class="timeline-content">
                        <div class="status-badge warning">Solicitado</div>
                        <h4>Status Inicial</h4>
                        <p>Agendamento foi criado e aguarda análise da equipe de conferência.</p>
                      </div>
                    </div>

                    <div class="timeline-item">
                      <div class="timeline-marker primary">
                        <i class="fas fa-check"></i>
                      </div>
                      <div class="timeline-content">
                        <div class="status-badge primary">Agendado</div>
                        <h4>Aprovado</h4>
                        <p>Agendamento confirmado pela equipe e pronto para execução na data programada.</p>
                      </div>
                    </div>

                    <div class="timeline-item">
                      <div class="timeline-marker success">
                        <i class="fas fa-search"></i>
                      </div>
                      <div class="timeline-content">
                        <div class="status-badge success">Em Conferência</div>
                        <h4>Em Verificação</h4>
                        <p>Mercadorias chegaram e estão sendo conferidas pela equipe técnica.</p>
                      </div>
                    </div>

                    <div class="timeline-item">
                      <div class="timeline-marker success final">
                        <i class="fas fa-warehouse"></i>
                      </div>
                      <div class="timeline-content">
                        <div class="status-badge success">Em Estoque</div>
                        <h4>Finalizado</h4>
                        <p>Agendamento concluído com sucesso. Mercadorias armazenadas no estoque.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="status-alternatives">
                  <h4><i class="fas fa-exclamation-triangle"></i> Status Alternativos</h4>
                  <div class="alternative-status">
                    <div class="status-badge contestado">Contestado</div>
                    <p>Encontrados problemas que precisam ser resolvidos antes do prosseguimento.</p>
                  </div>
                  <div class="alternative-status">
                    <div class="status-badge dark">Recusado</div>
                    <p>Agendamento não aprovado pela equipe de conferência.</p>
                  </div>
                  <div class="alternative-status">
                    <div class="status-badge secondary">Cancelado</div>
                    <p>Agendamento cancelado pelo solicitante ou sistema.</p>
                  </div>
                </div>

              </div>
            </div>
          </section>

        </main>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue';

export default {
  name: 'HelpPage',
  setup() {
    const activeSection = ref('schedule-creation');

    // Função para rolar para uma seção específica
    const scrollToSection = (sectionId) => {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
        activeSection.value = sectionId;
      }
    };

    // Observar qual seção está visível
    const observeSections = () => {
      const sections = document.querySelectorAll('.help-section');
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            activeSection.value = entry.target.id;
          }
        });
      }, {
        rootMargin: '-50% 0px -50% 0px'
      });

      sections.forEach((section) => {
        observer.observe(section);
      });

      return observer;
    };

    let observer;

    onMounted(() => {
      observer = observeSections();
    });

    onUnmounted(() => {
      if (observer) {
        observer.disconnect();
      }
    });

    return {
      activeSection,
      scrollToSection
    };
  }
};
</script>

<style scoped>
.help-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
}


/* Layout principal */
.help-content {
  padding: 20px 0;
}

.help-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

/* Menu horizontal */
/* Área principal */
.help-main {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* Seções */
.help-section {
  padding: 40px;
  border-bottom: 1px solid #e2e8f0;
}

.help-section:last-child {
  border-bottom: none;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
}

.section-header h2 {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 0;
  color: #1e3a8a;
  font-size: 1.8rem;
  font-weight: 700;
}

.section-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fef3c7;
  color: #92400e;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
}

/* Vídeo */
.video-container {
  background: #f8fafc;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.help-video {
  width: 100%;
  max-width: 800px;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.video-info {
  margin-top: 16px;
}

.video-info h4 {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 0 8px 0;
  color: #1e3a8a;
  font-size: 1.2rem;
  font-weight: 600;
}

.video-info p {
  color: #64748b;
  margin: 0;
}

/* Guias de texto */
.text-guide h3 {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 0 24px 0;
  color: #1e3a8a;
  font-size: 1.4rem;
  font-weight: 600;
}

/* Steps */
.step-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.step-item {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.step-number {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #2563eb 0%, #1e3a8a 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.step-content h4 {
  margin: 0 0 12px 0;
  color: #1e3a8a;
  font-size: 1.1rem;
  font-weight: 600;
}

.step-content p {
  color: #64748b;
  margin: 0 0 16px 0;
  line-height: 1.6;
}

/* Exemplos de UI */
.ui-example {
  margin: 16px 0;
}

.menu-item-example {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  background: #1e3a8a;
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 500;
}

.btn-example {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin: 4px;
}

.btn-example.primary {
  background: #2563eb;
  color: white;
}

.btn-example.success {
  background: #10b981;
  color: white;
}

.btn-example.agendado {
  background: #10b981;
  color: white;
}

.btn-example.contestado {
  background: #ef4444;
  color: white;
}

/* Formulário exemplo */
.form-example {
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #f8fafc;
  padding: 20px;
  border-radius: 8px;
  border: 2px dashed #cbd5e1;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-field label {
  color: #374151;
  font-weight: 600;
  font-size: 0.9rem;
}

.select-example,
.input-example {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: white;
  border: 2px solid #d1d5db;
  border-radius: 6px;
  padding: 10px 12px;
  color: #9ca3af;
}

.input-example {
  gap: 12px;
}

/* Status badges */
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-badge.warning {
  background-color: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.status-badge.primary {
  background-color: #cce5ff;
  color: #004085;
  border: 1px solid #007bff;
}

.status-badge.success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #28a745;
}

.status-badge.danger {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #dc3545;
}

.status-badge.dark {
  background-color: #d6d6d6;
  color: #1b1e21;
  border: 1px solid #343a40;
}

.status-badge.secondary {
  background-color: #e2e3e5;
  color: #383d41;
  border: 1px solid #6c757d;
}

.status-badge.contestado {
  background-color: #8B1538 !important;
  color: white !important;
  border: 1px solid #8B1538 !important;
}

.status-badge.booking {
  background-color: #f3e5f5 !important;
  color: #7b1fa2 !important;
  border: 1px solid #ba68c8 !important;
  font-weight: 500 !important;
}

/* Grid de status */
.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.status-card {
  background: #f8fafc;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  text-align: center;
}

.status-card p {
  margin: 12px 0 0 0;
  color: #64748b;
  line-height: 1.5;
}

/* Exemplo de tabela */
.table-example {
  background: #f8fafc;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.table-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  background: white;
  border-radius: 6px;
}

.checkbox-example {
  width: 20px;
  height: 20px;
  border: 2px solid #d1d5db;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.checkbox-example.checked {
  background: #2563eb;
  border-color: #2563eb;
  color: white;
}

/* Botões de ação */
.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

/* Boxes informativos */
.tip-box,
.warning-box {
  display: flex;
  gap: 16px;
  padding: 20px;
  border-radius: 12px;
  margin: 24px 0;
}

.tip-box {
  background: #f0f9ff;
  border: 1px solid #0ea5e9;
}

.warning-box {
  background: #fef3c7;
  border: 1px solid #f59e0b;
}

.tip-icon,
.warning-icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tip-icon {
  color: #0ea5e9;
}

.warning-icon {
  color: #f59e0b;
}

.tip-content h4,
.warning-content h4 {
  margin: 0 0 8px 0;
  font-weight: 600;
}

.tip-content {
  color: #0c4a6e;
}

.warning-content {
  color: #92400e;
}

.tip-content p,
.warning-content p {
  margin: 0;
  line-height: 1.5;
}

/* Feature info */
.feature-info {
  display: flex;
  align-items: center;
  gap: 20px;
  background: #f8fafc;
  padding: 24px;
  border-radius: 12px;
  margin-bottom: 32px;
}

.feature-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #2563eb 0%, #1e3a8a 100%);
  color: white;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.feature-content h4 {
  margin: 0 0 8px 0;
  color: #1e3a8a;
  font-size: 1.2rem;
  font-weight: 600;
}

.feature-content p {
  margin: 0;
  color: #64748b;
  line-height: 1.5;
}

/* Responsividade */

@media (max-width: 768px) {
  
  .help-section {
    padding: 24px 20px;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .status-grid {
    grid-template-columns: 1fr;
  }
  
  .step-item {
    flex-direction: column;
    gap: 16px;
  }
  
  .step-number {
    align-self: flex-start;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .btn-example {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .help-content {
    padding: 20px 0;
  }
  
  .help-container {
    padding: 0 16px;
    gap: 24px;
  }
}

/* Estilos para substeps dentro dos passos principais */
.substep-list {
  margin-left: 16px;
  padding-left: 16px;
  border-left: 2px solid #e2e8f0;
}

.substep-item {
  margin: 20px 0;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.substep-item h5 {
  color: #1e3a8a;
  margin: 0 0 12px 0;
  font-size: 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.substep-item h5 i {
  color: #3b82f6;
}

.substep-item p {
  color: #64748b;
  margin-bottom: 12px;
  line-height: 1.5;
}

/* Estilos para opções de produto */
.product-options {
  margin: 16px 0;
}

.option-item {
  margin: 12px 0;
  padding: 12px;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 6px;
}

.option-or {
  display: block;
  text-align: center;
  color: #6b7280;
  font-weight: 500;
  margin: 8px 0;
  font-size: 0.9rem;
}

/* Exemplos visuais para produtos */
.checkbox-example {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 16px;
}

.product-checkbox-demo {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.product-checkbox-demo input[type="checkbox"] {
  margin: 0;
}

.checkmark-small-demo {
  width: 18px;
  height: 18px;
  background: #e2e8f0;
  border-radius: 4px;
  position: relative;
  margin-left: 8px;
}

.checkbox-label {
  font-size: 0.9rem;
  color: #475569;
}

.locked-product-example {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: #f0fff0;
  border: 2px solid #28a745;
  border-radius: 8px;
  color: #28a745;
  font-size: 0.9rem;
  font-weight: 500;
  margin-top: 16px;
}

.locked-product-example i {
  font-size: 14px;
}

.editable-field-example {
  margin-top: 16px;
}

/* Ajustes específicos para a página de ajuda */
.help-page .form-control {
  font-family: 'Poppins', sans-serif;
}

.help-page .form-control:disabled {
  background-color: #f8f9fa;
  opacity: 0.8;
  cursor: not-allowed;
}

.help-page .btn {
  margin-right: 8px;
  margin-bottom: 8px;
}

.product-lock-demo {
  color: #28a745;
  font-size: 14px;
  margin-left: 4px;
}

/* Estilos para elementos de destaque na página de ajuda */
.info-highlight {
  background: #f0f9ff;
  border-left: 4px solid #3b82f6;
  padding: 16px;
  margin: 16px 0;
  border-radius: 4px;
}

.info-highlight p {
  margin: 8px 0;
  color: #1e40af;
  line-height: 1.5;
}

.product-info {
  background: #f8fafc;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  margin: 16px 0;
}

.product-info p {
  margin: 8px 0;
  color: #475569;
  line-height: 1.5;
}

/* Ícones nos títulos dos passos */
.step-content h4 i {
  color: #3b82f6;
  margin-right: 8px;
}

/* Timeline de Status */
.timeline-container {
  margin: 32px 0;
  padding: 24px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.timeline {
  position: relative;
  padding-left: 40px;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 20px;
  top: 30px;
  bottom: 30px;
  width: 3px;
  background: linear-gradient(to bottom, #fbbf24, #3b82f6, #10b981, #10b981);
}

.timeline-item {
  position: relative;
  margin-bottom: 40px;
  display: flex;
  align-items: flex-start;
}

.timeline-item:last-child {
  margin-bottom: 0;
}

.timeline-marker {
  position: absolute;
  left: -37px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: white;
  z-index: 2;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.timeline-marker.warning {
  background: #fbbf24;
}

.timeline-marker.primary {
  background: #3b82f6;
}

.timeline-marker.success {
  background: #10b981;
}

.timeline-marker.final {
  animation: pulse-success 2s infinite;
}

@keyframes pulse-success {
  0% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(16, 185, 129, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
  }
}

.timeline-content {
  margin-left: 20px;
  background: white;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  flex: 1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.timeline-content h4 {
  margin: 8px 0 4px 0;
  color: #1f2937;
  font-size: 1.1rem;
  font-weight: 600;
}

.timeline-content p {
  color: #6b7280;
  margin: 8px 0 0 0;
  line-height: 1.5;
}

/* Status Alternativos */
.status-alternatives {
  margin-top: 32px;
  padding: 20px;
  background: #fef3c7;
  border-left: 4px solid #f59e0b;
  border-radius: 8px;
}

.status-alternatives h4 {
  color: #92400e;
  margin: 0 0 16px 0;
  font-size: 1.1rem;
}

.status-alternatives h4 i {
  color: #f59e0b;
  margin-right: 8px;
}

.alternative-status {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin: 12px 0;
  padding: 12px;
  background: white;
  border-radius: 8px;
  border: 1px solid #fde68a;
}

.alternative-status p {
  margin: 0;
  color: #92400e;
  line-height: 1.4;
  flex: 1;
}

/* Responsividade para seção de produtos */
@media (max-width: 768px) {
  .feature-grid {
    grid-template-columns: 1fr;
    gap: 16px;
    margin: 24px 0;
  }
  
  .feature-card {
    padding: 20px;
  }
  
  .feature-icon {
    width: 50px;
    height: 50px;
    font-size: 20px;
  }
  
  .checkbox-example {
    flex-direction: column;
    gap: 4px;
  }

  /* Timeline responsiva */
  .timeline {
    padding-left: 30px;
  }

  .timeline::before {
    left: 15px;
  }

  .timeline-marker {
    left: -13.5px;
    width: 30px;
    height: 30px;
    font-size: 12px;
  }

  .timeline-content {
    margin-left: 15px;
    padding: 16px;
  }

  .timeline-content h4 {
    font-size: 1rem;
  }

  .status-alternatives {
    padding: 16px;
  }

  .alternative-status {
    flex-direction: column;
    gap: 8px;
  }
}
</style>