import { databases, DATABASE_ID, CITAS_COLLECTION_ID, CLIENTES_COLLECTION_ID } from '@/lib/appwrite';
import { Cita, Cliente } from '@/types';
import { Models, Query } from 'appwrite';

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
 * Script para poblar el campo cliente_nombre en todas las citas existentes
 * Lee el nombre desde la colección de clientes y lo guarda en cada cita
 */
export const migrateCitasClienteNombre = async (
  onProgress?: (current: number, total: number) => void
) => {
  console.log('🔄 Iniciando migración de cliente_nombre en citas...');
  
  let offset = 0;
  const limit = 25; // Reducido para evitar rate limits
  let totalUpdated = 0;
  let totalErrors = 0;
  const delayBetweenUpdates = 100; // 100ms entre cada actualización
  const delayBetweenBatches = 2000; // 2 segundos entre lotes
  
  // 1. Cargar todos los clientes en un Map para búsqueda rápida
  console.log('📦 Cargando clientes...');
  const clientesMap = new Map<string, Cliente & Models.Document>();
  let clientesOffset = 0;
  
  try {
    while (true) {
      const clientesResponse = await databases.listDocuments<Cliente & Models.Document>(
        DATABASE_ID,
        CLIENTES_COLLECTION_ID,
        [Query.limit(100), Query.offset(clientesOffset)]
      );
      
      if (clientesResponse.documents.length === 0) break;
      
      clientesResponse.documents.forEach(cliente => {
        clientesMap.set(cliente.$id, cliente);
      });
      
      clientesOffset += 100;
      
      // Pequeño delay para no saturar
      await sleep(100);
    }
    
    console.log(`✅ Clientes cargados: ${clientesMap.size}`);
  } catch (error) {
    console.error('❌ Error cargando clientes:', error);
    throw error;
  }
  
  // 2. Obtener total de citas
  const countResponse = await databases.listDocuments<Cita & Models.Document>(
    DATABASE_ID,
    CITAS_COLLECTION_ID,
    [Query.limit(1)]
  );
  const totalCitas = countResponse.total;
  console.log(`📊 Total de citas a migrar: ${totalCitas}`);
  
  try {
    while (true) {
      const response = await databases.listDocuments<Cita & Models.Document>(
        DATABASE_ID,
        CITAS_COLLECTION_ID,
        [Query.limit(limit), Query.offset(offset)]
      );
      
      if (response.documents.length === 0) break;
      
      console.log(`📦 Procesando lote: ${offset + 1} a ${offset + response.documents.length} de ${totalCitas}`);
      
      for (const cita of response.documents) {
        try {
          // Obtener el cliente del Map
          const cliente = clientesMap.get(cita.cliente_id);
          
          if (!cliente) {
            console.warn(`⚠️ Cliente no encontrado para cita ${cita.$id}, cliente_id: ${cita.cliente_id}`);
            totalErrors++;
            continue;
          }
          
          // Construir el nombre del cliente
          const cliente_nombre = cliente.nombre_completo || 
                                 `${cliente.nomcli || ''} ${cliente.ape1cli || ''}`.trim() ||
                                 'Sin nombre';
          
          // Actualizar la cita con el nombre del cliente
          await retryWithBackoff(async () => {
            return await databases.updateDocument(
              DATABASE_ID,
              CITAS_COLLECTION_ID,
              cita.$id,
              { cliente_nombre }
            );
          });
          
          totalUpdated++;
          
          if (onProgress) {
            onProgress(totalUpdated, totalCitas);
          }
          
          if (totalUpdated % 25 === 0) {
            console.log(`✅ Actualizadas: ${totalUpdated} de ${totalCitas} citas`);
          }
          
          // Delay entre actualizaciones
          await sleep(delayBetweenUpdates);
          
        } catch (error) {
          console.error(`❌ Error actualizando cita ${cita.$id}:`, error);
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
    console.log(`✅ Total actualizadas: ${totalUpdated} citas`);
    if (totalErrors > 0) {
      console.log(`⚠️ Errores: ${totalErrors}`);
    }
    
    return { totalUpdated, totalErrors };
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    console.log(`ℹ️ Citas procesadas antes del error: ${totalUpdated}`);
    throw error;
  }
};
