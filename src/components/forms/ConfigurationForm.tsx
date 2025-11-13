import { useEffect, ChangeEvent, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ConfigurationFormData, configurationSchema } from '@/lib/validators'; // Importar esquema y tipo
import { Configuracion, LipooutUserInput, HorarioApertura, DiaSemana } from '@/types';
import { Models } from 'appwrite';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import LoadingSpinner from '../LoadingSpinner';
import { Loader2, Upload, Trash2 } from 'lucide-react';

interface ConfigurationFormProps {
  configInicial?: (Configuracion & Models.Document) | null;
  onSubmit: (data: LipooutUserInput<Configuracion>) => Promise<void>;
  onLogoUpload: (file: File) => Promise<void>; // Nuevo manejador para subir el logo
  isSubmitting: boolean;
  isLoading: boolean;
}

// Horarios por defecto (L-V 08:00-21:00, S-D cerrado)
const horariosDefecto: HorarioApertura[] = [
  { dia: 'lunes', abierto: true, horaInicio: '08:00', horaFin: '21:00' },
  { dia: 'martes', abierto: true, horaInicio: '08:00', horaFin: '21:00' },
  { dia: 'miercoles', abierto: true, horaInicio: '08:00', horaFin: '21:00' },
  { dia: 'jueves', abierto: true, horaInicio: '08:00', horaFin: '21:00' },
  { dia: 'viernes', abierto: true, horaInicio: '08:00', horaFin: '21:00' },
  { dia: 'sabado', abierto: false, horaInicio: '08:00', horaFin: '21:00' },
  { dia: 'domingo', abierto: false, horaInicio: '08:00', horaFin: '21:00' },
];

// Valores por defecto (se llenarán con los datos cargados)
const defaultValues: ConfigurationFormData = {
  nombreClinica: '',
  direccion: '',
  cif2: '',
  emailContacto: '',
  telefonoContacto: '',
  serieFactura: 'FRA',
  seriePresupuesto: 'PRE',
  tipoIvaPredeterminado: 21,
  horarios: horariosDefecto,
  logoUrl: '', 
  logoText: 'Lipoout', 
  hideLogoText: false, // NUEVO
};

// Mapa de días en español
const diasSemana: { value: DiaSemana; label: string }[] = [
  { value: 'lunes', label: 'Lunes' },
  { value: 'martes', label: 'Martes' },
  { value: 'miercoles', label: 'Miércoles' },
  { value: 'jueves', label: 'Jueves' },
  { value: 'viernes', label: 'Viernes' },
  { value: 'sabado', label: 'Sábado' },
  { value: 'domingo', label: 'Domingo' },
];

export const ConfigurationForm = ({ configInicial, onSubmit, onLogoUpload, isSubmitting, isLoading }: ConfigurationFormProps) => {

  const form = useForm<ConfigurationFormData>({
    resolver: zodResolver(configurationSchema),
    defaultValues: defaultValues,
  });
  
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Rellenar el formulario cuando los datos iniciales carguen
  useEffect(() => {
    if (configInicial) {
      form.reset({
        nombreClinica: configInicial.nombreClinica || '',
        direccion: configInicial.direccion || '',
        cif2: configInicial.cif2 || '',
        emailContacto: configInicial.emailContacto || '',
        telefonoContacto: configInicial.telefonoContacto || '',
        serieFactura: configInicial.serieFactura || 'FRA',
        seriePresupuesto: configInicial.seriePresupuesto || 'PRE',
        tipoIvaPredeterminado: configInicial.tipoIvaPredeterminado ?? 21,
        horarios: configInicial.horarios || horariosDefecto,
        logoUrl: configInicial.logoUrl || '',
        logoText: configInicial.logoText || 'Lipoout',
        hideLogoText: configInicial.hideLogoText ?? false, // NUEVO
      });
    }
  }, [configInicial, form]);


  const handleSubmit = async (data: ConfigurationFormData) => {
    // Solo enviamos los datos del formulario, los contadores no se tocan aquí
    const finalData: LipooutUserInput<Configuracion> = {
        nombreClinica: data.nombreClinica,
        direccion: data.direccion || '',
        cif2: data.cif2,
        emailContacto: data.emailContacto || '',
        telefonoContacto: data.telefonoContacto || '',
        serieFactura: data.serieFactura,
        seriePresupuesto: data.seriePresupuesto,
        tipoIvaPredeterminado: data.tipoIvaPredeterminado,
        ultimoNumeroFactura: configInicial?.ultimoNumeroFactura ?? 0,
        ultimoNumeroPresupuesto: configInicial?.ultimoNumeroPresupuesto ?? 0,
        horarios: data.horarios,
        logoUrl: data.logoUrl || '',
        logoText: data.logoText || 'Lipoout',
        hideLogoText: data.hideLogoText, // NUEVO
    };
    await onSubmit(finalData);
  };
  
  // Manejador para la selección del archivo de logo
  const handleLogoFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedLogoFile(event.target.files[0]);
    } else {
      setSelectedLogoFile(null);
    }
  };
  
  // Manejador para iniciar la subida del logo
  const handleLogoUpload = async () => {
      if (!selectedLogoFile) return;
      setIsUploadingLogo(true);
      try {
          await onLogoUpload(selectedLogoFile);
          setSelectedLogoFile(null); // Limpiar después de subir con éxito
      } catch (e) {
          console.error('Error al subir el logo:', e);
      } finally {
          setIsUploadingLogo(false);
      }
  };
  
  // Manejador para eliminar el logo (simplemente limpiando el campo y guardando)
  const handleLogoRemove = async () => {
    if (configInicial?.logoUrl) {
        // Clonamos la configuración actual y limpiamos logoUrl
        const dataToSave: LipooutUserInput<Configuracion> = {
            ...configInicial,
            logoUrl: '', // Limpiar la URL del logo
        };
        // Eliminamos logoUrl del formulario local antes de guardar
        form.setValue('logoUrl', '');
        
        // Llamamos al onSubmit del padre con el logoUrl limpiado
        await onSubmit(dataToSave);
    }
  };


  if (isLoading) {
      return <div className="flex justify-center py-8"><LoadingSpinner /></div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 max-w-2xl mx-auto">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <FormField control={form.control} name="nombreClinica" render={({ field }) => ( <FormItem> <FormLabel>Nombre Clínica *</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
             <FormField control={form.control} name="cif2" render={({ field }) => ( <FormItem> <FormLabel>CIF *</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
             <FormField control={form.control} name="direccion" render={({ field }) => ( <FormItem className="md:col-span-2"> <FormLabel>Dirección</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
             <FormField control={form.control} name="emailContacto" render={({ field }) => ( <FormItem> <FormLabel>Email Contacto</FormLabel> <FormControl><Input type="email" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
             <FormField control={form.control} name="telefonoContacto" render={({ field }) => ( <FormItem> <FormLabel>Teléfono Contacto</FormLabel> <FormControl><Input type="tel" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
             <FormField control={form.control} name="serieFactura" render={({ field }) => ( <FormItem> <FormLabel>Prefijo Facturas *</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
             <FormField control={form.control} name="seriePresupuesto" render={({ field }) => ( <FormItem> <FormLabel>Prefijo Presupuestos *</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
              <FormField control={form.control} name="tipoIvaPredeterminado" render={({ field }) => ( <FormItem> <FormLabel>IVA Predeterminado (%) *</FormLabel> <FormControl><Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)}/></FormControl> <FormMessage /> </FormItem> )}/>
            
            {/* Sección de Subida de Logo */}
            <div className="md:col-span-2 space-y-2 border-t pt-4">
                <Label>Logo de la Clínica (JPG, PNG, SVG)</Label> 
                {form.watch('logoUrl') ? (
                    <div className="flex items-center space-x-4">
                        <p className="text-sm text-muted-foreground truncate max-w-sm">
                            Logo actual (ID de archivo): {form.watch('logoUrl')}
                        </p>
                        <Button 
                            variant="destructive" 
                            size="sm" 
                            type="button" 
                            onClick={handleLogoRemove}
                            disabled={isSubmitting}
                        >
                            <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="flex gap-2">
                           <Input 
                                type="file" 
                                accept=".jpg,.jpeg,.png,.svg" 
                                onChange={handleLogoFileChange}
                                disabled={isUploadingLogo || isSubmitting}
                            />
                           <Button 
                                onClick={handleLogoUpload} 
                                disabled={!selectedLogoFile || isUploadingLogo || isSubmitting}
                                type="button"
                            >
                                {isUploadingLogo ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                Subir Logo
                            </Button>
                        </div>
                        {selectedLogoFile && <p className="text-sm text-muted-foreground">Archivo seleccionado: {selectedLogoFile.name}</p>}
                    </>
                )}
            </div>
            {/* FIN: Sección de Subida de Logo */}

            {/* Agrupamos el campo de texto y el checkbox en la misma fila */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:col-span-2">
                <FormField control={form.control} name="logoText" render={({ field }) => ( 
                    <FormItem> 
                        <FormLabel>Texto al lado del Logo</FormLabel> 
                        <FormControl><Input {...field} placeholder="Lipoout" /></FormControl> 
                        <FormMessage /> 
                    </FormItem> 
                )}/>
                
                <FormField control={form.control} name="hideLogoText" render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-2 space-y-0 p-3 self-end"> {/* self-end para alinear con el input de arriba */}
                        <FormControl>
                            <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                            />
                        </FormControl>
                        <FormLabel className="!mt-0 font-medium whitespace-nowrap">
                            Ocultar texto
                        </FormLabel>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>

         </div>

        {/* Sección de Horarios de Apertura */}
        <div className="border-t pt-6 mt-6">
          <h3 className="text-lg font-semibold mb-4">Horarios de Apertura</h3>
          <div className="space-y-3">
            {diasSemana.map((dia, index) => (
              <div key={dia.value} className="grid grid-cols-12 gap-3 items-center border-b pb-3">
                <div className="col-span-3 flex items-center space-x-2">
                  <FormField
                    control={form.control}
                    name={`horarios.${index}.abierto`}
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="!mt-0 font-medium cursor-pointer">
                          {dia.label}
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="col-span-4">
                  <FormField
                    control={form.control}
                    name={`horarios.${index}.horaInicio`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="time"
                            {...field}
                            disabled={!form.watch(`horarios.${index}.abierto`)}
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="col-span-1 text-center">-</div>
                <div className="col-span-4">
                  <FormField
                    control={form.control}
                    name={`horarios.${index}.horaFin`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="time"
                            {...field}
                            disabled={!form.watch(`horarios.${index}.abierto`)}
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSubmitting || isLoading || isUploadingLogo}>
            {isSubmitting ? 'Guardando...' : 'Guardar Configuración'}
          </Button>
        </div>
      </form>
    </Form>
  );
};
