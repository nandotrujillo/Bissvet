@echo off
chcp 65001 >nul
title BISSVET - Modo Demo
color 0A

echo ================================================
echo        BISSVET - DEMOSTRACION
echo ================================================
echo.
echo Verificando MySQL 8...
sc query MySQL80 >nul 2>&1
if %errorlevel%==0 (
    echo   [OK] Servicio MySQL80 presente.
) else (
    echo   [ADVERTENCIA] No se detecto el servicio MySQL80.
)

echo.
echo ================================================
echo   PASO 1/2 - Servidor API (puerto 3000)
echo ================================================
netstat -ano | findstr /r ":3000 .*LISTENING" >nul 2>&1
if %errorlevel%==0 (
    echo   [OK] La API ya esta corriendo en el puerto 3000.
    goto api_lista
)
echo   Iniciando API...
start "BISSVET - API" /min cmd /c "cd /d %~dp0 && node src\server.js"
echo   Esperando que la API responda...
set /a contador=0
:esperar_api
timeout /t 1 /nobreak >nul
set /a contador+=1
curl -s -o nul -w "%%{http_code}" http://localhost:3000/ 2>nul | findstr "200" >nul 2>&1
if not %errorlevel%==0 (
    if %contador% lss 30 goto esperar_api
    echo   [ERROR] La API no respondio a tiempo.
    pause
    exit /b 1
)
echo   [OK] API respondiendo en http://localhost:3000
:api_lista

echo.
echo ================================================
echo   PASO 2/2 - Frontend Angular (puerto 4000)
echo ================================================
if not exist "dist\biss-vet-app\server\server.mjs" (
    echo   [AVISO] No existe el build de produccion. Compilando...
    call npm run build
)
netstat -ano | findstr /r ":4000 .*LISTENING" >nul 2>&1
if %errorlevel%==0 (
    echo   [OK] El frontend ya esta corriendo en el puerto 4000.
    goto front_listo
)
echo   Iniciando frontend (SSR)...
start "BISSVET - Frontend" /min cmd /c "cd /d %~dp0 && node dist\biss-vet-app\server\server.mjs"
echo   Esperando que el frontend responda...
set /a contador=0
:esperar_front
timeout /t 1 /nobreak >nul
set /a contador+=1
curl -s -o nul -w "%%{http_code}" http://localhost:4000/login 2>nul | findstr "200" >nul 2>&1
if not %errorlevel%==0 (
    if %contador% lss 30 goto esperar_front
    echo   [ERROR] El frontend no respondio a tiempo.
    pause
    exit /b 1
)
echo   [OK] Frontend respondiendo en http://localhost:4000
:front_listo

echo.
echo ================================================
echo   BISSVET lista para la demostracion:
echo.
echo     Frontend : http://localhost:4000
echo     API      : http://localhost:3000
echo     Login    : http://localhost:4000/login
echo ================================================
echo.
start "" http://localhost:4000/login
echo Abriendo el navegador...
timeout /t 2 /nobreak >nul
exit /b 0