@echo off
echo =======================================================
echo Iniciando teste de responsividade visual (Playwright)
echo =======================================================

echo Instalando navegadores do Playwright caso faltem...
call npx playwright install chromium

echo.
echo Executando o teste: responsividade-ceic.spec.js
echo Os navegadores devem se abrir para validar o layout...
call npx playwright test tests/e2e/responsividade-ceic.spec.js --headed

echo.
echo =======================================================
echo Teste concluido.
pause
