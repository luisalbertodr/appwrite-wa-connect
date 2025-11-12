import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CitaFormData, citaSchema } from '@/lib/validators';
import { Cita, CitaInput, Empleado, Articulo, ArticuloEnCita, TiempoNoBillable, Cliente } from '@/types';
import { Models } from 'appwrite';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Calendar } from "@/components/ui/calendar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DatosClinicosModal } from '@/components/clinicos/DatosClinicosModal';
import { useGetClientes } from '@/hooks/useClientes';
import { useGetArticulos } from '@/hooks/useArticulos';
import { useGetEmpleados } from '@/hooks/useEmpleados';
import { useDeleteCita } from '@/hooks/useAgenda';
import { updateCliente } from '@/services/appwrite-clientes';
import LoadingSpinner from '../LoadingSpinner';
import { format, parseISO, setHours, setMinutes, setSeconds, isValid, addMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, UserSearch, PackageSearch, X, GripVertical, Plus, Trash2, Receipt, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface CitaFormProps {
  citaInicial?: (Cita & Models.Document) | null;
  fechaInicial?: Date;
  empleadoInicial?: string;
  onSubmit: (data: CitaInput) => Promise<void>;
  isSubmitting: boolean;
  onClose?: () => void;
}


const defaultValues: CitaFormData = {
  fecha_hora: '',
  duracion: 60,
  cliente_id: '',
  empleado_id: '',
  articulos: '',
  estado: 'agendada',
  comentarios: '',
  datos_clinicos: '',
  precio_total: 0,
};

// Helper para parsear ISO a HH:mm
const getHoraDeISO = (isoString: string | undefined, fechaInicial?: Date) => {
  // Si no hay isoString pero hay fechaInicial, extraer hora de fechaInicial
  if (!isoString && fechaInicial) {
    return format(fechaInicial, 'HH:mm');
  }
  if (!isoString) return "09:00";
  try {
    return format(parseISO(isoString), 'HH:mm');
  } catch (e) { 
    return "09:00"; 
  }
};

// Helper para parsear ISO a Date (para el calendario)
const getDateDeISO = (isoString: string | undefined, fechaInicial?: Date) => {
  if (!isoString) return fechaInicial || new Date();
  try {
    const date = parseISO(isoString);
    return isValid(date) ? date : (fechaInicial || new Date());
  } catch (e) { 
    return fechaInicial || new Date(); 
  }
};

// Type guard para TiempoNoBillable
const esTiempoNoBillable = (item: ArticuloEnCita | TiempoNoBillable): item is TiempoNoBillable => {
  return 'tipo' in item && item.tipo === 'tiempo_no_billable';
};

export const CitaForm = ({ citaInicial, fechaInicial, empleadoInicial, onSubmit, isSubmitting, onClose }: CitaFormProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Hook para eliminar cita con invalidación automática de cache
  const { mutateAsync: eliminarCita } = useDeleteCita();

  // --- Estado local para componentes complejos (buscadores y fechas) ---
  const [searchCliente, setSearchCliente] = useState(''); // 🆕 Campo único de búsqueda
  const [articuloSearch, setArticuloSearch] = useState('');
  
  // Estado para debounce de búsqueda
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  
  const [clientePopoverOpen, setClientePopoverOpen] = useState(false); // 🆕 Popover único
  const [articuloPopoverOpen, setArticuloPopoverOpen] = useState(false);
  
  // Estado para fecha y hora
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    getDateDeISO(citaInicial?.fecha_hora, fechaInicial)
  );
  const [horaInicio, setHoraInicio] = useState(getHoraDeISO(citaInicial?.fecha_hora, fechaInicial));
  
  // Estado para artículos seleccionados con programación
  const [articulosProgramados, setArticulosProgramados] = useState<(ArticuloEnCita | TiempoNoBillable)[]>([]);

  // Estado para datos del cliente seleccionado (para edición)
  const [clienteSeleccionado, setClienteSeleccionado] = useState<(Cliente & Models.Document) | null>(null);
  const [datosClienteEditados, setDatosClienteEditados] = useState({
    nombre_completo: '',
    tel1cli: '',
    tel2cli: '',
    email: '',
    dnicli: ''
  });
  const [clienteModificado, setClienteModificado] = useState(false);

  // Estado para diálogos
  const [mostrarDialogoCliente, setMostrarDialogoCliente] = useState(false);
  const [mostrarDialogoEliminar, setMostrarDialogoEliminar] = useState(false);
  const [mostrarDialogoTiempo, setMostrarDialogoTiempo] = useState(false);
  const [nuevoTiempo, setNuevoTiempo] = useState({ nombre: '', duracion: 30 });
  const [mostrarDatosClinicos, setMostrarDatosClinicos] = useState(false);

  // Efecto para debounce de búsqueda (300ms de delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchCliente); // 🆕 Solo un campo
    }, 300); // 300ms de delay
    
    return () => clearTimeout(timer);
  }, [searchCliente]); // 🆕 Solo depende de searchCliente
  
  // 🆕 Efecto para cargar el nombre del cliente al editar cita
  useEffect(() => {
    if (citaInicial?.cliente_nombre) {
      setSearchCliente(citaInicial.cliente_nombre);
    }
  }, [citaInicial]);

  // --- Carga de datos para selectores ---
  const { data: clientes, isLoading: loadingClientes } = useGetClientes(debouncedSearchQuery);
  const { data: articulos, isLoading: loadingArticulos } = useGetArticulos();
  const { data: empleados, isLoading: loadingEmpleados } = useGetEmpleados(true);

  // --- Configuración del Formulario ---
  const getInitialFormValues = (): CitaFormData => {
    if (!citaInicial) {
      return {
        ...defaultValues,
        fecha_hora: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '',
        empleado_id: empleadoInicial || '',
      };
    }

    return {
      fecha_hora: citaInicial.fecha_hora || '',
      duracion: citaInicial.duracion || 60,
      cliente_id: citaInicial.cliente_id || '',
      empleado_id: citaInicial.empleado_id || '',
      articulos: citaInicial.articulos || '',
      estado: citaInicial.estado || 'agendada',
      comentarios: citaInicial.comentarios || '',
      datos_clinicos: citaInicial.datos_clinicos || '',
      precio_total: (citaInicial as any).precio_total || (citaInicial as any).precio || 0,
    };
  };

  const form = useForm<CitaFormData>({
    resolver: zodResolver(citaSchema),
    defaultValues: getInitialFormValues(),
  });

  // Parsear artículos programados al inicio
  useEffect(() => {
    if (citaInicial?.articulos) {
      try {
        const parsed = JSON.parse(citaInicial.articulos);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (typeof parsed[0] === 'object' && ('articulo_id' in parsed[0] || 'tipo' in parsed[0])) {
            setArticulosProgramados(parsed);
          } else {
            // Legacy: convertir string[] a ArticuloEnCita[]
            const articulosConvertidos: ArticuloEnCita[] = parsed.map((artId: string, index: number) => {
              const articulo = articulos?.find(a => a.$id === artId);
              const citaInicio = citaInicial.fecha_hora ? parseISO(citaInicial.fecha_hora) : new Date();
              const minutosOffset = index * 60;
              const horaInicioServicio = addMinutes(citaInicio, minutosOffset);
              
              return {
                articulo_id: artId,
                articulo_nombre: articulo?.nombre || 'Desconocido',
                tipo: articulo?.tipo || 'servicio',
                duracion: articulo?.duracion || 60,
                hora_inicio: horaInicioServicio.toISOString(),
                precio: articulo?.precio || 0,
                cantidad: 1,
              };
            });
            setArticulosProgramados(articulosConvertidos);
          }
        }
      } catch (e) {
        console.error('Error parsing articulos:', e);
        setArticulosProgramados([]);
      }
    }
  }, [citaInicial, articulos]);

  // Cargar datos del cliente cuando se selecciona
  useEffect(() => {
    const clienteId = form.watch('cliente_id');
    if (clienteId && clientes) {
      const cliente = clientes.find(c => c.$id === clienteId);
      if (cliente) {
        setClienteSeleccionado(cliente);
        setDatosClienteEditados({
          nombre_completo: cliente.nombre_completo || '',
          tel1cli: cliente.tel1cli || '',
          tel2cli: cliente.tel2cli || '',
          email: cliente.email || '',
          dnicli: cliente.dnicli || ''
        });
        setClienteModificado(false);
      }
    }
  }, [form.watch('cliente_id'), clientes]);

  // Detectar cambios en los datos del cliente
  useEffect(() => {
    if (clienteSeleccionado) {
      const hayChangios = 
        datosClienteEditados.nombre_completo !== (clienteSeleccionado.nombre_completo || '') ||
        datosClienteEditados.tel1cli !== (clienteSeleccionado.tel1cli || '') ||
        datosClienteEditados.tel2cli !== (clienteSeleccionado.tel2cli || '') ||
        datosClienteEditados.email !== (clienteSeleccionado.email || '') ||
        datosClienteEditados.dnicli !== (clienteSeleccionado.dnicli || '');
      setClienteModificado(hayChangios);
    }
  }, [datosClienteEditados, clienteSeleccionado]);

  // --- Calcular precio total y duración total automáticamente ---
  useEffect(() => {
    if (articulosProgramados.length === 0) {
      form.setValue('precio_total', 0);
      form.setValue('duracion', 60);
      return;
    }
    
    // Calcular precio total (solo artículos con precio, no tiempos no billables)
    const total = articulosProgramados.reduce((sum, item) => {
      if (esTiempoNoBillable(item)) return sum;
      
      // NUEVA LÓGICA: Si hay un bono_usado, el precio para esta cita es 0, ya está pagado por el bono.
      const precioFinal = item.bono_usado ? 0 : item.precio;

      return sum + (precioFinal * item.cantidad);
    }, 0);
    
    // Calcular duración total: desde el primer item hasta el final del último
    const itemsConDuracion = articulosProgramados.filter(item => {
      if (esTiempoNoBillable(item)) return true;
      return item.tipo === 'servicio';
    });
    
    if (itemsConDuracion.length > 0) {
      const duraciones = itemsConDuracion.map(item => {
        const inicio = parseISO(item.hora_inicio);
        return { inicio, fin: addMinutes(inicio, item.duracion) };
      });
      
      const inicioMin = new Date(Math.min(...duraciones.map(d => d.inicio.getTime())));
      const finMax = new Date(Math.max(...duraciones.map(d => d.fin.getTime())));
      const duracionTotal = Math.ceil((finMax.getTime() - inicioMin.getTime()) / (1000 * 60));
      form.setValue('duracion', Math.max(duracionTotal, 15));
    }
    
    form.setValue('precio_total', total);
  }, [articulosProgramados, form]);

  // --- Lógica de Búsqueda y Selección ---
  const clienteSeleccionadoId = form.watch('cliente_id');
  
  // Obtener cliente actual para mostrar en el botón
  const clienteActual = useMemo(() => {
    if (!clienteSeleccionadoId || !clientes) return null;
    return clientes.find(c => c.$id === clienteSeleccionadoId) || null;
  }, [clienteSeleccionadoId, clientes]);

  // Los clientes ya vienen filtrados del backend usando el índice fulltext
  const clientesFiltrados = clientes || [];

  // --- Agregar artículo programado ---
  const agregarArticulo = (articuloId: string) => {
    const articulo = articulos?.find(a => a.$id === articuloId);
    if (!articulo) return;

    // Determinar hora de inicio del nuevo tratamiento
    let horaInicioNuevo: Date;
    
    if (articulosProgramados.length === 0) {
      // Primer tratamiento: usar la hora de inicio de la cita
      if (!selectedDate) return;
      const [hora, minutos] = horaInicio.split(':').map(Number);
      horaInicioNuevo = setSeconds(setMinutes(setHours(selectedDate, hora), minutos), 0);
    } else {
      // Siguientes tratamientos: agregar después del último
      const ultimoItem = articulosProgramados[articulosProgramados.length - 1];
      const finUltimo = addMinutes(parseISO(ultimoItem.hora_inicio), ultimoItem.duracion);
      horaInicioNuevo = finUltimo;
    }

    const nuevoArticulo: ArticuloEnCita = {
      articulo_id: articulo.$id,
      articulo_nombre: articulo.nombre,
      tipo: articulo.tipo,
      duracion: articulo.duracion || 60,
      hora_inicio: horaInicioNuevo.toISOString(),
      precio: articulo.precio,
      cantidad: 1,
    };

    setArticulosProgramados(prev => [...prev, nuevoArticulo]);
    form.setValue('articulos', JSON.stringify([...articulosProgramados, nuevoArticulo]));
  };

  // --- Agregar tiempo no billable ---
  const agregarTiempoNoBillable = () => {
    console.log('[CitaForm] agregarTiempoNoBillable - Iniciando...');
    console.log('[CitaForm] selectedDate:', selectedDate);
    console.log('[CitaForm] horaInicio:', horaInicio);
    console.log('[CitaForm] nuevoTiempo:', nuevoTiempo);

    if (!nuevoTiempo.nombre.trim()) {
      toast({
        title: "Error",
        description: "Debes especificar un nombre para el tiempo",
        variant: "destructive"
      });
      return;
    }

    // Validar que hay una fecha seleccionada
    if (!selectedDate) {
      toast({
        title: "Error",
        description: "Debes seleccionar una fecha para la cita primero",
        variant: "destructive"
      });
      return;
    }

    // Validar formato de hora
    if (!horaInicio || !horaInicio.match(/^\d{2}:\d{2}$/)) {
      toast({
        title: "Error",
        description: "La hora de inicio no es válida",
        variant: "destructive"
      });
      return;
    }

    try {
      let horaInicioNuevo: Date;
      
      if (articulosProgramados.length === 0) {
        // Crear fecha manualmente con comprobación adicional
        const [hora, minutos] = horaInicio.split(':').map(Number);
        console.log('[CitaForm] Parseando hora:', { hora, minutos });
        
        if (isNaN(hora) || isNaN(minutos)) {
          throw new Error('Hora o minutos inválidos');
        }
        
        horaInicioNuevo = setSeconds(setMinutes(setHours(selectedDate, hora), minutos), 0);
        console.log('[CitaForm] Hora calculada (primer item):', horaInicioNuevo);
      } else {
        const ultimoItem = articulosProgramados[articulosProgramados.length - 1];
        const finUltimo = addMinutes(parseISO(ultimoItem.hora_inicio), ultimoItem.duracion);
        horaInicioNuevo = finUltimo;
        console.log('[CitaForm] Hora calculada (después del último):', horaInicioNuevo);
      }

      // Validar que la fecha generada es válida
      if (!isValid(horaInicioNuevo)) {
        throw new Error('Fecha/hora generada inválida');
      }

      const tiempoNuevo: TiempoNoBillable = {
        tipo: 'tiempo_no_billable',
        nombre: nuevoTiempo.nombre,
        duracion: nuevoTiempo.duracion,
        hora_inicio: horaInicioNuevo.toISOString()
      };

      console.log('[CitaForm] Tiempo creado:', tiempoNuevo);

      setArticulosProgramados(prev => [...prev, tiempoNuevo]);
      form.setValue('articulos', JSON.stringify([...articulosProgramados, tiempoNuevo]));
      
      setNuevoTiempo({ nombre: '', duracion: 30 });
      setMostrarDialogoTiempo(false);
      
      toast({
        title: "Tiempo agregado",
        description: `${nuevoTiempo.nombre} (${nuevoTiempo.duracion} min) añadido correctamente`
      });
      
      console.log('[CitaForm] agregarTiempoNoBillable - Completado exitosamente');
    } catch (error) {
      console.error('[CitaForm] Error al agregar tiempo personalizado:', error);
      console.error('[CitaForm] Stack trace:', error instanceof Error ? error.stack : 'N/A');
      toast({
        title: "Error al agregar tiempo",
        description: error instanceof Error ? error.message : "No se pudo agregar el tiempo personalizado. Por favor, verifica los datos e intenta nuevamente.",
        variant: "destructive"
      });
    }
  };

  // --- Eliminar artículo programado ---
  const eliminarArticulo = (index: number) => {
    const nuevosArticulos = articulosProgramados.filter((_, i) => i !== index);
    setArticulosProgramados(nuevosArticulos);
    form.setValue('articulos', JSON.stringify(nuevosArticulos));
  };

  // --- Reordenar artículos (drag and drop) con ajuste automático de horarios ---
  const reordenarArticulo = (fromIndex: number, toIndex: number) => {
    const nuevosArticulos = [...articulosProgramados];
    const [removed] = nuevosArticulos.splice(fromIndex, 1);
    nuevosArticulos.splice(toIndex, 0, removed);
    
    // Ajustar horarios automáticamente
    const articulosAjustados = ajustarHorarios(nuevosArticulos);
    setArticulosProgramados(articulosAjustados);
    form.setValue('articulos', JSON.stringify(articulosAjustados));
  };

  // --- Ajustar horarios de servicios secuencialmente ---
  const ajustarHorarios = (items: (ArticuloEnCita | TiempoNoBillable)[]): (ArticuloEnCita | TiempoNoBillable)[] => {
    if (items.length === 0) return items;
    
    // Usar la hora de inicio de la cita para el primer item
    if (!selectedDate) return items;
    const [hora, minutos] = horaInicio.split(':').map(Number);
    let horaActual = setSeconds(setMinutes(setHours(selectedDate, hora), minutos), 0);
    
    return items.map(item => {
      const itemActualizado = {
        ...item,
        hora_inicio: horaActual.toISOString()
      };
      
      // Avanzar la hora para el siguiente item
      horaActual = addMinutes(horaActual, item.duracion);
      
      return itemActualizado;
    });
  };

  // Estado para drag and drop
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // --- Agrupar artículos por tipo ---
  // Solo servicios y tiempos personalizados ocupan tiempo en la agenda
  const serviciosYTiempos = useMemo(() => {
    return articulosProgramados.filter(item => {
      if (esTiempoNoBillable(item)) return true;
      return item.tipo === 'servicio';
    });
  }, [articulosProgramados]);

  const productos = useMemo(() => {
    return articulosProgramados.filter(item => {
      if (esTiempoNoBillable(item)) return false;
      return item.tipo === 'producto' || item.tipo === 'bono';
    });
  }, [articulosProgramados]);

  // --- Actualizar hora de inicio de un tratamiento ---
  const actualizarHoraInicio = (index: number, nuevaHora: string) => {
    const nuevosArticulos = [...articulosProgramados];
    if (!selectedDate) return;
    
    const [hora, minutos] = nuevaHora.split(':').map(Number);
    const nuevaFechaHora = setSeconds(setMinutes(setHours(selectedDate, hora), minutos), 0);
    
    nuevosArticulos[index] = {
      ...nuevosArticulos[index],
      hora_inicio: nuevaFechaHora.toISOString(),
    };
    
    setArticulosProgramados(nuevosArticulos);
    form.setValue('articulos', JSON.stringify(nuevosArticulos));
  };

  // --- Actualizar duración de un tratamiento ---
  const actualizarDuracion = (index: number, nuevaDuracion: number) => {
    const nuevosArticulos = [...articulosProgramados];
    nuevosArticulos[index] = {
      ...nuevosArticulos[index],
      duracion: Math.max(15, nuevaDuracion),
    };
    
    setArticulosProgramados(nuevosArticulos);
    form.setValue('articulos', JSON.stringify(nuevosArticulos));
  };

  // --- Guardar cambios del cliente ---
  const guardarCambiosCliente = async () => {
    if (!clienteSeleccionado) return;
    
    try {
      await updateCliente({
        $id: clienteSeleccionado.$id,
        data: {
          nombre_completo: datosClienteEditados.nombre_completo || undefined,
          tel1cli: datosClienteEditados.tel1cli || undefined,
          tel2cli: datosClienteEditados.tel2cli || undefined,
          email: datosClienteEditados.email || undefined,
          dnicli: datosClienteEditados.dnicli || undefined
        }
      });
      
      toast({
        title: "Cliente actualizado",
        description: "Los datos del cliente se actualizaron correctamente"
      });
      
      setClienteModificado(false);
      setMostrarDialogoCliente(false);
    } catch (error) {
      console.error('Error al actualizar cliente:', error);
      toast({
        title: "Error",
        description: "No se pudieron actualizar los datos del cliente",
        variant: "destructive"
      });
    }
  };

  // --- Eliminar cita ---
  const eliminarCitaHandler = async () => {
    if (!citaInicial?.$id) return;
    
    try {
      await eliminarCita({ id: citaInicial.$id });
      
      toast({
        title: "Cita eliminada",
        description: "La cita se eliminó correctamente"
      });
      
      setMostrarDialogoEliminar(false);
      if (onClose) onClose();
    } catch (error) {
      console.error('Error al eliminar cita:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la cita",
        variant: "destructive"
      });
    }
  };

  // --- Facturar cita ---
  const facturarCita = () => {
    if (!citaInicial) return;
    
    // Navegar a TPV con los datos de la cita
    navigate('/tpv', {
      state: {
        clienteId: citaInicial.cliente_id,
        articulos: articulosProgramados,
        citaId: citaInicial.$id
      }
    });
  };

  // --- Envío del Formulario ---
  const handleSubmit = async (data: CitaFormData) => {
    console.log('[CitaForm] handleSubmit - Datos recibidos:', data);
    console.log('[CitaForm] handleSubmit - cliente_id:', data.cliente_id);
    console.log('[CitaForm] handleSubmit - Estado del formulario:', {
      isValid: form.formState.isValid,
      errors: form.formState.errors,
      dirtyFields: form.formState.dirtyFields
    });
    
    // Validar cliente
    if (!data.cliente_id) {
      console.error('[CitaForm] Error: No hay cliente seleccionado');
      form.setError("cliente_id", { message: "Debe seleccionar un cliente" });
      toast({
        title: "Error de validación",
        description: "Debe seleccionar un cliente para la cita",
        variant: "destructive"
      });
      return;
    }
    
    // Validar fecha
    if (!selectedDate) {
      console.error('[CitaForm] Error: No hay fecha seleccionada');
      form.setError("fecha_hora", { message: "Debe seleccionar una fecha" });
      toast({
        title: "Error de validación",
        description: "Debe seleccionar una fecha para la cita",
        variant: "destructive"
      });
      return;
    }
    
    // Validar empleado
    if (!data.empleado_id) {
      console.error('[CitaForm] Error: No hay empleado seleccionado');
      form.setError("empleado_id", { message: "Debe seleccionar un profesional" });
      toast({
        title: "Error de validación",
        description: "Debe seleccionar un profesional para la cita",
        variant: "destructive"
      });
      return;
    }
    
    // Validar que hay al menos un artículo con duración
    const itemsConDuracion = articulosProgramados.filter(item => {
      if (esTiempoNoBillable(item)) return true;
      return item.tipo === 'servicio';
    });
    
    if (itemsConDuracion.length === 0) {
      console.error('[CitaForm] Error: No hay servicios o tiempos agregados');
      form.setError("articulos", { message: "Debe seleccionar al menos un servicio o tiempo" });
      toast({
        title: "Error de validación",
        description: "Debe agregar al menos un servicio o tiempo a la cita",
        variant: "destructive"
      });
      return;
    }

    console.log('[CitaForm] Validaciones pasadas correctamente');

    // Si hay cambios en el cliente, preguntar si desea actualizarlos
    if (clienteModificado) {
      console.log('[CitaForm] Cliente modificado, mostrando diálogo');
      setMostrarDialogoCliente(true);
      return;
    }

    await enviarFormulario(data);
  };

  const enviarFormulario = async (data: CitaFormData) => {
    try {
      const [hora, minutos] = horaInicio.split(':').map(Number);
      const fechaHora = setSeconds(setMinutes(setHours(selectedDate!, hora), minutos), 0);

      // 🆕 Obtener el nombre del cliente
      const clienteSeleccionado = clientes?.find(c => c.$id === data.cliente_id);
      const cliente_nombre = clienteSeleccionado?.nombre_completo || searchCliente || 'Sin nombre';

      const finalData: Partial<CitaInput> = {
        fecha_hora: fechaHora.toISOString(),
        duracion: data.duracion,
        cliente_id: data.cliente_id,
        cliente_nombre, // 🆕 Incluir nombre del cliente
        empleado_id: data.empleado_id,
        articulos: JSON.stringify(articulosProgramados),
        estado: data.estado,
        precio_total: data.precio_total,
      };

      if (data.comentarios && data.comentarios.trim().length > 0) {
        finalData.comentarios = data.comentarios.trim();
      }
      if (data.datos_clinicos && data.datos_clinicos.trim().length > 0) {
        finalData.datos_clinicos = data.datos_clinicos.trim();
      }
      
      console.log('[CitaForm] Datos finales a enviar:', finalData);
      
      await onSubmit(finalData as CitaInput);

    } catch (e) {
      console.error("Error en el formulario", e);
      form.setError("fecha_hora", { message: "Error al procesar la fecha y hora" });
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <ScrollArea className="h-[65vh] p-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 py-2">

              {/* --- Cliente (Buscador Unificado) --- */}
              <div className="md:col-span-2 space-y-2">
                <div className="flex items-center justify-between">
                  <FormLabel>Buscar cliente *</FormLabel>
                  {citaInicial && form.watch('cliente_id') && (
                    <span className="text-xs text-muted-foreground italic">
                      Cliente no modificable en citas existentes
                    </span>
                  )}
                </div>
                <FormField
                  control={form.control}
                  name="cliente_id"
                  render={({ field }) => (
                    <FormItem>
                      {/* Campo oculto para mantener el valor */}
                      <FormControl>
                        <Input type="hidden" {...field} />
                      </FormControl>
                      
                      {/* Campo de búsqueda único */}
                      <Popover open={clientePopoverOpen} onOpenChange={setClientePopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button 
                            variant="outline" 
                            role="combobox" 
                            disabled={!!(citaInicial && field.value)}
                            className={cn(
                              "w-full justify-between font-normal text-left", 
                              !field.value && "text-muted-foreground",
                              citaInicial && field.value && "cursor-not-allowed opacity-60"
                            )}
                          >
                            <span className="truncate">
                              {clienteActual?.nombre_completo || searchCliente || 'Buscar por nombre, teléfono, email o DNI...'}
                            </span>
                            <UserSearch className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[40vh] p-0" align="start">
                          <Command shouldFilter={false}>
                            <CommandInput 
                              placeholder="Buscar cliente..."
                              value={searchCliente} 
                              onValueChange={setSearchCliente}
                            />
                            <CommandList>
                              {loadingClientes && <CommandItem disabled><LoadingSpinner/></CommandItem>}
                              <CommandEmpty>No encontrado.</CommandEmpty>
                              <CommandGroup>
                                {clientesFiltrados?.map((cliente) => (
                                  <CommandItem 
                                    key={cliente.$id} 
                                    value={cliente.nombre_completo || cliente.$id} 
                                    onSelect={() => {
                                      form.setValue('cliente_id', cliente.$id, { shouldValidate: true });
                                      setSearchCliente(cliente.nombre_completo || '');
                                      setClientePopoverOpen(false);
                                    }}
                                  >
                                    <div className="flex flex-col">
                                      <span className="font-medium">{cliente.nombre_completo}</span>
                                      <span className="text-xs text-muted-foreground">
                                        {[
                                          cliente.tel1cli && `Tel: ${cliente.tel1cli}`,
                                          cliente.tel2cli && `Móv: ${cliente.tel2cli}`,
                                          cliente.email,
                                          cliente.dnicli && `DNI: ${cliente.dnicli}`
                                        ].filter(Boolean).join(' | ')}
                                      </span>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* --- Datos del Cliente (Editables) --- */}
              {clienteSeleccionado && (
                <div className="md:col-span-2 border rounded-md p-3 bg-muted/50 space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <FormLabel className="text-sm font-semibold">Datos del Cliente</FormLabel>
                    {clienteModificado && (
                      <span className="text-xs text-orange-600">* Datos modificados</span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <FormLabel className="text-xs">Nombre Completo</FormLabel>
                      <Input
                        value={datosClienteEditados.nombre_completo}
                        onChange={(e) => setDatosClienteEditados(prev => ({ ...prev, nombre_completo: e.target.value }))}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <FormLabel className="text-xs">DNI</FormLabel>
                      <Input
                        value={datosClienteEditados.dnicli}
                        onChange={(e) => setDatosClienteEditados(prev => ({ ...prev, dnicli: e.target.value }))}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <FormLabel className="text-xs">Tfno. fijo</FormLabel>
                      <Input
                        value={datosClienteEditados.tel1cli}
                        onChange={(e) => setDatosClienteEditados(prev => ({ ...prev, tel1cli: e.target.value }))}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <FormLabel className="text-xs">Tfno. móvil</FormLabel>
                      <Input
                        value={datosClienteEditados.tel2cli}
                        onChange={(e) => setDatosClienteEditados(prev => ({ ...prev, tel2cli: e.target.value }))}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <FormLabel className="text-xs">Email</FormLabel>
                      <Input
                        type="email"
                        value={datosClienteEditados.email}
                        onChange={(e) => setDatosClienteEditados(prev => ({ ...prev, email: e.target.value }))}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* --- Fecha (Calendario) --- */}
              <FormItem className="flex flex-col">
                <FormLabel>Fecha *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "pl-3 text-left font-normal", 
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        {selectedDate ? (
                          format(selectedDate, "PPP", { locale: es })
                        ) : (
                          <span>Selecciona fecha</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                      locale={es}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>

              {/* --- Hora Inicio --- */}
              <FormItem>
                <FormLabel>Hora Inicio *</FormLabel>
                <FormControl>
                  <Input 
                    type="time" 
                    step="900"
                    value={horaInicio} 
                    onChange={e => setHoraInicio(e.target.value)} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>

              {/* --- Empleado (Selector) --- */}
              <FormField
                control={form.control}
                name="empleado_id"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Profesional *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={loadingEmpleados ? "Cargando..." : "Seleccionar..."} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {!loadingEmpleados && empleados?.map((emp: Empleado) => (
                          <SelectItem key={emp.$id} value={emp.$id}>
                            {emp.nombre_completo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* --- Buscador para Agregar Artículos --- */}
              <div className="md:col-span-2 space-y-2">
                <FormLabel>Agregar Tratamiento(s) *</FormLabel>
                <div className="flex gap-2">
                  <Popover open={articuloPopoverOpen} onOpenChange={setArticuloPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline" 
                        role="combobox" 
                        className="flex-1 justify-between font-normal"
                        type="button"
                      >
                        <span className="truncate">Buscar servicio/producto/bono...</span>
                        <PackageSearch className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[40vh] p-0" align="start">
                      <Command shouldFilter={false}>
                        <CommandInput 
                          placeholder="Buscar artículo..." 
                          value={articuloSearch} 
                          onValueChange={setArticuloSearch}
                        />
                        <CommandList>
                          {loadingArticulos && <CommandItem disabled><LoadingSpinner/></CommandItem>}
                          <CommandEmpty>No encontrado.</CommandEmpty>
                          <CommandGroup>
                            {(articuloSearch 
                              ? articulos?.filter(a => 
                                  a.nombre.toLowerCase().includes(articuloSearch.toLowerCase())
                                ) 
                              : articulos
                            )?.map((articulo: Articulo) => (
                              <CommandItem 
                                key={articulo.$id} 
                                value={articulo.nombre} 
                                onSelect={() => {
                                  agregarArticulo(articulo.$id);
                                  setArticuloPopoverOpen(false);
                                }}
                              >
                                <div className="flex items-center justify-between w-full">
                                  <span>
                                    {articulo.nombre} ({articulo.precio.toFixed(2)}€)
                                    {articulo.duracion && ` - ${articulo.duracion} min`}
                                  </span>
                                  <span className="text-xs text-muted-foreground ml-2">
                                    {articulo.tipo}
                                  </span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setMostrarDialogoTiempo(true)}
                    title="Agregar tiempo personalizado"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* --- GRUPO 1: Servicios, Bonos y Tiempos (con duración, drag & drop) --- */}
              {serviciosYTiempos.length > 0 && (
                <div className="md:col-span-2 space-y-2">
                  <FormLabel>Servicios y Tiempos</FormLabel>
                  <div className="space-y-2 border rounded-md p-3 bg-blue-50/50">
                    {serviciosYTiempos.map((item) => {
                      const originalIndex = articulosProgramados.findIndex(a => 
                        a.hora_inicio === item.hora_inicio && 
                        (esTiempoNoBillable(a) ? a.nombre === (item as TiempoNoBillable).nombre : (a as ArticuloEnCita).articulo_id === (item as ArticuloEnCita).articulo_id)
                      );
                      
                      const esTiempo = esTiempoNoBillable(item);
                      
                      return (
                        <div
                          key={`${item.hora_inicio}-${originalIndex}`}
                          draggable
                          onDragStart={() => setDraggedIndex(originalIndex)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => {
                            if (draggedIndex !== null && draggedIndex !== originalIndex) {
                              reordenarArticulo(draggedIndex, originalIndex);
                              setDraggedIndex(null);
                            }
                          }}
                          className={cn(
                            "border rounded-md p-3 bg-white cursor-move transition-all",
                            draggedIndex === originalIndex && "opacity-50 scale-95"
                          )}
                        >
                          <div className="flex items-start gap-2">
                            <GripVertical className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
                            
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <p className="font-medium">
                                    {esTiempo ? item.nombre : (item as ArticuloEnCita).articulo_nombre}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {esTiempo ? 'Tiempo personalizado' : (item as ArticuloEnCita).tipo}
                                    {!esTiempo && 
                                      (item as ArticuloEnCita).bono_usado ? 
                                      <span className="text-green-600 font-semibold ml-1">Gratis (Bono)</span> :
                                      ` - ${(item as ArticuloEnCita).precio.toFixed(2)}€`
                                    }
                                  </p>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => eliminarArticulo(originalIndex)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <FormLabel className="text-xs">Hora Inicio</FormLabel>
                                  <Input
                                    type="time"
                                    value={format(parseISO(item.hora_inicio), 'HH:mm')}
                                    onChange={(e) => actualizarHoraInicio(originalIndex, e.target.value)}
                                    className="h-8 text-sm"
                                  />
                                </div>
                                <div>
                                  <FormLabel className="text-xs">Duración (min)</FormLabel>
                                  <Input
                                    type="number"
                                    min="15"
                                    step="15"
                                    value={item.duracion}
                                    onChange={(e) => actualizarDuracion(originalIndex, parseInt(e.target.value) || 15)}
                                    className="h-8 text-sm"
                                  />
                                </div>
                              </div>
                              
                              <div className="text-xs text-muted-foreground">
                                Termina a las {format(addMinutes(parseISO(item.hora_inicio), item.duracion), 'HH:mm')}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* --- GRUPO 2: Productos y Bonos (sin duración, sin drag & drop) --- */}
              {productos.length > 0 && (
                <div className="md:col-span-2 space-y-2">
                  <FormLabel>Productos y Bonos (solo para facturación)</FormLabel>
                  <div className="space-y-2 border rounded-md p-3 bg-green-50/50">
                    {productos.map((item) => {
                      const originalIndex = articulosProgramados.findIndex(a => 
                        !esTiempoNoBillable(a) && 
                        (a as ArticuloEnCita).articulo_id === (item as ArticuloEnCita).articulo_id &&
                        a.hora_inicio === item.hora_inicio
                      );
                      
                      const producto = item as ArticuloEnCita;
                      
                      return (
                        <div
                          key={`producto-${originalIndex}`}
                          className="border rounded-md p-3 bg-white"
                        >
                          <div className="flex items-start gap-2">
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium">{producto.articulo_nombre}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {producto.tipo} - {producto.precio.toFixed(2)}€
                                  </p>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => eliminarArticulo(originalIndex)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* --- Duración Total (calculado automáticamente) --- */}
              <FormField
                control={form.control}
                name="duracion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duración Total (min)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        disabled 
                        className="bg-muted"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* --- Precio Total (calculado automáticamente) --- */}
              <FormField
                control={form.control}
                name="precio_total"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio Total (€)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        {...field} 
                        disabled 
                        className="bg-muted"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* --- Estado --- */}
              <FormField
                control={form.control}
                name="estado"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Estado</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="agendada">Agendada</SelectItem>
                        <SelectItem value="confirmada">Confirmada</SelectItem>
                        <SelectItem value="completada">Completada</SelectItem>
                        <SelectItem value="cancelada">Cancelada</SelectItem>
                        <SelectItem value="no_asistio">No asistió</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* --- Comentarios --- */}
              <FormField
                control={form.control}
                name="comentarios"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Comentarios</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        value={field.value || ''} 
                        placeholder="Comentarios generales sobre la cita..."
                        className="min-h-[60px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            </div>
          </ScrollArea>

          {/* --- Footer con Botones de Acción --- */}
          <div className="flex flex-wrap gap-2 justify-between pt-4 border-t">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setMostrarDatosClinicos(true)}
                disabled={!form.watch('cliente_id')}
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                Datos Clínicos
              </Button>
              {citaInicial && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={facturarCita}
                    className="gap-2"
                  >
                    <Receipt className="h-4 w-4" />
                    Facturar
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setMostrarDialogoEliminar(true)}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Eliminar Cita
                  </Button>
                </>
              )}
            </div>
            
            <div className="flex gap-2">
              {onClose && (
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
              )}
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <LoadingSpinner /> : citaInicial ? 'Actualizar Cita' : 'Crear Cita'}
              </Button>
            </div>
          </div>
        </form>
      </Form>

      {/* --- Diálogo: Guardar cambios del cliente --- */}
      <AlertDialog open={mostrarDialogoCliente} onOpenChange={setMostrarDialogoCliente}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Guardar cambios del cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Has modificado los datos del cliente. ¿Deseas guardar estos cambios antes de continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setMostrarDialogoCliente(false);
              enviarFormulario(form.getValues());
            }}>
              No, continuar sin guardar
            </AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              await guardarCambiosCliente();
              await enviarFormulario(form.getValues());
            }}>
              Sí, guardar cambios
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* --- Diálogo: Eliminar cita --- */}
      <AlertDialog open={mostrarDialogoEliminar} onOpenChange={setMostrarDialogoEliminar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cita?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La cita será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={eliminarCitaHandler}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* --- Diálogo: Agregar tiempo personalizado --- */}
      <Dialog open={mostrarDialogoTiempo} onOpenChange={setMostrarDialogoTiempo}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Tiempo Personalizado</DialogTitle>
            <DialogDescription>
              Agrega un tiempo sin cargo (consulta, pesar, etc.) a la cita.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Nombre
              </label>
              <Input
                placeholder="Ej: Consulta, Pesar, Medición..."
                value={nuevoTiempo.nombre}
                onChange={(e) => setNuevoTiempo(prev => ({ ...prev, nombre: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Duración (minutos)
              </label>
              <Input
                type="number"
                min="15"
                step="15"
                value={nuevoTiempo.duracion}
                onChange={(e) => setNuevoTiempo(prev => ({ ...prev, duracion: parseInt(e.target.value) || 30 }))}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setMostrarDialogoTiempo(false)}>
              Cancelar
            </Button>
            <Button onClick={agregarTiempoNoBillable}>
              Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- Modal: Datos Clínicos --- */}
      <DatosClinicosModal
        open={mostrarDatosClinicos}
        onOpenChange={setMostrarDatosClinicos}
        clienteId={form.watch('cliente_id')}
        citaId={citaInicial?.$id}
        empleadoId={form.watch('empleado_id')}
      />
    </>
  );
};