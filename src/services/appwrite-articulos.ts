import { databases, DATABASE_ID, ARTICULOS_COLLECTION_ID, FAMILIAS_COLLECTION_ID } from '@/lib/appwrite';
import { Articulo, ArticuloInput, Familia, LipooutUserInput } from '@/types'; // Import LipooutUserInput
import { ID, Query, Models } from 'appwrite';

// --- API de Familias ---

// Tipo Input para formularios (sin empresa_id, se inyecta en el servicio)
export type FamiliaInput = Omit<LipooutUserInput<Familia>, 'empresa_id'>;
// Define el tipo de objeto que se enviará a Appwrite (Input + empresa_id)
type FamiliaPayload = FamiliaInput & { empresa_id: string };


export const getFamilias = async (empresaId: string): Promise<(Familia & Models.Document)[]> => {
  const response = await databases.listDocuments<Familia & Models.Document>(
    DATABASE_ID,
    FAMILIAS_COLLECTION_ID,
    [Query.equal('empresa_id', empresaId), Query.limit(100)]
  );
  return response.documents;
};

// (NUEVO)
export const createFamilia = (empresaId: string, familiaInput: FamiliaInput) => {
    // El payload incluye la empresa_id
    const familiaPayload: FamiliaPayload = {
        ...familiaInput,
        empresa_id: empresaId 
    };
    
    return databases.createDocument<Familia & Models.Document>(
        DATABASE_ID,
        FAMILIAS_COLLECTION_ID,
        ID.unique(),
        familiaPayload 
    );
};

// (NUEVO)
export const updateFamilia = (empresaId: string, id: string, familiaInput: Partial<FamiliaInput>) => {
    // El payload incluye la empresa_id
    const familiaPayload: Partial<FamiliaPayload> = {
        ...familiaInput,
        empresa_id: empresaId 
    };
    
    return databases.updateDocument<Familia & Models.Document>(
        DATABASE_ID,
        FAMILIAS_COLLECTION_ID,
        id,
        familiaPayload 
    );
};

// (NUEVO)
export const deleteFamilia = (id: string) => {
    return databases.deleteDocument(
        DATABASE_ID,
        FAMILIAS_COLLECTION_ID,
        id
    );
};


// --- API de Artículos ---

// Usamos el tipo ArticuloInput directamente
export type CreateArticuloInput = ArticuloInput;
// Update es Partial del Create type
export type UpdateArticuloInput = Partial<CreateArticuloInput>;
// Define el tipo de objeto que se enviará a Appwrite (Input + empresa_id)
type ArticuloPayload = CreateArticuloInput & { empresa_id: string };


export const getArticulos = async (empresaId: string, familiaId?: string): Promise<(Articulo & Models.Document)[]> => {
  const queries = [Query.equal('empresa_id', empresaId), Query.limit(100)];
  if (familiaId) {
    queries.push(Query.equal('familia_id', familiaId));
  }
  
  const response = await databases.listDocuments<Articulo & Models.Document>(
    DATABASE_ID,
    ARTICULOS_COLLECTION_ID,
    queries
  );

  // --- Workaround para "poblar" la familia ---
  const familias = await getFamilias(empresaId);
  const familiaMap = new Map(familias.map(f => [f.$id, f]));

  return response.documents.map(articulo => ({
      ...articulo,
      familia: familiaMap.get(articulo.familia_id) // "Poblamos" la familia usando familia_id
  }));
};

export const createArticulo = (empresaId: string, articuloInput: CreateArticuloInput) => {
   // Esto ahora es correcto porque Articulo ya no requiere 'familia'
   const articuloPayload: ArticuloPayload = {
     ...articuloInput,
     empresa_id: empresaId,
   };

   // Limpiar campos undefined antes de enviar
   Object.keys(articuloPayload).forEach(key => {
     if (articuloPayload[key as keyof ArticuloPayload] === undefined) {
       delete articuloPayload[key as keyof ArticuloPayload];
     }
   });

  return databases.createDocument(
    DATABASE_ID,
    ARTICULOS_COLLECTION_ID,
    ID.unique(),
    articuloPayload 
  ) as Promise<Articulo & Models.Document>;
};

export const updateArticulo = (empresaId: string, id: string, articuloInput: UpdateArticuloInput) => {
   // El payload incluye la empresa_id
   const articuloPayload: Partial<ArticuloPayload> = {
        ...articuloInput,
        empresa_id: empresaId
    };

   // Limpiar campos undefined para evitar errores en Appwrite
   Object.keys(articuloPayload).forEach(key => {
     if (articuloPayload[key as keyof ArticuloPayload] === undefined) {
       delete articuloPayload[key as keyof ArticuloPayload];
     }
   });
   
  return databases.updateDocument(
    DATABASE_ID,
    ARTICULOS_COLLECTION_ID,
    id,
    articuloPayload 
  ) as Promise<Articulo & Models.Document>;
};

export const deleteArticulo = (id: string) => {
  return databases.deleteDocument(
    DATABASE_ID,
    ARTICULOS_COLLECTION_ID,
    id
  );
};
