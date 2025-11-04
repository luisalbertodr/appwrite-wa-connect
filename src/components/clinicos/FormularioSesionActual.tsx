import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useSesionesClinicas } from '@/hooks/useSesionesClinicas';
import { uploadDocumentoFirmado, uploadFotoSesion } from '@/services/appwrite-sesiones-clinicas';
import { updateCita } from '@/services/appwrite-agenda';
import { useGetClientes } from '@/hooks/useClientes';
import { useArticulos } from '@/hooks/useArticulos';
import { useBonos } from '@/hooks/useBonos';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '../LoadingSpinner';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, differenceInYears } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, Plus, X, Save, Minus, FileText, Image as ImageIcon, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SesionClinicaInput, ArticuloAplicado } from '@/types/sesion-clinica.types';
import type { Articulo, ArticuloEnCita, ItemCita } from '@/types/articulo.types';
import type { Cliente } from '@/types/cliente.types';

interface FormularioSesionActualProps {
  clienteId: string;
  citaId?: string;
  empleadoId: string;
  onSuccess: () => void;
}

export const FormularioSesionActual = ({ 
  clienteId, 
  citaId,
  empleadoId,
  onSuccess 
}: FormularioSesionActualProps) => {
  const { register, handleSubmit, formState: { errors } } = useForm<any>();
  const { createSesion, updateSesion, loading: savingSession } = useSesionesClinicas(clienteId);
  const { data: clientes } = useGetClientes();
  const { articulos } = useArticulos();
  const { bonosDisponibles, usarBono } = useBonos(clienteId);
  const { toast } = useToast();

  const [fechaSesion, setFechaSesion] = useState<Date>(new Date());
  const [proximaCita, setProximaCita] = useState<Date | undefined>();
  const [articulosSeleccionados, setArticulosSeleccionados] = useState<ArticuloAplicado[]>([]);
  const [articuloBusqueda, setArticuloBusqueda] = useState('');
  const [mostrarArticulos, setMostrarArticulos] = useState(false);
  const [documentosFiles, setDocumentosFiles] = useState<File[]>([]);
  const [fotosFiles, setFotosFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const cliente = clientes?.find((c: Cliente) => c.$id === clienteId);
  
  // Calcular edad automáticamente desde fecnac
  const edadCalculada = useMemo(() => {
    if (cliente?.fecnac) {
      try {
        const fechaNacimiento = new Date(cliente.fecnac);
        return differenceInYears(new Date(), fechaNacimiento);
      } catch {
        return cliente?.edad || 0;
      }
    }
    return cliente?.edad || 0;
  }, [cliente?.fecnac, cliente?.edad]);
  
  const articulosDisponibles = articulos?.filter((art: Articulo) =>
    art.nombre.toLowerCase().includes(articuloBusqueda.toLowerCase()) &&
    (art.tipo === 'servicio' || art.tipo === 'producto')
  ).slice(0, 5) || [];

  const agregarArticulo = (articulo: Articulo) => {
    // Verificar si hay bono disponible para este artículo
    const bonoDisponible = bonosDisponibles?.find((bd: any) => 
      bd.articulo_id === articulo.$id
    );

    const articuloAplicado: ArticuloAplicado = {
      articulo_id: articulo.$id,
      articulo_nombre: articulo.nombre,
      articulo_tipo: articulo.tipo as 'servicio' | 'producto',
      cantidad: 1,
      precio_unitario: articulo.precio || 0,
      precio_total: bonoDisponible ? 0 : (articulo.precio || 0),
      desde_bono: !!bonoDisponible,
      bono_cliente_id: bonoDisponible?.$id
    };

    setArticulosSeleccionados([...articulosSeleccionados, articuloAplicado]);
    setArticuloBusqueda('');
    setMostrarArticulos(false);
  };

  const eliminarArticulo = (index: number) => {
    setArticulosSeleccionados(articulosSeleccionados.filter((_, i) => i !== index));
  };

  const actualizarCantidad = (index: number, cantidad: number) => {
    if (cantidad < 1) return;
    const nuevosArticulos = [...articulosSeleccionados];
    nuevosArticulos[index].cantidad = cantidad;
    nuevosArticulos[index].precio_total = nuevosArticulos[index].desde_bono ? 0 : nuevosArticulos[index].precio_unitario * cantidad;
    setArticulosSeleccionados(nuevosArticulos);
  };

  const handleDocumentosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setDocumentosFiles(Array.from(e.target.files));
    }
  };

  const handleFotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFotosFiles(Array.from(e.target.files));
    }
  };

  const onSubmit = async (data: any) => {
    try {
      setUploading(true);

      // Crear sesión temporal para obtener ID
      const tempSesionData: SesionClinicaInput = {
        cliente_id: clienteId,
        cita_id: citaId,
        empleado_id: empleadoId,
        fecha_sesion: fechaSesion.toISOString(),
        edad_en_sesion: parseInt(data.edad) || cliente?.edad || 0,
        antecedentes_personales: data.antecedentes_personales || '',
        motivo_consulta: data.motivo_consulta || '',
        tratamiento: data.tratamiento || '',
        proxima_cita: proximaCita?.toISOString(),
        articulos_aplicados: JSON.stringify(articulosSeleccionados),
        documentos_ids: JSON.stringify([]),
        fotos_ids: JSON.stringify([]),
        notas_adicionales: data.notas_adicionales,
        visible_para_cliente: false
      };

      const sesionCreada = await createSesion(tempSesionData);

      // Subir documentos a Storage
      const documentosIds: string[] = [];
      for (const file of documentosFiles) {
        try {
          const uploadedDoc = await uploadDocumentoFirmado(file, sesionCreada.$id);
          documentosIds.push(uploadedDoc.$id);
        } catch (error) {
          console.error('Error al subir documento:', error);
        }
      }

      // Subir fotos a Storage
      const fotosIds: string[] = [];
      for (const file of fotosFiles) {
        try {
          const uploadedFoto = await uploadFotoSesion(file, sesionCreada.$id);
          fotosIds.push(uploadedFoto.$id);
        } catch (error) {
          console.error('Error al subir foto:', error);
        }
      }

      // Actualizar sesión con IDs de archivos si se subieron
      if (documentosIds.length > 0 || fotosIds.length > 0) {
        await updateSesion(sesionCreada.$id, {
          documentos_ids: JSON.stringify(documentosIds),
          fotos_ids: JSON.stringify(fotosIds)
        });
      }

      // Aplicar artículos a la cita si existe citaId
      if (citaId && articulosSeleccionados.length > 0) {
        try {
          // Convertir ArticuloAplicado[] a ItemCita[] para la cita
          const itemsCita: ItemCita[] = articulosSeleccionados.map(art => {
            const articuloCompleto = articulos?.find(a => a.$id === art.articulo_id);
            
            const item: ArticuloEnCita = {
              articulo_id: art.articulo_id,
              articulo_nombre: art.articulo_nombre,
              tipo: art.articulo_tipo === 'servicio' ? 'servicio' : 'producto',
              duracion: articuloCompleto?.duracion || 0,
              hora_inicio: fechaSesion.toISOString(),
              precio: art.precio_unitario,
              cantidad: art.cantidad
            };
            
            return item;
          });
          
          // Calcular precio total de los artículos
          const precioTotalArticulos = articulosSeleccionados.reduce(
            (sum, art) => sum + art.precio_total, 
            0
          );
          
          // Actualizar la cita con los artículos y precio total
          await updateCita(citaId, {
            articulos: JSON.stringify(itemsCita),
            precio_total: precioTotalArticulos
          });
          
          console.log(`Artículos aplicados a la cita ${citaId}:`, itemsCita);
        } catch (error) {
          console.error('Error al aplicar artículos a la cita:', error);
          toast({
            title: "Advertencia",
            description: "La sesión se guardó pero hubo un error al actualizar la cita",
            variant: "destructive",
          });
        }
      }

      // Consumir bonos si se usaron
      for (const articulo of articulosSeleccionados) {
        if (articulo.desde_bono && articulo.bono_cliente_id) {
          await usarBono(
            articulo.bono_cliente_id,
            articulo.articulo_id,
            articulo.cantidad
          );
        }
      }

      toast({
        title: "Sesión guardada",
        description: citaId && articulosSeleccionados.length > 0 
          ? "Sesión guardada y artículos aplicados a la cita para facturación"
          : "Los datos clínicos se han registrado correctamente",
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar la sesión",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  if (savingSession || uploading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Información del Paciente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nombre del Paciente</Label>
              <Input 
                {...register('nombre_paciente')}
                defaultValue={cliente?.nombre_completo || cliente?.nomcli || ''}
                placeholder="Nombre completo"
                disabled
              />
            </div>
            <div>
              <Label>Edad *</Label>
              <Input 
                type="number"
                {...register('edad', { required: true })}
                defaultValue={edadCalculada}
                placeholder="Edad"
              />
              {errors.edad && <span className="text-xs text-red-500">Campo requerido</span>}
            </div>
          </div>

          <div>
            <Label>Fecha de la Sesión</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !fechaSesion && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {fechaSesion ? format(fechaSesion, "PPP", { locale: es }) : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={fechaSesion}
                  onSelect={(date) => date && setFechaSesion(date)}
                  locale={es}
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Datos Clínicos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Antecedentes Personales (AP)</Label>
            <Textarea 
              {...register('antecedentes_personales')}
              placeholder="Antecedentes médicos relevantes..."
              rows={3}
            />
          </div>

          <div>
            <Label>Motivo de Consulta</Label>
            <Textarea 
              {...register('motivo_consulta')}
              placeholder="¿Por qué acude el paciente?..."
              rows={3}
            />
          </div>

          <div>
            <Label>Tratamiento *</Label>
            <Textarea 
              {...register('tratamiento', { required: true })}
              placeholder="Descripción del tratamiento realizado..."
              rows={4}
            />
            {errors.tratamiento && <span className="text-xs text-red-500">Campo requerido</span>}
          </div>

          <div>
            <Label>Próxima Cita (Notas)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !proximaCita && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {proximaCita ? format(proximaCita, "PPP", { locale: es }) : "Seleccionar fecha (opcional)"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={proximaCita}
                  onSelect={setProximaCita}
                  locale={es}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label>Notas Adicionales</Label>
            <Textarea 
              {...register('notas_adicionales')}
              placeholder="Notas adicionales sobre la sesión..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Servicios y Productos Aplicados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <div className="flex gap-2">
              <Input
                value={articuloBusqueda}
                onChange={(e) => {
                  setArticuloBusqueda(e.target.value);
                  setMostrarArticulos(e.target.value.length > 0);
                }}
                placeholder="Buscar servicio o producto..."
              />
              <Button 
                type="button"
                variant="outline"
                onClick={() => setMostrarArticulos(!mostrarArticulos)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {mostrarArticulos && articulosDisponibles.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                {articulosDisponibles.map((articulo: Articulo) => (
                  <button
                    key={articulo.$id}
                    type="button"
                    onClick={() => agregarArticulo(articulo)}
                    className="w-full text-left px-4 py-2 hover:bg-muted cursor-pointer flex items-center justify-between"
                  >
                    <span>{articulo.nombre}</span>
                    <Badge variant="outline">{articulo.tipo}</Badge>
                  </button>
                ))}
              </div>
            )}
          </div>

          {articulosSeleccionados.length > 0 && (
            <div className="space-y-2">
              {articulosSeleccionados.map((articulo, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-md">
                  <div className="flex-1">
                    <p className="font-medium">{articulo.articulo_nombre}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{articulo.articulo_tipo}</Badge>
                      {articulo.desde_bono && (
                        <Badge variant="secondary">Desde bono</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => actualizarCantidad(index, articulo.cantidad - 1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center">{articulo.cantidad}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => actualizarCantidad(index, articulo.cantidad + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <span className="  text-nowrap ml-2">
                      {articulo.precio_total.toFixed(2)}€
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => eliminarArticulo(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <div className="flex justify-end pt-2 border-t">
                <p className="text-lg font-bold">
                  Total: {articulosSeleccionados.reduce((sum, art) => sum + art.precio_total, 0).toFixed(2)}€
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Documentos y Fotos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documentos Firmados
            </Label>
            <div className="mt-2">
              <Input
                type="file"
                multiple
                accept=".pdf,.doc,.docx"
                onChange={handleDocumentosChange}
                className="cursor-pointer"
              />
            </div>
            {documentosFiles.length > 0 && (
              <div className="mt-2 space-y-1">
                {documentosFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span>{file.name}</span>
                    <Badge variant="outline">{(file.size / 1024).toFixed(1)} KB</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Fotos de la Sesión
            </Label>
            <div className="mt-2">
              <Input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFotosChange}
                className="cursor-pointer"
              />
            </div>
            {fotosFiles.length > 0 && (
              <div className="mt-2 grid grid-cols-3 gap-2">
                {fotosFiles.map((file, index) => (
                  <div key={index} className="relative aspect-square bg-muted rounded overflow-hidden">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1">
                      {(file.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2 sticky bottom-0 bg-background p-4 border-t">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancelar
        </Button>
        <Button type="submit" disabled={savingSession || uploading}>
          {uploading ? (
            <>
              <Upload className="mr-2 h-4 w-4 animate-spin" />
              Subiendo archivos...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Guardar Sesión
            </>
          )}
        </Button>
      </div>
    </form>
  );
};
