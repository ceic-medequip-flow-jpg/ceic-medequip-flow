@echo off
chcp 65001 >nul
echo ==========================================
echo AUDITORIA VISUAL COMPLETA - CEIC APP
echo ==========================================
echo.
echo [1] Iniciando Playwright (Testes Visuais)...
call npx playwright test tests/e2e/full-visual-audit.spec.js
echo.
echo [2] Gerando relatorios consolidados...
call node tests/helpers/generate-report.js
echo.
echo [3] Abrindo o Relatorio Unico de Erros...
start "" "qa-reports\latest\RELATORIO_DE_ERROS_CEIC.html"
start notepad "qa-reports\latest\RELATORIO_DE_ERROS_CEIC.txt"
pause
