import { databases, DATABASE_ID, CLIENTES_COLLECTION_ID } from '@/lib/appwrite';
import { Cliente, LipooutUserInput, HistorialCita } from '@/types';
import { ID, Query, Models } from 'appwrite';

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

// OBTENER Clientes (con búsqueda usando índice fulltext de Appwrite)
export const getClientesByNombre = async (searchQuery: string = ""): Promise<(Cliente & Models.Document)[]> => {
    // Si no hay búsqueda, devolver los primeros 500
    if (!searchQuery || searchQuery.trim() === "") {
        const response = await databases.listDocuments<Cliente & Models.Document>(
            DATABASE_ID,
            CLIENTES_COLLECTION_ID,
            [Query.limit(500), Query.orderDesc('$createdAt')]
        );
        return response.documents.map(processClienteDocument);
    }

    // Con búsqueda: usar Query.search() con el índice fulltext
    console.log(`[getClientesByNombre] Búsqueda con índice fulltext: "${searchQuery}"`);
    
    try {
        const response = await databases.listDocuments<Cliente & Models.Document>(
            DATABASE_ID,
            CLIENTES_COLLECTION_ID,
            [
                Query.search('nombre_completo', searchQuery), // Usar índice fulltext
                Query.limit(500),
                Query.orderDesc('$createdAt')
            ]
        );

        console.log(`[getClientesByNombre] Resultados encontrados: ${response.documents.length}`);
        return response.documents.map(processClienteDocument);
    } catch (error) {
        console.error('[getClientesByNombre] Error en búsqueda fulltext:', error);
        // Fallback: si hay error, devolver array vacío
        return [];
    }
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
