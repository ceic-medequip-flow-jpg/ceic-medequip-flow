@echo off
chcp 65001 >nul

echo =========================================
echo CEIC APP - AUDITORIA OPERACIONAL COMPLETA
echo =========================================
echo.

cd /d %~dp0

set PLAYWRIGHT_BASE_URL=http://127.0.0.1:5173
set PLAYWRIGHT_HEADLESS=false
set CEIC_TRAINING_STEP_DELAY=700

echo [1/4] Build do sistema...
call npm run build
if errorlevel 1 (
  echo BUILD_FALHOU - Corrija antes de prosseguir.
  pause
  exit /b 1
)

echo.
echo [2/4] Subindo CEIC App em porta fixa 5173...
start "CEIC_DEV_SERVER" cmd /k "npm run dev -- --host 127.0.0.1 --port 5173 --strictPort"

echo.
echo [3/4] Aguardando CEIC App responder em http://127.0.0.1:5173 ...

set SERVER_OK=0

for /l %%i in (1,1,30) do (
  powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:5173' -UseBasicParsing -TimeoutSec 2; if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 500) { exit 0 } else { exit 1 } } catch { exit 1 }"
  if not errorlevel 1 (
    set SERVER_OK=1
    goto servidor_ok
  )
  timeout /t 2 >nul
)

:servidor_ok
if "%SERVER_OK%"=="0" (
  echo.
  echo SERVIDOR_CEIC_NAO_RESPONDEU
  echo Verifique se a porta 5173 esta ocupada ou se npm run dev falhou.
  pause
  exit /b 1
)

echo.
echo CEIC App confirmado em http://127.0.0.1:5173

echo.
echo =========================================
echo IMPORTANTE:
echo - Nao pressione Ctrl+C.
echo - Nao feche o navegador Chromium.
echo - Nao feche esta janela.
echo - Aguarde a auditoria finalizar sozinha.
echo =========================================
echo.
timeout /t 5 >nul

echo [4/4] Rodando auditoria operacional completa...
call npx playwright test tests/e2e/auditoria-operacional-completa-ceic.spec.js ^
  --project=chromium ^
  --headed ^
  --workers=1 ^
  --timeout=900000

echo.
echo =========================================
echo Auditoria operacional finalizada.
echo Relatorios gerados em:
echo qa-reports/latest/AUDITORIA_OPERACIONAL_COMPLETA_CEIC.txt
echo qa-reports/latest/AUDITORIA_OPERACIONAL_COMPLETA_CEIC.json
echo qa-reports/latest/AUDITORIA_OPERACIONAL_COMPLETA_CEIC.html
echo playwright-report/index.html
echo =========================================
echo.

pause
