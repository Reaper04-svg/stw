@echo off
setlocal

REM Regenerate schematic manifest using R2 assets
set SCHEMATIC_BASE_URL=https://pub-17ddd707045a4fe49c27873e18fd6655.r2.dev
set VITE_SCHEMATIC_BASE_URL=https://pub-17ddd707045a4fe49c27873e18fd6655.r2.dev

cd /d "%~dp0"

echo [prep] Ensuring required folders exist...
if not exist "public\schematics\traps" mkdir "public\schematics\traps"
if not exist "public\schematics\melee" mkdir "public\schematics\melee"
if not exist "public\schematics\guns" mkdir "public\schematics\guns"
if not exist "public\generated" mkdir "public\generated"

echo [manifest] Scanning public\schematics\ and generating thumbnails...
node scripts\generate-schematic-manifest.mjs

if %ERRORLEVEL% NEQ 0 (
  echo [manifest] Failed with error code %ERRORLEVEL%
  endlocal
  pause
  exit /b %ERRORLEVEL%
)

echo.
echo [done] Manifest regenerated with R2 URLs.
echo [next] Upload these folders to R2 bucket "stw-schematic-vault-assets":
echo        - public\schematics\  -> schematics\
echo        - public\generated\   -> generated\
echo [next] Then commit and push src\data\schematic-manifest.generated.json
echo.
endlocal
pause
