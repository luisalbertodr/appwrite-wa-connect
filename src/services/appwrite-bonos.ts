import { databases, DATABASE_ID, BONOS_CLIENTE_COLLECTION_ID } from '@/lib/appwrite';
import { BonoCliente, ComposicionBono, LipooutUserInput } from '@/types';
import { ID, Query, Models } from 'appwrite';

// =========================================================================
// CAMBIO MULTIEMPRESA: OBTENER CONTEXTO DE EMPRESA
// =========================================================================
const getEmpresaActualId = () => "ID_EMPRESA_ACTUAL_PLACEHOLDER"; 

// Tipos Input
export type CreateBonoClienteInput = LipooutUserInput<BonoCliente>;
export type UpdateBonoClienteInput = Partial<CreateBonoClienteInput>;

// --- Funciones de Servicio ---

// OBTENER bonos por cliente
export const getBonosByCliente = async (clienteId: string): Promise<(BonoCliente & Models.Document)[]> => {
  const empresaId = getEmpresaActualId();
  
  const response = await databases.listDocuments<BonoCliente & Models.Document>(
    DATABASE_ID,
    BONOS_CLIENTE_COLLECTION_ID,
    [
      Query.equal('empresa_id', empresaId), // FILTRO MULTIEMPRESA (Ahora compatible con el tipo)
      Query.equal('cliente_id', clienteId),
      Query.orderDesc('fecha_compra'),
      Query.limit(100)
    ]
  );
  return response.documents;
};

// OBTENER bonos disponibles (activos, no expirados, con usos restantes)
export const getBonosDisponibles = async (clienteId: string): Promise<(BonoCliente & Models.Document)[]> => {
  const empresaId = getEmpresaActualId();
  const now = new Date().toISOString();
  
  const response = await databases.listDocuments<BonoCliente & Models.Document>(
    DATABASE_ID,
    BONOS_CLIENTE_COLLECTION_ID,
    [
      Query.equal('empresa_id', empresaId), // FILTRO MULTIEMPRESA
      Query.equal('cliente_id', clienteId),
      Query.equal('activo', true),
      Query.greaterThan('usos_restantes', 0),
      Query.orderAsc('fecha_vencimiento'),
      Query.limit(100)
    ]
  );
  
  // Filtrar los no vencidos en el cliente
  return response.documents.filter(bono => 
    !bono.fecha_vencimiento || bono.fecha_vencimiento > now
  );
};

// OBTENER bonos disponibles para un artículo específico
export const getBonosDisponiblesParaArticulo = async (
  clienteId: string, 
  articuloId: string
): Promise<(BonoCliente & Models.Document)[]> => {
  // getBonosDisponibles ya incluye el filtro de empresa_id
  const bonosDisponibles = await getBonosDisponibles(clienteId);
  
  // Filtrar bonos que contienen el artículo en su composición restante
  return bonosDisponibles.filter(bono => {
    try {
      const composicionRestante: ComposicionBono[] = JSON.parse(bono.composicion_restante);
      return composicionRestante.some(item => 
        item.articulo_id === articuloId && item.cantidad_restante > 0
      );
    } catch {
      return false;
    }
  });
};

// VERIFICAR si un artículo está disponible en algún bono
export const verificarArticuloEnBonos = async (
  clienteId: string,
  articuloId: string
): Promise<boolean> => {
  const bonos = await getBonosDisponiblesParaArticulo(clienteId, articuloId);
  return bonos.length > 0;
};

// CREAR bono
export const createBonoCliente = (newBono: CreateBonoClienteInput) => {
  const empresaId = getEmpresaActualId();
  
  // Corrección 2353: Ahora newBono acepta la inyección de empresa_id
  return databases.createDocument<BonoCliente & Models.Document>(
    DATABASE_ID,
    BONOS_CLIENTE_COLLECTION_ID,
    ID.unique(),
    { ...newBono, empresa_id: empresaId } 
  );
};

// ACTUALIZAR bono
export const updateBonoCliente = ({ $id, data }: { $id: string, data: UpdateBonoClienteInput }) => {
  const empresaId = getEmpresaActualId();
  
  // Corrección 2353: Ahora data acepta la inyección de empresa_id
  return databases.updateDocument<BonoCliente & Models.Document>(
    DATABASE_ID,
    BONOS_CLIENTE_COLLECTION_ID,
    $id,
    { ...data, empresa_id: empresaId }
  );
};

// CONSUMIR bono (decrementar cantidad de un artículo) - Con chequeo de seguridad
export const consumirBono = async (
  bonoId: string,
  articuloId: string,
  cantidadConsumida: number
): Promise<BonoCliente & Models.Document> => {
  const empresaId = getEmpresaActualId();
    
  // Obtener el bono actual
  const bono = await databases.getDocument<BonoCliente & Models.Document>(
    DATABASE_ID,
    BONOS_CLIENTE_COLLECTION_ID,
    bonoId
  );
  
  // COMPROBACIÓN DE SEGURIDAD: El bono debe pertenecer a la empresa activa.
  // Corrección 2339: bono.empresa_id ahora existe en el tipo.
  if (bono.empresa_id !== empresaId) { 
      throw new Error("Acceso denegado: El bono no pertenece a la empresa activa.");
  }


  // Parsear composición restante
  const composicionRestante: ComposicionBono[] = JSON.parse(bono.composicion_restante);
  
  // Encontrar el artículo y actualizar cantidad
  const itemIndex = composicionRestante.findIndex(item => item.articulo_id === articuloId);
// ... (rest of function logic)
  if (itemIndex === -1) {
    throw new Error(`Artículo ${articuloId} no encontrado en el bono ${bonoId}`);
  }

  const item = composicionRestante[itemIndex];
  if (item.cantidad_restante < cantidadConsumida) {
    throw new Error(`Cantidad insuficiente en bono. Disponible: ${item.cantidad_restante}, Solicitado: ${cantidadConsumida}`);
  }

  // Actualizar cantidad restante
  composicionRestante[itemIndex] = {
    ...item,
    cantidad_restante: item.cantidad_restante - cantidadConsumida
  };

  // Calcular usos restantes totales
  const usosRestantes = composicionRestante.reduce(
    (sum, item) => sum + item.cantidad_restante, 
    0
  );

  // Actualizar bono
  return databases.updateDocument<BonoCliente & Models.Document>(
    DATABASE_ID,
    BONOS_CLIENTE_COLLECTION_ID,
    bonoId,
    {
      composicion_restante: JSON.stringify(composicionRestante),
      usos_restantes: usosRestantes,
      activo: usosRestantes > 0
    }
  );
};

// VERIFICAR bonos expirados o por expirar
export const verificarExpiracionBonos = async (
  clienteId?: string,
  diasAnticipacion: number = 7
): Promise<{
  expirados: (BonoCliente & Models.Document)[];
  porExpirar: (BonoCliente & Models.Document)[];
}> => {
  const empresaId = getEmpresaActualId(); // OBTENER EMPRESA ID
    
  const now = new Date();
  const fechaLimite = new Date(now.getTime() + diasAnticipacion * 24 * 60 * 60 * 1000);
  
  const queries = [
    Query.equal('empresa_id', empresaId), // FILTRO
    Query.equal('activo', true),
    Query.greaterThan('usos_restantes', 0),
    Query.isNotNull('fecha_vencimiento'),
    Query.limit(500)
  ];

  if (clienteId) {
    queries.push(Query.equal('cliente_id', clienteId));
  }

  const response = await databases.listDocuments<BonoCliente & Models.Document>(
    DATABASE_ID,
    BONOS_CLIENTE_COLLECTION_ID,
    queries
  );

  const expirados: (BonoCliente & Models.Document)[] = [];
  const porExpirar: (BonoCliente & Models.Document)[] = [];

  response.documents.forEach(bono => {
    if (!bono.fecha_vencimiento) return;
    
    const fechaVencimiento = new Date(bono.fecha_vencimiento);
    if (fechaVencimiento < now) {
      expirados.push(bono);
    } else if (fechaVencimiento < fechaLimite) {
      porExpirar.push(bono);
    }
  });

  return { expirados, porExpirar };
};

// DESACTIVAR bonos expirados
export const desactivarBonosExpirados = async (): Promise<number> => {
  // getBonosByCliente ya filtra por empresa_id
  const { expirados } = await verificarExpiracionBonos();
  
  let contador = 0;
  for (const bono of expirados) {
    await databases.updateDocument(
      DATABASE_ID,
      BONOS_CLIENTE_COLLECTION_ID,
      bono.$id,
      { activo: false }
    );
    contador++;
  }
  
  return contador;
};

// ELIMINAR bono
export const deleteBonoCliente = (bonoId: string) => {
  return databases.deleteDocument(
    DATABASE_ID,
    BONOS_CLIENTE_COLLECTION_ID,
    bonoId
  );
};

// OBTENER estadísticas de bonos de un cliente
export const getEstadisticasBonos = async (clienteId: string) => {
  // getBonosByCliente ya filtra por empresa_id
  const bonos = await getBonosByCliente(clienteId);
  
  const activos = bonos.filter(b => b.activo && b.usos_restantes > 0);
  const usados = bonos.filter(b => !b.activo || b.usos_restantes === 0);
  const expirados = bonos.filter(b => {
    if (!b.fecha_vencimiento) return false;
    return new Date(b.fecha_vencimiento) < new Date() && b.usos_restantes > 0;
  });
  
  const totalUsosRestantes = activos.reduce((sum, b) => sum + b.usos_restantes, 0);
  const valorTotalRestante = activos.reduce((sum, b) => {
    try {
      const composicion: ComposicionBono[] = JSON.parse(b.composicion_restante);
      return sum + composicion.reduce(
        (subSum, item) => subSum + (item.precio_unitario * item.cantidad_restante),
        0
      );
    } catch {
      return sum;
    }
  }, 0);

  return {
    total: bonos.length,
    activos: activos.length,
    usados: usados.length,
    expirados: expirados.length,
    totalUsosRestantes,
    valorTotalRestante
  };
};