# ===================================================
# CONFIGURAR API PARA PRODUÇÃO
# ===================================================
# Este script configura o arquivo config.js para produção

param (
    [string]$Domain = "recebimento.mercocamptech.com.br",
    [string]$Protocol = "http",
    [int]$BackendPort = 4000
)

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "   CONFIGURANDO API PARA PRODUÇÃO" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se a pasta dist existe
if (-not (Test-Path "dist")) {
    Write-Host "❌ Pasta dist não encontrada! Execute 'npm run build' primeiro." -ForegroundColor Red
    exit 1
}

# Verificar se o arquivo config.production.js existe
if (-not (Test-Path "config.production.js")) {
    Write-Host "❌ Arquivo config.production.js não encontrado!" -ForegroundColor Red
    exit 1
}

# Criar config.js para produção
$apiUrl = "${Protocol}://${Domain}:${BackendPort}/api"

$configContent = @"
// ===================================================
// CONFIGURAÇÃO PARA PRODUÇÃO
// ===================================================
// Gerado automaticamente para produção em: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

window.API_CONFIG = {
  // URL fixa do backend em produção
  API_URL: '${apiUrl}',
  
  // Configurações adicionais
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  ENVIRONMENT: 'production',
  ENABLE_DEBUG: false,
  VERSION: '1.0.0'
};

// Exportar URL final da API
window.API_URL = window.API_CONFIG.API_URL;
console.log('API configurada para produção:', window.API_URL);
"@

# Copiar para dist/config.js
Set-Content -Path "dist\config.js" -Value $configContent
Write-Host "✅ Arquivo config.js criado em dist/config.js" -ForegroundColor Green
Write-Host ""
Write-Host "API configurada para:" -ForegroundColor Yellow
Write-Host "   $apiUrl" -ForegroundColor White

# Verificar se o backend permite este domínio no CORS
Write-Host ""
Write-Host "⚠️ IMPORTANTE: Certifique-se que o backend permite este domínio no CORS" -ForegroundColor Yellow
Write-Host "   Verifique se o backend tem esta origem permitida:" -ForegroundColor White
Write-Host "   '${Protocol}://${Domain}'" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Em app.js ou .env do backend adicione:" -ForegroundColor White
Write-Host "   ALLOWED_ORIGINS=${Protocol}://${Domain}" -ForegroundColor Cyan
