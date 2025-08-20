# ===================================================
# CONFIGURAR PROXY REVERSO NO IIS (SOLUÇÃO RECOMENDADA)
# ===================================================
# Este script cria um web.config com proxy reverso para o backend
# Pré-requisito: Application Request Routing (ARR) instalado no IIS

param (
    [int]$BackendPort = 4000,
    [string]$BackendHost = "localhost"
)

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "   CONFIGURANDO PROXY REVERSO NO IIS" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se a pasta dist existe
if (-not (Test-Path "dist")) {
    Write-Host "❌ Pasta dist não encontrada! Execute 'npm run build' primeiro." -ForegroundColor Red
    exit 1
}

# Criar web.config com proxy reverso
$webConfigContent = @"
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <!-- Regras de rewrite para SPA Vue.js e proxy reverso para a API -->
    <rewrite>
      <rules>
        <!-- Proxy reverso para API - redireciona /api para o backend -->
        <rule name="API Proxy" stopProcessing="true">
          <match url="^api/(.*)" />
          <conditions>
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
          </conditions>
          <action type="Rewrite" url="http://${BackendHost}:${BackendPort}/api/{R:1}" />
        </rule>
        
        <!-- Regra para SPA - redireciona todas as outras URLs não-arquivo para index.html -->
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
      <outboundRules>
        <!-- Remover cabeçalhos de segurança que podem causar problemas -->
        <rule name="Remove Server header">
          <match serverVariable="RESPONSE_SERVER" pattern=".+" />
          <action type="Rewrite" value="" />
        </rule>
      </outboundRules>
    </rewrite>
    
    <!-- Configurações de proxy -->
    <httpProtocol>
      <customHeaders>
        <add name="X-Frame-Options" value="SAMEORIGIN" />
        <add name="X-Content-Type-Options" value="nosniff" />
      </customHeaders>
    </httpProtocol>
    
    <!-- Configurações de cache -->
    <staticContent>
      <clientCache cacheControlMode="UseMaxAge" cacheControlMaxAge="1.00:00:00" />
    </staticContent>
  </system.webServer>
</configuration>
"@

# Copiar para dist/web.config
Set-Content -Path "dist\web.config" -Value $webConfigContent
Write-Host "✅ Arquivo web.config com proxy reverso criado em dist/web.config" -ForegroundColor Green

# Criar arquivo config.js simplificado (usa o mesmo domínio)
$configContent = @"
// ===================================================
// CONFIGURAÇÃO PARA PROXY REVERSO
// ===================================================
// Gerado automaticamente para proxy reverso em: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

window.API_CONFIG = {
  // URL relativa da API (mesmo domínio graças ao proxy)
  API_URL: '/api',
  
  // Configurações adicionais
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  ENVIRONMENT: 'production',
  ENABLE_DEBUG: false,
  VERSION: '1.0.0'
};

// Exportar URL final da API
window.API_URL = window.API_CONFIG.API_URL;
console.log('API configurada para proxy reverso:', window.API_URL);
"@

# Copiar para dist/config.js
Set-Content -Path "dist\config.js" -Value $configContent
Write-Host "✅ Arquivo config.js para proxy reverso criado em dist/config.js" -ForegroundColor Green

Write-Host ""
Write-Host "CONFIGURAÇÃO DE PROXY REVERSO COMPLETA!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 INSTRUÇÕES ADICIONAIS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Instale o Application Request Routing (ARR) no IIS" -ForegroundColor White
Write-Host "   Download: https://www.iis.net/downloads/microsoft/application-request-routing" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Habilite o proxy reverso no IIS Manager:" -ForegroundColor White
Write-Host "   - Abra IIS Manager" -ForegroundColor Gray
Write-Host "   - Selecione o servidor" -ForegroundColor Gray
Write-Host "   - Clique duas vezes em 'Application Request Routing Cache'" -ForegroundColor Gray
Write-Host "   - Clique em 'Server Proxy Settings' à direita" -ForegroundColor Gray
Write-Host "   - Marque 'Enable proxy' e clique em 'Apply'" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Configure o backend para aceitar requisições do IIS:" -ForegroundColor White
Write-Host "   - Adicione 'localhost' às origens permitidas no CORS do backend" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Copie toda a pasta dist para o IIS" -ForegroundColor White
