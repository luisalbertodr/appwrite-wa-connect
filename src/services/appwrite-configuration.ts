import { databases, DATABASE_ID, CONFIGURATION_COLLECTION_ID } from '@/lib/appwrite';
import { Configuracion, HorarioApertura } from '@/types';
import { Query, Models } from 'appwrite';

// Definimos el tipo de Input (basado en el setup)
export type UpdateConfigurationInput = Partial<{
  nombreClinica: string;
  direccion: string;
  cif: string;
  emailContacto: string;
  telefonoContacto: string;
  serieFactura: string;
  seriePresupuesto: string;
  ultimoNumeroFactura: number;
  ultimoNumeroPresupuesto: number;
  tipoIvaPredeterminado: number;
  horarios: HorarioApertura[];
}>;

// Asumimos que SOLO hay UN documento de configuración
const CONFIGURATION_DOC_ID = 'singleton'; // O el $id real si ya existe

// Obtener la configuración (asumiendo un único documento)
export const getConfiguration = async (): Promise<Configuracion & Models.Document> => {
  try {
    // Intentamos obtener por ID conocido
    const doc = await databases.getDocument<Configuracion & Models.Document>(
        DATABASE_ID,
        CONFIGURATION_COLLECTION_ID,
        CONFIGURATION_DOC_ID
    );
    // Deserializar horarios si existe como string
    if (doc.horarios && typeof doc.horarios === 'string') {
      doc.horarios = JSON.parse(doc.horarios as any) as HorarioApertura[];
    }
    return doc;
  } catch (error) {
     // Si falla (ej. no existe), intentamos listarlo
     console.warn(`No se encontró config con ID '${CONFIGURATION_DOC_ID}', listando...`);
     const response = await databases.listDocuments<Configuracion & Models.Document>(
        DATABASE_ID,
        CONFIGURATION_COLLECTION_ID,
        [Query.limit(1)]
     );
     if (response.documents.length > 0) {
        const doc = response.documents[0];
        // Deserializar horarios si existe como string
        if (doc.horarios && typeof doc.horarios === 'string') {
          doc.horarios = JSON.parse(doc.horarios as any) as HorarioApertura[];
        }
        return doc;
     }
     throw new Error("No se encontró ningún documento de configuración en la base de datos.");
  }
};

// Actualizar la configuración
export const updateConfiguration = (id: string, data: UpdateConfigurationInput) => {
  // Serializar horarios a JSON string si existe
  const dataToSend = { ...data };
  if (dataToSend.horarios) {
    (dataToSend as any).horarios = JSON.stringify(dataToSend.horarios);
  }
  
  return databases.updateDocument<Configuracion & Models.Document>(
    DATABASE_ID,
    CONFIGURATION_COLLECTION_ID,
    id,
    dataToSend
  );
};
