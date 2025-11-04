import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Shield, Pencil, Plus, Check, X, Trash2, AlertCircle } from 'lucide-react';
import { usePermisos } from '@/hooks/usePermisos';
import { useGetEmpleados } from '@/hooks/useEmpleados';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import type { Permiso } from '@/types';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { RolEmpleado } from '@/types/empleado.types';
import { Models } from 'appwrite';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PermisoFormData {
  empleado_id: string;
  rol: RolEmpleado;
  ver_datos_clinicos: boolean;
  editar_datos_clinicos: boolean;
  ver_bonos: boolean;
  gestionar_bonos: boolean;
  ver_facturas: boolean;
  editar_facturas: boolean;
  ver_agenda: boolean;
  gestionar_agenda: boolean;
  ver_clientes: boolean;
  editar_clientes: boolean;
  ver_articulos: boolean;
  editar_articulos: boolean;
  acceso_configuracion: boolean;
  acceso_reportes: boolean;
}

export const PermisosTab = () => {
  const { toast } = useToast();
  const { data: empleados, isLoading: loadingEmpleados } = useGetEmpleados();
  const { 
    todosPermisos, 
    loading: loadingPermisos, 
    createPermisos, 
    updatePermisos, 
    deletePermisos,
    loadTodosPermisos
  } = usePermisos();

  const [permisoSheetOpen, setPermisoSheetOpen] = useState(false);
  const [permisoEditing, setPermisoEditing] = useState<(Permiso & Models.Document) | null>(null);
  const [formData, setFormData] = useState<PermisoFormData>({
    empleado_id: '',
    rol: 'Lectura',
    ver_datos_clinicos: false,
    editar_datos_clinicos: false,
    ver_bonos: true,
    gestionar_bonos: false,
    ver_facturas: true,
    editar_facturas: false,
    ver_agenda: true,
    gestionar_agenda: false,
    ver_clientes: true,
    editar_clientes: false,
    ver_articulos: true,
    editar_articulos: false,
    acceso_configuracion: false,
    acceso_reportes: false,
  });

  // Cargar todos los permisos al montar
  useEffect(() => {
    loadTodosPermisos();
  }, [loadTodosPermisos]);

  const handleNuevoPermiso = () => {
    setPermisoEditing(null);
    setFormData({
      empleado_id: '',
      rol: 'Lectura',
      ver_datos_clinicos: false,
      editar_datos_clinicos: false,
      ver_bonos: true,
      gestionar_bonos: false,
      ver_facturas: true,
      editar_facturas: false,
      ver_agenda: true,
      gestionar_agenda: false,
      ver_clientes: true,
      editar_clientes: false,
      ver_articulos: true,
      editar_articulos: false,
      acceso_configuracion: false,
      acceso_reportes: false,
    });
    setPermisoSheetOpen(true);
  };

  const handleEditarPermiso = (permiso: Permiso & Models.Document) => {
    setPermisoEditing(permiso);
    setFormData({
      empleado_id: permiso.empleado_id,
      rol: permiso.rol,
      ver_datos_clinicos: permiso.ver_datos_clinicos,
      editar_datos_clinicos: permiso.editar_datos_clinicos,
      ver_bonos: permiso.ver_bonos,
      gestionar_bonos: permiso.gestionar_bonos,
      ver_facturas: permiso.ver_facturas,
      editar_facturas: permiso.editar_facturas,
      ver_agenda: permiso.ver_agenda,
      gestionar_agenda: permiso.gestionar_agenda,
      ver_clientes: permiso.ver_clientes,
      editar_clientes: permiso.editar_clientes,
      ver_articulos: permiso.ver_articulos,
      editar_articulos: permiso.editar_articulos,
      acceso_configuracion: permiso.acceso_configuracion,
      acceso_reportes: permiso.acceso_reportes,
    });
    setPermisoSheetOpen(true);
  };

  const handleSavePermiso = async () => {
    try {
      if (!formData.empleado_id) {
        toast({ title: 'Error', description: 'Debes seleccionar un empleado', variant: 'destructive' });
        return;
      }

      const dataToSave = { ...formData };

      if (permisoEditing) {
        await updatePermisos(permisoEditing.$id, dataToSave);
        toast({ title: 'Permisos actualizados' });
      } else {
        await createPermisos(dataToSave);
        toast({ title: 'Permisos creados' });
      }
      setPermisoSheetOpen(false);
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
    }
  };

  const handleDeletePermiso = async (id: string) => {
    if (!confirm('¿Eliminar permisos de este empleado?')) return;
    try {
      await deletePermisos(id);
      toast({ title: 'Permisos eliminados' });
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
    }
  };

  const aplicarPermisosPorRol = (rol: RolEmpleado) => {
    switch (rol) {
      case 'Admin':
        setFormData({
          ...formData,
          rol,
          ver_datos_clinicos: true,
          editar_datos_clinicos: true,
          ver_bonos: true,
          gestionar_bonos: true,
          ver_facturas: true,
          editar_facturas: true,
          ver_agenda: true,
          gestionar_agenda: true,
          ver_clientes: true,
          editar_clientes: true,
          ver_articulos: true,
          editar_articulos: true,
          acceso_configuracion: true,
          acceso_reportes: true,
        });
        break;
      case 'Médico':
        setFormData({
          ...formData,
          rol,
          ver_datos_clinicos: true,
          editar_datos_clinicos: true,
          ver_bonos: true,
          gestionar_bonos: true,
          ver_facturas: true,
          editar_facturas: false,
          ver_agenda: true,
          gestionar_agenda: true,
          ver_clientes: true,
          editar_clientes: true,
          ver_articulos: true,
          editar_articulos: false,
          acceso_configuracion: false,
          acceso_reportes: true,
        });
        break;
      case 'Recepción':
        setFormData({
          ...formData,
          rol,
          ver_datos_clinicos: false,
          editar_datos_clinicos: false,
          ver_bonos: true,
          gestionar_bonos: true,
          ver_facturas: true,
          editar_facturas: true,
          ver_agenda: true,
          gestionar_agenda: true,
          ver_clientes: true,
          editar_clientes: true,
          ver_articulos: true,
          editar_articulos: true,
          acceso_configuracion: false,
          acceso_reportes: false,
        });
        break;
      case 'Lectura':
        setFormData({
          ...formData,
          rol,
          ver_datos_clinicos: false,
          editar_datos_clinicos: false,
          ver_bonos: true,
          gestionar_bonos: false,
          ver_facturas: true,
          editar_facturas: false,
          ver_agenda: true,
          gestionar_agenda: false,
          ver_clientes: true,
          editar_clientes: false,
          ver_articulos: true,
          editar_articulos: false,
          acceso_configuracion: false,
          acceso_reportes: false,
        });
        break;
    }
  };

  const getEmpleadoNombre = (empleadoId: string): string => {
    const empleado = empleados?.find(e => e.$id === empleadoId);
    return empleado ? `${empleado.nombre} ${empleado.apellidos}` : 'Desconocido';
  };

  const getRolBadgeVariant = (rol: RolEmpleado): "default" | "secondary" | "outline" | "destructive" => {
    switch (rol) {
      case 'Admin': return 'default';
      case 'Médico': return 'secondary';
      case 'Recepción': return 'outline';
      case 'Lectura': return 'secondary';
    }
  };

  // Empleados sin permisos asignados
  const empleadosSinPermisos = empleados?.filter(
    emp => !todosPermisos.some(p => p.empleado_id === emp.$id)
  ) || [];

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Gestión de Permisos
            </CardTitle>
            <CardDescription>
              Configura los permisos de acceso para cada empleado
            </CardDescription>
          </div>
          <Button onClick={handleNuevoPermiso}>
            <Plus className="w-4 h-4 mr-2" />
            Asignar Permisos
          </Button>
        </CardHeader>
        <CardContent>
          {empleadosSinPermisos.length > 0 && (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Hay {empleadosSinPermisos.length} empleado(s) sin permisos asignados: {' '}
                {empleadosSinPermisos.map(e => `${e.nombre} ${e.apellidos}`).join(', ')}
              </AlertDescription>
            </Alert>
          )}

          {loadingPermisos || loadingEmpleados ? (
            <LoadingSpinner />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empleado</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Datos Clínicos</TableHead>
                  <TableHead>Bonos</TableHead>
                  <TableHead>Facturas</TableHead>
                  <TableHead>Configuración</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {todosPermisos && todosPermisos.length > 0 ? (
                  todosPermisos.map((permiso) => (
                    <TableRow key={permiso.$id}>
                      <TableCell className="font-medium">
                        {getEmpleadoNombre(permiso.empleado_id)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRolBadgeVariant(permiso.rol)}>
                          {permiso.rol}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {permiso.ver_datos_clinicos && <Check className="w-4 h-4 text-green-600" />}
                          {permiso.editar_datos_clinicos && <Pencil className="w-4 h-4 text-blue-600" />}
                          {!permiso.ver_datos_clinicos && <X className="w-4 h-4 text-muted-foreground" />}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {permiso.ver_bonos && <Check className="w-4 h-4 text-green-600" />}
                          {permiso.gestionar_bonos && <Pencil className="w-4 h-4 text-blue-600" />}
                          {!permiso.ver_bonos && <X className="w-4 h-4 text-muted-foreground" />}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {permiso.ver_facturas && <Check className="w-4 h-4 text-green-600" />}
                          {permiso.editar_facturas && <Pencil className="w-4 h-4 text-blue-600" />}
                          {!permiso.ver_facturas && <X className="w-4 h-4 text-muted-foreground" />}
                        </div>
                      </TableCell>
                      <TableCell>
                        {permiso.acceso_configuracion ? 
                          <Check className="w-4 h-4 text-green-600" /> : 
                          <X className="w-4 h-4 text-muted-foreground" />
                        }
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEditarPermiso(permiso)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeletePermiso(permiso.$id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No hay permisos asignados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Sheet para crear/editar permisos */}
      <Sheet open={permisoSheetOpen} onOpenChange={setPermisoSheetOpen}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {permisoEditing ? 'Editar Permisos' : 'Asignar Permisos'}
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-6 mt-6">
            {/* Seleccionar empleado */}
            <div className="space-y-2">
              <Label>Empleado</Label>
              <Select
                value={formData.empleado_id}
                onValueChange={(value) => setFormData({ ...formData, empleado_id: value })}
                disabled={!!permisoEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar empleado" />
                </SelectTrigger>
                <SelectContent>
                  {empleados?.map((emp) => (
                    <SelectItem key={emp.$id} value={emp.$id}>
                      {emp.nombre} {emp.apellidos}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Seleccionar rol */}
            <div className="space-y-2">
              <Label>Rol Predefinido</Label>
              <Select
                value={formData.rol}
                onValueChange={(value) => aplicarPermisosPorRol(value as RolEmpleado)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Médico">Médico</SelectItem>
                  <SelectItem value="Recepción">Recepción</SelectItem>
                  <SelectItem value="Lectura">Lectura</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Selecciona un rol para aplicar permisos predefinidos, luego personaliza según necesites
              </p>
            </div>

            {/* Datos Clínicos */}
            <div className="space-y-3 p-4 border rounded-lg">
              <h4 className="font-semibold text-sm">Datos Clínicos</h4>
              <div className="flex items-center justify-between">
                <Label htmlFor="ver_datos_clinicos">Ver datos clínicos</Label>
                <Switch
                  id="ver_datos_clinicos"
                  checked={formData.ver_datos_clinicos}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, ver_datos_clinicos: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="editar_datos_clinicos">Editar datos clínicos</Label>
                <Switch
                  id="editar_datos_clinicos"
                  checked={formData.editar_datos_clinicos}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, editar_datos_clinicos: checked })
                  }
                  disabled={!formData.ver_datos_clinicos}
                />
              </div>
            </div>

            {/* Bonos */}
            <div className="space-y-3 p-4 border rounded-lg">
              <h4 className="font-semibold text-sm">Bonos</h4>
              <div className="flex items-center justify-between">
                <Label htmlFor="ver_bonos">Ver bonos</Label>
                <Switch
                  id="ver_bonos"
                  checked={formData.ver_bonos}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, ver_bonos: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="gestionar_bonos">Gestionar bonos</Label>
                <Switch
                  id="gestionar_bonos"
                  checked={formData.gestionar_bonos}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, gestionar_bonos: checked })
                  }
                  disabled={!formData.ver_bonos}
                />
              </div>
            </div>

            {/* Facturas */}
            <div className="space-y-3 p-4 border rounded-lg">
              <h4 className="font-semibold text-sm">Facturas</h4>
              <div className="flex items-center justify-between">
                <Label htmlFor="ver_facturas">Ver facturas</Label>
                <Switch
                  id="ver_facturas"
                  checked={formData.ver_facturas}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, ver_facturas: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="editar_facturas">Editar facturas</Label>
                <Switch
                  id="editar_facturas"
                  checked={formData.editar_facturas}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, editar_facturas: checked })
                  }
                  disabled={!formData.ver_facturas}
                />
              </div>
            </div>

            {/* Agenda */}
            <div className="space-y-3 p-4 border rounded-lg">
              <h4 className="font-semibold text-sm">Agenda</h4>
              <div className="flex items-center justify-between">
                <Label htmlFor="ver_agenda">Ver agenda</Label>
                <Switch
                  id="ver_agenda"
                  checked={formData.ver_agenda}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, ver_agenda: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="gestionar_agenda">Gestionar agenda</Label>
                <Switch
                  id="gestionar_agenda"
                  checked={formData.gestionar_agenda}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, gestionar_agenda: checked })
                  }
                  disabled={!formData.ver_agenda}
                />
              </div>
            </div>

            {/* Clientes */}
            <div className="space-y-3 p-4 border rounded-lg">
              <h4 className="font-semibold text-sm">Clientes</h4>
              <div className="flex items-center justify-between">
                <Label htmlFor="ver_clientes">Ver clientes</Label>
                <Switch
                  id="ver_clientes"
                  checked={formData.ver_clientes}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, ver_clientes: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="editar_clientes">Editar clientes</Label>
                <Switch
                  id="editar_clientes"
                  checked={formData.editar_clientes}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, editar_clientes: checked })
                  }
                  disabled={!formData.ver_clientes}
                />
              </div>
            </div>

            {/* Artículos */}
            <div className="space-y-3 p-4 border rounded-lg">
              <h4 className="font-semibold text-sm">Artículos</h4>
              <div className="flex items-center justify-between">
                <Label htmlFor="ver_articulos">Ver artículos</Label>
                <Switch
                  id="ver_articulos"
                  checked={formData.ver_articulos}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, ver_articulos: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="editar_articulos">Editar artículos</Label>
                <Switch
                  id="editar_articulos"
                  checked={formData.editar_articulos}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, editar_articulos: checked })
                  }
                  disabled={!formData.ver_articulos}
                />
              </div>
            </div>

            {/* Otros permisos */}
            <div className="space-y-3 p-4 border rounded-lg">
              <h4 className="font-semibold text-sm">Otros Permisos</h4>
              <div className="flex items-center justify-between">
                <Label htmlFor="acceso_configuracion">Acceso a configuración</Label>
                <Switch
                  id="acceso_configuracion"
                  checked={formData.acceso_configuracion}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, acceso_configuracion: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="acceso_reportes">Acceso a reportes</Label>
                <Switch
                  id="acceso_reportes"
                  checked={formData.acceso_reportes}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, acceso_reportes: checked })
                  }
                />
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-2 pt-4">
              <Button onClick={handleSavePermiso} className="flex-1">
                {permisoEditing ? 'Actualizar' : 'Crear'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setPermisoSheetOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
