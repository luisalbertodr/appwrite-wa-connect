import { useState, useMemo, useEffect, useRef } from 'react';
import { Models } from 'appwrite';
import {
  useGetCitasPorDia,
  useGetCitasPorSemana,
  useCreateCita,
  useUpdateCita} from '@/hooks/useAgenda';
import { useGetEmpleados } from '@/hooks/useEmpleados';
import { useUser } from '@/hooks/useAuth';
import { useGetRecursos } from '@/hooks/useRecursos';
import { useGetConfiguration } from '@/hooks/useConfiguration';
import { Cita, CitaInput, LipooutUserInput } from '@/types';
import { Empleado } from '@/types/empleado.types';
import { Recurso } from '@/types/recurso.types';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card'; // CardHeader y CardTitle eliminados
import LoadingSpinner from '@/components/LoadingSpinner';

import { Calendar as BigCalendarBase, dateFnsLocalizer, View, EventProps, Views } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
// --- MODIFICACIÓN: addDays, isSameDay, differenceInHours añadido ---
import { format, parse, getDay, startOfWeek, startOfDay, parseISO, addMinutes, isValid, addDays, isSameDay, differenceInHours } from 'date-fns';
import { es } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';

import { cn } from '@/lib/utils';

const BigCalendar = withDragAndDrop<CalendarEvent>(BigCalendarBase);

import { Users, ChevronLeft, ChevronRight, CalendarDays, CalendarRange } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CitaForm } from '@/components/forms/CitaForm';
import { useToast } from '@/hooks/use-toast';

// Configuración Localizer
const locales = { 'es': es };
const localizer = dateFnsLocalizer({
  format: (date: Date, formatStr: string, culture?: string) => {
    // Forzar formato 24 horas para los time slots
    if (formatStr === 'LT' || formatStr === 'p') {
      return format(date, 'HH:mm', { locale: locales[culture as keyof typeof locales] });
    }
    return format(date, formatStr, { locale: locales[culture as keyof typeof locales] });
  },
  parse: (dateStr: string, formatStr: string, culture?: string) =>
    parse(dateStr, formatStr, new Date(), { locale: locales[culture as keyof typeof locales] }),
  startOfWeek: (date: Date) => 
    startOfWeek(date, { locale: es, weekStartsOn: 1 }),
  getDay: (date: Date) => getDay(date),
  locales,
});

interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
  resourceId: string;
  data: Cita & Models.Document;
  clienteInfo: string;
  tratamientos: string;
}

const Agenda = () => {
  // Estados y Hooks
  const { toast } = useToast();
  
  // --- MODIFICACIÓN: Hook para obtener usuario actual ---
  const { data: currentUser } = useUser();
  // --- FIN MODIFICACIÓN ---

  // --- MODIFICACIÓN: Estado con inicialización desde localStorage y verificación de inactividad ---
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    if (!currentUser?.$id) return startOfDay(new Date());
    
    try {
      const storageKeyDate = `agenda-position-date-${currentUser.$id}`;
      const storageKeyTimestamp = `agenda-last-activity-${currentUser.$id}`;
      
      const savedDate = localStorage.getItem(storageKeyDate);
      const lastActivity = localStorage.getItem(storageKeyTimestamp);
      
      // Verificar si ha pasado más de 24 horas desde la última actividad
      if (lastActivity) {
        const lastActivityDate = parseISO(lastActivity);
        const horasDiferencia = differenceInHours(new Date(), lastActivityDate);
        
        if (horasDiferencia >= 24) {
          console.log('[Agenda Component - useState selectedDate] Más de 24h de inactividad, reseteando a fecha actual');
          // Limpiar datos antiguos
          localStorage.removeItem(storageKeyDate);
          localStorage.removeItem(storageKeyTimestamp);
          return startOfDay(new Date());
        }
      }
      
      if (savedDate) {
        const parsedDate = parseISO(savedDate);
        if (isValid(parsedDate)) {
          console.log('[Agenda Component - useState selectedDate] Cargando fecha guardada:', parsedDate);
          return startOfDay(parsedDate);
        }
      }
    } catch (error) {
      console.error('[Agenda Component - useState selectedDate] Error al cargar fecha:', error);
    }
    
    return startOfDay(new Date());
  });

  const [view, setView] = useState<View>(() => {
    if (!currentUser?.$id) return Views.DAY;
    
    try {
      const storageKey = `agenda-position-view-${currentUser.$id}`;
      const savedView = localStorage.getItem(storageKey);
      
      if (savedView && (savedView === Views.DAY || savedView === Views.WEEK)) {
        console.log('[Agenda Component - useState view] Cargando vista guardada:', savedView);
        return savedView as View;
      }
    } catch (error) {
      console.error('[Agenda Component - useState view] Error al cargar vista:', error);
    }
    
    return Views.DAY;
  });
  // --- FIN MODIFICACIÓN ---

  // --- MODIFICACIÓN: Uso condicional del hook según la vista ---
  const { data: citasDelDia, isLoading: loadingCitasDia, error: errorCitasDia, isFetching: isFetchingDia } = useGetCitasPorDia(
      view === Views.DAY ? selectedDate : undefined
  );
  const { data: citasDeLaSemana, isLoading: loadingCitasSemana, error: errorCitasSemana, isFetching: isFetchingSemana } = useGetCitasPorSemana(
      view === Views.WEEK ? selectedDate : undefined
  );
  
  // Combinar estados de carga según la vista activa
  const citasActuales = view === Views.DAY ? citasDelDia : citasDeLaSemana;
  const loadingCitas = view === Views.DAY ? loadingCitasDia : loadingCitasSemana;
  const errorCitas = view === Views.DAY ? errorCitasDia : errorCitasSemana;
  const isFetching = view === Views.DAY ? isFetchingDia : isFetchingSemana;
  // --- FIN MODIFICACIÓN ---

  const { data: empleadosData, isLoading: loadingEmpleados, error: errorEmpleados } = useGetEmpleados(false);
  const { data: recursosData } = useGetRecursos(false); // Obtener todos los recursos
  const { data: configuracionData } = useGetConfiguration();

  const createCitaMutation = useCreateCita();
  const updateCitaMutation = useUpdateCita();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [citaToEdit, setCitaToEdit] = useState<(Cita & Models.Document) | null>(null);
  const [formInitialDate, setFormInitialDate] = useState<Date | undefined>(new Date());
  const [formInitialEmpleado, setFormInitialEmpleado] = useState<string | undefined>(undefined);
  const [selectedEmpleadosIds, setSelectedEmpleadosIds] = useState<string[]>([]);

  // --- INICIO: Scroll persistence con scrollToTime ---
  const calendarContainerRef = useRef<HTMLDivElement>(null);
  
  // Hora inicial para scrollToTime - calculada desde localStorage
  const initialScrollTime = useMemo(() => {
    if (!currentUser?.$id) {
      // Hora por defecto: 9:00 AM
      return new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 9, 0, 0);
    }
    
    try {
      const storageKeyTime = `agenda-scroll-time-${currentUser.$id}`;
      const storageKeyTimestamp = `agenda-last-activity-${currentUser.$id}`;
      
      const lastActivity = localStorage.getItem(storageKeyTimestamp);
      
      // Verificar si ha pasado más de 24 horas desde la última actividad
      if (lastActivity) {
        const lastActivityDate = parseISO(lastActivity);
        const horasDiferencia = differenceInHours(new Date(), lastActivityDate);
        
        if (horasDiferencia >= 24) {
          console.log('[Agenda Component - initialScrollTime] Más de 24h de inactividad, usando hora por defecto');
          localStorage.removeItem(storageKeyTime);
          return new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 9, 0, 0);
        }
      }
      
      const savedTime = localStorage.getItem(storageKeyTime);
      if (savedTime) {
        const savedHour = parseInt(savedTime, 10);
        if (!isNaN(savedHour) && savedHour >= 0 && savedHour < 24) {
          console.log('[Agenda Component - initialScrollTime] Cargando hora guardada:', savedHour);
          return new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), savedHour, 0, 0);
        }
      }
    } catch (error) {
      console.error('[Agenda Component - initialScrollTime] Error al cargar hora:', error);
    }
    
    // Hora por defecto: 9:00 AM
    return new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 9, 0, 0);
  }, [currentUser?.$id, selectedDate]);
  // --- FIN: Scroll persistence con scrollToTime ---

  const fechaSeleccionadaFormateada = selectedDate
      ? format(selectedDate, 'EEEE, dd MMMM yyyy', { locale: es })
      : 'Seleccione una fecha';
  
  // Capitalizar la fecha
  const fechaCapitalizada = fechaSeleccionadaFormateada.charAt(0).toUpperCase() + fechaSeleccionadaFormateada.slice(1);

  // Función para verificar si una hora está en horario cerrado
  const isHorarioCerrado = useMemo(() => {
    return (fecha: Date): boolean => {
      if (!configuracionData?.horarios || !Array.isArray(configuracionData.horarios)) {
        return false; // Si no hay horarios configurados, no restringir
      }

      const diasSemanaMap: Record<number, string> = {
        0: 'domingo',
        1: 'lunes',
        2: 'martes',
        3: 'miercoles',
        4: 'jueves',
        5: 'viernes',
        6: 'sabado'
      };
      
      const diaActual = diasSemanaMap[fecha.getDay()];
      const horarioHoy = configuracionData.horarios.find(h => h.dia === diaActual);
      
      // Si no hay horario para este día o está marcado como cerrado
      if (!horarioHoy || !horarioHoy.abierto) {
        return true;
      }

      // Extraer hora y minutos de la fecha
      const horaFecha = fecha.getHours();
      const minutosFecha = fecha.getMinutes();
      const tiempoFecha = horaFecha * 60 + minutosFecha; // Convertir a minutos totales

      // Parsear horario de inicio
      const [horaInicioStr, minInicioStr] = horarioHoy.horaInicio.split(':');
      const horaInicio = parseInt(horaInicioStr, 10);
      const minInicio = parseInt(minInicioStr, 10);
      const tiempoInicio = horaInicio * 60 + minInicio;

      // Parsear horario de fin
      const [horaFinStr, minFinStr] = horarioHoy.horaFin.split(':');
      const horaFin = parseInt(horaFinStr, 10);
      const minFin = parseInt(minFinStr, 10);
      const tiempoFin = horaFin * 60 + minFin;

      // Verificar si está fuera del rango
      return tiempoFecha < tiempoInicio || tiempoFecha >= tiempoFin;
    };
  }, [configuracionData]);

  // Calcular min/max times del calendario basado en horarios de configuración
  const calendarTimes = useMemo(() => {
    // Valores por defecto
    const defaultMin = 8;
    const defaultMinMinutes = 0;
    const defaultMax = 21;
    const defaultMaxMinutes = 0;
    
    if (!configuracionData?.horarios || !Array.isArray(configuracionData.horarios)) {
      return { min: defaultMin, minMinutes: defaultMinMinutes, max: defaultMax, maxMinutes: defaultMaxMinutes };
    }

    // Obtener el día de la semana actual
    const diasSemanaMap: Record<number, string> = {
      0: 'domingo',
      1: 'lunes',
      2: 'martes',
      3: 'miercoles',
      4: 'jueves',
      5: 'viernes',
      6: 'sabado'
    };
    
    const diaActual = diasSemanaMap[selectedDate.getDay()];
    const horarioHoy = configuracionData.horarios.find(h => h.dia === diaActual);
    
    if (!horarioHoy || !horarioHoy.abierto) {
      // Si no hay horario o está cerrado, usar valores por defecto
      return { min: defaultMin, minMinutes: defaultMinMinutes, max: defaultMax, maxMinutes: defaultMaxMinutes };
    }

    // Parsear horas Y MINUTOS de inicio y fin
    try {
      const [horaInicioStr, minInicioStr] = horarioHoy.horaInicio.split(':');
      const [horaFinStr, minFinStr] = horarioHoy.horaFin.split(':');
      
      const horaInicio = parseInt(horaInicioStr, 10);
      const minInicio = parseInt(minInicioStr || '0', 10);
      const horaFin = parseInt(horaFinStr, 10);
      const minFin = parseInt(minFinStr || '0', 10);
      
      if (!isNaN(horaInicio) && !isNaN(minInicio) && !isNaN(horaFin) && !isNaN(minFin) && 
          horaInicio >= 0 && horaInicio < 24 && horaFin > 0 && horaFin <= 24) {
        
        // Restar 1 hora al inicio, sumar 1 hora al fin (para mostrar hora antes y después)
        let minAdjusted = horaInicio - 1;
        let minMinutesAdjusted = minInicio;
        let maxAdjusted = horaFin + 1;
        let maxMinutesAdjusted = minFin;
        
        // Ajustar si sale del rango 0-23
        if (minAdjusted < 0) {
          minAdjusted = 0;
          minMinutesAdjusted = 0;
        }
        if (maxAdjusted > 23) {
          maxAdjusted = 23;
          maxMinutesAdjusted = 59;
        }
        
        console.log(`[Agenda Component - calendarTimes] Horario: ${horarioHoy.horaInicio}-${horarioHoy.horaFin}, Ajustado: ${minAdjusted}:${minMinutesAdjusted}-${maxAdjusted}:${maxMinutesAdjusted}`);
        
        return { 
          min: minAdjusted, 
          minMinutes: minMinutesAdjusted, 
          max: maxAdjusted, 
          maxMinutes: maxMinutesAdjusted 
        };
      }
    } catch (error) {
      console.error('[Agenda Component - useMemo calendarTimes] Error al parsear horarios:', error);
    }
    
    // Si hay algún error, usar valores por defecto
    return { min: defaultMin, minMinutes: defaultMinMinutes, max: defaultMax, maxMinutes: defaultMaxMinutes };
  }, [configuracionData, selectedDate]);

  // Efecto para guardar selectedDate en localStorage
  useEffect(() => {
    if (!currentUser?.$id) return;
    
    const storageKey = `agenda-position-date-${currentUser.$id}`;
    
    try {
      localStorage.setItem(storageKey, selectedDate.toISOString());
      console.log('[Agenda Component - useEffect save date] Fecha guardada en localStorage:', selectedDate);
    } catch (error) {
      console.error('[Agenda Component - useEffect save date] Error al guardar fecha:', error);
    }
  }, [currentUser?.$id, selectedDate]);

  // Efecto para guardar view en localStorage
  useEffect(() => {
    if (!currentUser?.$id) return;
    
    const storageKey = `agenda-position-view-${currentUser.$id}`;
    
    try {
      localStorage.setItem(storageKey, view);
      console.log('[Agenda Component - useEffect save view] Vista guardada en localStorage:', view);
    } catch (error) {
      console.error('[Agenda Component - useEffect save view] Error al guardar vista:', error);
    }
  }, [currentUser?.$id, view]);

  // Efecto para realizar scroll programático a la hora guardada
  useEffect(() => {
    if (!currentUser?.$id || !calendarContainerRef.current) return;
    
    const setupTimeoutId = setTimeout(() => {
      const container = calendarContainerRef.current;
      if (!container) {
        console.warn('[Scroll Programático] Container ref perdido durante setTimeout');
        return;
      }
      
      const scrollElement = container.querySelector('.rbc-time-content') as HTMLElement;
      
      if (!scrollElement) {
        console.warn('[Scroll Programático] Elemento .rbc-time-content no encontrado');
        return;
      }
      
      // Hacer scroll a la hora guardada
      try {
        const storageKeyTime = `agenda-scroll-time-${currentUser.$id}`;
        const savedTime = localStorage.getItem(storageKeyTime);
        
        if (savedTime) {
          const savedHour = parseInt(savedTime, 10);
          
          if (!isNaN(savedHour) && savedHour >= calendarTimes.min && savedHour < calendarTimes.max) {
            const totalHeight = scrollElement.scrollHeight;
            const minHour = calendarTimes.min;
            const maxHour = calendarTimes.max;
            const totalHours = maxHour - minHour;
            
            // Calcular posición de scroll basada en la hora guardada
            const hourRatio = (savedHour - minHour) / totalHours;
            const targetScroll = hourRatio * totalHeight;
            
            scrollElement.scrollTop = targetScroll;
            console.log(`[Scroll Programático] ✅ Scroll aplicado a hora ${savedHour}:00 (scroll: ${targetScroll.toFixed(0)}px)`);
          }
        }
      } catch (error) {
        console.error('[Scroll Programático] Error al aplicar scroll:', error);
      }
    }, 300); // Esperar 300ms para que el calendario se renderice completamente
    
    return () => {
      clearTimeout(setupTimeoutId);
    };
  }, [currentUser?.$id, view, selectedDate, calendarTimes.min, calendarTimes.max]);

  // Efecto para guardar la hora visible cuando el usuario sale de la página (beforeunload)
  useEffect(() => {
    if (!currentUser?.$id || !calendarContainerRef.current) return;
    
    const setupTimeoutId = setTimeout(() => {
      const container = calendarContainerRef.current;
      if (!container) return;
      
      const scrollElement = container.querySelector('.rbc-time-content');
      if (!scrollElement) return;
      
      console.log('[Scroll Persistence] ✅ Elemento encontrado, registrando listener de beforeunload');
      
      const handleBeforeUnload = () => {
        const storageKeyTime = `agenda-scroll-time-${currentUser.$id}`;
        const storageKeyTimestamp = `agenda-last-activity-${currentUser.$id}`;
        
        try {
          const scrollTop = scrollElement.scrollTop;
          const viewportHeight = scrollElement.clientHeight;
          const centerScroll = scrollTop + (viewportHeight / 2);
          
          const totalHeight = scrollElement.scrollHeight;
          const minHour = calendarTimes.min;
          const maxHour = calendarTimes.max;
          const totalHours = maxHour - minHour;
          
          const scrollRatio = centerScroll / totalHeight;
          const calculatedHour = minHour + (scrollRatio * totalHours);
          const hourToSave = Math.floor(Math.max(minHour, Math.min(maxHour - 1, calculatedHour)));
          
          localStorage.setItem(storageKeyTime, hourToSave.toString());
          localStorage.setItem(storageKeyTimestamp, new Date().toISOString());
          
          console.log(`[Scroll Persistence - beforeunload] 💾 Hora guardada: ${hourToSave}:00 (scroll: ${scrollTop.toFixed(0)}px)`);
        } catch (error) {
          console.error('[Scroll Persistence - beforeunload] Error al guardar hora:', error);
        }
      };
      
      window.addEventListener('beforeunload', handleBeforeUnload);
      
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        console.log('[Scroll Persistence] 🧹 Listener de beforeunload removido');
      };
    }, 100);
    
    return () => {
      clearTimeout(setupTimeoutId);
    };
  }, [currentUser?.$id, view, calendarTimes.min, calendarTimes.max]);

  // Log datos de citas según la vista
    useEffect(() => {
     console.log(`%c[Agenda Component] Datos de citas (Vista: ${view}):`, 'color: purple; font-weight: bold;', citasActuales);
     console.log(`%c[Agenda Component] Estado Carga Citas: isLoading=${loadingCitas}, isFetching=${isFetching}, hasError=${!!errorCitas}`, 'color: purple;');
     if (errorCitas) {
         console.error('[Agenda Component] Error en citas:', errorCitas);
     }
  }, [citasActuales, view, loadingCitas, isFetching, errorCitas]);

  // Lista completa empleados
  const allEmpleados = useMemo(() => {
    console.log('[Agenda Component - useMemo allEmpleados] Input empleadosData:', empleadosData);
    const result = empleadosData || []; // Fallback a array vacío
    console.log('[Agenda Component - useMemo allEmpleados] Output allEmpleados:', result);
    return result;
  }, [empleadosData]);

  // Mapa de recursos por ID con sus colores
  const recursosMap = useMemo(() => {
    if (!recursosData || !Array.isArray(recursosData)) {
      return new Map<string, Recurso & Models.Document>();
    }
    return new Map(recursosData.map((recurso: Recurso & Models.Document) => [recurso.$id, recurso]));
  }, [recursosData]);

  // Efecto para cargar selección de empleados desde localStorage
  useEffect(() => {
    if (!currentUser?.$id || !Array.isArray(allEmpleados) || allEmpleados.length === 0 || loadingEmpleados) {
      return;
    }

    const storageKey = `agenda-selected-empleados-${currentUser.$id}`;
    
    try {
      const savedSelection = localStorage.getItem(storageKey);
      
      if (savedSelection) {
        const parsedSelection = JSON.parse(savedSelection) as string[];
        
        // Validar que los IDs guardados existen en la lista actual de empleados
        const validIds = parsedSelection.filter(id => 
          allEmpleados.some((emp: Empleado) => emp.$id === id)
        );
        
        if (validIds.length > 0) {
          console.log('[Agenda Component - useEffect localStorage] Cargando selección guardada:', validIds);
          setSelectedEmpleadosIds(validIds);
          return;
        }
      }
      
      // Si no hay selección guardada o no es válida, usar empleados activos por defecto
      const activeEmpleadosIds = allEmpleados
        .filter((emp: Empleado) => emp.activo)
        .map((emp: Empleado) => emp.$id);
      
      console.log('[Agenda Component - useEffect localStorage] Usando empleados activos por defecto:', activeEmpleadosIds);
      setSelectedEmpleadosIds(activeEmpleadosIds);
      
    } catch (error) {
      console.error('[Agenda Component - useEffect localStorage] Error al cargar selección:', error);
      
      // En caso de error, usar empleados activos por defecto
      const activeEmpleadosIds = allEmpleados
        .filter((emp: Empleado) => emp.activo)
        .map((emp: Empleado) => emp.$id);
      
      setSelectedEmpleadosIds(activeEmpleadosIds);
    }
  }, [currentUser?.$id, allEmpleados, loadingEmpleados]);

  // Efecto para guardar selección de empleados en localStorage
  useEffect(() => {
    if (!currentUser?.$id || selectedEmpleadosIds.length === 0) {
      return;
    }

    const storageKey = `agenda-selected-empleados-${currentUser.$id}`;
    
    try {
      localStorage.setItem(storageKey, JSON.stringify(selectedEmpleadosIds));
      console.log('[Agenda Component - useEffect save] Selección guardada en localStorage:', selectedEmpleadosIds);
    } catch (error) {
      console.error('[Agenda Component - useEffect save] Error al guardar selección:', error);
    }
  }, [currentUser?.$id, selectedEmpleadosIds]);

  // Recursos (Empleados filtrados)
    const resources = useMemo(() => {
     if (!Array.isArray(allEmpleados)) return [];
     const filteredResources = allEmpleados
       .filter((emp: Empleado) => selectedEmpleadosIds.includes(emp.$id))
       .map((emp: Empleado) => ({
         resourceId: emp.$id,
         resourceTitle: emp.nombre_completo || `${emp.nombre} ${emp.apellidos}`,
       }));
       console.log('[Agenda Component - useMemo resources] Recursos calculados:', filteredResources);
       return filteredResources;
  }, [allEmpleados, selectedEmpleadosIds]);

  // useMemo para EVENTOS (Corregido con Array.isArray)
  const events: CalendarEvent[] = useMemo(() => {
    console.log('%c[Agenda Component - useMemo events] Iniciando cálculo de eventos...', 'color: darkcyan;');
    console.log('[Agenda Component - useMemo events] Input citasActuales:', citasActuales);

    if (!citasActuales) {
        console.warn('[Agenda Component - useMemo events] Devolviendo array vacío (faltan citas)');
        return [];
    }

    const transformedEvents = citasActuales.map((cita: Cita & Models.Document) => {
      // console.log(`%c[Agenda Component - useMemo events] Procesando cita[${index}] ID: ${cita.$id}`, 'color: gray;', cita);

      if (!cita.fecha_hora || typeof cita.fecha_hora !== 'string') { console.warn(`[Agenda Component - useMemo events] Saltando cita ${cita.$id}: fecha_hora inválida o ausente.`); return null;}
      if (!cita.empleado_id) { console.warn(`[Agenda Component - useMemo events] Saltando cita ${cita.$id}: empleado_id ausente.`); return null;}
      let duration = 60;
      if (typeof cita.duracion === 'number' && cita.duracion > 0) { duration = cita.duracion; }
      else { console.warn(`[Agenda Component - useMemo events] Cita ${cita.$id}: Duración inválida (${cita.duracion}), usando default 60min.`); }

      let start, end;
      try {
           start = parseISO(cita.fecha_hora);
           if (!isValid(start)) { throw new Error('Fecha de inicio inválida después de parsear'); }
           end = addMinutes(start, duration);
       } catch (e: unknown) {
         const errorMessage = e instanceof Error ? e.message : String(e);
         console.error(`[Agenda Component - useMemo events] Error procesando fechas para cita ${cita.$id}: Fecha='${cita.fecha_hora}', Error='${errorMessage}'`);
         return null;
       }

      // 🆕 Usar el nombre directamente de la cita (desnormalizado)
      const clienteInfo = `${cita.cliente_nombre || 'Cliente?'}`;

      let tratamientos = 'Sin tratamientos';
      try {
        if (cita.articulos && typeof cita.articulos === 'string') {
          const arts = JSON.parse(cita.articulos);
          if (Array.isArray(arts) && arts.length > 0) {
            tratamientos = arts.map((art: any) => {
              // Manejar TiempoNoBillable
              if (art.tipo === 'tiempo_no_billable') {
                return art.nombre || 'Tiempo';
              }
              // Manejar ArticuloEnCita
              return art.articulo_nombre || 'Tratamiento';
            }).join(', ');
          }
        }
      } catch (e) {
        console.error(`Error al parsear artículos de cita ${cita.$id}:`, e);
        tratamientos = 'Error en artículos';
      }

       const title = `${clienteInfo} - ${tratamientos}`;

       const eventData: CalendarEvent = {
         title: title, start: start, end: end, resourceId: cita.empleado_id, data: cita, clienteInfo: clienteInfo, tratamientos: tratamientos,
       };
       return eventData;

    }).filter((event): event is CalendarEvent => event !== null);

    console.log('%c[Agenda Component - useMemo events] Array final de eventos transformados:', 'color: darkcyan; font-weight: bold;', transformedEvents);
    return transformedEvents;

  }, [citasActuales]); // 🆕 Ya no depende de clientesData ni loadingClientes


  const isLoading = loadingCitas || loadingEmpleados;
  const hasError = errorCitas || errorEmpleados;

  // Manejadores
  // --- MODIFICACIÓN: handleOpenCreateDialog eliminado (se crea al hacer clic en slot) ---

  const handleSelectSlot = (slotInfo: { start: Date; end: Date; resourceId?: string | number }) => {
    console.log('[Agenda Component] handleSelectSlot llamado:', slotInfo);
    
    // Verificar si está en horario cerrado y mostrar aviso
    if (isHorarioCerrado(slotInfo.start)) {
      toast({
        title: '⚠️ Horario Cerrado',
        description: 'La clínica está cerrada en este horario, pero puedes crear la cita igualmente.',
        duration: 4000,
      });
    }
    
    setCitaToEdit(null);
    setFormInitialDate(slotInfo.start);
    setFormInitialEmpleado(slotInfo.resourceId ? String(slotInfo.resourceId) : undefined);
    setIsDialogOpen(true);
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    console.log('[Agenda Component] handleSelectEvent llamado:', event);
    handleOpenEditDialog(event.data);
  };

  const handleOpenEditDialog = (cita: Cita & Models.Document) => {
    setCitaToEdit(cita);
    setFormInitialDate(undefined);
    setFormInitialEmpleado(undefined); 
    setIsDialogOpen(true);
  };

  const handleNavigate = (newDate: Date) => {
    console.log('[Agenda Component] handleNavigate llamado con fecha:', newDate);
    setSelectedDate(startOfDay(newDate));
  };

  // --- INICIO MODIFICACIÓN: Nuevos manejadores para la barra ---
  const handleViewChange = (newView: View) => {
    if (newView) setView(newView); // Solo actualiza si hay un valor (evita deseleccionar)
  };
  // Bug #2: Navegación SIEMPRE semanal (±7 días), independiente de la vista
  const goToBack = () => handleNavigate(addDays(selectedDate, -7));
  const goToNext = () => handleNavigate(addDays(selectedDate, 7));
  // --- FIN MODIFICACIÓN ---

  const handleEmpleadoSelectToggle = (empleadoId: string) => {
    setSelectedEmpleadosIds(prevIds => {
      const isCurrentlySelected = prevIds.includes(empleadoId);
      if (isCurrentlySelected) {
        console.log(`[Agenda Component] Deseleccionando empleado: ${empleadoId}`);
        return prevIds.filter(id => id !== empleadoId);
      } else {
        console.log(`[Agenda Component] Seleccionando empleado: ${empleadoId}`);
        return [...prevIds, empleadoId];
      }
    });
  };


  const handleFormSubmit = async (data: LipooutUserInput<CitaInput>) => {
    try {
      if (citaToEdit) {
        await updateCitaMutation.mutateAsync({ id: citaToEdit.$id, data });
        toast({
          title: 'Cita actualizada',
          description: 'La cita ha sido actualizada correctamente.',
        });
      } else {
        await createCitaMutation.mutateAsync(data);
        toast({
          title: 'Cita creada',
          description: 'La cita ha sido creada correctamente.',
        });
      }
      setIsDialogOpen(false);
      setCitaToEdit(null);
    } catch (error) {
      console.error('[Agenda Component] Error al guardar cita:', error);
      toast({
        title: 'Error',
        description: citaToEdit ? 'No se pudo actualizar la cita.' : 'No se pudo crear la cita.',
        variant: 'destructive',
      });
    }
  };

  // Manejador para arrastrar y soltar eventos (mover citas)
  const handleEventDrop = async ({ event, start, end, resourceId }: any) => {
    console.log('[Agenda Component] handleEventDrop llamado:', { event, start, end, resourceId });
    
    try {
      const cita = event.data;
      const nuevaFechaHora = start.toISOString();
      const nuevaEmpleadaId = resourceId || cita.empleado_id;
      
      // Actualizar la cita con la nueva fecha/hora y empleada
      const dataToUpdate: LipooutUserInput<CitaInput> = {
        cliente_id: cita.cliente_id,
        cliente_nombre: cita.cliente_nombre || 'Sin nombre', // 🆕 Incluir nombre
        empleado_id: nuevaEmpleadaId,
        fecha_hora: nuevaFechaHora,
        duracion: cita.duracion,
        articulos: cita.articulos,
        comentarios: cita.comentarios,
        estado: cita.estado,
        datos_clinicos: cita.datos_clinicos,
        precio_total: cita.precio_total,
      };

      await updateCitaMutation.mutateAsync({ id: cita.$id, data: dataToUpdate });
      
      toast({
        title: 'Cita movida',
        description: 'La cita ha sido movida correctamente.',
      });
    } catch (error) {
      console.error('[Agenda Component] Error al mover cita:', error);
      toast({
        title: 'Error',
        description: 'No se pudo mover la cita.',
        variant: 'destructive',
      });
    }
  };

  // Manejador para redimensionar eventos (cambiar duración)
  const handleEventResize = async ({ event, start, end }: any) => {
    console.log('[Agenda Component] handleEventResize llamado:', { event, start, end });
    
    try {
      const cita = event.data;
      const nuevaDuracion = Math.round((end.getTime() - start.getTime()) / (1000 * 60)); // Duración en minutos
      
      // Actualizar la cita con la nueva duración
      const dataToUpdate: LipooutUserInput<CitaInput> = {
        cliente_id: cita.cliente_id,
        cliente_nombre: cita.cliente_nombre || 'Sin nombre', // 🆕 Incluir nombre
        empleado_id: cita.empleado_id,
        fecha_hora: start.toISOString(),
        duracion: nuevaDuracion,
        articulos: cita.articulos,
        comentarios: cita.comentarios,
        estado: cita.estado,
        datos_clinicos: cita.datos_clinicos,
        precio_total: cita.precio_total,
      };

      await updateCitaMutation.mutateAsync({ id: cita.$id, data: dataToUpdate });
      
      toast({
        title: 'Duración actualizada',
        description: 'La duración de la cita ha sido actualizada correctamente.',
      });
    } catch (error) {
      console.error('[Agenda Component] Error al redimensionar cita:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la duración de la cita.',
        variant: 'destructive',
      });
    }
  };

  // CustomHeader - Componente para mostrar los días en español
  const CustomHeader = ({ date }: { date: Date; label: React.ReactNode }) => {
    const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const diaNombre = diasSemana[date.getDay()];
    const diaNumero = format(date, 'd');
    
    return (
      <div className="flex flex-col items-center py-1">
        <span className="text-xs font-semibold">{diaNombre}</span>
        <span className="text-lg font-bold">{diaNumero}</span>
      </div>
    );
  };

  // CustomEvent - Componente mejorado para mostrar información gráfica de la cita
  const CustomEvent = ({ event }: EventProps<CalendarEvent>) => {
      const cita = event.data;
      const duracionMinutos = cita.duracion || 60;
      const duracionTexto = duracionMinutos >= 60 
        ? `${Math.floor(duracionMinutos / 60)}h ${duracionMinutos % 60 > 0 ? duracionMinutos % 60 + 'm' : ''}`.trim()
        : `${duracionMinutos}m`;

      // Parsear artículos y separar por tipo
      let tratamientos: any[] = []; // servicios, bonos, tiempos no billables
      let productos: any[] = [];     // productos
      
      try {
        if (cita.articulos && typeof cita.articulos === 'string') {
          const articulosDetalle = JSON.parse(cita.articulos);
          
          articulosDetalle.forEach((art: any) => {
            if (art.tipo === 'producto') {
              productos.push(art);
            } else {
              tratamientos.push(art);
            }
          });
        }
      } catch (e) {
        console.error('Error al parsear artículos en CustomEvent:', e);
      }

      // Obtener recursos únicos de los TRATAMIENTOS (cabinas y equipos) con sus colores
      // Los productos NO tienen recursos asociados
      let recursosData: { cabinas: Array<{id: string, nombre: string, color?: string}>, equipos: Array<{id: string, nombre: string, color?: string}> } = { cabinas: [], equipos: [] };
      const cabinaIds = new Set<string>();
      const equipoIds = new Set<string>();
      
      tratamientos.forEach((art: any) => {
        if (art.sala_id && art.sala_id !== 'ninguna') {
          cabinaIds.add(art.sala_id);
        }
        if (art.equipamiento_ids && Array.isArray(art.equipamiento_ids)) {
          art.equipamiento_ids.forEach((id: string) => equipoIds.add(id));
        }
      });
      
      // Convertir IDs a objetos con nombre y color
      recursosData.cabinas = Array.from(cabinaIds).map(id => {
        const recurso = recursosMap.get(id);
        return {
          id,
          nombre: recurso?.nombre || id,
          color: recurso?.color
        };
      });
      
      recursosData.equipos = Array.from(equipoIds).map(id => {
        const recurso = recursosMap.get(id);
        return {
          id,
          nombre: recurso?.nombre || id,
          color: recurso?.color
        };
      });

      // Obtener color personalizado del empleado
      const empleado = allEmpleados.find((emp: Empleado) => emp.$id === cita.empleado_id);
      const colorEmpleado = empleado?.color || '#3b82f6'; // Azul por defecto
      
      // Función para generar tonos claros del color del empleado
      const generarColorFondo = (hexColor: string, opacity: number = 0.15): string => {
        // Convertir hex a RGB
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
      };

      return (
          <div 
            className="rbc-event-content h-full flex flex-col p-1 text-xs border-l-4 rounded-sm" 
            style={{
              '--event-bg-color': generarColorFondo(colorEmpleado, 0.15),
              '--event-border-color': colorEmpleado,
              backgroundColor: 'var(--event-bg-color)',
              borderLeftColor: 'var(--event-border-color)',
              borderLeftWidth: '4px',
            } as React.CSSProperties}
            title={event.title}
          >
              {/* Cabecera: Hora y Duración */}
              <div className="flex justify-between items-start mb-0.5">
                  <strong className="text-xs font-bold">{format(event.start, 'HH:mm')}</strong>
                  <span className="text-[10px] opacity-70 font-medium">{duracionTexto}</span>
              </div>

              {/* Cliente */}
              <div className="font-semibold truncate text-xs leading-tight mb-0.5">
                  {event.clienteInfo}
              </div>

              {/* Tratamientos (servicios, bonos, tiempos) */}
              {tratamientos.length > 0 && (
                <div className="space-y-0.5 mb-1">
                  {tratamientos.slice(0, 3).map((art: any, idx: number) => {
                    const nombre = art.tipo === 'tiempo_no_billable' 
                      ? (art.nombre || 'Tiempo') 
                      : (art.articulo_nombre || 'Tratamiento');
                    const duracion = art.duracion || 0;
                    
                    return (
                      <div key={idx} className="flex items-center gap-1 text-[10px]">
                        <div className="w-1 h-1 rounded-full bg-current opacity-60" />
                        <span className="truncate flex-1">{nombre}</span>
                        <span className="opacity-60">{duracion}m</span>
                      </div>
                    );
                  })}
                  {tratamientos.length > 3 && (
                    <div className="text-[10px] opacity-60 text-center">
                      +{tratamientos.length - 3} más
                    </div>
                  )}
                </div>
              )}

              {/* Productos (separados, sin duración) */}
              {productos.length > 0 && (
                <div className="space-y-0.5 mb-1 border-t border-current/10 pt-1">
                  <div className="text-[10px] font-semibold opacity-70">Productos:</div>
                  {productos.slice(0, 2).map((prod: any, idx: number) => {
                    const nombre = prod.articulo_nombre || 'Producto';
                    const cantidad = prod.cantidad || 1;
                    
                    return (
                      <div key={idx} className="flex items-center gap-1 text-[10px]">
                        <div className="w-1 h-1 rounded-full bg-current opacity-40" />
                        <span className="truncate flex-1">{nombre}</span>
                        {cantidad > 1 && <span className="opacity-60">x{cantidad}</span>}
                      </div>
                    );
                  })}
                  {productos.length > 2 && (
                    <div className="text-[10px] opacity-60 text-center">
                      +{productos.length - 2} más
                    </div>
                  )}
                </div>
              )}

              {/* Recursos (Cabinas y Equipos) con colores personalizados */}
              {(recursosData.cabinas.length > 0 || recursosData.equipos.length > 0) && (
                <div className="mt-auto pt-1 border-t border-current/10">
                  {recursosData.cabinas.length > 0 && (
                    <div className="flex items-center gap-1 text-[10px] opacity-70 mb-0.5 flex-wrap">
                      <svg className="w-2.5 h-2.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      {recursosData.cabinas.map((cabina, idx) => (
                        <span 
                          key={cabina.id} 
                          className="inline-flex items-center gap-0.5"
                        >
                          {cabina.color && (
                            <span 
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0" 
                              style={{ backgroundColor: cabina.color }}
                            />
                          )}
                          <span className="truncate">{cabina.nombre}</span>
                          {idx < recursosData.cabinas.length - 1 && <span>,</span>}
                        </span>
                      ))}
                    </div>
                  )}
                  {recursosData.equipos.length > 0 && (
                    <div className="flex items-center gap-1 text-[10px] opacity-70 flex-wrap">
                      <svg className="w-2.5 h-2.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                      </svg>
                      {recursosData.equipos.map((equipo, idx) => (
                        <span 
                          key={equipo.id} 
                          className="inline-flex items-center gap-0.5"
                        >
                          {equipo.color && (
                            <span 
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0" 
                              style={{ backgroundColor: equipo.color }}
                            />
                          )}
                          <span className="truncate">{equipo.nombre}</span>
                          {idx < recursosData.equipos.length - 1 && <span>,</span>}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
          </div>
      );
  };

  // Renderizado principal (JSX)
  return (
    <div className="space-y-4"> {/* Reducido el espacio */}
        
        {/* Barra de Herramientas Optimizada - Una línea en desktop */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Grupo Izquierdo: Título + Empleados + Fecha */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 lg:flex-1">
            <h1 className="text-2xl font-bold hidden lg:block">Agenda</h1>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  <Users className="w-4 h-4 mr-2" />
                  Empleados ({selectedEmpleadosIds.length}/{allEmpleados?.length ?? 0})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                 <DropdownMenuLabel>Mostrar Empleados</DropdownMenuLabel>
                 <DropdownMenuSeparator />
                 {loadingEmpleados ? (
                   <DropdownMenuItem disabled>Cargando...</DropdownMenuItem>
                 ) : Array.isArray(allEmpleados) && allEmpleados.length > 0 ? (
                   allEmpleados.map((emp: Empleado & Models.Document) => (
                     <DropdownMenuCheckboxItem
                       key={emp.$id}
                       checked={selectedEmpleadosIds.includes(emp.$id)}
                       onCheckedChange={() => handleEmpleadoSelectToggle(emp.$id)}
                     >
                       {emp.nombre_completo || `${emp.nombre} ${emp.apellidos}`}
                       {!emp.activo && " (Inactivo)"}
                     </DropdownMenuCheckboxItem>
                   ))
                 ) : (
                   <DropdownMenuItem disabled>No hay empleados</DropdownMenuItem>
                 )}
                 <DropdownMenuSeparator />
                 <DropdownMenuItem
                   onSelect={() => {
                       const activeIds = Array.isArray(allEmpleados)
                           ? allEmpleados.filter(e => e.activo).map(e => e.$id)
                           : [];
                       console.log("[Agenda Component] Seleccionando todos los activos:", activeIds);
                       setSelectedEmpleadosIds(activeIds);
                   }}
                   className="cursor-pointer"
                   disabled={!Array.isArray(allEmpleados) || allEmpleados.filter(e => e.activo).length === 0}
                 >
                   Seleccionar todos (activos)
                 </DropdownMenuItem>
                 <DropdownMenuItem
                   onSelect={() => {
                       console.log("[Agenda Component] Deseleccionando todos");
                       setSelectedEmpleadosIds([]);
                   }}
                   className="cursor-pointer text-destructive"
                   disabled={selectedEmpleadosIds.length === 0}
                 >
                   No seleccionar ninguno
                 </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <h2 className="text-base lg:text-lg font-semibold text-center sm:text-left">
              {fechaCapitalizada}
            </h2>
          </div>
          
          {/* Grupo Derecho: Controles de Navegación y Vista */}
          <div className="flex items-center justify-center lg:justify-end gap-1 sm:gap-2 flex-wrap">
            {/* Botón Anterior */}
            <Button
              variant="outline"
              onClick={goToBack}
              className="h-10 w-9 p-0 flex-shrink-0"
              aria-label="Anterior"
              title="Semana anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            {/* Botones de días de la semana (L-D) */}
            {(() => {
              const inicioSemana = startOfWeek(selectedDate, { weekStartsOn: 1 });
              const hoy = startOfDay(new Date());
              const diasSemana = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
              
              return diasSemana.map((letra, index) => {
                const dia = addDays(inicioSemana, index);
                const esHoy = isSameDay(dia, hoy);
                const esDiaSeleccionado = isSameDay(dia, selectedDate);
                const numeroDia = format(dia, 'd');
                
                return (
                  <Button
                    key={index}
                    variant={esDiaSeleccionado ? "default" : "outline"}
                    onClick={() => handleNavigate(dia)}
                    className={cn(
                      "flex flex-col items-center justify-center h-10 w-9 p-0.5",
                      esHoy && !esDiaSeleccionado && "border-primary border-2",
                      esHoy && esDiaSeleccionado && "ring-2 ring-primary ring-offset-1"
                    )}
                    aria-label={`${letra} ${numeroDia}`}
                  >
                    <span className="text-[9px] font-medium leading-none">{letra}</span>
                    <span className="text-xs font-bold leading-none mt-0.5">{numeroDia}</span>
                  </Button>
                );
              });
            })()}
            
            {/* Botón Siguiente */}
            <Button
              variant="outline"
              onClick={goToNext}
              className="h-10 w-9 p-0 flex-shrink-0"
              aria-label="Siguiente"
              title="Semana siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            
            <div className="border-l h-8 mx-1" />

            {/* Toggle de Vista simplificado */}
            <Button
              variant="outline"
              onClick={() => handleViewChange(view === Views.DAY ? Views.WEEK : Views.DAY)}
              className="h-10 px-3 flex items-center gap-2"
              title={view === Views.DAY ? "Cambiar a vista semanal" : "Cambiar a vista diaria"}
            >
              {view === Views.DAY ? (
                <>
                  <CalendarRange className="h-4 w-4" />
                  <span className="text-sm hidden sm:inline">Día</span>
                </>
              ) : (
                <>
                  <CalendarDays className="h-4 w-4" />
                  <span className="text-sm hidden sm:inline">Semana</span>
                </>
              )}
            </Button>
          </div>
        </div>


      {/* Card Contenedor Calendario */}
      <Card>
        {/* --- MODIFICACIÓN: CardHeader eliminado --- */}
        <CardContent className="p-0 sm:p-2 md:p-4"> {/* Padding ajustado */}
          
          {/* Estados de Carga y Error */}
          {isLoading && !isFetching && (
              <div className="flex justify-center py-20"><LoadingSpinner /></div>
          )}
          {hasError && (
              <p className="text-center text-destructive py-20">
                Error al cargar datos.
                {errorCitas && <span> (Citas: {errorCitas instanceof Error ? errorCitas.message : String(errorCitas)})</span>}
                {errorEmpleados && <span> (Empleados: {errorEmpleados instanceof Error ? errorEmpleados.message : String(errorEmpleados)})</span>}
                
              </p>
          )}

          {/* Contenido Principal: Mensaje o Calendario */}
          {!isLoading && !hasError && (
            <>
              {/* Mensaje si no hay empleados o no seleccionados */}
              {resources.length === 0 && !loadingEmpleados ? (
                  <p className="text-center text-muted-foreground py-20">
                    {(!Array.isArray(allEmpleados) || allEmpleados.length === 0)
                      ? "No hay empleados definidos en el sistema."
                      : "No se han seleccionado empleados para mostrar."
                    }
                    <br />
                    {Array.isArray(allEmpleados) && allEmpleados.length > 0 && "Utilice el filtro de \"Empleados\" para seleccionar al menos uno."}
                  </p>
              ) : (
                // Mostrar calendario si hay recursos o si empleados aún carga
                (resources.length > 0 || loadingEmpleados) &&
                <div ref={calendarContainerRef} style={{ height: 'calc(100vh - 180px)', minHeight: '600px' }}> {/* Altura ajustada */}
                  <BigCalendar
                    localizer={localizer}
                    culture='es'
                    events={events} 
                    resources={resources}
                    view={view} // --- MODIFICACIÓN: Controlado por estado
                    onView={(v) => handleViewChange(v as View)} // --- MODIFICACIÓN: Controlado por estado
                    toolbar={false} // --- MODIFICACIÓN: Barra original oculta
                    views={[Views.DAY, Views.WEEK]}
                    date={selectedDate} 
                    onNavigate={handleNavigate} 
                    onSelectEvent={handleSelectEvent}
                    onSelectSlot={handleSelectSlot}
                    selectable={true}
                    step={15}
                    timeslots={4}
                    min={new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), calendarTimes.min, calendarTimes.minMinutes, 0)}
                    max={new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), calendarTimes.max, calendarTimes.maxMinutes, 0)}
                    scrollToTime={initialScrollTime}
                    
                    // --- CORRECCIÓN EXPLÍCITA ---
                    // Define cómo acceder al ID del array 'resources'
                    resourceIdAccessor={(resource: any) => resource.resourceId}
                    // Define cómo acceder al Título del array 'resources'
                    resourceTitleAccessor={(resource: any) => resource.resourceTitle}
                    // Define cómo acceder al ID de recurso desde un 'event'
                    resourceAccessor="resourceId"
                    
                    // --- DRAG AND DROP HANDLERS ---
                    onEventDrop={handleEventDrop}
                    onEventResize={handleEventResize}
                    resizable={true}
                    
                    // --- ESTILOS PARA HORARIOS CERRADOS ---
                    slotPropGetter={(date: Date) => {
                      if (isHorarioCerrado(date)) {
                        return {
                          className: 'horario-cerrado',
                          style: {
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            borderColor: 'rgba(239, 68, 68, 0.2)',
                            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(239, 68, 68, 0.05) 10px, rgba(239, 68, 68, 0.05) 20px)',
                          }
                        };
                      }
                      return {};
                    }}
                    
                    messages={{
                      next: "Siguiente", previous: "Anterior", today: "Hoy", month: "Mes", week: "Semana", day: "Día", agenda: "Agenda",
                      date: "Fecha", time: "Hora", event: "Evento", noEventsInRange: "No hay citas programadas para este día.",
                      showMore: total => `+${total} más`
                    }}
                    components={{
                        event: CustomEvent,
                        header: CustomHeader,
                        resourceHeader: ({ label }: { label: React.ReactNode }) => (
                          <div className="py-1.5 px-2 text-center font-semibold text-sm border-b bg-muted/50">
                            {label}
                          </div>
                        ),
                    }}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog para Crear/Editar Cita */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
                <DialogTitle>{citaToEdit ? 'Editar Cita' : 'Crear Nueva Cita'}</DialogTitle>
            </DialogHeader>
            <CitaForm
              citaInicial={citaToEdit}
              fechaInicial={formInitialDate}
              empleadoInicial={formInitialEmpleado} 
              onSubmit={handleFormSubmit}
              isSubmitting={createCitaMutation.isPending || updateCitaMutation.isPending}
            />
          </DialogContent>
      </Dialog>
    </div>
  );
};

export default Agenda;
