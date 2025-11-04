import { useForm } from 'react-hook-form';
import { CitaInput, EstadoCita } from '@/types/cita.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useGetClientes } from '@/hooks/useClientes';
import { useGetEmpleados } from '@/hooks/useEmpleados';
import { format } from 'date-fns';

interface CitaFormProps {
  cita?: CitaInput & { $id?: string };
  defaultFechaHora?: Date;
  onSubmit: (data: CitaInput) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const CitaForm = ({ cita, defaultFechaHora, onSubmit, onCancel, isLoading }: CitaFormProps) => {
  const { data: clientes } = useGetClientes('');
  const { data: empleados } = useGetEmpleados(true);

  const defaultValues: CitaInput = cita || {
    fecha_hora: defaultFechaHora ? format(defaultFechaHora, "yyyy-MM-dd'T'HH:mm") : format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    duracion: 60,
    cliente_id: '',
    empleado_id: '',
    articulos: '[]',
    estado: 'agendada',
    comentarios: '',
    datos_clinicos: '',
    precio_total: 0,
  };

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<CitaInput>({
    defaultValues,
  });

  const clienteId = watch('cliente_id');
  const empleadoId = watch('empleado_id');
  const estado = watch('estado');

  const handleFormSubmit = (data: CitaInput) => {
    // Asegurar que articulos sea un JSON string válido
    if (!data.articulos || data.articulos === '') {
      data.articulos = '[]';
    }
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="cliente_id">Cliente *</Label>
          <Select value={clienteId} onValueChange={(value) => setValue('cliente_id', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un cliente" />
            </SelectTrigger>
            <SelectContent>
              {clientes?.map((cliente) => (
                <SelectItem key={cliente.$id} value={cliente.$id}>
                  {cliente.nombre_completo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.cliente_id && <span className="text-sm text-destructive">Campo requerido</span>}
        </div>

        <div>
          <Label htmlFor="empleado_id">Empleado *</Label>
          <Select value={empleadoId} onValueChange={(value) => setValue('empleado_id', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un empleado" />
            </SelectTrigger>
            <SelectContent>
              {empleados?.map((empleado) => (
                <SelectItem key={empleado.$id} value={empleado.$id}>
                  {empleado.nombre_completo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.empleado_id && <span className="text-sm text-destructive">Campo requerido</span>}
        </div>

        <div>
          <Label htmlFor="fecha_hora">Fecha y Hora *</Label>
          <Input
            id="fecha_hora"
            type="datetime-local"
            {...register('fecha_hora', { required: true })}
          />
          {errors.fecha_hora && <span className="text-sm text-destructive">Campo requerido</span>}
        </div>

        <div>
          <Label htmlFor="duracion">Duración (minutos) *</Label>
          <Input
            id="duracion"
            type="number"
            {...register('duracion', { required: true, valueAsNumber: true, min: 15 })}
          />
          {errors.duracion && <span className="text-sm text-destructive">Mínimo 15 minutos</span>}
        </div>

        <div>
          <Label htmlFor="estado">Estado *</Label>
          <Select value={estado} onValueChange={(value) => setValue('estado', value as EstadoCita)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="agendada">Agendada</SelectItem>
              <SelectItem value="confirmada">Confirmada</SelectItem>
              <SelectItem value="realizada">Realizada</SelectItem>
              <SelectItem value="cancelada">Cancelada</SelectItem>
              <SelectItem value="no_asistio">No Asistió</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="precio_total">Precio Total (€)</Label>
          <Input
            id="precio_total"
            type="number"
            step="0.01"
            {...register('precio_total', { valueAsNumber: true })}
          />
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="comentarios">Comentarios</Label>
          <Textarea
            id="comentarios"
            {...register('comentarios')}
            rows={2}
            placeholder="Notas adicionales sobre la cita..."
          />
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="datos_clinicos">Datos Clínicos</Label>
          <Textarea
            id="datos_clinicos"
            {...register('datos_clinicos')}
            rows={3}
            placeholder="Información clínica relevante..."
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>
    </form>
  );
};
