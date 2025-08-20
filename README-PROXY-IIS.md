# Guia Passo a Passo: Proxy Reverso IIS + Python Flask + Vue.js

Este guia explica como configurar o proxy reverso no IIS para integrar uma aplicação Vue.js (frontend) com uma API Flask (backend) na mesma máquina virtual.

## Pré-requisitos

- Windows Server com IIS instalado
- Python 3.6+ instalado
- Node.js e NPM instalados (para build do frontend)
- Application Request Routing (ARR) instalado no IIS
- URL Rewrite Module instalado no IIS

## 1. Preparar o Ambiente IIS

### Instalar ARR (Application Request Routing)

1. Baixe e instale o ARR do site da Microsoft:
   https://www.iis.net/downloads/microsoft/application-request-routing

2. Baixe e instale o URL Rewrite Module:
   https://www.iis.net/downloads/microsoft/url-rewrite

3. Abra o IIS Manager e selecione o servidor
4. Clique duas vezes em "Application Request Routing Cache"
5. No painel da direita, clique em "Server Proxy Settings"
6. Marque a opção "Enable Proxy" e clique em "Apply"

## 2. Build do Frontend Integrado

Execute o comando de build integrado na pasta do projeto:

```bash
npm run build:integrated
```

Este comando:
- Faz o build do frontend Vue.js
- Copia os arquivos estáticos para a pasta backend/dist
- Configura o web.config com as regras de proxy reverso

## 3. Configurar o Site no IIS

### Criar Novo Site

1. Abra o IIS Manager
2. Expanda o servidor e clique com o botão direito em "Sites"
3. Selecione "Add Website"
4. Preencha as informações:
   - Site name: Nome do seu aplicativo (ex: "MercoCampApp")
   - Physical path: Caminho para a pasta backend (ex: "C:\inetpub\wwwroot\mercocamp\backend")
   - Binding: Configuração de porta/hostname conforme necessário
   - Clique OK

### Verificar Permissões

1. Certifique-se que o usuário do pool de aplicativos tem permissão para:
   - Ler arquivos na pasta backend/dist
   - Executar o Python

## 4. Iniciar o Backend Flask

### Como Aplicação Python

Inicie o backend com o comando:

```bash
cd C:\caminho\para\backend
python run.py
```

### Como Serviço Windows (Recomendado)

Para inicialização automática, configure o Flask como um serviço Windows:

1. Instale o NSSM (Non-Sucking Service Manager):
   https://nssm.cc/download

2. Abra o prompt de comando como administrador e execute:

```batch
nssm install MercoCampAPI "C:\caminho\para\python.exe" "C:\caminho\para\backend\run.py"
nssm set MercoCampAPI AppDirectory "C:\caminho\para\backend"
nssm start MercoCampAPI
```

## 5. Testar a Configuração

1. Abra um navegador e acesse a URL do site
2. Verifique se a interface do Vue.js carrega corretamente
3. Teste alguma funcionalidade que faça chamadas à API

## Estrutura de Arquivos

A estrutura final do projeto no servidor deve ser:

```
C:\caminho\para\backend\
  ├── app.py
  ├── init_app.py
  ├── run.py
  ├── requirements.txt
  ├── outros arquivos do backend...
  └── dist\
      ├── index.html
      ├── assets\
      ├── config.js
      └── web.config
```

## Verificação do web.config

O arquivo web.config na pasta dist deve conter estas regras:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <!-- Proxy reverso para API -->
        <rule name="API Proxy" stopProcessing="true">
          <match url="^api/(.*)" />
          <conditions>
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
          </conditions>
          <action type="Rewrite" url="http://localhost:4000/api/{R:1}" />
        </rule>
        
        <!-- Regra para SPA -->
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
  </system.webServer>
</configuration>
```

## Diagnóstico de Problemas

### Logs de Erro do IIS

Verifique os logs em:
`C:\inetpub\logs\LogFiles\W3SVC1\`

### Problemas Comuns

1. **Erro 502.3 - Bad Gateway**:
   - Verifique se o backend Flask está rodando
   - Confirme se a porta 4000 está acessível internamente

2. **Erro 404 em Rotas da API**:
   - Verifique se o web.config está configurado corretamente
   - Certifique-se que o ARR está instalado e habilitado

3. **Erro 404 em Arquivos Estáticos**:
   - Verifique se a pasta dist existe e tem o conteúdo correto
   - Confirme as permissões da pasta
