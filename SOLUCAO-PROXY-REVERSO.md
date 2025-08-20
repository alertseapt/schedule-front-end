# Configuração de Proxy Reverso no IIS

Este documento descreve como foi implementada a solução de proxy reverso para integração do frontend Vue.js com o backend Flask na mesma máquina virtual usando IIS.

## Arquitetura da Solução

A arquitetura implementada segue o seguinte fluxo:

1. O usuário acessa o sistema através do IIS (ex: `http://servidor`)
2. O IIS serve os arquivos estáticos do frontend a partir da pasta `backend/dist`
3. Quando uma requisição é feita para `/api/*`, o IIS redireciona (proxy reverso) para o backend Python na porta 4000
4. O backend Python processa a requisição e retorna a resposta
5. O IIS encaminha a resposta para o cliente

### Vantagens desta arquitetura:

- **Segurança**: O backend não é exposto diretamente à internet, apenas através do proxy reverso
- **Simplicidade**: Tudo roda no mesmo servidor, sem necessidade de configurar CORS
- **Flexibilidade**: O backend pode ser atualizado independentemente do frontend
- **Performance**: O IIS é otimizado para servir arquivos estáticos

## Componentes Principais

### 1. Configuração do web.config

O arquivo `web.config` foi configurado para:

- Redirecionar requisições `/api/*` para o backend Python na porta 4000
- Servir arquivos estáticos normalmente
- Redirecionar outras rotas para o `index.html` (necessário para SPA)

### 2. Configuração do Frontend

O arquivo `config.js` foi adaptado para:

- Em desenvolvimento: usar URL completa do backend (`http://localhost:4000/api`)
- Em produção: usar URL relativa (`/api`) para aproveitar o proxy reverso

### 3. Configuração do Backend

O backend Python foi modificado para:

- Servir arquivos estáticos do frontend da pasta `dist`
- Tratar rotas de API em `/api/*`
- Redirecionar para `index.html` para rotas SPA não encontradas

### 4. Script de Build Integrado

Foi criado um script de post-build (`post-build.js`) que:

- Copia os arquivos de build do frontend (`dist`) para a pasta `backend/dist`
- Copia configurações necessárias para o funcionamento do proxy
- Configura corretamente as URLs e referências de arquivos

## Instruções de Deploy

Para fazer o deploy completo da solução:

### 1. Build do frontend integrado com o backend

```bash
# Na pasta raiz do projeto
npm run build:integrated
```

Este comando:
- Faz o build do frontend usando Vite
- Executa o script post-build.cjs para configurar arquivos
- Executa o script post-build.js para integrar com o backend

### 2. Copiar para o servidor IIS

Copie a pasta `backend` completa para o servidor IIS.

### 3. Instalar requisitos Python

```bash
# No servidor
pip install -r backend/requirements.txt
```

### 4. Configurar o IIS

1. **Instalar o Application Request Routing (ARR)**:
   - Baixar e instalar o ARR do site da Microsoft
   - Habilitar o proxy nas configurações do servidor IIS

2. **Configurar o site no IIS**:
   - Criar um novo site apontando para a pasta `backend`
   - Certificar-se de que o `web.config` está presente

### 5. Iniciar o backend

```bash
# No servidor
cd backend
python run.py
```

Alternativamente, configure o backend como um serviço Windows para garantir que ele seja iniciado automaticamente.

## Estrutura Final da Solução

```
backend/
  ├── app.py                # Aplicação Flask principal
  ├── init_app.py           # Inicialização da aplicação Flask
  ├── run.py                # Script para iniciar o backend
  ├── requirements.txt      # Dependências Python
  ├── ...                   # Outros arquivos do backend
  └── dist/                 # Build do frontend
      ├── index.html
      ├── assets/
      ├── config.js         # Configuração da API
      └── web.config        # Configuração do IIS com proxy reverso
```

## Resolução de Problemas

### Erro 502.3 - Bad Gateway

Se você receber este erro, verifique:
1. Se o backend Python está rodando na porta 4000
2. Se o ARR está instalado e o proxy está habilitado
3. Se o firewall permite comunicação interna na porta 4000

### Erro 404 - Not Found

Para erros 404 em rotas de API:
1. Verifique se as regras de rewrite no `web.config` estão corretas
2. Confirme se as URLs da API no frontend estão usando `/api/...`

Para erros 404 em arquivos estáticos:
1. Verifique se a pasta `dist` foi copiada corretamente para `backend/dist`
2. Confirme que as referências aos arquivos estão corretas (paths relativos)
