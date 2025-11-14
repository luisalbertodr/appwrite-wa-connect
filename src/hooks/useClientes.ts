import { Cliente } from '@/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Models } from 'appwrite';
import { useEmpresa } from '@/contexts/EmpresaContext';
// (NUEVO) Importamos las funciones del servicio
import { 
    getClientesByNombre, 
    createCliente as createClienteService,
    updateCliente as updateClienteService,
    deleteCliente as deleteClienteService,
    CreateClienteInput,
    UpdateClienteInput
} from '@/services/appwrite-clientes';

const CLIENTES_QUERY_KEY = 'clientes';

// Hook para OBTENER todos los clientes (MODIFICADO)
export const useGetClientes = (searchQuery: string = "") => {
  const { empresaActiva } = useEmpresa();
  
  return useQuery<(Cliente & Models.Document)[]>({ // Tipo actualizado
    queryKey: [CLIENTES_QUERY_KEY, empresaActiva?.$id, searchQuery],
    queryFn: () => {
      if (!empresaActiva) throw new Error('No hay empresa activa');
      return getClientesByNombre(empresaActiva.$id, searchQuery);
    },
    enabled: !!empresaActiva,
    staleTime: 1000 * 60 * 5,
  });
};

// Hook para CREAR un cliente (MODIFICADO)
export const useCreateCliente = () => {
  const { empresaActiva } = useEmpresa();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (newCliente: CreateClienteInput) => {
      if (!empresaActiva) throw new Error('No hay empresa activa');
      return createClienteService(empresaActiva.$id, newCliente);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CLIENTES_QUERY_KEY] });
    },
  });
};

// Hook para ACTUALIZAR un cliente (MODIFICADO)
export const useUpdateCliente = () => {
  const { empresaActiva } = useEmpresa();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ $id, data }: { $id: string, data: UpdateClienteInput }) => {
      if (!empresaActiva) throw new Error('No hay empresa activa');
      return updateClienteService(empresaActiva.$id, { $id, data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CLIENTES_QUERY_KEY] });
    },
  });
};

// Hook para ELIMINAR un cliente (MODIFICADO)
export const useDeleteCliente = () => {
  const { empresaActiva } = useEmpresa();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (clienteId: string) => {
      if (!empresaActiva) throw new Error('No hay empresa activa');
      return deleteClienteService(empresaActiva.$id, clienteId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CLIENTES_QUERY_KEY] });
    },
  });
};
