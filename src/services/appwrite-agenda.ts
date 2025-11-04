import { databases, DATABASE_ID, CITAS_COLLECTION_ID } from '@/lib/appwrite';
import { Cita, CitaInput } from '@/types';
import { ID, Query, Models } from 'appwrite';
import { startOfDay, endOfDay, formatISO, addDays, startOfWeek, endOfWeek } from 'date-fns';

export type CreateCitaInput = CitaInput;
export type UpdateCitaInput = Partial<CitaInput>;

export const getCitasPorDia = async (fecha: Date): Promise<(Cita & Models.Document)[]> => {
  const inicio = startOfDay(fecha);
  const fin = endOfDay(fecha);
  
  const response = await databases.listDocuments<Cita & Models.Document>(
    DATABASE_ID,
    CITAS_COLLECTION_ID,
    [
      Query.greaterThanEqual('fecha_hora', formatISO(inicio)),
      Query.lessThanEqual('fecha_hora', formatISO(fin)),
      Query.limit(100)
    ]
  );
  return response.documents;
};

export const getCitasPorSemana = async (fecha: Date): Promise<(Cita & Models.Document)[]> => {
  const inicio = startOfWeek(fecha, { weekStartsOn: 1 });
  const fin = addDays(inicio, 6);
  
  const response = await databases.listDocuments<Cita & Models.Document>(
    DATABASE_ID,
    CITAS_COLLECTION_ID,
    [
      Query.greaterThanEqual('fecha_hora', formatISO(startOfDay(inicio))),
      Query.lessThanEqual('fecha_hora', formatISO(endOfDay(fin))),
      Query.limit(500)
    ]
  );
  return response.documents;
};

export const createCita = async (cita: CreateCitaInput): Promise<Cita & Models.Document> => {
  return await databases.createDocument<Cita & Models.Document>(
    DATABASE_ID,
    CITAS_COLLECTION_ID,
    ID.unique(),
    cita
  );
};

export const updateCita = async (id: string, cita: UpdateCitaInput): Promise<Cita & Models.Document> => {
  return await databases.updateDocument<Cita & Models.Document>(
    DATABASE_ID,
    CITAS_COLLECTION_ID,
    id,
    cita
  );
};

export const deleteCita = async (id: string): Promise<void> => {
  await databases.deleteDocument(DATABASE_ID, CITAS_COLLECTION_ID, id);
};
