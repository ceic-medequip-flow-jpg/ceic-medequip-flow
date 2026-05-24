@echo off
setlocal
echo ========================================================
echo   TESTES E2E: FLUXO COMPLETO E LIMPEZA OPERACIONAL
echo ========================================================

:: Inicia o servidor local
echo Iniciando servidor local na porta 8081...
start /B npx http-server -p 8081 -c-1 --cors -s

:: Aguarda o servidor subir
timeout /t 3 /nobreak > nul

echo.
echo Executando FLUXO A: Completo com Baixa Definitiva...
call npx playwright test fluxo_completo_com_baixa.spec.js --project=chromium --headed
if %errorlevel% neq 0 (
    echo [ERRO] FLUXO A falhou. Execucao interrompida.
    exit /b %errorlevel%
)

echo.
echo Executando FLUXO B: Limpeza Total do Dashboard...
call npx playwright test limpeza_operacional.spec.js --project=chromium --headed
if %errorlevel% neq 0 (
    echo [ERRO] FLUXO B falhou. Execucao interrompida.
    exit /b %errorlevel%
)

echo.
echo ========================================================
echo [SUCESSO] Todos os testes passaram perfeitamente! NENHUM FAKE SUCCESS.
echo ========================================================
exit /b 0
