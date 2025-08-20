@echo off
echo ============================================================
echo      INICIANDO SERVIDOR WAITRESS (PRODUCAO)
echo ============================================================
echo.

rem Verificar se Python esta instalado
where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Python nao encontrado! Verifique se o Python esta instalado e no PATH.
    echo.
    echo Tentando com comando py...
    
    where py >nul 2>nul
    if %ERRORLEVEL% neq 0 (
        echo ERRO: Python nao encontrado no sistema!
        echo Por favor, instale o Python ou adicione ao PATH.
        goto :error
    ) else (
        set PYTHON_CMD=py
    )
) else (
    set PYTHON_CMD=python
)

rem Verificar se as dependencias estao instaladas
echo Verificando dependencias...
%PYTHON_CMD% -c "import waitress" >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Instalando Waitress...
    %PYTHON_CMD% -m pip install waitress
    if %ERRORLEVEL% neq 0 (
        echo ERRO: Falha ao instalar o Waitress!
        goto :error
    )
)

echo.
echo Iniciando servidor Waitress...
echo.

%PYTHON_CMD% run_waitress.py

if %ERRORLEVEL% neq 0 (
    echo.
    echo ERRO: Falha ao iniciar o servidor!
    goto :error
)

goto :end

:error
echo.
echo ============================================================
echo      ERRO AO INICIAR O SERVIDOR
echo ============================================================
echo.
pause
exit /b 1

:end
echo.
echo Servidor finalizado.
pause
