@echo off
title TESTE E2E VISUAL COMPLETO - CEIC

echo ==========================================
echo TESTE VISUAL COMPLETO (PASSO A PASSO)
echo ==========================================

REM Execucao segura via CMD
cmd.exe /c "npx playwright test fluxo_completo_com_baixa.spec.js --workers=1"

IF %ERRORLEVEL% NEQ 0 (
  echo.
  echo ERRO NO TESTE COMPLETO
  pause
  exit /b 1
)

echo.
echo ✅ TESTE COMPLETO FINALIZADO COM SUCESSO
pause