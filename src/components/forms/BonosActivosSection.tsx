import { useEffect, useState } from 'react';
import { BonoCliente, ComposicionBono } from '@/types';
import { Models } from 'appwrite';
import { getBonosDisponibles } from '@/services/appwrite-bonos';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { differenceInDays, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Package, Calendar, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BonosActivosSectionProps {
  clienteId: string | null;
}

export const BonosActivosSection = ({ clienteId }: BonosActivosSectionProps) => {
  const [bonos, setBonos] = useState<(BonoCliente & Models.Document)[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!clienteId) {
      setBonos([]);
      return;
    }

    const cargarBonos = async () => {
      setLoading(true);
      try {
        const bonosDisponibles = await getBonosDisponibles(clienteId);
        setBonos(bonosDisponibles);
      } catch (error) {
        console.error('Error al cargar bonos:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarBonos();
  }, [clienteId]);

  if (!clienteId) return null;
  if (loading) return <div className="text-sm text-muted-foreground">Cargando bonos...</div>;
  if (bonos.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Package className="h-4 w-4" />
        <h3 className="text-sm font-semibold">Bonos Activos del Cliente</h3>
        <Badge variant="secondary">{bonos.length}</Badge>
      </div>

      <div className="grid gap-2">
        {bonos.map((bono) => {
          const composicion: ComposicionBono[] = JSON.parse(bono.composicion_restante);
          const diasRestantes = bono.fecha_vencimiento 
            ? differenceInDays(parseISO(bono.fecha_vencimiento), new Date())
            : null;
          const proximoAVencer = diasRestantes !== null && diasRestantes <= 7 && diasRestantes >= 0;
          const vencido = diasRestantes !== null && diasRestantes < 0;

          return (
            <Card key={bono.$id} className={vencido ? 'border-destructive' : proximoAVencer ? 'border-yellow-500' : ''}>
              <CardHeader className="p-3 pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm font-medium">{bono.bono_nombre}</CardTitle>
                  <Badge variant={vencido ? 'destructive' : proximoAVencer ? 'outline' : 'default'} className="text-xs">
                    {bono.usos_restantes} sesiones
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0 space-y-2">
                {bono.fecha_vencimiento && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>
                      Vence: {format(parseISO(bono.fecha_vencimiento), 'dd/MM/yyyy', { locale: es })}
                      {diasRestantes !== null && (
                        <span className={proximoAVencer || vencido ? 'ml-2 font-medium' : 'ml-2'}>
                          ({diasRestantes > 0 ? `${diasRestantes} días` : vencido ? 'Vencido' : 'Hoy'})
                        </span>
                      )}
                    </span>
                  </div>
                )}
                
                <div className="space-y-1">
                  <p className="text-xs font-medium">Servicios disponibles:</p>
                  {composicion
                    .filter(item => item.cantidad_restante > 0)
                    .map((item, idx) => (
                      <div key={idx} className="text-xs flex justify-between items-center pl-2">
                        <span>• {item.articulo_nombre}</span>
                        <Badge variant="outline" className="text-xs">
                          {item.cantidad_restante} restante{item.cantidad_restante !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                    ))}
                </div>

                {proximoAVencer && (
                  <Alert variant="default" className="py-1">
                    <AlertCircle className="h-3 w-3" />
                    <AlertDescription className="text-xs">
                      Este bono vence pronto
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
