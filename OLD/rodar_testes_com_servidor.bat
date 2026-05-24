@echo off
chcp 65001 >nul
echo ========================================================
echo   Testes de Automacao CEIC: E2E e Limpeza (Anti-Fake)
echo ========================================================
echo.

echo Instalando dependencias se necessario...
call npm install
echo.

echo [1/3] Iniciando o servidor local (http-server na porta 8081)...
start /B npx http-server . -p 8081 -c-1 --cors > nul 2>&1
:: Ping para dar tempo do servidor subir com seguranca
ping 127.0.0.1 -n 4 > nul

echo.
echo [2/3] Executando FLUXO A: Completo com Baixa Definitiva...
call npx playwright test fluxo_completo_com_baixa.spec.js --project=chromium --headed
set EXIT_A=%ERRORLEVEL%

echo.
echo [3/3] Executando FLUXO B: Limpeza Total do Dashboard...
call npx playwright test limpeza_operacional.spec.js --project=chromium --headed
set EXIT_B=%ERRORLEVEL%

echo.
echo ========================================================
echo Finalizando servidor local...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8081 ^| find "LISTENING"') do taskkill /F /PID %%a > nul 2>&1
echo ========================================================

if %EXIT_A% NEQ 0 (
    echo ❌ FALHA NO FLUXO A (Fluxo Completo com Baixa). Ocorreu um erro de persistencia ou Fake Success.
    echo Exibindo relatorio...
    call npx playwright show-report
    exit /b %EXIT_A%
)
if %EXIT_B% NEQ 0 (
    echo ❌ FALHA NO FLUXO B (Limpeza Operacional). Fake success detectado no cancelamento!
    echo Exibindo relatorio...
    call npx playwright show-report
    exit /b %EXIT_B%
)

echo ✅ TODOS OS TESTES PASSARAM COM SUCESSO (Sem fake success)!
exit /b 0
