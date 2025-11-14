import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getConfiguration,
  updateConfiguration,
  UpdateConfigurationInput,
} from '@/services/appwrite-configuration'; // Usa el servicio renombrado
import { Configuracion } from '@/types';
import { Models } from 'appwrite';
import { useEmpresa } from '@/contexts/EmpresaContext';

const CONFIGURATION_QUERY_KEY = 'configuration'; // Clave renombrada

// Hook para OBTENER la configuración
export const useGetConfiguration = () => {
  const { empresaActiva } = useEmpresa();
  
  return useQuery<Configuracion & Models.Document>({
    queryKey: [CONFIGURATION_QUERY_KEY, empresaActiva?.$id],
    queryFn: () => {
      if (!empresaActiva) throw new Error('No hay empresa activa');
      return getConfiguration(empresaActiva.$id);
    },
    enabled: !!empresaActiva,
    staleTime: 1000 * 60 * 60, // Cachear 1 hora
    retry: 1,
  });
};

// Hook para ACTUALIZAR la configuración (genérico)
export const useUpdateConfiguration = () => {
  const { empresaActiva } = useEmpresa();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateConfigurationInput }) => {
      if (!empresaActiva) throw new Error('No hay empresa activa');
      return updateConfiguration(empresaActiva.$id, id, data);
    },
    onSuccess: (data) => {
      // Actualiza la caché local con los nuevos datos
      queryClient.setQueryData([CONFIGURATION_QUERY_KEY, empresaActiva?.$id], data);
    },
  });
};

// Hook específico para obtener el SIGUIENTE NÚMERO DE DOCUMENTO
// Esto es una mutación porque *actualiza* el contador en la DB
export const useGenerarSiguienteNumero = () => {
    const { empresaActiva } = useEmpresa();
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async ({ config, tipo }: { config: Configuracion & Models.Document, tipo: 'factura' | 'presupuesto' }) => {
            if (!empresaActiva) throw new Error('No hay empresa activa');
            
            let nuevoNumero: number;
            let dataToUpdate: UpdateConfigurationInput;
            let serie: string;
            
            if (tipo === 'factura') {
                nuevoNumero = (config.ultimoNumeroFactura || 0) + 1;
                serie = config.serieFactura || 'FRA';
                dataToUpdate = { ultimoNumeroFactura: nuevoNumero };
            } else { // presupuesto
                nuevoNumero = (config.ultimoNumeroPresupuesto || 0) + 1;
                serie = config.seriePresupuesto || 'PRE';
                dataToUpdate = { ultimoNumeroPresupuesto: nuevoNumero };
            }

            // 1. Actualizar el contador en Appwrite
            const updatedConfig = await updateConfiguration(empresaActiva.$id, config.$id, dataToUpdate);

            // 2. Formatear el número (ej: FRA2025-00001)
            const año = new Date().getFullYear();
            const numeroFormateado = String(nuevoNumero).padStart(5, '0');
            const numeroCompleto = `${serie}${año}-${numeroFormateado}`;

            return { updatedConfig, numeroCompleto };
        },
        onSuccess: ({ updatedConfig }) => {
            // Actualizar la caché de configuración inmediatamente
            queryClient.setQueryData([CONFIGURATION_QUERY_KEY, empresaActiva?.$id], updatedConfig);
        },
        onError: (error) => {
             console.error("Error al incrementar el contador:", error);
        }
    });

    return mutation;
};
