@echo off
chcp 65001 >nul
echo =========================================
echo CEIC App - VERIFICACAO VISUAL DE FALHAS
echo =========================================
echo.

cd /d %~dp0

set PLAYWRIGHT_BASE_URL=http://127.0.0.1:5173
set PLAYWRIGHT_HEADLESS=false
set CEIC_TRAINING_STEP_DELAY=1200

npx playwright test tests/e2e/verificar-correcoes-falhas-operacionais.spec.js ^
  --project=chromium ^
  --headed ^
  --workers=1 ^
  --timeout=300000

echo.
echo Verificacao finalizada.
echo Relatorio Playwright:
echo playwright-report/index.html
echo.

pause