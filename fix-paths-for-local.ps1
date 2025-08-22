# ===================================================
# AJUSTAR CAMINHOS PARA TESTE LOCAL
# ===================================================
# Execute este script após o build para testar localmente

Write-Host "Ajustando caminhos para teste local..." -ForegroundColor Yellow

# Arquivos HTML para ajustar
$htmlFiles = @("dist\index.html", "dist\login.html", "dist\schedule-verification.html")

foreach ($file in $htmlFiles) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        
        # Substituir caminhos absolutos por relativos
        $content = $content -replace 'href="/assets/', 'href="assets/'
        $content = $content -replace 'src="/assets/', 'src="assets/'
        $content = $content -replace 'src="/config.js"', 'src="config.js"'
        $content = $content -replace 'href="/config.js"', 'href="config.js"'
        
        Set-Content $file $content
        Write-Host "  ✅ Ajustado: $file" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "✅ Caminhos ajustados para teste local!" -ForegroundColor Green
Write-Host ""
Write-Host "Agora você pode:" -ForegroundColor Cyan
Write-Host "  1. Abrir dist\index.html diretamente no navegador" -ForegroundColor White
Write-Host "  2. Ou executar .\test-local-server.ps1 para um servidor local" -ForegroundColor White
Write-Host ""
Write-Host "⚠️ IMPORTANTE:" -ForegroundColor Yellow
Write-Host "  Para deploy no IIS, execute 'npm run build' novamente" -ForegroundColor White
Write-Host "  (os caminhos absolutos funcionam corretamente no servidor)" -ForegroundColor White

