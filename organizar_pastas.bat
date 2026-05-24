@echo off
echo ==========================================
echo ORGANIZANDO AS PASTAS DOS TESTES
echo ==========================================
echo.
mkdir "tests\e2e" 2>nul
mkdir "tests\helpers" 2>nul
mkdir "tests\fixtures" 2>nul

move "full-visual-audit.spec.js" "tests\e2e\" >nul 2>&1
move "generate-report.js" "tests\helpers\" >nul 2>&1
move "diagnostics.js" "tests\helpers\" >nul 2>&1
move "auth.js" "tests\helpers\" >nul 2>&1
move "actions.js" "tests\helpers\" >nul 2>&1
move "classifiers.js" "tests\helpers\" >nul 2>&1
move "users.json" "tests\fixtures\" >nul 2>&1
move "actions-matrix.json" "tests\fixtures\" >nul 2>&1

echo Estrutura de pastas corrigida com sucesso!
echo Pode executar o rodar_auditoria_visual.bat novamente.
pause