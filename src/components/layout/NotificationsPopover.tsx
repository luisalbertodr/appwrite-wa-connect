import { useState } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotificaciones } from '@/hooks/useNotificaciones';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface NotificationsPopoverProps {
  empleadoId?: string;
}

export const NotificationsPopover = ({ empleadoId }: NotificationsPopoverProps) => {
  const [open, setOpen] = useState(false);
  const { 
    notificaciones, 
    noLeidas,
    marcarLeida,
    eliminarNotificacion 
  } = useNotificaciones(empleadoId);

  const handleMarcarLeida = async (notifId: string) => {
    await marcarLeida(notifId);
  };

  const handleEliminar = async (notifId: string) => {
    await eliminarNotificacion(notifId);
  };

  // Helper para verificar si una notificación está leída
  const esNoLeida = (notifId: string) => {
    return noLeidas.some(n => n.$id === notifId);
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'bono_por_vencer':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'cita_hoy':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'cita_manana':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'bono_vencido':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'sistema':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'bono_por_vencer':
        return 'Bono por vencer';
      case 'cita_hoy':
        return 'Cita hoy';
      case 'cita_manana':
        return 'Cita mañana';
      case 'bono_vencido':
        return 'Bono vencido';
      case 'sistema':
        return 'Sistema';
      default:
        return tipo;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className="rounded-full relative"
        >
          <Bell className="h-5 w-5" />
          {noLeidas.length > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {noLeidas.length > 9 ? '9+' : noLeidas.length}
            </Badge>
          )}
          <span className="sr-only">Notificaciones</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notificaciones</h3>
          {noLeidas.length > 0 && (
            <Badge variant="secondary">
              {noLeidas.length} sin leer
            </Badge>
          )}
        </div>
        
        <ScrollArea className="h-96">
          {notificaciones && notificaciones.length > 0 ? (
            <div className="divide-y">
              {notificaciones.map((notif) => (
                <div
                  key={notif.$id}
                  className={cn(
                    "p-4 hover:bg-muted/50 transition-colors",
                    esNoLeida(notif.$id) && "bg-blue-50/50"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline"
                          className={cn("text-xs", getTipoColor(notif.tipo))}
                        >
                          {getTipoLabel(notif.tipo)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(notif.$createdAt), "d MMM, HH:mm", { locale: es })}
                        </span>
                      </div>
                      
                      <p className="text-sm font-medium">
                        {notif.titulo}
                      </p>
                      
                      <p className="text-sm text-muted-foreground">
                        {notif.mensaje}
                      </p>
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      {esNoLeida(notif.$id) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleMarcarLeida(notif.$id)}
                          title="Marcar como leída"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleEliminar(notif.$id)}
                        title="Eliminar"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
              <Bell className="h-12 w-12 mb-2 opacity-50" />
              <p className="text-sm">No hay notificaciones</p>
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
