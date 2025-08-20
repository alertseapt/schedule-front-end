# 📄 Arquivo web.config para IIS

## Versão Simples (Recomendada)

O arquivo `web.config` contém a configuração **mínima essencial** para o funcionamento correto do Vue.js no IIS:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="SPA Routes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/index.html" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
```

### O que faz?

- **Regra de Rewrite:** Redireciona todas as URLs que não correspondem a arquivos ou diretórios existentes para `index.html`
- **Essencial para SPA:** Permite que o Vue Router funcione corretamente com URLs limpas

## Pré-requisitos

Para que o `web.config` funcione, você precisa ter instalado no IIS:

1. **URL Rewrite Module**
   - Download: https://www.iis.net/downloads/microsoft/url-rewrite
   - Versão 2.1 ou superior

## Como usar?

1. **Build do Frontend:**
   ```bash
   npm run build
   ```

2. **Copiar arquivos:**
   - Copie a pasta `dist` gerada para o servidor
   - O `web.config` deve estar dentro da pasta `dist`

3. **Configurar IIS:**
   - Crie um novo site apontando para a pasta `dist`
   - O IIS lerá automaticamente o `web.config`

## Versão Estendida (Opcional)

Se precisar de recursos adicionais, use `web.config.extended`:

- **Tipos MIME:** Para arquivos JSON
- **Headers de Segurança:** Proteção básica XSS

## Troubleshooting

### Erro: 500.19 - Internal Server Error

**Causa:** URL Rewrite Module não está instalado
**Solução:** Instale o módulo do link acima

### Erro: 404 ao acessar rotas

**Causa:** Regra de rewrite não está funcionando
**Solução:** Verifique se o arquivo está na raiz do site

### Erro: Arquivos JSON não carregam

**Causa:** Tipo MIME não configurado
**Solução:** Use a versão estendida do web.config

## Dicas

✅ **Mantenha simples:** Use apenas o necessário
✅ **Teste localmente:** Configure IIS Express para testar
✅ **Backup:** Sempre faça backup antes de alterar

## Estrutura Final no Servidor

```
C:\inetpub\wwwroot\seu-site\
├── web.config         ← Arquivo de configuração
├── config.js          ← Configuração da API
├── index.html         ← Página principal
├── assets/            ← Recursos estáticos
│   ├── css/
│   └── js/
└── favicon.ico
```

---

**Nota:** Este `web.config` simples é suficiente para 99% dos casos de uso com Vue.js no IIS.
