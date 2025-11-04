import { databases, DATABASE_ID, CLIENTES_COLLECTION_ID } from '@/lib/appwrite';
import { Cliente, LipooutUserInput, HistorialCita } from '@/types';
import { ID, Query, Models } from 'appwrite';

// --- Funciones de Serialización para historial_citas ---

/**
 * Serializa el array de historial de citas a JSON string para Appwrite
 */
const serializeHistorialCitas = (historial: HistorialCita[] | undefined): string | undefined => {
  if (!historial || historial.length === 0) return undefined;
  return JSON.stringify(historial);
};

/**
 * Deserializa el JSON string de historial de citas de Appwrite a array
 */
const deserializeHistorialCitas = (historialString: string | undefined): HistorialCita[] => {
  if (!historialString || historialString.trim() === '') return [];
  try {
    return JSON.parse(historialString);
  } catch (error) {
    console.error('Error deserializando historial_citas:', error);
    return [];
  }
};

/**
 * Procesa un cliente para deserializar su historial
 */
const processClienteDocument = (doc: any): Cliente & Models.Document => {
  return {
    ...doc,
    historial_citas: deserializeHistorialCitas(doc.historial_citas)
  };
};

// Tipo Input (usado por hooks)
export type CreateClienteInput = LipooutUserInput<Cliente>;
export type UpdateClienteInput = Partial<CreateClienteInput>;

// --- Funciones de Servicio (Usadas por hooks y otros servicios) ---

// OBTENER Clientes (con búsqueda por coincidencias parciales en múltiples campos)
export const getClientesByNombre = async (searchQuery: string = ""): Promise<(Cliente & Models.Document)[]> => {
    // Función de normalización mejorada: quita acentos y caracteres especiales
    const normalizeText = (text: string | number | null | undefined): string => {
        if (text === null || text === undefined) return '';
        
        return String(text)
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
            .replace(/[\-().]/g, ''); // Eliminar guiones, paréntesis y puntos (mantener espacios)
    };

    // Función para verificar si un cliente coincide con la búsqueda
    const clienteMatchesSearch = (cliente: Cliente & Models.Document, searchNormalized: string): boolean => {
        // Buscar en nombre_completo
        if (cliente.nombre_completo) {
            const nombreNormalized = normalizeText(cliente.nombre_completo);
            if (nombreNormalized.includes(searchNormalized)) return true;
        }

        // Buscar en email
        if (cliente.email) {
            const emailNormalized = normalizeText(cliente.email);
            if (emailNormalized.includes(searchNormalized)) return true;
        }

        // Buscar en DNI
        if (cliente.dnicli) {
            const dniNormalized = normalizeText(cliente.dnicli);
            if (dniNormalized.includes(searchNormalized)) return true;
        }

        // Buscar en teléfono 1
        if (cliente.tel1cli) {
            const tel1Normalized = normalizeText(cliente.tel1cli);
            if (tel1Normalized.includes(searchNormalized)) return true;
        }

        // Buscar en teléfono 2
        if (cliente.tel2cli) {
            const tel2Normalized = normalizeText(cliente.tel2cli);
            if (tel2Normalized.includes(searchNormalized)) return true;
        }

        return false;
    };

    // Si no hay búsqueda, devolver los primeros 500
    if (!searchQuery || searchQuery.trim() === "") {
        const response = await databases.listDocuments<Cliente & Models.Document>(
            DATABASE_ID,
            CLIENTES_COLLECTION_ID,
            [Query.limit(500), Query.orderDesc('$createdAt')]
        );
        return response.documents.map(processClienteDocument);
    }

    // Con búsqueda: implementar paginación para buscar en toda la base de datos
    const BATCH_SIZE = 4000; // Tamaño de cada lote (ajustado al límite real de Appwrite)
    const MAX_RESULTS = 500; // Máximo de resultados a devolver
    const searchNormalized = normalizeText(searchQuery);
    
    console.log(`[getClientesByNombre] Iniciando búsqueda: "${searchQuery}" (normalizado: "${searchNormalized}")`);
    
    const results: (Cliente & Models.Document)[] = [];
    let offset = 0;
    let hasMoreData = true;

    // Iterar por lotes hasta encontrar suficientes resultados o llegar al final
    while (hasMoreData && results.length < MAX_RESULTS) {
        const response = await databases.listDocuments<Cliente & Models.Document>(
            DATABASE_ID,
            CLIENTES_COLLECTION_ID,
            [
                Query.limit(BATCH_SIZE),
                Query.offset(offset),
                Query.orderDesc('$createdAt')
            ]
        );

        // Si no hay más documentos, terminar
        if (response.documents.length === 0) {
            console.log(`[getClientesByNombre] No hay más documentos en offset ${offset}`);
            hasMoreData = false;
            break;
        }

        console.log(`[getClientesByNombre] Lote ${Math.floor(offset / BATCH_SIZE) + 1}: ${response.documents.length} documentos obtenidos`);

        // Filtrar el lote actual
        const matchingClientes = response.documents.filter(cliente => 
            clienteMatchesSearch(cliente, searchNormalized)
        );

        console.log(`[getClientesByNombre] Coincidencias en este lote: ${matchingClientes.length}`);

        // Agregar resultados sin exceder el máximo
        const remainingSlots = MAX_RESULTS - results.length;
        results.push(...matchingClientes.slice(0, remainingSlots));

        console.log(`[getClientesByNombre] Total de resultados acumulados: ${results.length}/${MAX_RESULTS}`);

        // Continuar al siguiente lote
        offset += BATCH_SIZE;
        
        // Solo detenerse cuando no hay más documentos
        if (response.documents.length === 0) {
            console.log(`[getClientesByNombre] Fin de datos alcanzado (no hay más documentos)`);
            hasMoreData = false;
        } else if (offset >= 50000) {
            // Límite de seguridad para evitar bucles infinitos (ajustar según necesidad)
            console.log(`[getClientesByNombre] Límite de seguridad alcanzado (offset: ${offset})`);
            hasMoreData = false;
        }
    }

    console.log(`[getClientesByNombre] Búsqueda completada: ${results.length} resultados encontrados`);
    return results.map(processClienteDocument);
};

// CREAR Cliente
export const createCliente = (newCliente: CreateClienteInput) => {
  return databases.createDocument<Cliente & Models.Document>(
    DATABASE_ID,
    CLIENTES_COLLECTION_ID,
    ID.unique(),
    newCliente
  );
};

// ACTUALIZAR Cliente
export const updateCliente = async ({ $id, data }: { $id: string, data: UpdateClienteInput }) => {
  // historial_citas ya viene como string JSON desde el caller, no necesita serialización adicional
  const result = await databases.updateDocument<Cliente & Models.Document>(
    DATABASE_ID,
    CLIENTES_COLLECTION_ID,
    $id,
    data
  );
  
  // No procesamos el documento para mantener historial_citas como string
  return result as Cliente & Models.Document;
};

// ELIMINAR Cliente
export const deleteCliente = (clienteId: string) => {
  return databases.deleteDocument(
    DATABASE_ID,
    CLIENTES_COLLECTION_ID,
    clienteId
  );
};
