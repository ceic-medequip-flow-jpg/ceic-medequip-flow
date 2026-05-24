@echo off
chcp 65001 >nul
echo ========================================================
echo CONFIGURACAO AUTOMATICA E EXECUCAO DOS TESTES (PLAYWRIGHT)
echo ========================================================

cd /d "C:\Users\Jesus Cavalcante\Documents\CEIC_App"

echo [1/3] Inicializando projeto e instalando pacotes...
call npm init -y
call npm install -D @playwright/test http-server

echo [2/3] Baixando o navegador para o robo...
call npx playwright install chromium --with-deps

echo [3/3] Subindo o servidor e rodando a suite COMPLETA de testes!
call npx playwright test --headed

echo ========================================================
echo SE HOUVER ERROS: O Playwright gerou o arquivo "relatorio_erros_ia.json".
echo Copie o conteudo desse arquivo e mande no chat para o assistente arrumar.
echo ========================================================

pause