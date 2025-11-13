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

export function useBonos(clienteId?: string) {
  const [bonos, setBonos] = useState<BonoCliente[]>([]);
  const [bonosDisponibles, setBonosDisponibles] = useState<BonoCliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar bonos del cliente
  const loadBonos = useCallback(async () => {
    if (!clienteId) return;

    setLoading(true);
    setError(null);
    try {
      const data = await getBonosByCliente(clienteId);
      setBonos(data);
      
      // Cargar también bonos disponibles
      const disponibles = await getBonosDisponibles(clienteId);
      setBonosDisponibles(disponibles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar bonos');
      console.error('Error al cargar bonos:', err);
    } finally {
      setLoading(false);
    }
  }, [clienteId]);

  // Cargar bonos al montar el componente o cambiar clienteId
  useEffect(() => {
    if (clienteId) {
      loadBonos();
    }
  }, [clienteId, loadBonos]);

  // Verificar si un artículo está disponible en bonos
  const verificarArticuloDisponible = useCallback(async (articuloId: string) => {
    if (!clienteId) return null;

    try {
      return await verificarArticuloEnBonos(clienteId, articuloId);
    } catch (err) {
      console.error('Error al verificar artículo en bonos:', err);
      return null;
    }
  }, [clienteId]);

  // Obtener bonos disponibles para un artículo específico
  const getBonosParaArticulo = useCallback(async (articuloId: string) => {
    if (!clienteId) return [];

    try {
      return await getBonosDisponiblesParaArticulo(clienteId, articuloId);
    } catch (err) {
      console.error('Error al obtener bonos para artículo:', err);
      return [];
    }
  }, [clienteId]);

  // Crear nuevo bono (el servicio inyecta empresa_id automáticamente)
  const createBono = useCallback(async (bono: CreateBonoClienteInput) => {
    setLoading(true);
    setError(null);
    try {
      const nuevoBono = await createBonoCliente(bono);
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
  }, [loadBonos]);

  // Actualizar bono
  const updateBono = useCallback(async (id: string, bono: UpdateBonoClienteInput) => {
    setLoading(true);
    setError(null);
    try {
      const bonoActualizado = await updateBonoCliente({ $id: id, data: bono });
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
  }, [loadBonos]);

  // Consumir bono (usar un artículo del bono)
  const usarBono = useCallback(async (bonoId: string, articuloId: string, cantidad: number = 1) => {
    setLoading(true);
    setError(null);
    try {
      const bonoActualizado = await consumirBono(bonoId, articuloId, cantidad);
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
  }, [loadBonos]);

  // Verificar expiración de bonos
  const verificarExpiracion = useCallback(async () => {
    if (!clienteId) return [];

    try {
      return await verificarExpiracionBonos(clienteId);
    } catch (err) {
      console.error('Error al verificar expiración de bonos:', err);
      return [];
    }
  }, [clienteId]);

  // Desactivar bonos expirados
  const desactivarExpirados = useCallback(async () => {
    if (!clienteId) return 0;

    setLoading(true);
    try {
      const cantidad = await desactivarBonosExpirados();
      await loadBonos();
      return cantidad;
    } catch (err) {
      console.error('Error al desactivar bonos expirados:', err);
      return 0;
    } finally {
      setLoading(false);
    }
  }, [clienteId, loadBonos]);

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
    if (!clienteId) return null;

    try {
      return await getEstadisticasBonos(clienteId);
    } catch (err) {
      console.error('Error al obtener estadísticas de bonos:', err);
      return null;
    }
  }, [clienteId]);

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
