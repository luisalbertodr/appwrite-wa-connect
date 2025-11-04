import { databases, DATABASE_ID, ARTICULOS_COLLECTION_ID, FAMILIAS_COLLECTION_ID } from '@/lib/appwrite';
import { Articulo, ArticuloInput } from '@/types';
import { ID, Query, Models } from 'appwrite';

export type CreateArticuloInput = ArticuloInput;
export type UpdateArticuloInput = Partial<ArticuloInput>;

export const getArticulos = async (soloActivos: boolean = true): Promise<(Articulo & Models.Document)[]> => {
  const queries = [Query.limit(100), Query.orderAsc('nombre')];
  if (soloActivos) {
    queries.push(Query.equal('activo', true));
  }
  
  const response = await databases.listDocuments<Articulo & Models.Document>(
    DATABASE_ID,
    ARTICULOS_COLLECTION_ID,
    queries
  );
  
  // Poblar familia manualmente para cada artículo
  const articulosConFamilias = await Promise.all(
    response.documents.map(async (articulo) => {
      if (articulo.familia_id) {
        try {
          const familia = await databases.getDocument(
            DATABASE_ID,
            FAMILIAS_COLLECTION_ID,
            articulo.familia_id
          );
          return { ...articulo, familia };
        } catch (error) {
          console.warn(`No se pudo cargar familia ${articulo.familia_id}`, error);
          return articulo;
        }
      }
      return articulo;
    })
  );
  
  return articulosConFamilias;
};

export const getArticulosByTipo = async (tipo: string): Promise<(Articulo & Models.Document)[]> => {
  const response = await databases.listDocuments<Articulo & Models.Document>(
    DATABASE_ID,
    ARTICULOS_COLLECTION_ID,
    [
      Query.equal('tipo', tipo),
      Query.equal('activo', true),
      Query.limit(100),
      Query.orderAsc('nombre')
    ]
  );
  return response.documents;
};

export const createArticulo = async (articulo: CreateArticuloInput): Promise<Articulo & Models.Document> => {
  return await databases.createDocument<Articulo & Models.Document>(
    DATABASE_ID,
    ARTICULOS_COLLECTION_ID,
    ID.unique(),
    articulo as any
  );
};

export const updateArticulo = async (id: string, articulo: UpdateArticuloInput): Promise<Articulo & Models.Document> => {
  return await databases.updateDocument<Articulo & Models.Document>(
    DATABASE_ID,
    ARTICULOS_COLLECTION_ID,
    id,
    articulo as any
  );
};

export const deleteArticulo = async (id: string): Promise<void> => {
  await databases.deleteDocument(DATABASE_ID, ARTICULOS_COLLECTION_ID, id);
};
