import { databases, DATABASE_ID, ARTICULOS_COLLECTION_ID, FAMILIAS_COLLECTION_ID } from '@/lib/appwrite';
import { Articulo, ArticuloInput, Familia, LipooutUserInput } from '@/types'; // Import LipooutUserInput
import { ID, Query, Models } from 'appwrite';

// =========================================================================
// CAMBIO MULTIEMPRESA: OBTENER CONTEXTO DE EMPRESA (Placeholder)
// =========================================================================
// NOTA: Reemplazar por la obtención real del ID de la empresa de la sesión.
const getEmpresaActualId = () => "ID_EMPRESA_ACTUAL_PLACEHOLDER"; 

// --- API de Familias ---

// (NUEVO) Tipo Input para Familia
export type FamiliaInput = LipooutUserInput<Familia>; 
// Define el tipo de objeto que se enviará a Appwrite (Input + empresa_id)
type FamiliaPayload = FamiliaInput & { empresa_id: string };


export const getFamilias = async (): Promise<(Familia & Models.Document)[]> => {
  const empresaId = getEmpresaActualId(); // OBTENER EMPRESA ID
    
  const response = await databases.listDocuments<Familia & Models.Document>(
    DATABASE_ID,
    FAMILIAS_COLLECTION_ID,
    [Query.equal('empresa_id', empresaId), Query.limit(100)] // FILTRO MULTIEMPRESA
  );
  return response.documents;
};

// (NUEVO)
export const createFamilia = (familiaInput: FamiliaInput) => {
    const empresaId = getEmpresaActualId(); // OBTENER EMPRESA ID
    
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
export const updateFamilia = (id: string, familiaInput: Partial<FamiliaInput>) => {
    const empresaId = getEmpresaActualId(); // OBTENER EMPRESA ID
    
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


export const getArticulos = async (familiaId?: string): Promise<(Articulo & Models.Document)[]> => {
  const empresaId = getEmpresaActualId(); // OBTENER EMPRESA ID

  const queries = [Query.equal('empresa_id', empresaId), Query.limit(100)]; // FILTRO MULTIEMPRESA
  if (familiaId) {
    queries.push(Query.equal('familia_id', familiaId));
  }
  
  const response = await databases.listDocuments<Articulo & Models.Document>(
    DATABASE_ID,
    ARTICULOS_COLLECTION_ID,
    queries
  );

  // --- Workaround para "poblar" la familia ---
  const familias = await getFamilias();
  const familiaMap = new Map(familias.map(f => [f.$id, f]));

  return response.documents.map(articulo => ({
      ...articulo,
      familia: familiaMap.get(articulo.familia_id) // "Poblamos" la familia usando familia_id
  }));
};

export const createArticulo = (articuloInput: CreateArticuloInput) => {
   const empresaId = getEmpresaActualId(); // OBTENER EMPRESA ID
   
   // Esto ahora es correcto porque Articulo ya no requiere 'familia'
   const articuloPayload: ArticuloPayload = {
     ...articuloInput,
     empresa_id: empresaId, // INYECTAR EMPRESA ID
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

export const updateArticulo = (id: string, articuloInput: UpdateArticuloInput) => {
   const empresaId = getEmpresaActualId(); // OBTENER EMPRESA ID

   // El payload incluye la empresa_id
   const articuloPayload: Partial<ArticuloPayload> = {
        ...articuloInput,
        empresa_id: empresaId // INYECTAR EMPRESA ID
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