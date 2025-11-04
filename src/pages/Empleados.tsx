import { useState } from 'react';
import { useGetEmpleados, useCreateEmpleado, useUpdateEmpleado, useDeleteEmpleado } from '@/hooks/useEmpleados';
import { Empleado, LipooutUserInput } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, MoreHorizontal, Edit, Trash2, Users } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmpleadoForm } from '@/components/forms/EmpleadoForm';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';

const Empleados = () => {
  const [soloActivos, setSoloActivos] = useState(true);
  const { data: empleados, isLoading } = useGetEmpleados(soloActivos);
  const createEmpleado = useCreateEmpleado();
  const updateEmpleado = useUpdateEmpleado();
  const deleteEmpleado = useDeleteEmpleado();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmpleado, setEditingEmpleado] = useState<Empleado | undefined>(undefined);

  const handleCreate = () => {
    setEditingEmpleado(undefined);
    setIsDialogOpen(true);
  };

  const handleEdit = (empleado: Empleado) => {
    setEditingEmpleado(empleado);
    setIsDialogOpen(true);
  };

  const handleDelete = async (empleadoId: string) => {
    if (confirm('¿Estás seguro de eliminar este empleado?')) {
      try {
        await deleteEmpleado.mutateAsync(empleadoId);
        toast({
          title: "Empleado eliminado",
          description: "El empleado ha sido eliminado correctamente.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo eliminar el empleado.",
          variant: "destructive",
        });
      }
    }
  };

  const handleSubmit = async (data: LipooutUserInput<Empleado>) => {
    try {
      const nombre_completo = `${data.nombre} ${data.apellidos}`.trim();
      const empleadoData = { ...data, nombre_completo };

      if (editingEmpleado) {
        await updateEmpleado.mutateAsync({ id: editingEmpleado.$id, data: empleadoData });
        toast({
          title: "Empleado actualizado",
          description: "Los datos del empleado han sido actualizados.",
        });
      } else {
        await createEmpleado.mutateAsync(empleadoData);
        toast({
          title: "Empleado creado",
          description: "El nuevo empleado ha sido creado correctamente.",
        });
      }
      setIsDialogOpen(false);
      setEditingEmpleado(undefined);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar el empleado.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Empleados</h1>
          <p className="text-muted-foreground">Gestiona tu equipo de trabajo</p>
        </div>
        <Button onClick={handleCreate}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nuevo Empleado
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Filtros
            </span>
            <div className="flex items-center space-x-2">
              <Switch
                id="solo-activos"
                checked={soloActivos}
                onCheckedChange={setSoloActivos}
              />
              <label htmlFor="solo-activos" className="text-sm font-normal cursor-pointer">
                Solo activos
              </label>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Color</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {empleados && empleados.length > 0 ? (
                empleados.map((empleado) => (
                  <TableRow key={empleado.$id}>
                    <TableCell className="font-medium">{empleado.nombre_completo}</TableCell>
                    <TableCell>{empleado.email}</TableCell>
                    <TableCell>{empleado.telefono || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{empleado.rol}</Badge>
                    </TableCell>
                    <TableCell>
                      {empleado.activo ? (
                        <Badge variant="default">Activo</Badge>
                      ) : (
                        <Badge variant="secondary">Inactivo</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-full border"
                          style={{ backgroundColor: empleado.color }}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(empleado)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(empleado.$id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No se encontraron empleados. Crea el primero.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEmpleado ? 'Editar Empleado' : 'Nuevo Empleado'}
            </DialogTitle>
            <DialogDescription>
              {editingEmpleado
                ? 'Modifica los datos del empleado'
                : 'Completa el formulario para crear un nuevo empleado'}
            </DialogDescription>
          </DialogHeader>
          <EmpleadoForm
            empleado={editingEmpleado}
            onSubmit={handleSubmit}
            onCancel={() => {
              setIsDialogOpen(false);
              setEditingEmpleado(undefined);
            }}
            isLoading={createEmpleado.isPending || updateEmpleado.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Empleados;
