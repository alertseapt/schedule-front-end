# Solução para o Erro 405 (Method Not Allowed) no Proxy Reverso

Este documento descreve como resolver o erro 405 (Method Not Allowed) que ocorre durante tentativas de login quando o proxy reverso não está configurado corretamente.

## Problema

O erro ocorre quando:
- A URL da API é carregada corretamente como `/api`
- As requisições para `/api/auth/login` retornam erro 405
- O servidor está retornando HTML em vez de JSON, indicando que o proxy reverso não está funcionando

## Solução: Configuração Correta do Proxy Reverso no IIS

### 1. Verificar Instalação do ARR

Primeiro, certifique-se que o Application Request Routing (ARR) está instalado e habilitado:

1. Abra o IIS Manager
2. Selecione o servidor (não um site específico)
3. Localize o ícone "Application Request Routing Cache"
4. Clique duas vezes para abrir
5. No painel direito, clique em "Server Proxy Settings"
6. **Marque a opção "Enable proxy"**
7. Clique em "Apply"

Se não encontrar o ARR, instale-o:
- Baixe em https://www.iis.net/downloads/microsoft/application-request-routing
- Execute o instalador e siga as instruções

### 2. Verificar o web.config

O arquivo `web.config` deve conter a configuração correta para proxy reverso. Substitua pelo conteúdo:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <!-- Regras de rewrite para SPA Vue.js e proxy reverso para a API -->
    <rewrite>
      <rules>
        <!-- Proxy reverso para API - redireciona /api para o backend -->
        <rule name="API Proxy" stopProcessing="true">
          <match url="^api/(.*)" />
          <action type="Rewrite" url="http://localhost:4000/api/{R:1}" />
          <serverVariables>
            <set name="HTTP_ACCEPT_ENCODING" value="" />
            <set name="HTTP_X_ORIGINAL_HOST" value="{HTTP_HOST}" />
          </serverVariables>
        </rule>
        
        <!-- Regra para SPA - redireciona outras URLs para index.html -->
        <rule name="SPA Routes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
            <add input="{REQUEST_URI}" pattern="^/api" negate="true" />
          </conditions>
          <action type="Rewrite" url="/index.html" />
        </rule>
      </rules>
    </rewrite>

    <!-- Configuração para Application Request Routing -->
    <proxy enabled="true" preserveHostHeader="true" reverseRewriteHostInResponseHeaders="false" />
    
    <!-- Suporte a método OPTIONS para CORS -->
    <handlers>
      <remove name="OPTIONSVerbHandler" />
      <add name="OPTIONSVerbHandler" path="*" verb="OPTIONS" modules="ProtocolSupportModule" resourceType="Unspecified" requireAccess="Read" />
    </handlers>
  </system.webServer>
</configuration>
```

### 3. Verificar se o Backend está Rodando

Certifique-se que o servidor backend Python está rodando na porta 4000:

```batch
cd backend
python run_waitress.py
```

### 4. Testar a Configuração

Para diagnosticar problemas no proxy reverso:

1. Copie o arquivo `verificar_proxy_reverso.html` para a pasta raiz do site
2. Acesse `http://seu-servidor/verificar_proxy_reverso.html`
3. Clique em "Executar Testes" para verificar a configuração

### 5. Reiniciar o IIS

Após fazer as alterações:

1. Abra um prompt de comando como administrador
2. Execute:
   ```
   iisreset
   ```

## Problemas Comuns e Soluções

### Se o ARR não estiver redirecionando corretamente:

1. Verifique o log do IIS em `C:\inetpub\logs\LogFiles\W3SVC1\`
2. Certifique-se que a tag `<proxy enabled="true">` está presente no web.config
3. Verifique se o servidor backend está acessível da máquina IIS

### Se houver erros CORS:

1. Adicione seu domínio à lista de `allowed_origins` no arquivo `app.py`
2. Verifique se o cabeçalho `Access-Control-Allow-Origin` está sendo enviado corretamente

### Se o método POST estiver bloqueado:

1. Certifique-se que o WebDAV está desabilitado ou configurado para não interferir
2. Verifique se há regras de firewall ou de segurança bloqueando requisições POST
