import { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { useAppwriteCollection } from '@/hooks/useAppwrite';
import { WahaConfig, LipooutUserInput } from '@/types';
import type { Empleado, Recurso, Proveedor, HorarioApertura, Configuracion } from '@/types'; 
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, Loader2, Save, Settings, Server, Users, Package, Building2, Plus, Pencil, Trash2, Shield, PackageOpen, FileText, X, RefreshCw, Briefcase } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ConfigurationForm } from '@/components/forms/ConfigurationForm';
import { EmpleadoForm } from '@/components/forms/EmpleadoForm';
import { RecursoForm } from '@/components/forms/RecursoForm';
import { ProveedorForm } from '@/components/forms/ProveedorForm';
import { PermisosTab } from '@/components/permisos/PermisosTab';
import { FamiliasTab } from '@/components/FamiliasTab';
import { EmpresasTab } from '@/components/EmpresasTab'; 
import { useGetConfiguration, useUpdateConfiguration } from '@/hooks/useConfiguration';
import { useGetEmpleados, useCreateEmpleado, useUpdateEmpleado, useDeleteEmpleado } from '@/hooks/useEmpleados';
import { useGetRecursos, useCreateRecurso, useUpdateRecurso, useDeleteRecurso } from '@/hooks/useRecursos';
import { useGetProveedores, useCreateProveedor, useUpdateProveedor, useDeleteProveedor } from '@/hooks/useProveedores';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  CONFIG_COLLECTION_ID,
  IMPORT_LOGS_COLLECTION_ID,
  storage,
  IMPORT_BUCKET_ID,
  client,
  CONFIG_BUCKET_ID, 
} from '@/lib/appwrite';
import { Functions, Models } from 'appwrite';
import { format } from 'date-fns';
import { es } from 'date-fns/locale'; 

const functions = new Functions(client);

interface ImportLog extends Models.Document {
    timestamp: string;
    filename: string;
    totalProcessed: number; 
    errors?: string[];
    status: 'completed' | 'completed_with_errors' | 'failed';
    successful_rows: number; 
    failed_rows: number; 
    error_message?: string; 
}

// Función auxiliar para sanear horarios profundamente
const sanitizeHorarios = (horarios: Configuracion['horarios']): HorarioApertura[] => {
    if (!horarios) return [];
    return horarios.map(h => ({
        // El dia y abierto se consideran seguros ya que son enums/booleans
        dia: h.dia,
        abierto: h.abierto,
        // Saneamiento robusto de horas: fuerza a string y aplica trim
        horaInicio: String(h.horaInicio || '08:00').trim(), 
        horaFin: String(h.horaFin || '21:00').trim(),    
    }));
};


const Configuracion = () => {
  const { toast } = useToast();
  
  // --- SIMULACIÓN DE ROL DE ADMINISTRADOR ---
  // CORRECCIÓN 6133: Se mantiene la declaración de 'isAdmin'
  const [isAdmin] = useState(true); 
  // --- FIN SIMULACIÓN ---
  
  // --- Estado y Hooks para Configuración WAHA ---
  const { data: configs, update: updateWahaConfig, loading: loadingWahaConfig, reload: reloadWahaConfig } = useAppwriteCollection<WahaConfig>(CONFIG_COLLECTION_ID);
  const [wahaSettings, setWahaSettings] = useState<Partial<WahaConfig>>({});
  const [sessions, setSessions] = useState<{ name: string; status: string }[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [isSavingWaha, setIsSavingWaha] = useState(false);

  // --- Estado y Hooks para Importación CSV ---
  const { data: importLogsData, loading: loadingLogs, reload: reloadLogs } = useAppwriteCollection<ImportLog>(IMPORT_LOGS_COLLECTION_ID);
  const importLogs = importLogsData as ImportLog[];
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [logSheetOpen, setLogSheetOpen] = useState(false); 
  const [selectedLogDetail, setSelectedLogDetail] = useState<ImportLog | null>(null); 

  // --- Estado y Hooks para Configuración Clínica ---
  const { data: clinicConfig, isLoading: loadingClinicConfig, refetch: refetchClinicConfig } = useGetConfiguration(); 
  const updateClinicMutation = useUpdateConfiguration();

  // --- Hooks para Gestión de Entidades (sin cambios) ---
  const { data: empleados, isLoading: loadingEmpleados } = useGetEmpleados();
  const deleteEmpleadoMutation = useDeleteEmpleado();
  
  const { data: recursos, isLoading: loadingRecursos } = useGetRecursos();
  const deleteRecursoMutation = useDeleteRecurso();
  
  const { data: proveedores, isLoading: loadingProveedores } = useGetProveedores();
  const deleteProveedorMutation = useDeleteProveedor();

  // --- Estados para Sheets de Gestión (sin cambios) ---
  const [empleadoSheetOpen, setEmpleadoSheetOpen] = useState(false);
  const [empleadoEditing, setEmpleadoEditing] = useState<Empleado | null>(null);
  const createEmpleadoMutation = useCreateEmpleado();
  const updateEmpleadoMutation = useUpdateEmpleado();

  const [recursoSheetOpen, setRecursoSheetOpen] = useState(false);
  const [recursoEditing, setRecursoEditing] = useState<Recurso | null>(null);
  const createRecursoMutation = useCreateRecurso();
  const updateRecursoMutation = useUpdateRecurso();

  const [proveedorSheetOpen, setProveedorSheetOpen] = useState(false);
  const [proveedorEditing, setProveedorEditing] = useState<Proveedor | null>(null);
  const createProveedorMutation = useCreateProveedor();
  const updateProveedorMutation = useUpdateProveedor();

  // Cargar configuración WAHA inicial en el estado local
  useEffect(() => {
    if (configs.length > 0) {
      setWahaSettings(configs[0]);
    }
  }, [configs]);

  // Manejar cambios en formulario WAHA
  const handleWahaChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setWahaSettings({ ...wahaSettings, [e.target.name]: e.target.value });
  };

  // Guardar configuración WAHA
  const handleSaveWahaConfig = async () => {
    if (!configs[0]?.$id) return;
    setIsSavingWaha(true);
    try {
      const dataToSave: LipooutUserInput<WahaConfig> = {
          apiUrl: wahaSettings.apiUrl || '',
          apiKey: wahaSettings.apiKey,
          session: wahaSettings.session,
      };
      await updateWahaConfig(configs[0].$id, dataToSave);
      toast({ title: 'Configuración WAHA guardada' });
      reloadWahaConfig();
    } catch (e) {
      toast({ title: 'Error al guardar', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setIsSavingWaha(false);
    }
  };

  // Obtener sesiones WAHA
  const fetchSessions = useCallback(async () => {
    setLoadingSessions(true);
    try {
      const result = await functions.createExecution('getWahaSessionsFunction', '{}', false);
      if (result.status === 'completed') {
        const responseData = JSON.parse(result.responseBody);
        setSessions(responseData);
      } else {
        throw new Error(result.responseBody || 'Error desconocido');
      }
    } catch (error) {
      toast({ title: 'Error al obtener sesiones', description: (error as Error).message, variant: 'destructive' });
      setSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  }, [toast]);

  // Selección de archivo CSV
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  // Subir archivo CSV (ahora incluye implícitamente las migraciones)
  const handleFileUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    try {
      // La subida del archivo es el trigger de la función 'ImportCsvFunction'
      await storage.createFile(IMPORT_BUCKET_ID, 'unique()', selectedFile); 
      
      toast({ 
        title: 'Archivo subido y proceso iniciado', 
        description: 'La importación de clientes y las migraciones de backend se procesarán en segundo plano. Consulta el historial de logs.',
      });
      
      setSelectedFile(null);
      setTimeout(reloadLogs, 5000); 
    } catch (error) {
      toast({ title: 'Error al subir archivo', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleViewLogDetail = (log: ImportLog) => {
    setSelectedLogDetail(log);
  };
  
  // Manejador central para guardar Configuración Clínica (sin logo)
  const handleSaveClinicConfig = async (data: LipooutUserInput<Configuracion>) => {
       if (!clinicConfig?.$id) {
           toast({ title: "Error", description: "No se encontró el ID de configuración.", variant: "destructive" });
           return;
       }
        try {
            // Asegurar empresa_id al guardar
            const dataToSave: LipooutUserInput<Configuracion> = {
                 ...data,
                 empresa_id: clinicConfig.empresa_id,
            };
            
            await updateClinicMutation.mutateAsync({ id: clinicConfig.$id, data: dataToSave });
            toast({ title: "Configuración de la clínica guardada" });
            refetchClinicConfig();
        } catch (err) {
            toast({ title: "Error al guardar", description: (err as Error).message, variant: "destructive" });
        }
  };

  // Manejador para subida de Logo y guardar Configuración
  const handleFileUploadAndSaveConfig = async (file: File) => {
    if (!clinicConfig?.$id) {
      toast({ title: "Error", description: "No se encontró el ID de configuración.", variant: "destructive" });
      return;
    }
    
    // Validar CONFIG_BUCKET_ID 
    if (!CONFIG_BUCKET_ID) {
        toast({ title: "Error", description: "CONFIG_BUCKET_ID no está definido. Revisa tus variables de entorno.", variant: "destructive" });
        return;
    }

    try {
      // 1. Subir el archivo de logo a Appwrite Storage
      toast({ title: "Subiendo Logo...", description: "Por favor, espera.", variant: "default" });
      const fileResult = await storage.createFile(CONFIG_BUCKET_ID, 'unique()', file);
      const newLogoUrl = fileResult.$id; 
      
      // 2. Crear objeto de actualización
      const updatedData: LipooutUserInput<Configuracion> = {
          // Incluir empresa_id al guardar
          empresa_id: clinicConfig.empresa_id,
          nombreClinica: String(clinicConfig.nombreClinica || '').trim(),
          cif: String(clinicConfig.cif || '').trim(),
          serieFactura: String(clinicConfig.serieFactura || '').trim(),
          seriePresupuesto: String(clinicConfig.seriePresupuesto || '').trim(),
          direccion: String(clinicConfig.direccion || '').trim(),
          emailContacto: String(clinicConfig.emailContacto || '').trim(),
          telefonoContacto: String(clinicConfig.telefonoContacto || '').trim(),
          logoText: String(clinicConfig.logoText || '').trim(),
          ultimoNumeroFactura: clinicConfig.ultimoNumeroFactura ?? 0,
          ultimoNumeroPresupuesto: clinicConfig.ultimoNumeroPresupuesto ?? 0,
          tipoIvaPredeterminado: clinicConfig.tipoIvaPredeterminado ?? 21,
          horarios: sanitizeHorarios(clinicConfig.horarios),
          logoUrl: newLogoUrl, 
      };

      // 3. Actualizar el documento de configuración con el nuevo logoUrl
      await updateClinicMutation.mutateAsync({ 
        id: clinicConfig.$id, 
        data: updatedData, 
      });
      
      // CORRECCIÓN 2322: Se cambia "success" a "default"
      toast({ title: "Logo y Configuración guardados", description: "El logo se ha subido y la URL se ha actualizado.", variant: "default" });
      refetchClinicConfig(); 
      
    } catch (error) {
      toast({ 
        title: "Error al subir/guardar el Logo", 
        description: (error as Error).message || "Ocurrió un error inesperado.", 
        variant: "destructive" 
      });
    }
  };
  
  // --- Resto de Handlers para Entidades (sin cambios) ---
  const handleNuevoEmpleado = () => {
    setEmpleadoEditing(null);
    setEmpleadoSheetOpen(true);
  };

  const handleEditarEmpleado = (empleado: Empleado) => {
    setEmpleadoEditing(empleado);
    setEmpleadoSheetOpen(true);
  };

  const handleSaveEmpleado = async (data: any) => {
    try {
      if (empleadoEditing) {
        await updateEmpleadoMutation.mutateAsync({ id: empleadoEditing.$id, data });
        toast({ title: "Empleado actualizado" });
      } else {
        await createEmpleadoMutation.mutateAsync(data);
        toast({ title: "Empleado creado" });
      }
      setEmpleadoSheetOpen(false);
    } catch (err) {
      toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
    }
  };

  const handleNuevoRecurso = () => {
    setRecursoEditing(null);
    setRecursoSheetOpen(true);
  };

  const handleEditarRecurso = (recurso: Recurso) => {
    setRecursoEditing(recurso);
    setRecursoSheetOpen(true);
  };

  const handleSaveRecurso = async (data: any) => {
    try {
      if (recursoEditing) {
        await updateRecursoMutation.mutateAsync({ id: recursoEditing.$id, data });
        toast({ title: "Recurso actualizado" });
      } else {
        await createRecursoMutation.mutateAsync(data);
        toast({ title: "Recurso creado" });
      }
      setRecursoSheetOpen(false);
    } catch (err) {
      toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
    }
  };

  const handleNuevoProveedor = () => {
    setProveedorEditing(null);
    setProveedorSheetOpen(true);
  };

  const handleEditarProveedor = (proveedor: Proveedor) => {
    setProveedorEditing(proveedor);
    setProveedorSheetOpen(true);
  };

  const handleSaveProveedor = async (data: any) => {
    try {
      if (proveedorEditing) {
        await updateProveedorMutation.mutateAsync({ id: proveedorEditing.$id, data });
        toast({ title: "Proveedor actualizado" });
      } else {
        await createProveedorMutation.mutateAsync(data);
        toast({ title: "Proveedor creado" });
      }
      setProveedorSheetOpen(false);
    } catch (err) {
      toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
    }
  };


  return (
    <div className="space-y-6">
       <div>
        <h1 className="text-3xl font-bold">Configuración</h1>
        <p className="text-muted-foreground">Ajustes generales del sistema.</p>
       </div>

      <Tabs defaultValue="empresas">
        {/* CORRECCIÓN: Se usa 'isAdmin' en los condicionales */}
        <TabsList className={`mb-4 flex flex-wrap w-full gap-1`}> 
          {/* NUEVA PESTAÑA EMPRESAS (Solo para Admin) */}
          {isAdmin && ( 
              <TabsTrigger value="empresas"><Briefcase className="w-4 h-4 mr-2"/> Empresas</TabsTrigger>
          )}
          
          <TabsTrigger value="clinica"><Settings className="w-4 h-4 mr-2"/> Clínica</TabsTrigger>
          <TabsTrigger value="waha"><Server className="w-4 h-4 mr-2"/> WAHA</TabsTrigger>
          <TabsTrigger value="importar"><Upload className="w-4 h-4 mr-2"/> Importar</TabsTrigger> 
          <TabsTrigger value="empleados"><Users className="w-4 h-4 mr-2"/> Empleados</TabsTrigger>
          <TabsTrigger value="recursos"><Package className="w-4 h-4 mr-2"/> Recursos</TabsTrigger>
          <TabsTrigger value="proveedores"><Building2 className="w-4 h-4 mr-2"/> Proveedores</TabsTrigger>
          <TabsTrigger value="familias"><PackageOpen className="w-4 h-4 mr-2"/> Familias</TabsTrigger>
          <TabsTrigger value="permisos"><Shield className="w-4 h-4 mr-2"/> Permisos</TabsTrigger>
        </TabsList>
        
        {/* --- Contenido Pestaña Empresas (NUEVO) --- */}
        {isAdmin && (
            <TabsContent value="empresas">
                <EmpresasTab />
            </TabsContent>
        )}

        {/* --- Contenido Pestaña Clínica (MODIFICADO para integrar Tema) --- */}
        <TabsContent value="clinica">
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Datos de la Empresa</CardTitle>
                        <CardDescription>Información general y configuración de facturación.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <ConfigurationForm
                            configInicial={clinicConfig}
                            isLoading={loadingClinicConfig}
                            isSubmitting={updateClinicMutation.isPending}
                            onSubmit={handleSaveClinicConfig}
                            onLogoUpload={handleFileUploadAndSaveConfig}
                       />
                    </CardContent>
                </Card>
                
                {/* NUEVO CARD TEMA - Integrado de la antigua pestaña Apariencia */}
                <Card>
                    <CardHeader>
                      <CardTitle>Tema</CardTitle>
                      <CardDescription>Ajusta el tema visual de la aplicación (Claro, Oscuro o Sistema).</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ThemeToggle /> {/* Componente de botones reducido */}
                    </CardContent>
                </Card>
            </div>
        </TabsContent>

        {/* --- Contenido Pestaña WAHA (sin cambios) --- */}
        <TabsContent value="waha">
           <Card>
                <CardHeader>
                    <CardTitle>Configuración WAHA</CardTitle>
                    <CardDescription>Define la conexión con tu instancia de WhatsApp HTTP API.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {loadingWahaConfig ? <LoadingSpinner /> : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="apiUrl">URL de la API</Label>
                                    <Input id="apiUrl" name="apiUrl" value={wahaSettings.apiUrl || ''} onChange={handleWahaChange} />
                                </div>
                                <div>
                                    <Label htmlFor="apiKey">API Key (Opcional)</Label>
                                    <Input id="apiKey" name="apiKey" type="password" value={wahaSettings.apiKey || ''} onChange={handleWahaChange} />
                                </div>
                                <div>
                                    <Label htmlFor="session">Nombre de Sesión</Label>
                                    <Input id="session" name="session" value={wahaSettings.session || ''} onChange={handleWahaChange} />
                                </div>
                            </div>
                             <Button onClick={handleSaveWahaConfig} disabled={isSavingWaha}>
                                {isSavingWaha ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />} Guardar
                             </Button>

                            <Separator className="my-6"/>

                             <div className="flex justify-between items-center">
                                <h3 className="text-lg font-medium">Estado de Sesiones WAHA</h3>
                                <Button variant="outline" onClick={fetchSessions} disabled={loadingSessions}>
                                    {loadingSessions ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null} Refrescar
                                </Button>
                             </div>
                             {loadingSessions ? <LoadingSpinner /> : (
                                sessions.length > 0 ? (
                                    <ul className="list-disc pl-5 space-y-1">
                                        {sessions.map(s => (
                                            <li key={s.name}>
                                                <span className="font-medium">{s.name}:</span>{' '}
                                                <Badge variant={s.status === 'STARTED' ? 'default' : 'outline'}>{s.status}</Badge>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-muted-foreground">No se encontraron sesiones o error al cargar.</p>
                                )
                             )}
                        </>
                    )}
                </CardContent>
            </Card>
        </TabsContent>

        {/* --- Contenido Pestaña Importar (MODIFICADO) --- */}
        <TabsContent value="importar"> 
          <div className="space-y-6">
            
            <Card>
              <CardHeader>
                <CardTitle>Subir Archivo CSV (Clientes + Migraciones)</CardTitle>
                <CardDescription>
                  Selecciona un archivo CSV. Al iniciar la importación, se procesarán los clientes y se activarán automáticamente las migraciones de backend necesarias (Búsqueda Unificada y Cliente en Citas).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input type="file" accept=".csv" onChange={handleFileChange} />
                {selectedFile && <p className="text-sm text-muted-foreground">Archivo seleccionado: {selectedFile.name}</p>}
                
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <Button onClick={handleFileUpload} disabled={!selectedFile || isUploading}>
                    {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                    {isUploading ? 'Subiendo e Iniciando...' : 'Iniciar Importación'}
                  </Button>
                  
                  {/* Botón para abrir el visor de Logs - Única ventana de logs */}
                  <Button variant="outline" onClick={() => { setLogSheetOpen(true); reloadLogs(); }}>
                    <FileText className="mr-2 h-4 w-4" />
                    Ver Historial de Logs
                  </Button>
                </div>
                
                <p className="text-xs text-muted-foreground">
                  Asegúrate de que el CSV tenga las columnas: `codcli`, `nomcli`, `ape1cli`, `email`, `dnicli`, `dircli`, `codposcli`, `pobcli`, `procli`, `tel1cli`, `tel2cli`, `fecnac` (YYYY-MM-DD), `enviar` (1 o 0), `sexo` (H/M/Otro), `fecalta` (YYYY-MM-DD).
                </p>
              </CardContent>
            </Card>
            
          </div>
        </TabsContent>

        {/* --- Contenido Pestaña Empleados (sin cambios) --- */}
        <TabsContent value="empleados">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Gestión de Empleados</CardTitle>
                <CardDescription>Administra los empleados de la clínica.</CardDescription>
              </div>
              <Button onClick={handleNuevoEmpleado}><Plus className="w-4 h-4 mr-2"/> Nuevo Empleado</Button>
            </CardHeader>
            <CardContent>
              {loadingEmpleados ? <LoadingSpinner /> : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {empleados && empleados.length > 0 ? empleados.map(emp => (
                      <TableRow key={emp.$id}>
                        <TableCell className="font-medium">{emp.nombre} {emp.apellidos}</TableCell>
                        <TableCell>{emp.email}</TableCell>
                        <TableCell>{emp.telefono}</TableCell>
                        <TableCell>
                          <Badge variant={emp.activo ? 'default' : 'secondary'}>
                            {emp.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => handleEditarEmpleado(emp)}><Pencil className="w-4 h-4"/></Button>
                          <Button variant="ghost" size="sm" onClick={() => {
                            if (confirm('¿Eliminar empleado?')) {
                              deleteEmpleadoMutation.mutate(emp.$id);
                            }
                          }}><Trash2 className="w-4 h-4"/></Button>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">No hay empleados registrados.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- Contenido Pestaña Recursos (sin cambios) --- */}
        <TabsContent value="recursos">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Gestión de Recursos</CardTitle>
                <CardDescription>Administra salas, camillas y equipamiento.</CardDescription>
              </div>
              <Button onClick={handleNuevoRecurso}><Plus className="w-4 h-4 mr-2"/> Nuevo Recurso</Button>
            </CardHeader>
            <CardContent>
              {loadingRecursos ? <LoadingSpinner /> : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recursos && recursos.length > 0 ? recursos.map(rec => (
                      <TableRow key={rec.$id}>
                        <TableCell className="font-medium">{rec.nombre}</TableCell>
                        <TableCell><Badge variant="outline">{rec.tipo}</Badge></TableCell>
                        <TableCell className="max-w-[200px] truncate">{rec.descripcion || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={rec.activo ? 'default' : 'secondary'}>
                            {rec.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => handleEditarRecurso(rec)}><Pencil className="w-4 h-4"/></Button>
                          <Button variant="ghost" size="sm" onClick={() => {
                            if (confirm('¿Eliminar recurso?')) {
                              deleteRecursoMutation.mutate(rec.$id);
                            }
                          }}><Trash2 className="w-4 h-4"/></Button>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">No hay recursos registrados.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- Contenido Pestaña Proveedores (sin cambios) --- */}
        <TabsContent value="proveedores">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Gestión de Proveedores</CardTitle>
                <CardDescription>Administra los proveedores de la clínica.</CardDescription>
              </div>
              <Button onClick={handleNuevoProveedor}><Plus className="w-4 h-4 mr-2"/> Nuevo Proveedor</Button>
            </CardHeader>
            <CardContent>
              {loadingProveedores ? <LoadingSpinner /> : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>CIF</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {proveedores && proveedores.length > 0 ? proveedores.map(prov => (
                      <TableRow key={prov.$id}>
                        <TableCell className="font-medium">{prov.nombre}</TableCell>
                        <TableCell>{prov.cif || '-'}</TableCell>
                        <TableCell>{prov.telefono || '-'}</TableCell>
                        <TableCell>{prov.email || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={prov.activo ? 'default' : 'secondary'}>
                            {prov.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => handleEditarProveedor(prov)}><Pencil className="w-4 h-4"/></Button>
                          <Button variant="ghost" size="sm" onClick={() => {
                            if (confirm('¿Eliminar proveedor?')) {
                              deleteProveedorMutation.mutate(prov.$id);
                            }
                          }}><Trash2 className="w-4 h-4"/></Button>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">No hay proveedores registrados.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- Contenido Pestaña Familias (sin cambios) --- */}
        <TabsContent value="familias">
          <FamiliasTab />
        </TabsContent>

        {/* --- Contenido Pestaña Permisos (sin cambios) --- */}
        <TabsContent value="permisos">
          <PermisosTab />
        </TabsContent>
      </Tabs>

      {/* --- Sheets para Gestión de Entidades (sin cambios) --- */}
      <Sheet open={empleadoSheetOpen} onOpenChange={setEmpleadoSheetOpen}>
        <SheetContent className="sm:max-w-[600px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{empleadoEditing ? 'Editar Empleado' : 'Nuevo Empleado'}</SheetTitle>
          </SheetHeader>
          <EmpleadoForm
            empleadoInicial={empleadoEditing || undefined}
            onSubmit={handleSaveEmpleado}
            isSubmitting={createEmpleadoMutation.isPending || updateEmpleadoMutation.isPending}
          />
        </SheetContent>
      </Sheet>

      <Sheet open={recursoSheetOpen} onOpenChange={setRecursoSheetOpen}>
        <SheetContent className="sm:max-w-[600px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{recursoEditing ? 'Editar Recurso' : 'Nuevo Recurso'}</SheetTitle>
          </SheetHeader>
          <RecursoForm
            recursoInicial={recursoEditing || undefined}
            onSubmit={handleSaveRecurso}
            isSubmitting={createRecursoMutation.isPending || updateRecursoMutation.isPending}
          />
        </SheetContent>
      </Sheet>

      <Sheet open={proveedorSheetOpen} onOpenChange={setProveedorSheetOpen}>
        <SheetContent className="sm:max-w-[600px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{proveedorEditing ? 'Editar Proveedor' : 'Nuevo Proveedor'}</SheetTitle>
          </SheetHeader>
          <ProveedorForm
            proveedorInicial={proveedorEditing || undefined}
            onSubmit={handleSaveProveedor}
            isSubmitting={createProveedorMutation.isPending || updateProveedorMutation.isPending}
          />
        </SheetContent>
      </Sheet>
      
      {/* --- Sheet para Visor de Logs de Importación (Listado de Logs) --- */}
      <Sheet open={logSheetOpen} onOpenChange={setLogSheetOpen}>
        <SheetContent className="sm:max-w-[700px] w-full flex flex-col">
          <SheetHeader>
            <SheetTitle>Historial de Logs de Importación</SheetTitle>
            <div className="text-sm text-muted-foreground">
                Últimas importaciones de clientes y estado de las migraciones asociadas.
            </div>
          </SheetHeader>
          <div className="space-y-4 pt-4 flex-1 overflow-hidden">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={reloadLogs} disabled={loadingLogs}>
                {loadingLogs ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <RefreshCw className="h-4 w-4 mr-2"/>} Refrescar Logs
              </Button>
            </div>
            
            {/* Tabla de Logs de Importación (Listado) */}
            <ScrollArea className="h-[calc(100vh-250px)] rounded-md border">
              {loadingLogs ? (
                <div className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Cargando logs...</p>
                </div>
              ) : importLogs && importLogs.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Archivo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Resultado</TableHead>
                      <TableHead className="text-right">Detalles</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importLogs.map(log => {
                      let fechaFormateada = '-';
                      const fecha = log.timestamp ? new Date(log.timestamp) : null;
                      if (fecha && !isNaN(fecha.getTime())) {
                          fechaFormateada = format(fecha, 'dd/MM/yy HH:mm', { locale: es });
                      }
                      
                      const isError = log.status === 'failed' || log.status === 'completed_with_errors';

                      return (
                      <TableRow key={log.$id} className={isError ? 'bg-red-50/50 dark:bg-red-950/20' : ''}>
                        <TableCell className="text-xs">{fechaFormateada}</TableCell>
                        <TableCell className="truncate max-w-[100px] text-xs">{log.filename}</TableCell>
                        <TableCell>
                          <Badge variant={log.status === 'completed' ? 'default' : log.status === 'completed_with_errors' ? 'secondary' : 'destructive'} className='text-xs'>
                            {log.status === 'completed' ? 'OK' : log.status === 'completed_with_errors' ? 'Con Errores' : 'Fallido'}
                          </Badge>
                        </TableCell>
                        <TableCell className='text-xs'>
                          {log.successful_rows || 0}/{log.totalProcessed || 0}
                          {(log.failed_rows || 0) > 0 && <span className="text-destructive"> ({(log.failed_rows || 0)} err.)</span>}
                        </TableCell>
                        <TableCell className="text-right">
                           <Button variant="ghost" size="sm" onClick={() => handleViewLogDetail(log)} disabled={!log.error_message}>
                             <FileText className="w-4 h-4"/>
                           </Button>
                        </TableCell>
                      </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                    No hay logs de importación.
                </div>
              )}
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>
      
      {/* --- Sheet para Detalle del Log (Pop-up para log.error_message) --- */}
      <Sheet open={!!selectedLogDetail} onOpenChange={(open) => !open && setSelectedLogDetail(null)}>
        <SheetContent className="sm:max-w-[700px] w-full flex flex-col">
          <SheetHeader>
            <SheetTitle>
                Detalles del Log
                <span className={`ml-2 text-sm font-normal text-muted-foreground`}>
                    {selectedLogDetail?.filename}
                </span>
            </SheetTitle>
            <Button 
                variant="ghost" 
                size="sm" 
                className="absolute right-4 top-4"
                onClick={() => setSelectedLogDetail(null)}
            >
                <X className="w-4 h-4"/>
            </Button>
            <div className="text-sm text-muted-foreground">
                 Clientes procesados: <span className="font-semibold">{selectedLogDetail?.totalProcessed || 0}</span>. 
                 Fallos: <span className={(selectedLogDetail?.failed_rows || 0) > 0 ? 'text-destructive font-semibold' : 'font-semibold'}>{selectedLogDetail?.failed_rows || 0}</span>.
            </div>
          </SheetHeader>
          <div className="flex-1 overflow-hidden pt-4">
            <h3 className="text-lg font-semibold mb-2">Mensaje Detallado (Cliente por Cliente)</h3>
            <ScrollArea className="h-full max-h-[calc(100vh-200px)] rounded-md border p-4 bg-muted/50 font-mono text-xs">
              <pre className="whitespace-pre-wrap">
                {selectedLogDetail?.error_message || "No hay mensajes de error o detalle para este log."}
              </pre>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Configuracion;