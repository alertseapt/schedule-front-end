/**
 * Dados de versionamento da aplicação Agenda MercoCamp
 * 
 * Estrutura de cada versão:
 * - number: Número da versão (string)
 * - name: Nome descritivo da versão
 * - date: Data de lançamento (ISO string)
 * - type: Tipo da versão (major, minor, patch, beta, alpha)
 * - features: Array de novas funcionalidades
 * - improvements: Array de melhorias
 * - bugfixes: Array de correções de bugs
 * - technical: Array de alterações técnicas
 * - breaking: Array de alterações incompatíveis
 */

export const versionData = [
  {
    number: '0.5.0',
    name: 'Agendamento em Lote e Otimizações Massivas',
    date: '2025-09-09',
    type: 'minor',
    features: [
      {
        title: 'Sistema de Agendamento em Lote',
        description: 'Nova funcionalidade completa para processamento de múltiplas NFes simultaneamente com configuração passo a passo.',
        details: [
          'Modal dedicado para configuração de produtos em lote',
          'Navegação paginada entre NFes com progresso visual',
          'Cache de sessão para reutilização de produtos configurados',
          'Pré-preenchimento automático de produtos já cadastrados',
          'Salvamento automático após cada NFe configurada',
          'Processamento otimizado com feedback de performance'
        ]
      },
      {
        title: 'Cache Inteligente de Produtos',
        description: 'Sistema avançado de cache que memoriza produtos configurados durante a sessão de lote.',
        details: [
          'Cache em memória para produtos configurados na mesma sessão',
          'Pré-preenchimento automático em NFes subsequentes',
          'Atualização em tempo real durante edição',
          'Limpeza automática ao iniciar nova sessão',
          'Logs detalhados para debugging do cache'
        ]
      }
    ],
    improvements: [
      {
        title: 'Performance de Banco Massivamente Otimizada',
        description: 'Reescrita completa do sistema de salvamento de produtos para máxima performance.',
        details: [
          'Consultas em lote substituindo loops sequenciais',
          'Transações SQL para operações atômicas',
          'Mapeamento com Map() para lookup O(1)',
          'Redução de 8-16x no tempo de processamento',
          'Métricas de performance em tempo real (produtos/segundo)',
          'Timeout otimizado para operações rápidas'
        ]
      },
      {
        title: 'Interface de Usuário Aprimorada',
        description: 'Melhorias significativas na experiência visual e usabilidade.',
        details: [
          'Checkboxes maiores e mais visíveis (20px)',
          'Cores diferenciadas para produtos bloqueados vs checkbox selecionada',
          'Layout reorganizado nos controles de produtos',
          'Texto de aviso em vermelho e negrito para maior destaque',
          'Título da sidebar alterado para "Hub de Agendamentos"',
          'Remoção de elementos visuais desnecessários'
        ]
      },
      {
        title: 'Sistema de Logs Avançado',
        description: 'Logs detalhados para monitoramento e debugging de performance.',
        details: [
          'Logs de performance com timestamps',
          'Métricas de velocidade de processamento',
          'Rastreamento de operações de cache',
          'Feedback visual de progresso em tempo real',
          'Logs separados para frontend e backend'
        ]
      }
    ],
    technical: [
      {
        title: 'Arquitetura de Cache Otimizada',
        description: 'Implementação de sistema de cache em memória para sessões de lote.',
        details: [
          'Utilização de JavaScript Map para performance máxima',
          'Chaves compostas (código_fornecedor + CNPJ)',
          'Limpeza automática de cache obsoleto',
          'Sincronização com dados do banco de dados'
        ]
      },
      {
        title: 'Otimizações de Backend SQL',
        description: 'Reescrita completa das operações de banco para operações em lote.',
        details: [
          'Query única com IN() para buscar produtos existentes',
          'Transações START/COMMIT/ROLLBACK automáticas',
          'Preparação de dados em lote antes das operações',
          'Tratamento robusto de erros com rollback',
          'Métricas de performance integradas'
        ]
      }
    ]
  },
  {
    number: '0.0.4',
    name: 'Sistema de Versionamento e Correções Críticas',
    date: '2025-09-08',
    type: 'minor',
    features: [
      {
        title: 'Sistema de Versionamento',
        description: 'Nova funcionalidade completa para visualização e acompanhamento das versões da aplicação.',
        details: [
          'Página dedicada para notas de atualização',
          'Seletor de versões para consulta do histórico',
          'Interface moderna com timeline de versões',
          'Categorização de alterações (funcionalidades, melhorias, correções)',
          'Integração com menu principal da aplicação'
        ]
      },
      {
        title: 'Alteração de Status na Janela de Informações',
        description: 'Implementada funcionalidade para alterar status do agendamento diretamente na janela de informações da NF-e.',
        details: [
          'Botão "Em Tratativa" para marcação rápida',
          'Dropdown para alteração de status quando em tratativa',
          'Validação de permissões por nível de usuário',
          'Integração com histórico de alterações',
          'Notificações de feedback para o usuário'
        ]
      }
    ],
    improvements: [
      {
        title: 'Refresh Automático de Página',
        description: 'Implementado refresh automático após alterações para garantir dados sempre atualizados.',
        details: [
          'Refresh após edição de agendamentos (500ms delay)',
          'Refresh após alteração de status (1000ms delay)',
          'Transições suaves com fechamento de modais',
          'Notificações visíveis antes da atualização'
        ]
      },
      {
        title: 'Integração CORPEM Aprimorada',
        description: 'Melhorada a integração com sistema CORPEM para evitar rejeições por CNPJs iguais.',
        details: [
          'Detecção automática quando CGCREM = CGCCLIWMS',
          'Alteração do CGCREM para 99999999999999 quando necessário',
          'Logs detalhados para auditoria das alterações',
          'Preservação do CNPJ original no banco de dados'
        ]
      }
    ],
    bugfixes: [
      {
        title: 'Handlers de Evento Ausentes',
        description: 'Corrigido problema crítico onde botões de alteração de status não funcionavam na janela de informações.',
        details: [
          'Adicionados handlers @mark-tratativa e @change-status',
          'Implementados métodos handleMarkTratativa() e handleChangeStatus()',
          'Criada propriedade computada currentUser()',
          'Integração completa com sistema de notificações'
        ]
      }
    ],
    technical: [
      {
        title: 'Melhoria na Arquitetura de Componentes',
        description: 'Aprimorada a comunicação entre componentes pai e filho para eventos de alteração.',
        details: [
          'Implementação de event emitters estruturados',
          'Tratamento robusto de erros com feedback',
          'Logs detalhados para debugging',
          'Compatibilidade mantida com funcionalidades existentes'
        ]
      }
    ]
  },
  {
    number: '0.0.3',
    name: 'Otimizações de Performance e UX',
    date: '2025-09-08',
    type: 'patch',
    improvements: [
      {
        title: 'Performance da Lista de Agendamentos',
        description: 'Otimizada a renderização da lista principal de agendamentos para melhor performance.',
        details: [
          'Implementada virtualização para listas grandes',
          'Lazy loading de dados conforme scroll',
          'Cache inteligente de requisições',
          'Redução de 60% no tempo de carregamento inicial'
        ]
      },
      {
        title: 'Interface do Usuário Aprimorada',
        description: 'Melhorias significativas na experiência do usuário e responsividade.',
        details: [
          'Design responsivo para dispositivos móveis',
          'Animações suaves em transições',
          'Feedback visual aprimorado para ações',
          'Consistência visual entre componentes'
        ]
      }
    ],
    bugfixes: [
      {
        title: 'Filtros de Data',
        description: 'Corrigido problema onde filtros de data não eram aplicados corretamente.',
        details: [
          'Validação de intervalo de datas',
          'Formatação consistente de datas',
          'Correção de timezone em filtros'
        ]
      },
      {
        title: 'Modal de Edição',
        description: 'Resolvidos problemas de validação no modal de edição de agendamentos.',
        details: [
          'Validação de campos obrigatórios aprimorada',
          'Correção de dados não salvos',
          'Melhor tratamento de erros de API'
        ]
      }
    ]
  },
  {
    number: '0.0.2',
    name: 'Sistema de Usuários e Permissões',
    date: '2025-09-08',
    type: 'minor',
    features: [
      {
        title: 'Sistema de Autenticação',
        description: 'Implementado sistema completo de login e controle de acesso.',
        details: [
          'Tela de login com validação',
          'Sistema de tokens JWT',
          'Logout automático por inatividade',
          'Redirecionamento baseado em perfil'
        ]
      },
      {
        title: 'Níveis de Permissão',
        description: 'Sistema de permissões baseado em níveis de acesso do usuário.',
        details: [
          'Nível 1: Usuário básico (visualização)',
          'Nível 5: Usuário avançado (edição)',
          'Nível 9: Administrador (configurações)',
          'Controle granular de funcionalidades'
        ]
      }
    ],
    improvements: [
      {
        title: 'Sidebar de Navegação',
        description: 'Nova sidebar com menu estruturado e informações do usuário.',
        details: [
          'Menu expansível com ícones',
          'Indicação de página ativa',
          'Perfil do usuário com dropdown',
          'Responsive design para mobile'
        ]
      }
    ],
    technical: [
      {
        title: 'Arquitetura de Autenticação',
        description: 'Implementada infraestrutura robusta para autenticação e autorização.',
        details: [
          'Middleware de autenticação no backend',
          'Interceptors axios para tokens',
          'Guards de rota baseados em permissão',
          'Criptografia segura de senhas'
        ]
      }
    ]
  },
  {
    number: '0.0.1',
    name: 'Versão Inicial - MVP',
    date: '2025-09-08',
    type: 'major',
    features: [
      {
        title: 'Gestão de Agendamentos',
        description: 'Funcionalidade principal para criar, editar e visualizar agendamentos de entregas.',
        details: [
          'Lista de agendamentos com filtros',
          'Criação de novos agendamentos',
          'Edição de agendamentos existentes',
          'Sistema de status de agendamento',
          'Integração com dados de NF-e'
        ]
      },
      {
        title: 'Upload de XML',
        description: 'Sistema para upload e processamento de arquivos XML de Notas Fiscais.',
        details: [
          'Interface drag-and-drop para upload',
          'Validação de arquivos XML',
          'Extração automática de dados da NF-e',
          'Processamento em lote de múltiplos arquivos'
        ]
      },
      {
        title: 'Dashboard Principal',
        description: 'Painel principal com visão geral dos agendamentos e estatísticas.',
        details: [
          'Cards de estatísticas em tempo real',
          'Gráficos de status de agendamentos',
          'Atividades recentes',
          'Entregas pendentes destacadas'
        ]
      }
    ],
    improvements: [
      {
        title: 'Sistema Funciona em Qualquer Tela',
        description: 'O sistema se adapta ao tamanho da sua tela.',
        details: [
          'Funciona bem no computador e celular',
          'Botões fáceis de tocar no celular',
          'Navegação simples e intuitiva'
        ]
      }
    ],
    technical: [
      {
        title: 'Base do Sistema',
        description: 'Construímos o sistema com tecnologias modernas e confiáveis.',
        details: [
          'Sistema web moderno e rápido',
          'Banco de dados seguro',
          'Atualizações automáticas do sistema'
        ]
      },
      {
        title: 'Conexão com CORPEM',
        description: 'Sistema conectado ao CORPEM para trocar informações.',
        details: [
          'Sincroniza dados automaticamente',
          'Produtos atualizados em tempo real',
          'Registra todas as operações'
        ]
      }
    ]
  }
];

/**
 * Função utilitária para obter dados de uma versão específica
 * @param {string} versionNumber - Número da versão (ex: '0.0.4')
 * @returns {object|null} Dados da versão ou null se não encontrada
 */
export function getVersionData(versionNumber) {
  return versionData.find(version => version.number === versionNumber) || null;
}

/**
 * Função utilitária para obter a versão mais recente
 * @returns {object} Dados da versão mais recente
 */
export function getLatestVersion() {
  return versionData[0]; // Primeiro item é sempre a versão mais recente
}

/**
 * Função utilitária para obter todas as versões de um tipo específico
 * @param {string} type - Tipo da versão (major, minor, patch, beta, alpha)
 * @returns {array} Array com versões do tipo especificado
 */
export function getVersionsByType(type) {
  return versionData.filter(version => version.type === type);
}

/**
 * Configuração atual da aplicação
 */
export const currentVersion = {
  number: '0.5.0',
  environment: process.env.NODE_ENV || 'development',
  buildDate: new Date().toISOString(),
  features: {
    versionControl: true,
    corpemIntegration: true,
    userPermissions: true,
    xmlUpload: true,
    batchScheduling: true,
    sessionCache: true,
    performanceOptimization: true
  }
};