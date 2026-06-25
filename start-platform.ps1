# start-platform.ps1
# Automates the startup of the entire ISIP platform on Windows (PowerShell)

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  Industrial Safety Intelligence Platform (ISIP) Startup" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green

# 1. Check Python virtual environment
$VenvPath = Join-Path (Get-Location) "venv"
if (-not (Test-Path $VenvPath)) {
    Write-Host "[ERROR] Python virtual environment (venv) not found in root directory!" -ForegroundColor Red
    Write-Host "Please create one and run backend/requirements.txt installation first." -ForegroundColor Yellow
    Exit 1
}

# 2. Check Node modules in frontend
$NodeModulesPath = Join-Path (Get-Location) "frontend\node_modules"
if (-not (Test-Path $NodeModulesPath)) {
    Write-Host "[WARNING] frontend/node_modules not found. Performing npm install..." -ForegroundColor Yellow
    Push-Location frontend
    npm install
    Pop-Location
}

# 3. Start Backend API Server
Write-Host "[1/3] Launching FastAPI Backend on http://localhost:8000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; ..\venv\Scripts\python main.py"

# 4. Start Frontend Vite Development Server
Write-Host "[2/3] Launching Vite Frontend on http://localhost:3000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

# 5. Start Interactive Sensor Simulator CLI
Write-Host "[3/3] Launching Interactive Sensor Simulator CLI..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; ..\venv\Scripts\python sensor_simulator.py"

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  All services launched successfully in separate windows!" -ForegroundColor Green
Write-Host "  - Backend API: http://localhost:8000" -ForegroundColor Cyan
Write-Host "  - Swagger Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "  - React Dashboard: http://localhost:3000" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Green
