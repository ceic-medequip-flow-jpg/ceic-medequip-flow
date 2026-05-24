@echo off
echo ==========================================
echo INSTALANDO O PLAYWRIGHT NO PROJETO
echo ==========================================
echo.
echo Passo 1/2: Baixando o pacote @playwright/test via NPM...
call npm install

echo.
echo Passo 2/2: Baixando os navegadores do Playwright...
call npx playwright install

echo.
echo ==========================================
echo CONCLUIDO! Pode rodar a auditoria visual.
echo ==========================================
pause