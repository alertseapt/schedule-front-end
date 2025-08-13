# Configuração Centralizada da API

## Como alterar o endpoint da API

Para alterar o endpoint da API em todo o front-end, você precisa modificar apenas **UMA LINHA** no arquivo:

```
src/config/api.js
```

### Passo a passo:

1. Abra o arquivo `src/config/api.js`
2. Localize a linha:
   ```javascript
   const API_BASE_URL = 'http://localhost:4000/api'
   ```
3. Altere para o endpoint desejado:
   ```javascript
   const API_BASE_URL = 'https://seu-novo-endpoint.com/api'
   ```
4. Salve o arquivo
5. Rebuild o projeto se necessário

### Endpoints suportados automaticamente:

Todos os arquivos abaixo foram configurados para usar a configuração centralizada:

- ✅ `src/main.js` - Configuração axios global
- ✅ `src/App.vue` - API client principal
- ✅ `src/views/SettingsPage.vue` - Configurações do usuário
- ✅ `src/utils/auth-guard.js` - Guarda de autenticação
- ✅ `assets/js/config.js` - Configuração global window
- ✅ `assets/js/auth-guard.js` - Guarda de autenticação (assets)
- ✅ `assets/js/login.js` - Gerenciador de login
- ✅ `assets/js/vue/main.js` - Cliente API Vue (assets)

### Estrutura da configuração:

```javascript
export const API_CONFIG = {
  BASE_URL: 'http://localhost:4000/api',
  ENDPOINTS: {
    AUTH: 'http://localhost:4000/api/auth',
    USERS: 'http://localhost:4000/api/users',
    SCHEDULES: 'http://localhost:4000/api/schedules',
    SETTINGS: 'http://localhost:4000/api/user-settings'
  }
}
```

### Compatibilidade:

- **Módulos ES6**: Importam diretamente de `src/config/api.js`
- **Scripts clássicos**: Usam `window.API_CONFIG.BASE_URL` com fallback
- **Build**: Sem impacto na performance ou tamanho do bundle

### Exemplos de uso comum:

**Desenvolvimento local:**
```javascript
const API_BASE_URL = 'http://localhost:4000/api'
```

**Produção Railway:**
```javascript
const API_BASE_URL = 'https://schedule-mercocamp-back-end.up.railway.app/api'
```

**Produção customizada:**
```javascript
const API_BASE_URL = 'https://api.minhaaplicacao.com/v1'
```

---

**⚠️ IMPORTANTE:** 
- Não altere os outros arquivos manualmente
- Sempre use apenas o arquivo `src/config/api.js`
- Faça rebuild após alterar em produção