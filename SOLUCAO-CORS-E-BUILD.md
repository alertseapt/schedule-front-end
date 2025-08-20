# 🚀 Solução Completa para Deploy em Produção

## 📌 Problemas Resolvidos

1. **Problema de CORS:**
   - Frontend em `http://recebimento.mercocamptech.com.br` tentando acessar `http://localhost:4000/api`
   - URLs hardcoded nos arquivos HTML

2. **Problema de Caminhos:**
   - Arquivos HTML com caminhos absolutos (`/assets/`) que não funcionam quando abertos diretamente

3. **Problema de Manutenção:**
   - A cada build, as alterações eram perdidas

## ✅ Solução Implementada

### 1. Script Automatizado de Post-Build

Criamos um script que é executado automaticamente após cada build e:

- Copia `config.js` e `web.config` para a pasta `dist`
- Corrige a URL da API hardcoded nos arquivos HTML
- Corrige os caminhos de recursos (de `/assets/` para `assets/`)
- Adiciona carregamento do `config.js` em cada HTML

### 2. Arquivo de Configuração Dinâmico

Implementamos um sistema onde a URL da API é definida no arquivo `config.js`:

```javascript
// No config.js
window.API_CONFIG = {
  API_URL: 'http://recebimento.mercocamptech.com.br:4000/api'
};
```

```javascript
// Nos arquivos HTML
let API_BASE_URL = 'http://recebimento.mercocamptech.com.br:4000/api';
if (window.API_URL) {
    API_BASE_URL = window.API_URL;
}
```

### 3. Configuração do Backend

No backend, adicionamos o domínio à lista de origens permitidas:

```javascript
allowedOrigins: [
  'https://recebimento.mercocamptech.com.br',
  'http://recebimento.mercocamptech.com.br'
]
```

## 📋 Como Fazer Deploy

1. **Executar build:**
   ```bash
   npm run build
   ```
   O script post-build cuida de todas as configurações necessárias!

2. **Transferir arquivos para o servidor:**
   - Copie toda a pasta `dist` para `C:\inetpub\wwwroot\sistema-agendamentos\frontend`
   - Certifique-se de incluir `config.js` e `web.config`

3. **Verifique se o backend está rodando:**
   ```bash
   pm2 status
   ```

## 🔧 Arquivos e Suas Funções

| Arquivo | Função |
|---------|--------|
| `config.js` | Define URL da API e outras configurações |
| `web.config` | Configuração do IIS para rotas SPA |
| `post-build.cjs` | Script de automação pós-build |
| `package.json` | Configura npm para executar post-build |

## 📚 Referências

- **CORS:** [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- **IIS Configuração:** [Microsoft Docs](https://docs.microsoft.com/en-us/iis/configuration/)
- **Express CORS:** [Express.js CORS](https://expressjs.com/en/resources/middleware/cors.html)

## 🛠️ Para Manutenção Futura

- **Nunca hardcode URLs** em arquivos HTML
- **Sempre use o arquivo `config.js`** para configurações
- **Execute `npm run build`** antes de cada deploy
- **Verifique sempre o backend** após atualizar o frontend
