# Script para agregar el atributo 'horarios' a la colección 'configuracion'
# Este atributo almacenará los horarios de apertura de la clínica

# Configuración Global
$DATABASE_ID = "68b1d7530028045d94d3"
$COLLECTION_ID = "configuracion"

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "ACTUALIZANDO COLECCION 'configuracion' - Agregando atributo 'horarios'" -ForegroundColor Yellow
Write-Host "Base de Datos: Lipoout ($DATABASE_ID)" -ForegroundColor White
Write-Host "Coleccion: $COLLECTION_ID" -ForegroundColor White
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Agregando atributo 'horarios' (JSON)..." -ForegroundColor Green
Write-Host "  - Tipo: String (JSON)"
Write-Host "  - Size: 5000 caracteres"
Write-Host "  - Required: No (opcional)"
Write-Host ""

appwrite databases create-string-attribute `
    --database-id $DATABASE_ID `
    --collection-id $COLLECTION_ID `
    --key "horarios" `
    --size 5000 `
    --required false

Write-Host ""
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "Atributo 'horarios' agregado exitosamente" -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "El atributo 'horarios' ahora esta disponible en la coleccion 'configuracion'."
Write-Host ""
Write-Host "Estructura esperada del JSON:"
Write-Host "[{ dia: 'lunes', abierto: true, horaInicio: '08:00', horaFin: '21:00' }, ...]"
Write-Host ""
Write-Host "Dias validos: lunes, martes, miercoles, jueves, viernes, sabado, domingo"
Write-Host ""
Write-Host "NOTA IMPORTANTE:" -ForegroundColor Yellow
Write-Host "Appwrite puede necesitar unos segundos para indexar el nuevo atributo."
Write-Host "Si obtienes errores al guardar, espera un momento y vuelve a intentar."
Write-Host "======================================================================" -ForegroundColor Cyan
