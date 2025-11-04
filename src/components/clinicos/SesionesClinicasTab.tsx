import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSesionesClinicas } from '@/hooks/useSesionesClinicas';
import { getDocumentoFirmadoUrl, getFotoSesionUrl } from '@/services/appwrite-sesiones-clinicas';
import LoadingSpinner from '../LoadingSpinner';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { FileText, Image, ChevronDown, ChevronUp, Calendar, User } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import type { SesionClinica } from '@/types/sesion-clinica.types';
import type { Models } from 'appwrite';

interface SesionesClinicasTabProps {
  clienteId: string;
}

export const SesionesClinicasTab = ({ clienteId }: SesionesClinicasTabProps) => {
  const { sesiones, loading } = useSesionesClinicas(clienteId);
  const [expandedSesion, setExpandedSesion] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (!sesiones || sesiones.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-8">
        No hay sesiones clínicas registradas para este cliente
      </div>
    );
  }

  const toggleSesion = (sesionId: string) => {
    setExpandedSesion(expandedSesion === sesionId ? null : sesionId);
  };

  return (
    <div className="space-y-4 p-4">
      {sesiones.map((sesion: SesionClinica & Models.Document) => {
        const isExpanded = expandedSesion === sesion.$id;
        const articulosAplicados = sesion.articulos_aplicados ? 
          JSON.parse(sesion.articulos_aplicados) : [];
        const documentosIds = sesion.documentos_ids ? 
          JSON.parse(sesion.documentos_ids) : [];
        const fotosIds = sesion.fotos_ids ? 
          JSON.parse(sesion.fotos_ids) : [];

        return (
          <Card key={sesion.$id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-base">
                      {format(parseISO(sesion.fecha_sesion), "PPP", { locale: es })}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>Empleado ID: {sesion.empleado_id}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSesion(sesion.$id)}
                >
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardHeader>

            {isExpanded && (
              <CardContent>
                <div className="space-y-4">
                  {/* Información Básica */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-muted-foreground">Cliente ID</p>
                      <p>{sesion.cliente_id}</p>
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground">Edad en sesión</p>
                      <p>{sesion.edad_en_sesion} años</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Antecedentes Personales */}
                  {sesion.antecedentes_personales && (
                    <div>
                      <p className="font-medium text-sm mb-1">Antecedentes Personales</p>
                      <p className="text-sm text-muted-foreground">{sesion.antecedentes_personales}</p>
                    </div>
                  )}

                  {/* Motivo de Consulta */}
                  {sesion.motivo_consulta && (
                    <div>
                      <p className="font-medium text-sm mb-1">Motivo de Consulta</p>
                      <p className="text-sm text-muted-foreground">{sesion.motivo_consulta}</p>
                    </div>
                  )}

                  {/* Tratamiento */}
                  {sesion.tratamiento && (
                    <div>
                      <p className="font-medium text-sm mb-1">Tratamiento</p>
                      <p className="text-sm text-muted-foreground">{sesion.tratamiento}</p>
                    </div>
                  )}

                  {/* Próxima Cita */}
                  {sesion.proxima_cita && (
                    <div>
                      <p className="font-medium text-sm mb-1">Próxima Cita</p>
                      <p className="text-sm text-muted-foreground">
                        {format(parseISO(sesion.proxima_cita), "PPP", { locale: es })}
                      </p>
                    </div>
                  )}

                  <Separator />

                  {/* Artículos Aplicados */}
                  {articulosAplicados.length > 0 && (
                    <div>
                      <p className="font-medium text-sm mb-2">Artículos Aplicados</p>
                      <div className="space-y-1">
                        {articulosAplicados.map((articulo: any, index: number) => (
                          <div key={index} className="flex items-center justify-between text-sm bg-muted p-2 rounded">
                            <div>
                              <span>{articulo.articulo_nombre}</span>
                              <span className="text-muted-foreground ml-2">x{articulo.cantidad}</span>
                              <Badge variant="outline" className="ml-2">
                                {articulo.articulo_tipo}
                              </Badge>
                            </div>
                            <Badge variant={articulo.desde_bono ? "secondary" : "default"}>
                              {articulo.desde_bono ? 'Desde bono' : `${articulo.precio_total.toFixed(2)}€`}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Documentos Firmados */}
                  {documentosIds.length > 0 && (
                    <div>
                      <p className="font-medium text-sm mb-2 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Documentos Firmados ({documentosIds.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {documentosIds.map((docId: string, index: number) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(getDocumentoFirmadoUrl(docId), '_blank')}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Documento {index + 1}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Fotos */}
                  {fotosIds.length > 0 && (
                    <div>
                      <p className="font-medium text-sm mb-2 flex items-center gap-2">
                        <Image className="h-4 w-4" />
                        Fotos de la Sesión ({fotosIds.length})
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {fotosIds.map((fotoId: string, index: number) => (
                          <div 
                            key={index} 
                            className="relative aspect-square bg-muted rounded overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => window.open(getFotoSesionUrl(fotoId), '_blank')}
                          >
                            <img
                              src={getFotoSesionUrl(fotoId)}
                              alt={`Foto ${index + 1}`}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notas Adicionales */}
                  {sesion.notas_adicionales && (
                    <div>
                      <p className="font-medium text-sm mb-1">Notas Adicionales</p>
                      <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                        {sesion.notas_adicionales}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
};
