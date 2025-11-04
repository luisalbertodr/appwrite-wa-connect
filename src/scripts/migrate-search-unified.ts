import { databases, DATABASE_ID, CLIENTES_COLLECTION_ID } from '@/lib/appwrite';
import { Cliente } from '@/types';
import { Models, Query } from 'appwrite';
import { generateSearchUnified } from '@/utils/search-helpers';

/**
 * Script para poblar el campo search_unified en todos los clientes existentes
 * 
 * @param onProgress - Callback opcional para reportar el progreso (current, total)
 * @returns Estadísticas de la migración
 */
export const migrateSearchUnified = async (
  onProgress?: (current: number, total: number) => void
) => {
  console.log('🔄 Iniciando migración de search_unified...');
  
  let offset = 0;
  const limit = 100;
  let totalUpdated = 0;
  let totalErrors = 0;
  
  // Obtener el total de clientes primero
  const countResponse = await databases.listDocuments<Cliente & Models.Document>(
    DATABASE_ID,
    CLIENTES_COLLECTION_ID,
    [Query.limit(1)]
  );
  const totalClientes = countResponse.total;
  console.log(`📊 Total de clientes a procesar: ${totalClientes}`);
  
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
          
          // Notificar progreso
          if (onProgress) {
            onProgress(totalUpdated, totalClientes);
          }
          
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
    
    return { totalUpdated, totalErrors };
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    console.log(`ℹ️ Clientes procesados antes del error: ${totalUpdated}`);
    throw error;
  }
};
