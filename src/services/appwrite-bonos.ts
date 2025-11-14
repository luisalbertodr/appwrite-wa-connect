import { databases, DATABASE_ID, BONOS_CLIENTE_COLLECTION_ID } from '@/lib/appwrite';
import { BonoCliente, ComposicionBono, LipooutUserInput } from '@/types';
import { ID, Query, Models } from 'appwrite';

// Tipos Input (sin empresa_id, se inyecta en el servicio)
export type CreateBonoClienteInput = Omit<LipooutUserInput<BonoCliente>, 'empresa_id'>;
export type UpdateBonoClienteInput = Partial<CreateBonoClienteInput>;

// --- Funciones de Servicio ---

// OBTENER bonos por cliente
export const getBonosByCliente = async (empresaId: string, clienteId: string): Promise<(BonoCliente & Models.Document)[]> => {
  const response = await databases.listDocuments<BonoCliente & Models.Document>(
    DATABASE_ID,
    BONOS_CLIENTE_COLLECTION_ID,
    [
      Query.equal('empresa_id', empresaId),
      Query.equal('cliente_id', clienteId),
      Query.orderDesc('fecha_compra'),
      Query.limit(100)
    ]
  );
  return response.documents;
};

// OBTENER bonos disponibles (activos, no expirados, con usos restantes)
export const getBonosDisponibles = async (empresaId: string, clienteId: string): Promise<(BonoCliente & Models.Document)[]> => {
  const now = new Date().toISOString();
  
  const response = await databases.listDocuments<BonoCliente & Models.Document>(
    DATABASE_ID,
    BONOS_CLIENTE_COLLECTION_ID,
    [
      Query.equal('empresa_id', empresaId),
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
  empresaId: string,
  clienteId: string, 
  articuloId: string
): Promise<(BonoCliente & Models.Document)[]> => {
  const bonosDisponibles = await getBonosDisponibles(empresaId, clienteId);
  
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
  empresaId: string,
  clienteId: string,
  articuloId: string
): Promise<boolean> => {
  const bonos = await getBonosDisponiblesParaArticulo(empresaId, clienteId, articuloId);
  return bonos.length > 0;
};

// CREAR bono
export const createBonoCliente = (empresaId: string, newBono: CreateBonoClienteInput) => {
  return databases.createDocument<BonoCliente & Models.Document>(
    DATABASE_ID,
    BONOS_CLIENTE_COLLECTION_ID,
    ID.unique(),
    { ...newBono, empresa_id: empresaId } 
  );
};

// ACTUALIZAR bono
export const updateBonoCliente = (empresaId: string, { $id, data }: { $id: string, data: UpdateBonoClienteInput }) => {
  return databases.updateDocument<BonoCliente & Models.Document>(
    DATABASE_ID,
    BONOS_CLIENTE_COLLECTION_ID,
    $id,
    { ...data, empresa_id: empresaId }
  );
};

// CONSUMIR bono (decrementar cantidad de un artículo) - Con chequeo de seguridad
export const consumirBono = async (
  empresaId: string,
  bonoId: string,
  articuloId: string,
  cantidadConsumida: number
): Promise<BonoCliente & Models.Document> => {
  // Obtener el bono actual
  const bono = await databases.getDocument<BonoCliente & Models.Document>(
    DATABASE_ID,
    BONOS_CLIENTE_COLLECTION_ID,
    bonoId
  );
  
  // COMPROBACIÓN DE SEGURIDAD: El bono debe pertenecer a la empresa activa.
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
  empresaId: string,
  clienteId?: string,
  diasAnticipacion: number = 7
): Promise<{
  expirados: (BonoCliente & Models.Document)[];
  porExpirar: (BonoCliente & Models.Document)[];
}> => {
  const now = new Date();
  const fechaLimite = new Date(now.getTime() + diasAnticipacion * 24 * 60 * 60 * 1000);
  
  const queries = [
    Query.equal('empresa_id', empresaId),
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
export const desactivarBonosExpirados = async (empresaId: string): Promise<number> => {
  const { expirados } = await verificarExpiracionBonos(empresaId);
  
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
export const getEstadisticasBonos = async (empresaId: string, clienteId: string) => {
  const bonos = await getBonosByCliente(empresaId, clienteId);
  
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
