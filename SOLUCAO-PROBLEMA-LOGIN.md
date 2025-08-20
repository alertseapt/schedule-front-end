# Solução para o Problema de Login (405 Method Not Allowed)

Este documento explica o problema de incompatibilidade entre o frontend e o backend na funcionalidade de login e a solução implementada.

## O Problema

O erro 405 (Method Not Allowed) estava ocorrendo devido a duas questões principais:

1. **Incompatibilidade no formato de dados**: O frontend estava enviando `username` enquanto o backend esperava `user`.
2. **Problemas de configuração do proxy reverso**: A configuração do web.config não estava habilitando corretamente o proxy reverso.

## Soluções Implementadas

### 1. Compatibilidade de Parâmetros no Backend (Flask)

Modificamos o backend para aceitar ambos os formatos:

```python
# Compatibilidade com frontend: aceita tanto 'user' quanto 'username'
if 'user' in data:
    user = data['user']
elif 'username' in data:
    user = data['username']
else:
    return jsonify({'error': 'Usuário é obrigatório'}), 400
```

### 2. Script de Compatibilidade no Frontend

Criamos um script de compatibilidade (`compatibilidade-login.js`) que intercepta as requisições de login e transforma o formato dos dados quando necessário:

```javascript
window.fetch = async function(url, options) {
    // Verificar se é uma requisição para a rota de login
    if (url === `${apiUrl}/auth/login` && options && options.method === 'POST') {
        // Parsear o corpo da requisição
        const body = JSON.parse(options.body);
        
        // Verificar se há um campo 'username' em vez de 'user'
        if (body.username && !body.user) {
            // Criar novo corpo com o formato esperado pelo backend Flask
            const newBody = {
                user: body.username,
                password: body.password
            };
            
            // Atualizar opções com o novo corpo
            const newOptions = {
                ...options,
                body: JSON.stringify(newBody)
            };
            
            // Fazer a requisição com o corpo modificado
            return originalFetch(url, newOptions);
        }
    }
    
    // Para outras requisições, usar o fetch original
    return originalFetch(url, options);
};
```

### 3. Correção da Configuração do Proxy Reverso

Atualizamos o arquivo `web.config` para garantir que:

1. O proxy esteja habilitado corretamente: `<proxy enabled="true" />`
2. As requisições POST para `/api/auth/login` sejam tratadas adequadamente
3. Os cabeçalhos CORS sejam configurados corretamente

### 4. Carregamento do Config.js

Atualizamos o `login.html` para carregar o `config.js` e usar a URL da API definida nele:

```html
<script src="config.js"></script>
<script src="compatibilidade-login.js"></script>
<script>
    // Configuração da API
    const API_BASE_URL = window.API_URL || 'http://localhost:4000/api';
    console.log('URL da API carregada do config.js:', API_BASE_URL);
</script>
```

## Como Funciona

1. O `config.js` é carregado e define a URL da API baseada no ambiente (`/api` para proxy reverso)
2. O script de compatibilidade intercepta requisições de login e faz as adaptações necessárias
3. O backend aceita tanto o formato antigo quanto o novo
4. O proxy reverso encaminha as requisições para o backend Python

## Verificação

Para verificar se a solução está funcionando:

1. Abra as Ferramentas do Desenvolvedor no navegador (F12)
2. Vá para a aba "Rede" (Network)
3. Tente fazer login
4. Observe a requisição para `/api/auth/login`:
   - Método: POST
   - Status: 200 OK (sucesso) ou 401 (credenciais inválidas)
   - Resposta: Deve ser um objeto JSON com token e dados do usuário

Se ainda houver problemas, verifique:

1. Se o backend Flask está rodando na porta 4000
2. Se o Application Request Routing está habilitado no IIS
3. Se o arquivo `web.config` está na pasta raiz do site
4. Se os scripts `config.js` e `compatibilidade-login.js` estão sendo carregados corretamente
