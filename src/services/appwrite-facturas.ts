import { databases, DATABASE_ID, FACTURAS_COLLECTION_ID } from '@/lib/appwrite';
// Se importa Factura, CreateFacturaInput, UpdateFacturaInput, Cliente 
import { Factura, CreateFacturaInput, UpdateFacturaInput, Cliente } from '@/types'; 
import { ID, Query, Models } from 'appwrite';
import { getClientesByNombre } from '@/services/appwrite-clientes'; // Importar servicio de clientes

// --- Funciones de Servicio ---

// OBTENER facturas (MODIFICADO para aceptar filtros y multiempresa)
export const getFacturas = async (empresaId: string, searchQuery?: string, estado?: string): Promise<(Factura & Models.Document)[]> => {
  const queries = [
      Query.equal('empresa_id', empresaId),
      Query.limit(500),
      Query.orderDesc('fechaEmision'),
      Query.orderDesc('numeroFactura')
    ];

  if (estado) {
     queries.push(Query.equal('estado', estado));
  }

  // MODIFICADO: Manejo de búsqueda
  if (searchQuery) {
      // 1. Buscar clientes que coincidan
      const clientesCoincidentes = await getClientesByNombre(empresaId, searchQuery);
      const clienteIds = clientesCoincidentes.map((c: Cliente & Models.Document) => c.$id);

      // 2. Construir query de búsqueda
      const searchQueries = [
          Query.search('numeroFactura', searchQuery),
      ];
      
      if (clienteIds.length > 0) {
          // If we found clients, add an OR query for those client IDs
          searchQueries.push(Query.equal('cliente_id', clienteIds));
      }

      // If we have multiple search conditions, we should use Query.or.
      if (searchQueries.length > 1) {
          queries.push(Query.or(searchQueries));
      } else if (searchQueries.length === 1 && searchQuery.trim() !== '') {
          // If only one search query (e.g., only by numeroFactura, if no clients found), add it directly.
          queries.push(searchQueries[0]);
      }
  }

  const response = await databases.listDocuments<Factura & Models.Document>(
    DATABASE_ID,
    FACTURAS_COLLECTION_ID,
    queries
  );

  return response.documents;
};

// Crear una nueva factura
export const createFactura = (empresaId: string, facturaInput: CreateFacturaInput) => {
  // Empaquetar los datos para incluir el empresa_id
  const facturaPayload = { ...facturaInput, empresa_id: empresaId };

  return databases.createDocument<Factura & Models.Document>(
    DATABASE_ID,
    FACTURAS_COLLECTION_ID,
    ID.unique(),
    facturaPayload as any
  );
};

// Actualizar una factura existente
export const updateFactura = (empresaId: string, id: string, facturaInput: UpdateFacturaInput) => {
  // Empaquetar los datos para incluir el empresa_id
  const facturaPayload = { ...facturaInput, empresa_id: empresaId };

  return databases.updateDocument<Factura & Models.Document>(
    DATABASE_ID,
    FACTURAS_COLLECTION_ID,
    id,
    facturaPayload as any
  );
};

// Eliminar una factura
export const deleteFactura = (id: string) => {
  return databases.deleteDocument(
    DATABASE_ID,
    FACTURAS_COLLECTION_ID,
    id
  );
};
