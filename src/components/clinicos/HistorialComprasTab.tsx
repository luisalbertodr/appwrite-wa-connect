import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useBonos } from '@/hooks/useBonos';
import { useGetFacturas } from '@/hooks/useFacturas';
import LoadingSpinner from '../LoadingSpinner';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Package, FileText, Clock } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import type { BonoCliente } from '@/types/bono.types';
import type { Factura } from '@/types/factura.types';
import type { Models } from 'appwrite';

interface HistorialComprasTabProps {
  clienteId: string;
}

export const HistorialComprasTab = ({ clienteId }: HistorialComprasTabProps) => {
  const { bonos, loading: loadingBonos } = useBonos(clienteId);
  const { data: facturas, isLoading: loadingFacturas } = useGetFacturas();

  const historialCompleto = useMemo(() => {
    const items: Array<{
      tipo: 'bono' | 'factura';
      fecha: Date;
      descripcion: string;
      total: number;
      estado?: string;
      data: (BonoCliente & Models.Document) | (Factura & Models.Document);
    }> = [];

    bonos?.forEach((bono: BonoCliente & Models.Document) => {
      items.push({
        tipo: 'bono',
        fecha: parseISO(bono.fecha_compra),
        descripcion: bono.bono_nombre,
        total: bono.precio_pagado,
        estado: bono.estado,
        data: bono
      });
    });

    // Filtrar facturas por cliente
    const facturasCliente = facturas?.filter((f: Factura & Models.Document) => 
      f.cliente_id === clienteId
    );

    facturasCliente?.forEach((factura: Factura & Models.Document) => {
      items.push({
        tipo: 'factura',
        fecha: parseISO(factura.fechaEmision),
        descripcion: `Factura ${factura.numeroFactura}`,
        total: factura.totalAPagar,
        estado: factura.estado,
        data: factura
      });
    });

    return items.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
  }, [bonos, facturas, clienteId]);

  if (loadingBonos || loadingFacturas) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (historialCompleto.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-8">
        No hay historial de compras para este cliente
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {historialCompleto.map((item, index) => (
        <Card key={index}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {item.tipo === 'bono' ? (
                  <Package className="h-5 w-5 text-primary" />
                ) : (
                  <FileText className="h-5 w-5 text-blue-500" />
                )}
                <div>
                  <CardTitle className="text-base">{item.descripcion}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {format(item.fecha, "PPP", { locale: es })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">{item.total.toFixed(2)}€</p>
                {item.estado && (
                  <Badge variant={
                    item.estado === 'activo' || item.estado === 'pagada' ? 'default' :
                    item.estado === 'vencido' || item.estado === 'cancelada' ? 'destructive' :
                    'secondary'
                  }>
                    {item.estado}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          {item.tipo === 'bono' && (
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Usos restantes: {(item.data as BonoCliente).usos_restantes}
                  </span>
                </div>
                {(item.data as BonoCliente).fecha_vencimiento && (
                  <div className="text-muted-foreground">
                    Vence: {format(parseISO((item.data as BonoCliente).fecha_vencimiento!), "PPP", { locale: es })}
                  </div>
                )}
                {(item.data as BonoCliente).composicion_restante && (
                  <div className="mt-2">
                    <p className="font-medium mb-1">Contenido restante:</p>
                    <div className="text-xs text-muted-foreground">
                      {(() => {
                        try {
                          const comp = JSON.parse((item.data as BonoCliente).composicion_restante);
                          return (
                            <ul className="list-disc list-inside space-y-1">
                              {comp.map((articulo: any, i: number) => (
                                <li key={i}>
                                  {articulo.articulo_nombre} x{articulo.cantidad_restante}/{articulo.cantidad}
                                </li>
                              ))}
                            </ul>
                          );
                        } catch {
                          return <pre>{(item.data as BonoCliente).composicion_restante}</pre>;
                        }
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          )}
          {item.tipo === 'factura' && (
            <CardContent>
              <div className="space-y-1 text-sm">
                <p className="text-muted-foreground">
                  Método: {(item.data as Factura).metodoPago || 'N/A'}
                </p>
                {(item.data as Factura).notas && (
                  <p className="text-muted-foreground">
                    {(item.data as Factura).notas}
                  </p>
                )}
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
};
