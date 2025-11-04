import { useState, useEffect, useCallback } from 'react';
import {
  getSesionesByCliente,
  getSesionesByEmpleado,
  getSesionByCita,
  createSesionClinica,
  updateSesionClinica,
  deleteSesionClinica,
  uploadDocumentoFirmado,
  getDocumentoFirmadoUrl,
  deleteDocumentoFirmado,
  uploadFotoSesion,
  getFotoSesionUrl,
  deleteFotoSesion,
  getEstadisticasSesiones,
  getSesionesByRangoFechas
} from '../services/appwrite-sesiones-clinicas';
import type { SesionClinica, SesionClinicaInput } from '../types/sesion-clinica.types';

export function useSesionesClinicas(clienteId?: string, empleadoId?: string) {
  const [sesiones, setSesiones] = useState<SesionClinica[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar sesiones
  const loadSesiones = useCallback(async () => {
    if (!clienteId && !empleadoId) return;

    setLoading(true);
    setError(null);
    try {
      let data: SesionClinica[];
      if (clienteId) {
        data = await getSesionesByCliente(clienteId);
      } else if (empleadoId) {
        data = await getSesionesByEmpleado(empleadoId);
      } else {
        data = [];
      }
      setSesiones(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar sesiones');
      console.error('Error al cargar sesiones:', err);
    } finally {
      setLoading(false);
    }
  }, [clienteId, empleadoId]);

  // Cargar sesiones al montar el componente
  useEffect(() => {
    if (clienteId || empleadoId) {
      loadSesiones();
    }
  }, [clienteId, empleadoId, loadSesiones]);

  // Obtener sesión por cita
  const getSesionPorCita = useCallback(async (citaId: string) => {
    try {
      return await getSesionByCita(citaId);
    } catch (err) {
      console.error('Error al obtener sesión por cita:', err);
      return null;
    }
  }, []);

  // Crear nueva sesión
  const createSesion = useCallback(async (sesion: SesionClinicaInput) => {
    setLoading(true);
    setError(null);
    try {
      const nuevaSesion = await createSesionClinica(sesion);
      await loadSesiones();
      return nuevaSesion;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al crear sesión';
      setError(errorMsg);
      console.error('Error al crear sesión:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadSesiones]);

  // Actualizar sesión
  const updateSesion = useCallback(async (id: string, sesion: Partial<SesionClinicaInput>) => {
    setLoading(true);
    setError(null);
    try {
      const sesionActualizada = await updateSesionClinica({ $id: id, data: sesion });
      await loadSesiones();
      return sesionActualizada;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al actualizar sesión';
      setError(errorMsg);
      console.error('Error al actualizar sesión:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadSesiones]);

  // Eliminar sesión
  const deleteSesion = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await deleteSesionClinica(id);
      await loadSesiones();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al eliminar sesión';
      setError(errorMsg);
      console.error('Error al eliminar sesión:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadSesiones]);

  // Subir documento firmado
  const subirDocumentoFirmado = useCallback(async (file: File, sesionId: string) => {
    try {
      return await uploadDocumentoFirmado(file, sesionId);
    } catch (err) {
      console.error('Error al subir documento firmado:', err);
      throw err;
    }
  }, []);

  // Obtener URL de documento firmado
  const obtenerUrlDocumento = useCallback((documentoId: string) => {
    try {
      return getDocumentoFirmadoUrl(documentoId);
    } catch (err) {
      console.error('Error al obtener URL de documento:', err);
      return '';
    }
  }, []);

  // Eliminar documento firmado
  const eliminarDocumento = useCallback(async (documentoId: string) => {
    try {
      await deleteDocumentoFirmado(documentoId);
    } catch (err) {
      console.error('Error al eliminar documento:', err);
      throw err;
    }
  }, []);

  // Subir foto de sesión
  const subirFotoSesion = useCallback(async (file: File, sesionId: string) => {
    try {
      return await uploadFotoSesion(file, sesionId);
    } catch (err) {
      console.error('Error al subir foto:', err);
      throw err;
    }
  }, []);

  // Obtener URL de foto
  const obtenerUrlFoto = useCallback((fotoId: string) => {
    try {
      return getFotoSesionUrl(fotoId);
    } catch (err) {
      console.error('Error al obtener URL de foto:', err);
      return '';
    }
  }, []);

  // Eliminar foto
  const eliminarFoto = useCallback(async (fotoId: string) => {
    try {
      await deleteFotoSesion(fotoId);
    } catch (err) {
      console.error('Error al eliminar foto:', err);
      throw err;
    }
  }, []);

  // Obtener estadísticas
  const getEstadisticas = useCallback(async () => {
    if (!clienteId) return null;

    try {
      return await getEstadisticasSesiones(clienteId);
    } catch (err) {
      console.error('Error al obtener estadísticas:', err);
      return null;
    }
  }, [clienteId]);

  // Obtener sesiones por rango de fechas
  const getSesionesPorRango = useCallback(async (fechaInicio: string, fechaFin: string) => {
    try {
      return await getSesionesByRangoFechas(fechaInicio, fechaFin);
    } catch (err) {
      console.error('Error al obtener sesiones por rango:', err);
      return [];
    }
  }, []);

  return {
    sesiones,
    loading,
    error,
    loadSesiones,
    getSesionPorCita,
    createSesion,
    updateSesion,
    deleteSesion,
    subirDocumentoFirmado,
    obtenerUrlDocumento,
    eliminarDocumento,
    subirFotoSesion,
    obtenerUrlFoto,
    eliminarFoto,
    getEstadisticas,
    getSesionesPorRango
  };
}
