@echo off
setlocal ENABLEDELAYEDEXPANSION

echo ==========================================
echo CHECKLIST AUTOMATICO - ANTI FAKE SUCCESS
echo ==========================================
echo.

REM Vai para a pasta do projeto
cd /d "%~dp0"

REM Garante que as dependencias estao instaladas
echo Verificando dependencias...
if not exist node_modules (
    echo node_modules nao encontrado. Instalando dependencias...
    npm install
    if errorlevel 1 (
        echo ERRO ao instalar dependencias.
        exit /b 1
    )
)

REM Executa somente o teste critico
echo.
echo Executando testes Playwright...
npx playwright test anti_fake_success.spec.js
set TEST_RESULT=%ERRORLEVEL%

echo.
if %TEST_RESULT% NEQ 0 (
    echo ==========================================
    echo ❌ FALHA DETECTADA
    echo Alguma operacao NAO persistiu no banco.
    echo O bug de "fake success" voltou.
    echo ==========================================
    exit /b 1
) else (
    echo ==========================================
    echo ✅ SUCESSO TOTAL
    echo Todas as operacoes persistiram no banco.
    echo Nenhum fake success detectado.
    echo ==========================================
)

endlocal
pause
``