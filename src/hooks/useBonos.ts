import { useState, useEffect, useCallback } from 'react';
import {
  getBonosByCliente,
  getBonosDisponibles,
  getBonosDisponiblesParaArticulo,
  verificarArticuloEnBonos,
  createBonoCliente,
  updateBonoCliente,
  consumirBono,
  verificarExpiracionBonos,
  desactivarBonosExpirados,
  deleteBonoCliente,
  getEstadisticasBonos,
  CreateBonoClienteInput,
  UpdateBonoClienteInput
} from '../services/appwrite-bonos';
import type { BonoCliente } from '../types/bono.types';
import { useEmpresa } from '@/contexts/EmpresaContext';

export function useBonos(clienteId?: string) {
  const { empresaActiva } = useEmpresa();
  const [bonos, setBonos] = useState<BonoCliente[]>([]);
  const [bonosDisponibles, setBonosDisponibles] = useState<BonoCliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar bonos del cliente
  const loadBonos = useCallback(async () => {
    if (!clienteId || !empresaActiva) return;

    setLoading(true);
    setError(null);
    try {
      const data = await getBonosByCliente(empresaActiva.$id, clienteId);
      setBonos(data);
      
      // Cargar también bonos disponibles
      const disponibles = await getBonosDisponibles(empresaActiva.$id, clienteId);
      setBonosDisponibles(disponibles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar bonos');
      console.error('Error al cargar bonos:', err);
    } finally {
      setLoading(false);
    }
  }, [clienteId, empresaActiva]);

  // Cargar bonos al montar el componente o cambiar clienteId
  useEffect(() => {
    if (clienteId && empresaActiva) {
      loadBonos();
    }
  }, [clienteId, empresaActiva, loadBonos]);

  // Verificar si un artículo está disponible en bonos
  const verificarArticuloDisponible = useCallback(async (articuloId: string) => {
    if (!clienteId || !empresaActiva) return null;

    try {
      return await verificarArticuloEnBonos(empresaActiva.$id, clienteId, articuloId);
    } catch (err) {
      console.error('Error al verificar artículo en bonos:', err);
      return null;
    }
  }, [clienteId, empresaActiva]);

  // Obtener bonos disponibles para un artículo específico
  const getBonosParaArticulo = useCallback(async (articuloId: string) => {
    if (!clienteId || !empresaActiva) return [];

    try {
      return await getBonosDisponiblesParaArticulo(empresaActiva.$id, clienteId, articuloId);
    } catch (err) {
      console.error('Error al obtener bonos para artículo:', err);
      return [];
    }
  }, [clienteId, empresaActiva]);

  // Crear nuevo bono (el servicio inyecta empresa_id automáticamente)
  const createBono = useCallback(async (bono: CreateBonoClienteInput) => {
    if (!empresaActiva) throw new Error('No hay empresa activa');
    
    setLoading(true);
    setError(null);
    try {
      const nuevoBono = await createBonoCliente(empresaActiva.$id, bono);
      await loadBonos();
      return nuevoBono;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al crear bono';
      setError(errorMsg);
      console.error('Error al crear bono:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadBonos, empresaActiva]);

  // Actualizar bono
  const updateBono = useCallback(async (id: string, bono: UpdateBonoClienteInput) => {
    if (!empresaActiva) throw new Error('No hay empresa activa');
    
    setLoading(true);
    setError(null);
    try {
      const bonoActualizado = await updateBonoCliente(empresaActiva.$id, { $id: id, data: bono });
      await loadBonos();
      return bonoActualizado;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al actualizar bono';
      setError(errorMsg);
      console.error('Error al actualizar bono:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadBonos, empresaActiva]);

  // Consumir bono (usar un artículo del bono)
  const usarBono = useCallback(async (bonoId: string, articuloId: string, cantidad: number = 1) => {
    if (!empresaActiva) throw new Error('No hay empresa activa');
    
    setLoading(true);
    setError(null);
    try {
      const bonoActualizado = await consumirBono(empresaActiva.$id, bonoId, articuloId, cantidad);
      await loadBonos();
      return bonoActualizado;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al consumir bono';
      setError(errorMsg);
      console.error('Error al consumir bono:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadBonos, empresaActiva]);

  // Verificar expiración de bonos
  const verificarExpiracion = useCallback(async () => {
    if (!clienteId || !empresaActiva) return [];

    try {
      return await verificarExpiracionBonos(empresaActiva.$id, clienteId);
    } catch (err) {
      console.error('Error al verificar expiración de bonos:', err);
      return [];
    }
  }, [clienteId, empresaActiva]);

  // Desactivar bonos expirados
  const desactivarExpirados = useCallback(async () => {
    if (!empresaActiva) return 0;

    setLoading(true);
    try {
      const cantidad = await desactivarBonosExpirados(empresaActiva.$id);
      await loadBonos();
      return cantidad;
    } catch (err) {
      console.error('Error al desactivar bonos expirados:', err);
      return 0;
    } finally {
      setLoading(false);
    }
  }, [empresaActiva, loadBonos]);

  // Eliminar bono
  const deleteBono = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await deleteBonoCliente(id);
      await loadBonos();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al eliminar bono';
      setError(errorMsg);
      console.error('Error al eliminar bono:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadBonos]);

  // Obtener estadísticas de bonos
  const getEstadisticas = useCallback(async () => {
    if (!clienteId || !empresaActiva) return null;

    try {
      return await getEstadisticasBonos(empresaActiva.$id, clienteId);
    } catch (err) {
      console.error('Error al obtener estadísticas de bonos:', err);
      return null;
    }
  }, [clienteId, empresaActiva]);

  return {
    bonos,
    bonosDisponibles,
    loading,
    error,
    loadBonos,
    verificarArticuloDisponible,
    getBonosParaArticulo,
    createBono,
    updateBono,
    usarBono,
    verificarExpiracion,
    desactivarExpirados,
    deleteBono,
    getEstadisticas
  };
}
