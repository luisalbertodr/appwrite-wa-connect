import { databases, DATABASE_ID, CLIENTES_COLLECTION_ID } from '@/lib/appwrite';
import { Cliente } from '@/types';
import { Models, Query } from 'appwrite';
import { generateSearchUnified } from '@/utils/search-helpers';

// Función helper para esperar un tiempo determinado
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Función para reintentar con backoff exponencial
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      const isRateLimit = error?.code === 429 || error?.message?.includes('Rate limit');
      
      if (!isRateLimit || i === maxRetries - 1) {
        throw error;
      }
      
      // Backoff exponencial: 1s, 2s, 4s
      const delay = initialDelay * Math.pow(2, i);
      console.log(`⏳ Rate limit alcanzado, esperando ${delay}ms antes de reintentar...`);
      await sleep(delay);
    }
  }
  throw new Error('Max retries reached');
};

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
  const limit = 25; // Reducido de 100 a 25 para evitar rate limits
  let totalUpdated = 0;
  let totalErrors = 0;
  const delayBetweenUpdates = 100; // 100ms entre cada actualización
  const delayBetweenBatches = 2000; // 2 segundos entre lotes
  
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
          
          // Usar retry con backoff para manejar rate limits
          await retryWithBackoff(async () => {
            return await databases.updateDocument(
              DATABASE_ID,
              CLIENTES_COLLECTION_ID,
              cliente.$id,
              { search_unified }
            );
          });
          
          totalUpdated++;
          
          // Notificar progreso
          if (onProgress) {
            onProgress(totalUpdated, totalClientes);
          }
          
          if (totalUpdated % 25 === 0) {
            console.log(`✅ Actualizados: ${totalUpdated} de ${totalClientes} clientes`);
          }
          
          // Pequeño delay entre cada actualización para evitar rate limits
          await sleep(delayBetweenUpdates);
          
        } catch (error) {
          console.error(`❌ Error actualizando cliente ${cliente.$id}:`, error);
          totalErrors++;
        }
      }
      
      // Delay más largo entre lotes
      if (response.documents.length > 0) {
        console.log(`⏸️ Pausa de ${delayBetweenBatches}ms entre lotes...`);
        await sleep(delayBetweenBatches);
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
