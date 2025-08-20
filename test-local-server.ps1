# ===================================================
# SERVIDOR LOCAL PARA TESTE (SEM PROBLEMAS DE CORS)
# ===================================================

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "   SERVIDOR LOCAL DE TESTE" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se Python está instalado
$pythonExists = Get-Command python -ErrorAction SilentlyContinue
if (-not $pythonExists) {
    # Tentar python3
    $pythonExists = Get-Command python3 -ErrorAction SilentlyContinue
    if ($pythonExists) {
        $pythonCmd = "python3"
    } else {
        Write-Host "Python não está instalado! Usando alternativa..." -ForegroundColor Yellow
        $pythonCmd = $null
    }
} else {
    $pythonCmd = "python"
}

# Navegar para pasta dist
Set-Location dist

if ($pythonCmd) {
    Write-Host "Iniciando servidor Python na porta 8080..." -ForegroundColor Green
    Write-Host "Acesse: http://localhost:8080" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Pressione CTRL+C para parar o servidor" -ForegroundColor Yellow
    & $pythonCmd -m http.server 8080
} else {
    # Alternativa com Node.js
    $nodeExists = Get-Command node -ErrorAction SilentlyContinue
    if ($nodeExists) {
        Write-Host "Instalando http-server..." -ForegroundColor Yellow
        npm install -g http-server
        
        Write-Host "Iniciando servidor Node.js na porta 8080..." -ForegroundColor Green
        Write-Host "Acesse: http://localhost:8080" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Pressione CTRL+C para parar o servidor" -ForegroundColor Yellow
        http-server -p 8080
    } else {
        Write-Host "❌ Nem Python nem Node.js estão instalados!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Instale um dos seguintes:" -ForegroundColor Yellow
        Write-Host "  - Python: https://www.python.org/downloads/" -ForegroundColor Gray
        Write-Host "  - Node.js: https://nodejs.org/" -ForegroundColor Gray
    }
}
