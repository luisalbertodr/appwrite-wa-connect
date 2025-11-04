# ==============================================================================
# SCRIPT PARA AÑADIR CAMPO 'historial_citas' A LA COLECCIÓN 'clientes'
# ==============================================================================
# Este script añade un campo tipo string para almacenar el historial de citas
# en formato JSON serializado
# ==============================================================================

# --- Configuración Global ---
$DATABASE_ID = "68b1d7530028045d94d3"
$COLLECTION_ID = "clientes"

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Actualizando esquema de la colección 'clientes'" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Añadiendo atributo 'historial_citas' a la colección '$COLLECTION_ID'..." -ForegroundColor Yellow

# --- Atributo para el historial de citas (JSON serializado) ---
appwrite databases create-string-attribute `
    --database-id $DATABASE_ID `
    --collection-id $COLLECTION_ID `
    --key "historial_citas" `
    --size 65535 `
    --required false

Write-Host ""
Write-Host "✅ Esquema de la colección 'clientes' actualizado correctamente." -ForegroundColor Green
Write-Host ""
Write-Host "NOTA: El campo 'historial_citas' almacenará un JSON serializado" -ForegroundColor Cyan
Write-Host "con el array de objetos HistorialCita." -ForegroundColor Cyan
Write-Host ""
Write-Host "Espera unos segundos para que Appwrite procese el cambio antes de usar la aplicación." -ForegroundColor Yellow
