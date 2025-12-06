# Script para verificar la conexión a PostgreSQL

Write-Host "Verificando conexión a PostgreSQL..." -ForegroundColor Yellow
Write-Host ""

# Verificar que el contenedor esté corriendo
Write-Host "1. Verificando contenedor..." -ForegroundColor Cyan
$container = docker ps --filter "name=postgres-clinica" --format "{{.Names}}"
if ($container -eq "postgres-clinica") {
    Write-Host "   ✅ Contenedor corriendo" -ForegroundColor Green
} else {
    Write-Host "   ❌ Contenedor no está corriendo" -ForegroundColor Red
    Write-Host "   Ejecuta: docker-compose up -d" -ForegroundColor Yellow
    exit
}

Write-Host ""
Write-Host "2. Verificando DATABASE_URL en .env..." -ForegroundColor Cyan
$envContent = Get-Content .env -Raw
if ($envContent -match 'DATABASE_URL="postgresql://postgres:password@localhost:5433/clinica_fisioterapia"') {
    Write-Host "   ✅ DATABASE_URL correcta" -ForegroundColor Green
} else {
    Write-Host "   ❌ DATABASE_URL incorrecta" -ForegroundColor Red
    Write-Host "   Debe ser: postgresql://postgres:password@localhost:5433/clinica_fisioterapia" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "3. Intentando conexión de prueba..." -ForegroundColor Cyan
try {
    $result = docker exec postgres-clinica psql -U postgres -d clinica_fisioterapia -c "SELECT 1;" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Conexión exitosa" -ForegroundColor Green
        Write-Host ""
        Write-Host "Puedes ejecutar las migraciones:" -ForegroundColor Green
        Write-Host "   npm run prisma:migrate" -ForegroundColor Yellow
    } else {
        Write-Host "   ❌ Error de conexión" -ForegroundColor Red
        Write-Host "   $result" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Error: $_" -ForegroundColor Red
}

