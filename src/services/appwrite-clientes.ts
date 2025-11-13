import { databases, DATABASE_ID, CLIENTES_COLLECTION_ID } from '@/lib/appwrite';
import { Cliente, LipooutUserInput, HistorialCita } from '@/types';
import { ID, Query, Models } from 'appwrite';
import { generateSearchUnified, filterByAllWords } from '@/utils/search-helpers';

// IMPORTANTE: Asumimos que se inyecta la empresa actual.
const getEmpresaActualId = () => "ID_EMPRESA_ACTUAL_PLACEHOLDER"; 

// --- Funciones de Serialización para historial_citas ---

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

// OBTENER Clientes (con búsqueda usando índice fulltext en campo unificado)
export const getClientesByNombre = async (searchQuery: string = ""): Promise<(Cliente & Models.Document)[]> => {
    const empresaId = getEmpresaActualId(); // <--- OBTENER EMPRESA ID

    // Si no hay búsqueda, devolver los primeros 500
    if (!searchQuery || searchQuery.trim() === "") {
        const response = await databases.listDocuments<Cliente & Models.Document>(
            DATABASE_ID,
            CLIENTES_COLLECTION_ID,
            [Query.equal('empresa_id', empresaId), Query.limit(500), Query.orderDesc('$createdAt')] // <--- FILTRO
        );
        return response.documents.map(processClienteDocument);
    }

    console.log(`[getClientesByNombre] Búsqueda unificada multi-campo: "${searchQuery}"`);
    
    try {
        // Buscar en campo unificado usando índice fulltext
        const response = await databases.listDocuments<Cliente & Models.Document>(
            DATABASE_ID,
            CLIENTES_COLLECTION_ID,
            [
                Query.equal('empresa_id', empresaId), // <--- FILTRO
                Query.search('search_unified', searchQuery),
                Query.limit(500),
                Query.orderDesc('$createdAt')
            ]
        );

        const processedDocs = response.documents.map(processClienteDocument);
        
        // Filtrar para que contenga TODAS las palabras (AND)
        const filteredResults = filterByAllWords(processedDocs, searchQuery);
        
        console.log(`[getClientesByNombre] Resultados: ${response.documents.length} → filtrados AND: ${filteredResults.length}`);
        return filteredResults;
    } catch (error) {
        console.error('[getClientesByNombre] Error en búsqueda unificada:', error);
        return [];
    }
};

// CREAR Cliente
export const createCliente = (newCliente: CreateClienteInput) => {
  const empresaId = getEmpresaActualId(); // <--- OBTENER EMPRESA ID
  
  const clienteWithSearch = {
    ...newCliente,
    empresa_id: empresaId, // <--- INYECTAR EMPRESA ID
    search_unified: generateSearchUnified(newCliente)
  };
  
  return databases.createDocument<Cliente & Models.Document>(
    DATABASE_ID,
    CLIENTES_COLLECTION_ID,
    ID.unique(),
    clienteWithSearch
  );
};

// ACTUALIZAR Cliente
export const updateCliente = async ({ $id, data }: { $id: string, data: UpdateClienteInput }) => {
  const empresaId = getEmpresaActualId(); // <--- OBTENER EMPRESA ID

  // Regenerar search_unified y asegurar empresa_id en los datos (Appwrite lo ignora en update si no se cambia, pero es buena práctica)
  const dataWithSearch = {
    ...data,
    empresa_id: empresaId, // <--- INYECTAR EMPRESA ID
    search_unified: generateSearchUnified(data)
  };
  
  const result = await databases.updateDocument<Cliente & Models.Document>(
    DATABASE_ID,
    CLIENTES_COLLECTION_ID,
    $id,
    dataWithSearch
  );
  
  return result as Cliente & Models.Document;
};

// ELIMINAR Cliente
export const deleteCliente = (clienteId: string) => {
  // NOTA: Se debe confiar en las reglas de Appwrite para la eliminación, 
  // pero la lógica de la aplicación debe asegurar que el usuario tenga permisos
  // para la empresa de este cliente.
  return databases.deleteDocument(
    DATABASE_ID,
    CLIENTES_COLLECTION_ID,
    clienteId
  );
};