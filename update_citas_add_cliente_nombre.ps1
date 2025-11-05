# Script para agregar el campo cliente_nombre a la colección de citas en Appwrite
# Este campo contendrá el nombre del cliente desnormalizado para mejorar el rendimiento

Write-Host "🔄 Agregando campo cliente_nombre a la colección de citas..." -ForegroundColor Cyan

appwrite databases createStringAttribute `
  --databaseId "68b1d7530028045d94d3" `
  --collectionId "citas" `
  --key "cliente_nombre" `
  --size 255 `
  --required false

Write-Host "✅ Campo cliente_nombre agregado exitosamente a la colección citas" -ForegroundColor Green
Write-Host "" -ForegroundColor White
Write-Host "⚠️  IMPORTANTE: Ahora debes ejecutar la migración de datos desde la UI" -ForegroundColor Yellow
Write-Host "   (Configuración > Import > Migración de Cliente Nombre en Citas)" -ForegroundColor Yellow
