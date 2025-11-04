import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HistorialComprasTab } from './HistorialComprasTab';
import { SesionesClinicasTab } from './SesionesClinicasTab';
import { FormularioSesionActual } from './FormularioSesionActual';

interface DatosClinicosModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clienteId: string;
  citaId?: string;
  empleadoId: string;
}

export const DatosClinicosModal = ({ 
  open, 
  onOpenChange, 
  clienteId, 
  citaId,
  empleadoId 
}: DatosClinicosModalProps) => {
  const [activeTab, setActiveTab] = useState('sesion-actual');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Datos Clínicos del Cliente</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="sesion-actual">Sesión Actual</TabsTrigger>
            <TabsTrigger value="sesiones">Historial Sesiones</TabsTrigger>
            <TabsTrigger value="compras">Historial Compras</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[calc(90vh-180px)] mt-4">
            <TabsContent value="sesion-actual" className="space-y-4">
              <FormularioSesionActual 
                clienteId={clienteId}
                citaId={citaId}
                empleadoId={empleadoId}
                onSuccess={() => setActiveTab('sesiones')}
              />
            </TabsContent>

            <TabsContent value="sesiones" className="space-y-4">
              <SesionesClinicasTab clienteId={clienteId} />
            </TabsContent>

            <TabsContent value="compras" className="space-y-4">
              <HistorialComprasTab clienteId={clienteId} />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
