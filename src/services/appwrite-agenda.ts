import { databases, DATABASE_ID, CITAS_COLLECTION_ID, CLIENTES_COLLECTION_ID } from '@/lib/appwrite';
import { Cita, CitaInput, LipooutUserInput, Cliente, HistorialCita } from '@/types';
import { ID, Query, Models } from 'appwrite';
import { startOfDay, formatISO, addDays, startOfWeek } from 'date-fns';
import { updateCliente } from './appwrite-clientes';

// Tipos Create/Update Input
export type CreateCitaInput = CitaInput;
export type UpdateCitaInput = Partial<CitaInput>;


// Búsqueda de citas por datos del cliente (iterativa acumulativa)
export const buscarCitas = async (empresaId: string, searchQuery: string): Promise<(Cita & Models.Document)[]> => {

  if (!searchQuery || searchQuery.trim() === "") {
    // Sin búsqueda, devolver citas recientes
    const response = await databases.listDocuments<Cita & Models.Document>(
      DATABASE_ID,
      CITAS_COLLECTION_ID,
      [Query.equal('empresa_id', empresaId), Query.limit(100), Query.orderDesc('fecha_hora')] // FILTRO
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
        [
          Query.equal('empresa_id', empresaId), // FILTRO
          Query.search(field, searchQuery), 
          Query.limit(100)
        ]
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
        [
          Query.equal('empresa_id', empresaId), // FILTRO
          Query.equal('cliente_id', batch), 
          Query.limit(100), Query.orderDesc('fecha_hora')
        ]
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

export const getCitasPorDia = async (empresaId: string, fecha: Date): Promise<(Cita & Models.Document)[]> => {
    
  const startOfDayDate = startOfDay(fecha);
  const startOfNextDayDate = startOfDay(addDays(fecha, 1)); 

  const startOfDayISO = formatISO(startOfDayDate);
  const startOfNextDayISO = formatISO(startOfNextDayDate); 

  console.log(`%c[Service: getCitasPorDia] Buscando citas entre ${startOfDayISO} (inclusive) y ${startOfNextDayISO} (exclusive)`, 'color: blue; font-weight: bold;');

  try {
    const response = await databases.listDocuments<Cita & Models.Document>(
      DATABASE_ID,
      CITAS_COLLECTION_ID,
      [
        Query.equal('empresa_id', empresaId), // FILTRO
        Query.greaterThanEqual('fecha_hora', startOfDayISO),
        Query.lessThan('fecha_hora', startOfNextDayISO), 
        Query.limit(100), 
        Query.orderAsc('fecha_hora') 
      ]
    );

    console.log('[Service: getCitasPorDia] Documentos recibidos de Appwrite:', response.documents);
    console.log(`[Service: getCitasPorDia] Total reportado por Appwrite: ${response.total}`);
    
    return response.documents;
  } catch (error) {
    console.error("%c[Service: getCitasPorDia] ERROR fetching citas:", 'color: red; font-weight: bold;', error);
    if (error instanceof Error) {
        console.error("Error message:", error.message);
    }
    return []; 
  }
};

// Obtener citas de toda la semana (Lunes a Sábado)
export const getCitasPorSemana = async (empresaId: string, fecha: Date): Promise<(Cita & Models.Document)[]> => {
    
  // Obtener inicio de semana (Lunes)
  const inicioSemana = startOfWeek(fecha, { weekStartsOn: 1 });
  // Obtener el inicio del día siguiente (Domingo) para la comparación lessThan
  const inicioDomingo = startOfDay(addDays(inicioSemana, 7));

  const inicioSemanaISO = formatISO(inicioSemana);
  const inicioDomingoISO = formatISO(inicioDomingo);

  console.log(`%c[Service: getCitasPorSemana] Buscando citas entre ${inicioSemanaISO} (L) y ${inicioDomingoISO} (D exclusive)`, 'color: blue; font-weight: bold;');

  try {
    const response = await databases.listDocuments<Cita & Models.Document>(
      DATABASE_ID,
      CITAS_COLLECTION_ID,
      [
        Query.equal('empresa_id', empresaId), // FILTRO
        Query.greaterThanEqual('fecha_hora', inicioSemanaISO),
        Query.lessThan('fecha_hora', inicioDomingoISO),
        Query.limit(500), 
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
const cleanUndefinedFields = <T extends Record<string, any>>(obj: T): Partial<T> => {
  const cleaned: any = {};
  // empresa_id, cliente_id y empleado_id son campos obligatorios
  const camposObligatorios = ['cliente_id', 'empleado_id', 'empresa_id']; 
  
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
export const createCita = async (empresaId: string, cita: LipooutUserInput<CitaInput>): Promise<Cita & Models.Document> => {
    
    // VALIDAR que cliente_nombre esté presente
    if (!cita.cliente_nombre || cita.cliente_nombre.trim() === '') {
      console.error('❌ Error: cliente_nombre no puede estar vacío');
      throw new Error('El nombre del cliente es obligatorio');
    }
    
    // Añadir empresa_id al objeto Cita antes de limpiar/guardar
    const citaConEmpresa = { ...cita, empresa_id: empresaId };
    const citaLimpia = cleanUndefinedFields(citaConEmpresa);
    
    // --- LOGS ---
    console.log('%c=== CREAR CITA - Datos enviados ===', 'color: green; font-weight: bold;');
    console.log('Datos limpiados:', citaLimpia);
    // --- FIN LOGS ---

  try {
    const response = await databases.createDocument<Cita & Models.Document>(
      DATABASE_ID,
      CITAS_COLLECTION_ID,
      ID.unique(),
      citaLimpia as any 
    );
    // --- LOG 4 ---
    console.log(`%c✓ Cita creada exitosamente: ${response.$id}`, 'color: green;', response);
    // --- FIN LOG 4 ---
    return response;
  } catch (error) {
     console.error("%c✗ Error al crear cita:", 'color: red; font-weight: bold;', error);
     throw error; // Relanzar para que react-query lo maneje
  }
};

// --- updateCita ---
export const updateCita = async (empresaId: string, id: string, data: Partial<LipooutUserInput<CitaInput>>): Promise<Cita & Models.Document> => {
    
    // Si se actualiza cliente_id, validar que también venga cliente_nombre
    if (data.cliente_id && (!data.cliente_nombre || data.cliente_nombre.trim() === '')) {
      console.error('❌ Error: si se actualiza cliente_id, también debe incluirse cliente_nombre');
      throw new Error('El nombre del cliente es obligatorio al cambiar de cliente');
    }
    
    // Asegurar empresa_id en los datos de actualización
    const dataConEmpresa = { ...data, empresa_id: empresaId };
    const dataLimpia = cleanUndefinedFields(dataConEmpresa);
    
    console.log(`%c=== ACTUALIZAR CITA ${id} ===`, 'color: orange; font-weight: bold;');
    console.log('Datos limpiados:', dataLimpia);
     try {
        const response = await databases.updateDocument<Cita & Models.Document>(
            DATABASE_ID,
            CITAS_COLLECTION_ID,
            id,
            dataLimpia as any
        );
        console.log(`%c✓ Cita ${id} actualizada exitosamente`, 'color: orange;', response);
        return response;
     } catch(error) {
        console.error(`%c✗ Error al actualizar cita ${id}:`, 'color: red; font-weight: bold;', error);
        throw error;
     }
};

// --- deleteCita (Preservando Historial) ---
export const deleteCita = async (empresaId: string, id: string): Promise<void> => {
    
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
                
                // 6. Actualizar el cliente con el nuevo historial
                await updateCliente(empresaId, {
                    $id: cliente.$id,
                    data: {
                        historial_citas: JSON.stringify(nuevoHistorial) as any
                    }
                });
                
                console.log(`%c✓ Historial del cliente ${cliente.$id} actualizado`, 'color: green;');
            } catch (clienteError) {
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
  empresaId: string,
  fechaInicio: Date,
  fechaFin: Date,
  empleadoId?: string
): Promise<(Cita & Models.Document)[]> => {

  const inicioISO = formatISO(fechaInicio);
  const finISO = formatISO(fechaFin);

  console.log(`%c[Service: getCitasPorRango] Buscando citas entre ${inicioISO} y ${finISO}${empleadoId ? ` para empleado ${empleadoId}` : ''}`, 'color: blue; font-weight: bold;');

  const queries = [
    Query.equal('empresa_id', empresaId), // FILTRO
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
