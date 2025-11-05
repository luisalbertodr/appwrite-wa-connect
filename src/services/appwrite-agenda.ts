import { databases, DATABASE_ID, CITAS_COLLECTION_ID, CLIENTES_COLLECTION_ID } from '@/lib/appwrite';
import { Cita, CitaInput, LipooutUserInput, Cliente, HistorialCita } from '@/types';
import { ID, Query, Models } from 'appwrite';
import { startOfDay, formatISO, addDays, startOfWeek } from 'date-fns';
import { updateCliente } from './appwrite-clientes';

// Tipos Create/Update Input (Asegúrate que coincidan con tu definición)
// export type CreateCitaInput = LipooutUserInput<CitaInput>; // Si usas LipooutUserInput
// export type UpdateCitaInput = Partial<CreateCitaInput>; // Si usas LipooutUserInput
// O si no usas LipooutUserInput globalmente:
export type CreateCitaInput = CitaInput;
export type UpdateCitaInput = Partial<CitaInput>;


// Búsqueda de citas por datos del cliente (iterativa acumulativa)
export const buscarCitas = async (searchQuery: string): Promise<(Cita & Models.Document)[]> => {
  if (!searchQuery || searchQuery.trim() === "") {
    // Sin búsqueda, devolver citas recientes
    const response = await databases.listDocuments<Cita & Models.Document>(
      DATABASE_ID,
      CITAS_COLLECTION_ID,
      [Query.limit(100), Query.orderDesc('fecha_hora')]
    );
    return response.documents;
  }

  // Paso 1: Buscar clientes iterativamente en nombre_completo, telefono, dni, email
  const clientesMap = new Map<string, Cliente & Models.Document>();
  const searchFields = ['nombre_completo', 'telefono', 'dni', 'email'];

  for (const field of searchFields) {
    try {
      const response = await databases.listDocuments<Cliente & Models.Document>(
        DATABASE_ID,
        CLIENTES_COLLECTION_ID,
        [Query.search(field, searchQuery), Query.limit(100)]
      );
      
      response.documents.forEach(doc => {
        if (!clientesMap.has(doc.$id)) {
          clientesMap.set(doc.$id, doc);
        }
      });
    } catch (error) {
      console.warn(`No se pudo buscar clientes en campo ${field}:`, error);
    }
  }

  // Si no encontramos clientes, devolver array vacío
  if (clientesMap.size === 0) {
    return [];
  }

  // Paso 2: Obtener citas de todos los clientes encontrados
  const citasMap = new Map<string, Cita & Models.Document>();
  const clienteIds = Array.from(clientesMap.keys());

  // Procesar en lotes de 25 (límite de OR en Appwrite)
  const batchSize = 25;
  for (let i = 0; i < clienteIds.length; i += batchSize) {
    const batch = clienteIds.slice(i, i + batchSize);
    
    try {
      const response = await databases.listDocuments<Cita & Models.Document>(
        DATABASE_ID,
        CITAS_COLLECTION_ID,
        [Query.equal('cliente_id', batch), Query.limit(100), Query.orderDesc('fecha_hora')]
      );
      
      response.documents.forEach(doc => {
        if (!citasMap.has(doc.$id)) {
          citasMap.set(doc.$id, doc);
        }
      });
    } catch (error) {
      console.warn(`Error al buscar citas para batch de clientes:`, error);
    }
  }

  return Array.from(citasMap.values());
};

export const getCitasPorDia = async (fecha: Date): Promise<(Cita & Models.Document)[]> => {
  const startOfDayDate = startOfDay(fecha);
  // CORRECCIÓN: Usar el inicio del DÍA SIGUIENTE en lugar de endOfDay
  // Esto evita problemas con el cambio de hora (DST)
  // const endOfDayDate = endOfDay(fecha); // Antiguo
  const startOfNextDayDate = startOfDay(addDays(fecha, 1)); // Nuevo

  // Convertir a ISO string para Appwrite
  const startOfDayISO = formatISO(startOfDayDate);
  // const endOfDayISO = formatISO(endOfDayDate); // Antiguo
  const startOfNextDayISO = formatISO(startOfNextDayDate); // Nuevo

  // --- LOG 1 (Actualizado) ---
  console.log(`%c[Service: getCitasPorDia] Buscando citas entre ${startOfDayISO} (inclusive) y ${startOfNextDayISO} (exclusive)`, 'color: blue; font-weight: bold;');

  try {
    const response = await databases.listDocuments<Cita & Models.Document>(
      DATABASE_ID,
      CITAS_COLLECTION_ID,
      [
        Query.greaterThanEqual('fecha_hora', startOfDayISO),
        // CORRECCIÓN: Usar 'lessThan' con el inicio del día siguiente
        // Query.lessThan('fecha_hora', endOfDayISO), // Antiguo
        Query.lessThan('fecha_hora', startOfNextDayISO), // Nuevo
        Query.limit(100), // Límite razonable
        Query.orderAsc('fecha_hora') // Ordenar por hora
      ]
    );

    // --- LOG 2 ---
    console.log('[Service: getCitasPorDia] Documentos recibidos de Appwrite:', response.documents);
    // --- LOG 2.1 (Opcional pero útil): Ver total y comparar con documentos ---
    console.log(`[Service: getCitasPorDia] Total reportado por Appwrite: ${response.total}`);
    // --- LOG 2.2 (Opcional): Si no devuelve nada, loguear los parámetros ---
    if (response.documents.length === 0) {
        console.warn(`[Service: getCitasPorDia] Appwrite devolvió 0 documentos. Parámetros de consulta:`, {
            DATABASE_ID,
            CITAS_COLLECTION_ID,
            queries: [
                `greaterThanEqual('fecha_hora', ${startOfDayISO})`,
                // `lessThan('fecha_hora', ${endOfDayISO})`, // Antiguo
                `lessThan('fecha_hora', ${startOfNextDayISO})`, // Nuevo
                `limit(100)`,
                `orderAsc('fecha_hora')`
            ]
        });
    }


    return response.documents;
  } catch (error) {
    console.error("%c[Service: getCitasPorDia] ERROR fetching citas:", 'color: red; font-weight: bold;', error);
    // Ver el tipo de error puede ayudar
    if (error instanceof Error) {
        console.error("Error message:", error.message);
        // Si tienes una estructura específica de error de Appwrite, puedes loguearla
        // console.error("Appwrite error details:", JSON.stringify(error, null, 2));
    }
    return []; // Devolver vacío en caso de error
  }
};

// Obtener citas de toda la semana (Lunes a Sábado)
export const getCitasPorSemana = async (fecha: Date): Promise<(Cita & Models.Document)[]> => {
  // Obtener inicio de semana (Lunes)
  const inicioSemana = startOfWeek(fecha, { weekStartsOn: 1 });
  // Obtener fin de semana (Sábado) - añadimos 6 días desde el lunes
  const finSemana = addDays(inicioSemana, 6);
  // Obtener el inicio del día siguiente (Domingo) para la comparación lessThan
  const inicioDomingo = startOfDay(addDays(finSemana, 1));

  const inicioSemanaISO = formatISO(inicioSemana);
  const inicioDomingoISO = formatISO(inicioDomingo);

  console.log(`%c[Service: getCitasPorSemana] Buscando citas entre ${inicioSemanaISO} (L) y ${inicioDomingoISO} (D exclusive)`, 'color: blue; font-weight: bold;');

  try {
    const response = await databases.listDocuments<Cita & Models.Document>(
      DATABASE_ID,
      CITAS_COLLECTION_ID,
      [
        Query.greaterThanEqual('fecha_hora', inicioSemanaISO),
        Query.lessThan('fecha_hora', inicioDomingoISO),
        Query.limit(500), // Límite mayor para semana completa
        Query.orderAsc('fecha_hora')
      ]
    );

    console.log(`[Service: getCitasPorSemana] Documentos recibidos: ${response.documents.length}`, response.documents);
    
    return response.documents;
  } catch (error) {
    console.error("%c[Service: getCitasPorSemana] ERROR fetching citas:", 'color: red; font-weight: bold;', error);
    if (error instanceof Error) {
        console.error("Error message:", error.message);
    }
    return [];
  }
};

// Helper para limpiar campos undefined y strings vacíos
// IMPORTANTE: cliente_id y empleado_id son campos obligatorios, no se deben eliminar
const cleanUndefinedFields = <T extends Record<string, any>>(obj: T): Partial<T> => {
  const cleaned: any = {};
  const camposObligatorios = ['cliente_id', 'empleado_id'];
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      
      // Para campos obligatorios, incluir siempre (incluso si están vacíos)
      if (camposObligatorios.includes(key)) {
        cleaned[key] = value;
      }
      // Para otros campos, solo incluir si tienen un valor válido
      else if (value !== undefined && value !== null && value !== '') {
        cleaned[key] = value;
      }
    }
  }
  return cleaned;
};

// --- createCita (con Logs detallados) ---
export const createCita = async (cita: LipooutUserInput<CitaInput>): Promise<Cita & Models.Document> => {
    // 🆕 VALIDAR que cliente_nombre esté presente
    if (!cita.cliente_nombre || cita.cliente_nombre.trim() === '') {
      console.error('❌ Error: cliente_nombre no puede estar vacío');
      throw new Error('El nombre del cliente es obligatorio');
    }
    
    // Limpiar campos undefined antes de enviar
    const citaLimpia = cleanUndefinedFields(cita);
    
    // --- LOG 3 ---
    console.log('%c=== CREAR CITA - Datos enviados ===', 'color: green; font-weight: bold;');
    console.log('DATABASE_ID:', DATABASE_ID);
    console.log('CITAS_COLLECTION_ID:', CITAS_COLLECTION_ID);
    console.log('cliente_nombre:', cita.cliente_nombre); // 🆕 LOG
    console.log('Datos originales:', cita);
    console.log('Datos limpiados:', citaLimpia);
    // Loguear tipos para asegurar formato correcto
    console.log('Tipo de cada campo:');
    for (const key in citaLimpia) {
        if (Object.prototype.hasOwnProperty.call(citaLimpia, key)) {
            const value = citaLimpia[key as keyof typeof citaLimpia];
            console.log(`   ${key}: ${typeof value} = ${JSON.stringify(value)}`);
        }
    }
    // --- FIN LOG 3 ---

  try {
    const response = await databases.createDocument<Cita & Models.Document>(
      DATABASE_ID,
      CITAS_COLLECTION_ID,
      ID.unique(),
      citaLimpia as any // Cast para evitar error TypeScript - cleanUndefinedFields ya elimina undefined en runtime
    );
    // --- LOG 4 ---
    console.log(`%c✓ Cita creada exitosamente: ${response.$id}`, 'color: green;', response);
    // --- FIN LOG 4 ---
    return response;
  } catch (error) {
     console.error("%c✗ Error al crear cita:", 'color: red; font-weight: bold;', error);
     // Loguear detalles del error
     if (error instanceof Error) {
        console.error("Error message:", error.message);
        // Si es un error específico de Appwrite con response
        const appwriteError = error as any;
        if (appwriteError.response) {
            console.error("Appwrite Response:", appwriteError.response);
        }
     }
     throw error; // Relanzar para que react-query lo maneje
  }
};

// --- updateCita ---
export const updateCita = async (id: string, data: Partial<LipooutUserInput<CitaInput>>): Promise<Cita & Models.Document> => {
    // 🆕 Si se actualiza cliente_id, validar que también venga cliente_nombre
    if (data.cliente_id && (!data.cliente_nombre || data.cliente_nombre.trim() === '')) {
      console.error('❌ Error: si se actualiza cliente_id, también debe incluirse cliente_nombre');
      throw new Error('El nombre del cliente es obligatorio al cambiar de cliente');
    }
    
    // Limpiar campos undefined antes de enviar
    const dataLimpia = cleanUndefinedFields(data);
    
    console.log(`%c=== ACTUALIZAR CITA ${id} ===`, 'color: orange; font-weight: bold;');
    console.log('Datos originales:', data);
    console.log('Datos limpiados:', dataLimpia);
     try {
        const response = await databases.updateDocument<Cita & Models.Document>(
            DATABASE_ID,
            CITAS_COLLECTION_ID,
            id,
            dataLimpia as any // Cast para evitar error TypeScript - cleanUndefinedFields ya elimina undefined en runtime
        );
        console.log(`%c✓ Cita ${id} actualizada exitosamente`, 'color: orange;', response);
        return response;
     } catch(error) {
        console.error(`%c✗ Error al actualizar cita ${id}:`, 'color: red; font-weight: bold;', error);
        throw error;
     }
};

// --- deleteCita ---
export const deleteCita = async (id: string): Promise<void> => {
    console.log(`%c=== ELIMINAR CITA ${id} ===`, 'color: red; font-weight: bold;');
    try {
        // 1. Obtener el documento completo de la cita antes de eliminarla
        const cita = await databases.getDocument<Cita & Models.Document>(
            DATABASE_ID,
            CITAS_COLLECTION_ID,
            id
        );
        
        console.log('Cita obtenida para eliminación:', cita);
        
        // 2. Verificar si la cita tiene un cliente asignado
        if (cita.cliente_id && cita.cliente_id.trim() !== '') {
            console.log(`Cita tiene cliente asignado (${cita.cliente_id}), registrando en historial...`);
            
            try {
                // 3. Obtener el documento del cliente
                const cliente = await databases.getDocument<Cliente & Models.Document>(
                    DATABASE_ID,
                    CLIENTES_COLLECTION_ID,
                    cita.cliente_id
                );
                
                console.log('Cliente obtenido:', cliente);
                
                // 4. Crear entrada de historial
                const entradaHistorial: HistorialCita = {
                    cita_id: cita.$id,
                    fecha_hora: cita.fecha_hora,
                    estado: 'eliminada',
                    articulos: cita.articulos,
                    precio_total: (cita as any).precio_total || (cita as any).precio || 0,
                    comentarios: cita.comentarios,
                    empleado_id: cita.empleado_id,
                    fecha_eliminacion: new Date().toISOString(),
                    motivo_eliminacion: 'Eliminada manualmente desde la agenda'
                };
                
                console.log('Entrada de historial creada:', entradaHistorial);
                
                // 5. Deserializar historial del cliente con fallback
                let historialActual: HistorialCita[] = [];
                try {
                    const historialString = cliente.historial_citas || '[]';
                    historialActual = typeof historialString === 'string' ? JSON.parse(historialString) : historialString;
                } catch (error) {
                    console.error('Error deserializando historial_citas:', error);
                    historialActual = [];
                }
                const nuevoHistorial = [...historialActual, entradaHistorial];
                
                // 6. Actualizar el cliente con el nuevo historial (serializar a JSON string)
                await updateCliente({
                    $id: cliente.$id,
                    data: {
                        historial_citas: JSON.stringify(nuevoHistorial) as any
                    }
                });
                
                console.log(`%c✓ Historial del cliente ${cliente.$id} actualizado`, 'color: green;');
            } catch (clienteError) {
                // Si hay error al actualizar el historial, loguear pero continuar con la eliminación
                console.error('Error al actualizar historial del cliente:', clienteError);
                console.warn('Se procederá a eliminar la cita sin actualizar el historial');
            }
        } else {
            console.log('Cita sin cliente asignado, eliminando directamente...');
        }
        
        // 7. Eliminar la cita
        await databases.deleteDocument(
            DATABASE_ID,
            CITAS_COLLECTION_ID,
            id
        );
        console.log(`%c✓ Cita ${id} eliminada exitosamente`, 'color: red;');
    } catch (error) {
        console.error(`%c✗ Error al eliminar cita ${id}:`, 'color: red; font-weight: bold;', error);
        throw error;
    }
};

// Obtener citas por rango de fechas
export const getCitasPorRango = async (
  fechaInicio: Date,
  fechaFin: Date,
  empleadoId?: string
): Promise<(Cita & Models.Document)[]> => {
  const inicioISO = formatISO(fechaInicio);
  const finISO = formatISO(fechaFin);

  console.log(`%c[Service: getCitasPorRango] Buscando citas entre ${inicioISO} y ${finISO}${empleadoId ? ` para empleado ${empleadoId}` : ''}`, 'color: blue; font-weight: bold;');

  const queries = [
    Query.greaterThanEqual('fecha_hora', inicioISO),
    Query.lessThan('fecha_hora', finISO),
    Query.limit(500),
    Query.orderAsc('fecha_hora')
  ];

  if (empleadoId) {
    queries.push(Query.equal('empleado_id', empleadoId));
  }

  try {
    const response = await databases.listDocuments<Cita & Models.Document>(
      DATABASE_ID,
      CITAS_COLLECTION_ID,
      queries
    );

    console.log(`[Service: getCitasPorRango] Documentos recibidos: ${response.documents.length}`);
    return response.documents;
  } catch (error) {
    console.error("%c[Service: getCitasPorRango] ERROR:", 'color: red; font-weight: bold;', error);
    return [];
  }
};
