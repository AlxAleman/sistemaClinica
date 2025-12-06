# Script para actualizar DATABASE_URL en .env

$envFile = ".env"
$newDatabaseUrl = 'DATABASE_URL="postgresql://postgres:password@localhost:5433/clinica_fisioterapia"'

# Leer el archivo .env
$content = Get-Content $envFile -Raw

# Reemplazar la línea DATABASE_URL
if ($content -match 'DATABASE_URL="[^"]*"') {
    $content = $content -replace 'DATABASE_URL="[^"]*"', $newDatabaseUrl
    Write-Host "✅ DATABASE_URL actualizado"
} else {
    # Si no existe, agregarlo al final
    $content += "`n$newDatabaseUrl"
    Write-Host "✅ DATABASE_URL agregado"
}

# Guardar el archivo
$content | Set-Content $envFile -NoNewline
Write-Host "✅ Archivo .env actualizado correctamente"
Write-Host ""
Write-Host "Nueva DATABASE_URL: $newDatabaseUrl"

