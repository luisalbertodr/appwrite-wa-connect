# ==============================================================================
# SCRIPT PARA CREAR LA COLECCIÓN DE LOGS DE MIGRACIÓN
# ==============================================================================

# --- Configuración Global ---
$DATABASE_ID = "68d78cb20028fac621d4"
$COLLECTION_ID = "migration_logs"
$COLLECTION_NAME = "Migration Logs"

# Permisos
$PERMISSIONS_ARGS = @(
    "read(""users"")",
    "create(""users"")",
    "update(""users"")"
)

Write-Host "1. Creando la colección '$COLLECTION_NAME'..." -ForegroundColor Cyan

# --- Crear la colección ---
appwrite databases create-collection `
    --database-id $DATABASE_ID `
    --collection-id $COLLECTION_ID `
    --name $COLLECTION_NAME `
    @PERMISSIONS_ARGS

Write-Host "2. Creando atributos..." -ForegroundColor Cyan

# --- Atributo: migration_type ---
appwrite databases create-string-attribute `
    --database-id $DATABASE_ID `
    --collection-id $COLLECTION_ID `
    --key "migration_type" `
    --size 255 `
    --required true

# --- Atributo: status (enum) ---
appwrite databases create-enum-attribute `
    --database-id $DATABASE_ID `
    --collection-id $COLLECTION_ID `
    --key "status" `
    --elements "running" "completed" "failed" `
    --required true

# --- Atributo: total_records ---
appwrite databases create-integer-attribute `
    --database-id $DATABASE_ID `
    --collection-id $COLLECTION_ID `
    --key "total_records" `
    --required true

# --- Atributo: processed_records ---
appwrite databases create-integer-attribute `
    --database-id $DATABASE_ID `
    --collection-id $COLLECTION_ID `
    --key "processed_records" `
    --required true

# --- Atributo: successful_records ---
appwrite databases create-integer-attribute `
    --database-id $DATABASE_ID `
    --collection-id $COLLECTION_ID `
    --key "successful_records" `
    --required true

# --- Atributo: failed_records ---
appwrite databases create-integer-attribute `
    --database-id $DATABASE_ID `
    --collection-id $COLLECTION_ID `
    --key "failed_records" `
    --required true

# --- Atributo: started_at ---
appwrite databases create-string-attribute `
    --database-id $DATABASE_ID `
    --collection-id $COLLECTION_ID `
    --key "started_at" `
    --size 255 `
    --required true

# --- Atributo: completed_at ---
appwrite databases create-string-attribute `
    --database-id $DATABASE_ID `
    --collection-id $COLLECTION_ID `
    --key "completed_at" `
    --size 255 `
    --required false

# --- Atributo: error_message ---
appwrite databases create-string-attribute `
    --database-id $DATABASE_ID `
    --collection-id $COLLECTION_ID `
    --key "error_message" `
    --size 2000 `
    --required false

Write-Host "✅ Colección '$COLLECTION_NAME' creada correctamente con todos los atributos" -ForegroundColor Green
