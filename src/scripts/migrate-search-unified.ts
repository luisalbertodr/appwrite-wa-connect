import { databases, DATABASE_ID, CLIENTES_COLLECTION_ID } from '@/lib/appwrite';
import { Cliente } from '@/types';
import { Models, Query } from 'appwrite';
import { generateSearchUnified } from '@/utils/search-helpers';

/**
 * Script para poblar el campo search_unified en todos los clientes existentes
 * 
 * CÓMO USAR:
 * 1. Ejecutar primero el script PowerShell: update_clients_search_unified.ps1
 * 2. Importar y ejecutar esta función desde la consola del navegador o desde un componente temporal
 * 
 * Ejemplo desde consola:
 * import { migrateSearchUnified } from '@/scripts/migrate-search-unified';
 * await migrateSearchUnified();
 */
export const migrateSearchUnified = async () => {
  console.log('🔄 Iniciando migración de search_unified...');
  
  let offset = 0;
  const limit = 100;
  let totalUpdated = 0;
  let totalErrors = 0;
  
  try {
    while (true) {
      // Obtener clientes en lotes
      const response = await databases.listDocuments<Cliente & Models.Document>(
        DATABASE_ID,
        CLIENTES_COLLECTION_ID,
        [Query.limit(limit), Query.offset(offset)]
      );
      
      if (response.documents.length === 0) break;
      
      console.log(`📦 Procesando lote: ${offset + 1} a ${offset + response.documents.length}`);
      
      // Actualizar cada cliente
      for (const cliente of response.documents) {
        try {
          const search_unified = generateSearchUnified(cliente);
          
          await databases.updateDocument(
            DATABASE_ID,
            CLIENTES_COLLECTION_ID,
            cliente.$id,
            { search_unified }
          );
          
          totalUpdated++;
          if (totalUpdated % 50 === 0) {
            console.log(`✅ Actualizados: ${totalUpdated} clientes`);
          }
        } catch (error) {
          console.error(`❌ Error actualizando cliente ${cliente.$id}:`, error);
          totalErrors++;
        }
      }
      
      offset += limit;
    }
    
    console.log(`\n🎉 Migración completada!`);
    console.log(`✅ Total actualizados: ${totalUpdated} clientes`);
    if (totalErrors > 0) {
      console.log(`⚠️ Errores: ${totalErrors}`);
    }
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    console.log(`ℹ️ Clientes procesados antes del error: ${totalUpdated}`);
  }
};
