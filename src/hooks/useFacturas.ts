import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getFacturas,
  createFactura,
  updateFactura,
  deleteFactura,
} from '@/services/appwrite-facturas'; // Importamos el servicio
import { CreateFacturaInput, UpdateFacturaInput } from '@/types/factura.types'; // Importamos los tipos
import { useEmpresa } from '@/contexts/EmpresaContext';

const FACTURAS_QUERY_KEY = 'facturas';

// Hook para OBTENER facturas con filtros opcionales
export const useGetFacturas = (searchQuery?: string, estado?: string) => {
  const { empresaActiva } = useEmpresa();
  
  return useQuery({
    // La queryKey incluye los filtros
    queryKey: [FACTURAS_QUERY_KEY, empresaActiva?.$id, { searchQuery, estado }],
    queryFn: () => {
      if (!empresaActiva) throw new Error('No hay empresa activa');
      return getFacturas(empresaActiva.$id, searchQuery, estado);
    },
    enabled: !!empresaActiva,
    staleTime: 1000 * 60 * 2, // 2 minutos de caché
  });
};

// Hook para CREAR una factura
export const useCreateFactura = () => {
  const { empresaActiva } = useEmpresa();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (newFactura: CreateFacturaInput) => {
      if (!empresaActiva) throw new Error('No hay empresa activa');
      return createFactura(empresaActiva.$id, newFactura);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FACTURAS_QUERY_KEY] });
    },
  });
};

// Hook para ACTUALIZAR una factura
export const useUpdateFactura = () => {
  const { empresaActiva } = useEmpresa();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFacturaInput }) => {
      if (!empresaActiva) throw new Error('No hay empresa activa');
      return updateFactura(empresaActiva.$id, id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FACTURAS_QUERY_KEY] });
    },
  });
};

// Hook para ELIMINAR una factura
export const useDeleteFactura = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFactura(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FACTURAS_QUERY_KEY] });
    },
  });
};
