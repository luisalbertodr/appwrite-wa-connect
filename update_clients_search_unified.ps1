# ==============================================================================
# SCRIPT PARA AÑADIR CAMPO DE BÚSQUEDA UNIFICADO A LA COLECCIÓN 'clients'
# ==============================================================================

# --- Configuración Global ---
$DATABASE_ID = "68d78cb20028fac621d4"
$COLLECTION_ID = "clients"

Write-Host "1. Añadiendo atributo 'search_unified' para búsqueda multi-campo..."

# --- Atributo concatenado para búsqueda unificada ---
appwrite databases create-string-attribute `
    --database-id $DATABASE_ID `
    --collection-id $COLLECTION_ID `
    --key "search_unified" `
    --size 1024 `
    --required false

Write-Host "2. Creando índice 'fulltext' en 'search_unified'..."

# --- Índice para el nuevo atributo ---
appwrite databases create-index `
    --database-id $DATABASE_ID `
    --collection-id $COLLECTION_ID `
    --key "idx_search_unified" `
    --type "fulltext" `
    --attributes "search_unified"

Write-Host "✅ Campo unificado de búsqueda creado correctamente."
