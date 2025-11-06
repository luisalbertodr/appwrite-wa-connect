const { Client, Databases, ID, Query } = require('node-appwrite');

// ============= UTILIDADES COMPARTIDAS =============

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const retryWithBackoff = async (fn, maxRetries = 3, initialDelay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      const isRateLimit = error?.code === 429 || error?.message?.includes('Rate limit');
      
      if (!isRateLimit || i === maxRetries - 1) {
        throw error;
      }
      
      const delay = initialDelay * Math.pow(2, i);
      console.log(`⏳ Rate limit, esperando ${delay}ms...`);
      await sleep(delay);
    }
  }
  throw new Error('Max retries reached');
};

/**
 * Genera el campo search_unified a partir de los datos del cliente
 */
const generateSearchUnified = (cliente) => {
  const parts = [
    cliente.nombre_completo,
    cliente.nomcli,
    cliente.ape1cli,
    cliente.tel1cli,
    cliente.tel2cli,
    cliente.email,
    cliente.dnicli,
    cliente.codcli
  ].filter(Boolean);
  
  return parts.join(' ').toLowerCase().trim();
};

// ============= MIGRACIONES ESPECÍFICAS =============

/**
 * Migración 1: search_unified en clientes
 */
const migrateSearchUnified = async (databases, config, log) => {
  log('🔄 [search_unified] Iniciando migración...');
  
  const { DATABASE_ID, CLIENTS_COLLECTION_ID } = config;
  
  let offset = 0;
  const limit = 25;
  let totalUpdated = 0;
  let totalErrors = 0;
  
  // Obtener total
  const countResponse = await databases.listDocuments(
    DATABASE_ID,
    CLIENTS_COLLECTION_ID,
    [Query.limit(1)]
  );
  const total = countResponse.total;
  log(`📊 [search_unified] Total a procesar: ${total} clientes`);
  
  while (true) {
    const response = await databases.listDocuments(
      DATABASE_ID,
      CLIENTS_COLLECTION_ID,
      [Query.limit(limit), Query.offset(offset)]
    );
    
    if (response.documents.length === 0) break;
    
    for (const cliente of response.documents) {
      try {
        const search_unified = generateSearchUnified(cliente);
        
        await retryWithBackoff(async () => {
          return await databases.updateDocument(
            DATABASE_ID,
            CLIENTS_COLLECTION_ID,
            cliente.$id,
            { search_unified }
          );
        });
        
        totalUpdated++;
        
        if (totalUpdated % 25 === 0) {
          log(`✅ [search_unified] Actualizados: ${totalUpdated}/${total}`);
        }
        
        await sleep(100);
      } catch (error) {
        log(`❌ [search_unified] Error en cliente ${cliente.$id}: ${error.message}`);
        totalErrors++;
      }
    }
    
    await sleep(2000);
    offset += limit;
  }
  
  log(`🎉 [search_unified] Completado! Actualizados: ${totalUpdated}, Errores: ${totalErrors}`);
  return { totalUpdated, totalErrors, total };
};

/**
 * Migración 2: cliente_nombre en citas
 */
const migrateClienteNombre = async (databases, config, log) => {
  log('🔄 [cliente_nombre] Iniciando migración...');
  
  const { DATABASE_ID, CLIENTS_COLLECTION_ID, CITAS_COLLECTION_ID } = config;
  
  // 1. Cargar clientes en Map
  log('📦 [cliente_nombre] Cargando clientes...');
  const clientesMap = new Map();
  let clientesOffset = 0;
  
  while (true) {
    const clientesResponse = await databases.listDocuments(
      DATABASE_ID,
      CLIENTS_COLLECTION_ID,
      [Query.limit(100), Query.offset(clientesOffset)]
    );
    
    if (clientesResponse.documents.length === 0) break;
    
    clientesResponse.documents.forEach(cliente => {
      clientesMap.set(cliente.$id, cliente);
    });
    
    clientesOffset += 100;
    await sleep(100);
  }
  
  log(`✅ [cliente_nombre] Clientes cargados: ${clientesMap.size}`);
  
  // 2. Migrar citas
  let offset = 0;
  const limit = 25;
  let totalUpdated = 0;
  let totalErrors = 0;
  
  const countResponse = await databases.listDocuments(
    DATABASE_ID,
    CITAS_COLLECTION_ID,
    [Query.limit(1)]
  );
  const total = countResponse.total;
  log(`📊 [cliente_nombre] Total a procesar: ${total} citas`);
  
  while (true) {
    const response = await databases.listDocuments(
      DATABASE_ID,
      CITAS_COLLECTION_ID,
      [Query.limit(limit), Query.offset(offset)]
    );
    
    if (response.documents.length === 0) break;
    
    for (const cita of response.documents) {
      try {
        const cliente = clientesMap.get(cita.cliente_id);
        
        if (!cliente) {
          log(`⚠️ [cliente_nombre] Cliente no encontrado: ${cita.cliente_id}`);
          totalErrors++;
          continue;
        }
        
        const cliente_nombre = cliente.nombre_completo || 
                               `${cliente.nomcli || ''} ${cliente.ape1cli || ''}`.trim() ||
                               'Sin nombre';
        
        await retryWithBackoff(async () => {
          return await databases.updateDocument(
            DATABASE_ID,
            CITAS_COLLECTION_ID,
            cita.$id,
            { cliente_nombre }
          );
        });
        
        totalUpdated++;
        
        if (totalUpdated % 25 === 0) {
          log(`✅ [cliente_nombre] Actualizadas: ${totalUpdated}/${total}`);
        }
        
        await sleep(100);
      } catch (error) {
        log(`❌ [cliente_nombre] Error en cita ${cita.$id}: ${error.message}`);
        totalErrors++;
      }
    }
    
    await sleep(2000);
    offset += limit;
  }
  
  log(`🎉 [cliente_nombre] Completado! Actualizadas: ${totalUpdated}, Errores: ${totalErrors}`);
  return { totalUpdated, totalErrors, total };
};

// ============= FUNCIÓN PRINCIPAL =============

module.exports = async ({ req, res, log, error }) => {
  log('🚀 Función de migración iniciada');
  
  // Configuración usando variables automáticas de Appwrite
  const endpoint = process.env.APPWRITE_FUNCTION_API_ENDPOINT || process.env.APPWRITE_ENDPOINT || 'https://appwrite.lipoout.com/v1';
  const projectId = process.env.APPWRITE_FUNCTION_PROJECT_ID || process.env.APPWRITE_PROJECT_ID || '68a8bb45000adadfb279';
  const apiKey = process.env.APPWRITE_API_KEY;
  
  log(`📡 Endpoint: ${endpoint}`);
  log(`🔑 Project ID: ${projectId}`);
  log(`🔐 API Key configurada: ${apiKey ? 'Sí' : 'No'}`);
  
  if (!apiKey) {
    error('❌ APPWRITE_API_KEY no está configurada');
    return res.json({
      success: false,
      error: 'APPWRITE_API_KEY no configurada en las variables de entorno de la función'
    }, 500);
  }
  
  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);
  
  const databases = new Databases(client);
  
  const config = {
    DATABASE_ID: process.env.APPWRITE_DATABASE_ID || '68b1d7530028045d94d3',
    CLIENTS_COLLECTION_ID: process.env.APPWRITE_CLIENTS_COLLECTION_ID || 'clientes',
    CITAS_COLLECTION_ID: process.env.APPWRITE_CITAS_COLLECTION_ID || 'citas',
    MIGRATION_LOGS_COLLECTION_ID: 'migration_logs'
  };
  
  log(`📊 Database ID: ${config.DATABASE_ID}`);
  log(`👥 Clients Collection: ${config.CLIENTS_COLLECTION_ID}`);
  log(`📅 Citas Collection: ${config.CITAS_COLLECTION_ID}`);
  
  // Parsear payload
  let payload = {};
  try {
    payload = JSON.parse(req.bodyRaw || '{}');
  } catch (e) {
    log('⚠️ No se pudo parsear payload, usando valores por defecto');
  }
  
  const migrationType = payload.type || 'all';
  log(`📋 Tipo de migración solicitado: ${migrationType}`);
  
  const migrationId = ID.unique();
  const timestamp = new Date().toISOString();
  
  try {
    // Crear log inicial
    await databases.createDocument(
      config.DATABASE_ID,
      config.MIGRATION_LOGS_COLLECTION_ID,
      migrationId,
      {
        migration_type: migrationType,
        status2: 'running',
        total_records: 0,
        processed_records: 0,
        successful_records: 0,
        failed_records: 0,
        started_at: timestamp,
        completed_at: null,
        error_message: null
      }
    );
    
    log('✅ Log de migración creado, iniciando proceso en background...');
    
    // Ejecutar migración en background (no bloqueante)
    (async () => {
      try {
        const results = {};
        
        // Ejecutar migración(es) según el tipo
        if (migrationType === 'search_unified' || migrationType === 'all') {
          results.searchUnified = await migrateSearchUnified(databases, config, log);
        }
        
        if (migrationType === 'cliente_nombre' || migrationType === 'all') {
          results.clienteNombre = await migrateClienteNombre(databases, config, log);
        }
        
        // Validar tipo
        if (!results.searchUnified && !results.clienteNombre) {
          throw new Error(`Tipo de migración no válido: ${migrationType}`);
        }
        
        // Calcular totales
        const totalUpdated = (results.searchUnified?.totalUpdated || 0) + (results.clienteNombre?.totalUpdated || 0);
        const totalErrors = (results.searchUnified?.totalErrors || 0) + (results.clienteNombre?.totalErrors || 0);
        const totalRecords = (results.searchUnified?.total || 0) + (results.clienteNombre?.total || 0);
        
        // Actualizar log final
        await databases.updateDocument(
          config.DATABASE_ID,
          config.MIGRATION_LOGS_COLLECTION_ID,
          migrationId,
          {
            status2: 'completed',
            total_records: totalRecords,
            processed_records: totalUpdated,
            successful_records: totalUpdated - totalErrors,
            failed_records: totalErrors,
            completed_at: new Date().toISOString()
          }
        );
        
        log(`🎉 Migración completada exitosamente!`);
      } catch (err) {
        error(`❌ Error en background: ${err.message}`);
        
        // Actualizar log con error
        try {
          await databases.updateDocument(
            config.DATABASE_ID,
            config.MIGRATION_LOGS_COLLECTION_ID,
            migrationId,
            {
              status2: 'failed',
              error_message: err.message,
              completed_at: new Date().toISOString()
            }
          );
        } catch (logError) {
          error(`❌ No se pudo registrar el fallo: ${logError.message}`);
        }
      }
    })();
    
    // Retornar inmediatamente (202 Accepted) sin esperar el procesamiento
    return res.json({
      ok: true,
      migrationId,
      type: migrationType,
      message: 'Migración iniciada. Consulta migration_logs para ver el progreso.',
      status: 'running'
    }, 202);
    
  } catch (err) {
    error(`❌ Error crítico: ${err.message}`);
    
    // Actualizar log con error
    try {
      await databases.updateDocument(
        config.DATABASE_ID,
        config.MIGRATION_LOGS_COLLECTION_ID,
        migrationId,
        {
          status2: 'failed',
          error_message: err.message,
          completed_at: new Date().toISOString()
        }
      );
    } catch (logError) {
      error(`❌ No se pudo registrar el fallo: ${logError.message}`);
    }
    
    return res.json({
      ok: false,
      error: err.message
    }, 500);
  }
};
