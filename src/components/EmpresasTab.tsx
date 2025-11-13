import { useState } from 'react';
import { Empresa, EmpresaInput } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner'; 
import { EmpresaForm } from '@/components/forms/EmpresaForm'; 
// --- CAMBIO: Importar el hook real ---
import { useEmpresas } from '@/hooks/useEmpresas';


export const EmpresasTab = () => {
    const { toast } = useToast();
    // --- CAMBIO: Usar el hook real de Appwrite ---
    const { 
        empresas, 
        isLoading, 
        createEmpresa, 
        updateEmpresa, 
        deleteEmpresa,
        error 
    } = useEmpresas(); 

    const [sheetOpen, setSheetOpen] = useState(false);
    const [empresaEditing, setEmpresaEditing] = useState<Empresa | null>(null);

    const handleNuevo = () => {
        setEmpresaEditing(null);
        setSheetOpen(true);
    };

    const handleEditar = (empresa: Empresa) => {
        setEmpresaEditing(empresa);
        setSheetOpen(true);
    };

    const handleSave = async (data: EmpresaInput) => {
        try {
            if (empresaEditing) {
                await updateEmpresa({ id: empresaEditing.$id, data });
                toast({ title: "Empresa actualizada", description: `Los datos de ${data.nombre} han sido guardados.` });
            } else {
                await createEmpresa(data);
                toast({ title: "Empresa creada", description: `El nuevo centro ${data.nombre} ha sido registrado.` });
            }
            setSheetOpen(false);
        } catch (err) {
            toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('ADVERTENCIA: Eliminar una empresa es irreversible y eliminará o desactivará todos sus datos asociados (clientes, citas, facturas, etc.). ¿Estás seguro?')) {
            return;
        }
        try {
            await deleteEmpresa(id);
            toast({ title: "Empresa eliminada", variant: "destructive" });
        } catch (err) {
            toast({ title: "Error al eliminar", description: (err as Error).message, variant: "destructive" });
        }
    };

    if (isLoading) {
        return <LoadingSpinner />;
    }
    
    // Manejo de errores
    if (error) {
         return (
             <Card className="border-destructive">
                 <CardHeader>
                     <CardTitle className="text-destructive">Error al Cargar Empresas</CardTitle>
                 </CardHeader>
                 <CardContent>
                     <p>No se pudo conectar con el servicio de Appwrite o hay un error de permisos.</p>
                     <p className="text-sm text-muted-foreground mt-2">Detalle: {(error as Error).message}</p>
                 </CardContent>
             </Card>
         );
    }

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Gestión de Centros/Empresas</CardTitle>
                        <CardDescription>Configura y administra los diferentes centros de tu red. Solo visible para administradores.</CardDescription>
                    </div>
                    <Button onClick={handleNuevo}><Plus className="w-4 h-4 mr-2"/> Nueva Empresa</Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>CIF</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {empresas.length > 0 ? empresas.map(emp => (
                                <TableRow key={emp.$id}>
                                    <TableCell className="font-medium">{emp.nombre}</TableCell>
                                    <TableCell>{emp.cif2}</TableCell>
                                    <TableCell>
                                        <Badge variant={emp.activa ? 'default' : 'secondary'}>
                                            {emp.activa ? 'Activa' : 'Inactiva'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={() => handleEditar(emp)}><Pencil className="w-4 h-4"/></Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleDelete(emp.$id)}><Trash2 className="w-4 h-4"/></Button>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground">No hay empresas registradas.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            
            {/* Sheet para crear/editar empresa */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetContent className="sm:max-w-[600px] overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>{empresaEditing ? 'Editar Empresa' : 'Nueva Empresa'}</SheetTitle>
                    </SheetHeader>
                    <EmpresaForm
                        empresaInicial={empresaEditing}
                        onSubmit={handleSave}
                        isSubmitting={isLoading}
                    />
                </SheetContent>
            </Sheet>
        </>
    );
};
