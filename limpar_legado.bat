@echo off
echo ==========================================
echo LIMPANDO ARQUIVOS FORA DO LUGAR E LEGADO
echo ==========================================
echo.

if exist "OLD" rmdir /s /q "OLD"
if exist "Erros" rmdir /s /q "Erros"
if exist "anti_fake_success.spec.js" del /q "anti_fake_success.spec.js"
if exist "relatorio_erros_ia.json" del /q "relatorio_erros_ia.json"

:: Remove os arquivos de teste que foram criados na raiz por engano
if exist "users.json" del /q "users.json"
if exist "actions-matrix.json" del /q "actions-matrix.json"
if exist "classifiers.js" del /q "classifiers.js"
if exist "diagnostics.js" del /q "diagnostics.js"
if exist "auth.js" del /q "auth.js"
if exist "actions.js" del /q "actions.js"
if exist "generate-report.js" del /q "generate-report.js"
if exist "full-visual-audit.spec.js" del /q "full-visual-audit.spec.js"

echo Limpeza concluida com sucesso!
echo Os arquivos perdidos na raiz foram removidos.
echo.
pause