@echo off
echo ==========================================
echo TESTE VISUAL - LIMPEZA TOTAL DO DASHBOARD
echo ==========================================

REM NAO subir servidor aqui (Playwright cuida disso)

echo.
echo INICIANDO LIMPEZA OPERACIONAL...
npx playwright test limpeza_operacional.spec.js --workers=1

IF %ERRORLEVEL% NEQ 0 (
  echo ERRO NA LIMPEZA DO DASHBOARD
  pause
  exit /b 1
)

echo.
echo ✅ DASHBOARD ZERADO COM SUCESSO
pause