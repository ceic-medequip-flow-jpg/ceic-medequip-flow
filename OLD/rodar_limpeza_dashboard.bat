@echo off
title LIMPEZA OPERACIONAL - CEIC

echo ==========================================
echo LIMPEZA TOTAL DO DASHBOARD OPERACIONAL
echo ==========================================

REM FORÇA execucao via CMD (evita npx.ps1)
cmd.exe /c "npx playwright test limpeza_operacional.spec.js --workers=1"

IF %ERRORLEVEL% NEQ 0 (
  echo.
  echo ERRO NA LIMPEZA DO DASHBOARD
  pause
  exit /b 1
)

echo.
echo ✅ DASHBOARD ZERADO COM SUCESSO
pause