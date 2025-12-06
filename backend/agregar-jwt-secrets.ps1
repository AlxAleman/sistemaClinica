# Script para agregar JWT_SECRET y JWT_REFRESH_SECRET al .env

$envFile = ".env"

# Verificar si ya existen
$content = Get-Content $envFile -Raw

if ($content -notmatch 'JWT_SECRET=') {
    $jwtSecrets = @"
JWT_SECRET="tu-secret-key-muy-seguro-cambiar-en-produccion"
JWT_REFRESH_SECRET="tu-refresh-secret-key-muy-seguro-cambiar-en-produccion"
"@
    $content += "`n$jwtSecrets"
    Write-Host "✅ JWT_SECRET y JWT_REFRESH_SECRET agregados al .env" -ForegroundColor Green
} else {
    Write-Host "⚠️  JWT_SECRET ya existe en .env" -ForegroundColor Yellow
}

$content | Set-Content $envFile -NoNewline
Write-Host ""
Write-Host "Archivo .env actualizado. Puedes ejecutar 'npm run dev' ahora." -ForegroundColor Green

