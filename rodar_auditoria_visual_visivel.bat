@echo off
echo =========================================
echo CEIC App - Auditoria E2E VISUAL (HEADed)
echo =========================================

REM garante diretorio do projeto
cd /d %~dp0

REM define baseURL correta
set PLAYWRIGHT_BASE_URL=http://127.0.0.1:5173

REM forca modo VISIVEL
set PLAYWRIGHT_HEADLESS=false

echo Iniciando auditoria E2E com navegador visivel...
echo.

npx playwright test tests/e2e/full-visual-audit.spec.js ^
  --project=chromium ^
  --headed ^
  --workers=1 ^
  --timeout=240000

echo.
echo Auditoria finalizada.
echo Relatorio HTML disponivel em:
echo playwright-report/index.html
echo.

pause
