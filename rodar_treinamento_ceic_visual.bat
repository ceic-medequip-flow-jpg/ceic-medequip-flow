@echo off
chcp 65001 >nul
echo =========================================
echo CEIC App - TREINAMENTO OPERACIONAL VISUAL
echo =========================================
echo.

cd /d %~dp0

set PLAYWRIGHT_BASE_URL=http://127.0.0.1:5173
set PLAYWRIGHT_HEADLESS=false
set CEIC_TRAINING_STEP_DELAY=1200

echo Iniciando teste visual de treinamento com navegador aberto...
echo Este modo e lento de proposito para acompanhamento da equipe.
echo.

npx playwright test tests/e2e/treinamento-operacional-ceic.spec.js ^
  --project=chromium ^
  --headed ^
  --workers=1 ^
  --timeout=300000

echo.
echo =========================================
echo Treinamento operacional finalizado.
echo Relatorio Playwright:
echo playwright-report/index.html
echo =========================================
echo.

pause
