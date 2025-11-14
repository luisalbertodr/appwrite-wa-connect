import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getEmpleados,
  createEmpleado,
  updateEmpleado,
  deleteEmpleado,
  CreateEmpleadoInput, // Correcto
  UpdateEmpleadoInput, // Correcto
} from '../services/appwrite-empleados'; // Verificado
import { useEmpresa } from '@/contexts/EmpresaContext';

const EMPLEADOS_QUERY_KEY = 'empleados';

export const useGetEmpleados = (soloActivos: boolean = true) => {
  const { empresaActiva } = useEmpresa();
  
  return useQuery({
    queryKey: [EMPLEADOS_QUERY_KEY, empresaActiva?.$id, { soloActivos }],
    queryFn: () => {
      if (!empresaActiva) throw new Error('No hay empresa activa');
      return getEmpleados(empresaActiva.$id, soloActivos);
    },
    enabled: !!empresaActiva,
    staleTime: 1000 * 60 * 15,
  });
};

export const useCreateEmpleado = () => {
  const { empresaActiva } = useEmpresa();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (newEmpleado: CreateEmpleadoInput) => {
      if (!empresaActiva) throw new Error('No hay empresa activa');
      return createEmpleado(empresaActiva.$id, newEmpleado);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EMPLEADOS_QUERY_KEY] });
    },
  });
};

export const useUpdateEmpleado = () => {
  const { empresaActiva } = useEmpresa();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEmpleadoInput }) => {
      if (!empresaActiva) throw new Error('No hay empresa activa');
      return updateEmpleado(empresaActiva.$id, id, data);
    },
    onSuccess: (/* _, variables */) => { // Comentamos variables si no se usa
      queryClient.invalidateQueries({ queryKey: [EMPLEADOS_QUERY_KEY] });
    },
  });
};

export const useDeleteEmpleado = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteEmpleado(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EMPLEADOS_QUERY_KEY] });
    },
  });
};
