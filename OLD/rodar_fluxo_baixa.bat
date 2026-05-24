@echo off
chcp 65001 >nul
echo ========================================================
echo   Executando Teste: Fluxo Completo com Baixa (Anti-Fake)
echo ========================================================
echo.

echo Instalando/Atualizando dependencias (se necessario)...
call npm install
echo.

echo Executando o teste no Chromium (visivel)...
npx playwright test fluxo_completo_com_baixa.spec.js --project=chromium --headed

echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================================
    echo ✅ TESTE FINALIZADO COM SUCESSO!
    echo ========================================================
) else (
    echo ========================================================
    echo ❌ O TESTE FALHOU! VERIFIQUE O RELATORIO ABAIXO.
    echo ========================================================
    npx playwright show-report
)

pause
