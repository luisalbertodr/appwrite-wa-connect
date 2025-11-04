import { useForm } from 'react-hook-form';
import { Empleado, LipooutUserInput } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface EmpleadoFormProps {
  empleado?: Empleado;
  onSubmit: (data: LipooutUserInput<Empleado>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const EmpleadoForm = ({ empleado, onSubmit, onCancel, isLoading }: EmpleadoFormProps) => {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<LipooutUserInput<Empleado>>({
    defaultValues: empleado || {
      nombre: '',
      apellidos: '',
      nombre_completo: '',
      email: '',
      telefono: '',
      rol: 'Recepción',
      activo: true,
      color: '#3b82f6',
      notificaciones_habilitadas: true,
    },
  });

  const rolValue = watch('rol');
  const activoValue = watch('activo');
  const notificacionesValue = watch('notificaciones_habilitadas');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="nombre">Nombre *</Label>
          <Input id="nombre" {...register('nombre', { required: true })} />
          {errors.nombre && <span className="text-sm text-destructive">Campo requerido</span>}
        </div>

        <div>
          <Label htmlFor="apellidos">Apellidos *</Label>
          <Input id="apellidos" {...register('apellidos', { required: true })} />
          {errors.apellidos && <span className="text-sm text-destructive">Campo requerido</span>}
        </div>

        <div>
          <Label htmlFor="email">Email *</Label>
          <Input id="email" type="email" {...register('email', { required: true })} />
          {errors.email && <span className="text-sm text-destructive">Campo requerido</span>}
        </div>

        <div>
          <Label htmlFor="telefono">Teléfono</Label>
          <Input id="telefono" {...register('telefono')} />
        </div>

        <div>
          <Label htmlFor="rol">Rol *</Label>
          <Select value={rolValue} onValueChange={(value) => setValue('rol', value as any)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un rol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Admin">Admin</SelectItem>
              <SelectItem value="Médico">Médico</SelectItem>
              <SelectItem value="Recepción">Recepción</SelectItem>
              <SelectItem value="Lectura">Lectura</SelectItem>
              <SelectItem value="Esteticista">Esteticista</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="color">Color Identificativo</Label>
          <Input id="color" type="color" {...register('color')} />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="activo"
            checked={activoValue}
            onCheckedChange={(checked) => setValue('activo', checked)}
          />
          <Label htmlFor="activo">Empleado Activo</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="notificaciones_habilitadas"
            checked={notificacionesValue}
            onCheckedChange={(checked) => setValue('notificaciones_habilitadas', checked)}
          />
          <Label htmlFor="notificaciones_habilitadas">Notificaciones Habilitadas</Label>
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
