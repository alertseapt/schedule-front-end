# Script para instalar o backend como serviço Windows usando NSSM
# Requer NSSM (Non-Sucking Service Manager) instalado
# Download: https://nssm.cc/download

param(
    [string]$ServiceName = "MercoCampAPI",
    [string]$DisplayName = "MercoCamp API Service",
    [string]$Description = "Servidor backend da aplicação MercoCamp"
)

# Verificar se está rodando como Administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERRO: Este script deve ser executado como Administrador!" -ForegroundColor Red
    Write-Host "Por favor, clique com o botão direito no PowerShell e escolha 'Executar como Administrador'" -ForegroundColor Yellow
    Exit 1
}

# Verificar se o NSSM está instalado
$nssmPath = $null
try {
    $nssmPath = (Get-Command nssm -ErrorAction Stop).Source
} catch {
    # Procurar no PATH
    $possiblePaths = @(
        "C:\Program Files\nssm\nssm.exe",
        "C:\Program Files (x86)\nssm\nssm.exe",
        "C:\nssm\nssm.exe",
        "$PSScriptRoot\nssm.exe"
    )
    
    foreach ($path in $possiblePaths) {
        if (Test-Path $path) {
            $nssmPath = $path
            break
        }
    }
    
    if ($null -eq $nssmPath) {
        Write-Host "ERRO: NSSM não encontrado!" -ForegroundColor Red
        Write-Host "Por favor, baixe o NSSM de https://nssm.cc/download e instale-o primeiro." -ForegroundColor Yellow
        Exit 1
    }
}

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "       INSTALAÇÃO DO BACKEND COMO SERVIÇO WINDOWS" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Obter o diretório atual do script
$scriptDir = $PSScriptRoot
$pythonPath = "python"

# Verificar se o Python está instalado
try {
    $pythonVersion = (python --version)
    Write-Host "Python encontrado: $pythonVersion" -ForegroundColor Green
} catch {
    try {
        $pythonVersion = (py --version)
        $pythonPath = "py"
        Write-Host "Python encontrado (py): $pythonVersion" -ForegroundColor Green
    } catch {
        Write-Host "ERRO: Python não encontrado no sistema!" -ForegroundColor Red
        Write-Host "Por favor, instale o Python e adicione-o ao PATH." -ForegroundColor Yellow
        Exit 1
    }
}

# Obter caminho absoluto para o backend
$backendPath = Resolve-Path $scriptDir
$waitressScriptPath = Join-Path $backendPath "run_waitress.py"

# Verificar se o arquivo run_waitress.py existe
if (-not (Test-Path $waitressScriptPath)) {
    Write-Host "ERRO: Arquivo run_waitress.py não encontrado em $backendPath" -ForegroundColor Red
    Exit 1
}

# Criar pasta de logs
$logsDir = Join-Path $backendPath "logs"
if (-not (Test-Path $logsDir)) {
    New-Item -Path $logsDir -ItemType Directory -Force | Out-Null
    Write-Host "Pasta de logs criada: $logsDir" -ForegroundColor Green
}

# Instalar dependências
Write-Host "Instalando dependências..." -ForegroundColor Yellow
Start-Process -FilePath $pythonPath -ArgumentList "-m", "pip", "install", "-r", "requirements.txt" -NoNewWindow -Wait
Write-Host "Dependências instaladas com sucesso!" -ForegroundColor Green

# Verificar se o serviço já existe
$serviceExists = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue

if ($null -ne $serviceExists) {
    Write-Host "O serviço '$ServiceName' já existe. Removendo..." -ForegroundColor Yellow
    & $nssmPath remove $ServiceName confirm
    Start-Sleep -Seconds 2
}

# Criar o serviço
Write-Host "Criando o serviço Windows '$ServiceName'..." -ForegroundColor Yellow
& $nssmPath install $ServiceName $pythonPath "$waitressScriptPath"
& $nssmPath set $ServiceName DisplayName $DisplayName
& $nssmPath set $ServiceName Description $Description
& $nssmPath set $ServiceName AppDirectory $backendPath
& $nssmPath set $ServiceName AppStdout "$logsDir\service-output.log"
& $nssmPath set $ServiceName AppStderr "$logsDir\service-error.log"
& $nssmPath set $ServiceName AppRotateFiles 1
& $nssmPath set $ServiceName AppRotateOnline 1
& $nssmPath set $ServiceName AppRotateSeconds 86400
& $nssmPath set $ServiceName AppRotateBytes 10485760
& $nssmPath set $ServiceName Start SERVICE_AUTO_START

Write-Host "Iniciando o serviço..." -ForegroundColor Yellow
Start-Service $ServiceName

# Verificar status
Start-Sleep -Seconds 3
$service = Get-Service -Name $ServiceName
if ($service.Status -eq "Running") {
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host "✅ SERVIÇO INSTALADO E INICIADO COM SUCESSO!" -ForegroundColor Green
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Nome do serviço: $ServiceName" -ForegroundColor White
    Write-Host "Status: $($service.Status)" -ForegroundColor Green
    Write-Host "Diretório de trabalho: $backendPath" -ForegroundColor White
    Write-Host "Logs: $logsDir" -ForegroundColor White
    Write-Host ""
    Write-Host "Para gerenciar o serviço:" -ForegroundColor Cyan
    Write-Host "  - Iniciar: Start-Service $ServiceName" -ForegroundColor Gray
    Write-Host "  - Parar: Stop-Service $ServiceName" -ForegroundColor Gray
    Write-Host "  - Reiniciar: Restart-Service $ServiceName" -ForegroundColor Gray
    Write-Host "  - Remover: $nssmPath remove $ServiceName confirm" -ForegroundColor Gray
} else {
    Write-Host "AVISO: O serviço foi criado mas não está rodando (Status: $($service.Status))" -ForegroundColor Yellow
    Write-Host "Verifique os logs de erro em: $logsDir\service-error.log" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Pressione qualquer tecla para continuar..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
