import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Loader2, Database, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
import { migrateSearchUnified } from '@/scripts/migrate-search-unified';
import { migrateCitasClienteNombre } from '@/scripts/migrate-citas-cliente-nombre';

export const MigrationSection = () => {
  // Estados para migración de clientes (search_unified)
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{ updated: number; errors: number } | null>(null);
  
  // Estados para migración de citas (cliente_nombre)
  const [isRunningCitas, setIsRunningCitas] = useState(false);
  const [progressCitas, setProgressCitas] = useState(0);
  const [logsCitas, setLogsCitas] = useState<string[]>([]);
  const [completedCitas, setCompletedCitas] = useState(false);
  const [errorCitas, setErrorCitas] = useState<string | null>(null);
  const [statsCitas, setStatsCitas] = useState<{ updated: number; errors: number } | null>(null);

  const handleRunMigration = async () => {
    setIsRunning(true);
    setProgress(0);
    setLogs([]);
    setCompleted(false);
    setError(null);
    setStats(null);

    try {
      // Interceptar console.log para mostrar logs en la UI
      const originalLog = console.log;
      console.log = (...args: any[]) => {
        originalLog(...args);
        setLogs(prev => [...prev, args.join(' ')]);
      };

      const result = await migrateSearchUnified((current, total) => {
        // Actualizar progreso
        const percentage = Math.round((current / total) * 100);
        setProgress(percentage);
      });
      
      // Restaurar console.log
      console.log = originalLog;
      
      setCompleted(true);
      setProgress(100);
      setStats({ updated: result.totalUpdated, errors: result.totalErrors });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsRunning(false);
    }
  };

  // 🆕 Handler para migración de citas
  const handleRunCitasMigration = async () => {
    setIsRunningCitas(true);
    setProgressCitas(0);
    setLogsCitas([]);
    setCompletedCitas(false);
    setErrorCitas(null);
    setStatsCitas(null);

    try {
      // Interceptar console.log para mostrar logs en la UI
      const originalLog = console.log;
      console.log = (...args: any[]) => {
        originalLog(...args);
        setLogsCitas(prev => [...prev, args.join(' ')]);
      };

      const result = await migrateCitasClienteNombre((current, total) => {
        // Actualizar progreso
        const percentage = Math.round((current / total) * 100);
        setProgressCitas(percentage);
      });
      
      // Restaurar console.log
      console.log = originalLog;
      
      setCompletedCitas(true);
      setProgressCitas(100);
      setStatsCitas({ updated: result.totalUpdated, errors: result.totalErrors });
    } catch (err) {
      setErrorCitas((err as Error).message);
    } finally {
      setIsRunningCitas(false);
    }
  };

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Migración de Búsqueda Unificada
        </CardTitle>
        <CardDescription>
          Poblar el campo <code className="text-xs bg-muted px-1 py-0.5 rounded">search_unified</code> en todos los clientes existentes para mejorar la búsqueda.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!completed && !error && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Importante:</strong> Asegúrate de haber ejecutado el script PowerShell{' '}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">update_clients_search_unified.ps1</code>{' '}
              antes de ejecutar esta migración.
            </AlertDescription>
          </Alert>
        )}

        <Button 
          onClick={handleRunMigration} 
          disabled={isRunning || completed}
          className="w-full"
        >
          {isRunning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Migrando... {progress}%
            </>
          ) : completed ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Migración Completada
            </>
          ) : (
            <>
              <Database className="mr-2 h-4 w-4" />
              Iniciar Migración
            </>
          )}
        </Button>

        {isRunning && (
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-center text-muted-foreground">{progress}% completado</p>
          </div>
        )}

        {logs.length > 0 && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <h4 className="text-sm font-semibold mb-2">Logs de Migración:</h4>
            <div className="space-y-1 max-h-64 overflow-y-auto font-mono text-xs">
              {logs.map((log, i) => (
                <div key={i} className="text-muted-foreground">{log}</div>
              ))}
            </div>
          </div>
        )}

        {completed && stats && (
          <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              <strong>¡Migración completada!</strong>
              <div className="mt-1 text-sm">
                • Clientes actualizados: {stats.updated}
                {stats.errors > 0 && <div className="text-yellow-700 dark:text-yellow-400">• Errores: {stats.errors}</div>}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Error:</strong> {error}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>

    {/* 🆕 Card para migración de cliente_nombre en citas */}
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Migración de Nombre de Cliente en Citas
        </CardTitle>
        <CardDescription>
          Poblar el campo <code className="text-xs bg-muted px-1 py-0.5 rounded">cliente_nombre</code> en todas las citas existentes para mejorar el rendimiento.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!completedCitas && !errorCitas && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Importante:</strong> Asegúrate de haber ejecutado el script PowerShell{' '}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">update_citas_add_cliente_nombre.ps1</code>{' '}
              antes de ejecutar esta migración.
            </AlertDescription>
          </Alert>
        )}

        <Button 
          onClick={handleRunCitasMigration} 
          disabled={isRunningCitas || completedCitas}
          className="w-full"
        >
          {isRunningCitas ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Migrando Citas... {progressCitas}%
            </>
          ) : completedCitas ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Migración de Citas Completada
            </>
          ) : (
            <>
              <Calendar className="mr-2 h-4 w-4" />
              Iniciar Migración de Citas
            </>
          )}
        </Button>

        {isRunningCitas && (
          <div className="space-y-2">
            <Progress value={progressCitas} className="w-full" />
            <p className="text-sm text-center text-muted-foreground">{progressCitas}% completado</p>
          </div>
        )}

        {logsCitas.length > 0 && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <h4 className="text-sm font-semibold mb-2">Logs de Migración:</h4>
            <div className="space-y-1 max-h-64 overflow-y-auto font-mono text-xs">
              {logsCitas.map((log, i) => (
                <div key={i} className="text-muted-foreground">{log}</div>
              ))}
            </div>
          </div>
        )}

        {completedCitas && statsCitas && (
          <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              <strong>¡Migración de citas completada!</strong>
              <div className="mt-1 text-sm">
                • Citas actualizadas: {statsCitas.updated}
                {statsCitas.errors > 0 && <div className="text-yellow-700 dark:text-yellow-400">• Errores: {statsCitas.errors}</div>}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {errorCitas && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Error:</strong> {errorCitas}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
    </>
  );
};
