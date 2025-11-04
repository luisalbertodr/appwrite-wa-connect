import { databases, DATABASE_ID, CLIENTES_COLLECTION_ID } from '@/lib/appwrite';
import { Cliente, LipooutUserInput, HistorialCita } from '@/types';
import { ID, Query, Models } from 'appwrite';

const serializeHistorialCitas = (historial: HistorialCita[] | undefined): string | undefined => {
  if (!historial || historial.length === 0) return undefined;
  return JSON.stringify(historial);
};

const deserializeHistorialCitas = (historialString: string | undefined): HistorialCita[] => {
  if (!historialString || historialString.trim() === '') return [];
  try {
    return JSON.parse(historialString);
  } catch (error) {
    console.error('Error deserializando historial_citas:', error);
    return [];
  }
};

const processClienteDocument = (doc: any): Cliente & Models.Document => {
  return {
    ...doc,
    historial_citas: deserializeHistorialCitas(doc.historial_citas)
  };
};

export type CreateClienteInput = LipooutUserInput<Cliente>;
export type UpdateClienteInput = Partial<CreateClienteInput>;

export const getClientesByNombre = async (searchQuery: string = ""): Promise<(Cliente & Models.Document)[]> => {
  const queries: string[] = [Query.limit(100)];
  
  if (searchQuery.trim()) {
    queries.push(Query.search('nombre_completo', searchQuery));
  }
  
  const response = await databases.listDocuments<Cliente & Models.Document>(
    DATABASE_ID,
    CLIENTES_COLLECTION_ID,
    queries
  );
  
  return response.documents.map(processClienteDocument);
};

export const createCliente = async (cliente: CreateClienteInput): Promise<Cliente & Models.Document> => {
  const nombre_completo = `${cliente.nomcli || ''} ${cliente.ape1cli || ''}`.trim() || 'Sin nombre';
  
  const clienteData = {
    ...cliente,
    nombre_completo,
    historial_citas: serializeHistorialCitas(cliente.historial_citas)
  };
  
  const response = await databases.createDocument<Cliente & Models.Document>(
    DATABASE_ID,
    CLIENTES_COLLECTION_ID,
    ID.unique(),
    clienteData as any
  );
  
  return processClienteDocument(response);
};

export const updateCliente = async ({ $id, data }: { $id: string; data: UpdateClienteInput }): Promise<Cliente & Models.Document> => {
  const clienteData: any = { ...data };
  
  if (data.nomcli !== undefined || data.ape1cli !== undefined) {
    clienteData.nombre_completo = `${data.nomcli || ''} ${data.ape1cli || ''}`.trim() || 'Sin nombre';
  }
  
  if (data.historial_citas !== undefined) {
    clienteData.historial_citas = serializeHistorialCitas(data.historial_citas);
  }
  
  const response = await databases.updateDocument<Cliente & Models.Document>(
    DATABASE_ID,
    CLIENTES_COLLECTION_ID,
    $id,
    clienteData
  );
  
  return processClienteDocument(response);
};

export const deleteCliente = async (id: string): Promise<void> => {
  await databases.deleteDocument(DATABASE_ID, CLIENTES_COLLECTION_ID, id);
};
