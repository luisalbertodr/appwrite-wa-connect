import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCitasPorDia,
  getCitasPorSemana,
  createCita,
  updateCita,
  deleteCita,
} from '../services/appwrite-agenda';
import { Cita, CitaInput } from '@/types';
import { Models } from 'appwrite';
import { format, startOfDay, startOfWeek } from 'date-fns';

export const CITAS_QUERY_KEY = 'citas';

export const useGetCitasPorDia = (fecha: Date | undefined) => {
  const fechaValida = fecha || new Date();
  const fechaKey = format(startOfDay(fechaValida), 'yyyy-MM-dd');

  return useQuery({
    queryKey: [CITAS_QUERY_KEY, fechaKey],
    queryFn: () => getCitasPorDia(fechaValida),
    staleTime: 1000 * 60 * 5,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
};

export const useGetCitasPorSemana = (fecha: Date | undefined) => {
  const fechaValida = fecha || new Date();
  const semanaKey = format(startOfWeek(fechaValida, { weekStartsOn: 1 }), 'yyyy-MM-dd');

  return useQuery({
    queryKey: [CITAS_QUERY_KEY, 'semana', semanaKey],
    queryFn: () => getCitasPorSemana(fechaValida),
    staleTime: 1000 * 60 * 5,
    refetchOnMount: true,
  });
};

export const useCreateCita = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newCita: CitaInput) => createCita(newCita),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CITAS_QUERY_KEY] });
    },
  });
};

export const useUpdateCita = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CitaInput> }) =>
      updateCita(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CITAS_QUERY_KEY] });
    },
  });
};

export const useDeleteCita = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCita(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CITAS_QUERY_KEY] });
    },
  });
};
