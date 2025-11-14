import { useState, useEffect, useCallback } from 'react';
import {
  getAllPlantillas,
  getPlantillaById,
  getPlantillasByTipo,
  createPlantilla,
  updatePlantilla,
  desactivarPlantilla,
  deletePlantilla,
  rellenarPlantilla,
  uploadArchivoBasePlantilla,
  getArchivoBasePlantillaUrl,
  duplicarPlantilla,
  getCamposRequeridos,
  validarDatosPlantilla,
} from '../services/appwrite-plantillas-documentos';
import type { PlantillaDocumento, PlantillaDocumentoInput, TipoPlantilla } from '../types/plantilla-documento.types';
import { useEmpresa } from '@/contexts/EmpresaContext';

export interface PlantillasState {
  plantillas: PlantillaDocumento[];
  plantillaActual: PlantillaDocumento | null;
  loading: boolean;
  error: string | null;
}

export function usePlantillasDocumentos() {
  const { empresaActiva } = useEmpresa();
  const [state, setState] = useState<PlantillasState>({
    plantillas: [],
    plantillaActual: null,
    loading: false,
    error: null,
  });

  // Cargar todas las plantillas
  const loadPlantillas = useCallback(async (soloActivas: boolean = false) => {
    if (!empresaActiva) {
      setState(prev => ({ ...prev, error: 'No hay empresa activa' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const plantillas = await getAllPlantillas(empresaActiva.$id, soloActivas);
      setState({
        plantillas,
        plantillaActual: null,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error al cargar plantillas',
      }));
    }
  }, [empresaActiva]);

  // Cargar plantilla por ID
  const loadPlantillaById = useCallback(async (id: string) => {
    if (!empresaActiva) {
      const error = new Error('No hay empresa activa');
      setState(prev => ({ ...prev, error: error.message }));
      throw error;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const plantilla = await getPlantillaById(empresaActiva.$id, id);
      setState(prev => ({
        ...prev,
        plantillaActual: plantilla,
        loading: false,
        error: null,
      }));
      return plantilla;
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error al cargar plantilla',
      }));
      throw error;
    }
  }, [empresaActiva]);

  // Cargar plantillas por tipo
  const loadPlantillasByTipo = useCallback(async (tipo: TipoPlantilla) => {
    if (!empresaActiva) {
      const error = new Error('No hay empresa activa');
      setState(prev => ({ ...prev, error: error.message }));
      throw error;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const plantillas = await getPlantillasByTipo(empresaActiva.$id, tipo);
      setState(prev => ({
        ...prev,
        plantillas,
        loading: false,
        error: null,
      }));
      return plantillas;
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error al cargar plantillas por tipo',
      }));
      throw error;
    }
  }, [empresaActiva]);

  // Crear plantilla
  const createPlant = useCallback(async (plantilla: PlantillaDocumentoInput) => {
    if (!empresaActiva) {
      const error = new Error('No hay empresa activa');
      setState(prev => ({ ...prev, error: error.message }));
      throw error;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const nueva = await createPlantilla(empresaActiva.$id, plantilla);
      setState(prev => ({
        plantillas: [...prev.plantillas, nueva],
        plantillaActual: nueva,
        loading: false,
        error: null,
      }));
      return nueva;
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error al crear plantilla',
      }));
      throw error;
    }
  }, [empresaActiva]);

  // Actualizar plantilla
  const updatePlant = useCallback(async (
    id: string,
    plantilla: Partial<PlantillaDocumentoInput>
  ) => {
    if (!empresaActiva) {
      const error = new Error('No hay empresa activa');
      setState(prev => ({ ...prev, error: error.message }));
      throw error;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const actualizada = await updatePlantilla(empresaActiva.$id, id, plantilla);
      setState(prev => ({
        plantillas: prev.plantillas.map(p =>
          p.$id === id ? actualizada : p
        ),
        plantillaActual: prev.plantillaActual?.$id === id ? actualizada : prev.plantillaActual,
        loading: false,
        error: null,
      }));
      return actualizada;
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error al actualizar plantilla',
      }));
      throw error;
    }
  }, [empresaActiva]);

  // Desactivar plantilla
  const desactivar = useCallback(async (id: string) => {
    if (!empresaActiva) {
      const error = new Error('No hay empresa activa');
      setState(prev => ({ ...prev, error: error.message }));
      throw error;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const desactivada = await desactivarPlantilla(empresaActiva.$id, id);
      setState(prev => ({
        plantillas: prev.plantillas.map(p =>
          p.$id === id ? desactivada : p
        ),
        plantillaActual: prev.plantillaActual?.$id === id ? desactivada : prev.plantillaActual,
        loading: false,
        error: null,
      }));
      return desactivada;
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error al desactivar plantilla',
      }));
      throw error;
    }
  }, [empresaActiva]);

  // Eliminar plantilla
  const deletePlant = useCallback(async (id: string) => {
    if (!empresaActiva) {
      const error = new Error('No hay empresa activa');
      setState(prev => ({ ...prev, error: error.message }));
      throw error;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      await deletePlantilla(empresaActiva.$id, id);
      setState(prev => ({
        plantillas: prev.plantillas.filter(p => p.$id !== id),
        plantillaActual: prev.plantillaActual?.$id === id ? null : prev.plantillaActual,
        loading: false,
        error: null,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error al eliminar plantilla',
      }));
      throw error;
    }
  }, [empresaActiva]);

  // Rellenar plantilla con datos
  const rellenar = useCallback((
    plantilla: PlantillaDocumento,
    datos: Record<string, any>
  ): string => {
    try {
      return rellenarPlantilla(plantilla, datos);
    } catch (error) {
      console.error('Error al rellenar plantilla:', error);
      return plantilla.contenido;
    }
  }, []);

  // Subir archivo base
  const uploadArchivoBase = useCallback(async (
    file: File,
    plantillaId: string
  ) => {
    if (!empresaActiva) {
      const error = new Error('No hay empresa activa');
      setState(prev => ({ ...prev, error: error.message }));
      throw error;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const archivoId = await uploadArchivoBasePlantilla(empresaActiva.$id, file, plantillaId);
      // Recargar la plantilla actualizada
      const actualizada = await getPlantillaById(empresaActiva.$id, plantillaId);
      setState(prev => ({
        plantillas: prev.plantillas.map(p =>
          p.$id === plantillaId ? actualizada : p
        ),
        plantillaActual: prev.plantillaActual?.$id === plantillaId ? actualizada : prev.plantillaActual,
        loading: false,
        error: null,
      }));
      return archivoId;
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error al subir archivo base',
      }));
      throw error;
    }
  }, [empresaActiva]);

  // Obtener URL del archivo base
  const getUrlArchivoBase = useCallback((archivoId: string): string | null => {
    try {
      return getArchivoBasePlantillaUrl(archivoId);
    } catch (error) {
      console.error('Error al obtener URL del archivo base:', error);
      return null;
    }
  }, []);

  // Duplicar plantilla
  const duplicar = useCallback(async (
    plantillaId: string,
    nuevoNombre?: string
  ) => {
    if (!empresaActiva) {
      const error = new Error('No hay empresa activa');
      setState(prev => ({ ...prev, error: error.message }));
      throw error;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const duplicada = await duplicarPlantilla(empresaActiva.$id, plantillaId, nuevoNombre);
      setState(prev => ({
        plantillas: [...prev.plantillas, duplicada],
        plantillaActual: duplicada,
        loading: false,
        error: null,
      }));
      return duplicada;
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error al duplicar plantilla',
      }));
      throw error;
    }
  }, [empresaActiva]);

  // Obtener campos requeridos
  const getCamposReq = useCallback((plantilla: PlantillaDocumento): any[] => {
    return getCamposRequeridos(plantilla);
  }, []);

  // Validar datos
  const validarDatos = useCallback((
    plantilla: PlantillaDocumento,
    datos: Record<string, any>
  ): { valido: boolean; errores: string[] } => {
    return validarDatosPlantilla(plantilla, datos);
  }, []);

  // Obtener plantillas por tipo desde el estado local
  const getPlantillasByTipoLocal = useCallback((tipo: TipoPlantilla): PlantillaDocumento[] => {
    return state.plantillas.filter(p => p.tipo === tipo && p.activa);
  }, [state.plantillas]);

  // Buscar plantillas por nombre
  const buscarPlantillas = useCallback((busqueda: string): PlantillaDocumento[] => {
    const termino = busqueda.toLowerCase();
    return state.plantillas.filter(p =>
      p.nombre.toLowerCase().includes(termino) ||
      (p.descripcion?.toLowerCase().includes(termino) || false)
    );
  }, [state.plantillas]);

  // Obtener estadísticas
  const getEstadisticas = useCallback(() => {
    const total = state.plantillas.length;
    const activas = state.plantillas.filter(p => p.activa).length;
    const inactivas = total - activas;
    
    const porTipo = state.plantillas.reduce((acc, p) => {
      acc[p.tipo] = (acc[p.tipo] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const conFirma = state.plantillas.filter(p => p.requiere_firma).length;
    const sinFirma = total - conFirma;

    return {
      total,
      activas,
      inactivas,
      porTipo,
      conFirma,
      sinFirma,
    };
  }, [state.plantillas]);

  // Auto-cargar al montar
  useEffect(() => {
    loadPlantillas(false);
  }, [loadPlantillas]);

  return {
    plantillas: state.plantillas,
    plantillaActual: state.plantillaActual,
    loading: state.loading,
    error: state.error,
    loadPlantillas,
    loadPlantillaById,
    loadPlantillasByTipo,
    createPlantilla: createPlant,
    updatePlantilla: updatePlant,
    desactivarPlantilla: desactivar,
    deletePlantilla: deletePlant,
    rellenarPlantilla: rellenar,
    uploadArchivoBase,
    getUrlArchivoBase,
    duplicarPlantilla: duplicar,
    getCamposRequeridos: getCamposReq,
    validarDatos,
    getPlantillasByTipoLocal,
    buscarPlantillas,
    getEstadisticas,
  };
}
