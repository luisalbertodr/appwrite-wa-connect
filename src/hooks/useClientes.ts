import { Cliente } from '@/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Models } from 'appwrite';
import {
    getClientesByNombre,
    createCliente as createClienteService,
    updateCliente as updateClienteService,
    deleteCliente as deleteClienteService,
    CreateClienteInput,
    UpdateClienteInput
} from '@/services/appwrite-clientes';

const CLIENTES_QUERY_KEY = 'clientes';

export const useGetClientes = (searchQuery: string = "") => {
  return useQuery<(Cliente & Models.Document)[]>({
    queryKey: [CLIENTES_QUERY_KEY, searchQuery],
    queryFn: () => getClientesByNombre(searchQuery),
    staleTime: 1000 * 60 * 5,
  });
};

export const useCreateCliente = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newCliente: CreateClienteInput) => {
      return createClienteService(newCliente);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CLIENTES_QUERY_KEY] });
    },
  });
};

export const useUpdateCliente = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ $id, data }: { $id: string, data: UpdateClienteInput }) => {
      return updateClienteService({ $id, data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CLIENTES_QUERY_KEY] });
    },
  });
};

export const useDeleteCliente = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteClienteService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CLIENTES_QUERY_KEY] });
    },
  });
};
