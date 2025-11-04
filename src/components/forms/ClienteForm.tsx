import { useForm } from 'react-hook-form';
import { Cliente, LipooutUserInput } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface ClienteFormProps {
  cliente?: Cliente;
  onSubmit: (data: LipooutUserInput<Cliente>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ClienteForm = ({ cliente, onSubmit, onCancel, isLoading }: ClienteFormProps) => {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<LipooutUserInput<Cliente>>({
    defaultValues: cliente || {
      codcli: '',
      nomcli: '',
      ape1cli: '',
      email: '',
      dnicli: '',
      tel1cli: '',
      tel2cli: '',
      dircli: '',
      codposcli: '',
      pobcli: '',
      procli: '',
      fecnac: '',
      sexo: 'Otro',
      enviar: 1,
      facturacion: 0,
      intereses: [],
      antecedentes_personales: '',
    },
  });

  const sexoValue = watch('sexo');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="codcli">Código Cliente *</Label>
          <Input id="codcli" {...register('codcli', { required: true })} />
          {errors.codcli && <span className="text-sm text-destructive">Campo requerido</span>}
        </div>

        <div>
          <Label htmlFor="nomcli">Nombre *</Label>
          <Input id="nomcli" {...register('nomcli', { required: true })} />
          {errors.nomcli && <span className="text-sm text-destructive">Campo requerido</span>}
        </div>

        <div>
          <Label htmlFor="ape1cli">Apellidos *</Label>
          <Input id="ape1cli" {...register('ape1cli', { required: true })} />
          {errors.ape1cli && <span className="text-sm text-destructive">Campo requerido</span>}
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register('email')} />
        </div>

        <div>
          <Label htmlFor="dnicli">DNI/NIE</Label>
          <Input id="dnicli" {...register('dnicli')} />
        </div>

        <div>
          <Label htmlFor="tel1cli">Teléfono 1</Label>
          <Input id="tel1cli" {...register('tel1cli')} />
        </div>

        <div>
          <Label htmlFor="tel2cli">Teléfono 2</Label>
          <Input id="tel2cli" {...register('tel2cli')} />
        </div>

        <div>
          <Label htmlFor="fecnac">Fecha Nacimiento</Label>
          <Input id="fecnac" type="date" {...register('fecnac')} />
        </div>

        <div>
          <Label htmlFor="sexo">Sexo</Label>
          <Select value={sexoValue} onValueChange={(value) => setValue('sexo', value as 'H' | 'M' | 'Otro')}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="H">Hombre</SelectItem>
              <SelectItem value="M">Mujer</SelectItem>
              <SelectItem value="Otro">Otro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="dircli">Dirección</Label>
          <Input id="dircli" {...register('dircli')} />
        </div>

        <div>
          <Label htmlFor="codposcli">Código Postal</Label>
          <Input id="codposcli" {...register('codposcli')} />
        </div>

        <div>
          <Label htmlFor="pobcli">Población</Label>
          <Input id="pobcli" {...register('pobcli')} />
        </div>

        <div>
          <Label htmlFor="procli">Provincia</Label>
          <Input id="procli" {...register('procli')} />
        </div>

        <div>
          <Label htmlFor="facturacion">Facturación</Label>
          <Input id="facturacion" type="number" step="0.01" {...register('facturacion', { valueAsNumber: true })} />
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="antecedentes_personales">Antecedentes Personales</Label>
          <Textarea id="antecedentes_personales" {...register('antecedentes_personales')} rows={3} />
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
