import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getEmpresas, 
  createEmpresa, 
  updateEmpresa, 
  deleteEmpresa, 
  CreateEmpresaInput, 
  UpdateEmpresaInput 
} from '@/services/appwrite-empresas';
import { Empresa } from '@/types';

const EMPRESAS_QUERY_KEY = 'empresas';

// Hook para obtener la lista de empresas
export const useGetEmpresas = () => {
  return useQuery({
    queryKey: [EMPRESAS_QUERY_KEY],
    queryFn: getEmpresas,
    staleTime: 1000 * 60 * 5, // 5 minutos de caché
  });
};

// Hook para crear una nueva empresa
export const useCreateEmpresa = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newEmpresa: CreateEmpresaInput) => createEmpresa(newEmpresa),
    onSuccess: () => {
      // Invalida la caché de la lista de empresas para forzar el refetch
      queryClient.invalidateQueries({ queryKey: [EMPRESAS_QUERY_KEY] });
    },
  });
};

// Hook para actualizar una empresa existente
export const useUpdateEmpresa = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEmpresaInput }) =>
      updateEmpresa({ id, data }),
    onSuccess: () => {
      // Invalida la caché de la lista de empresas
      queryClient.invalidateQueries({ queryKey: [EMPRESAS_QUERY_KEY] });
    },
  });
};

// Hook para eliminar una empresa
export const useDeleteEmpresa = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteEmpresa(id),
    onSuccess: () => {
      // Invalida la caché de la lista de empresas
      queryClient.invalidateQueries({ queryKey: [EMPRESAS_QUERY_KEY] });
    },
  });
};

// Hook consolidado para el componente EmpresasTab
export const useEmpresas = () => {
  const { data: empresas, isLoading, error } = useGetEmpresas();
  const { mutateAsync: createAsync } = useCreateEmpresa();
  const { mutateAsync: updateAsync } = useUpdateEmpresa();
  const { mutateAsync: deleteAsync } = useDeleteEmpresa();

  return {
    empresas: (empresas as Empresa[]) || [],
    isLoading,
    error,
    createEmpresa: createAsync,
    updateEmpresa: updateAsync,
    deleteEmpresa: deleteAsync,
  };
};